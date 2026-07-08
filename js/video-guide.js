/**
 * video-guide.js
 *
 * purpose: main video widget functionality - controls, state management, progress animation
 * dependencies: none (vanilla JS — no jQuery)
 * key functions: initVideoGuide(), setPercentage(), getRingProgress(), showBubble(), scheduleBubble()
 * event listeners: videoGuideWidgetLoaded (initialization trigger from widget-loader.js)
 *
 * architecture: waits for custom 'videoGuideWidgetLoaded' event before initializing.
 * all functionality scoped within initVideoGuide() to avoid global namespace pollution.
 */

// -> configuration

// extra delay after window.load before the widget reveals itself (milliseconds).
// increase if the host page or iframe needs more time to settle visually.
const REVEAL_DELAY_MS = 1500;

// -> initialization

document.addEventListener('videoGuideWidgetLoaded', function() {
	initVideoGuide();
});

/**
 * initVideoGuide()
 * purpose: initialize all video controls, event listeners, and UI state management
 * input: none (reads DOM elements after widget HTML is loaded)
 * output: none (sets up event listeners and interactive functionality)
 * dependencies: requires widget.html to be loaded in DOM
 * scope: all widget functionality contained within this function
 */
function initVideoGuide() {

	// -> element references

	const video             = document.getElementById('vg-video');
	const playBtn           = document.getElementById('vg-btn-play');
	const volumeBtn         = document.getElementById('vg-btn-volume');
	const contentEl         = document.querySelector('.video-guide__content');
	const contentHotspot    = document.querySelector('.video-guide__content-hotspot');
	const videoWrapper      = document.querySelector('.video-guide__video-wrapper');
	const progressRing      = document.querySelector('.video-guide__progress-ring');
	const progressRingRight = document.querySelector('.video-guide__progress-ring-right');
	const widget            = document.querySelector('.video-guide');
	const splashEl          = document.getElementById('vg-splash');
	const toggleEl          = document.getElementById('vg-toggle');
	const chatBubble        = document.querySelector('.video-guide__chat-bubble');
	const loader            = document.querySelector('.video-guide__loader');
	const loaderIcon        = loader ? loader.querySelector('svg') : null;
	const progressGrabber   = document.querySelector('.video-guide__progress-grabber');

	// -> null guard
	// abort immediately if any critical element is missing (e.g. widget.html not loaded)
	if (!video || !playBtn || !volumeBtn ||
	    !videoWrapper || !progressRing || !progressRingRight ||
	    !widget || !splashEl || !chatBubble) {
		console.error('video-guide.js: Required DOM elements not found. Initialization aborted.');
		return;
	}

	// -> state

	let progressRafId  = null; // requestAnimationFrame handle for progress loop
	let bubbleTimerId  = null; // setTimeout handle for chat bubble auto-reveal
	let idleTimerId    = null; // setTimeout handle for toggle auto-hide while expanded

	// -> chat bubble helpers

	function showBubble() {
		chatBubble.classList.add('js-bubble-visible');
		chatBubble.setAttribute('aria-hidden', 'false');
	}

	function hideBubble() {
		chatBubble.classList.remove('js-bubble-visible');
		chatBubble.setAttribute('aria-hidden', 'true');
	}

	function scheduleBubble() {
		clearTimeout(bubbleTimerId);
		bubbleTimerId = setTimeout(showBubble, 3000);
	}

	function cancelBubble() {
		clearTimeout(bubbleTimerId);
		hideBubble();
	}

	// -> progress ring animation

	/**
	 * setPercentage()
	 * purpose: update circular progress ring visualization
	 * input: v (number) - progress percentage (0-100)
	 * output: rotates .video-guide__progress-ring-right to show progress
	 * logic: 0-50% unmasks right half; 50-100% right half matches background + unmasks left half
	 */
	function setPercentage(v) {
		let perct = v * 3.6;
		if (v >= 50) {
			progressRingRight.style.background = 'inherit';
			perct = perct - 180;
		} else {
			progressRingRight.style.background = 'var(--vg-primary)';
		}
		progressRingRight.style.transform = 'rotate(' + perct + 'deg)';
		if (progressGrabber) progressGrabber.style.transform = 'rotate(' + (v * 3.6) + 'deg)';
	}

	/**
	 * startProgressLoop()
	 * purpose: start RAF-based progress ring update — single loop, no interval leak
	 * called when video starts playing
	 */
	function startProgressLoop() {
		if (progressRafId) return; // already running
		function loop() {
			if (video.duration > 0) {
				setPercentage(Math.round((video.currentTime / video.duration) * 100));
			}
			progressRafId = requestAnimationFrame(loop);
		}
		progressRafId = requestAnimationFrame(loop);
	}

	/**
	 * stopProgressLoop()
	 * purpose: cancel RAF progress loop
	 * called when video pauses or ends
	 */
	function stopProgressLoop() {
		if (progressRafId) {
			cancelAnimationFrame(progressRafId);
			progressRafId = null;
		}
	}

	// -> video event listeners

	// svg icon strings — defined once, reused by setPlayPauseIcon()
	const SVG_PLAY  = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><g id="play-arrow"><path id="Union" fill="#000000" d="M7 6.82098c0.00052 -1.5777 1.74299 -2.53351 3.0742 -1.68652l8.1367 5.17774c1.235 0.7859 1.2349 2.589 0 3.375l-8.1367 5.1777c-1.33132 0.8472 -3.07392 -0.1085 -3.0742 -1.6865zM9 17.1784l8.1377 -5.1787L9 6.82098z" stroke-width=".5"></path></g></svg>';
	const SVG_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><g id="Pause-Fill--Streamline-Rounded-Fill-Material"><path fill="#000000" d="M15.375 19c-0.4125 0 -0.7656 -0.1469 -1.05925 -0.44075 -0.29385 -0.29365 -0.44075 -0.64675 -0.44075 -1.05925V6.5c0 -0.4125 0.1469 -0.76565 0.44075 -1.0595 0.29365 -0.29365 0.64675 -0.4405 1.05925 -0.4405h1.375c0.4125 0 0.76565 0.14685 1.0595 0.4405 0.29365 0.29385 0.4405 0.647 0.4405 1.0595v11c0 0.4125 -0.14685 0.7656 -0.4405 1.05925 -0.29385 0.29385 -0.647 0.44075 -1.0595 0.44075h-1.375ZM7.25 19c-0.4125 0 -0.7656 -0.1469 -1.05925 -0.44075C5.8969 18.2656 5.75 17.9125 5.75 17.5V6.5c0 -0.4125 0.1469 -0.76565 0.44075 -1.0595C6.4844 5.14685 6.8375 5 7.25 5h1.375c0.4125 0 0.76565 0.14685 1.0595 0.4405 0.29365 0.29385 0.4405 0.647 0.4405 1.0595v11c0 0.4125 -0.14685 0.7656 -0.4405 1.05925 -0.29385 0.29385 -0.647 0.44075 -1.0595 0.44075H7.25Z" stroke-width="0.5"></path></g></svg>';

	/**
	 * setPlayPauseIcon()
	 * purpose: swap play/pause button SVG and aria-pressed in sync
	 * input: playing (boolean)
	 */
	function setPlayPauseIcon(playing) {
		playBtn.innerHTML = playing ? SVG_PAUSE : SVG_PLAY;
		playBtn.setAttribute('aria-pressed', String(playing));
	}

	// video state → ui sync
	video.addEventListener('play', function() {
		setPlayPauseIcon(true);
		videoWrapper.classList.add('js-playing');
		widget.classList.add('js-playing');
		startProgressLoop();
	});

	video.addEventListener('pause', function() {
		setPlayPauseIcon(false);
		videoWrapper.classList.remove('js-playing');
		widget.classList.remove('js-playing');
		stopProgressLoop();
	});

	video.addEventListener('ended', function() {
		setPlayPauseIcon(false);
		videoWrapper.classList.remove('js-playing');
		stopProgressLoop();
	});

	video.addEventListener('error', function() {
		const err = video.error;
		const codes = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' };
		console.error('video-guide: Video load error:', err ? (codes[err.code] || 'code ' + err.code) : 'unknown');
		videoWrapper.classList.add('js-error');
	});

	// -> play/pause controls

	// play/pause button toggle
	playBtn.addEventListener('click', function() {
		if (video.paused) {
			video.play().catch(function(err) {
				console.warn('video-guide: play() blocked:', err);
			});
		} else {
			video.pause();
		}
	});

	// click on video wrapper also toggles play/pause, but not when clicking a control button
	videoWrapper.addEventListener('click', function(e) {
		if (!e.target.closest('#vg-btn-play')) {
			playBtn.click();
		}
	});

	// -> volume controls

	const SVG_VOLUME_ON  = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><g id="volume-up"><path id="Union" fill="#000000" d="M14.0732 4.20703c0.2073 -0.51189 0.7899 -0.75889 1.3018 -0.55176C18.6714 4.98968 21 8.2224 21 12.001c-0.0003 3.7783 -2.3288 7.0104 -5.625 8.3447 -0.5118 0.207 -1.0945 -0.0401 -1.3018 -0.5518 -0.207 -0.5118 0.04 -1.0945 0.5518 -1.3017 2.5669 -1.0391 4.3747 -3.5555 4.375 -6.4912 0 -2.93606 -1.8079 -5.45298 -4.375 -6.49221 -0.5118 -0.20717 -0.7587 -0.78993 -0.5518 -1.30176m-3.7539 1.31055c0.2914 -0.27053 0.7156 -0.34332 1.0801 -0.18457 0.3646 0.15897 0.6006 0.51927 0.6006 0.91699v11.5c0 0.3977 -0.236 0.758 -0.6006 0.917 -0.3645 0.1588 -0.7887 0.086 -1.0801 -0.1846L7.10742 15.5H5c-1.10457 0 -2 -0.8954 -2 -2v-3c0.00002 -1.10455 0.89544 -2 2 -2h2.10742zM14 7.96777C15.4817 8.7041 16.4999 10.2332 16.5 12c0 1.7668 -1.0183 3.2959 -2.5 4.0322zM8.18066 10.2324c-0.18496 0.1718 -0.42825 0.2676 -0.68066 0.2676H5v3h2.5c0.2524 0 0.4957 0.0958 0.68066 0.2676L10 15.4561V8.54297z" stroke-width=".5"></path></g></svg>';
	const SVG_VOLUME_OFF = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true"><g id="volume-off"><path id="Union" fill="#000000" d="M1.28784 2.71265c0.3935 -0.39351 1.0313 -0.39351 1.42481 0L21.2878 21.2878c0.3932 0.3936 0.3934 1.0314 0 1.4248 -0.3934 0.3935 -1.0312 0.3933 -1.4248 0l-3.0879 -3.0878c-0.4429 0.2782 -0.9099 0.5221 -1.4003 0.7207 -0.5118 0.2069 -1.0945 -0.0402 -1.3018 -0.5518 -0.2069 -0.5118 0.0401 -1.0945 0.5518 -1.3018 0.2372 -0.096 0.467 -0.2066 0.6904 -0.3271l-3.3154 -3.3154v2.9004c-0.0001 0.3977 -0.2361 0.758 -0.6006 0.9169 -0.3645 0.1587 -0.7888 0.086 -1.0801 -0.1845l-3.21192 -2.9824H4.99976c-1.10447 -0.0002 -1.99999 -0.8956 -2 -2v-3c0.00009 -1.10446 0.89558 -1.99993 2 -2.00004h0.65039L1.28784 4.13745c-0.393501 -0.3935 -0.393501 -1.0313 0 -1.4248M14.073 4.20679c0.2072 -0.51178 0.7899 -0.75873 1.3018 -0.55176 3.2963 1.33439 5.6249 4.56719 5.625 8.34567 -0.0002 1.7556 -0.5031 3.3932 -1.3721 4.7774l-1.4619 -1.4619c0.5318 -0.9872 0.8338 -2.1163 0.834 -3.3155 -0.0001 -2.93594 -1.808 -5.45294 -4.375 -6.49216 -0.5117 -0.20724 -0.7587 -0.79 -0.5518 -1.30175M7.6394 10.489c-0.046 0.0065 -0.09269 0.0108 -0.13964 0.0108h-2.5v3h2.5c0.25232 0 0.49572 0.0959 0.68066 0.2675l1.81934 1.6885v-2.6064zm6.3604 -2.52147c1.4816 0.73631 2.4998 2.26547 2.5 4.03227 0 0.4959 -0.0843 0.9718 -0.2325 1.4179l-2.2675 -2.2676zm-3.6807 -2.4502c0.2913 -0.27047 0.7156 -0.34319 1.0801 -0.18457 0.3645 0.15896 0.6005 0.51934 0.6006 0.917v2.90039L9.3064 6.45679z" stroke-width=".5"></path></g></svg>';

	/**
	 * setVolumeIcon()
	 * purpose: swap volume button SVG and aria-pressed to match mute state
	 * input: muted (boolean)
	 */
	function setVolumeIcon(muted) {
		volumeBtn.innerHTML = muted ? SVG_VOLUME_OFF : SVG_VOLUME_ON;
		volumeBtn.setAttribute('aria-pressed', String(muted));
	}

	volumeBtn.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		video.muted = !video.muted;
		setVolumeIcon(video.muted);
	});

	// set initial volume icon to match current mute state
	setVolumeIcon(video.muted);

	// -> minimize/maximize controls

	function hideToggle() {
		if (toggleEl) toggleEl.classList.add('js-toggle-idle');
	}

	function revealToggle() {
		if (toggleEl) toggleEl.classList.remove('js-toggle-idle');
	}

	function scheduleToggleHide() {
		clearTimeout(idleTimerId);
		idleTimerId = setTimeout(hideToggle, 250);
	}

	function cancelToggleHide() {
		clearTimeout(idleTimerId);
		revealToggle();
	}

	function expandWidget() {
		widget.classList.remove('js-minimized');
		cancelBubble();
		splashEl.classList.replace('js-splash-expanded', 'js-splash-minimized');
		if (toggleEl) toggleEl.classList.add('js-toggle-revealed');
		if (contentEl) contentEl.classList.replace('js-content-minimized', 'js-content-expanded');
		scheduleToggleHide();
	}

	function collapseWidget() {
		cancelToggleHide();
		video.pause();
		splashEl.classList.replace('js-splash-minimized', 'js-splash-expanded');
		if (toggleEl) {
			toggleEl.classList.add('js-toggle-toggling');
			toggleEl.classList.remove('js-toggle-revealed');
		}
		if (contentEl) contentEl.classList.replace('js-content-expanded', 'js-content-minimized');

		// remove toggling class after animations complete (longest animation is 0.75s total)
		setTimeout(function() {
			if (toggleEl) toggleEl.classList.remove('js-toggle-toggling');
		}, 1000);
	}

	splashEl.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		expandWidget();
	});

	if (toggleEl) toggleEl.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		if (toggleEl.classList.contains('js-toggle-revealed')) {
			collapseWidget();
		} else {
			expandWidget();
		}
	});

	// -> toggle reveal trigger (top-right hotspot union toggle rect)
	// mousemove + getBoundingClientRect avoids any pointer-events/z-index conflict
	// with the progress ring or video hover underneath the hotspot's visual area.
	// toggle's own rect is re-measured live and included in the zone union so hovering
	// it directly also counts — this only re-evaluates on real cursor movement, never on
	// animation frames, so the toggle sliding in/out via css transition cannot trigger
	// a spurious hide while the cursor sits still.

	if (contentHotspot && toggleEl) {
		let inTriggerZone = false;

		function pointInRect(x, y, rect) {
			return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
		}

		document.addEventListener('mousemove', function(e) {
			if (!contentEl || !contentEl.classList.contains('js-content-expanded')) return;

			const hotspotRect = contentHotspot.getBoundingClientRect();
			const toggleRect  = toggleEl.getBoundingClientRect();
			const inZone = pointInRect(e.clientX, e.clientY, hotspotRect) ||
			               pointInRect(e.clientX, e.clientY, toggleRect);

			if (inZone && !inTriggerZone) {
				inTriggerZone = true;
				revealToggle();
				clearTimeout(idleTimerId);
			} else if (!inZone && inTriggerZone) {
				inTriggerZone = false;
				scheduleToggleHide();
			}
		});
	}

	// show bubble immediately on hover, re-arm timer on leave
	splashEl.addEventListener('mouseenter', function() {
		showBubble();
		clearTimeout(bubbleTimerId);
	});

	splashEl.addEventListener('mouseleave', function() {
		hideBubble();
		scheduleBubble();
	});

	// -> progress ring scrubbing

	/**
	 * getRingProgress()
	 * purpose: calculate 0-1 seek position from pointer angle on the progress ring
	 * input: e (PointerEvent) - pointer event from the ring element
	 * output: (number) 0 to 1 — progress position (0 = start, 1 = end)
	 * math: atan2 returns angle from 3 o'clock; we add PI/2 to shift origin to 12 o'clock (top),
	 *       then normalize to 0-1 for clockwise progress.
	 */
	function getRingProgress(e) {
		const rect = progressRing.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const dx = e.clientX - centerX;
		const dy = e.clientY - centerY;
		let angle = Math.atan2(dy, dx) + Math.PI / 2;
		if (angle < 0) angle += Math.PI * 2;
		return angle / (Math.PI * 2);
	}

	let isDragging = false;
	let hasDragged = false;

	function seekToPointer(e) {
		if (!isFinite(video.duration) || video.duration <= 0) return;
		const progress = getRingProgress(e);
		video.currentTime = progress * video.duration;
		setPercentage(Math.round(progress * 100));
	}

	progressRing.addEventListener('pointerdown', function(e) {
		isDragging = true;
		hasDragged = false;
		progressRing.setPointerCapture(e.pointerId); // track pointer even if it leaves the element
		progressRing.classList.add('js-dragging');
		seekToPointer(e);
	});

	progressRing.addEventListener('pointermove', function(e) {
		if (!isDragging) return;
		hasDragged = true;
		seekToPointer(e);
	});

	progressRing.addEventListener('pointerup', function(e) {
		if (!isDragging) return;
		isDragging = false;
		progressRing.classList.remove('js-dragging');
		if (!hasDragged) {
			seekToPointer(e); // pure click with no drag movement
		}
	});

	progressRing.addEventListener('pointercancel', function() {
		isDragging = false;
		hasDragged = false;
		progressRing.classList.remove('js-dragging');
	});

	// -> keyboard shortcuts
	// space: play/pause

	window.addEventListener('keydown', function(e) {
		if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
			e.preventDefault();
			playBtn.click();
		}
	});

	// -> initial state

	setPercentage(0);
	setPlayPauseIcon(false);

	// -> loader icon attract interaction
	// listens on document so cursor position is tracked outside the widget element.
	// attraction zone: bottom-right quadrant (x > 50vw, y > 50vh).
	// strength scales with proximity — closer = stronger pull, max offset 14px.
	// outside the zone: css spring transition snaps icon back to center.

	if (loader && loaderIcon) {
		const MAX_OFFSET = 14;

		document.addEventListener('mousemove', function(e) {
			if (loader.classList.contains('js-hidden')) return;

			const inZone = e.clientX > window.innerWidth * 0.5 && e.clientY > window.innerHeight * 0.5;

			if (!inZone) {
				// outside zone — let css spring handle snap-back
				if (loaderIcon.classList.contains('js-attracting')) {
					loaderIcon.classList.remove('js-attracting');
					loaderIcon.style.transform = 'translate(0, 0)';
				}
				return;
			}

			const rect    = loader.getBoundingClientRect();
			const cx      = rect.left + rect.width  / 2;
			const cy      = rect.top  + rect.height / 2;
			const dx      = e.clientX - cx;
			const dy      = e.clientY - cy;
			const dist    = Math.sqrt(dx * dx + dy * dy) || 1;
			// normalize against the diagonal of the attraction quadrant
			const maxDist = Math.sqrt(
				Math.pow(window.innerWidth  * 0.5, 2) +
				Math.pow(window.innerHeight * 0.5, 2)
			);
			const strength = 1 - Math.min(dist / maxDist, 1);

			// suppress spring transition while actively attracting
			loaderIcon.classList.add('js-attracting');
			loaderIcon.style.transform =
				'translate(' +
				(dx / dist * MAX_OFFSET * strength).toFixed(2) + 'px, ' +
				(dy / dist * MAX_OFFSET * strength).toFixed(2) + 'px)';
		});
	}

	// reveal after window.load + configurable extra delay (REVEAL_DELAY_MS)
	window.addEventListener('load', function() {
		setTimeout(function() {
			if (loader) loader.classList.add('js-hidden');
			widget.classList.add('js-widget-ready');
			// delay content fade-in by 1s relative to toggle — one-time only on reveal
			if (contentEl) contentEl.style.transitionDelay = '1s';
			setTimeout(function() {
				if (contentEl) contentEl.style.transitionDelay = '';
			}, 1400); // 1s delay + 0.4s fade duration
			scheduleBubble();
		}, REVEAL_DELAY_MS);
	});

}
