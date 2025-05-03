// SRC/cache.js
'use strict';

// Import the configuration settings
import { config } from 'https://psahx.github.io/ERL/SRC/config.js';

/**
 * Retrieves rating data from cache if available and not expired.
 * Checks Lampa.Storage availability.
 * @param {string} tmdb_id - The TMDB ID to check in cache.
 * @returns {object|false} - Cached data object or false if not found/expired/Storage unavailable.
 */
export function getCache(tmdb_id) {
    // Ensure Lampa Storage is available
    if (!window.Lampa || !Lampa.Storage) {
        console.error("PsahxRatingsPlugin [cache.js]: Lampa.Storage not available for getCache.");
        return false;
    }

    const timestamp = new Date().getTime();
    // Use Lampa's cache utility with config values
    const cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {});

    if (cache[tmdb_id]) {
        // Check if cache entry has expired based on config.cache_time
        if ((timestamp - cache[tmdb_id].timestamp) > config.cache_time) {
            // Optional: console.log(`PsahxRatingsPlugin [cache.js]: Cache expired for ${tmdb_id}`);
            delete cache[tmdb_id];
            Lampa.Storage.set(config.cache_key, cache); // Update storage after removing expired entry
            return false;
        }
        // Optional: console.log(`PsahxRatingsPlugin [cache.js]: Cache hit for ${tmdb_id}`);
        return cache[tmdb_id].data; // Return cached data
    }
    // Optional: console.log(`PsahxRatingsPlugin [cache.js]: Cache miss for ${tmdb_id}`);
    return false;
}

/**
 * Stores rating data in the cache with a timestamp.
 * Checks Lampa.Storage availability.
 * @param {string} tmdb_id - The TMDB ID to use as the cache key.
 * @param {object} data - The rating data object to store.
 */
export function setCache(tmdb_id, data) {
    // Ensure Lampa Storage is available
    if (!window.Lampa || !Lampa.Storage) {
        console.error("PsahxRatingsPlugin [cache.js]: Lampa.Storage not available for setCache.");
        return;
    }

    const timestamp = new Date().getTime();
    const cache = Lampa.Storage.cache(config.cache_key, config.cache_limit, {});
    // Store data along with a timestamp
    cache[tmdb_id] = {
        timestamp: timestamp,
        data: data
    };
    Lampa.Storage.set(config.cache_key, cache); // Save updated cache to storage
    // Optional: console.log(`PsahxRatingsPlugin [cache.js]: Cache set for ${tmdb_id}`);
}
