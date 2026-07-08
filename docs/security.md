# Security

## Threat model in one line

The widget runs on third-party WordPress pages and plays hardcoded sample videos. The realistic risks today are (a) DOM-based XSS if anyone wires user input into `innerHTML`, and (b) supply-chain compromise of any third-party script the host page chooses to load.

## XSS prevention

- **Never** use `innerHTML` with anything that isn't a trusted, hardcoded template.
- Current allowed uses of `innerHTML` (all safe — hardcoded SVG strings): `playPause.innerHTML = SVG_PLAY / SVG_PAUSE`, `speakerBtn.innerHTML = SVG_VOLUME_ON / SVG_VOLUME_OFF`. These are constant strings in `video-guide.js`; the value is never derived from user input.
- For text content from any external source, use `textContent` (auto-escapes).
- For structured content from any external source, use `createElement` + `appendChild`.
- If a future feature accepts external markup (e.g. captions HTML from a CMS), use DOMPurify or equivalent.

```js
// ❌ unsafe
element.innerHTML = userInput;

// ✅ safe
element.textContent = userInput;
```

## Input validation

- The widget currently has no user input. Any future input (video URL via query string, config from window globals, etc.) must be validated at the boundary.
- For URLs: require `https://`. Reject anything that isn't HTTP/HTTPS. Reject `javascript:` and `data:` schemes outright.
- For file types: require the extension and the `Content-Type` to both be in the allowlist (`.webm` / `video/webm`, `.mp4` / `video/mp4`).

```js
// ✅ minimal URL validator
function isSafeVideoUrl(u) {
    try {
        const url = new URL(u, window.location.href);
        return url.protocol === 'https:' && /\.(webm|mp4)(\?|$)/i.test(url.pathname);
    } catch { return false; }
}
```

## External resources

- All third-party assets must be loaded over HTTPS in production. Currently the widget has no external script or stylesheet dependencies — keep it that way unless there's a strong reason.
- If you ever load anything cross-origin, set explicit CORS expectations and document them.

## Destructive operations

- Before suggesting `rm`, file deletion, mass refactor, or anything that destroys content the user can't trivially recover: require explicit user confirmation. Label with `⚠️ WARNING:`.
- Recommend snapshot/backup (or `git commit`) before risky changes — even though this project doesn't currently use git, a manual copy of the folder is cheap insurance.

## Hypoport policy reminders

Already enforced at org level; do not paste into prompts:

- Secrets, credentials, internal tokens
- Real personal customer data
- Internal infrastructure details that aren't already public
- Auth/SSO configuration data
