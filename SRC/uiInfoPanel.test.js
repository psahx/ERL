// SRC/uiInfoPanel.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// --- Tell Vitest to use the manual mock for apiMDBList.js ---
// This finds SRC/__mocks__/apiMDBList.js automatically.
// MUST be before importing uiInfoPanel.js or the mock itself.
vi.mock('./apiMDBList.js');

// --- Import the MOCK function DIRECTLY from the mocked path ---
// Vitest intercepts this and gives us the mock defined in __mocks__/apiMDBList.js
import { mockFetchMDBListRatings } from './apiMDBList.js';

// --- Import the module under test (can be static now) ---
import { InfoPanelHandler } from './uiInfoPanel.js';

// --- Other Mocks (Lampa, jQuery etc.) ---
// (Declare variables as before)
let mockLangTranslate, mockStorageGet, mockStorageField, mockApiImg, mockApiParseCountries, mockApiParsePG, mockBackgroundChange, mockTmdbNetworkSilent, mockTmdbNetworkInstance, mockTmdbReguestConstructor, mockUtilsSecondsToTime, mockUtilsCapitalize, mockTmdbApi, mockTmdbKey, mockJquery, mockJqueryInstance;

// --- Setup Test Environment ---
beforeEach(() => { // No longer needs async

    // 1. Reset/Define Mocks for Lampa/jQuery etc.
    mockLangTranslate = vi.fn(key => key);
    mockStorageGet = vi.fn();
    mockStorageField = vi.fn();
    mockApiImg = vi.fn((path, size) => `mock/img/${path}?size=${size}`);
    mockApiParseCountries = vi.fn(() => ['Mock Country']);
    mockApiParsePG = vi.fn(() => 'Mock-PG');
    mockBackgroundChange = vi.fn();
    let storedTmdbSuccessCb = null; let storedTmdbErrorCb = null; // Keep local if only needed here
    mockTmdbNetworkSilent = vi.fn((url, successCb, errorCb) => { storedTmdbSuccessCb = successCb; storedTmdbErrorCb = errorCb; });
    mockTmdbNetworkInstance = { clear: vi.fn(), timeout: vi.fn(), silent: mockTmdbNetworkSilent };
    mockTmdbReguestConstructor = vi.fn(() => mockTmdbNetworkInstance);
    mockUtilsSecondsToTime = vi.fn(secs => `${Math.floor(secs/60)}m`);
    mockUtilsCapitalize = vi.fn(str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
    mockTmdbApi = vi.fn(urlPart => `mock/tmdb/api/${urlPart}`);
    mockTmdbKey = vi.fn(() => 'MOCK_TMDB_KEY');
    mockJqueryInstance = { find: vi.fn().mockReturnThis(), text: vi.fn().mockReturnThis(), empty: vi.fn().mockReturnThis(), append: vi.fn().mockReturnThis(), html: vi.fn().mockReturnThis(), remove: vi.fn() };
    mockJquery = vi.fn(() => mockJqueryInstance);

    // 2. Assign mocks to window object
    window.Lampa = {
        Lang: { translate: mockLangTranslate }, Storage: { get: mockStorageGet, field: mockStorageField, cache: vi.fn(()=>({})), set: vi.fn() }, Api: { img: mockApiImg, sources: { tmdb: { parseCountries: mockApiParseCountries, parsePG: mockApiParsePG } } }, Background: { change: mockBackgroundChange }, Reguest: mockTmdbReguestConstructor, Utils: { secondsToTime: mockUtilsSecondsToTime, capitalizeFirstLetter: mockUtilsCapitalize }, TMDB: { api: mockTmdbApi, key: mockTmdbKey }, Scroll: vi.fn(() => ({ render: vi.fn(), minus: vi.fn(), append: vi.fn(), update: vi.fn(), destroy: vi.fn() })), InteractionLine: vi.fn(), Empty: vi.fn(() => ({ render: vi.fn(), start: vi.fn() })), Layer: { update: vi.fn(), visible: vi.fn() }, Controller: { enabled: vi.fn(() => ({ name: 'c' })), toggle: vi.fn(), add: vi.fn(), own: vi.fn(() => true)}, Activity: vi.fn(() => ({ canRefresh: vi.fn(), toggle: vi.fn(), loader: vi.fn() })), Manifest: { app_digital: 999 }, Account: { hasPremium: vi.fn(() => true) },
    };
    window.$ = mockJquery;

    // 3. **Reset the explicitly imported mock function**
    mockFetchMDBListRatings.mockReset();
    mockFetchMDBListRatings.mockResolvedValue({ test: 'mock_fetch_ok_beforeEach' }); // Default success

    // 4. Enable Fake Timers
    vi.useFakeTimers();

    // 5. Clear other mocks if needed (clearAllMocks clears spies too)
    vi.clearAllMocks(); // Still useful for clearing call history on Lampa/jQuery mocks
});

// Cleanup after each test
afterEach(() => {
     // No vi.resetModules() needed with this mock strategy
     vi.useRealTimers(); // Disable fake timers
});

// --- Test Suite ---
describe('InfoPanelHandler (uiInfoPanel.js)', () => {

    const mockObjectArg = { source: 'tmdb' };
    const testMovieData = { id: 'tmdb123', method: 'movie', title: 'Test Movie', overview: 'Desc', backdrop_path: '/backdrop.jpg', name: null };

    // --- Test Cases ---
    // Tests remain the same, but now interact with the imported 'mockFetchMDBListRatings'

    it('create() should initialize HTML structure using $() and reset internal state', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        expect(mockJquery).toHaveBeenCalledTimes(1);
        expect(handler.mdblistRatingsCache).toEqual({});
        // ... other assertions ...
    });

    it('update() should reset UI elements via jQuery', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        vi.clearAllMocks();
        handler.update(testMovieData);
        expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__head,.new-interface-info__details');
        // ... other assertions ...
    });

    it('update() should change background using Lampa.Background', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         handler.update(testMovieData);
         expect(mockBackgroundChange).toHaveBeenCalledTimes(1);
         // ... other assertions ...
    });

    it('update() should call fetchMDBListRatings and then this.load() on success', async () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const loadSpy = vi.spyOn(handler, 'load');
        const mockFetchResult = { imdb: 7.0, error: null };
        // Set behavior on the imported mock function
        mockFetchMDBListRatings.mockResolvedValue(mockFetchResult);

        await handler.update(testMovieData);

        // Assertions use the imported mock function
        expect(mockFetchMDBListRatings).toHaveBeenCalledTimes(1); // <-- Hopefully passes now!
        expect(mockFetchMDBListRatings).toHaveBeenCalledWith(testMovieData);

        await vi.runOnlyPendingTimersAsync(); // Allow promises to resolve

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
         await handler.update(invalidData);

         expect(mockFetchMDBListRatings).not.toHaveBeenCalled(); // Check the imported mock
         expect(loadSpy).toHaveBeenCalledTimes(1);
         // ... other assertions ...
    });

    it('load() should call TMDB API via network and then this.draw() on success', () => {
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const drawSpy = vi.spyOn(handler, 'draw');
        handler.load(testMovieData);
        vi.advanceTimersByTime(301); // Advance timer

        expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
        const tmdbSuccessCallback = mockTmdbNetworkSilent.mock.calls[0][1];
        const mockTmdbResponse = { ...testMovieData, vote_average: 8.5 };
        tmdbSuccessCallback(mockTmdbResponse);

        expect(drawSpy).toHaveBeenCalledTimes(1);
        expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
        // ... other assertions ...
    });

     it('load() should use internal TMDB cache and call draw() without network request if data exists', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         const drawSpy = vi.spyOn(handler, 'draw');
         const mockTmdbResponse = { ...testMovieData, vote_average: 8.5 };

         // Arrange: Call load once and simulate success
         handler.load(testMovieData);
         vi.advanceTimersByTime(301);
         expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
         mockTmdbNetworkSilent.mock.calls[0][1](mockTmdbResponse);
         expect(drawSpy).toHaveBeenCalledTimes(1);
         drawSpy.mockClear();
         vi.clearAllMocks();

         // Action: Call load again
         handler.load(testMovieData);

         // Assert: Network not called, draw called
         expect(mockTmdbNetworkSilent).not.toHaveBeenCalled();
         expect(drawSpy).toHaveBeenCalledTimes(1);
         expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
    });

    // Add more tests later

}); // End describe InfoPanelHandler
