// SRC/main.js (Minimal Test Version)
'use strict';

console.log('--- PsahxRatingsPlugin: main.js MINIMAL TEST EXECUTING ---');

try {
    // Attempt a basic Lampa interaction
    if (window.Lampa && Lampa.Noty) {
        Lampa.Noty.show('main.js minimal test executed!', { time: 4000 });
        console.log('--- PsahxRatingsPlugin: Lampa.Noty called from minimal main.js ---');
    } else {
        console.log('--- PsahxRatingsPlugin: Lampa.Noty not found in minimal main.js (might be too early?) ---');
    }
} catch (e) {
    console.error('--- PsahxRatingsPlugin: Error in minimal main.js ---', e);
}
