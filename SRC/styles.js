// SRC/styles.js
'use strict';

// CSS styles string - MAKE SURE TO PASTE YOUR *ENTIRE* ORIGINAL CSS HERE
const cssString = `
            /* Base styles... (kept from pivot point script) */
            .new-interface .card--small.card--wide { width: 18.3em; }
            .new-interface-info { position: relative; padding: 1.5em; height: 24em; } /* original was 24em*/
            /* ... */
            /* PASTE ALL YOUR CSS LINES HERE... */
            /* ... */
            /* --- End Rating Box Styles --- */
`;

const style_id = 'psahx-ratings-styles'; // Unique ID for the style element

/**
 * Injects the plugin's CSS styles into the document head
 * using Lampa.Template if they haven't been injected already.
 */
export function injectStyles() {
    // Check if Lampa Template API and jQuery are available
    if (!window.Lampa || !Lampa.Template || typeof $ !== 'function') {
         console.error("PsahxRatingsPlugin [styles.js]: Lampa.Template or jQuery ($) not available.");
         return;
    }

    // Check if styles are already injected
    if ($('style[data-id="' + style_id + '"]').length) {
         // Optional: console.log("PsahxRatingsPlugin: Styles already injected.");
         return;
    }

    try {
       // Add the template to Lampa
       Lampa.Template.add(style_id, \`<style data-id="\${style_id}">\${cssString}</style>\`);
       // Append the rendered template to the body (or head)
       $('body').append(Lampa.Template.get(style_id, {}, true));
       // Optional: console.log("PsahxRatingsPlugin: Styles injected.");
    } catch (e) {
       console.error("PsahxRatingsPlugin [styles.js]: Error injecting styles:", e);
    }
}
