# Multi Image Search

A desktop tool for advertising creatives to collect visual inspiration efficiently. Search once, see results from multiple image engines simultaneously in a resizable grid — no tab switching, no repetition.

## Features

- **7 engines at once**: Google Images, Bing Images, Yandex Images, Pinterest, Unsplash, Dribbble, Pexels
- **Synchronized scrolling**: scroll one pane, all others follow at the same visual speed
- **Shift+click to download**: hold Shift and click any image to save it to your Downloads folder
- **Flexible grid layouts**: Auto, fix-columns, or fix-rows mode with orphan-panel expansion
- **Gesture navigation**: two-finger horizontal swipe to go back/forward within any pane
- **Persistent sessions**: stay logged in to each engine between app restarts

---

## Local Development

**Requirements**: Node.js 20+, npm

```bash
# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

The app window opens automatically. DevTools launches in a detached window.

---

## Release

Releases are built automatically via GitHub Actions when a version tag is pushed.

**The release builds a macOS ARM (Apple Silicon) DMG only.**

### Steps

```bash
# 1. Bump the version in package.json, then commit
npm version patch   # or minor / major

# 2. Push the commit and the generated tag
git push origin main --tags
```

The `release` workflow triggers on any tag matching `v*.*.*`. It:
1. Builds the app with `electron-vite`
2. Packages a `.dmg` with `electron-builder` targeting `arm64`
3. Creates a GitHub Release and attaches the `.dmg`

The release appears under the **Releases** section of the repository once the workflow completes (~5 minutes).
