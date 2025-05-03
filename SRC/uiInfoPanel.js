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

            var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
            var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
            var head = [];
            // ** Initialize separate arrays for layout lines **
            var lineOneDetails = []; // To hold Ratings, Runtime, PG
            var genreDetails = [];   // To hold only Genres string
            var countries = Lampa.Api.sources.tmdb.parseCountries(data);
            var pg = Lampa.Api.sources.tmdb.parsePG(data);

            // --- Logo URLs --- (Unchanged - keep all)
            const imdbLogoUrl = 'https://psahx.github.io/ps_plug/IMDb_3_2_Logo_GOLD.png';
            const tmdbLogoUrl = 'https://psahx.github.io/ps_plug/TMDB.svg';
            const rtFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes.svg';
            const rtRottenLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_rotten.svg';
            const rtAudienceFreshLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_positive_audience.svg';
            const rtAudienceSpilledLogoUrl = 'https://psahx.github.io/ps_plug/Rotten_Tomatoes_negative_audience.svg';
            const metacriticLogoUrl = 'https://psahx.github.io/ps_plug/Metacritic_M.png';
            const traktLogoUrl = 'https://psahx.github.io/ps_plug/Trakt.svg';
            const letterboxdLogoUrl = 'https://psahx.github.io/ps_plug/letterboxd-decal-dots-pos-rgb.svg';
            const rogerEbertLogoUrl = 'https://psahx.github.io/ps_plug/Roger_Ebert.jpeg';
            const kpLogoUrl = 'https://psahx.github.io/ps_plug/kinopoisk-icon-main.svg'; // Unused

            // --- Rating Toggles State --- (Unchanged - read all needed for line 1)
            let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
            const showImdb = (imdbStored === true || imdbStored === 'true');
            let tmdbStored = Lampa.Storage.get('show_rating_tmdb', true);
            const showTmdb = (tmdbStored === true || tmdbStored === 'true');
            // No need to read KP toggle anymore
            let tomatoesStored = Lampa.Storage.get('show_rating_tomatoes', false);
            const showTomatoes = (tomatoesStored === true || tomatoesStored === 'true');
            let audienceStored = Lampa.Storage.get('show_rating_audience', false);
            const showAudience = (audienceStored === true || audienceStored === 'true');
            let metacriticStored = Lampa.Storage.get('show_rating_metacritic', false);
            const showMetacritic = (metacriticStored === true || metacriticStored === 'true');
            let traktStored = Lampa.Storage.get('show_rating_trakt', false);
            const showTrakt = (traktStored === true || traktStored === 'true');
            let letterboxdStored = Lampa.Storage.get('show_rating_letterboxd', false);
            const showLetterboxd = (letterboxdStored === true || letterboxdStored === 'true');
            let rogerEbertStored = Lampa.Storage.get('show_rating_rogerebert', false);
            const showRogerebert = (rogerEbertStored === true || rogerEbertStored === 'true');

            // --- Build Head --- (Unchanged)
            if (create_year !== '0000') head.push('<span>' + create_year + '</span>');
            if (countries.length > 0) head.push(countries.join(', '));

            // --- Get MDBList Rating Results ---
            var mdblistResult = this.mdblistRatingsCache[data.id]; // Use this.

            // --- Build Line 1 Details (Ratings) ---
            // Push all active rating divs into lineOneDetails
            if (showImdb) {
                var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0';
                lineOneDetails.push('<div class="full-start__rate imdb-rating-item">' + '<div>' + imdbRating + '</div>' + '<img src="' + imdbLogoUrl + '" class="rating-logo imdb-logo" alt="IMDB" draggable="false">' + '</div>');
            }
            if (showTmdb) {
                lineOneDetails.push('<div class="full-start__rate tmdb-rating-item">' + '<div>' + vote + '</div>' + '<img src="' + tmdbLogoUrl + '" class="rating-logo tmdb-logo" alt="TMDB" draggable="false">' + '</div>');
            }
            if (showTomatoes) {
                 if (mdblistResult && typeof mdblistResult.tomatoes === 'number' && mdblistResult.tomatoes !== null) { let score = mdblistResult.tomatoes; let logoUrl = ''; if (score >= 60) { logoUrl = rtFreshLogoUrl; } else if (score >= 0) { logoUrl = rtRottenLogoUrl; } if (logoUrl) { lineOneDetails.push('<div class="full-start__rate rt-rating-item">' + '<div class="rt-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-logo" alt="RT Critics" draggable="false">' + '</div>'); } }
            }
            if (showAudience) {
                 if (mdblistResult && mdblistResult.popcorn != null) { let parsedScore = parseFloat(mdblistResult.popcorn); if (!isNaN(parsedScore)) { let score = parsedScore; let logoUrl = ''; if (score >= 60) { logoUrl = rtAudienceFreshLogoUrl; } else if (score >= 0) { logoUrl = rtAudienceSpilledLogoUrl; } if (logoUrl) { lineOneDetails.push('<div class="full-start__rate rt-audience-rating-item">' + '<div class="rt-audience-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-audience-logo" alt="RT Audience" draggable="false">' + '</div>'); } } }
            }
            if (showMetacritic) {
                 if (mdblistResult && typeof mdblistResult.metacritic === 'number' && mdblistResult.metacritic !== null) { let score = mdblistResult.metacritic; if (score >= 0) { lineOneDetails.push('<div class="full-start__rate metacritic-rating-item">' + '<div class="metacritic-score">' + score + '</div>' + '<img src="' + metacriticLogoUrl + '" class="rating-logo metacritic-logo" alt="Metacritic" draggable="false">' + '</div>'); } }
            }
            if (showTrakt) {
                 if (mdblistResult && mdblistResult.trakt != null) { let parsedScore = parseFloat(mdblistResult.trakt); if (!isNaN(parsedScore)) { let score = parsedScore; if (score >= 0) { lineOneDetails.push('<div class="full-start__rate trakt-rating-item">' + '<div class="trakt-score">' + score + '</div>' + '<img src="' + traktLogoUrl + '" class="rating-logo trakt-logo" alt="Trakt" draggable="false">' + '</div>'); } } }
            }
            if (showLetterboxd) {
                 if (mdblistResult && mdblistResult.letterboxd != null) { let parsedScore = parseFloat(mdblistResult.letterboxd); if (!isNaN(parsedScore)) { let score = parsedScore.toFixed(1); if (parsedScore >= 0) { lineOneDetails.push('<div class="full-start__rate letterboxd-rating-item">' + '<div class="letterboxd-score">' + score + '</div>' + '<img src="' + letterboxdLogoUrl + '" class="rating-logo letterboxd-logo" alt="Letterboxd" draggable="false">' + '</div>'); } } }
            }
            if (showRogerebert) {
                 if (mdblistResult && mdblistResult.rogerebert != null) { let parsedScore = parseFloat(mdblistResult.rogerebert); if (!isNaN(parsedScore)) { let score = parsedScore.toFixed(1); if (parsedScore >= 0) { lineOneDetails.push('<div class="full-start__rate rogerebert-rating-item">' + '<div class="rogerebert-score">' + score + '</div>' + '<img src="' + rogerEbertLogoUrl + '" class="rating-logo rogerebert-logo" alt="Roger Ebert" draggable="false">' + '</div>'); } } }
            }


            // --- Build Line 1 Details (Runtime, PG) ---
            // Push Runtime and PG into lineOneDetails array
            if (data.runtime) {
                lineOneDetails.push(Lampa.Utils.secondsToTime(data.runtime * 60, true));
            }
            if (pg) {
                lineOneDetails.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>');
            }

            // --- Build Genre Details ---
            // Push ONLY the Genres string into genreDetails array
            if (data.genres && data.genres.length > 0) {
                genreDetails.push(data.genres.map(function (item) { return Lampa.Utils.capitalizeFirstLetter(item.name); }).join(' | '));
            }

            // --- Update HTML ---
            html.find('.new-interface-info__head').empty().append(head.join(', '));

            // ** Construct final details HTML with specific lines **
            let lineOneHtml = lineOneDetails.join('<span class="new-interface-info__split">&#9679;</span>');
            // Genres string is already joined by '|', so just get the first element if it exists
            let genresHtml = genreDetails.length > 0 ? genreDetails[0] : '';

            let finalDetailsHtml = '';
            // Add line 1 (Ratings, Runtime, PG) if it has content
            if (lineOneDetails.length > 0) {
                 finalDetailsHtml += `<div class="line-one-details">${lineOneHtml}</div>`;
            }
            // Add line 2 (Genres) if it has content
             if (genresHtml) {
                 finalDetailsHtml += `<div class="genre-details-line">${genresHtml}</div>`;
             }

            // Set the new HTML structure into the details element
            html.find('.new-interface-info__details').html(finalDetailsHtml);
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
        
        var _this = this;
        clearTimeout(timer); 
        var url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));
        if (loaded[url]) return this.draw(loaded[url]); 
        timer = setTimeout(function () 
                { network.clear(); network.timeout(5000); network.silent(url, function (movie) 
                        { loaded[url] = movie; 
                            if (!movie.method) movie.method = data.name ? 'tv' : 'movie'; _this.draw(movie); 
                        }); 
                }, 300); 
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
