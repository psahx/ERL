// SRC/apiMDBList.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// --- Mock dependencies ---

// Define variables for mock functions FIRST.
const mockGetCache = vi.fn();
const mockSetCache = vi.fn();

// Use vi.doMock (NOT hoisted) AFTER declaring variables it needs.
// This MUST run before apiMDBList.js is imported.
vi.doMock('./cache.js', () => ({
    getCache: mockGetCache,
    setCache: mockSetCache,
}));

// Mock config (importing real one)
import { config } from './config.js';

// Mock Lampa APIs
let mockStorageData = {}; // For Lampa.Storage.get (API Key)
let mockLampaStorageGet; // Assigned in beforeEach
let storedSilentSuccessCb = null;
let storedSilentErrorCb = null;
let storedSilentUrl = null;
let storedXhrStatus = null;
let mockSilent;
let mockRequestInstance;
let mockRequestConstructor;

// Declare variable to hold the dynamically imported module under test
let apiModule;

// --- Setup using async beforeEach ---
beforeEach(async () => {
    // 1. Reset mocks defined outside this scope (or define them here)
    vi.clearAllMocks(); // Clear call history etc first
    mockGetCache.mockReset(); // Reset implementation and calls for mocks used in doMock factory
    mockSetCache.mockReset();

    // 2. Define other mocks needed for the test environment
    mockStorageData = {};
    mockLampaStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);
    storedSilentSuccessCb = null;
    storedSilentErrorCb = null;
    storedSilentUrl = null;
    storedXhrStatus = null;
    mockSilent = vi.fn((url, successCb, errorCb) => {
        storedSilentUrl = url;
        storedSilentSuccessCb = successCb;
        storedSilentErrorCb = errorCb;
    });
    mockRequestInstance = { clear: vi.fn(), timeout: vi.fn(), silent: mockSilent };
    mockRequestConstructor = vi.fn(() => mockRequestInstance);

    // 3. Setup window.Lampa with all mocks
    window.Lampa = {
        Storage: {
            get: mockLampaStorageGet,
        },
        Reguest: mockRequestConstructor,
    };

    // 4. Dynamically import the module under test *AFTER* mocks are applied
    // ** Use a clean relative path WITHOUT the query string **
    apiModule = await import('./apiMDBList.js'); // <-- Query string removed

});

// Cleanup mocks registered with vi.doMock after each test
afterEach(() => {
     vi.resetModules(); // Resets module cache, important when using vi.doMock
});


