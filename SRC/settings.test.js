// SRC/settings.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import the function to test
import { registerSettings } from './settings.js';

// --- Mock Lampa Environment ---
let mockStorageData = {}; // Simulate Lampa.Storage data

// Declare variables for mock functions - they will be assigned fresh in beforeEach
let mockLangTranslate;
let mockSettingsApiAddComponent;
let mockSettingsApiAddParam;
let mockStorageGet;
let mockStorageSet;
let mockSelectShow;
let mockControllerEnabled;
let mockControllerToggle;

// --- Test Suite ---
describe('Settings Registration and Interaction (settings.js)', () => {

    // Runs before each test case ('it' block) in this suite
    beforeEach(() => {
        // Reset the fake storage
        mockStorageData = {};
        // Define fresh mocks for each test to ensure isolation
        mockLangTranslate = vi.fn(key => `translated_${key}`);
        mockSettingsApiAddComponent = vi.fn();
        mockSettingsApiAddParam = vi.fn();
        mockStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);
        mockStorageSet = vi.fn((key, value) => { mockStorageData[key] = value; });
        mockSelectShow = vi.fn();
        mockControllerEnabled = vi.fn(() => ({ name: 'default_controller_name' })); // Default mock behavior
        mockControllerToggle = vi.fn();

        // Assign fresh mocks to window.Lampa (using jsdom environment)
        window.Lampa = {
            Lang: { translate: mockLangTranslate },
            SettingsApi: { addComponent: mockSettingsApiAddComponent, addParam: mockSettingsApiAddParam },
            Storage: { get: mockStorageGet, set: mockStorageSet },
            Select: { show: mockSelectShow },
            Controller: { enabled: mockControllerEnabled, toggle: mockControllerToggle }
        };

        // Optional: Clear mocks if defined outside, though redefining here handles reset.
        // vi.clearAllMocks(); // Can be used if needed, but redefinition covers it.
    });

    // --- Registration Tests ---
    it('should register the settings category using SettingsApi.addComponent', () => {
        registerSettings(); // Action

        expect(mockSettingsApiAddComponent).toHaveBeenCalledTimes(1);
        expect(mockSettingsApiAddComponent).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            name: 'translated_additional_ratings_title',
            icon: expect.stringContaining('<svg')
        }));
    });

    it('should register the API key parameter using SettingsApi.addParam', () => {
        registerSettings(); // Action

        expect(mockSettingsApiAddParam).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            param: expect.objectContaining({ name: 'mdblist_api_key', type: 'input', 'default': '' }),
            field: expect.objectContaining({ name: 'MDBList API Key', description: 'translated_mdblist_api_key_desc' }),
            onChange: expect.any(Function)
        }));
    });

    it('should register the select ratings button parameter using SettingsApi.addParam', () => {
        registerSettings(); // Action

        expect(mockSettingsApiAddParam).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            param: expect.objectContaining({ name: 'select_ratings_button', type: 'button' }),
            field: expect.objectContaining({
                name: 'translated_select_ratings_button_name',
                description: 'translated_select_ratings_button_desc'
            }),
            onChange: expect.any(Function)
        }));
    });

    // --- Interaction Tests (Nested Suite) ---
    describe('Select Ratings Button Interaction', () => {
        let buttonOnChange; // To store the button handler

        beforeEach(() => {
            // This beforeEach runs AFTER the outer one.
            // Register settings to get the button's onChange handler reference.
            registerSettings();
            const buttonParamCall = mockSettingsApiAddParam.mock.calls.find(call => call[0]?.param?.name === 'select_ratings_button');
            buttonOnChange = buttonParamCall?.[0]?.onChange;
            if (typeof buttonOnChange !== 'function') {
                throw new Error("Could not find button onChange handler during test setup.");
            }
            // Clear mocks AFTER this setup, before specific tests run
            vi.clearAllMocks();
        });

        it('should call Lampa.Select.show when the button onChange is triggered', () => {
            // Action: Trigger the button's onChange IN THE TEST
            buttonOnChange();

            // Assertions
            expect(mockSelectShow).toHaveBeenCalledTimes(1);
            expect(mockSelectShow).toHaveBeenCalledWith(expect.objectContaining({
                title: 'translated_select_ratings_dialog_title',
                items: expect.any(Array),
                onBack: expect.any(Function),
                onCheck: expect.any(Function)
            }));
            // Verify items array structure passed to Select.show
            const selectArgs = mockSelectShow.mock.calls[0][0];
            expect(selectArgs.items.length).toBeGreaterThan(5); // Check number of providers
            expect(selectArgs.items[0]).toEqual(expect.objectContaining({
                 id: 'show_rating_imdb', title: 'IMDb', checkbox: true
            }));
        });

        it('should call Lampa.Storage.set with TRUE when onCheck toggles from FALSE', () => {
            // Arrange: Set initial stored value to false for IMDb
            mockStorageData['show_rating_imdb'] = false;

            // Action: Trigger button -> This calls showRatingProviderSelection which calls Lampa.Select.show
            buttonOnChange();
            expect(mockSelectShow).toHaveBeenCalledTimes(1); // Ensure mock was called
            const selectOptions = mockSelectShow.mock.calls[0][0]; // Get options passed to mock
            const onCheckCallback = selectOptions.onCheck; // Extract the onCheck callback
            expect(onCheckCallback).toBeInstanceOf(Function); // Verify it's a function

            // Arrange: Define the mock item passed by Lampa.Select when checkbox is clicked
            const mockItem = { id: 'show_rating_imdb', checked: false, default: true }; // State *before* user clicks

            // Action: Call the extracted onCheck callback simulates user checking the box
            onCheckCallback(mockItem);

            // Assertions
            expect(mockStorageSet).toHaveBeenCalledTimes(1);
            // Check storage was updated with the *new* toggled state (false -> true)
            expect(mockStorageSet).toHaveBeenCalledWith('show_rating_imdb', true);
            // Check the callback updated the item's visual state
            expect(mockItem.checked).toBe(true);
        });

        it('should call Lampa.Storage.set with FALSE when onCheck toggles from TRUE', () => {
             // Arrange: Set initial stored value to true for TMDB
             mockStorageData['show_rating_tmdb'] = true;

             // Action: Trigger button -> get options
             buttonOnChange();
             expect(mockSelectShow).toHaveBeenCalledTimes(1);
             const selectOptions = mockSelectShow.mock.calls[0][0];
             const onCheckCallback = selectOptions.onCheck;
             expect(onCheckCallback).toBeInstanceOf(Function);

             // Arrange: Define the mock item state before user unchecks
             const mockItem = { id: 'show_rating_tmdb', checked: true, default: true };

             // Action: Call callback simulates user unchecking the box
             onCheckCallback(mockItem);

             // Assertions
             expect(mockStorageSet).toHaveBeenCalledTimes(1);
             // Check storage updated with toggled state (true -> false)
             expect(mockStorageSet).toHaveBeenCalledWith('show_rating_tmdb', false);
             expect(mockItem.checked).toBe(false);
        });

        it('should call Lampa.Controller.toggle when onBack is called', () => {
             // Action: Trigger button -> get options
             buttonOnChange();
             expect(mockSelectShow).toHaveBeenCalledTimes(1);
             const selectOptions = mockSelectShow.mock.calls[0][0]; // Get options passed to mock
             const onBackCallback = selectOptions.onBack; // Extract the onBack callback
             expect(onBackCallback).toBeInstanceOf(Function);

             const expectedControllerName = 'settings';
             // Arrange: Use spyOn to modify the mock method behaviour *just for the next call*
             // This targets the 'enabled' method on the Controller mock object
             const enabledSpy = vi.spyOn(window.Lampa.Controller, 'enabled');
             enabledSpy.mockReturnValueOnce({ name: expectedControllerName }); // Set specific return value

             // Action: Call the extracted onBack callback
             onBackCallback();

             // Assertions
             expect(mockControllerToggle).toHaveBeenCalledTimes(1);
             expect(mockControllerToggle).toHaveBeenCalledWith(expectedControllerName); // Check it was called with 'settings'

             enabledSpy.mockRestore(); // Clean up the spy afterwards
        });
    }); // End describe('Select Ratings Button Interaction')
}); // End top-level describe
