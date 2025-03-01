import { Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import LRUCache from 'lru-cache';
import config from '../config/config';

/**
 * Cache entry for a page
 */
interface PageCacheEntry {
  page: Page;
  url: string;
  lastAccessed: number;
  browserId: string;
  pageId: string;
}

/**
 * Class to cache pages for frequently accessed URLs
 */
export class PageCache {
  private static instance: PageCache;
  private cache: LRUCache<string, PageCacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize LRU cache with configuration options
    this.cache = new LRUCache<string, PageCacheEntry>({
      max: config.cache?.maxPageCacheSize || 20, // Max number of cached pages
      // Set TTL to 5 minutes (configurable)
      ttl: config.cache?.pageCacheTTL || 5 * 60 * 1000,
      updateAgeOnGet: true, // Update TTL on cache hit
      // Custom dispose function to close pages when evicted from cache
      dispose: (entry: PageCacheEntry) => {
        console.log(`Closing cached page for URL: ${entry.url}`);
        try {
          entry.page.close().catch(err => {
            console.error(`Error closing cached page: ${err}`);
          });
        } catch (error) {
          console.error('Error in cache dispose function:', error);
        }
      }
    });

    // Start periodic cleanup to detect and remove stale pages
    this.cleanupInterval = setInterval(() => this.checkAndCleanupCache(), 60000);
    
    console.log(`Page cache initialized with max size: ${this.cache.max}`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PageCache {
    if (!PageCache.instance) {
      PageCache.instance = new PageCache();
    }
    return PageCache.instance;
  }
  
  /**
   * Add a page to the cache
   * @param url The URL associated with the page
   * @param page The Puppeteer page object
   * @param browserId The ID of the browser containing this page
   * @param pageId The ID of the page
   * @returns The cache key for the entry
   */
  public addPage(url: string, page: Page, browserId: string, pageId: string): string {
    try {
      // Create a normalized cache key
      const cacheKey = this.normalizeUrl(url);
      
      // Store the page in the cache
      this.cache.set(cacheKey, {
        page,
        url,
        lastAccessed: Date.now(),
        browserId,
        pageId
      });
      
      console.log(`Added page to cache: ${url}`);
      return cacheKey;
    } catch (error) {
      console.error(`Failed to add page to cache for URL ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a cached page for a URL
   * @param url The URL to get a cached page for
   * @returns The cached page entry or undefined if not in cache
   */
  public getPage(url: string): PageCacheEntry | undefined {
    const cacheKey = this.normalizeUrl(url);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      // Update the last accessed time
      entry.lastAccessed = Date.now();
      console.log(`Cache hit for URL: ${url}`);
    }
    
    return entry;
  }
  
  /**
   * Remove a page from the cache
   * @param url The URL of the page to remove
   */
  public removePage(url: string): void {
    const cacheKey = this.normalizeUrl(url);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Clear all pages from the cache
   */
  public clear(): void {
    this.cache.clear();
    console.log('Page cache cleared');
  }
  
  /**
   * Get the number of pages in the cache
   */
  public getSize(): number {
    return this.cache.size;
  }
  
  /**
   * Check and cleanup the cache for stale or invalid pages
   */
  private checkAndCleanupCache(): void {
    console.log(`Checking page cache (current size: ${this.cache.size})`);
    
    // The LRU cache handles TTL expirations automatically
    // This method can be extended with additional checks if needed
  }
  
  /**
   * Stop the cleanup interval when shutting down
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
  
  /**
   * Normalize a URL for use as a cache key
   * @param url The URL to normalize
   * @returns A normalized version of the URL for cache lookups
   */
  private normalizeUrl(url: string): string {
    try {
      // Parse the URL to handle different formats of the same URL
      const parsedUrl = new URL(url);
      
      // Remove trailing slashes and convert to lowercase for consistent keys
      let normalized = `${parsedUrl.origin}${parsedUrl.pathname}`.toLowerCase();
      normalized = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
      
      // Include query parameters in the cache key
      if (parsedUrl.search) {
        normalized += parsedUrl.search;
      }
      
      return normalized;
    } catch (error) {
      // If URL parsing fails, use the original URL as the key
      console.warn(`Failed to normalize URL ${url}:`, error);
      return url;
    }
  }
} 