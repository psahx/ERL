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


    function component(object, InfoPanelHandler) { 

    console.log('DEBUG component: STARTING. Received object:', object ? object.source : 'undefined', 'Received InfoPanelHandler type:', typeof InfoPanelHandler);
    
    var network = new Lampa.Reguest();
    var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
    var items = [];
    var html = $('<div class="new-interface"><img class="full-start__background"></div>');
    var active = 0;
    // Check for Lampa.Manifest existence before accessing app_digital
    var newlampa = Lampa.Manifest.app_digital >= 166;
    var info; // Will hold the InfoPanelHandler instance
    var lezydata;
    // Check for Lampa.Storage existence before accessing field
    var viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse';
    var background_img = html.find('.full-start__background');
    var background_last = '';
    var background_timer;

    // --- Make sure 'this.create' instantiates InfoPanelHandler ---
// Replace the existing 'this.create' within 'component' function in SRC/main.js

this.create = function () {
    console.log('--- PsahxRatingsPlugin: component.create EXECUTING MINIMAL LOG ---');
};

    this.empty = function () {
        /* Original empty code */ 
        var button; if (object.source == 'tmdb') { 
            button = $('<div class="empty__footer"><div class="simple-button selector">' + Lampa.Lang.translate('change_source_on_cub') + '</div></div>'); 
            button.find('.selector').on('hover:enter', 
                function () { Lampa.Storage.set('source', 'cub'); 
                    Lampa.Activity.replace({ source: 'cub' }); }); 
        } 
        var empty = new Lampa.Empty(); 
        html.append(empty.render(button)); 
        
        this.start = empty.start; 
        this.activity.loader(false); 
        this.activity.toggle(); 
    }; 
    
    this.loadNext = function () { 
        var _this = this; 
        if (this.next && !this.next_wait && items.length) { 
            this.next_wait = true; this.next(function (new_data) { 
                _this.next_wait = false; 
                new_data.forEach(_this.append.bind(_this)); 
                Lampa.Layer.visible(items[active + 1].render(true)); 
                }, 
            function () { 
                _this.next_wait = false; 
                }); 
        } 
    }; 
            
    this.push = function () {}; 

        
// Replace the existing 'this.build' within 'component' function in SRC/main.js
this.build = function (data) {
    var _this2 = this;
    lezydata = data; // Store data reference

    // --- ADDED DEBUG LOGS for 'this' and 'this.create' ---
    console.log('DEBUG component.build: START. typeof this:', typeof this);
    // Check if this.create exists and is a function right before checking 'info'
    console.log('DEBUG component.build: typeof this.create right now is:', typeof this.create);
    // --- End Debugging ---

    // Ensure the 'info' instance exists, attempting creation ONCE
    if (!info) {
         console.log("PsahxRatingsPlugin: component.build calling this.create()...");
         // Log 'this' context right before the specific call
         console.log('DEBUG component.build: "this" right before calling this.create:', (typeof this));

         // Add a try/catch around the actual call
         try {
             // Check if it's actually a function before calling
             if (typeof this.create === 'function') {
                 this.create(); // Attempt to create info instance
             } else {
                 console.error("COMPONENT BUILD ERROR: this.create is NOT a function right before call!");
             }
         } catch(e) {
             // Catch errors specifically from calling this.create()
             console.error("COMPONENT BUILD ERROR: Calling 'this.create()' threw an error!", e);
         }

         // Check info *after* the attempt
         if (!info) {
              console.error("PsahxRatingsPlugin: component.build - AFTER this.create(), 'info' is still undefined! Halting build logic for this item.");
              return; // Keep temporary return to prevent loop crash
         }
         console.log("PsahxRatingsPlugin: component.build - info instance seems created.");
    }

    // --- Original logic using the 'info' instance ---
    console.log("PsahxRatingsPlugin: component.build proceeding with rest of logic..."); // Added log

    if (scroll && info && typeof info.render === 'function') { /* ... scroll.minus ... */ }
    if (typeof this.append === 'function') { /* ... forEach ... */ }
    if (html && info && scroll /*...*/) { /* ... html.append ... */ }
    if (newlampa) { /* ... Lampa.Layer etc ... */ }
    if (items && items.length > 0 && items[0] && items[0].data && info) { /* ... info.update, this.background ... */ }
    if (this.activity /*...*/) { /* ... loader, toggle ... */ }

    console.log("PsahxRatingsPlugin: component.build completed (or exited early).");
}; // --- End of debug 'this.build' replacement ---
    
    this.background = function (elem) {
        if (!elem || !elem.backdrop_path) return; 
        var new_background = Lampa.Api.img(elem.backdrop_path, 'w1280'); 
        clearTimeout(background_timer); 
        if (new_background == background_last) return; 
        background_timer = setTimeout(function () { 
            background_img.removeClass('loaded'); 
            background_img[0].onload = function () { 
                background_img.addClass('loaded'); 
            }; 
            background_img[0].onerror = function () { 
                background_img.removeClass('loaded'); 
            }; 
            background_last = new_background; 
            setTimeout(function () { 
                if (background_img[0]) background_img[0].src = background_last; 
            }, 300); 
        }, 1000); 
    }; 
    
    this.append = function (element) { 
        if (element.ready) return; 
        var _this3 = this; 
        element.ready = true; 
        var item = new Lampa.InteractionLine(element, { 
            url: element.url, 
            card_small: true, 
            cardClass: element.cardClass, 
            genres: object.genres, 
            object: object, 
            card_wide: true, 
            nomore: element.nomore 
        }); 
        item.create(); 
        item.onDown = this.down.bind(this); 
        item.onUp = this.up.bind(this); 
        item.onBack = this.back.bind(this); 
        item.onToggle = function () { 
            active = items.indexOf(item); 
        }; 
        if (this.onMore) item.onMore = this.onMore.bind(this); 
        item.onFocus = function (elem) { 
            if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; info.update(elem); _this3.background(elem); 
        }; 
        item.onHover = function (elem) { 
            if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; info.update(elem); 
            _this3.background(elem); 
        }; 
        item.onFocusMore = info.empty.bind(info); 
        scroll.append(item.render()); 
        items.push(item); 
    }; 
    
    this.back = function () { 
        Lampa.Activity.backward(); 
    }; 
    
    this.down = function () { 
        active++; 
        active = Math.min(active, items.length - 1); 
        if (!viewall && lezydata) lezydata.slice(0, active + 2).forEach(this.append.bind(this)); 
        items[active].toggle(); 
        scroll.update(items[active].render()); 
    }; 
    
    this.up = function () { 
        active--; 
        if (active < 0) { 
            active = 0; Lampa.Controller.toggle('head'); 
        } 
        else { 
            items[active].toggle(); 
            scroll.update(items[active].render()); 
        } 
    }; 
    
    this.start = function () {
        var _this4 = this; 
        Lampa.Controller.add('content', { 
            link: this, toggle: function toggle() { 
                if (_this4.activity.canRefresh()) return false; 
                if (items.length) { 
                    items[active].toggle(); 
                } 
            }, 
            update: function update() {}, 
            left: function left() { 
                if (Navigator.canmove('left')) Navigator.move('left'); 
                else Lampa.Controller.toggle('menu'); 
            }, 
            right: function right() { 
                Navigator.move('right'); 
            }, 
            up: function up() { 
                if (Navigator.canmove('up')) Navigator.move('up'); 
                else Lampa.Controller.toggle('head'); 
            }, 
            down: function down() { 
                if (Navigator.canmove('down')) Navigator.move('down'); 
            }, 
            back: this.back 
        }); 
        Lampa.Controller.toggle('content'); 
    }; 
    
    this.refresh = function () { 
        this.activity.loader(true); 
        this.activity.need_refresh = true; 
    }; 
    
    this.pause = function () {}; 
    this.stop = function () {}; 
    this.render = function () { 
        return html; 
    }; 
    
    this.destroy = function () { 
        clearTimeout(background_timer); 
        network.clear(); 
        Lampa.Arrays.destroy(items); 
        scroll.destroy(); 
        if (info) info.destroy(); 
        if (html) html.remove(); 
        items = null; 
        network = null; 
        lezydata = null; 
        info = null; 
        html = null; 
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
            console.log('DEBUG initializePlugin: Imported InfoPanelHandler type:', typeof InfoPanelHandler);
    
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
                          console.log('DEBUG InteractionMain Override: Passing InfoPanelHandler type:', typeof InfoPanelHandler);
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
