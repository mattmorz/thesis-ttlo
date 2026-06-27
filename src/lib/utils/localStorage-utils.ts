// Debounce and batch utilities for localStorage operations

// Debounce delay for write operations - increase to reduce frequency of updates
const DEBOUNCE_DELAY = 800; // ms to wait before executing (increased from 300ms)

// Map to track pending write operations
const pendingWrites = new Map<
  string,
  { value: string; timer: NodeJS.Timeout }
>();

// Cache previous values to avoid unnecessary writes
const previousValues = new Map<string, string>();

// Track tab changes to avoid unnecessary writes during navigation
let isTabChanging = false;
const TAB_CHANGE_COOLDOWN = 1000; // 1 second cooldown after tab changes

const APP_SCOPED_STORAGE_PREFIXES = [
  "clientInformationData",
  "educationalBackgroundData",
  "clientBackgroundIPData",
  "ip-disclosure-storage",
  "ipDisclosureData",
  "ipInventorsData",
  "copyrightApplicationData",
  "patentApplicationData",
  "matrixSampleData",
  "patentSearchData",
  "trademarkData",
  "tradeSecretData",
  "substantialUseData",
  "substantial-use-storage",
  "deedAssignmentData",
  "signatoryData",
  "royaltyData",
  "deed-assignment-storage",
] as const;

export const APP_OWNED_LOCAL_STORAGE_KEYS = [
  "activeApplicationId",
  "activeApplicationIdSetAt",
  "clientInformationData",
  "educationalBackgroundData",
  "clientBackgroundIPData",
  "ipDisclosureData",
  "ipInventorsData",
  "ip-disclosure-storage",
  "copyrightApplicationData",
  "patentApplicationData",
  "matrixSampleData",
  "patentSearchData",
  "trademarkData",
  "tradeSecretData",
  "substantialUseData",
  "substantial-use-storage",
  "deedAssignmentData",
  "signatoryData",
  "royaltyData",
  "deed-assignment-storage",
  "formSubmissionStatus",
] as const;

export const APP_OWNED_SESSION_STORAGE_KEYS = [
  "lastRouteChange",
  "lastResetStoreTime",
  "lastCheckExistingDisclosureAndFetch",
  "lastCheckExistingDisclosureAppId",
] as const;

// Add navigation awareness if we're in a browser environment
if (typeof window !== "undefined") {
  // Track when user is navigating between tabs/pages
  window.addEventListener("beforeunload", () => {
    isTabChanging = true;
    // Ensure pending writes are flushed when page unloads
    flushPendingWrites();
  });

  // Track route changes in the app (for SPAs)
  window.addEventListener("popstate", () => {
    isTabChanging = true;
    setTimeout(() => {
      isTabChanging = false;
    }, TAB_CHANGE_COOLDOWN);
  });
}

/**
 * Helper to compare objects deeply before storing
 * @param prev Previous JSON string
 * @param current Current JSON string
 */
const hasValueChanged = (prev: string | null, current: string): boolean => {
  if (!prev) return true; // No previous value, consider it changed
  if (prev === current) return false; // Quick string equality check

  try {
    // Try parsing for deep comparison
    const prevObj = JSON.parse(prev);
    const currentObj = JSON.parse(current);

    // Compare stringified with sorted keys for more accurate comparison
    const normalizedPrev = JSON.stringify(prevObj, Object.keys(prevObj).sort());
    const normalizedCurrent = JSON.stringify(
      currentObj,
      Object.keys(currentObj).sort()
    );

    return normalizedPrev !== normalizedCurrent;
  } catch (e) {
    // Fallback to direct string comparison if parsing fails
    return prev !== current;
  }
};

/**
 * Sets an item in localStorage with debouncing to prevent excessive operations
 * @param key The localStorage key
 * @param value The value to store
 */
