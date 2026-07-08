/**
 * widget-loader.js
 *
 * purpose: asynchronously load widget.html and dispatch initialization event
 * dependencies: widget.html (fetched from WIDGET_BASE_URL)
 * output: dispatches 'videoGuideWidgetLoaded' custom event when HTML is injected
 * architecture: IIFE to avoid global scope pollution, inserts at end of body
 *
 * WordPress deployment:
 *   option a (fetch mode) — set WIDGET_BASE_URL to the absolute URL of the widget
 *   assets folder, e.g. 'https://cdn.example.com/video-guide/'.
 *   the default empty string works for same-origin / same-path setups only.
 *
 *   option b (inline mode, recommended for WP) — embed widget.html content directly
 *   via wp_footer hook and remove this loader entirely. eliminates the fetch
 *   path issue and works on any URL structure.
 */

(function() {
	// base URL for widget assets. set to absolute URL for WordPress or CDN deployment.
	// example: var WIDGET_BASE_URL = 'https://example.com/wp-content/themes/mytheme/video-guide/';
	var WIDGET_BASE_URL = '';

	fetch(WIDGET_BASE_URL + 'widget.html')
		.then(function(response) {
			if (!response.ok) throw new Error('HTTP ' + response.status);
			return response.text();
		})
		.then(function(html) {
			document.body.insertAdjacentHTML('beforeend', html);
			document.dispatchEvent(new CustomEvent('videoGuideWidgetLoaded'));
		})
		.catch(function(error) {
			console.error('video-guide: Failed to load widget.html:', error);
		});
})();
