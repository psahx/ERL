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
let mockStorageField;
let mockApiImg;
let mockApiParseCountries;
let mockApiParsePG;
let mockBackgroundChange;
let mockTmdbNetworkSilent;
let mockTmdbNetworkInstance;
let mockTmdbReguestConstructor;
let mockUtilsSecondsToTime;
let mockUtilsCapitalize;
let mockTmdbApi;
let mockTmdbKey;
let mockJquery;
let mockJqueryInstance;

// Variable to hold the dynamically imported module's handler
let InfoPanelHandler;

// --- Setup Test Environment ---
beforeEach(async () => {
    // 1. Reset/Define mock function implementations FIRST
    mockFetchMDBListRatings = vi.fn(() => Promise.resolve({ test: 'mock_fetch_ok_beforeEach' })); // Default success
    console.log('DEBUG beforeEach: mockFetchMDBListRatings defined?', typeof mockFetchMDBListRatings); // DEBUG

    // Define other mocks
    mockLangTranslate = vi.fn(key => key);
    mockStorageGet = vi.fn();
    mockStorageField = vi.fn();
    mockApiImg = vi.fn((path, size) => `mock/img/${path}?size=${size}`);
    mockApiParseCountries = vi.fn(() => ['Mock Country']);
    mockApiParsePG = vi.fn(() => 'Mock-PG');
    mockBackgroundChange = vi.fn();
    let storedTmdbSuccessCb = null; // Keep these local to where network mock is defined
    let storedTmdbErrorCb = null;
    mockTmdbNetworkSilent = vi.fn((url, successCb, errorCb) => { storedTmdbSuccessCb = successCb; storedTmdbErrorCb = errorCb; });
    mockTmdbNetworkInstance = { clear: vi.fn(), timeout: vi.fn(), silent: mockTmdbNetworkSilent };
    mockTmdbReguestConstructor = vi.fn(() => mockTmdbNetworkInstance);
    mockUtilsSecondsToTime = vi.fn(secs => `${Math.floor(secs/60)}m`);
    mockUtilsCapitalize = vi.fn(str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
    mockTmdbApi = vi.fn(urlPart => `mock/tmdb/api/${urlPart}`);
    mockTmdbKey = vi.fn(() => 'MOCK_TMDB_KEY');
    mockJqueryInstance = { find: vi.fn().mockReturnThis(), text: vi.fn().mockReturnThis(), empty: vi.fn().mockReturnThis(), append: vi.fn().mockReturnThis(), html: vi.fn().mockReturnThis(), remove: vi.fn() };
    mockJquery = vi.fn(() => mockJqueryInstance);

    // 2. Setup window object with mocks
    window.Lampa = {
        Lang: { translate: mockLangTranslate },
        Storage: { get: mockStorageGet, field: mockStorageField, cache: vi.fn(()=>({})), set: vi.fn() },
        Api: { img: mockApiImg, sources: { tmdb: { parseCountries: mockApiParseCountries, parsePG: mockApiParsePG } } },
        Background: { change: mockBackgroundChange },
        Reguest: mockTmdbReguestConstructor,
        Utils: { secondsToTime: mockUtilsSecondsToTime, capitalizeFirstLetter: mockUtilsCapitalize },
        TMDB: { api: mockTmdbApi, key: mockTmdbKey },
        Scroll: vi.fn(() => ({ render: vi.fn(), minus: vi.fn(), append: vi.fn(), update: vi.fn(), destroy: vi.fn() })),
        InteractionLine: vi.fn(), Empty: vi.fn(() => ({ render: vi.fn(), start: vi.fn() })), Layer: { update: vi.fn(), visible: vi.fn() },
        Controller: { enabled: vi.fn(() => ({ name: 'c' })), toggle: vi.fn(), add: vi.fn(), own: vi.fn(() => true)}, Activity: vi.fn(() => ({ canRefresh: vi.fn(), toggle: vi.fn(), loader: vi.fn() })),
        Manifest: { app_digital: 999 }, Account: { hasPremium: vi.fn(() => true) },
    };
    window.$ = mockJquery;

    // 3. Dynamically import the module under test AFTER mocks are applied
    const module = await import('./uiInfoPanel.js');
    InfoPanelHandler = module.InfoPanelHandler;

    // 4. **Enable Fake Timers** for controlling setTimeout/clearTimeout
    vi.useFakeTimers();

    // 5. Clear mock history AFTER setup and import
    vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
     vi.resetModules(); // Reset module cache for dynamic imports
     // **Disable Fake Timers**
     vi.useRealTimers();
});

// --- Test Suite ---
describe('InfoPanelHandler (uiInfoPanel.js)', () => {

    const mockObjectArg = { source: 'tmdb' };
    const testMovieData = { id: 'tmdb123', method: 'movie', title: 'Test Movie', overview: 'Desc', backdrop_path: '/backdrop.jpg', name: null };

    it('create() should initialize HTML structure using $() and reset internal state', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        expect(mockJquery).toHaveBeenCalledTimes(1);
        expect(mockJquery).toHaveBeenCalledWith(expect.stringContaining('<div class="new-interface-info">'));
        expect(handler.mdblistRatingsCache).toEqual({});
        expect(handler.mdblistRatingsPending).toEqual({});
    });

    it('update() should reset UI elements via jQuery', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         vi.clearAllMocks();
         handler.update(testMovieData);
         expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__head,.new-interface-info__details');
         expect(mockJqueryInstance.text).toHaveBeenCalledWith('---');
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.title);
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.overview);
    });

    it('update() should change background using Lampa.Background', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         handler.update(testMovieData);
         expect(mockBackgroundChange).toHaveBeenCalledTimes(1);
         expect(mockApiImg).toHaveBeenCalledWith(testMovieData.backdrop_path, 'w200');
         expect(mockBackgroundChange).toHaveBeenCalledWith(`mock/img/${testMovieData.backdrop_path}?size=w200`);
    });

    it('update() should call fetchMDBListRatings and then this.load() on success', async () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const loadSpy = vi.spyOn(handler, 'load');
        const mockFetchResult = { imdb: 7.0, error: null };
        // Ensure the mock function reference used by vi.doMock gets the behavior
        mockFetchMDBListRatings.mockResolvedValue(mockFetchResult);

        // DEBUG: Check mock right before action
        console.log('DEBUG update/fetch test: mockFetchMDBListRatings is defined?', typeof mockFetchMDBListRatings);
        console.log('DEBUG update/fetch test: mock implementation:', mockFetchMDBListRatings.getMockImplementation());

        await handler.update(testMovieData);

        // DEBUG: Check calls after action
        console.log('DEBUG update/fetch test: mockFetchMDBListRatings calls:', mockFetchMDBListRatings.mock.calls);

        // Assertions
        expect(mockFetchMDBListRatings).toHaveBeenCalledTimes(1); // <-- Still failing here previously
        expect(mockFetchMDBListRatings).toHaveBeenCalledWith(testMovieData);

        // Use runOnlyPendingTimers to allow microtasks (like .then) to run if needed
        await vi.runOnlyPendingTimersAsync(); // Or vi.runAllTimers() / await Promise resolve ticks

        expect(handler.mdblistRatingsCache[testMovieData.id]).toEqual(mockFetchResult);
        expect(handler.mdblistRatingsPending[testMovieData.id]).toBeUndefined();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledWith(testMovieData);
    });

    it('update() should call this.load() directly if id or method is missing', async () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const loadSpy = vi.spyOn(handler, 'load');

        const invalidData = { title: 'Invalid', overview: 'No ID' };
        await handler.update(invalidData); // Needs await if update becomes async implicitly

        expect(mockFetchMDBListRatings).not.toHaveBeenCalled();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledWith(invalidData);
    });

    it('load() should call TMDB API via network and then this.draw() on success', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const drawSpy = vi.spyOn(handler, 'draw');

        handler.load(testMovieData);

        // Assert: Check setTimeout was called (via fake timers)
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 300);

        // **FIX: Advance Timers** to execute the setTimeout callback
        console.log('DEBUG load/network test: Advancing timers...');
        vi.advanceTimersByTime(301); // Advance time by 301ms
        console.log('DEBUG load/network test: Timers advanced.');

        // Assert: Network call should have been initiated NOW
        expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1); // <-- Was failing here
        const tmdbSuccessCallback = mockTmdbNetworkSilent.mock.calls[0][1];
        expect(tmdbSuccessCallback).toBeInstanceOf(Function);

        // Arrange: Mock TMDB response
        const mockTmdbResponse = { ...testMovieData, vote_average: 8.5, genres: [{name: 'Action'}] };

        // Action: Trigger success callback
        tmdbSuccessCallback(mockTmdbResponse);

        // Assert: Check 'draw' call
        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
        expect(mockTmdbApi).toHaveBeenCalledWith(expect.stringContaining(`movie/${testMovieData.id}`));
        expect(mockTmdbKey).toHaveBeenCalled();
    });

     it('load() should use internal TMDB cache and call draw() without network request if data exists', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const drawSpy = vi.spyOn(handler, 'draw');
        const mockTmdbResponse = { ...testMovieData, vote_average: 8.5 };

        // Arrange: Call load once and simulate success to populate internal cache
        handler.load(testMovieData);
        // **FIX: Advance Timers** for the first load call
        console.log('DEBUG load/cache test (setup): Advancing timers...');
        vi.advanceTimersByTime(301);
        console.log('DEBUG load/cache test (setup): Timers advanced.');
        expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1); // <-- Was failing here
        mockTmdbNetworkSilent.mock.calls[0][1](mockTmdbResponse); // Trigger success
        expect(drawSpy).toHaveBeenCalledTimes(1);
        drawSpy.mockClear(); // Clear spy history
        vi.clearAllMocks(); // Clear network mock history

        // Action: Call load again
        handler.load(testMovieData);
        // **FIX: Advance timers again? No, should hit cache *before* setTimeout**
        // vi.advanceTimersByTime(301); // Should not be needed if cache hits

        // Assert: Network should NOT have been called this time
        expect(mockTmdbNetworkSilent).not.toHaveBeenCalled();
        // Assert: draw should have been called immediately with the cached TMDB data
        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
    });

    // Add more tests later

}); // End describe InfoPanelHandler
