/**
 * video-guide.js
 *
 * purpose: main video widget functionality - controls, state management, progress animation
 * dependencies: none (vanilla JS — no jQuery)
 * key functions: initVideoGuide(), setPercentage(), getRingProgress(), showBubble(),
 *                scheduleBubble(), scheduleBubbleHide(), runReveal(), revealInstant(),
 *                finishReveal(), publishRevealTiming()
 * event listeners: videoGuideWidgetLoaded (initialization trigger from widget-loader.js)
 *
 * architecture: waits for custom 'videoGuideWidgetLoaded' event before initializing.
 * all functionality scoped within initVideoGuide() to avoid global namespace pollution.
 */

// -> configuration

// pre-roll delay after window.load before runReveal() fires (milliseconds).
// increase if the host page or iframe needs more time to settle visually.
const REVEAL_DELAY_MS = 1500;

// -> intro reveal timing (milliseconds unless noted)
// single source of truth for the intro: runReveal() pushes every value onto
// .video-guide as a css custom property, so the js waits below and the css
// durations/iteration counts in base.scss can never drift apart. tune the whole
// intro from here.
//
// full sequence, measured from runReveal():
//   0                                widget rises from below the viewport
//   slideIn                          loader starts pulsing
//   slideIn + cycle * loops          the delivering inflation begins
//   slideIn + cycle * (loops + 1)    widget goes opaque, loader dissolves onto it
//   + dissolve                       loader out of layout, greeting armed
//
// the loader pulses `loaderLoops` times and then inflates once more — but that
// last inflation does not burst. it keeps expanding to the widget's own size and
// becomes it.
//
// the delivering inflation is exactly one cycle long, which is why there is no
// separate duration for it. that equality is load-bearing: it lets the deliver
// keyframes reuse the pulse's own 58% and 74% marks verbatim, so the two phases
// cannot drift no matter what loaderCycle is set to. before, those percentages
// had to be rederived by hand every time the tempo changed.
// loaderLoops counts the *pulses*, so the number of expanding rounds the visitor
// sees is loaderLoops + 1 — the delivering inflation is a round of its own.
const REVEAL = {
	slideIn:     700,   // below the viewport → anchored, spring-in easing
	loaderCycle: 3150,  // one pulse: inflate 1827 + hold 504 + burst/rebound 819
	loaderLoops: 2,     // pulses before the delivery → 3 expanding rounds total
	dissolve:    600    // loader circle fades onto the avatar underneath it
};

