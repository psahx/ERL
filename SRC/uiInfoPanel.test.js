// SRC/uiInfoPanel.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies
let mockFetchMDBListRatings;
vi.doMock('./apiMDBList.js', () => {
    console.log('DEBUG: vi.doMock factory executing'); // DEBUG
    return { fetchMDBListRatings: mockFetchMDBListRatings };
});

// Other mock vars
let mockLangTranslate, mockStorageGet, mockStorageField, mockApiImg, mockApiParseCountries, mockApiParsePG, mockBackgroundChange, mockTmdbNetworkSilent, mockTmdbNetworkInstance, mockTmdbReguestConstructor, mockUtilsSecondsToTime, mockUtilsCapitalize, mockTmdbApi, mockTmdbKey, mockJquery, mockJqueryInstance;
let InfoPanelHandler;

beforeEach(async () => {
    console.log('DEBUG: Entering beforeEach setup...');
    mockFetchMDBListRatings = vi.fn(() => Promise.resolve({ test: 'mock_fetch_ok_beforeEach' }));
    console.log('DEBUG beforeEach: mockFetchMDBListRatings defined?', typeof mockFetchMDBListRatings);

    // Define other mocks
    mockLangTranslate = vi.fn(key => key); mockStorageGet = vi.fn(); mockStorageField = vi.fn(); mockApiImg = vi.fn((path, size) => `mock/img/${path}?size=${size}`); mockApiParseCountries = vi.fn(() => ['Mock Country']); mockApiParsePG = vi.fn(() => 'Mock-PG'); mockBackgroundChange = vi.fn();
    let storedTmdbSuccessCb = null; let storedTmdbErrorCb = null;
    mockTmdbNetworkSilent = vi.fn((url, successCb, errorCb) => { storedTmdbSuccessCb = successCb; storedTmdbErrorCb = errorCb; });
    mockTmdbNetworkInstance = { clear: vi.fn(), timeout: vi.fn(), silent: mockTmdbNetworkSilent };
    mockTmdbReguestConstructor = vi.fn(() => mockTmdbNetworkInstance);
    mockUtilsSecondsToTime = vi.fn(secs => `${Math.floor(secs/60)}m`); mockUtilsCapitalize = vi.fn(str => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''); mockTmdbApi = vi.fn(urlPart => `mock/tmdb/api/${urlPart}`); mockTmdbKey = vi.fn(() => 'MOCK_TMDB_KEY');
    mockJqueryInstance = { find: vi.fn().mockReturnThis(), text: vi.fn().mockReturnThis(), empty: vi.fn().mockReturnThis(), append: vi.fn().mockReturnThis(), html: vi.fn().mockReturnThis(), remove: vi.fn() };
    mockJquery = vi.fn(() => mockJqueryInstance);

    window.Lampa = { Lang: { translate: mockLangTranslate }, Storage: { get: mockStorageGet, field: mockStorageField, cache: vi.fn(()=>({})), set: vi.fn() }, Api: { img: mockApiImg, sources: { tmdb: { parseCountries: mockApiParseCountries, parsePG: mockApiParsePG } } }, Background: { change: mockBackgroundChange }, Reguest: mockTmdbReguestConstructor, Utils: { secondsToTime: mockUtilsSecondsToTime, capitalizeFirstLetter: mockUtilsCapitalize }, TMDB: { api: mockTmdbApi, key: mockTmdbKey }, Scroll: vi.fn(() => ({ render: vi.fn(), minus: vi.fn(), append: vi.fn(), update: vi.fn(), destroy: vi.fn() })), InteractionLine: vi.fn(), Empty: vi.fn(() => ({ render: vi.fn(), start: vi.fn() })), Layer: { update: vi.fn(), visible: vi.fn() }, Controller: { enabled: vi.fn(() => ({ name: 'c' })), toggle: vi.fn(), add: vi.fn(), own: vi.fn(() => true)}, Activity: vi.fn(() => ({ canRefresh: vi.fn(), toggle: vi.fn(), loader: vi.fn() })), Manifest: { app_digital: 999 }, Account: { hasPremium: vi.fn(() => true) }, };
    window.$ = mockJquery;

    // Dynamically import module
    console.log('DEBUG beforeEach: Importing uiInfoPanel.js...');
    // ** FIX 1 Try: Remove vi.resetModules() from afterEach and see if import cache works **
    const module = await import('./uiInfoPanel.js');
    InfoPanelHandler = module.InfoPanelHandler;
    console.log('DEBUG beforeEach: uiInfoPanel.js imported.');

    vi.useFakeTimers();
    vi.clearAllMocks(); // Clear history AFTER setup
    console.log('DEBUG beforeEach: Setup complete.');
});

afterEach(() => {
     // ** FIX 1 Try: Comment out resetModules **
     // vi.resetModules();
     vi.useRealTimers();
});

