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
    // Simple text similarity using ILIKE - in production, consider using full-text search
    return await db
      .select()
      .from(searchResults)
      .where(
        sql`${searchResults.query} ILIKE ${`%${query}%`} OR ${searchResults.description} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(searchResults.views), desc(searchResults.createdAt))
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
    return await db
      .select()
      .from(searchQueries)
      .where(
        sql`${searchQueries.query} ILIKE ${`%${query}%`} AND ${searchQueries.query} != ${query}`
      )
      .orderBy(desc(searchQueries.resultCount))
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
