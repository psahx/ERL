// --- Helper Function to Fetch and Display Logo (v4 - Text Placeholder) ---
    function displayLogoInElement(targetElement, movieData, imageSize, styleAttr) {
        console.log("displayLogoInElement: Called");
        // Initial checks for target element
        if (!targetElement || !targetElement.length) {
            console.warn("LogoHelper: Invalid targetElement provided.");
            return;
        }
        // Initial checks for movie data (need title for placeholder)
        if (!movieData || !movieData.id || !movieData.method || !movieData.title) {
             console.warn("LogoHelper: Invalid movieData (missing id, method, or title). Cannot set placeholder or fetch logo.");
             // Clear target if no title available? Or leave previous? Clearing safer.
             targetElement.empty();
             return;
        }
        console.log("displayLogoInElement: Target valid?", true);
        console.log("displayLogoInElement: MovieData ID:", movieData.id, "Method:", movieData.method);

        // --- Set Text Title as Initial Placeholder ---
        console.log("displayLogoInElement: Setting text title placeholder:", movieData.title);
        // Make sure Lampa correctly handles setting text content here
        targetElement.text(movieData.title);
        // -------------------------------------------

        // Check network object availability
        if (!network) {
            console.error("LogoHelper: Global network instance not available. Text title remains.");
            return; // Exit, leave text title placeholder
        }

        var method = movieData.method;
        var id = movieData.id;
        var apiKey = Lampa.TMDB.key();
        var language = Lampa.Storage.get('language');
        var apiUrl = Lampa.TMDB.api((method === 'tv' ? 'tv/' : 'movie/') + id + '/images?api_key=' + apiKey + '&language=' + language);

        console.log("displayLogoInElement: Attempting to fetch logo from URL:", apiUrl);

        try {
            network.clear(); // Prevent previous requests interfering
            network.timeout(config.request_timeout || 7000); // 7 second timeout? Adjust if needed
            network.silent(apiUrl, function (response) {
                // --- Success Callback ---
                console.log("displayLogoInElement: API Success. Response:", response);
                var logoPath = null;
                // Find logo path logic...
                if (response && response.logos && response.logos.length > 0) {
                    var pngLogo = response.logos.find(logo => logo.file_path && !logo.file_path.endsWith('.svg'));
                    logoPath = pngLogo ? pngLogo.file_path : response.logos[0].file_path;
                }

                if (logoPath) {
                    // ** Only replace if logo IS found **
                    console.log("displayLogoInElement: Logo found, path:", logoPath);
                    var imgUrl = Lampa.TMDB.image('/t/p/' + imageSize + logoPath);
                    var imgTagHtml = '<img src="' + imgUrl + '" style="' + styleAttr + '" alt="' + movieData.title + ' Logo" />';
                    // --- Update UI ---
                    targetElement.empty().html(imgTagHtml); // --- Force Reflow (Attempt) ---
                    targetElement[0].offsetHeight; // --- Accessing offsetHeight forces browser reflow
                    console.log("displayLogoInElement: Logo image inserted.");
                } else {
                    // ** No logo found - DO NOTHING (text placeholder set earlier remains) **
                    console.log("displayLogoInElement: No logo found in response. Text placeholder remains.");
                }
            }, function (xhr, status) {
                // --- Error Callback ---
                console.error("LogoHelper: Failed to fetch logo. Status:", status, "XHR:", xhr);
                // ** DO NOTHING (text placeholder set earlier remains) **
                console.log("displayLogoInElement: API Error. Text placeholder remains.");
            });
        } catch (e) {
             console.error("LogoHelper: Error occurred *during* network call setup/execution:", e);
             // ** DO NOTHING (text placeholder set earlier remains) **
             console.log("displayLogoInElement: Exception occurred. Text placeholder remains.");
        }
    }
    // --- End Helper Function to Fetch and Display Movie Logo ---