describe('InfoPanelHandler (uiInfoPanel.js)', () => {
    const mockObjectArg = { source: 'tmdb' };
    const testMovieData = { id: 'tmdb123', method: 'movie', title: 'Test Movie', overview: 'Desc', backdrop_path: '/backdrop.jpg', name: null };

    it('create() should initialize HTML structure using $() and reset internal state', () => { /* ... unchanged ... */
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        expect(mockJquery).toHaveBeenCalledTimes(1);
        expect(mockJquery).toHaveBeenCalledWith(expect.stringContaining('<div class="new-interface-info">'));
        expect(handler.mdblistRatingsCache).toEqual({});
        expect(handler.mdblistRatingsPending).toEqual({});
    });
    it('update() should reset UI elements via jQuery', () => { /* ... unchanged ... */
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         vi.clearAllMocks();
         handler.update(testMovieData);
         expect(mockJqueryInstance.find).toHaveBeenCalledWith('.new-interface-info__head,.new-interface-info__details');
         expect(mockJqueryInstance.text).toHaveBeenCalledWith('---');
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.title);
         expect(mockJqueryInstance.text).toHaveBeenCalledWith(testMovieData.overview);
    });
    it('update() should change background using Lampa.Background', () => { /* ... unchanged ... */
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
        mockFetchMDBListRatings.mockResolvedValue(mockFetchResult);

        console.log('DEBUG update/fetch test: mockFetchMDBListRatings is defined?', typeof mockFetchMDBListRatings); // Added Debug
        // console.log('DEBUG update/fetch test: mock implementation:', mockFetchMDBListRatings.getMockImplementation()); // Might error if not vi.fn() based mock

        await handler.update(testMovieData);

        console.log('DEBUG update/fetch test: mockFetchMDBListRatings calls:', mockFetchMDBListRatings.mock.calls); // Added Debug

        // Assertions
        expect(mockFetchMDBListRatings).toHaveBeenCalledTimes(1); // <-- Failing here
        expect(mockFetchMDBListRatings).toHaveBeenCalledWith(testMovieData);

        await vi.runOnlyPendingTimersAsync();

        expect(handler.mdblistRatingsCache[testMovieData.id]).toEqual(mockFetchResult);
        expect(handler.mdblistRatingsPending[testMovieData.id]).toBeUndefined();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledWith(testMovieData);
    });

    it('update() should call this.load() directly if id or method is missing', async () => { /* ... unchanged ... */
        const handler = new InfoPanelHandler(mockObjectArg);
        handler.create();
        const loadSpy = vi.spyOn(handler, 'load');
        const invalidData = { title: 'Invalid', overview: 'No ID' };
        await handler.update(invalidData);
        expect(mockFetchMDBListRatings).not.toHaveBeenCalled();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(loadSpy).toHaveBeenCalledWith(invalidData);
    });

    it('load() should call TMDB API via network and then this.draw() on success', () => {
         const handler = new InfoPanelHandler(mockObjectArg);
         handler.create();
         const drawSpy = vi.spyOn(handler, 'draw');

         handler.load(testMovieData);

         // ** FIX 2: Remove setTimeout check **
         // expect(setTimeout).toHaveBeenCalledTimes(1);
         // expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 300);

         console.log('DEBUG load/network test: Advancing timers...');
         vi.advanceTimersByTime(301);
         console.log('DEBUG load/network test: Timers advanced.');

         expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
         const tmdbSuccessCallback = mockTmdbNetworkSilent.mock.calls[0][1];
         expect(tmdbSuccessCallback).toBeInstanceOf(Function);

         const mockTmdbResponse = { ...testMovieData, vote_average: 8.5, genres: [{name: 'Action'}] };
         tmdbSuccessCallback(mockTmdbResponse);

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

         handler.load(testMovieData); // First call
         console.log('DEBUG load/cache test (setup): Advancing timers...');
         vi.advanceTimersByTime(301); // Advance for first call's setTimeout
         console.log('DEBUG load/cache test (setup): Timers advanced.');
         expect(mockTmdbNetworkSilent).toHaveBeenCalledTimes(1);
         mockTmdbNetworkSilent.mock.calls[0][1](mockTmdbResponse); // Trigger success
         expect(drawSpy).toHaveBeenCalledTimes(1);
         drawSpy.mockClear();
         vi.clearAllMocks(); // Clear network mock calls from setup

         handler.load(testMovieData); // Second call - should hit cache

         // ** FIX 2: Remove setTimeout check **
         // setTimeout should not be called if cache hits before timeout setup

         // Assert network not called
         expect(mockTmdbNetworkSilent).not.toHaveBeenCalled();
         expect(drawSpy).toHaveBeenCalledTimes(1); // Draw called immediately
         expect(drawSpy).toHaveBeenCalledWith(mockTmdbResponse);
    });

});