export const debouncedSetItem = (key: string, value: string) => {
  // Skip updates during tab changes unless it's critical data
  if (isTabChanging && !key.includes("critical")) {
    console.debug(`Skipping localStorage update during tab change: ${key}`);
    return;
  }

  // Check if value has actually changed using deep comparison
  const prevValue = previousValues.get(key) || window.localStorage.getItem(key);
  if (!hasValueChanged(prevValue, value)) {
    console.debug(`Skipping unchanged localStorage write for: ${key}`);
    return;
  }

  // Update our cache of previous values
  previousValues.set(key, value);

  // Clear existing timer for this key if it exists
  if (pendingWrites.has(key)) {
    clearTimeout(pendingWrites.get(key)!.timer);
  }

  // Create new timer with progressive backoff
  // If there are many pending writes, increase the delay exponentially
  const pendingCount = pendingWrites.size;
  const adjustedDelay = Math.min(
    DEBOUNCE_DELAY * (1 + pendingCount * 0.1),
    2000
  );

  const timer = setTimeout(() => {
    try {
      // Only execute if we still have a pending write (it wasn't cancelled)
      if (pendingWrites.has(key)) {
        const currentValue = pendingWrites.get(key)!.value;

        // Actually write to localStorage
        window.localStorage.setItem(key, currentValue);

        // Remove from pending writes
        pendingWrites.delete(key);

        console.debug(
          `Successfully wrote to localStorage: ${key} (${currentValue.length} chars)`
        );
      }
    } catch (error) {
      console.error(`Error in debounced localStorage write for ${key}:`, error);
    }
  }, adjustedDelay);

  // Store the pending write
  pendingWrites.set(key, { value, timer });
  console.debug(
    `Queued localStorage write for ${key}, ${pendingWrites.size} pending (delay: ${adjustedDelay}ms)`
  );
};

/**
 * Removes an item from localStorage with debouncing
 * @param key The localStorage key to remove
 */
export const debouncedRemoveItem = (key: string) => {
  // Skip operations during tab changes
  if (isTabChanging) {
    return;
  }

  // No need to remove if the item doesn't exist
  if (!window.localStorage.getItem(key)) {
    return;
  }

  // Update our cache
  previousValues.delete(key);

  // Use a shorter delay for removes since they're less intensive
  setTimeout(() => {
    try {
      window.localStorage.removeItem(key);
      console.debug(`Removed item from localStorage: ${key}`);
    } catch (error) {
      console.error(
        `Error in debounced localStorage remove for ${key}:`,
        error
      );
    }
  }, 50); // Short delay for removals
};

/**
 * Batch operation for removing multiple localStorage items efficiently
 * @param keys Array of localStorage keys to remove
 */
export const batchRemoveLocalStorageItems = (keys: string[]) => {
  if (!keys || keys.length === 0) return;

  // Skip non-critical operations during tab changes
  if (isTabChanging) {
    const criticalKeys = keys.filter((key) => key.includes("critical"));
    if (criticalKeys.length === 0) {
      console.debug("Skipping batch remove during tab change");
      return;
    }
    // Only process critical keys during tab changes
    keys = criticalKeys;
  }

  // Filter out keys that don't exist to reduce operations
  const existingKeys = keys.filter((key) => !!window.localStorage.getItem(key));
  if (existingKeys.length === 0) return;

  // Update our cache
  existingKeys.forEach((key) => previousValues.delete(key));

  // Group keys that need to be removed
  const batchSize = 10; // Process in batches of 10
  const batches: string[][] = [];

  // Create batches of keys
  for (let i = 0; i < existingKeys.length; i += batchSize) {
    batches.push(existingKeys.slice(i, i + batchSize));
  }

  // Process each batch with a small delay between batches
  batches.forEach((batch, index) => {
    setTimeout(() => {
      batch.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.error(`Error removing ${key} from localStorage:`, error);
        }
      });
      console.debug(
        `Removed batch ${index + 1}/${batches.length} (${batch.length} items)`
      );
    }, index * 50); // Increased delay between batches to 50ms
  });
};

