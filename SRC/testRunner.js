(function () {
    'use strict';

    console.log('testRunner.js: Starting ES Module Test');
    Lampa.Noty.show('Starting ES Module Test...'); // Visual feedback in Lampa

    // **Replace with the ACTUAL URL where you hosted testModule.js**
    const moduleUrl = 'https://psahx.github.io/ERL/SRC/testModule.js';

    // Try dynamic import
    import(moduleUrl)
        .then(module => {
            console.log('testRunner.js: Dynamic import successful!');
            console.log('testRunner.js: Imported value:', module.esm_test_value);
            // Display success in Lampa UI
            Lampa.Noty.show('Success: ' + module.esm_test_value, { time: 10000 });
        })
        .catch(error => {
            console.error('testRunner.js: Dynamic import failed:', error);
            // Display failure in Lampa UI
            Lampa.Noty.show('ES Module Test FAILED: ' + error.message, { time: 10000 });
        });

})();
