// SRC/main.js
'use strict';
// Log that the file itself started parsing/executing
console.log('--- PsahxRatingsPlugin: main.js EXECUTING ---');

// Wrap the main logic in an IIFE for scope safety
(function () {
    console.log('--- PsahxRatingsPlugin: IIFE executing ---');

    // Ensure Lampa exists before proceeding further
    if (typeof window.Lampa === 'undefined') {
         console.error('PsahxRatingsPlugin: Lampa environment not found!');
         return;
    }

    // Check if plugin already ran using the original flag name
    // Do this check *before* defining functions or doing imports
    if (window.plugin_interface_ready) {
        console.log("PsahxRatingsPlugin: Plugin already initialized (plugin_interface_ready flag was set).");
        return;
    }

    // --- PASTE YOUR FULL 'component' FUNCTION DEFINITION HERE ---
    // Make sure it uses 'new InfoPanelHandler(...)' internally.
    // It now accepts InfoPanelHandler as the second argument.
    function component(object, InfoPanelHandler) {
         console.log('PsahxRatingsPlugin: component function creating instance...');
         let info;
         let scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
         let items = [];
         let html = $('<div class="new-interface"><img class="full-start__background"></div>');
         let active = 0;
         let newlampa = Lampa.Manifest.app_digital >= 166;
         let lezydata;
         let viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse';
         let background_img = html.find('.full-start__background');
         let background_last = '';
         let background_timer;

         this.create = function () {
              console.log('PsahxRatingsPlugin: component.create executing...');
              if (!InfoPanelHandler) {
                   console.error("COMPONENT ERROR: InfoPanelHandler reference not available!");
                   // You might want basic HTML creation here as a fallback
                   html = $('<div>Error: InfoPanelHandler not loaded</div>'); // Basic error display
                   return; // Stop creation if handler missing
              }
               console.log('PsahxRatingsPlugin: component.create() calling new InfoPanelHandler');
              info = new InfoPanelHandler(object); // Instantiate using passed Handler
              info.create();
              scroll.minus(info.render()); // Ensure info.render() returns something valid
              console.log('PsahxRatingsPlugin: component.create completed.');
         };

         // --- PASTE THE REST OF YOUR ORIGINAL 'component' METHODS HERE ---
         // (build, empty, loadNext, push, background, append, back, down, up, start, refresh, pause, stop, render, destroy)
         // Ensure destroy calls 'if (info) info.destroy();'

         // Example placeholder for build (replace with your actual code)
         this.build = function(data) {
             console.log('PsahxRatingsPlugin: component.build executing...');
             if (!info) this.create(); // Ensure info is created
             var _this2 = this; lezydata = data; data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this)); html.append(info.render()); html.append(scroll.render()); if (newlampa) { Lampa.Layer.update(html); Lampa.Layer.visible(scroll.render(true)); scroll.onEnd = this.loadNext.bind(this); scroll.onWheel = function (step) { if (!Lampa.Controller.own(_this2)) _this2.start(); if (step > 0) _this2.down(); else if (active > 0) _this2.up(); }; } if (items.length > 0 && items[0] && items[0].data) { active = 0; info.update(items[active].data); this.background(items[active].data); } if(Lampa.Activity) Lampa.Activity.loader(false); this.activity.toggle();
         };
         this.empty = function () { console.log('PsahxRatingsPlugin: component.empty executing...'); /* PASTE ORIGINAL empty CODE */ };
         this.loadNext = function () { console.log('PsahxRatingsPlugin: component.loadNext executing...'); /* PASTE ORIGINAL loadNext CODE */ };
         this.push = function () { /* PASTE ORIGINAL push CODE */ };
         this.background = function (elem) { /* PASTE ORIGINAL background CODE */ };
         this.append = function (element) { /* PASTE ORIGINAL append CODE */ };
         this.back = function () { Lampa.Activity.backward(); };
         this.down = function () { /* PASTE ORIGINAL down CODE */ };
         this.up = function () { /* PASTE ORIGINAL up CODE */ };
         this.start = function () { /* PASTE ORIGINAL start CODE */ };
         this.refresh = function () { /* PASTE ORIGINAL refresh CODE */ };
         this.pause = function () { /* PASTE ORIGINAL pause CODE */ };
         this.stop = function () { /* PASTE ORIGINAL stop CODE */ };
         this.render = function () { return html; };
         this.destroy = function () {
             console.log('PsahxRatingsPlugin: component.destroy executing...');
             /* --- PASTE YOUR ORIGINAL 'destroy' LOGIC BELOW --- */
             clearTimeout(background_timer); network.clear(); Lampa.Arrays.destroy(items); scroll.destroy(); if (info) info.destroy(); if (html) html.remove(); items = null; network = null; lezydata = null; info = null; html = null;
             /* --- End of original destroy --- */
         };

    }
    // --- END OF 'component' FUNCTION DEFINITION ---


    /**
     * Main asynchronous initialization function for the plugin.
     */
    async function initializePlugin() {
        console.log("PsahxRatingsPlugin: START initializePlugin()");

        // Basic checks for essential Lampa components
        if (!Lampa.Utils || !Lampa.Lang || !Lampa.Storage || !Lampa.Template || !Lampa.InteractionLine || !Lampa.Manifest || !Lampa.Account || !Lampa.InteractionMain || !Lampa.SettingsApi || !Lampa.Noty) {
            console.error("PsahxRatingsPlugin [main.js]: Missing essential Lampa components inside initializePlugin. Cannot initialize further.");
            return;
        }

        // Define the base URL for loading modules (Your specific URL)
        const baseURL = 'https://psahx.github.io/ERL/SRC/';

        try {
            // --- Dynamically Import Modules ---
            console.log("PsahxRatingsPlugin: Dynamically importing modules...");
            const langModule = await import(baseURL + 'language.js');
            const settingsModule = await import(baseURL + 'settings.js');
            const stylesModule = await import(baseURL + 'styles.js');
            const uiInfoPanelModule = await import(baseURL + 'uiInfoPanel.js');
            console.log("PsahxRatingsPlugin: Modules imported dynamically.");

            // --- Extract needed exports AFTER awaiting the imports ---
            const setupLanguages = langModule.setupLanguages;
            const registerSettings = settingsModule.registerSettings;
            const injectStyles = stylesModule.injectStyles;
            // Get the InfoPanelHandler class/function exported from uiInfoPanel.js
            const InfoPanelHandler = uiInfoPanelModule.InfoPanelHandler;

            // --- Call Setup Functions ---
            console.log("PsahxRatingsPlugin: Calling setupLanguages...");
            setupLanguages();
            console.log("PsahxRatingsPlugin: DONE setupLanguages.");

            console.log("PsahxRatingsPlugin: Calling registerSettings...");
            registerSettings();
            console.log("PsahxRatingsPlugin: DONE registerSettings.");

            console.log("PsahxRatingsPlugin: Calling injectStyles...");
            injectStyles();
            console.log("PsahxRatingsPlugin: DONE injectStyles.");

            // --- Override Lampa Interaction ---
            console.log("PsahxRatingsPlugin: Overriding Lampa.InteractionMain...");
            const originalInteractionMain = Lampa.InteractionMain;

            Lampa.InteractionMain = function (object) { // The override function
                 console.log("PsahxRatingsPlugin: Lampa.InteractionMain override executing...");
                 let useNewInterface = true;
                 try {
                     // Original conditions
                     if (!(object.source == 'tmdb' || object.source == 'cub')) useNewInterface = false;
                     if (window.innerWidth < 767) useNewInterface = false;
                     if (!Lampa.Account.hasPremium()) useNewInterface = false;
                     if (Lampa.Manifest.app_digital < 153) useNewInterface = false;
                 } catch (e) {
                      console.error("PsahxRatingsPlugin [main.js]: Error checking conditions for InteractionMain override. Falling back.", e);
                      useNewInterface = false;
                 }

                 if (useNewInterface) {
                      try {
                           // Pass the dynamically loaded InfoPanelHandler to the component constructor
                           return new component(object, InfoPanelHandler);
                      } catch (e) {
                           console.error("PsahxRatingsPlugin [main.js]: Error creating new 'component' instance. Falling back.", e);
                           return new originalInteractionMain(object);
                      }
                 } else {
                     // console.log("PsahxRatingsPlugin: Using original Lampa.InteractionMain.");
                     return new originalInteractionMain(object);
                 }
            };
            console.log("PsahxRatingsPlugin: DONE Lampa.InteractionMain override.");

            // Mark the plugin as ready using the original flag name
            window.plugin_interface_ready = true;
            console.log("PsahxRatingsPlugin: END initializePlugin() SUCCESS.");

        } catch (error) {
            console.error("PsahxRatingsPlugin [main.js]: CRITICAL ERROR during initializePlugin (likely module import failed):", error);
            if (window.Lampa && Lampa.Noty) { Lampa.Noty.show("Error initializing PsahxRatingsPlugin: " + error.message, { time: 10000 }); }
        }
    } // --- End of initializePlugin function ---


    // --- Trigger Initialization ---
    console.log("PsahxRatingsPlugin: Setting up initialization trigger...");
    // No need to check plugin_interface_ready here, IIFE runs only once on script load
    initializePlugin(); // Call the async initialization function

})(); // --- End of IIFE ---

// <-- ENSURE NOTHING AFTER THIS LINE -->
