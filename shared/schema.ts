import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const searchResults = pgTable("search_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  publicLink: text("public_link").notNull(),
  platform: text("platform").notNull(), // ChatGPT, Claude, Gemini, DeepSeek, Other
  description: text("description"),
  preview: text("preview"), // Auto-generated preview from description or query
  submittedBy: varchar("submitted_by"), // Optional user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  views: integer("views").default(0).notNull(),
  saves: integer("saves").default(0).notNull(),
});

export const searchQueries = pgTable("search_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  resultCount: integer("result_count").default(0).notNull(),
  lastSearched: timestamp("last_searched").defaultNow().notNull(),
});

export const searchResultsRelations = relations(searchResults, ({ one }) => ({
  submitter: one(users, {
    fields: [searchResults.submittedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSearchResultSchema = createInsertSchema(searchResults).pick({
  query: true,
  publicLink: true,
  platform: true,
  description: true,
}).extend({
  query: z.string().min(1, "Query is required"),
  publicLink: z.string().url("Valid URL is required"),
  platform: z.enum(["ChatGPT", "Claude", "Gemini", "DeepSeek", "Other"]),
  description: z.string().optional(),
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).pick({
  query: true,
}).extend({
  query: z.string().min(1, "Query is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
