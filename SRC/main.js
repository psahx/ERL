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


    function component(object) { 

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
    console.log('--- PsahxRatingsPlugin: component.create STARTING ---');
    console.log('PsahxRatingsPlugin: component.create executing...'); // Existing log

    // Log the received constructor to be sure
    console.log('DEBUG component.create: Type of InfoPanelHandler is:', typeof InfoPanelHandler);
    // console.log('DEBUG component.create: InfoPanelHandler looks like:', InfoPanelHandler ? InfoPanelHandler.toString().substring(0, 200) + '...' : 'undefined'); // Optional deep check

    // Check if InfoPanelHandler seems valid before using 'new'
    if (!InfoPanelHandler || typeof InfoPanelHandler !== 'function') {
         console.error("COMPONENT CREATE ERROR: InfoPanelHandler not a valid function!");
         return; // Stop if constructor isn't valid
    }

    console.log('PsahxRatingsPlugin: component.create() attempting: new InfoPanelHandler(object)');
    let tempInstance = null; // Use a temporary variable first
    try {
         tempInstance = new InfoPanelHandler(object);
         // Log immediately after instantiation attempt
         console.log('DEBUG component.create: Instantiation result (tempInstance):', tempInstance ? 'Instance OK' : 'FAILED (null/undefined)');
    } catch(e) {
         console.error("COMPONENT CREATE ERROR: 'new InfoPanelHandler(object)' threw an error!", e);
         // If 'new' fails, info will not be assigned below
    }

    // Assign to the 'info' variable declared in the outer 'component' scope
    info = tempInstance;
    console.log('DEBUG component.create: Assigned to outer "info" variable:', info ? 'Assignment OK' : 'Assignment FAILED (info is still null/undefined)');

    // Now check 'info' before trying to use it
    if (info && typeof info.create === 'function') {
          console.log('PsahxRatingsPlugin: component.create() calling info.create()...');
          try {
              info.create(); // Call method on the new instance
              console.log('PsahxRatingsPlugin: info.create() apparently completed.');
          } catch(e) {
              console.error("COMPONENT CREATE ERROR: info.create() threw an error!", e);
          }
    } else {
         console.error("COMPONENT CREATE ERROR: 'info' instance is invalid or missing 'create' method AFTER assignment.");
    }

    // Check scroll/render AFTER info should be valid and info.create ran
    if (typeof scroll === 'undefined' || !scroll) console.error("COMPONENT CREATE ERROR: 'scroll' object is undefined!");
    if (!info) console.error("COMPONENT CREATE ERROR: 'info' object is undefined before scroll.minus!");
    if (info && typeof info.render !== 'function') console.error("COMPONENT CREATE ERROR: info.render is not a function!");

    if (scroll && info && typeof info.render === 'function') {
        try{
             scroll.minus(info.render());
             console.log('PsahxRatingsPlugin: scroll.minus(info.render()) called.');
        } catch(e) {
             console.error("COMPONENT CREATE ERROR: scroll.minus(info.render()) failed!", e);
        }
    } else {
         console.error("COMPONENT CREATE ERROR: scroll or info.render unavailable for scroll.minus.");
    }

    console.log('PsahxRatingsPlugin: component.create completed.');
}; // End this.create replacement

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

    // --- Ensure the 'info' instance exists, attempting creation ONCE ---
    if (!info) {
         console.log("PsahxRatingsPlugin: component.build calling this.create()...");
         this.create(); // Attempt to create info instance

         // ** TEMPORARY DEBUGGING CHANGE **
         // Check info *after* the attempt. If still not set, log the error
         // AND return early from build for THIS item to prevent infinite loops/crashes.
         if (!info) {
              console.error("PsahxRatingsPlugin: component.build - AFTER this.create(), 'info' is still undefined! Halting build logic for this item.");
              // Stop further execution of *this* build call to break the loop
              return; // <-- ADDED RETURN HERE
         }
         // If we reach here, info should have been created successfully by this.create()
         console.log("PsahxRatingsPlugin: component.build - info instance seems created.");
    }

    // --- Original logic using the 'info' instance ---
    // This part should now only run if 'info' was successfully created above.

    // Ensure scroll object exists from component scope
    if (scroll && info && typeof info.render === 'function') {
         scroll.minus(info.render());
    } else { console.error("PsahxRatingsPlugin: Missing scroll/info object in build"); }

    // Ensure 'this.append' exists
    if (typeof this.append === 'function') {
         data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this));
    }

    // Ensure 'html' object exists
    if (html && info && scroll && typeof info.render === 'function' && typeof scroll.render === 'function') {
        html.append(info.render());
        html.append(scroll.render());
    } else { console.error("PsahxRatingsPlugin: Missing html/info/scroll object in build"); }


    if (newlampa) { // Check Lampa components used here
        if (window.Lampa && Lampa.Layer && Lampa.Controller && scroll.onEnd && scroll.onWheel) {
            Lampa.Layer.update(html);
            Lampa.Layer.visible(scroll.render(true));
            scroll.onEnd = this.loadNext.bind(this);
            scroll.onWheel = function (step) {
                if (!Lampa.Controller.own(_this2)) _this2.start();
                if (step > 0) _this2.down(); else if (active > 0) _this2.up();
            };
        } else { console.error("PsahxRatingsPlugin: Missing Lampa components for newlampa logic in build."); }
    }

    // Ensure 'items' array exists before accessing
    if (items && items.length > 0 && items[0] && items[0].data && info) {
        active = 0;
        // This check ensures info exists before using it
        info.update(items[active].data);
        this.background(items[active].data);
    } else if (!info) {
         console.error("PsahxRatingsPlugin: component.build - Cannot update info panel because 'info' is null/undefined.");
    }


    if (this.activity && typeof this.activity.loader === 'function') {
         this.activity.loader(false);
         this.activity.toggle();
    } else { console.error("PsahxRatingsPlugin: this.activity not properly set up in component.build."); }
    console.log("PsahxRatingsPlugin: component.build completed (or exited early)."); // Added completion log
}; // --- End of temporary 'this.build' replacement ---
    
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
