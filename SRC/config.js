// SRC/config.js
'use strict';
console.log("PsahxRatingsPlugin: Executing config.js");

/**
 * Exports the main configuration object for the plugin.
 */
export const config = {
    api_url: 'https://api.mdblist.com/tmdb/', // Base URL for MDBList TMDB endpoint
    // api_key is configured via Lampa Settings -> Additional Ratings
    cache_time: 60 * 60 * 12 * 1000, // 12 hours cache duration
    cache_key: 'mdblist_ratings_cache', // Unique storage key for ratings data
    cache_limit: 500, // Max items in cache
    request_timeout: 10000 // 10 seconds request timeout
};
