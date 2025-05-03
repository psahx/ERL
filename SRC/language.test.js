// SRC/language.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the function to test
import { setupLanguages } from './language.js';

// Declare mock function variable - will be assigned in beforeEach
let mockLangAdd;

describe('Language Setup (language.js)', () => {

    beforeEach(() => {
        // Create a fresh mock function for Lampa.Lang.add for each test
        mockLangAdd = vi.fn();

        // Setup default mock structure for Lampa environment
        // Tests can modify window.Lampa for specific scenarios
        window.Lampa = {
            Lang: {
                add: mockLangAdd
                // Mock other Lampa.Lang properties if needed by setupLanguages in the future
            }
            // Add other Lampa namespaces if needed
        };

        // Clear any previous calls just in case (vi.fn() does this implicitly on creation, but good habit)
        // vi.clearAllMocks(); // Less critical here as we recreate the mock in beforeEach
    });

    it('should call Lampa.Lang.add with language strings object when Lampa.Lang exists', () => {
        // Arrange (Default setup in beforeEach is sufficient)
        // Act
        setupLanguages();

        // Assert
        // 1. Check if 'add' was called exactly once
        expect(mockLangAdd).toHaveBeenCalledTimes(1);

        // 2. Check it was called with an object
        expect(mockLangAdd).toHaveBeenCalledWith(expect.any(Object));

        // 3. Check if the passed object contains some expected top-level keys
        expect(mockLangAdd).toHaveBeenCalledWith(expect.objectContaining({
            mdblist_api_key_desc: expect.any(Object), // Check key exists and value is object
            additional_ratings_title: expect.any(Object),
            select_ratings_button_name: expect.any(Object),
            select_ratings_button_desc: expect.any(Object),
            select_ratings_dialog_title: expect.any(Object),
            full_notext: expect.objectContaining({ // Check sub-object content
                 en: expect.any(String),
                 ru: expect.any(String)
            })
        }));
    });

    it('should NOT call Lampa.Lang.add if Lampa.Lang object does not exist', () => {
        // Arrange: Modify the mock setup for this specific test case
        window.Lampa.Lang = undefined;

        // Act
        setupLanguages();

        // Assert
        expect(mockLangAdd).not.toHaveBeenCalled();
    });

    it('should NOT call Lampa.Lang.add and not throw an error if Lampa object itself does not exist', () => {
        // Arrange: Remove Lampa completely from the mock environment
        window.Lampa = undefined;

        // Act & Assert
        // Check that calling the function doesn't crash
        expect(() => setupLanguages()).not.toThrow();
        // Also verify 'add' wasn't somehow called
        expect(mockLangAdd).not.toHaveBeenCalled();
    });

});
