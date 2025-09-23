import { searchResults, searchQueries, users, type User, type InsertUser, type SearchResult, type InsertSearchResult, type SearchQuery, type InsertSearchQuery } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search Results
  createSearchResult(result: InsertSearchResult, submittedBy?: string): Promise<SearchResult>;
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async createSearchResult(result: InsertSearchResult, submittedBy?: string): Promise<SearchResult> {
    // Generate preview from description or query
    const preview = result.description 
      ? result.description.substring(0, 200) + (result.description.length > 200 ? "..." : "")
      : result.query.substring(0, 100) + (result.query.length > 100 ? "..." : "");

    const [searchResult] = await db
      .insert(searchResults)
      .values({
        ...result,
        preview,
        submittedBy, // Server-side attribution, ignoring any client input
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
    try {
      // Clean the search query
      const cleanQuery = query.trim();
      
      if (!cleanQuery) {
        // Fallback to recent results if no valid search terms
        return await this.getSearchResults(limit);
      }

      console.log(`🔍 Searching for: "${cleanQuery}"`);

      // Enhanced search with intelligent keyword matching
      const searchWords = cleanQuery.toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^\w]/g, ''))
        .filter(word => word.length > 2);
      
      console.log('Search words:', searchWords);

      // Get all results for intelligent filtering
      const allResults = await db
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
        .from(searchResults);

      // Advanced semantic matching with 70% keyword threshold
      const scoredResults = allResults.map(result => {
        const combinedText = `${result.query} ${result.description || ''}`.toLowerCase();
        const resultWords = combinedText
          .split(/\s+/)
          .map(word => word.replace(/[^\w]/g, ''))
          .filter(word => word.length > 2);

        let score = 0;
        let matchedWords = 0;

        // Calculate keyword matching score
        for (const searchWord of searchWords) {
          let wordMatched = false;
          
          // Direct match
          if (resultWords.includes(searchWord)) {
            matchedWords++;
            score += 100;
            wordMatched = true;
          } else {
            // Partial/fuzzy matching for better recall
            for (const resultWord of resultWords) {
              // Check if words share significant similarity (70% threshold)
              const similarity = this.calculateWordSimilarity(searchWord, resultWord);
              if (similarity >= 0.7) {
                matchedWords++;
                score += 70 * similarity;
                wordMatched = true;
                break;
              }
              
              // Contains matching (one word contains the other)
              if (searchWord.length > 3 && resultWord.includes(searchWord)) {
                matchedWords++;
                score += 60;
                wordMatched = true;
                break;
              }
              if (resultWord.length > 3 && searchWord.includes(resultWord)) {
                matchedWords++;
                score += 60;
                wordMatched = true;
                break;
              }
            }
          }

          // Boost score for exact phrase matches
          if (combinedText.includes(cleanQuery.toLowerCase())) {
            score += 200;
          }
          
          // Boost for query title matches
          if (result.query.toLowerCase().includes(searchWord)) {
            score += 50;
          }
        }

        // Calculate keyword match percentage
        const keywordMatchPercentage = searchWords.length > 0 ? matchedWords / searchWords.length : 0;
        
        // Apply 70% keyword matching threshold
        if (keywordMatchPercentage >= 0.7) {
          score += 100; // Bonus for meeting 70% threshold
        }

        // Additional semantic bonuses
        if (keywordMatchPercentage === 1.0) {
          score += 150; // Perfect keyword match
        }

        // Engagement boost
        score += result.views * 2 + result.saves * 5;

        // Recency boost (newer results get slight preference)
        const daysSinceCreated = (Date.now() - new Date(result.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 7) {
          score += 10;
        }

        return {
          ...result,
          score,
          keywordMatchPercentage,
          matchedWords: matchedWords
        };
      });

      // Filter results that meet 70% keyword matching threshold
      const relevantResults = scoredResults.filter(result => {
        const combinedText = `${result.query} ${result.description || ''}`.toLowerCase();
        return result.keywordMatchPercentage >= 0.7 || // 70% keyword match threshold
               combinedText.includes(cleanQuery.toLowerCase()); // OR exact phrase match
      });

      // Sort by relevance score and return top results
      const finalResults = relevantResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, keywordMatchPercentage, matchedWords, ...result }) => result);

      console.log(`Found ${finalResults.length} relevant results (${relevantResults.length} total scored results)`);
      
      return finalResults;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to recent results on error
      return await this.getSearchResults(limit);
    }
  }

  // Helper function to calculate word similarity using Levenshtein distance
  private calculateWordSimilarity(word1: string, word2: string): number {
    const maxLength = Math.max(word1.length, word2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(word1, word2);
    return 1 - distance / maxLength;
  }

  // Levenshtein distance algorithm for fuzzy matching
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
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
