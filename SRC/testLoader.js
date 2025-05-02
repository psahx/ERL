(function () {
    'use strict';
    // **Replace with the ACTUAL URL where you hosted testRunner.js**
    const runnerUrl = 'https://psahx.github.io/ERL/SRC/testRunner.js';
    console.log('Lampa Loader: Attempting to load test runner:', runnerUrl);
    Lampa.Utils.putScriptAsync([runnerUrl], function () {
         console.log('Lampa Loader: putScriptAsync callback executed for test runner.');
         // The code inside testRunner.js should now be running or have run.
    });
})();
