import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  filters: json("filters").$type<{
    licenses: string[];
    sources: ImageSource[];
    size: string;
    fileTypes: string[];
  }>(),
  resultCount: text("result_count"),
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  imageTitle: text("image_title").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  author: text("author"),
  license: text("license").notNull(),
  licenseUrl: text("license_url"),
  sourceUrl: text("source_url").notNull(),
  attribution: text("attribution").notNull(),
  dimensions: text("dimensions"),
  fileSize: text("file_size"),
  source: text("source").$type<ImageSource>().notNull().default('wikimedia'),
  sourceMetadata: json("source_metadata"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  searchedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  addedAt: true,
});

// Image sources enum
export type ImageSource = 'wikimedia' | 'pixabay' | 'unsplash' | 'pexels' | 'openclipart';

// Unified SearchResult interface for all image sources
export interface SearchResult {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  author?: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
  attribution: string;
  dimensions?: string;
  fileSize?: string;
  source: ImageSource;
  // Source-specific metadata
  sourceMetadata?: {
    // Pixabay
    tags?: string;
    downloads?: number;
    views?: number;
    // Unsplash
    photographerUrl?: string;
    unsplashUrl?: string;
    // Pexels
    avgColor?: string;
    // Common
    categories?: string[];
  };
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