/**
 * Removes all localStorage keys associated with a specific application ID.
 * This clears both raw and JSON-stringified key variants used by older code.
 */
export const clearApplicationScopedLocalStorage = (
  applicationId: string | null | undefined
) => {
  if (typeof window === "undefined" || !applicationId) return;

  const quotedApplicationId = JSON.stringify(applicationId);
  const prefixes = APP_SCOPED_STORAGE_PREFIXES;

  const keysToRemove = new Set<string>([
    "activeApplicationId",
    "activeApplicationIdSetAt",
    ...prefixes.map((prefix) => `${prefix}-${applicationId}`),
    ...prefixes.map((prefix) => `${prefix}-${quotedApplicationId}`),
  ]);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    const matchesApplication =
      key.includes(applicationId) || key.includes(quotedApplicationId);
    const matchesPrefix = prefixes.some((prefix) => key.startsWith(prefix));

    if (matchesApplication && matchesPrefix) {
      keysToRemove.add(key);
    }
  }

  keysToRemove.forEach((key) => {
    previousValues.delete(key);
    window.localStorage.removeItem(key);
  });
};

/**
 * Clears the app-owned localStorage keys that should be removed on logout.
 * This intentionally leaves unrelated site/browser keys alone.
 */
export const clearAppOwnedLocalStorage = () => {
  if (typeof window === "undefined") return;

  const keysToRemove = new Set<string>(APP_OWNED_LOCAL_STORAGE_KEYS);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    const matchesAppOwnedPrefix = APP_SCOPED_STORAGE_PREFIXES.some((prefix) =>
      key.startsWith(prefix)
    );

    if (matchesAppOwnedPrefix) {
      keysToRemove.add(key);
    }
  }

  keysToRemove.forEach((key) => {
    previousValues.delete(key);
    window.localStorage.removeItem(key);
  });
};

/**
 * Clears app-owned sessionStorage keys used for runtime throttles, debug state,
 * and disclosure lookup caches.
 */
export const clearAppOwnedSessionStorage = () => {
  if (typeof window === "undefined") return;

  const keysToRemove = new Set<string>(APP_OWNED_SESSION_STORAGE_KEYS);

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (!key) continue;

    if (key.startsWith("debug-toast-")) {
      keysToRemove.add(key);
    }
  }

  // `ipDisclosureNoRecordAppIds` stores a JSON array of app IDs; clear it
  // entirely so a different user does not inherit the cached "no record" list.
  keysToRemove.add("ipDisclosureNoRecordAppIds");
  keysToRemove.add("lastCall_ip-disclosure-storage");

  keysToRemove.forEach((key) => {
    window.sessionStorage.removeItem(key);
  });
};

/**
 * Immediately flushes all pending localStorage write operations
 * Useful when calling before page unload events
 */
export const flushPendingWrites = () => {
  if (pendingWrites.size === 0) return;

  console.debug(`Flushing ${pendingWrites.size} pending localStorage writes`);

  pendingWrites.forEach((data, key) => {
    clearTimeout(data.timer);
    try {
      window.localStorage.setItem(key, data.value);
    } catch (error) {
      console.error(`Error flushing pending write for ${key}:`, error);
    }
  });
  pendingWrites.clear();
};

// Set up event listener to flush pending writes when page is unloaded
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushPendingWrites);

  // Track focus/blur to adjust debounce behavior
  window.addEventListener("blur", () => {
    // When window loses focus, flush pending writes
    if (pendingWrites.size > 0) {
      console.debug("Window lost focus, flushing pending localStorage writes");
      flushPendingWrites();
    }
  });

  // Also flush writes on page visibility change
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pendingWrites.size > 0) {
      console.debug("Page hidden, flushing pending localStorage writes");
      flushPendingWrites();
    }
  });
}
