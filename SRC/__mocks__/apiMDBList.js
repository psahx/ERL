// SRC/__mocks__/apiMDBList.js
import { vi } from 'vitest';

// Create the mock function we will control from our tests
export const mockFetchMDBListRatings = vi.fn();

// Export the mock function under the original name
// This is what uiInfoPanel.js will import automatically when mocked
export const fetchMDBListRatings = mockFetchMDBListRatings;
