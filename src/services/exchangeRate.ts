/**
 * Exchange Rate Service
 * Fetches and caches USD to MYR exchange rate from free APIs
 *
 * CORS Note: This service makes client-side API calls to free exchange rate APIs.
 * Both Frankfurter (api.frankfurter.app) and ExchangeRate-API (open.er-api.com)
 * explicitly support CORS and allow browser requests without API keys.
 *
 * If you need to deploy to a restricted environment or want server-side caching:
 * 1. Create a serverless function/edge function to proxy the requests
 * 2. Pre-fetch rates at build time and bundle them
 * 3. Use a paid API with server-side authentication
 *
 * Rate Limits:
 * - Frankfurter: No explicit limit (uses ECB data)
 * - ExchangeRate-API: 1,500 requests/month on free tier
 * - With 24-hour caching, this supports ~1,500 unique users/month
 */

// Default/fallback exchange rate (updated Jan 2026)
const FALLBACK_RATE = 4.47;

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Storage key for localStorage caching
const CACHE_KEY = 'usd-myr-exchange-rate';

interface CachedRate {
  rate: number;
  timestamp: number;
  source: string;
}

/**
 * Get cached exchange rate from localStorage
 */
function getCachedRate(): CachedRate | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedRate = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    // Return cached if still valid
    if (age < CACHE_DURATION_MS) {
      return data;
    }

    return null; // Expired
  } catch (e) {
    console.warn('Failed to read cached exchange rate:', e);
    return null;
  }
}

/**
 * Save exchange rate to localStorage cache
 */
function cacheRate(rate: number, source: string): void {
  try {
    const data: CachedRate = {
      rate,
      timestamp: Date.now(),
      source,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache exchange rate:', e);
  }
}

/**
 * Fetch exchange rate from Frankfurter API (free, no API key needed)
 * https://www.frankfurter.app/
 */
async function fetchFromFrankfurter(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=MYR',
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates?.MYR;

    if (typeof rate === 'number' && rate > 0) {
      return rate;
    }

    return null;
  } catch (e) {
    console.warn('Frankfurter API fetch failed:', e);
    return null;
  }
}

/**
 * Fetch exchange rate from ExchangeRate-API (free tier)
 * https://www.exchangerate-api.com/
 */
async function fetchFromExchangeRateApi(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`ExchangeRate-API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates?.MYR;

    if (typeof rate === 'number' && rate > 0) {
      return rate;
    }

    return null;
  } catch (e) {
    console.warn('ExchangeRate-API fetch failed:', e);
    return null;
  }
}

/**
 * Get current USD to MYR exchange rate
 * Returns cached value if available, otherwise fetches from API
 * Falls back to default rate if all fetches fail
 */
export async function getExchangeRate(): Promise<{
  rate: number;
  source: 'cache' | 'api' | 'fallback';
  age?: number;
}> {
  // Check cache first
  const cached = getCachedRate();
  if (cached) {
    return {
      rate: cached.rate,
      source: 'cache',
      age: Date.now() - cached.timestamp,
    };
  }

  // Try Frankfurter first (European Central Bank data)
  let rate = await fetchFromFrankfurter();
  if (rate) {
    cacheRate(rate, 'frankfurter');
    return { rate, source: 'api' };
  }

  // Fallback to ExchangeRate-API
  rate = await fetchFromExchangeRateApi();
  if (rate) {
    cacheRate(rate, 'exchangerate-api');
    return { rate, source: 'api' };
  }

  // All fetches failed, return fallback
  console.warn('All exchange rate APIs failed, using fallback rate');
  return { rate: FALLBACK_RATE, source: 'fallback' };
}

/**
 * Get exchange rate synchronously (for initial render)
 * Returns cached value or fallback - never blocks
 */
export function getExchangeRateSync(): number {
  const cached = getCachedRate();
  return cached?.rate ?? FALLBACK_RATE;
}

/**
 * Convert USD to MYR
 */
export function convertUsdToMyr(usd: number, rate?: number): number {
  const exchangeRate = rate ?? getExchangeRateSync();
  return usd * exchangeRate;
}

/**
 * Convert MYR to USD
 */
export function convertMyrToUsd(myr: number, rate?: number): number {
  const exchangeRate = rate ?? getExchangeRateSync();
  return myr / exchangeRate;
}

/**
 * Force refresh the exchange rate (bypass cache)
 */
export async function refreshExchangeRate(): Promise<number> {
  // Clear cache
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }

  const result = await getExchangeRate();
  return result.rate;
}

/**
 * Get the fallback rate constant
 */
export function getFallbackRate(): number {
  return FALLBACK_RATE;
}

/**
 * Check if the cached rate is stale (older than half the cache duration)
 * Useful for showing "rate may be outdated" warnings
 */
export function isCacheStale(): boolean {
  const cached = getCachedRate();
  if (!cached) return true;

  const age = Date.now() - cached.timestamp;
  return age > CACHE_DURATION_MS / 2;
}

/**
 * Check if localStorage caching is available
 * Useful for detecting private browsing or storage disabled
 */
export function isCachingAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cache status information for debugging/display
 */
export function getCacheStatus(): {
  available: boolean;
  hasCachedRate: boolean;
  isStale: boolean;
  age: number | null;
  source: string | null;
} {
  const available = isCachingAvailable();
  const cached = getCachedRate();

  return {
    available,
    hasCachedRate: cached !== null,
    isStale: isCacheStale(),
    age: cached ? Date.now() - cached.timestamp : null,
    source: cached?.source ?? null,
  };
}
