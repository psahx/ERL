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
    if (window.plugin_interface_ready) {
        console.log("PsahxRatingsPlugin: Plugin already initialized (plugin_interface_ready flag was set).");
        return;
    }

    // --- Component Definition (Paste your full original component code here, accepting InfoPanelHandler) ---
    function component(object, InfoPanelHandler) {
        console.log('DEBUG component: STARTING. Received object:', object ? object.source : 'undefined', 'Received InfoPanelHandler type:', typeof InfoPanelHandler);

        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
        var items = [];
        var html = $('<div class="new-interface"><img class="full-start__background"></div>');
        var active = 0;
        var newlampa = Lampa.Manifest.app_digital >= 166;
        var info; // Will hold the InfoPanelHandler instance
        var lezydata;
        var viewall = Lampa.Storage.field('card_views_type') == 'view' || Lampa.Storage.field('navigation_type') == 'mouse';
        var background_img = html.find('.full-start__background');
        var background_last = '';
        var background_timer; // Note: Used in original background method, ensure definition exists if separated

        // --- Use the FULL DEBUGGING version of this.create ---
        this.create = function () {
            console.log('--- PsahxRatingsPlugin: component.create STARTING ---');
            console.log('PsahxRatingsPlugin: component.create executing...'); // Existing log

            console.log('DEBUG component.create: Type of InfoPanelHandler is:', typeof InfoPanelHandler);

            if (!InfoPanelHandler || typeof InfoPanelHandler !== 'function') {
                 console.error("COMPONENT CREATE ERROR: InfoPanelHandler not a valid function! Halting create.");
                 return;
            }

            console.log('PsahxRatingsPlugin: component.create() attempting: new InfoPanelHandler(object)');
            let tempInstance = null;
            try {
                 tempInstance = new InfoPanelHandler(object);
                 console.log('DEBUG component.create: Instantiation result (tempInstance):', tempInstance ? 'Instance OK' : 'FAILED (null/undefined)');
            } catch(e) {
                 console.error("COMPONENT CREATE ERROR: 'new InfoPanelHandler(object)' threw an error!", e);
                 return; // Stop if instantiation fails
            }

            info = tempInstance; // Assign to outer scope variable
            console.log('DEBUG component.create: Assigned to outer "info" variable:', info ? 'Assignment OK' : 'Assignment FAILED (info is still null/undefined)');

            if (info && typeof info.create === 'function') {
                  console.log('PsahxRatingsPlugin: component.create() calling info.create()...');
                  try {
                      info.create(); // Call InfoPanelHandler's create method
                      console.log('PsahxRatingsPlugin: info.create() apparently completed.');
                  } catch(e) {
                      console.error("COMPONENT CREATE ERROR: info.create() threw an error!", e);
                  }
            } else {
                 console.error("COMPONENT CREATE ERROR: 'info' instance is invalid or missing 'create' method AFTER assignment.");
            }

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
            console.log('--- PsahxRatingsPlugin: component.create FINISHING ---');
        }; // --- End this.create ---

        // --- Use the CORRECTED this.build using .call(this) ---
        this.build = function (data) {
            var _this2 = this;
            lezydata = data;

            console.log('DEBUG component.build: START. typeof this:', typeof this);
            console.log('DEBUG component.build: typeof this.create:', typeof this.create);

            if (!info) {
                 console.log("PsahxRatingsPlugin: component.build attempting call to this.create()...");

                 if (typeof this.create === 'function') {
                     const createFunc = this.create;
                     console.log('DEBUG component.build: Assigned this.create to local var createFunc, type:', typeof createFunc);
                     try {
                          console.log('DEBUG component.build: Attempting call via createFunc.call(this)...');
                          // ** THE FIX: Call using .call(this) to set context **
                          createFunc.call(this);
                          console.log('DEBUG component.build: Call via createFunc.call(this) finished.');
                     } catch(e) {
                          console.error("COMPONENT BUILD ERROR: Calling 'createFunc.call(this)' threw an error!", e);
                     }
                 } else {
                      console.error("COMPONENT BUILD ERROR: this.create is NOT a function!");
                 }

                 // Check info *after* the attempt
                 // This check should now potentially pass if createFunc.call(this) worked
                 if (!info) {
                      console.error("PsahxRatingsPlugin: component.build - AFTER createFunc.call(this) attempt, 'info' is still undefined! Halting build.");
                      return; // Stop this build call if info still not set
                 }
                 console.log("PsahxRatingsPlugin: component.build - info instance was successfully created.");
            }

            // --- Original build logic using the 'info' instance ---
            console.log("PsahxRatingsPlugin: component.build proceeding with rest of logic...");

            if (scroll && info && typeof info.render === 'function') { scroll.minus(info.render()); } else { console.error("PsahxRatingsPlugin: Missing scroll/info object in build for scroll.minus"); }
            if (typeof this.append === 'function') { data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this)); }
            if (html && info && scroll && typeof info.render === 'function' && typeof scroll.render === 'function') { html.append(info.render()); html.append(scroll.render()); } else { console.error("PsahxRatingsPlugin: Missing html/info/scroll object in build for append"); }
            if (newlampa) { if (window.Lampa && Lampa.Layer && Lampa.Controller && scroll.onEnd && scroll.onWheel) { Lampa.Layer.update(html); Lampa.Layer.visible(scroll.render(true)); scroll.onEnd = this.loadNext.bind(this); scroll.onWheel = function (step) { if (!Lampa.Controller.own(_this2)) _this2.start(); if (step > 0) _this2.down(); else if (active > 0) _this2.up(); }; } else { console.error("PsahxRatingsPlugin: Missing Lampa components for newlampa logic in build."); } }
            if (items && items.length > 0 && items[0] && items[0].data && info) { active = 0; info.update(items[active].data); this.background(items[active].data); } else if (!info && items && items.length > 0) { console.error("PsahxRatingsPlugin: component.build - Cannot update info panel because 'info' is null/undefined."); }
            if (this.activity && typeof this.activity.loader === 'function') { this.activity.loader(false); this.activity.toggle(); } else { /* Optional: console.error("PsahxRatingsPlugin: this.activity not properly set up in component.build.") */ }

            console.log("PsahxRatingsPlugin: component.build completed.");
        }; // --- End this.build ---

        // --- PASTE THE REST OF YOUR ORIGINAL 'component' METHODS HERE ---
        // (empty, loadNext, push, background, append, back, down, up, start, refresh, pause, stop, render, destroy)
        // Make sure 'destroy' calls 'if (info) info.destroy();' and clears background_timer
        this.empty = function () { var button; if (object.source == 'tmdb') { button = $('<div class="empty__footer"><div class="simple-button selector">' + Lampa.Lang.translate('change_source_on_cub') + '</div></div>'); button.find('.selector').on('hover:enter', function () { Lampa.Storage.set('source', 'cub'); Lampa.Activity.replace({ source: 'cub' }); }); } var empty = new Lampa.Empty(); html.append(empty.render(button)); this.start = empty.start; this.activity.loader(false); this.activity.toggle(); };
        this.loadNext = function () { var _this = this; if (this.next && !this.next_wait && items.length) { this.next_wait = true; this.next(function (new_data) { _this.next_wait = false; new_data.forEach(_this.append.bind(_this)); Lampa.Layer.visible(items[active + 1].render(true)); }, function () { _this.next_wait = false; }); } };
        this.push = function () {};
        this.background = function (elem) { if (!elem || !elem.backdrop_path) return; var new_background = Lampa.Api.img(elem.backdrop_path, 'w1280'); clearTimeout(background_timer); if (new_background == background_last) return; background_timer = setTimeout(function () { background_img.removeClass('loaded'); background_img[0].onload = function () { background_img.addClass('loaded'); }; background_img[0].onerror = function () { background_img.removeClass('loaded'); }; background_last = new_background; setTimeout(function () { if (background_img[0]) background_img[0].src = background_last; }, 300); }, 1000); };
        this.append = function (element) { if (element.ready) return; var _this3 = this; element.ready = true; var item = new Lampa.InteractionLine(element, { url: element.url, card_small: true, cardClass: element.cardClass, genres: object.genres, object: object, card_wide: true, nomore: element.nomore }); item.create(); item.onDown = this.down.bind(this); item.onUp = this.up.bind(this); item.onBack = this.back.bind(this); item.onToggle = function () { active = items.indexOf(item); }; if (this.onMore) item.onMore = this.onMore.bind(this); item.onFocus = function (elem) { if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; if(info) info.update(elem); _this3.background(elem); }; item.onHover = function (elem) { if (!elem.method) elem.method = elem.name ? 'tv' : 'movie'; if(info) info.update(elem); _this3.background(elem); }; if(info) item.onFocusMore = info.empty.bind(info); scroll.append(item.render()); items.push(item); };
        this.back = function () { Lampa.Activity.backward(); };
        this.down = function () { active++; active = Math.min(active, items.length - 1); if (!viewall && lezydata) lezydata.slice(0, active + 2).forEach(this.append.bind(this)); items[active].toggle(); scroll.update(items[active].render()); };
        this.up = function () { active--; if (active < 0) { active = 0; Lampa.Controller.toggle('head'); } else { items[active].toggle(); scroll.update(items[active].render()); } };
        this.start = function () { var _this4 = this; Lampa.Controller.add('content', { link: this, toggle: function toggle() { if (_this4.activity.canRefresh()) return false; if (items.length) { items[active].toggle(); } }, update: function update() {}, left: function left() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); }, right: function right() { Navigator.move('right'); }, up: function up() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); }, down: function down() { if (Navigator.canmove('down')) Navigator.move('down'); }, back: this.back }); Lampa.Controller.toggle('content'); };
        this.refresh = function () { this.activity.loader(true); this.activity.need_refresh = true; };
        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { clearTimeout(background_timer); network.clear(); Lampa.Arrays.destroy(items); scroll.destroy(); if (info) info.destroy(); if (html) html.remove(); items = null; network = null; lezydata = null; info = null; html = null; };

    } // --- END OF 'component' FUNCTION DEFINITION ---


    /**
     * Main asynchronous initialization function for the plugin.
     */
    async function initializePlugin() {
        console.log("PsahxRatingsPlugin: START initializePlugin()");

        if (!Lampa.Utils /* ... add all necessary checks ... */ || !Lampa.InteractionMain || !Lampa.SettingsApi || !Lampa.Noty) { /* ... error log ... */ return; }
        const baseURL = 'https://psahx.github.io/ERL/SRC/';

        try {
            console.log("PsahxRatingsPlugin: Dynamically importing modules...");
            const langModule = await import(baseURL + 'language.js');
            const settingsModule = await import(baseURL + 'settings.js');
            const stylesModule = await import(baseURL + 'styles.js');
            const uiInfoPanelModule = await import(baseURL + 'uiInfoPanel.js');
            console.log("PsahxRatingsPlugin: Modules imported dynamically.");

            const setupLanguages = langModule.setupLanguages;
            const registerSettings = settingsModule.registerSettings;
            const injectStyles = stylesModule.injectStyles;
            const InfoPanelHandler = uiInfoPanelModule.InfoPanelHandler;
            console.log('DEBUG initializePlugin: Imported InfoPanelHandler type:', typeof InfoPanelHandler);

            console.log("PsahxRatingsPlugin: Calling setupLanguages...");
            setupLanguages(); console.log("PsahxRatingsPlugin: DONE setupLanguages.");
            console.log("PsahxRatingsPlugin: Calling registerSettings...");
            registerSettings(); console.log("PsahxRatingsPlugin: DONE registerSettings.");
            console.log("PsahxRatingsPlugin: Calling injectStyles...");
            injectStyles(); console.log("PsahxRatingsPlugin: DONE injectStyles.");

            console.log("PsahxRatingsPlugin: Overriding Lampa.InteractionMain...");
            const originalInteractionMain = Lampa.InteractionMain;
            Lampa.InteractionMain = function (object) {
                 console.log("PsahxRatingsPlugin: Lampa.InteractionMain override executing...");
                 let useNewInterface = true;
                 try { /* ... conditions ... */ } catch (e) { /* ... error handling ... */ useNewInterface = false; }

                 if (useNewInterface) {
                      try {
                           console.log('DEBUG InteractionMain Override: Passing InfoPanelHandler type:', typeof InfoPanelHandler);
                           return new component(object, InfoPanelHandler); // Pass handler
                      } catch (e) { /* ... error handling ... */ return new originalInteractionMain(object); }
                 } else { return new originalInteractionMain(object); }
            };
            console.log("PsahxRatingsPlugin: DONE Lampa.InteractionMain override.");

            window.plugin_interface_ready = true;
            console.log("PsahxRatingsPlugin: END initializePlugin() SUCCESS.");

        } catch (error) { console.error(/* ... error log ... */); if (window.Lampa && Lampa.Noty) { /* ... */ } }
    } // --- End of initializePlugin function ---


    // --- Trigger Initialization ---
    console.log("PsahxRatingsPlugin: Setting up initialization trigger...");
    initializePlugin(); // Call async function

})(); // --- End of IIFE ---
