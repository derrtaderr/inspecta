import { v4 as uuidv4 } from 'uuid';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import config from '../config/config';

/**
 * Cache entry for a response
 */
interface ResponseCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Class to cache API responses
 */
export class ResponseCache {
  private static instance: ResponseCache;
  private cache: LRUCache<string, ResponseCacheEntry<any>>;
  private enabled: boolean;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.enabled = config.cache.responseCache.enabled;
    
    // Initialize LRU cache with configuration options
    this.cache = new LRUCache<string, ResponseCacheEntry<any>>({
      max: config.cache.responseCache.maxSize,
      ttl: config.cache.responseCache.ttl,
      updateAgeOnGet: true
    });
    
    console.log(`Response cache initialized with max size: ${this.cache.max}, TTL: ${config.cache.responseCache.ttl}ms`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }
  
  /**
   * Get a cached response
   * @param key Cache key or parameters to generate key
   * @returns The cached response or undefined if not in cache
   */
  public get<T>(key: string | Record<string, any>): T | undefined {
    if (!this.enabled) {
      return undefined;
    }
    
    const cacheKey = this.createKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      // Check if entry is expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(cacheKey);
        return undefined;
      }
      
      return entry.data as T;
    }
    
    return undefined;
  }
  
  /**
   * Store a response in the cache
   * @param key Cache key or parameters to generate key
   * @param data The data to cache
   * @param ttl Optional TTL override in milliseconds
   * @returns The cache key used
   */
  public set<T>(key: string | Record<string, any>, data: T, ttl?: number): string {
    if (!this.enabled) {
      return this.createKey(key);
    }
    
    const cacheKey = this.createKey(key);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || config.cache.responseCache.ttl);
    
    this.cache.set(cacheKey, {
      data,
      timestamp,
      expiresAt
    });
    
    return cacheKey;
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key or parameters to generate key
   */
  public remove(key: string | Record<string, any>): void {
    if (!this.enabled) {
      return;
    }
    
    const cacheKey = this.createKey(key);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key or parameters to generate key
   * @returns True if the key exists and is valid
   */
  public has(key: string | Record<string, any>): boolean {
    if (!this.enabled) {
      return false;
    }
    
    const cacheKey = this.createKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      return Date.now() <= entry.expiresAt;
    }
    
    return false;
  }
  
  /**
   * Execute a function with caching
   * @param key Cache key or parameters to generate key
   * @param fn Function to execute if cache miss
   * @param ttl Optional TTL override in milliseconds
   * @returns Result from cache or function execution
   */
  public async getOrExecute<T>(
    key: string | Record<string, any>,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // If caching is disabled, just execute the function
    if (!this.enabled) {
      return await fn();
    }
    
    // Check for cached result
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Cache miss, execute function
    const result = await fn();
    
    // Cache the result
    this.set(key, result, ttl);
    
    return result;
  }
  
  /**
   * Create a cache key from a string or object
   * @param key String key or object to generate key from
   * @returns A consistent cache key
   */
  private createKey(key: string | Record<string, any>): string {
    if (typeof key === 'string') {
      return key;
    }
    
    // For objects, create a deterministic JSON string
    const normalized = JSON.stringify(key, Object.keys(key).sort());
    
    // Create an MD5 hash of the normalized JSON string for a shorter key
    return crypto.createHash('md5').update(normalized).digest('hex');
  }
  
  /**
   * Clear all items from the cache
   */
  public clear(): void {
    this.cache.clear();
    console.log('Response cache cleared');
  }
  
  /**
   * Get the number of items in the cache
   */
  public getSize(): number {
    return this.cache.size;
  }
  
  /**
   * Enable or disable the cache
   * @param enabled Whether the cache should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Response cache ${enabled ? 'enabled' : 'disabled'}`);
  }
} 