// In loader.js (root folder)
const mainScriptUrl = 'https://psahx.github.io/ERL/SRC/main.js'; // Replace with actual URL
Lampa.Utils.putScriptAsync([mainScriptUrl], function () {
    console.log("PsahxRatingsPlugin: Executing loader.js");
});
