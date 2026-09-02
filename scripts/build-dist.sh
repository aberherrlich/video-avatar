#!/usr/bin/env bash
#
# build-dist.sh
#
# purpose: assemble the deployable widget tree in dist/video-guide/
# input: none (reads the workspace, resolves paths from this script's own location)
# output: dist/video-guide/ — widget.html, js/, scss/, assets/, docs/, HANDOVER.md, VERSION
# dependencies: bash, rsync, git. does NOT compile scss — see the css guard below.
#
# the css is not built here on purpose. this host has no sass cli (no node, no npx,
# no sass), so scss/base.scss compiles only through the glenn2223.live-sass vs code
# extension on save. that extension is configured in .vscode/settings.json to write
# two outputs at once: compressed to css/ for the dev pages, expanded to
# dist/video-guide/css/ for this export. so the order is always:
#
#   1. save scss/base.scss in vs code
#   2. run this script
#
# forgetting step 1 is the one failure mode that would silently ship a stale
# stylesheet, so this script refuses to run rather than let that happen.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist/video-guide"

SRC_SCSS="$ROOT/scss/base.scss"
DIST_CSS="$DIST/css/base.css"

# -> css guard
# the expanded build is owned by live sass compile, not by this script. bail out
# loudly if it is missing or older than its own source.

if [[ ! -f "$DIST_CSS" ]]; then
	echo "ERROR: $DIST_CSS is missing." >&2
	echo "       open scss/base.scss in vs code and save it — live sass compile writes" >&2
	echo "       both css/base.css (compressed) and dist/video-guide/css/base.css" >&2
	echo "       (expanded). then run this script again." >&2
	exit 1
fi

if [[ "$SRC_SCSS" -nt "$DIST_CSS" ]]; then
	echo "ERROR: $DIST_CSS is older than scss/base.scss." >&2
	echo "       the export would ship a stale stylesheet. save scss/base.scss in vs" >&2
	echo "       code to recompile, then run this script again." >&2
	exit 1
fi

# -> tree

mkdir -p "$DIST/js" "$DIST/scss" "$DIST/assets" "$DIST/docs"

# -> markup and scripts

cp "$ROOT/widget.html" "$DIST/widget.html"
rsync -a --delete "$ROOT/js/" "$DIST/js/"

# -> scss source
# shipped deliberately. the overwhelming majority of base.scss's comments are `//`,
# which sass strips from every output format including expanded — the compiled css
# cannot carry them. the source is the only place that commentary survives, and
# on-host tooling needs it.
cp "$SRC_SCSS" "$DIST/scss/base.scss"

# -> runtime assets
# only the two files the widget actually loads at runtime. sample/ holds ~86MB of dev
# media (the 43MB webm and 27MB mp4 among it) and is not part of the distribution —
# per-offer video comes from the wordpress media library via window.videoGuideConfig.
rsync -a --delete "$ROOT/assets/" "$DIST/assets/"

# -> docs
# handover.md is copied to the tree root as HANDOVER.md instead, so exclude it here to
# avoid shipping it twice. legacy/ is superseded copilot-era material. roadmap.md is
# our internal prioritisation and is not the receiving team's business — known-issues
# is, and it ships.
# --delete-excluded, not just --delete: plain --delete treats excluded paths as
# protected on the receiving side, so anything excluded *after* it was already copied
# once would linger in the export forever.
rsync -a --delete --delete-excluded \
	--exclude 'legacy/' \
	--exclude 'handover.md' \
	--exclude 'roadmap.md' \
	"$ROOT/docs/" "$DIST/docs/"

cp "$ROOT/docs/handover.md" "$DIST/HANDOVER.md"

# -> provenance
# so the receiving team can tell exactly what they were handed, and we can tell what
# is running on staging without asking them.

COMMIT="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
DIRTY=''
if ! git -C "$ROOT" diff --quiet HEAD -- 2>/dev/null; then
	DIRTY=' (uncommitted changes present at build time)'
fi

cat > "$DIST/VERSION" <<EOF
video guide widget — distribution build

built:      $(date '+%Y-%m-%d %H:%M:%S %Z')
commit:     $COMMIT$DIRTY
branch:     $BRANCH
repository: https://github.com/aberherrlich/video-avatar

see HANDOVER.md for integration instructions.
EOF

echo "built $DIST"
echo
find "$DIST" -type f | sed "s|$DIST/|  |" | sort
echo
du -sh "$DIST" | sed 's|^|  total: |'
