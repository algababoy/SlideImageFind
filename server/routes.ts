import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchHistorySchema, insertFavoriteSchema } from "@shared/schema";
import axios from "axios";

interface WikimediaSearchResult {
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
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search Wikimedia Commons images
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, licenses = "cc0,cc-by,cc-by-sa", limit = 20, offset = 0 } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const licensesArray = (licenses as string).split(",");
      const params = {
        action: "query",
        format: "json",
        generator: "search",
        gsrsearch: query as string,
        gsrlimit: limit,
        gsroffset: offset,
        prop: "imageinfo",
        iiprop: "url|extmetadata|size",
        iiurlwidth: "1200",
        origin: "*"
      };

      const response = await axios.get("https://commons.wikimedia.org/w/api.php", { params });
      const data = response.data;

      const results: WikimediaSearchResult[] = [];
      const pages = (data.query || {}).pages || {};

      for (const pageId in pages) {
        const page = pages[pageId];
        const imageInfo = (page.imageinfo || [])[0];
        
        if (!imageInfo) continue;

        const metadata = imageInfo.extmetadata || {};
        const licenseShortName = metadata.LicenseShortName?.value || "";
        const licenseUrl = metadata.LicenseUrl?.value || "";
        const artist = metadata.Artist?.value || "";
        const credit = metadata.Credit?.value || "";
        
        // Filter by license
        const licenseMatch = licensesArray.some(license => 
          licenseShortName.toLowerCase().includes(license.toLowerCase())
        );
        
        if (!licenseMatch && licensesArray.length > 0) continue;

        // Generate attribution text
        let attribution = "";
        if (licenseShortName.toLowerCase().includes("cc0")) {
          attribution = `"${page.title.replace("File:", "")}" is licensed under CC0 (Public Domain)`;
        } else {
          attribution = `"${page.title.replace("File:", "")}" by ${artist || "Unknown"} is licensed under ${licenseShortName}`;
        }

        results.push({
          title: page.title.replace("File:", ""),
          imageUrl: imageInfo.url,
          thumbnailUrl: imageInfo.thumburl,
          author: artist,
          license: licenseShortName,
          licenseUrl: licenseUrl,
          sourceUrl: `https://commons.wikimedia.org/wiki/${page.title.replace(/ /g, "_")}`,
          attribution: attribution,
          dimensions: imageInfo.width && imageInfo.height ? `${imageInfo.width} × ${imageInfo.height}` : undefined,
          fileSize: imageInfo.size ? `${(imageInfo.size / 1024 / 1024).toFixed(1)} MB` : undefined,
        });
      }

      res.json({
        results,
        total: results.length,
        query: query as string,
      });

    } catch (error) {
      console.error("Search error:", error);
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
