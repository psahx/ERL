// SRC/cache.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the functions to be tested
import { getCache, setCache } from './cache.js';
// Import the config as cache functions depend on it
import { config } from './config.js';

// --- Mock Lampa Environment ---
// We need to simulate Lampa.Storage for these tests

// In-memory object to act as our fake Lampa storage
let mockStorageData = {};

// Create mock functions using Vitest's vi.fn()
const mockLampaStorageGet = vi.fn((key, defaultValue) => {
    // Simulate Lampa.Storage.get behavior
    return mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue;
});

const mockLampaStorageSet = vi.fn((key, value) => {
    // Simulate Lampa.Storage.set behavior
    mockStorageData[key] = value;
});

// Simulate Lampa.Storage.cache - it likely just returns the object stored under the key
// Our code then modifies this object and saves it back using Lampa.Storage.set
const mockLampaStorageCache = vi.fn((key, limit, defaultValue) => {
     return mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue;
});

// --- Assign mocks to the global scope ---
// Vitest runs tests in a Node.js environment by default.
// We assign our mock Lampa object to the 'global' object.
global.Lampa = {
    Storage: {
        get: mockLampaStorageGet,
        set: mockLampaStorageSet,
        cache: mockLampaStorageCache,
    }
    // Add other Lampa objects/functions here if cache.js ever needs them
};


// --- Test Suite for cache.js ---
describe('Cache Functions (cache.js)', () => {

    // Runs before each test case ('it' block)
    beforeEach(() => {
        // Reset the fake storage to ensure tests are independent
        mockStorageData = {};
        // Clear call history for all mock functions
        vi.clearAllMocks();
        // Re-assign mock just in case a test modified global.Lampa (optional safety)
         global.Lampa.Storage = { get: mockLampaStorageGet, set: mockLampaStorageSet, cache: mockLampaStorageCache };
    });

    // --- Tests for setCache ---
    describe('setCache', () => {
        it('should store data with a timestamp under the correct cache key', () => {
            const testId = 'tt12345';
            const testData = { imdb: 8.1, tmdb: 8.5 };
            const expectedCacheKey = config.cache_key;

            // Action: Call the function under test
            setCache(testId, testData);

            // Assertion 1: Check if Lampa.Storage.set was called correctly
            expect(mockLampaStorageSet).toHaveBeenCalledTimes(1); // Called exactly once
            // Check it was called with the key from config and *some* object
            expect(mockLampaStorageSet).toHaveBeenCalledWith(expectedCacheKey, expect.any(Object));

            // Assertion 2: Verify the structure stored in our mock storage
            const storedCacheObject = mockStorageData[expectedCacheKey];
            expect(storedCacheObject).toBeDefined(); // The cache object should exist
            expect(storedCacheObject[testId]).toBeDefined(); // The entry for testId should exist
            expect(storedCacheObject[testId].data).toEqual(testData); // Data should match
            // Check timestamp is close to Date.now() (allow ~20ms margin for execution time)
            expect(storedCacheObject[testId].timestamp).toBeCloseTo(Date.now(), -2);
        });

        it('should overwrite existing data for the same ID', () => {
            const testId = 'tt12345';
            const initialData = { imdb: 1.0 };
            const updatedData = { tmdb: 9.9 };
            const expectedCacheKey = config.cache_key;

            // Set initial data
            setCache(testId, initialData);
            // Set updated data
            setCache(testId, updatedData);

            // Check the stored data
            const storedCacheObject = mockStorageData[expectedCacheKey];
            expect(storedCacheObject[testId].data).toEqual(updatedData); // Should be updated data
            expect(storedCacheObject[testId].timestamp).toBeCloseTo(Date.now(), -2); // Timestamp updated
            // Check set was called twice total in this test
            expect(mockLampaStorageSet).toHaveBeenCalledTimes(2);
        });
    });

    // --- Tests for getCache ---
    describe('getCache', () => {
        const testId = 'tt98765';
        const validData = { metacritic: 85 };
        const cacheKey = config.cache_key;

        it('should return false if item is not in cache', () => {
            // Action & Assertion
            expect(getCache(testId)).toBe(false);
            // Ensure storage 'set' wasn't called (no data to delete)
            expect(mockLampaStorageSet).not.toHaveBeenCalled();
        });

        it('should return the data if item is in cache and not expired', () => {
            // Arrange: Pre-populate cache using setCache (which uses our mocks)
            setCache(testId, validData);
            // Clear mock history caused by the setup call to setCache
            vi.clearAllMocks();

            // Action
            const result = getCache(testId);

            // Assertions
            expect(result).toEqual(validData); // Should return the stored data
            // Ensure storage 'set' wasn't called (no expiry deletion)
            expect(mockLampaStorageSet).not.toHaveBeenCalled();
        });

        it('should return false if item is in cache but expired', () => {
             // Arrange: Manually set up mock storage with an expired timestamp
             const expiredTimestamp = Date.now() - config.cache_time - 5000; // 5 seconds past expiry
             mockStorageData[cacheKey] = {
                 [testId]: {
                     timestamp: expiredTimestamp,
                     data: validData // Store some data along with the old timestamp
                 },
                 // Add another item to ensure only the expired one is deleted
                 'tt_other': {
                     timestamp: Date.now(),
                     data: { score: 1 }
                 }
             };

             // Action
             const result = getCache(testId);

             // Assertion 1: Should return false for the expired item
             expect(result).toBe(false);

             // Assertion 2: Check that Lampa.Storage.set WAS called to save the modified cache
             expect(mockLampaStorageSet).toHaveBeenCalledTimes(1);
             expect(mockLampaStorageSet).toHaveBeenCalledWith(cacheKey, expect.any(Object));

             // Assertion 3: Verify the expired item was actually removed from mock storage
             const finalStorageCacheObject = mockStorageData[cacheKey];
             expect(finalStorageCacheObject).toBeDefined();
             expect(finalStorageCacheObject[testId]).toBeUndefined(); // Expired item gone
             expect(finalStorageCacheObject['tt_other']).toBeDefined(); // Other item remains
        });

        it('should return false if Lampa.Storage is not available/mocked', () => {
             // Arrange: Undefine the mock Storage
             global.Lampa.Storage = undefined;

             // Action & Assertion
             expect(getCache(testId)).toBe(false);

             // Cleanup: Restore mock for subsequent tests (if any)
             global.Lampa.Storage = { get: mockLampaStorageGet, set: mockLampaStorageSet, cache: mockLampaStorageCache };
         });
    });
});
