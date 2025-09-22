import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSearchResultSchema, insertSearchQuerySchema } from "@shared/schema";
import { z } from "zod";
import archiver from "archiver";
import * as fs from "fs";
import * as path from "path";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Extend Request type for authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT Authentication middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication middleware (for endpoints that work with or without auth)
const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we don't reject the request
      req.user = null;
    }
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Google OAuth start endpoint
  app.get('/api/auth/google/start', (req, res) => {
    // Generate cryptographically secure state and PKCE verifier
    const state = crypto.randomBytes(32).toString('base64url');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    // Validate extension redirect URI to prevent open redirect attacks
    const extensionRedirect = req.query.extension_redirect as string;
    if (extensionRedirect) {
      // Only allow chrome-extension:// URLs to prevent token exfiltration
      if (!extensionRedirect.startsWith('chrome-extension://')) {
        return res.status(400).json({ error: 'Invalid redirect URI. Only Chrome extension URLs are allowed.' });
      }
      
      // Whitelist specific extension IDs for production security
      const ALLOWED_EXTENSION_IDS = process.env.ALLOWED_EXTENSION_IDS?.split(',') || [];
      if (ALLOWED_EXTENSION_IDS.length > 0) {
        const isAllowed = ALLOWED_EXTENSION_IDS.some(id => 
          extensionRedirect.startsWith(`chrome-extension://${id.trim()}/`)
        );
        if (!isAllowed) {
          return res.status(400).json({ error: 'Unauthorized extension ID' });
        }
      }
    }
    const serverCallbackUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    
    // Store state, code verifier (not challenge), and extension info in cookies (secure in production)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    res.cookie('oauth_verifier', codeVerifier, { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    if (extensionRedirect) {
      res.cookie('extension_redirect', extensionRedirect, { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    }
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: serverCallbackUri, // Always use server callback, not extension URL
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(authUrl);
  });
  
  // Google OAuth callback endpoint
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const storedState = req.cookies?.oauth_state;
      const codeVerifier = req.cookies?.oauth_verifier;
      const extensionRedirect = req.cookies?.extension_redirect;
      
      if (!code || !state || state !== storedState) {
        // Clear cookies on invalid callback
        res.clearCookie('oauth_state');
        res.clearCookie('oauth_verifier');
        res.clearCookie('extension_redirect');
        return res.status(400).send('Invalid OAuth callback');
      }
      
      if (!codeVerifier) {
        // Clear cookies if verifier is missing/expired
        res.clearCookie('oauth_state');
        res.clearCookie('oauth_verifier');
        res.clearCookie('extension_redirect');
        return res.status(400).send('OAuth session expired');
      }
      
      const serverCallbackUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: serverCallbackUri, // Must match what was sent to Google
          code_verifier: codeVerifier!
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }
      
      const tokens = await tokenResponse.json();
      
      // Get user info from Google
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }
      
      const googleUser = await userResponse.json();
      
      // Create or update user in our database
      let user = await storage.getUserByEmail(googleUser.email);
      
      if (!user) {
        // User doesn't exist, create new user
        user = await storage.createUser({
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          google_id: googleUser.id
        });
      }
      
      // Create JWT token
      const jwtToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email!, 
          name: user.name! 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );
      
      // Clear OAuth cookies
      res.clearCookie('oauth_state');
      res.clearCookie('oauth_verifier');
      res.clearCookie('extension_redirect');
      
      // Check if this is a Chrome extension callback (old flow)
      if (extensionRedirect) {
        // Validate redirect URI again (defense in depth)
        if (!extensionRedirect.startsWith('chrome-extension://')) {
          return res.status(400).json({ error: 'Invalid redirect URI' });
        }
        
        // Re-check extension ID allowlist if configured
        const ALLOWED_EXTENSION_IDS = process.env.ALLOWED_EXTENSION_IDS?.split(',') || [];
        if (ALLOWED_EXTENSION_IDS.length > 0) {
          const isAllowed = ALLOWED_EXTENSION_IDS.some(id => 
            extensionRedirect.startsWith(`chrome-extension://${id.trim()}/`)
          );
          if (!isAllowed) {
            return res.status(400).json({ error: 'Unauthorized extension ID' });
          }
        }
        // Chrome extension callback - redirect to extension with token in fragment
        return res.redirect(`${extensionRedirect}#token=${jwtToken}&expires=${Date.now() + 24*60*60*1000}`);
      }
      
      // For web app, redirect to success page with token in fragment
      res.redirect(`/?auth=success#token=${jwtToken}`);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  });
  
  // Get current user info
  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      });
    } catch (error) {
      res.status(404).json({ message: 'User not found' });
    }
  });
  

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    // Since we're using stateless JWT, logout is handled client-side
    // by removing the token. We just acknowledge the request.
    res.json({ message: 'Logged out successfully' });
  });
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

  // Submit new search result (authenticated users)
  app.post("/api/search-results", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertSearchResultSchema.parse(req.body);
      // Server-side attribution - ignore any client submittedBy input
      const result = await storage.createSearchResult(validatedData, req.user.userId);
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

  // Submit new search result (anonymous users)
  app.post("/api/search-results/anonymous", async (req, res) => {
    try {
      const validatedData = insertSearchResultSchema.parse(req.body);
      // Anonymous submission - no user attribution
      const result = await storage.createSearchResult(validatedData, undefined);
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
