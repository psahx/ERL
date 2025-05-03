// SRC/main.js
'use strict';

// --- Import necessary setup functions and the main UI component handler ---
// Adjust paths if needed (e.g., use full URLs if relative paths fail)
import { setupLanguages } from './language.js';
import { registerSettings } from './settings.js';
import { injectStyles } from './styles.js';
import { InfoPanelHandler } from './uiInfoPanel.js'; // Import the exported class/function

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
