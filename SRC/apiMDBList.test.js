// SRC/apiMDBList.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Mock dependencies ---

// **Step 1: Define the variables that will hold the mock functions FIRST.**
const mockGetCache = vi.fn();
const mockSetCache = vi.fn();

// **Step 2: NOW, use vi.mock. Its factory function can reference the variables above.**
// Vitest hoists this vi.mock call, but the variables should be accessible
// within the factory function's scope when it eventually runs.
vi.mock('./cache.js', () => ({
    getCache: mockGetCache,
    setCache: mockSetCache,
}));

// Mock config (importing real one)
import { config } from './config.js';

// Mock Lampa APIs
let mockStorageData = {}; // For Lampa.Storage.get (API Key)
const mockLampaStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);

// Mock Lampa.Reguest
let storedSilentSuccessCb = null;
let storedSilentErrorCb = null;
let storedSilentUrl = null;
let storedXhrStatus = null;
const mockSilent = vi.fn((url, successCb, errorCb) => {
    storedSilentUrl = url;
    storedSilentSuccessCb = successCb;
    storedSilentErrorCb = errorCb;
});
const mockRequestInstance = {
    clear: vi.fn(),
    timeout: vi.fn(),
    silent: mockSilent
};
const mockRequestConstructor = vi.fn(() => mockRequestInstance);

// --- Import function under test *after* mocks are defined/applied ---
// Because vi.mock('./cache.js', ...) is hoisted, the './cache.js' import inside
// apiMDBList.js will receive the mocked version.
import { fetchMDBListRatings } from './apiMDBList.js';


// --- Test Suite ---
describe('API Client - fetchMDBListRatings (apiMDBList.js)', () => {

    const testMovieData = { id: 'tt12345', method: 'movie' };
    const testTvData = { id: 'tv67890', method: 'tv' };
    const testApiKey = 'TEST_API_KEY_123';

    beforeEach(() => {
        // Reset all mocks (including those defined outside beforeEach)
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

        // **Important: Reset mock implementations/return values if needed**
        // Since mockGetCache/SetCache are defined outside, ensure they are reset
        // if previous tests might have set specific behavior (e.g., mockReturnValue)
        mockGetCache.mockReset(); // Resets implementation and calls
        mockSetCache.mockReset(); // Resets implementation and calls
        // Reset other mocks if necessary, though clearAllMocks handles call history.
    });

    // --- Test Cases ---

    it('should resolve with error object if movieData is invalid (missing id)', async () => {
        const result = await fetchMDBListRatings({ method: 'movie' });
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    it('should resolve with error object if movieData is invalid (missing method)', async () => {
        const result = await fetchMDBListRatings({ id: 'tt12345' });
        expect(result).toEqual({ error: 'Invalid input data for fetch' });
        expect(mockGetCache).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
    });

    it('should return cached data immediately if available and valid', async () => {
        const cachedData = { imdb: 9.9, error: null };
        // Set the return value for the mock function for this test
        mockGetCache.mockReturnValue(cachedData);

        const result = await fetchMDBListRatings(testMovieData);

        expect(result).toEqual(cachedData);
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
        expect(mockLampaStorageGet).not.toHaveBeenCalled();
        expect(mockSilent).not.toHaveBeenCalled();
        expect(mockSetCache).not.toHaveBeenCalled();
    });

    it('should resolve with error if API key is not configured in Lampa.Storage', async () => {
        mockGetCache.mockReturnValue(false); // Cache miss
        mockLampaStorageGet.mockReturnValue(null); // No API key stored

        const result = await fetchMDBListRatings(testMovieData);

        expect(result).toEqual({ error: "MDBList API Key not configured in Additional Ratings settings" });
        expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
        expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key');
        expect(mockSilent).not.toHaveBeenCalled();
        expect(mockSetCache).not.toHaveBeenCalled();
    });

    // --- Tests for Cache Miss / Network Interaction ---
    describe('When Cache Misses and API Key Exists', () => {
        beforeEach(() => {
            // Common setup: ensure cache miss and API key exists
            mockGetCache.mockReturnValue(false);
            mockLampaStorageGet.mockReturnValue(testApiKey);
        });

        it('should call API, process successful response, cache result, and resolve', async () => {
            const fetchPromise = fetchMDBListRatings(testMovieData);

            // Verify prerequisites were checked and network call initiated
            expect(mockGetCache).toHaveBeenCalledWith(testMovieData.id);
            expect(mockLampaStorageGet).toHaveBeenCalledWith('mdblist_api_key');
            expect(mockSilent).toHaveBeenCalledTimes(1); // Network call made
            expect(storedSilentSuccessCb).toBeInstanceOf(Function); // Callbacks captured

            // Simulate successful network response
            const mockApiResponse = {
                ratings: [ { source: 'imdb', value: 7.8 }, { source: 'metacritic', value: 85 } ]
            };
            storedSilentSuccessCb(mockApiResponse); // Trigger success callback

            // Assertions
            const result = await fetchPromise; // Wait for promise to resolve
            const expectedResult = { imdb: 7.8, metacritic: 85, error: null };
            expect(result).toEqual(expectedResult); // Check processed result

            // Check caching
            expect(mockSetCache).toHaveBeenCalledTimes(1);
            expect(mockSetCache).toHaveBeenCalledWith(testMovieData.id, expectedResult);
        });

        it('should handle API error in response, cache error, and resolve', async () => {
            const fetchPromise = fetchMDBListRatings(testTvData); // Use TV data
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
            const fetchPromise = fetchMDBListRatings(testMovieData);
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
            const fetchPromise = fetchMDBListRatings(testMovieData);
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
            const fetchPromise = fetchMDBListRatings(testMovieData);
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
