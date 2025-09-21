import { type User, type InsertUser, type SearchHistory, type InsertSearchHistory, type Favorite, type InsertFavorite } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Search history methods
  getSearchHistory(userId: string): Promise<SearchHistory[]>;
  addSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
  
  // Favorites methods
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(id: string): Promise<void>;
  isFavorite(userId: string, imageUrl: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private searchHistory: Map<string, SearchHistory>;
  private favorites: Map<string, Favorite>;

  constructor() {
    this.users = new Map();
    this.searchHistory = new Map();
    this.favorites = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSearchHistory(userId: string): Promise<SearchHistory[]> {
    return Array.from(this.searchHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => new Date(b.searchedAt || 0).getTime() - new Date(a.searchedAt || 0).getTime());
  }

  async addSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = randomUUID();
    const searchHistory: SearchHistory = {
      ...insertSearchHistory,
      userId: insertSearchHistory.userId || null,
      id,
      searchedAt: new Date(),
    };
    this.searchHistory.set(id, searchHistory);
    return searchHistory;
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId)
      .sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      ...insertFavorite,
      userId: insertFavorite.userId || null,
      thumbnailUrl: insertFavorite.thumbnailUrl || null,
      author: insertFavorite.author || null,
      licenseUrl: insertFavorite.licenseUrl || null,
      dimensions: insertFavorite.dimensions || null,
      fileSize: insertFavorite.fileSize || null,
      id,
      addedAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(id: string): Promise<void> {
    this.favorites.delete(id);
  }

  async isFavorite(userId: string, imageUrl: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      favorite => favorite.userId === userId && favorite.imageUrl === imageUrl
    );
  }
}

export const storage = new MemStorage();
