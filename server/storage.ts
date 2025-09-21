import { searchResults, searchQueries, users, type User, type InsertUser, type SearchResult, type InsertSearchResult, type SearchQuery, type InsertSearchQuery } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search Results
  createSearchResult(result: InsertSearchResult): Promise<SearchResult>;
  getSearchResults(limit?: number, offset?: number): Promise<SearchResult[]>;
  searchSimilarResults(query: string, limit?: number): Promise<SearchResult[]>;
  incrementViews(id: string): Promise<void>;
  incrementSaves(id: string): Promise<void>;
  
  // Search Queries
  createOrUpdateSearchQuery(query: InsertSearchQuery): Promise<SearchQuery>;
  getPopularSearches(limit?: number): Promise<SearchQuery[]>;
  getRelatedSearches(query: string, limit?: number): Promise<SearchQuery[]>;
  
  // Statistics
  getStats(): Promise<{totalResults: number, thisWeek: number, contributors: number, searchesToday: number}>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    // Generate preview from description or query
    const preview = result.description 
      ? result.description.substring(0, 200) + (result.description.length > 200 ? "..." : "")
      : result.query.substring(0, 100) + (result.query.length > 100 ? "..." : "");

    const [searchResult] = await db
      .insert(searchResults)
      .values({
        ...result,
        preview,
      })
      .returning();
    return searchResult;
  }

  async getSearchResults(limit = 20, offset = 0): Promise<SearchResult[]> {
    return await db
      .select()
      .from(searchResults)
      .orderBy(desc(searchResults.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchSimilarResults(query: string, limit = 20): Promise<SearchResult[]> {
    // Clean the search query
    const cleanQuery = query.trim();
    
    if (!cleanQuery) {
      // Fallback to recent results if no valid search terms
      return await this.getSearchResults(limit);
    }

    console.log(`🔍 Intent-based search for: "${cleanQuery}"`);

    // Strict intent-based search using only standard PostgreSQL full-text search
    return await db
      .select({
        id: searchResults.id,
        query: searchResults.query,
        publicLink: searchResults.publicLink,
        platform: searchResults.platform,
        description: searchResults.description,
        preview: searchResults.preview,
        submittedBy: searchResults.submittedBy,
        createdAt: searchResults.createdAt,
        views: searchResults.views,
        saves: searchResults.saves,
      })
      .from(searchResults)
      .where(
        sql`
          -- Gate 1: Overall content must match (any field)
          (
            setweight(to_tsvector('english', coalesce(${searchResults.query}, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(${searchResults.description}, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(${searchResults.platform}, '')), 'C')
          ) @@ websearch_to_tsquery('english', ${cleanQuery})
          
          AND
          
          -- Gate 2: Title/subject intent must match (strict phrase matching)
          to_tsvector('english', coalesce(${searchResults.query}, '')) @@ phraseto_tsquery('english', ${cleanQuery})
        `
      )
      .orderBy(
        // Primary sort by intent-based relevance score (full-text search only)
        sql`
          ts_rank_cd(
            setweight(to_tsvector('english', coalesce(${searchResults.query}, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(${searchResults.description}, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(${searchResults.platform}, '')), 'C'),
            websearch_to_tsquery('english', ${cleanQuery}),
            1|4
          )
        DESC`,
        // Secondary sort by popularity and recency
        desc(searchResults.views),
        desc(searchResults.saves),
        desc(searchResults.createdAt)
      )
      .limit(limit);
  }

  async incrementViews(id: string): Promise<void> {
    await db
      .update(searchResults)
      .set({ views: sql`${searchResults.views} + 1` })
      .where(eq(searchResults.id, id));
  }

  async incrementSaves(id: string): Promise<void> {
    await db
      .update(searchResults)
      .set({ saves: sql`${searchResults.saves} + 1` })
      .where(eq(searchResults.id, id));
  }

  async createOrUpdateSearchQuery(queryData: InsertSearchQuery): Promise<SearchQuery> {
    // Check if query exists
    const [existing] = await db
      .select()
      .from(searchQueries)
      .where(eq(searchQueries.query, queryData.query));

    if (existing) {
      // Update existing query
      const [updated] = await db
        .update(searchQueries)
        .set({
          resultCount: sql`${searchQueries.resultCount} + 1`,
          lastSearched: new Date(),
        })
        .where(eq(searchQueries.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new query
      const [newQuery] = await db
        .insert(searchQueries)
        .values({
          ...queryData,
          resultCount: 1,
          lastSearched: new Date(),
        })
        .returning();
      return newQuery;
    }
  }

  async getPopularSearches(limit = 10): Promise<SearchQuery[]> {
    return await db
      .select()
      .from(searchQueries)
      .orderBy(desc(searchQueries.resultCount))
      .limit(limit);
  }

  async getRelatedSearches(query: string, limit = 5): Promise<SearchQuery[]> {
    const tsquery = query.trim().split(/\s+/).map(word => word.replace(/[^\w]/g, '')).filter(word => word.length > 0).join(' & ');
    
    if (!tsquery) {
      return [];
    }

    // Use advanced text similarity with PostgreSQL full-text search
    return await db
      .select({
        id: searchQueries.id,
        query: searchQueries.query,
        resultCount: searchQueries.resultCount,
        lastSearched: searchQueries.lastSearched,
        // Calculate similarity score
        similarity: sql<number>`ts_rank_cd(
          to_tsvector('english', ${searchQueries.query}),
          plainto_tsquery('english', ${tsquery})
        )`.as('similarity')
      })
      .from(searchQueries)
      .where(
        sql`to_tsvector('english', ${searchQueries.query}) @@ plainto_tsquery('english', ${tsquery})
        AND ${searchQueries.query} != ${query}`
      )
      .orderBy(
        // Sort by text similarity first, then by popularity
        sql`ts_rank_cd(
          to_tsvector('english', ${searchQueries.query}),
          plainto_tsquery('english', ${tsquery})
        ) DESC`,
        desc(searchQueries.resultCount)
      )
      .limit(limit);
  }

  async getStats(): Promise<{totalResults: number, thisWeek: number, contributors: number, searchesToday: number}> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get total results count
    const [totalResultsRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(searchResults);
    
    // Get results from this week
    const [thisWeekRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(searchResults)
      .where(sql`${searchResults.createdAt} >= ${weekAgo}`);
    
    // Get unique contributors (submitted_by is not null)
    const [contributorsRow] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${searchResults.submittedBy})` })
      .from(searchResults)
      .where(sql`${searchResults.submittedBy} IS NOT NULL`);
    
    // Get searches today
    const [searchesTodayRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(searchQueries)
      .where(sql`${searchQueries.lastSearched} >= ${todayStart}`);
    
    return {
      totalResults: Number(totalResultsRow.count) || 0,
      thisWeek: Number(thisWeekRow.count) || 0,
      contributors: Number(contributorsRow.count) || 0,
      searchesToday: Number(searchesTodayRow.count) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
