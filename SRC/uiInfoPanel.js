// SRC/uiInfoPanel.js
'use strict';

// FIX 1: Import the fetch function from our API client module
import { fetchMDBListRatings } from './apiMDBList.js';

/**
 * Represents the handler for the detailed information panel in the UI.
 * Encapsulates the logic originally found in the 'create' function.
 * @param {object} object - Parameter passed from Lampa's InteractionMain (contains source etc.)
 */
export function InfoPanelHandler(object) {
    let html; // Reference to the main panel DOM element
    // FIX 2: Declare debounceTimer as an instance property
    this.debounceTimer = null; // Initialize instance property
    let tmdbNetwork = new Lampa.Reguest(); // Separate network instance for base TMDB data
    let loadedTmdbData = {}; // Cache for base TMDB data fetched by this.load

    // Instance-specific cache/pending state for MDBList ratings
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
        // FIX 2: Initialize/reset timer on create
        this.debounceTimer = null;

        // Original HTML structure creation from your provided code
        html = $("<div class=\"new-interface-info\">\n            <div class=\"new-interface-info__body\">\n                <div class=\"new-interface-info__head\"></div>\n                <div class=\"new-interface-info__title\"></div>\n                <div class=\"new-interface-info__details\"></div>\n                <div class=\"new-interface-info__description\"></div>\n            </div>\n        </div>");
    };

    /**
     * Updates the panel with new data, triggers MDBList rating fetch, and then TMDB base data load.
     * @param {object} data - The basic movie/show data (needs id, method, title, overview, backdrop_path).
     */
    this.update = function (data) {
        // Ensure necessary Lampa components are available
        if (!window.Lampa || !Lampa.Lang || !Lampa.Api || !Lampa.Background) {
            console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components (Lang, Api, Background) in update.");
            // Consider returning early if critical components are missing
        }

        // --- Reset UI Elements ---
        if (!html) this.create(); // Ensure HTML element exists
        html.find('.new-interface-info__head,.new-interface-info__details').text('---');
        html.find('.new-interface-info__title').text(data.title || '');
        html.find('.new-interface-info__description').text(data.overview || Lampa.Lang.translate('full_notext') || 'No description');

        // Update background image
        try {
            if (Lampa.Background && Lampa.Api) { // Add check for safety
               Lampa.Background.change(Lampa.Api.img(data.backdrop_path, 'w200'));
            }
        } catch (e) { console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Error changing background", e); }


        // --- MDBList Ratings Fetching ---
        delete this.mdblistRatingsCache[data.id];
        delete this.mdblistRatingsPending[data.id];

        if (data.id && data.method) {
            this.mdblistRatingsPending[data.id] = true;

            // FIX 1: Call imported function and handle promise
            fetchMDBListRatings(data)
                .then(mdblistResult => {
                    this.mdblistRatingsCache[data.id] = mdblistResult;
                    delete this.mdblistRatingsPending[data.id];
                    this.load(data); // Call load after promise resolves
                })
                .catch(internalError => {
                    // Handle unexpected errors from the fetch Promise itself
                    console.error(`PsahxRatingsPlugin [uiInfoPanel.js]: Internal error handling MDBList fetch for ${data.id}`, internalError);
                    this.mdblistRatingsCache[data.id] = { error: "Internal fetch error" };
                    delete this.mdblistRatingsPending[data.id];
                    // Still proceed to load base TMDB data
                    this.load(data);
                });
        } else {
            console.warn(`PsahxRatingsPlugin [uiInfoPanel.js]: Missing id ('${data.id}') or method ('${data.method}') in update data for title: ${data.title}. Cannot fetch MDBList ratings.`);
            this.load(data); // Just load the base TMDB data.
        }
    };

    /**
     * Draws the detailed information using combined base TMDB data and fetched MDBList ratings.
     * @param {object} data - Base movie/show data fetched from TMDB by this.load().
     */
    this.draw = function (data) {
        // Ensure necessary Lampa components are available
        // Added jQuery check based on usage below
        if (!window.Lampa || !Lampa.Storage || !Lampa.Api || !Lampa.Utils || typeof $ !== 'function') {
             console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components or jQuery ($) in draw.");
             return; // Cannot draw without these
        }
        if (!html) {
             console.error("PsahxRatingsPlugin [uiInfoPanel.js]: HTML element not ready in draw.");
             return;
        }

        // --- Original draw logic provided by user ---
        var create_year = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
        var vote = parseFloat((data.vote_average || 0) + '').toFixed(1);
        var head = [];
        var lineOneDetails = [];
        var genreDetails = [];
        var countries = Lampa.Api.sources.tmdb.parseCountries(data);
        var pg = Lampa.Api.sources.tmdb.parsePG(data);

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

        let imdbStored = Lampa.Storage.get('show_rating_imdb', true);
        const showImdb = (imdbStored === true || imdbStored === 'true');
        let tmdbStored = Lampa.Storage.get('show_rating_tmdb', true);
        const showTmdb = (tmdbStored === true || tmdbStored === 'true');
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

        if (create_year !== '0000') head.push('<span>' + create_year + '</span>');
        if (countries.length > 0) head.push(countries.join(', '));

        var mdblistResult = this.mdblistRatingsCache[data.id]; // Correctly uses this.

        if (showImdb) { var imdbRating = mdblistResult && mdblistResult.imdb !== null && typeof mdblistResult.imdb === 'number' ? parseFloat(mdblistResult.imdb || 0).toFixed(1) : '0.0'; lineOneDetails.push('<div class="full-start__rate imdb-rating-item">' + '<div>' + imdbRating + '</div>' + '<img src="' + imdbLogoUrl + '" class="rating-logo imdb-logo" alt="IMDB" draggable="false">' + '</div>'); }
        if (showTmdb) { lineOneDetails.push('<div class="full-start__rate tmdb-rating-item">' + '<div>' + vote + '</div>' + '<img src="' + tmdbLogoUrl + '" class="rating-logo tmdb-logo" alt="TMDB" draggable="false">' + '</div>'); }
        if (showTomatoes) { if (mdblistResult && typeof mdblistResult.tomatoes === 'number' && mdblistResult.tomatoes !== null) { let score = mdblistResult.tomatoes; let logoUrl = ''; if (score >= 60) { logoUrl = rtFreshLogoUrl; } else if (score >= 0) { logoUrl = rtRottenLogoUrl; } if (logoUrl) { lineOneDetails.push('<div class="full-start__rate rt-rating-item">' + '<div class="rt-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-logo" alt="RT Critics" draggable="false">' + '</div>'); } } }
        if (showAudience) { if (mdblistResult && mdblistResult.popcorn != null) { let parsedScore = parseFloat(mdblistResult.popcorn); if (!isNaN(parsedScore)) { let score = parsedScore; let logoUrl = ''; if (score >= 60) { logoUrl = rtAudienceFreshLogoUrl; } else if (score >= 0) { logoUrl = rtAudienceSpilledLogoUrl; } if (logoUrl) { lineOneDetails.push('<div class="full-start__rate rt-audience-rating-item">' + '<div class="rt-audience-score">' + score + '</div>' + '<img src="' + logoUrl + '" class="rating-logo rt-audience-logo" alt="RT Audience" draggable="false">' + '</div>'); } } } }
        if (showMetacritic) { if (mdblistResult && typeof mdblistResult.metacritic === 'number' && mdblistResult.metacritic !== null) { let score = mdblistResult.metacritic; if (score >= 0) { lineOneDetails.push('<div class="full-start__rate metacritic-rating-item">' + '<div class="metacritic-score">' + score + '</div>' + '<img src="' + metacriticLogoUrl + '" class="rating-logo metacritic-logo" alt="Metacritic" draggable="false">' + '</div>'); } } }
        if (showTrakt) { if (mdblistResult && mdblistResult.trakt != null) { let parsedScore = parseFloat(mdblistResult.trakt); if (!isNaN(parsedScore)) { let score = parsedScore; if (score >= 0) { lineOneDetails.push('<div class="full-start__rate trakt-rating-item">' + '<div class="trakt-score">' + score + '</div>' + '<img src="' + traktLogoUrl + '" class="rating-logo trakt-logo" alt="Trakt" draggable="false">' + '</div>'); } } } }
        if (showLetterboxd) { if (mdblistResult && mdblistResult.letterboxd != null) { let parsedScore = parseFloat(mdblistResult.letterboxd); if (!isNaN(parsedScore)) { let score = parsedScore.toFixed(1); if (parsedScore >= 0) { lineOneDetails.push('<div class="full-start__rate letterboxd-rating-item">' + '<div class="letterboxd-score">' + score + '</div>' + '<img src="' + letterboxdLogoUrl + '" class="rating-logo letterboxd-logo" alt="Letterboxd" draggable="false">' + '</div>'); } } } }
        if (showRogerebert) { if (mdblistResult && mdblistResult.rogerebert != null) { let parsedScore = parseFloat(mdblistResult.rogerebert); if (!isNaN(parsedScore)) { let score = parsedScore.toFixed(1); if (parsedScore >= 0) { lineOneDetails.push('<div class="full-start__rate rogerebert-rating-item">' + '<div class="rogerebert-score">' + score + '</div>' + '<img src="' + rogerEbertLogoUrl + '" class="rating-logo rogerebert-logo" alt="Roger Ebert" draggable="false">' + '</div>'); } } } }

        if (data.runtime) { lineOneDetails.push(Lampa.Utils.secondsToTime(data.runtime * 60, true)); }
        if (pg) { lineOneDetails.push('<span class="full-start__pg" style="font-size: 0.9em;">' + pg + '</span>'); }

        if (data.genres && data.genres.length > 0) { genreDetails.push(data.genres.map(function (item) { return Lampa.Utils.capitalizeFirstLetter(item.name); }).join(' | ')); }

        html.find('.new-interface-info__head').empty().append(head.join(', '));
        let lineOneHtml = lineOneDetails.join('<span class="new-interface-info__split">&#9679;</span>');
        let genresHtml = genreDetails.length > 0 ? genreDetails[0] : '';
        let finalDetailsHtml = '';
        if (lineOneDetails.length > 0) { finalDetailsHtml += `<div class="line-one-details">${lineOneHtml}</div>`; }
        if (genresHtml) { finalDetailsHtml += `<div class="genre-details-line">${genresHtml}</div>`; }
        html.find('.new-interface-info__details').html(finalDetailsHtml);
        // --- End of original draw logic ---
    };

    /**
     * Loads the base movie/show details from the TMDB API.
     * Called after the MDBList fetch attempt completes.
     * Uses internal cache (loadedTmdbData) and network instance (tmdbNetwork).
     * Calls this.draw() on success.
     * @param {object} data - Initial data containing id and method (tv/movie).
     */
    this.load = function (data) {
        // Ensure necessary Lampa components are available
        if (!window.Lampa || !Lampa.TMDB || !Lampa.Storage) {
            console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Missing Lampa components (TMDB, Storage) in load.");
            return;
        }

        // --- FIX 2: Use this.debounceTimer ---
        var _this = this; // Keep reference to 'this' for callbacks
        clearTimeout(this.debounceTimer); // Use instance property
        // --- End Fix 2 Part 1 ---

        var url = Lampa.TMDB.api((data.name ? 'tv' : 'movie') + '/' + data.id + '?api_key=' + Lampa.TMDB.key() + '&append_to_response=content_ratings,release_dates&language=' + Lampa.Storage.get('language'));

        // Use module-scoped cache 'loadedTmdbData' as per original structure
        // (Could be changed to this.loadedTmdbData if preferred later)
        if (loadedTmdbData[url]) {
             return this.draw(loadedTmdbData[url]);
        }

        // --- FIX 2: Use this.debounceTimer ---
        this.debounceTimer = setTimeout(function () { // Assign to instance property
            // Use module-scoped network instance 'tmdbNetwork' as per original structure
            tmdbNetwork.clear();
            tmdbNetwork.timeout(5000); // Consider using config.request_timeout?
            tmdbNetwork.silent(url,
                function (movie) { // Success callback
                    loadedTmdbData[url] = movie; // Cache TMDB result
                    // Add method if missing (original logic)
                    if (!movie.method) movie.method = data.name ? 'tv' : 'movie';
                    _this.draw(movie); // Draw with TMDB data
                },
                function(xhr, status){ // Error callback
                     console.error("PsahxRatingsPlugin [uiInfoPanel.js]: Failed to load base TMDB data", status, xhr);
                     // Optionally attempt to draw with minimal data or show error in UI?
                }
            );
        }, 300); // Debounce time
        // --- End Fix 2 Part 2 ---
    }; // End load function

    /**
     * Returns the main HTML element for rendering.
     */
    this.render = function () { return html; };

    /**
     * Original empty function body placeholder.
     */
    this.empty = function () {
        // PASTE YOUR ORIGINAL 'this.empty' LOGIC HERE (if any)
    };

    /**
     * Cleans up resources when the panel is destroyed.
     */
    this.destroy = function () {
        // --- FIX 2: Use this.debounceTimer ---
        clearTimeout(this.debounceTimer); // Clear timer on destroy
        // --- End Fix 2 ---

        // --- Original destroy logic provided by user ---
        if(html) html.remove();
        loadedTmdbData = {}; // Clear TMDB cache
        tmdbNetwork.clear(); // Clear any pending TMDB requests
        html = null;
        // Clear MDBList cache/pending for this instance
        this.mdblistRatingsCache = {};
        this.mdblistRatingsPending = {};
        // --- End of original destroy logic ---
    }; // End destroy function

} // End InfoPanelHandler function
