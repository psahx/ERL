// SRC/uiInfoPanel.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// --- Mock dependencies ---

// Declare variable for the mock fetch function
let mockFetchMDBListRatings;
// Use vi.doMock for our own API module (runs before import)
vi.doMock('./apiMDBList.js', () => ({
    fetchMDBListRatings: mockFetchMDBListRatings,
}));

// Declare other mock function variables for Lampa/jQuery
let mockLangTranslate;
let mockStorageGet;
let mockStorageField; // Mock for Lampa.Storage.field used in component
let mockApiImg;
let mockApiParseCountries;
let mockApiParsePG;
let mockBackgroundChange;
let mockTmdbNetworkSilent; // Specific mock for 'load' method's TMDB fetch
let mockTmdbNetworkInstance;
let mockTmdbReguestConstructor;
let mockUtilsSecondsToTime;
let mockUtilsCapitalize;
let mockTmdbApi;
let mockTmdbKey;
let mockJquery; // Mock for the global $ function
let mockJqueryInstance; // Mock for the object returned by $()

// Variable to hold the dynamically imported module's handler
let InfoPanelHandler;

// --- Setup Test Environment ---
beforeEach(async () => {
    // Reset mock functions defined outside beforeEach scope
    mockFetchMDBListRatings = vi.fn(() => Promise.resolve({})); // Default success

    // Define fresh mocks for Lampa APIs and jQuery
    mockLangTranslate = vi.fn(key => key); // Return key by default
    mockStorageGet = vi.fn();
    mockStorageField = vi.fn(); // Mock Lampa.Storage.field
    mockApiImg = vi.fn((path, size) => `mock/img/${path}?size=${size}`);
    mockApiParseCountries = vi.fn(() => ['Mock Country']);
    mockApiParsePG = vi.fn(() => 'Mock-PG');
    mockBackgroundChange = vi.fn();

    // Mock Lampa.Reguest specifically for the TMDB call in 'load'
    let storedTmdbSuccessCb = null;
    let storedTmdbErrorCb = null;
    mockTmdbNetworkSilent = vi.fn((url, successCb, errorCb) => {
        storedTmdbSuccessCb = successCb; storedTmdbErrorCb = errorCb;
    });
    mockTmdbNetworkInstance = { clear: vi.fn(), timeout: vi.fn(), silent: mockTmdbNetworkSilent };
    mockTmdbReguestConstructor = vi.fn(() => mockTmdbNetworkInstance);

    mockUtilsSecondsToTime = vi.fn(secs => `${Math.floor(secs/60)}m`);
    mockUtilsCapitalize = vi.fn(str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
    mockTmdbApi = vi.fn(urlPart => `mock/tmdb/api/${urlPart}`); // Simple mock URL builder
    mockTmdbKey = vi.fn(() => 'MOCK_TMDB_KEY');

    // Mock jQuery ($) and its chainable methods needed by InfoPanelHandler
    mockJqueryInstance = {
        find: vi.fn().mockReturnThis(), // Return 'this' (mock instance) for chaining
        text: vi.fn().mockReturnThis(),
        empty: vi.fn().mockReturnThis(),
        append: vi.fn().mockReturnThis(),
        html: vi.fn().mockReturnThis(),
        remove: vi.fn() // Doesn't need to chain
    };
    mockJquery = vi.fn(() => mockJqueryInstance); // Global $() returns our mock instance

    // --- Assign all mocks to window object ---
    window.Lampa = {
        Lang: { translate: mockLangTranslate },
        Storage: { get: mockStorageGet, field: mockStorageField, // Mock methods used by InfoPanel AND component
                   // Add dummy cache/set if implicitly needed by Storage.field perhaps
                   cache: vi.fn(()=>({})), set: vi.fn() },
        Api: {
            img: mockApiImg,
            sources: { tmdb: { parseCountries: mockApiParseCountries, parsePG: mockApiParsePG } }
        },
        Background: { change: mockBackgroundChange },
        Reguest: mockTmdbReguestConstructor, // Used by 'load' for TMDB
        Utils: { secondsToTime: mockUtilsSecondsToTime, capitalizeFirstLetter: mockUtilsCapitalize },
        TMDB: { api: mockTmdbApi, key: mockTmdbKey },
        // Add other Lampa mocks needed by InfoPanelHandler or potentially by component interactions
        Scroll: vi.fn(() => ({ render: vi.fn(), minus: vi.fn(), append: vi.fn(), update: vi.fn(), destroy: vi.fn() })),
        InteractionLine: vi.fn(),
        Empty: vi.fn(() => ({ render: vi.fn(), start: vi.fn() })),
        Layer: { update: vi.fn(), visible: vi.fn() },
        Controller: { enabled: vi.fn(() => ({ name: 'c' })), toggle: vi.fn(), add: vi.fn(), own: vi.fn(() => true)},
        Activity: vi.fn(() => ({ canRefresh: vi.fn(), toggle: vi.fn(), loader: vi.fn() })),
        Manifest: { app_digital: 999 },
        Account: { hasPremium: vi.fn(() => true) },
    };
    window.$ = mockJquery; // Assign mock jQuery

    // **Dynamically import the module under test AFTER mocks are set up**
    const module = await import(`./uiInfoPanel.js?t=${Date.now()}`);
    InfoPanelHandler = module.InfoPanelHandler; // Assign the exported class/function

    // Clear mock history AFTER setup and import
    vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
     vi.resetModules(); // Reset module cache for dynamic imports
});

// --- Test Suite ---
describe('InfoPanelHandler (uiInfoPanel.js)', () => {

    // Common test data
    const mockObjectArg = { source: 'tmdb' }; // Mock arg passed to constructor
    const testMovieData = { id: 'tmdb123', method: 'movie', title: 'Test Movie', overview: 'Desc', backdrop_path: '/backdrop.jpg', name: null };

    it('create() should initialize HTML structure using $() and reset internal state', () => {
        // Action
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();

        // Assertions
        // Check jQuery was called to create the div
        expect(mockJquery).toHaveBeenCalledTimes(1);
        expect(mockJquery).toHaveBeenCalledWith(expect.stringContaining('<div class="new-interface-info">'));

        // Check internal state initialization
        expect(handler.mdblistRatingsCache).toEqual({});
        expect(handler.mdblistRatingsPending).toEqual({});
        // Note: We can't easily check 'loadedTmdbData' as it's not a 'this.' property
    });

    it('update() should reset UI elements via jQuery', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         vi.clearAllMocks(); // Clear mocks called by create()

         // Action
         handler.update(testMovieData);

         // Assertions - check calls to jQuery methods for UI reset
         expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__head,.new-interface-info__details');
         expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__title');
         expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__description');
         expect(mockJqueryInstance.text).toHaveBeenCalledWith('---'); // Default reset text
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.title);
         // Check translation fallback (assuming mockLangTranslate returns the key)
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.overview);
    });

    it('update() should change background using Lampa.Background', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         // Action
         handler.update(testMovieData);

         // Assertions
         expect(mockBackgroundChange).toHaveBeenCalledTimes(1);
         // Check Lampa.Api.img was called to get the path
         expect(mockApiImg).toHaveBeenCalledWith(testMovieData.backdrop_path, 'w200');
         // Check Background.change was called with the result from Api.img
         expect(mockBackgroundChange).toHaveBeenCalledWith(`mock/img/${testMovieData.backdrop_path}?size=w200`);
    });

    it('update() should call fetchMDBListRatings and then this.load() on success', async () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        // Spy on the instance's 'load' method BEFORE calling 'update'
        const loadSpy = vi.spyOn(handler, 'load');
        // Mock the fetch to return a resolved promise
        const mockFetchResult = { imdb: 7.0, error: null };
        mockFetchMDBListRatings.mockResolvedValue(mockFetchResult);

        // Action
        await handler.update(testMovieData); // Use await as fetch is async

        // Assertions
        // Check fetch was called correctly
        expect(mockFetchMDBListRatings).toHaveBeenCalledTimes(1);
        expect(mockFetchMDBListRatings).toHaveBeenCalledWith(testMovieData);

        // Check internal state updated after fetch resolves
        expect(handler.mdblistRatingsCache[testMovieData.id]).toEqual(mockFetchResult);
        expect(handler.mdblistRatingsPending[testMovieData.id]).toBeUndefined();

        // Check load was called AFTER fetch promise resolved
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledWith(testMovieData);
    });

    it('update() should call this.load() directly if id or method is missing', async () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const loadSpy = vi.spyOn(handler, 'load');
        // No need to mock fetch return value here as it shouldn't be called

        // Action with invalid data (missing id)
        const invalidData = { method:'movie', title: 'Invalid' };
        await handler.update(invalidData);

        // Assertions
        expect(mockFetchMDBListRatings).not.toHaveBeenCalled(); // Fetch should NOT be called
        expect(loadSpy).toHaveBeenCalledTimes(1); // Load should be called directly
        expect(loadSpy).toHaveBeenCalledWith(invalidData);
    });

    it('load() should call TMDB API via network and then this.draw() on success', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        // Spy on the instance's 'draw' method
        const drawSpy = vi.spyOn(handler, 'draw');

        // Action: Call load, which should trigger the network request setup
        handler.load(testMovieData);

        // Assert: Network call was initiated
        expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
        // Extract the success callback captured by the mock
        const tmdbSuccessCallback = mockTmdbNetworkSilent.mock.calls[0][1];
        expect(tmdbSuccessCallback).toBeInstanceOf(Function);

        // Arrange: Define mock TMDB response data
        const mockTmdbResponse = { ...testMovieData, vote_average: 8.5, genres: [{name: 'Action'}] };

        // Action: Manually trigger the success callback
        tmdbSuccessCallback(mockTmdbResponse);

        // Assert: Check if 'draw' was called with the TMDB response data
        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
        // Check TMDB API URL construction
        expect(mockTmdbApi).toHaveBeenCalledWith(expect.stringContaining(`movie/${testMovieData.id}`));
        expect(mockTmdbKey).toHaveBeenCalled();
    });

    it('load() should use internal TMDB cache and call draw() without network request if data exists', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const drawSpy = vi.spyOn(handler, 'draw');
        const mockTmdbResponse = { ...testMovieData, vote_average: 8.5 };

        // Arrange: Pre-populate internal TMDB cache by calling load once and simulating success
        handler.load(testMovieData);
        expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
        mockTmdbNetworkSilent.mock.calls[0][1](mockTmdbResponse); // Trigger success, populates cache, calls draw once
        expect(drawSpy).toHaveBeenCalledTimes(1);
        drawSpy.mockClear(); // Clear spy calls from the setup phase
        vi.clearAllMocks(); // Clear network mock calls from setup

        // Action: Call load again with the same data
        handler.load(testMovieData);

        // Assert: Network should NOT have been called this time
        expect(mockTmdbNetworkSilent).not.toHaveBeenCalled();
        // Assert: draw should have been called immediately with the cached TMDB data
        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
    });

    // Add more tests later for:
    // - Error handling in update() if fetch promise rejects unexpectedly
    // - Error handling in load() if TMDB network call fails
    // - destroy() method cleaning up timers, removing HTML etc.
    // - draw() method basic checks (e.g., calls find/html) - deeper checks deferred

}); // End describe InfoPanelHandler

