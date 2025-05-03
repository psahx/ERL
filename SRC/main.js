// SRC/main.js
'use strict';
console.log("PsahxRatingsPlugin: Executing main.js");

// --- Import necessary setup functions and the main UI component handler ---
// Adjust paths if needed (e.g., use full URLs if relative paths fail)
// Removing these adding async
//import { setupLanguages } from 'https://psahx.github.io/ERL/SRC/language.js';
//import { registerSettings } from 'https://psahx.github.io/ERL/SRC/settings.js';
//import { injectStyles } from 'https://psahx.github.io/ERL/SRC/styles.js';
//import { InfoPanelHandler } from 'https://psahx.github.io/ERL/SRC/uiInfoPanel.js'; // Import the exported class/function

function component(object) { 
    
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
    this.build = function (data) { 
        var _this2 = this; 
        lezydata = data; 
        info = new create(object); 
        info.create(); 
        scroll.minus(info.render()); 
        data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this)); 
        html.append(info.render()); html.append(scroll.render()); 
        if (newlampa) { 
            Lampa.Layer.update(html); 
            Lampa.Layer.visible(scroll.render(true)); 
            scroll.onEnd = this.loadNext.bind(this); 
            scroll.onWheel = function (step) { 
                if (!Lampa.Controller.own(_this2)) _this2.start(); 
                if (step > 0) _this2.down(); else if (active > 0) _this2.up(); 
            }; 
        } 
        if (items.length > 0 && items[0] && items[0].data) { 
            active = 0; 
            info.update(items[active].data); 
            this.background(items[active].data); 
        } 
        this.activity.loader(false); 
        this.activity.toggle(); 
    }; 
    
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
 // --- END OF PASTED 'component' FUNCTION ---

/**
 * Main asynchronous initialization function for the plugin.
 * Dynamically imports dependencies and sets up the plugin.
 */
async function initializePlugin() {
    console.log("PsahxRatingsPlugin: START initializePlugin()"); // Log Start

    // Basic checks for essential Lampa components needed *before* loading modules
    if (!window.Lampa || !Lampa.Utils || !Lampa.Lang || !Lampa.Storage || !Lampa.Template || !Lampa.InteractionLine || !Lampa.Manifest || !Lampa.Account || !Lampa.InteractionMain || !Lampa.SettingsApi /* Add any other essentials */) {
        console.error("PsahxRatingsPlugin [main.js]: Missing essential Lampa components. Cannot initialize.");
        return;
    }

    // Define the base URL for loading modules
    const baseURL = 'https://psahx.github.io/ERL/SRC/';

    try {
        // --- Dynamically Import Modules ---
        console.log("PsahxRatingsPlugin: Dynamically importing modules...");
        // Use await import() with the absolute URLs
        const langModule = await import(baseURL + 'language.js');
        const settingsModule = await import(baseURL + 'settings.js');
        const stylesModule = await import(baseURL + 'styles.js');
        const uiInfoPanelModule = await import(baseURL + 'uiInfoPanel.js');
        // NOTE: config.js, cache.js, apiMDBList.js are imported internally by the modules above, assumed using relative paths
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

        // Define the replacement function for Lampa.InteractionMain
        Lampa.InteractionMain = function (object) {
            let useNewInterface = true; // Default to using the new interface
            try {
                // Original conditions to determine if the new interface should be used
                if (!(object.source == 'tmdb' || object.source == 'cub')) useNewInterface = false;
                if (window.innerWidth < 767) useNewInterface = false;
                if (!Lampa.Account.hasPremium()) useNewInterface = false;
                if (Lampa.Manifest.app_digital < 153) useNewInterface = false;
            } catch (e) {
                console.error("PsahxRatingsPlugin [main.js]: Error checking conditions for InteractionMain override. Falling back.", e);
                useNewInterface = false; // Fallback to original if checks fail
            }

            if (useNewInterface) {
                 try {
                      // Use the 'component' function (which should be defined elsewhere in main.js)
                      // It's assumed that 'component' internally uses 'new InfoPanelHandler(object)'
                      // and that 'InfoPanelHandler' is accessible in its scope.
                      return new component(object);
                 } catch (e) {
                      console.error("PsahxRatingsPlugin [main.js]: Error creating new 'component' instance. Falling back.", e);
                      return new originalInteractionMain(object); // Fallback if 'component' fails
                 }
            } else {
                // Use the original Lampa InteractionMain
                return new originalInteractionMain(object);
            }
        };
        console.log("PsahxRatingsPlugin: DONE Lampa.InteractionMain override.");

        // Mark the plugin as ready
        window.plugin_interface_ready = true;
        console.log("PsahxRatingsPlugin: END initializePlugin() SUCCESS.");

    } catch (error) {
        // Catch any errors during import or setup
        console.error("PsahxRatingsPlugin [main.js]: CRITICAL ERROR during initializePlugin (likely module import failed):", error);
        // Optionally notify the user in Lampa UI if Lampa.Noty is available
        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show("Error initializing PsahxRatingsPlugin: " + error.message, { time: 10000 });
        }
    }
}; // --- End of initializePlugin function ---

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
