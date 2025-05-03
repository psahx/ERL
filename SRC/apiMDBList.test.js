// SRC/apiMDBList.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mock dependencies ---

// Mock our cache module using vi.mock
// IMPORTANT: This mock call must be at the top level, before any imports that might use cache.js
const mockGetCache = vi.fn();
const mockSetCache = vi.fn();
vi.mock('./cache.js', () => ({
    getCache: mockGetCache,
    setCache: mockSetCache,
}));

// Mock our config module (or import the real one)
// Using the real config for simplicity in this example
import { config } from './config.js';

// Mock necessary Lampa APIs
let mockStorageData = {}; // For Lampa.Storage.get (API Key)
const mockLampaStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);

// Mock Lampa.Reguest and its instance methods
let storedSilentSuccessCb = null;
let storedSilentErrorCb = null;
let storedSilentUrl = null;
let storedXhrStatus = null; // To simulate XHR status code for error callback
const mockSilent = vi.fn((url, successCb, errorCb) => {
    // Store URL and callbacks so tests can invoke them
    storedSilentUrl = url;
    storedSilentSuccessCb = successCb;
    storedSilentErrorCb = errorCb;
});
const mockRequestInstance = {
    clear: vi.fn(),
    timeout: vi.fn(),
    silent: mockSilent
};
const mockRequestConstructor = vi.fn(() => mockRequestInstance); // Mock constructor returns our mock instance

// --- Import the function under test AFTER mocks are set up ---
import { fetchMDBListRatings } from './apiMDBList.js';


