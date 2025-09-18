import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Merged from format-dates.ts
export const formatDate = (
  date: Date | string | null | undefined,
  formatStr: string = "PP"
) => {
  if (!date) return null;
  return format(new Date(date), formatStr);
};

// Merged from format-string.ts
export function underscoreToSpace(string: string | null | undefined) {
  if (!string) return "";
  return string.replace(/_/g, " ");
}

// Merged from sanitize-string.ts
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return "";
  return input.replace(/\s|-/g, "").toLowerCase();
}

// used in array filtering
export function formatFilterSet<T extends string>(
  currentSet: T[],
  newItem: T
): T[] {
  if (newItem === "all") {
    return ["all" as T];
  }

  if (currentSet.includes(newItem)) {
    const filteredSet = currentSet.filter((p) => p !== newItem);
    return filteredSet.length === 0 ? ["all" as T] : filteredSet;
  }

  return [...currentSet.filter((p) => p !== "all"), newItem];
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Track in-progress requests
const inProgressRequests: Record<string, Promise<Response>> = {};

// Track rate limit windows
const rateLimitedUntil: Record<string, number> = {};

// Cache for response data
interface CachedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any; // Parsed response body
  text: string; // Raw response text
  timestamp: number;
}

const responseCache: Record<string, CachedResponse> = {};

/**
 * Safely fetch with built-in rate limiting, caching, and request deduplication
 * @param url The URL to fetch from
 * @param options Fetch options
 * @param cacheKey Optional cache key, defaults to URL
 * @returns Promise with the response
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  cacheKey = url
): Promise<Response> {
  // Check if we're rate limited for this endpoint
  const now = Date.now();
  const rateLimitExpiry = rateLimitedUntil[cacheKey] || 0;

  if (now < rateLimitExpiry) {
    const delayMs = rateLimitExpiry - now;
    console.log(
      `Rate limited for ${cacheKey}, waiting ${delayMs}ms before retrying`
    );
    // Wait until rate limit expires
    await new Promise((resolve) => setTimeout(resolve, delayMs + 100)); // Add 100ms buffer
  }

  // Check if this request is already cached (for quick repeat calls)
  if (
    responseCache[cacheKey] &&
    now - responseCache[cacheKey].timestamp < 2000
  ) {
    console.log(`Using cached response for ${cacheKey}`);

    // Create a new Response from the cached data
    const cachedData = responseCache[cacheKey];
    const headers = new Headers();

    // Add headers from cache
    Object.entries(cachedData.headers).forEach(([key, value]) => {
      headers.append(key, value);
    });

    // Create a fresh Response object from cached data
    return new Response(cachedData.text, {
      status: cachedData.status,
      statusText: cachedData.statusText,
      headers,
    });
  }

  // Check if there's already a request in progress for this cache key
  if (cacheKey in inProgressRequests) {
    console.log(
      `Request already in progress for ${cacheKey}, waiting for it to complete`
    );

    // Wait for the existing request to complete, then create a new Response from cached data
    await inProgressRequests[cacheKey];

    // Now the request should be in the cache
    if (responseCache[cacheKey]) {
      const cachedData = responseCache[cacheKey];
      const headers = new Headers();

      // Add headers from cache
      Object.entries(cachedData.headers).forEach(([key, value]) => {
        headers.append(key, value);
      });

      // Create a fresh Response object from cached data
      return new Response(cachedData.text, {
        status: cachedData.status,
        statusText: cachedData.statusText,
        headers,
      });
    }

    // This should rarely happen - fallback to a new request if cache missing
    console.warn(
      `Cache miss after waiting for in-progress request: ${cacheKey}`
    );
  }

  // Add cache busting and cache control headers
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
    },
  };

  // Create the fetch promise with retry logic
  const fetchWithRetry = async (
    retries = 3,
    backoff = 1000
  ): Promise<Response> => {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle rate limiting response
      if (response.status === 429) {
        // Get retry after header if available
        const retryAfter = response.headers.get("Retry-After");
        const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : backoff;

        if (retries > 0) {
          console.log(
            `Rate limit hit for ${cacheKey}, retry after ${retryMs}ms (${retries} retries left)`
          );

          // Set rate limit expiry
          rateLimitedUntil[cacheKey] = now + retryMs;

          // Wait for backoff period
          await new Promise((resolve) => setTimeout(resolve, retryMs));

          // Retry with exponential backoff
          return fetchWithRetry(retries - 1, backoff * 2);
        }
      }

      // For error status codes like 404, don't retry but provide better error details
      if (!response.ok && response.status !== 429) {
        console.log(
          `Request failed with status ${response.status}: ${response.statusText} for ${url}`
        );

        // For 404 errors, add specific information to help with debugging
        if (response.status === 404) {
          console.log(
            `Resource not found: ${url}. This is expected if the record doesn't exist yet.`
          );
        }

        // Don't try to retry client errors (4xx) other than rate limiting
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429 &&
          retries > 0
        ) {
          console.log(`Client error ${response.status}, not retrying`);
        }
        // Retry server errors (5xx) with backoff
        else if (response.status >= 500 && retries > 0) {
          console.log(
            `Server error ${response.status}, retrying in ${backoff}ms (${retries} retries left)`
          );

          // Wait for backoff period
          await new Promise((resolve) => setTimeout(resolve, backoff));

          // Retry with exponential backoff
          return fetchWithRetry(retries - 1, backoff * 2);
        }
      }

      // Important: Clone and cache the response data
      // This allows the response to be read by multiple consumers
      const clonedResponse = response.clone();

      // Store headers in a regular object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      try {
        // Get text content first (works for any response)
        const text = await clonedResponse.text();

        // Try to parse as JSON if possible
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // Not JSON, that's fine
          console.log(`Response for ${cacheKey} is not JSON`);
        }

        // Cache the response data for reuse
        responseCache[cacheKey] = {
          status: response.status,
          statusText: response.statusText,
          headers,
          data,
          text,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error(`Error caching response for ${cacheKey}:`, error);
      }

      return response.clone(); // Return a fresh clone for this caller
    } catch (error) {
      if (retries > 0) {
        console.log(
          `Fetch error for ${cacheKey}, retrying in ${backoff}ms:`,
          error
        );

        // Wait for backoff period
        await new Promise((resolve) => setTimeout(resolve, backoff));

        // Retry with exponential backoff
        return fetchWithRetry(retries - 1, backoff * 2);
      }
      throw error;
    }
  };

  // Create and track the request
  const requestPromise = fetchWithRetry().finally(() => {
    // Clean up when request is done
    delete inProgressRequests[cacheKey];
  });

  // Store the request
  inProgressRequests[cacheKey] = requestPromise;

  return requestPromise;
}

export function displayStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Draft",
    pending: "Pending",
    in_progress: "In Progress",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    archived: "Archived",
  };

  return statusMap[status] || status;
}

export const getUserInitials = (name: string | null): string => {
  if (!name) return "?";

  const nameParts = name.split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return (
    nameParts[0].charAt(0).toUpperCase() +
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  );
};