// --- Test Suite ---
describe('API Client - fetchMDBListRatings (apiMDBList.js)', () => {

    // Test data defined once
    const testMovieData = { id: 'tt12345', method: 'movie' };
    const testTvData = { id: 'tv67890', method: 'tv' };
    const testApiKey = 'TEST_API_KEY_123';

    // --- Test Cases ---
    // ** Use apiModule.fetchMDBListRatings in all tests **
    it('should resolve with error object if movieData is invalid (missing id)', async () => {
        // Call function via the dynamically imported module object
        const result = await apiModule.fetchMDBListRatings({ method: 'movie' });
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    it('should resolve with error object if movieData is invalid (missing method)', async () => {
        const result = await apiModule.fetchMDBListRatings({ id: 'tt12345' });
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    it('should return cached data immediately if available and valid', async () => {
        const cachedData = { imdb: 9.9, error: null };
        mockGetCache.mockReturnValue(cachedData); // Setup cache hit

        const result = await apiModule.fetchMDBListRatings(testMovieData);

        expect(result).toEqual(cachedData); // Check result is cached data
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id); // Verify cache check
        expect(mockLampaStorageGet).not.toHaveBeenCalled(); // No API key needed
        expect(mockSilent).not.toHaveBeenCalled(); // No network call needed
        expect(mockSetCache).not.toHaveBeenCalled(); // Nothing new to cache
    });

    it('should resolve with error if API key is not configured in Lampa.Storage', async () => {
        mockGetCache.mockReturnValue(false); // Cache miss
        mockLampaStorageGet.mockReturnValue(null); // Simulate no API key stored

        const result = await apiModule.fetchMDBListRatings(testMovieData);

        expect(result).toEqual({ error: "MDBList API Key not configured in Additional Ratings settings" });
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
        expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key'); // Verify API key check
        expect(mockSilent).not.toHaveBeenCalled(); // Network call should be skipped
        expect(mockSetCache).not.toHaveBeenCalled(); // Nothing to cache
    });

    // --- Tests for Cache Miss / Network Interaction ---
    describe('When Cache Misses and API Key Exists', () => {
        beforeEach(() => {
            // Common setup for tests in this block: ensure cache miss and API key exists
            // This runs AFTER the main beforeEach above
            mockGetCache.mockReturnValue(false);
            mockLampaStorageGet.mockReturnValue(testApiKey);
        });

        it('should call API, process successful response, cache result, and resolve', async () => {
            // Initiate the fetch (returns a Promise)
            const fetchPromise = apiModule.fetchMDBListRatings(testMovieData);

            // Verify prerequisites were checked and network call initiated
            expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
            expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key');
            expect(mockSilent).toHaveBeenCalledTimes(1); // Network call made
            expect(storedSilentSuccessCb).toBeInstanceOf(Function); // Callbacks captured

            // Simulate successful network response
            const mockApiResponse = {
                ratings: [ { source: 'imdb', value: 7.8 }, { source: 'metacritic', value: 85 }, { source: 'tmdb', value: null } ]
            };
            storedSilentSuccessCb(mockApiResponse); // Trigger success callback

            // Assertions
            const result = await fetchPromise; // Wait for promise to resolve
            const expectedResult = { imdb: 7.8, metacritic: 85, error: null };
            expect(result).toEqual(expectedResult); // Check processed result

            // Check caching
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testMovieData.id, expectedResult);
            // Check URL used (optional but good)
            expect(storedSilentUrl).toContain(`movie/${testMovieData.id}`);
        });

        it('should handle API error in response, cache error, and resolve', async () => {
            const fetchPromise = apiModule.fetchMDBListRatings(testTvData); // Use TV data
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // Simulate API error response
            const mockApiResponse = { error: 'Invalid ID format' };
            storedSilentSuccessCb(mockApiResponse);

            // Assertions
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList API Error: Invalid ID format' };
            expect(result).toEqual(expectedResult);

            // Check error is cached (since not auth related)
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testTvData.id, expectedResult);
        });

        it('should handle network failure (e.g., 503), cache error, and resolve', async () => {
            const fetchPromise = apiModule.fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // Simulate network error callback
            storedSilentErrorCb({ status: 503 }, 503);

            // Assertions
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList request failed (Status: 503)' };
            expect(result).toEqual(expectedResult);

            // Check error is cached
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testMovieData.id, expectedResult);
        });

        it('should handle network failure (e.g., 401 Unauthorized) and resolve WITHOUT caching', async () => {
            const fetchPromise = apiModule.fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // Simulate 401 network error
            storedSilentErrorCb({ status: 401 }, 401);

            // Assertions
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList request failed (Status: 401)' };
            expect(result).toEqual(expectedResult);

            // Check cache was NOT called
            expect(mockSetCache).not.toHaveBeenCalled();
        });

         it('should handle API response error matching auth patterns and resolve WITHOUT caching', async () => {
            const fetchPromise = apiModule.fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // Simulate API response indicating invalid key
            const mockApiResponse = { error: 'Invalid API Key provided.' };
            storedSilentSuccessCb(mockApiResponse);

             // Assertions
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList API Error: Invalid API Key provided.' };
            expect(result).toEqual(expectedResult);

            // Check cache was NOT called
            expect(mockSetCache).not.toHaveBeenCalled();
        });
    }); // End describe 'When Cache Misses...'
}); // End top-level describe