// --- Test Suite ---
describe('API Client - fetchMDBListRatings (apiMDBList.js)', () => {

    // Define common test data
    const testMovieData = { id: 'tt12345', method: 'movie' };
    const testTvData = { id: 'tv67890', method: 'tv' };
    const testApiKey = 'TEST_API_KEY_123';

    // Runs before each test case ('it' block)
    beforeEach(() => {
        // Reset all mocks to clear call history and reset implementations
        vi.clearAllMocks();
        // Reset our mock storage for the API key
        mockStorageData = {};
        // Reset stored callbacks and URL from mockSilent
        storedSilentSuccessCb = null;
        storedSilentErrorCb = null;
        storedSilentUrl = null;
        storedXhrStatus = null;

        // Setup necessary Lampa mocks on window (using jsdom environment)
        window.Lampa = {
            Storage: {
                get: mockLampaStorageGet,
                // set/cache mocks are handled by vi.mock('./cache.js', ...) above
            },
            Reguest: mockRequestConstructor, // Assign mock constructor
        };
    });

    // --- Test Cases ---

    it('should resolve with error object if movieData is invalid (missing id)', async () => {
        const result = await fetchMDBListRatings({ method: 'movie' }); // Missing id
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    it('should resolve with error object if movieData is invalid (missing method)', async () => {
        const result = await fetchMDBListRatings({ id: 'tt12345' }); // Missing method
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    // Note: Testing missing Lampa components (Reguest/Storage) is harder now due to module scope.
    // We rely on the checks inside fetchMDBListRatings assuming window.Lampa exists.

    it('should return cached data immediately if available and valid', async () => {
        const cachedData = { imdb: 9.9, error: null };
        mockGetCache.mockReturnValue(cachedData); // Setup cache hit

        const result = await fetchMDBListRatings(testMovieData);

        expect(result).toEqual(cachedData); // Check result is cached data
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id); // Verify cache check
        expect(mockLampaStorageGet).not.toHaveBeenCalled(); // No API key needed
        expect(mockSilent).not.toHaveBeenCalled(); // No network call needed
        expect(mockSetCache).not.toHaveBeenCalled(); // Nothing new to cache
    });

    it('should resolve with error if API key is not configured in Lampa.Storage', async () => {
        mockGetCache.mockReturnValue(false); // Cache miss
        mockLampaStorageGet.mockReturnValue(null); // Simulate no API key stored

        const result = await fetchMDBListRatings(testMovieData);

        expect(result).toEqual({ error: "MDBList API Key not configured in Additional Ratings settings" });
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
        expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key'); // Verify API key check
        expect(mockSilent).not.toHaveBeenCalled(); // Network call should be skipped
        expect(mockSetCache).not.toHaveBeenCalled(); // Nothing to cache
    });

    // --- Tests for Cache Miss / Network Interaction ---
    describe('When Cache Misses and API Key Exists', () => {
        // Common setup for tests in this block
        beforeEach(() => {
            mockGetCache.mockReturnValue(false); // Ensure cache miss
            mockLampaStorageGet.mockReturnValue(testApiKey); // Ensure API key is available
        });

        it('should call API, process successful response, cache result, and resolve', async () => {
            // Initiate the fetch (returns a Promise)
            const fetchPromise = fetchMDBListRatings(testMovieData);

            // Verify network setup and call occurred
            expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key');
            expect(mockRequestConstructor).toHaveBeenCalledTimes(1); // Lampa.Reguest constructor called
            expect(mockRequestInstance.clear).toHaveBeenCalledTimes(1);
            expect(mockRequestInstance.timeout).toHaveBeenCalledWith(config.request_timeout);
            expect(mockSilent).toHaveBeenCalledTimes(1); // .silent method called

            // Verify URL construction
            expect(storedSilentUrl).toContain(config.api_url);
            expect(storedSilentUrl).toContain(`movie/${testMovieData.id}`); // Check type 'movie'
            expect(storedSilentUrl).toContain(`apikey=${testApiKey}`);
            // Verify callbacks were captured
            expect(storedSilentSuccessCb).toBeInstanceOf(Function);
            expect(storedSilentErrorCb).toBeInstanceOf(Function);

            // --- Simulate successful network response ---
            const mockApiResponse = {
                ratings: [
                    { source: 'imdb', value: 7.8 },
                    { source: 'metacritic', value: 85 },
                    { source: 'tmdb', value: null } // Test handling null value
                ]
            };
            storedSilentSuccessCb(mockApiResponse); // Manually trigger success callback

            // --- Assertions ---
            // Check the final resolved value of the promise
            const result = await fetchPromise;
            const expectedResult = {
                imdb: 7.8,
                metacritic: 85,
                // tmdb should be omitted as its value was null
                error: null
            };
            expect(result).toEqual(expectedResult);

            // Check that the result was cached
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testMovieData.id, expectedResult);
        });

        it('should handle API error in response, cache error, and resolve', async () => {
            const fetchPromise = fetchMDBListRatings(testTvData); // Use TV data

            // Verify network call was made (checks done in previous test)
            expect(mockSilent).toHaveBeenCalledTimes(1);
            expect(storedSilentUrl).toContain(`show/${testTvData.id}`); // Check type 'show'

            // --- Simulate API returning an error within the success response ---
            const mockApiResponse = { error: 'Rate Limit Exceeded' };
            storedSilentSuccessCb(mockApiResponse);

            // --- Assertions ---
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList API Error: Rate Limit Exceeded' };
            expect(result).toEqual(expectedResult);

            // Check that this type of error *is* cached
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testTvData.id, expectedResult);
        });

        it('should handle network failure (e.g., 503), cache error, and resolve', async () => {
            const fetchPromise = fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1); // Verify setup

            // --- Simulate network error callback ---
            // Pass mock XHR object with status and the status text/number
            storedSilentErrorCb({ status: 503 }, 503);

            // --- Assertions ---
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList request failed (Status: 503)' };
            expect(result).toEqual(expectedResult);

            // Check that this type of error *is* cached
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testMovieData.id, expectedResult);
        });

        it('should handle network failure (e.g., 403 Forbidden) and resolve WITHOUT caching', async () => {
            const fetchPromise = fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // --- Simulate network error callback for 403 ---
            storedSilentErrorCb({ status: 403 }, 403);

            // --- Assertions ---
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList request failed (Status: 403)' };
            expect(result).toEqual(expectedResult);

            // Check that cache was NOT updated for 403 error
            expect(mockSetCache).not.toHaveBeenCalled();
        });

         it('should handle API response error matching auth patterns and resolve WITHOUT caching', async () => {
            const fetchPromise = fetchMDBListRatings(testMovieData);
            expect(mockSilent).toHaveBeenCalledTimes(1);

            // --- Simulate API returning an error matching "Invalid API Key" ---
            const mockApiResponse = { error: 'Something went wrong: invalid api key.' };
            storedSilentSuccessCb(mockApiResponse);

             // --- Assertions ---
            const result = await fetchPromise;
            const expectedResult = { error: 'MDBList API Error: Something went wrong: invalid api key.' };
            expect(result).toEqual(expectedResult);

            // Check that cache was NOT updated for this error message
            expect(mockSetCache).not.toHaveBeenCalled();
        });
    }); // End describe 'When Cache Misses...'
}); // End top-level describe
