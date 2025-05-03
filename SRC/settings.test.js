// SRC/settings.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
let mockControllerEnabled; // Note: Default function assigned in beforeEach
let mockControllerToggle;

// --- Test Suite ---
describe('Settings Registration and Interaction (settings.js)', () => {

    // Runs before each test case ('it' block) in this suite
    beforeEach(() => {
        // Reset the fake storage
        mockStorageData = {};
        // Clear call history etc. for all mocks defined in the previous run
        vi.clearAllMocks();

        // Define fresh mocks for each test to ensure isolation
        mockLangTranslate = vi.fn(key => `translated_${key}`);
        mockSettingsApiAddComponent = vi.fn();
        mockSettingsApiAddParam = vi.fn();
        mockStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);
        mockStorageSet = vi.fn((key, value) => { mockStorageData[key] = value; });
        mockSelectShow = vi.fn();
        // Default mock behavior for enabled - returns a default name
        mockControllerEnabled = vi.fn(() => ({ name: 'default_controller_name_from_beforeEach' }));
        mockControllerToggle = vi.fn();

        // Assign fresh mocks to window.Lampa (using jsdom environment)
        window.Lampa = {
            Lang: { translate: mockLangTranslate },
            SettingsApi: { addComponent: mockSettingsApiAddComponent, addParam: mockSettingsApiAddParam },
            Storage: { get: mockStorageGet, set: mockStorageSet },
            Select: { show: mockSelectShow },
            Controller: { enabled: mockControllerEnabled, toggle: mockControllerToggle }
        };
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
        let selectOptions; // To store args passed to Select.show

        beforeEach(() => {
            // This beforeEach runs AFTER the outer one.
            // Register settings to get the button's onChange handler reference.
            registerSettings();
            const buttonParamCall = mockSettingsApiAddParam.mock.calls.find(call => call[0]?.param?.name === 'select_ratings_button');
            buttonOnChange = buttonParamCall?.[0]?.onChange;
            if (typeof buttonOnChange !== 'function') {
                throw new Error("Could not find button onChange handler during test setup.");
            }
            // Execute the button click here to populate selectOptions for all tests in this block
            buttonOnChange();
            expect(mockSelectShow).toHaveBeenCalled(); // Ensure Select.show was called
            selectOptions = mockSelectShow.mock.calls[0][0]; // Grab the options object passed to it
            // Clear mocks AFTER this setup specific to this describe block is done
            vi.clearAllMocks();
        });

        it('should call Lampa.Select.show when the button onChange is triggered (check from beforeEach)', () => {
            // This test now mainly verifies the beforeEach worked as expected
            expect(selectOptions).toBeDefined(); // selectOptions should be defined by beforeEach
            expect(selectOptions).toEqual(expect.objectContaining({
                title: 'translated_select_ratings_dialog_title',
                items: expect.any(Array),
                onBack: expect.any(Function),
                onCheck: expect.any(Function)
            }));
             // Verify items array structure passed to Select.show
             expect(selectOptions.items.length).toBeGreaterThan(5); // Check number of providers
             expect(selectOptions.items[0]).toEqual(expect.objectContaining({
                  id: 'show_rating_imdb', title: 'IMDb', checkbox: true
             }));
        });

        it('should call Lampa.Storage.set with TRUE when onCheck toggles from FALSE', () => {
            // Arrange: Get the callback from options populated in beforeEach
            const onCheckCallback = selectOptions.onCheck;
            expect(onCheckCallback).toBeInstanceOf(Function);
            // Arrange: Set initial stored value to false for IMDb
            mockStorageData['show_rating_imdb'] = false;
            const mockItem = { id: 'show_rating_imdb', checked: false, default: true };

            // Action: Call the extracted onCheck callback
            onCheckCallback(mockItem);

            // Assertions
            expect(mockStorageSet).toHaveBeenCalledTimes(1);
            expect(mockStorageSet).toHaveBeenCalledWith('show_rating_imdb', true);
            expect(mockItem.checked).toBe(true);
        });

        it('should call Lampa.Storage.set with FALSE when onCheck toggles from TRUE', () => {
             // Arrange: Get the callback from options populated in beforeEach
             const onCheckCallback = selectOptions.onCheck;
             expect(onCheckCallback).toBeInstanceOf(Function);
             // Arrange: Set initial stored value to true for TMDB
             mockStorageData['show_rating_tmdb'] = true;
             const mockItem = { id: 'show_rating_tmdb', checked: true, default: true };

             // Action: Call callback
             onCheckCallback(mockItem);

             // Assertions
             expect(mockStorageSet).toHaveBeenCalledTimes(1);
             expect(mockStorageSet).toHaveBeenCalledWith('show_rating_tmdb', false);
             expect(mockItem.checked).toBe(false);
        });

        // --- Test for the onBack callback (Attempt 5: Direct function replacement) ---
        it('should call Lampa.Controller.toggle when onBack is called', () => {
             // Arrange: Get the onBack callback from options populated in beforeEach
             const onBackCallback = selectOptions.onBack;
             expect(onBackCallback).toBeInstanceOf(Function);

             const expectedControllerName = 'settings';

             // **Arrange: Directly replace the 'enabled' function on the mock object**
             const originalEnabledFn = window.Lampa.Controller.enabled; // Store original mock from beforeEach
             // Replace with a simple function returning exactly what this test needs
             window.Lampa.Controller.enabled = () => {
                 console.log(`DEBUG: Using TEMPORARY Lampa.Controller.enabled mock! Returning { name: '${expectedControllerName}' }`);
                 return { name: expectedControllerName };
             };

             // **DEBUG:** Log function state before calling
             console.log('DEBUG: window.Lampa.Controller.enabled is temporarily:', window.Lampa.Controller.enabled.toString());

             // Ensure the toggle mock is clean before the action
             mockControllerToggle.mockClear();

             try {
                 // Action: Call the onBack callback
                 console.log('DEBUG: Calling onBackCallback...');
                 onBackCallback();
                 console.log('DEBUG: onBackCallback finished.');

                 // Assertions
                 expect(mockControllerToggle).toHaveBeenCalledTimes(1);
                 // **DEBUG:** Log actual calls to toggle mock
                 const toggleCalls = mockControllerToggle.mock.calls;
                 console.log('DEBUG: mockControllerToggle calls:', JSON.stringify(toggleCalls));
                 expect(mockControllerToggle).toHaveBeenCalledWith(expectedControllerName);

             } finally {
                 // **Cleanup: Restore the original mock function behavior**
                 window.Lampa.Controller.enabled = originalEnabledFn;
                 console.log('DEBUG: Restored original Lampa.Controller.enabled mock.');
             }
        });

    }); // End describe('Select Ratings Button Interaction')
}); // End top-level describe
