// SRC/uiInfoPanel.js
'use strict';

// Import the function to fetch ratings from our API client module
import { fetchMDBListRatings } from './apiMDBList.js';

// Potential other imports if needed later (e.g., config), but start minimal.

/**
 * Represents the handler for the detailed information panel in the UI.
 * Encapsulates the logic originally found in the 'create' function.
 * @param {object} object - Parameter passed from Lampa's InteractionMain (contains source etc.)
 */
export function InfoPanelHandler(object) {
    let html; // Reference to the main panel DOM element
    let debounceTimer; // Timer for debouncing TMDB load requests
    let tmdbNetwork = new Lampa.Reguest(); // Separate network instance for base TMDB data
    let loadedTmdbData = {}; // Cache for base TMDB data fetched by this.load

    // Instance-specific cache/pending state for MDBList ratings
    // Changed from module-level variables to instance properties
    this.mdblistRatingsCache = {};
    this.mdblistRatingsPending = {};

    /**
     * Creates the initial HTML structure for the info panel.
     */
    this.create = function () {
        // Initialize instance state when created
        this.mdblistRatingsCache = {};
        this.mdblistRatingsPending = {};
        loadedTmdbData = {}; // Also clear TMDB cache for the instance

        // Original HTML structure creation - PASTE YOUR ORIGINAL CODE HERE
        html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
        // End of original code
    };

    /**
     * Updates the panel with new data, triggers MDBList rating fetch, and then TMDB base data load.
     * @param {object} data - The basic movie/show data (needs id, method, title, overview, backdrop_path).
     */
    this.update = function (data) {
        // Ensure necessary Lampa components are available
        if (!window.Lampa || !Lampa.Lang || !Lampa.Api || !Lampa.Background) {
            console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components (Lang, Api, Background) in update.");
            // Handle missing components, maybe return or show error state?
        }

        // --- Reset UI Elements ---
        // Make sure 'html' is created before updating
        if (!html) this.create();
        // Use default text or clear content - based on original logic
        html.find('.new-interface-info__head,.new-interface-info__details').text('---');
        html.find('.new-interface-info__title').text(data.title || '');
        html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext') || 'No description'); // Add fallback

        // Update background image
        try {
            Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
        } catch (e) { console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Error changing background", e); }


        // --- MDBList Ratings Fetching ---
        // Clear previous MDBList state for this specific item ID
        delete this.mdblistRatingsCache[data.id];
        delete this.mdblistRatingsPending[data.id];

        // Check if we have the necessary data to fetch ratings
        if (data.id && data.method) {
            this.mdblistRatingsPending[data.id] = true; // Mark as pending

            // Call the imported async function, handle the returned Promise
            fetchMDBListRatings(data)
                .then(mdblistResult => {
                    // Store the result (either ratings data or an {error: ...} object)
                    this.mdblistRatingsCache[data.id] = mdblistResult;
                    delete this.mdblistRatingsPending[data.id]; // Remove pending flag

                    // Crucially, trigger the loading of base TMDB data AFTER MDBList fetch attempt completes.
                    // this.load() will fetch TMDB details and then call this.draw().
                    this.load(data);
                })
                .catch(internalError => {
                    // This catch is primarily for unexpected errors *within* fetchMDBListRatings's Promise handling itself
                    // as fetchMDBListRatings is designed to *resolve* with an error object for API/network issues.
                    console.error(`PsahxRatingsPlugin [uiInfoPanel.js]: Internal error handling MDBList fetch for ${data.id}`, internalError);
                    this.mdblistRatingsCache[data.id] = { error: "Internal fetch error" }; // Store generic error
                    delete this.mdblistRatingsPending[data.id];

                    // Still proceed to load base TMDB data so the panel isn't empty
                    this.load(data);
                });
        } else {
            // If essential data (id/method) is missing, log a warning and skip MDBList fetch.
            console.warn(`PsahxRatingsPlugin [uiInfoPanel.js]: Missing id ('${data.id}') or method ('${data.method}') in update data for title: ${data.title}. Cannot fetch MDBList ratings.`);
            // Just load the base TMDB data.
            this.load(data);
        }
    };

    /**
     * Draws the detailed information using combined base TMDB data and fetched MDBList ratings.
     * @param {object} data - Base movie/show data fetched from TMDB by this.load().
     */
    this.draw = function (data) {
        // Ensure necessary Lampa components are available
        if (!window.Lampa || !Lampa.Storage || !Lampa.Api || !Lampa.Utils) {
             console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components in draw.");
             return; // Cannot draw without these
        }
        if (!html) {
             console.error("PsahxRatingsPlugin [uiInfoPanel.js]: HTML element not ready in draw.");
             return;
        }

        // ========================================================================
        // == PASTE YOUR ENTIRE ORIGINAL 'this.draw' FUNCTION LOGIC BELOW      ==
        // ==                                                                    ==
        // == IMPORTANT: Find the line:                                          ==
        // ==   var mdblistResult = mdblistRatingsCache[data.id];                ==
        // == AND CHANGE IT TO:                                                  ==
        // ==   var mdblistResult = this.mdblistRatingsCache[data.id]; // Use this. ==
        // ========================================================================

        // Example start (replace with your full code):
        var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
        var vote = parseFloat((data.vote_average || 0) + '').toFixed(1); // TMDB Vote Average
        var head = [];
        var lineOneDetails = [];
        var genreDetails = [];
        var countries = Lampa.Api.sources.tmdb.parseCountries(data);
        var pg = Lampa.Api.sources.tmdb.parsePG(data);

        const imdbLogoUrl = 'https://psahx.github.io/ps_plug/IMDb_3_2_Logo_GOLD.png';
        // ... PASTE ALL OTHER LOGO URLS ...
        const kpLogoUrl = 'https://psahx.github.io/ps_plug/kinopoisk-icon-main.svg'; // Unused

        // --- Rating Toggles State ---
        let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
        // ... PASTE ALL OTHER TOGGLE READS ...
        const showRogerebert = (rogerEbertStored === true || rogerEbertStored === 'true');

        // --- Get MDBList Rating Results ---
        var mdblistResult = this.mdblistRatingsCache[data.id]; // <-- IMPORTANT: Use 'this.' here

        // --- Build Line 1 Details (Ratings) ---
        if (showImdb) { /* ... PASTE ORIGINAL IMDB LOGIC ... */ }
        if (showTmdb) { /* ... PASTE ORIGINAL TMDB LOGIC ... */ }
        // ... PASTE ALL OTHER RATING DISPLAY LOGIC (RT, AUDIENCE, META, TRAKT, LB, EBERT) ...

        // --- Build Line 1 Details (Runtime, PG) ---
        if (data.runtime) { /* ... PASTE ORIGINAL RUNTIME LOGIC ... */ }
        if (pg) { /* ... PASTE ORIGINAL PG LOGIC ... */ }

        // --- Build Genre Details ---
        if (data.genres && data.genres.length > 0) { /* ... PASTE ORIGINAL GENRE LOGIC ... */ }

        // --- Update HTML ---
        html.find('.new-interface-info__head').empty().append(head.join(', '));
        // ... PASTE ORIGINAL FINAL DETAILS HTML CONSTRUCTION AND INJECTION ...
        html.find('.new-interface-info__details').html(finalDetailsHtml);

        // ========================================================================
        // == END OF PASTED 'this.draw' LOGIC                                  ==
        // ========================================================================
    }; // End draw function

    /**
     * Loads the base movie/show details from the TMDB API.
     * This is called after the initial MDBList fetch attempt completes.
     * It uses its own cache (loadedTmdbData) and network instance (tmdbNetwork).
     * On success, it calls this.draw() with the fetched TMDB data.
     * @param {object} data - The initial data containing id and method (tv/movie).
     */
    this.load = function (data) {
        // Ensure necessary Lampa components are available
        if (!window.Lampa || !Lampa.TMDB || !Lampa.Storage) {
            console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components in load.");
            return;
        }

        // ===================================================================
        // == PASTE YOUR ENTIRE ORIGINAL 'this.load' FUNCTION LOGIC BELOW ==
        // ===================================================================

        // Example start (replace with your full code):
        var _this = this; // Keep reference to 'this' for callbacks
        clearTimeout(debounceTimer);
        // Construct TMDB API URL
        var url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));

        // Check internal TMDB cache first
        if (loadedTmdbData[url]) {
             // Data already loaded, just draw it
             // This draw call uses the cached TMDB data, and 'this.draw' will internally
             // check 'this.mdblistRatingsCache' for the MDBList ratings.
             return this.draw(loadedTmdbData[url]);
        }

        // Debounce the TMDB API call
        debounceTimer = setTimeout(function () {
            tmdbNetwork.clear();
            tmdbNetwork.timeout(5000); // Use appropriate timeout
            tmdbNetwork.silent(url,
                function (movie) { // Success callback for TMDB fetch
                    loadedTmdbData[url] = movie; // Cache TMDB result
                    // Add method if missing (original logic)
                    if (!movie.method) movie.method = data.name ? 'tv' : 'movie';
                    // Call draw with the fetched TMDB data
                    _this.draw(movie);
                },
                function(xhr, status){ // Error callback for TMDB fetch
                     console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Failed to load base TMDB data", status, xhr);
                     // Optionally, attempt to draw with minimal data or show error in UI
                     // _this.draw(data); // Draw using the initial limited data?
                }
            );
        }, 300); // Debounce time

        // ===================================================================
        // == END OF PASTED 'this.load' LOGIC                             ==
        // ===================================================================
    }; // End load function

    /**
     * Returns the main HTML element for rendering.
     */
    this.render = function () { return html; };

    /**
     * Placeholder for empty state logic (if needed).
     */
    this.empty = function () {
        // PASTE YOUR ORIGINAL 'this.empty' LOGIC HERE (if any)
    };

    /**
     * Cleans up resources when the panel is destroyed.
     */
    this.destroy = function () {
        // --- Original destroy logic ---
        if(html) html.remove();
        loadedTmdbData = {}; // Clear TMDB cache
        tmdbNetwork.clear(); // Clear any pending TMDB requests
        clearTimeout(debounceTimer); // Clear debounce timer
        html = null;
        // Clear MDBList cache/pending for this instance
        this.mdblistRatingsCache = {};
        this.mdblistRatingsPending = {};
        // --- End of original destroy logic ---
    }; // End destroy function

} // End InfoPanelHandler function
