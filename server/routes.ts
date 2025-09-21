import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchHistorySchema, insertFavoriteSchema, type SearchResult, type ImageSource } from "@shared/schema";
import { imageSearchService } from "./services/imageSearch";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search multiple image sources
  app.get("/api/search", async (req, res) => {
    try {
      const { 
        q: query, 
        licenses = "cc0,cc-by,cc-by-sa", 
        sources = "wikimedia,pixabay,unsplash,pexels",
        limit = 20, 
        offset = 0 
      } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const licensesArray = (licenses as string).split(",");
      const sourcesArray = (sources as string).split(",") as ImageSource[];
      
      console.log(`Multi-source search: "${query}" from [${sourcesArray.join(', ')}] with licenses [${licensesArray.join(', ')}]`);

      const results = await imageSearchService.searchMultipleSources(
        query as string,
        licensesArray,
        sourcesArray,
        parseInt(limit as string) || 20
      );

      console.log(`Found ${results.length} total results from ${sourcesArray.length} sources`);

      res.json({
        results,
        total: results.length,
        query: query as string,
        sources: sourcesArray,
      });

    } catch (error) {
      console.error("Multi-source search error:", error);
      res.status(500).json({ error: "Failed to search images" });
    }
  });

  // Add search to history
  app.post("/api/search-history", async (req, res) => {
    try {
      const validatedData = insertSearchHistorySchema.parse(req.body);
      const searchHistory = await storage.addSearchHistory(validatedData);
      res.json(searchHistory);
    } catch (error) {
      console.error("Add search history error:", error);
      res.status(500).json({ error: "Failed to add search history" });
    }
  });

  // Get search history
  app.get("/api/search-history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const history = await storage.getSearchHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Get search history error:", error);
      res.status(500).json({ error: "Failed to get search history" });
    }
  });

  // Add favorite
  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addFavorite(validatedData);
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  // Get favorites
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  // Remove favorite
  app.delete("/api/favorites/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFavorite(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Check if image is favorite
  app.get("/api/favorites/:userId/check", async (req, res) => {
    try {
      const { userId } = req.params;
      const { imageUrl } = req.query;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl parameter is required" });
      }

      const isFavorite = await storage.isFavorite(userId, imageUrl as string);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
