// SRC/apiMDBList.js
'use strict';

// Import necessary modules
import { config } from 'https://psahx.github.io/ERL/SRC/config.js';
import { getCache, setCache } from 'https://psahx.github.io/ERL/SRC/cache.js';

// Create the Lampa network request instance.
// Assuming it's okay to have one instance per module load.
// If network instances need more complex management (e.g., cancellation),
// this might need to be handled differently.
const network = (window.Lampa && Lampa.Reguest) ? new Lampa.Reguest() : null;

/**
 * Fetches ratings for a given movie/show from MDBList API asynchronously.
 * Handles caching (checks cache first, sets cache on success/certain errors).
 * Returns a Promise that resolves with the ratings result object.
 * The result object will have rating sources as keys (e.g., imdb, tmdb)
 * or an 'error' key if fetching/processing failed.
 *
 * @param {object} movieData - Object containing movie details. Requires 'id' (TMDB ID) and 'method' ('movie' or 'tv').
 * @returns {Promise<object>} - Promise resolving with the ratings object (e.g., {imdb: 7.5, tmdb: 8.0, error: null})
 * or an error object (e.g., {error: 'API Key not configured'}).
 */
export function fetchMDBListRatings(movieData) {
    // Wrap the entire logic in a Promise
    return new Promise((resolve) => {

        // --- 0. Initial Checks ---
        if (!network) {
            console.error("PsahxRatingsPlugin [apiMDBList.js]: Lampa.Reguest (network) not available.");
            resolve({ error: "Network component unavailable" }); // Resolve with error object
            return;
        }
        if (!window.Lampa || !Lampa.Storage) {
            console.error("PsahxRatingsPlugin [apiMDBList.js]: Lampa.Storage not available.");
            resolve({ error: "Storage component unavailable" });
            return;
        }
        // Validate input data (essential fields)
        if (!movieData || !movieData.id || !movieData.method) {
            console.error("PsahxRatingsPlugin [apiMDBList.js]: Invalid input - requires movieData object with 'id' and 'method'.");
            resolve({ error: "Invalid input data for fetch" });
            return;
        }

        const tmdb_id = movieData.id;

        // --- 1. Check Cache ---
        const cached_ratings = getCache(tmdb_id);
        if (cached_ratings) {
            // If valid cache exists, resolve the Promise immediately
            // Optional: console.log(`PsahxRatingsPlugin [apiMDBList.js]: Using cache for ${tmdb_id}`);
            resolve(cached_ratings);
            return;
        }

        // --- 2. Get API Key ---
        const apiKey = Lampa.Storage.get('mdblist_api_key');
        if (!apiKey) {
            // Resolve with error if key missing; don't cache this state.
            resolve({ error: "MDBList API Key not configured in Additional Ratings settings" });
            return;
        }

        // --- 3. Prepare API Request ---
        const media_type = movieData.method === 'tv' ? 'show' : 'movie';
        const api_url = `${config.api_url}${media_type}/${tmdb_id}?apikey=${apiKey}`;

        // Optional: console.log(`PsahxRatingsPlugin [apiMDBList.js]: Fetching URL: ${api_url}`); // Be careful logging URLs with keys

        // --- 4. Make Network Request ---
        network.clear(); // Clear previous requests on this instance
        network.timeout(config.request_timeout);
        network.silent(api_url,
            // ---- Success Callback for network.silent ----
            function (response) {
                const ratingsResult = { error: null }; // Initialize result object

                if (response && response.ratings && Array.isArray(response.ratings)) {
                    // Populate result object dynamically from the ratings array
                    response.ratings.forEach(function(rating) {
                        if (rating.source && rating.value !== null) {
                            // Use source name directly as key (e.g., 'imdb', 'metacritic')
                            ratingsResult[rating.source] = rating.value;
                        }
                    });
                } else if (response && response.error) {
                    // Handle specific errors reported by MDBList API (e.g., invalid key)
                    console.error(`PsahxRatingsPlugin [apiMDBList.js]: API Error from MDBList for TMDB ID: ${tmdb_id}`, response.error);
                    ratingsResult.error = "MDBList API Error: " + response.error;
                } else {
                    // Handle unexpected response format
                    console.error(`PsahxRatingsPlugin [apiMDBList.js]: Invalid response format received from MDBList for TMDB ID: ${tmdb_id}`, response);
                    ratingsResult.error = "Invalid response format from MDBList";
                }

                // Cache the processed result (successful or error)
                // Avoid caching errors related to invalid API keys or auth issues,
                // allowing the user to fix the key and retry without waiting for cache.
                const errorString = ratingsResult.error ? String(ratingsResult.error).toLowerCase() : "";
                if (ratingsResult.error === null || !/invalid api key|unauthorized|forbidden/i.test(errorString)) {
                     setCache(tmdb_id, ratingsResult);
                } else {
                    // Optional: console.log(`PsahxRatingsPlugin [apiMDBList.js]: Not caching auth-related error for ${tmdb_id}`);
                }

                // Resolve the promise with the final result object
                resolve(ratingsResult);
            },
            // ---- Error Callback for network.silent ----
            function (xhr, status) {
                let errorMessage = "MDBList request failed";
                // Try to get a specific HTTP status code if available
                const statusCode = xhr ? xhr.status : (status ? status : null); // Status might be text like 'timeout'
                if (statusCode) { errorMessage += ` (Status: ${statusCode})`; }

                console.error(`PsahxRatingsPlugin [apiMDBList.js]: ${errorMessage} for TMDB ID: ${tmdb_id}`);

                const errorResult = { error: errorMessage };

                // Cache network/server errors to prevent rapid retries,
                // but avoid caching common auth errors (401, 403).
                if (statusCode !== 401 && statusCode !== 403) {
                    setCache(tmdb_id, errorResult);
                } else {
                     // Optional: console.log(`PsahxRatingsPlugin [apiMDBList.js]: Not caching ${statusCode} error for ${tmdb_id}`);
                }

                // Resolve the promise with the error result object
                resolve(errorResult);
            }
        ); // End network.silent call

    }); // End Promise constructor
} // End fetchMDBListRatings function