// -> chat bubble timing
// the greeting appears unprompted exactly once per page view and then stays put.
// it is never dismissed by a timer — only by the visitor hovering the widget and
// moving away again, or by opening the widget. see scheduleBubble().
const BUBBLE_DELAY_MS      = 3000; // wait after widget reveal before greeting
const BUBBLE_HIDE_GRACE_MS = 250;  // grace period when the cursor leaves avatar/bubble

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
	const bubbleCloseBtn    = document.getElementById('vg-btn-bubble-close');
	const progressGrabber   = document.querySelector('.video-guide__progress-grabber');
	const loader            = document.getElementById('vg-loader');

	// -> null guard
	// abort immediately if any critical element is missing (e.g. widget.html not loaded)
	if (!video || !playBtn || !volumeBtn ||
	    !videoWrapper || !progressRing || !progressRingRight ||
	    !widget || !splashEl || !chatBubble) {
		console.error('video-guide.js: Required DOM elements not found. Initialization aborted.');
		return;
	}

	// -> state

	let progressRafId     = null;  // requestAnimationFrame handle for progress loop
	let bubbleTimerId     = null;  // setTimeout handle for chat bubble auto-reveal
	let bubbleHideTimerId = null;  // setTimeout handle for the grace period before hiding the bubble
	let idleTimerId       = null;  // setTimeout handle for toggle auto-hide while expanded
	let inTriggerZone     = false; // whether cursor is currently over the hotspot/toggle zone
	let autoGreetingSpent = false; // the unprompted greeting has had its one turn
	let bubbleHoverArmed  = true;  // false while a resize-induced mouseenter is possible
	let bubbleDismissed   = false; // visitor closed the bubble — never show it again

	// -> chat bubble helpers

	function showBubble() {
		if (bubbleDismissed) return; // single choke point — covers auto reveal and hover alike
		clearTimeout(bubbleHideTimerId);
		chatBubble.classList.add('js-bubble-visible');
		chatBubble.setAttribute('aria-hidden', 'false');
	}

	function hideBubble() {
		chatBubble.classList.remove('js-bubble-visible');
		chatBubble.setAttribute('aria-hidden', 'true');
	}

	/**
	 * scheduleBubble()
	 * purpose: arm the one unprompted greeting allowed per page view
	 * input: none
	 * output: none — reveals the bubble after BUBBLE_DELAY_MS and leaves it up
	 * note: deliberately has no dismiss timer. the greeting waits for the visitor
	 *       instead of expiring on them. it goes away when they hover the widget
	 *       and move off again, or when they open the widget.
	 *       no-op once the greeting has had its turn, so it can never pop up
	 *       unprompted a second time. hover reveals call showBubble() directly and
	 *       are not limited.
	 */
	function scheduleBubble() {
		if (autoGreetingSpent) return;
		clearTimeout(bubbleTimerId);
		bubbleTimerId = setTimeout(function() {
			autoGreetingSpent = true;
			showBubble();
		}, BUBBLE_DELAY_MS);
	}

	/**
	 * scheduleBubbleHide()
	 * purpose: hide the bubble after a short grace period instead of immediately
	 * why: the bubble is clickable and sits away from the avatar, so the cursor has
	 *      to cross a gap to reach it. hiding on the avatar's mouseleave would pull
	 *      it away mid-journey. cancelled by the bubble's own mouseenter.
	 */
	function scheduleBubbleHide() {
		clearTimeout(bubbleHideTimerId);
		bubbleHideTimerId = setTimeout(hideBubble, BUBBLE_HIDE_GRACE_MS);
	}

	/**
	 * cancelBubble()
	 * purpose: hide the bubble and retire the unprompted greeting for good
	 * called when the visitor engages with the widget — once they've opened it,
	 * the greeting has served its purpose and must not reappear
	 */
	function cancelBubble() {
		autoGreetingSpent = true;
		clearTimeout(bubbleTimerId);
		clearTimeout(bubbleHideTimerId);
		hideBubble();
	}

	/**
	 * dismissBubble()
	 * purpose: close the greeting permanently for this page view
	 * input: none
	 * output: none — hides the bubble and blocks every future reveal
	 * differs from hideBubble(): a dismissed bubble does not come back on hover.
	 * closing something explicitly and having it return on hover reads as broken.
	 */
	function dismissBubble() {
		bubbleDismissed = true;
		cancelBubble();
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

	function scheduleToggleHide(isFirstReveal = false) {
		clearTimeout(idleTimerId);
		const delay = isFirstReveal ? 3000 : 250;
		idleTimerId = setTimeout(hideToggle, delay);
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
		inTriggerZone = false; // reset stale hotspot state from previous round
		scheduleToggleHide(true);
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

		// the splash snaps back to 128x128 and lands under a cursor that has not
		// moved — the visitor just clicked minimize in the corner. the browser
		// re-runs hit testing, fires mouseenter on the splash, and the greeting
		// pops straight back up. suppress hover reveals until the collapse settles.
		bubbleHoverArmed = false;

		// remove toggling class after animations complete (longest animation is 0.75s total)
		setTimeout(function() {
			if (toggleEl) toggleEl.classList.remove('js-toggle-toggling');
			bubbleHoverArmed = true;
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

	// -> bubble hover reveal
	// hover is on-demand and unlimited. it deliberately does NOT re-arm the
	// unprompted greeting — brushing past the widget used to start a fresh 3s
	// countdown, so the bubble could pop up over and over on one page view.

	splashEl.addEventListener('mouseenter', function() {
		if (!bubbleHoverArmed) return; // the widget resized under a still cursor
		clearTimeout(bubbleTimerId);   // an early hover pre-empts the auto greeting
		showBubble();
	});

	splashEl.addEventListener('mouseleave', function() {
		bubbleHoverArmed = true; // a real exit — hover reveals are welcome again
		scheduleBubbleHide();    // grace period — the cursor may be heading for the bubble
	});

	// -> chat bubble interaction
	// the bubble is a click target of its own: it no longer sits inside #vg-splash,
	// so it can't rely on clicks bubbling up to the splash handler.

	chatBubble.addEventListener('mouseenter', function() {
		clearTimeout(bubbleTimerId);
		showBubble(); // also cancels a pending hide
	});

	chatBubble.addEventListener('mouseleave', function() {
		scheduleBubbleHide(); // grace period — avoids a flicker on the way to the avatar
	});

	chatBubble.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		expandWidget();
	});

	// close button sits inside the bubble, so stopPropagation keeps its click from
	// reaching the bubble handler above and opening the widget instead of closing
	if (bubbleCloseBtn) bubbleCloseBtn.addEventListener('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		dismissBubble();
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

	// -> reveal

	/**
	 * publishRevealTiming()
	 * purpose: mirror the REVEAL config into css custom properties on the widget
	 * input: none
	 * output: none — sets --vg-reveal-slide / --vg-reveal-dissolve /
	 *         --vg-loader-cycle / --vg-loader-cycles on .video-guide
	 * why: base.scss declares the same four values as :root fallbacks. pushing the
	 *      js numbers over them keeps the setTimeout waits and the css durations
	 *      from drifting apart when someone retunes the intro.
	 * note: there is no --vg-reveal-deliver. the deliver phase runs for exactly one
	 *       --vg-loader-cycle, so it reads that one instead.
	 *       --vg-toggle-fade is not set here either — it is a momentary override
	 *       applied and removed inside runReveal()'s morph step, not config.
	 */
	function publishRevealTiming() {
		widget.style.setProperty('--vg-reveal-slide',    REVEAL.slideIn     + 'ms');
		widget.style.setProperty('--vg-reveal-dissolve', REVEAL.dissolve    + 'ms');
		widget.style.setProperty('--vg-loader-cycle',    REVEAL.loaderCycle + 'ms');
		widget.style.setProperty('--vg-loader-cycles',   String(REVEAL.loaderLoops));
	}

	/**
	 * runReveal()
	 * purpose: play the widget's intro — rise, pulse, deliver, morph
	 * input: none
	 * output: none — leaves the widget in its revealed, interactive end state
	 * sequence: see the REVEAL config block at the top of this file for the
	 *           measured timeline. .video-guide starts below the viewport via css,
	 *           not js, so a page where this never runs shows nothing rather than a
	 *           half-revealed widget.
	 */
	function runReveal() {
		publishRevealTiming();

		// visitors who asked for less motion get the end state, not the show
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			revealInstant();
			return;
		}

		// step 1 — slide in from past the bottom-right corner. the loader is the
		// only visible layer: __toggle and __content are still at opacity 0.
		widget.classList.add('js-reveal-enter');

		// step 2 — loader pulses REVEAL.loaderLoops times
		setTimeout(function() {
			if (loader) loader.classList.add('js-loader-loading');
		}, REVEAL.slideIn);

		// step 2b — the badge arrives one round before the delivery and stays for
		// the rest of the intro, so it spans the last pulse and the delivering
		// round both. it needs its own class because the pulse phase is a single
		// animation with an iteration count: every iteration is identical, so
		// there is no way to give only the last one a badge from inside it.
		//
		// this class is never removed, and the badge's animation is declared under
		// it alone. that is what lets the reveal survive the pulse → deliver swap
		// happening underneath it without restarting.
		setTimeout(function() {
			if (loader) loader.classList.add('js-loader-badge');
		}, Math.max(REVEAL.slideIn,
		            REVEAL.slideIn + REVEAL.loaderCycle * (REVEAL.loaderLoops - 1)));

		// step 3 — the delivering inflation. the pulse class comes off and the
		// deliver class goes on at a whole cycle boundary, where every animation's
		// last keyframe already equals its element's base state — so the swap snaps
		// nothing. see the invariant noted above .js-loader-loading in base.scss.
		//
		// the deliver phase opens with the same inflate and hold as a pulse, to the
		// millisecond, so it is indistinguishable until the moment it would burst.
		// then it expands to the widget's size instead.
		const deliverAt = REVEAL.slideIn + REVEAL.loaderCycle * REVEAL.loaderLoops;

		setTimeout(function() {
			if (loader) {
				loader.classList.remove('js-loader-loading');
				loader.classList.add('js-loader-deliver');
			}
		}, deliverAt);

		// step 4 — the morph. by now the loader's circle is an opaque 128px disc
		// sitting exactly on the toggle's own 128px disc, same colour, same centre.
		//
		// the widget is revealed with its fade zeroed because it is completely
		// hidden behind that disc: a 400ms fade nobody can see is 400ms of dead
		// wall time. it must not be revealed any earlier either — while the loader
		// is still smaller than 128px, the widget would show around it.
		//
		// this timer does not have to be frame-accurate. vg-loader-deliver finishes
		// expanding at 90% of the cycle and then holds at 128px for the remaining
		// 10%, so there is a whole 315ms window in which this can land and still
		// find the disc at full size. that hold exists for exactly this reason.
		const morphAt = deliverAt + REVEAL.loaderCycle;

		setTimeout(function() {
			widget.style.setProperty('--vg-toggle-fade', '0ms');
			widget.classList.add('js-widget-ready');
			if (loader) loader.classList.add('js-loader-out');
		}, morphAt);

		// step 5 — loader out of the layout, toggle's own fade handed back to the
		// minimize/maximize flow, greeting armed
		setTimeout(function() {
			if (loader) loader.classList.add('js-hidden');
			widget.style.removeProperty('--vg-toggle-fade');
			finishReveal();
		}, morphAt + REVEAL.dissolve);
	}

	/**
	 * revealInstant()
	 * purpose: land on the revealed end state with no intro animation
	 * input: none
	 * output: none — same end state runReveal() reaches the long way round
	 * used by: the prefers-reduced-motion branch of runReveal()
	 * note: zeroing the transition durations first is what suppresses the slide —
	 *       .js-reveal-enter still changes the transform, it just has no time to
	 *       animate. the loader never appears at all, so the deliver and dissolve
	 *       phases are skipped outright rather than played instantly.
	 */
	function revealInstant() {
		widget.style.setProperty('--vg-reveal-slide', '0ms');
		widget.style.setProperty('--vg-reveal-dissolve', '0ms');

		if (loader) loader.classList.add('js-hidden');
		widget.classList.add('js-reveal-enter');
		widget.classList.add('js-widget-ready');

		// --vg-toggle-fade is deliberately left alone here. it exists to skip a fade
		// the visitor cannot see because the loader's disc is covering it, and there
		// is no loader in this path. the toggle's own 0.4s opacity fade stands: it is
		// a fade, not motion, so reduced-motion has no quarrel with it.
		finishReveal();
	}

	/**
	 * finishReveal()
	 * purpose: shared tail of every reveal variant, independent of how it animated
	 * input: none
	 * output: none — arms the one unprompted greeting
	 * why separate: the greeting timing stays identical across animations, so it
	 *               hangs off the end of the sequence instead of living inside it.
	 */
	function finishReveal() {
		scheduleBubble();
	}

	// reveal after window.load + configurable pre-roll delay (REVEAL_DELAY_MS)
	window.addEventListener('load', function() {
		setTimeout(runReveal, REVEAL_DELAY_MS);
	});

}
