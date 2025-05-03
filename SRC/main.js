// SRC/main.js
'use strict';

// --- Import necessary setup functions and the main UI component handler ---
// Adjust paths if needed (e.g., use full URLs if relative paths fail)
import { setupLanguages } from './language.js';
import { registerSettings } from './settings.js';
import { injectStyles } from './styles.js';
import { InfoPanelHandler } from './uiInfoPanel.js'; // Import the exported class/function

// ============================================================================
// == PASTE THE ENTIRE 'component' FUNCTION DEFINITION FROM YOUR ORIGINAL    ==
// == SCRIPT HERE.                                                           ==
// ==                                                                          ==
// == IMPORTANT: Inside the 'component' function, find the line(s) where     ==
// ==   'info' is created (likely in 'this.create' or 'this.build'):          ==
// ==   info = new create(object);                                             ==
// == AND CHANGE IT TO use the imported handler name:                          ==
// ==   info = new InfoPanelHandler(object);                                   ==
// ==                                                                          ==
// == Also, ensure the 'destroy' method within 'component' calls:            ==
// ==   if (info) info.destroy();                                             ==
// ============================================================================

function component(object) { // <-- START OF PASTED 'component' FUNCTION
    // Example start (replace with your full 'component' code):
    var network = new Lampa.Reguest();
    var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
    var items = [];
    var html = $('<div class="new-interface"><img class="full-start__background"></div>');
    var active = 0;
    // Check for Lampa.Manifest existence before accessing app_digital
    var newlampa = window.Lampa && Lampa.Manifest && Lampa.Manifest.app_digital >= 166;
    var info; // Will hold the InfoPanelHandler instance
    var lezydata;
    // Check for Lampa.Storage existence before accessing field
    var viewall = window.Lampa && Lampa.Storage && (Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse');
    var background_img = html.find('.full-start__background');
    var background_last = '';
    var background_timer;

    // --- Make sure 'this.create' instantiates InfoPanelHandler ---
     this.create = function () {
         if (!window.Lampa || !Lampa.Scroll) { // Add checks for used Lampa components
              console.error("PsahxRatingsPlugin [main.js/component.create]: Missing Lampa components.");
              return;
         }
         // Instantiate the imported InfoPanelHandler
         info = new InfoPanelHandler(object); // <-- Ensure this uses the imported name
         info.create(); // Call the create method of the info panel instance
         scroll.minus(info.render());
     };

    // --- PASTE THE REST of the 'component' methods here ---
    // this.build = function (data) { /* PASTE ORIGINAL, ensure info exists */ };
    // this.empty = function () { /* PASTE ORIGINAL */ };
    // this.loadNext = function () { /* PASTE ORIGINAL */ };
    // this.push = function () { /* PASTE ORIGINAL */ };
    // this.background = function (elem) { /* PASTE ORIGINAL */ };
    // this.append = function (element) { /* PASTE ORIGINAL */ };
    // this.back = function () { /* PASTE ORIGINAL */ };
    // this.down = function () { /* PASTE ORIGINAL */ };
    // this.up = function () { /* PASTE ORIGINAL */ };
    // this.start = function () { /* PASTE ORIGINAL */ };
    // this.refresh = function () { /* PASTE ORIGINAL */ };
    // this.pause = function () { /* PASTE ORIGINAL */ };
    // this.stop = function () { /* PASTE ORIGINAL */ };
    // this.render = function () { return html; };
    // this.destroy = function () {
    //     /* PASTE ORIGINAL 'destroy' CODE */
    //     // --- CRITICAL: Ensure this line is present ---
    //     if (info) info.destroy();
    //     // --- End Critical Line ---
    //     /* ... rest of original destroy ... */
    // };
    // --- Example placeholders ---
     this.build = function (data) { /* PASTE ORIGINAL build CODE */ };
     this.empty = function () { /* PASTE ORIGINAL empty CODE */ };
     this.loadNext = function () { /* PASTE ORIGINAL loadNext CODE */ };
     this.push = function () { /* PASTE ORIGINAL push CODE */ };
     this.background = function (elem) { /* PASTE ORIGINAL background CODE */ };
     this.append = function (element) { /* PASTE ORIGINAL append CODE */ };
     this.back = function () { /* PASTE ORIGINAL back CODE */ };
     this.down = function () { /* PASTE ORIGINAL down CODE */ };
     this.up = function () { /* PASTE ORIGINAL up CODE */ };
     this.start = function () { /* PASTE ORIGINAL start CODE */ };
     this.refresh = function () { /* PASTE ORIGINAL refresh CODE */ };
     this.pause = function () { /* PASTE ORIGINAL pause CODE */ };
     this.stop = function () { /* PASTE ORIGINAL stop CODE */ };
     this.render = function () { return html; };
     this.destroy = function () { /* PASTE ORIGINAL destroy CODE, ensure 'if(info) info.destroy();' is included */ };

} // --- END OF PASTED 'component' FUNCTION ---


/**
 * Main asynchronous initialization function for the plugin.
 */
async function initializePlugin() {
    console.log("PsahxRatingsPlugin: Initializing...");

    // --- Basic Lampa Component Checks ---
    // Ensure essential Lampa objects needed for initialization exist
    if (!window.Lampa || !Lampa.Utils || !Lampa.Lang || !Lampa.Storage || !Lampa.Template || !Lampa.InteractionLine || !Lampa.Manifest || !Lampa.Account || !Lampa.InteractionMain) {
        console.error("PsahxRatingsPlugin [main.js]: Missing essential Lampa components. Cannot initialize.");
        return;
    }

    // --- Run Setup Functions ---
    // These are synchronous based on our current modules
    try {
        setupLanguages();
        registerSettings();
        injectStyles();
    } catch (e) {
        console.error("PsahxRatingsPlugin [main.js]: Error running setup functions.", e);
        // Optional: Decide if initialization should halt
    }

    // --- Hook into Lampa ---
    // Store the original Lampa InteractionMain before overwriting
    const originalInteractionMain = Lampa.InteractionMain;

    // Replace Lampa's InteractionMain
    Lampa.InteractionMain = function (object) {
        // Determine if the new interface should be used based on original conditions
        let useNewInterface = true; // Default to using it
        try {
            // Add checks safely
            if (!(object.source == 'tmdb' || object.source == 'cub')) useNewInterface = false;
            if (window.innerWidth < 767) useNewInterface = false;
            if (!Lampa.Account.hasPremium()) useNewInterface = false;
            if (Lampa.Manifest.app_digital < 153) useNewInterface = false;
        } catch (e) {
            console.error("PsahxRatingsPlugin [main.js]: Error checking conditions for InteractionMain override. Falling back to original.", e);
            useNewInterface = false; // Fallback to original if checks fail
        }


        if (useNewInterface) {
            // Use our enhanced component (which uses InfoPanelHandler internally)
            try {
                 return new component(object);
            } catch (e) {
                 console.error("PsahxRatingsPlugin [main.js]: Error creating new 'component' instance. Falling back to original.", e);
                 // Fallback to original if our component fails to instantiate
                 return new originalInteractionMain(object);
            }
        } else {
            // Use the original Lampa InteractionMain
            return new originalInteractionMain(object);
        }
    };

    // Mark the plugin as ready using the original flag
    window.plugin_interface_ready = true;
    console.log("PsahxRatingsPlugin: Initialization complete. InteractionMain potentially replaced.");

} // --- End of initializePlugin function ---


// --- Plugin Execution ---
// Use the original check to prevent multiple initializations
if (!window.plugin_interface_ready) {
    // Use a try-catch for the initialization logic
    try {
         initializePlugin(); // Call the async initialization function
    } catch (error) {
         // Catch any synchronous errors during the initial call setup itself
         console.error("PsahxRatingsPlugin [main.js]: Uncaught error during initialization trigger.", error);
         if (window.Lampa && Lampa.Noty) { // Check if Noty exists before using
             Lampa.Noty.show("Critical error initializing ratings plugin.", { time: 10000 });
         }
    }
} else {
     console.log("PsahxRatingsPlugin: Plugin already initialized or flag was set externally.");
}
