// SRC/styles.js
'use strict';
console.log("PsahxRatingsPlugin: Executing styles.js");

// CSS styles string - MAKE SURE TO PASTE YOUR *ENTIRE* ORIGINAL CSS HERE
const cssString = `
            /* Base styles... (kept from pivot point script) */
            .new-interface .card--small.card--wide { width: 18.3em; }
            .new-interface-info { position: relative; padding: 1.5em; height: 24em; } /* original was 24em*/
            /* ... rest of base styles identical to pivot script ... */
            .new-interface-info__body { width: 80%; padding-top: 1.1em; }
            .new-interface-info__head { color: rgba(255, 255, 255, 0.6); margin-bottom: 1em; font-size: 1.3em; min-height: 1em; }
            .new-interface-info__head span { color: #fff; }
            .new-interface-info__title { font-size: 4em; font-weight: 600; margin-bottom: 0.3em; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; margin-left: -0.03em; line-height: 1.3; }
            /* .new-interface-info__details { margin-bottom: 1.6em; display: flex; align-items: center; flex-wrap: wrap; min-height: 1.9em; font-size: 1.1em; } */
                        
            .new-interface-info__details {
                margin-bottom: 1em; 
                display: block;
                min-height: 1.9em;
                font-size: 1.1em;
            }
            .line-one-details {
                margin-bottom: 0.6em;
                line-height: 1.5;
            }
            .genre-details-line {
                margin-top: 1em;
                line-height: 1.5;
            }

            .new-interface-info__split { margin: 0 0.5em; font-size: 0.7em; }
            .new-interface-info__description { font-size: 1.2em; font-weight: 300; line-height: 1.5; overflow: hidden; text-overflow: "."; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; width: 70%; }
            .new-interface .card-more__box { padding-bottom: 95%; }
            .new-interface .full-start__background { height: 108%; top: -6em; }
            .new-interface .card__promo { display: none; }
            .new-interface .card.card--wide+.card-more .card-more__box { padding-bottom: 95%; }
            .new-interface .card.card--wide .card-watched { display: none !important; }
            body.light--version .new-interface-info__body { width: 69%; padding-top: 1.5em; }
            body.light--version .new-interface-info { height: 25.3em; }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.focus .card__view { animation: animation-card-focus 0.2s; }
            body.advanced--animation:not(.no--animation) .new-interface .card--small.card--wide.animate-trigger-enter .card__view { animation: animation-trigger-enter 0.2s forwards; }


            /* --- Rating Box Styles --- */
            .new-interface .full-start__rate {
                font-size: 1.3em;        /* Lampa Source base size is 1.3, we had it 1.45 */
                margin-right: 0em;        /* modified was 1em */
                display: inline-flex;
                align-items: center;
                vertical-align: middle;
                background-color: rgba(255, 255, 255, 0.12); /* Light wrapper background */
                padding: 0 0.2em 0 0; /* Zero Left Padding */
                border-radius: 0.3em;  /* Smoother edges */
                gap: 0.4em; /* modified was 0.5 */
                overflow: hidden;
                height: auto;
            }
            /* Style for the Number Div (common to all ratings) */
            .new-interface .full-start__rate > div {
                font-weight: normal;      /* Normal weight */
                font-size: 0.9em;         /* Changing back to original from 0.9 */
                justify-content: center;  /* From source analysis */
                background-color: rgba(0, 0, 0, 0.4); /* Darker background */
                color: #ffffff;
                padding: 0em 0.2em;     /* ** MODIFIED: Narrower L/R padding (was 0.3em) ** */
                border-radius: 0.3em;       /* Smoother edges */
                line-height: 1;          /* MODIFIED: Was 1.3 */
                order: 1;
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }
         
            /* General Logo Style - UNCHANGED from pivot point */
            .rating-logo {
                height: 1.1em;
                width: auto;
                max-width: 75px; /* changed from 55 */
                vertical-align: middle;
                order: 2;
                line-height: 0;
            }
             /* Specific Logo Adjustments - UNCHANGED from pivot point */
            .tmdb-logo { height: 0.9em; }
            .rt-logo { height: 1.1em; }
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

// Inject the styles using try...catch for safety
    try {
       // Add the style content to Lampa's template system
       Lampa.Template.add(style_id, `<style data-id="${style_id}">${cssString}</style>`);       
       $('body').append(Lampa.Template.get(style_id, {}, true));
       // Optional: console.log("PsahxRatingsPlugin: Styles injected.");
    } catch (e) {
       console.error("PsahxRatingsPlugin [styles.js]: Error injecting styles:", e);
    } // <-- End of catch block
} // <-- End of injectStyles function definition

// <-- ENSURE THERE IS ABSOLUTELY NOTHING AFTER THIS LINE -->
