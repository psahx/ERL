
    // --- Background Logo Fetcher/Cacher ---
    /**
     * Fetches logo if not already cached/pending, updates cache, and emits event.
     * @param {object} movieData - Object containing {id, method, title}
     */
    function fetchAndCacheLogo(movieData) {
         if (!movieData || !movieData.id || !movieData.method) {
             console.warn("fetchAndCacheLogo: Invalid movieData", movieData);
             return;
         }
         var id = movieData.id;

         if (logoCache.hasOwnProperty(id)) { // Already fetched or pending
              // console.log(`WorkspaceAndCacheLogo (ID: ${id}): Cache hit (${logoCache[id]}). Skipping fetch.`);
              return;
         }
         if (!network) { console.error(`WorkspaceAndCacheLogo (ID: ${id}): Network object not available.`); return; }

         logoCache[id] = 'pending'; // Mark as pending
         var method = movieData.method;
         var apiKey = Lampa.TMDB.key();
         var language = Lampa.Storage.get('language');
         var apiUrl = Lampa.TMDB.api((method === 'tv' ? 'tv/' : 'movie/') + id + '/images?api_key=' + apiKey + '&language=' + language);

         console.log(`WorkspaceAndCacheLogo (ID: ${id}): Fetching from ${apiUrl}`); // Keep log

         try {
             network.clear(); // Clear previous network activity
             network.timeout(config.request_timeout || 7000); // 7 sec timeout
             network.silent(apiUrl, function (response) { // Success
                  var logoPath = null;
                  if (response && response.logos && response.logos.length > 0) {
                      var pngLogo = response.logos.find(logo => logo.file_path && !logo.file_path.endsWith('.svg'));
                      logoPath = pngLogo ? pngLogo.file_path : response.logos[0].file_path;
                  }
                  var result = logoPath || false;
                  logoCache[id] = result;
                  console.log(`WorkspaceED & CACHED for ${id}: ${result}`); // Keep log
                  logoEventBus.emit('logo_updated', { id: id }); // Emit event
             }, function (xhr, status) { // Error
                  console.error(`API Error for ${id}, Status: ${status}`);
                  logoCache[id] = false; // Cache failure
                  logoEventBus.emit('logo_updated', { id: id }); // Emit event
             });
         } catch (e) {
              console.error(`Exception during network call for ${id}:`, e);
              logoCache[id] = false; // Cache failure
              logoEventBus.emit('logo_updated', { id: id }); // Emit event
         }
    }
