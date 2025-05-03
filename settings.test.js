// SRC/settings.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the function to test
import { registerSettings } from './settings.js';

// --- Mock Lampa Environment ---
let mockStorageData = {}; // Simulate Lampa.Storage data

// Create mock functions for Lampa APIs using Vitest spies (vi.fn)
const mockLangTranslate = vi.fn(key => `translated_${key}`); // Return predictable string
const mockSettingsApiAddComponent = vi.fn();
const mockSettingsApiAddParam = vi.fn();
const mockStorageGet = vi.fn((key, defaultValue) => mockStorageData.hasOwnProperty(key) ? mockStorageData[key] : defaultValue);
const mockStorageSet = vi.fn((key, value) => { mockStorageData[key] = value; });
const mockSelectShow = vi.fn(); // Mock for Lampa.Select.show
const mockControllerEnabled = vi.fn(() => ({ name: 'mock_controller' })); // Simulate getting current controller
const mockControllerToggle = vi.fn();

// --- Test Suite ---
describe('Settings Registration and Interaction (settings.js)', () => {

    // Runs before each test case ('it' block)
    beforeEach(() => {
        // Reset the fake storage
        mockStorageData = {};
        // Clear call history and implementations for all mocks
        vi.clearAllMocks();

        // Assign fresh mocks to window.Lampa (using jsdom environment)
        // Ensures mocks are clean for each test
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
        // Check the arguments passed to addComponent
        expect(mockSettingsApiAddComponent).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            name: 'translated_additional_ratings_title', // Verify translation was used
            icon: expect.stringContaining('<svg') // Check that an SVG icon string was passed
        }));
    });

    it('should register the API key parameter using SettingsApi.addParam', () => {
        registerSettings(); // Action

        // Check arguments for the API key parameter registration
        expect(mockSettingsApiAddParam).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            param: expect.objectContaining({ name: 'mdblist_api_key', type: 'input', 'default': '' }),
            field: expect.objectContaining({ name: 'MDBList API Key', description: 'translated_mdblist_api_key_desc' }),
            onChange: expect.any(Function) // Verify onChange handler exists
        }));
    });

    it('should register the select ratings button parameter using SettingsApi.addParam', () => {
        registerSettings(); // Action

        // Check arguments for the button parameter registration
        expect(mockSettingsApiAddParam).toHaveBeenCalledWith(expect.objectContaining({
            component: 'additional_ratings',
            param: expect.objectContaining({ name: 'select_ratings_button', type: 'button' }),
            field: expect.objectContaining({
                name: 'translated_select_ratings_button_name',
                description: 'translated_select_ratings_button_desc'
            }),
            onChange: expect.any(Function) // Verify onChange handler exists
        }));
    });

    // --- Interaction Tests ---
    describe('Select Ratings Button Interaction', () => {
        let buttonOnChange;

        beforeEach(() => {
            // Register settings to get the button's onChange handler
            registerSettings();
            // Find the specific call to addParam for the button
            const buttonParamCall = mockSettingsApiAddParam.mock.calls.find(call => call[0]?.param?.name === 'select_ratings_button');
            // Store the onChange handler for tests in this block
            buttonOnChange = buttonParamCall?.[0]?.onChange;
            // Basic check that we found the handler
            if (typeof buttonOnChange !== 'function') {
                throw new Error("Could not find button onChange handler in mock calls.");
            }
            // Clear mocks again AFTER setup to isolate interaction tests
            vi.clearAllMocks();
        });

        it('should call Lampa.Select.show when the button onChange is triggered', () => {
            // Action: Trigger the button's onChange
            buttonOnChange();

            // Assertions
            expect(mockSelectShow).toHaveBeenCalledTimes(1);
            // Verify the structure of the object passed to Select.show
            expect(mockSelectShow).toHaveBeenCalledWith(expect.objectContaining({
                title: 'translated_select_ratings_dialog_title',
                items: expect.any(Array),
                onBack: expect.any(Function),
                onCheck: expect.any(Function)
            }));
            // Check that items were generated based on providers (at least check length)
            const selectArgs = mockSelectShow.mock.calls[0][0];
            expect(selectArgs.items.length).toBeGreaterThan(5); // Based on the providers list
            expect(selectArgs.items[0].id).toBe('show_rating_imdb'); // Check first item ID
        });

        it('should call Lampa.Storage.set with TRUE when onCheck toggles from FALSE', () => {
            // Arrange: Simulate button click to get Select.show arguments
            buttonOnChange();
            const selectOptions = mockSelectShow.mock.calls[0][0];
            const onCheckCallback = selectOptions.onCheck;
            // Arrange: Set initial stored value to false for IMDb
            mockStorageData['show_rating_imdb'] = false;
            // Arrange: Define the mock item passed by Lampa.Select when checkbox is clicked
            const mockItem = { id: 'show_rating_imdb', checked: false, default: true };

            // Action: Call the onCheck callback simulates user checking the box
            onCheckCallback(mockItem);

            // Assertions
            expect(mockStorageSet).toHaveBeenCalledTimes(1);
            // Check that storage was updated with the toggled value (false -> true)
            expect(mockStorageSet).toHaveBeenCalledWith('show_rating_imdb', true);
            // Check that the item's checked state was visually updated
            expect(mockItem.checked).toBe(true);
        });

        it('should call Lampa.Storage.set with FALSE when onCheck toggles from TRUE', () => {
            // Arrange: Simulate button click
            buttonOnChange();
            const selectOptions = mockSelectShow.mock.calls[0][0];
            const onCheckCallback = selectOptions.onCheck;
            // Arrange: Set initial stored value to true for TMDB
            mockStorageData['show_rating_tmdb'] = true;
            const mockItem = { id: 'show_rating_tmdb', checked: true, default: true };

            // Action: Call the onCheck callback simulates user unchecking the box
            onCheckCallback(mockItem);

            // Assertions
            expect(mockStorageSet).toHaveBeenCalledTimes(1);
            // Check that storage was updated with the toggled value (true -> false)
            expect(mockStorageSet).toHaveBeenCalledWith('show_rating_tmdb', false);
            expect(mockItem.checked).toBe(false); // Item state updated visually
        });

        it('should call Lampa.Controller.toggle with correct controller when onBack is called', () => {
             // Arrange: Simulate button click
             buttonOnChange();
             const selectOptions = mockSelectShow.mock.calls[0][0];
             const onBackCallback = selectOptions.onBack;
             // Arrange: Set what Lampa.Controller.enabled() should return
             const expectedControllerName = 'settings';
             mockControllerEnabled.mockReturnValue({ name: expectedControllerName });

             // Action: Call the onBack callback
             onBackCallback();

             // Assertions
             expect(mockControllerToggle).toHaveBeenCalledTimes(1);
             expect(mockControllerToggle).toHaveBeenCalledWith(expectedControllerName);
        });
    });
});
