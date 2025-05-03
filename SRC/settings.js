// SRC/settings.js
'use strict';
console.log("PsahxRatingsPlugin: Executing settings.js");

// Note: This module primarily interacts with Lampa APIs (SettingsApi, Lang, Storage, Select, Controller)
// It doesn't directly import our other custom modules like config or cache,
// unless specific logic like clearing cache on API key change is added later.

/**
 * Defines and registers the plugin's settings UI components with Lampa,
 * including the rating provider selection dialog logic.
 */
export function registerSettings() {
    // Check for necessary Lampa components first
    if (!window.Lampa || !Lampa.SettingsApi || !Lampa.Lang || !Lampa.Storage || !Lampa.Select || !Lampa.Controller) {
        console.error("PsahxRatingsPlugin [settings.js]: Missing required Lampa API components (SettingsApi, Lang, Storage, Select, Controller). Cannot register settings.");
        return;
    }

    // --- Helper function to display the multi-select dialog ---
    // This function is internal to the settings module logic.
    function showRatingProviderSelection() {
        // Define the available rating providers
        const providers = [
            { title: 'IMDb', id: 'show_rating_imdb', default: true },
            { title: 'TMDB', id: 'show_rating_tmdb', default: true },
            // { title: 'KinoPoisk', id: 'show_rating_kp', default: true }, // Example if added later
            { title: 'Rotten Tomatoes (Critics)', id: 'show_rating_tomatoes', default: false },
            { title: 'Rotten Tomatoes (Audience)', id: 'show_rating_audience', default: false },
            { title: 'Metacritic', id: 'show_rating_metacritic', default: false },
            { title: 'Trakt', id: 'show_rating_trakt', default: false },
            { title: 'Letterboxd', id: 'show_rating_letterboxd', default: false },
            { title: 'Roger Ebert', id: 'show_rating_rogerebert', default: false }
            // Add other potential future providers here
        ];

        // Prepare items array for Lampa.Select.show
        let selectItems = providers.map(provider => {
            // Read current state from storage, use defined default if not set
            let storedValue = Lampa.Storage.get(provider.id, provider.default);
            // Ensure boolean comparison works correctly even if storage returns strings like "true"
            let isChecked = (storedValue === true || storedValue === 'true');
            return {
                title: provider.title,
                id: provider.id,          // Use the storage key as the item ID
                checkbox: true,           // Display as a checkbox
                checked: isChecked,       // Set initial state based on storage
                default: provider.default // Pass default for toggle logic in onCheck
            };
        });

        // Get current controller context to return correctly with 'Back'
        const currentController = Lampa.Controller.enabled().name;

        // Use Lampa's built-in Select component
        Lampa.Select.show({
            title: Lampa.Lang.translate('select_ratings_dialog_title'), // Translated title
            items: selectItems,
            onBack: function () {
                Lampa.Controller.toggle(currentController || 'settings'); // Go back to previous controller
            },
            onCheck: function (item) { // Handler for when ANY checkbox is toggled
                // Read the definitive OLD state from storage using item's ID
                let oldValue = Lampa.Storage.get(item.id, item.default);
                let oldStateIsChecked = (oldValue === true || oldValue === 'true');

                // Calculate the NEW state (toggle)
                let newStateIsChecked = !oldStateIsChecked;

                // Save the NEW boolean state directly to Lampa.Storage under the specific key
                Lampa.Storage.set(item.id, newStateIsChecked);

                // Update the visual state of the checkbox in the dialog UI
                item.checked = newStateIsChecked;

                // No need to call Lampa.Settings.update() here, direct storage manipulation is sufficient
                // for the 'create().draw' function which reads these keys directly.
            }
        });
    } // --- End of showRatingProviderSelection function ---


    // --- Register Settings Components ---

    // 1. Add the Settings Category
    Lampa.SettingsApi.addComponent({
        component: 'additional_ratings', // Unique identifier for the category
        name: Lampa.Lang.translate('additional_ratings_title'), // Display name
        icon: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24" xml:space="preserve" width="32" height="32" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>' // Icon
    });

    // 2. Add the API Key parameter under the new category
    Lampa.SettingsApi.addParam({
        component: 'additional_ratings', // Target the category
        param: {
            name: 'mdblist_api_key',          // Storage key for the API key
            type: 'input',                   // Input field type
            'default': '',                   // Default value (empty string)
             values: {},
            placeholder: 'Enter your MDBList API Key' // Placeholder text
        },
        field: {
            name: 'MDBList API Key',          // Display name in settings
            description: Lampa.Lang.translate('mdblist_api_key_desc') // Use translated description
        },
        onChange: function() {
            // Optional: Define actions when the API key changes.
            // Lampa.Settings.update(); // May be needed if other parts react to settings changes via Lampa's system
            // Consider if clearing the cache is desired here:
            // import('https://psahx.github.io/ERL/SRC/cache.js').then(cache => cache.setCache(/* how to clear? need specific function */));
            // Requires async handling or a synchronous clear function in cache module. For now, do nothing extra.
        }
    });

    // 3. Add Button to Open Rating Selection dialog
    Lampa.SettingsApi.addParam({
        component: 'additional_ratings', // Target the category
        param: {
            name: 'select_ratings_button',   // Unique name for this parameter
            type: 'button'                   // Type is button
        },
        field: {
            name: Lampa.Lang.translate('select_ratings_button_name'),       // Button text
            description: Lampa.Lang.translate('select_ratings_button_desc') // Description below button
        },
        onChange: function () {
            // Action on button click: call the internal function
            showRatingProviderSelection();
        }
    });

    // Optional: console.log("PsahxRatingsPlugin: Settings components registered.");

} // --- End of registerSettings function ---
