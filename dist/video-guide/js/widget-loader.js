/**
 * widget-loader.js
 *
 * purpose: asynchronously load widget.html and dispatch initialization event
 * dependencies: widget.html (fetched from the config's baseUrl), window.videoGuideConfig (optional)
 * output: dispatches 'videoGuideWidgetLoaded' custom event when HTML is injected
 * architecture: IIFE to avoid global scope pollution, inserts at end of body
 *
 * host page configuration:
 *   window.videoGuideConfig.baseUrl is the absolute url of the folder holding
 *   widget.html, css/, js/ and assets/ — e.g.
 *   'https://staging.karriere.hypoport.de/wp-content/plugins/job-portal/video-guide/'.
 *   it must end in a slash.
 *
 *   it is REQUIRED on wordpress. the fetch below resolves relative to the *document*
 *   url, so on a job offer page at /jobs/<slug>/ an empty base would request
 *   /jobs/<slug>/widget.html and 404. the empty-string default exists only for the
 *   standalone dev pages (index.html, demo2.html), which sit in the same folder as
 *   widget.html.
 *
 *   the same baseUrl is read again by video-guide.js to resolve the media paths
 *   inside the injected markup. see applyConfig() there.
 *
 *   the fetch is subject to the host page's csp: a restrictive connect-src will block
 *   it. serving widget.html same-origin with the page avoids cors entirely.
 */

(function() {
	// host page config, optional. every key has a fallback, so a page that sets
	// nothing still gets a working widget with the shipped demo media.
	var cfg = window.videoGuideConfig || {};

	var baseUrl = cfg.baseUrl || '';

	fetch(baseUrl + 'widget.html')
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
