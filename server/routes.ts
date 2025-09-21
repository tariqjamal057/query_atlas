import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchResultSchema, insertSearchQuerySchema } from "@shared/schema";
import { z } from "zod";
import archiver from "archiver";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get search results
  app.get("/api/search-results", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const results = await storage.getSearchResults(limit, offset);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch search results" });
    }
  });

  // Search for similar results
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      // Track the search query
      await storage.createOrUpdateSearchQuery({ query });

      const limit = parseInt(req.query.limit as string) || 20;
      const results = await storage.searchSimilarResults(query, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search results" });
    }
  });

  // Submit new search result
  app.post("/api/search-results", async (req, res) => {
    try {
      const validatedData = insertSearchResultSchema.parse(req.body);
      const result = await storage.createSearchResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create search result" });
    }
  });

  // Increment views for a search result
  app.post("/api/search-results/:id/views", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementViews(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment views" });
    }
  });

  // Increment saves for a search result
  app.post("/api/search-results/:id/saves", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementSaves(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment saves" });
    }
  });

  // Get related searches
  app.get("/api/related-searches", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const results = await storage.getRelatedSearches(query, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related searches" });
    }
  });

  // Get popular searches
  app.get("/api/popular-searches", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const results = await storage.getPopularSearches(limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // Get archive statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Download Chrome extension as ZIP
  app.get("/api/download-extension", async (req, res) => {
    try {
      const extensionDir = path.join(process.cwd(), "chrome-extension");
      
      // Check if extension directory exists
      if (!fs.existsSync(extensionDir)) {
        return res.status(404).json({ message: "Extension files not found" });
      }

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="llm-archive-extension.zip"');

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Handle archive errors
      archive.on('error', (err: archiver.ArchiverError) => {
        console.error('Archive error:', err);
        res.status(500).json({ message: "Failed to create extension package" });
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add all files from chrome-extension directory
      archive.directory(extensionDir, false);

      // Finalize the archive
      await archive.finalize();
      
    } catch (error) {
      console.error('Extension download error:', error);
      res.status(500).json({ message: "Failed to download extension" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
