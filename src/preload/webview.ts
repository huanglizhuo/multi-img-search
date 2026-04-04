import { ipcRenderer } from 'electron'

// ---- GESTURE NAVIGATION (back / forward) ----
// macOS two-finger horizontal swipe produces wheel events with dominant deltaX.
// Accumulate deltaX; once it crosses the threshold, trigger navigation and
// start a cooldown to prevent repeated triggers in the same gesture.
let accDeltaX = 0
let resetTimer: ReturnType<typeof setTimeout> | null = null
let navCooldown = false

window.addEventListener(
  'wheel',
  (e: WheelEvent) => {
    // Ignore events where vertical scroll dominates (normal scroll)
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return

    accDeltaX += e.deltaX

    // Reset accumulator if the gesture pauses
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      accDeltaX = 0
    }, 200)

    if (navCooldown) return
    if (Math.abs(accDeltaX) > 120) {
      const dir = accDeltaX > 0 ? 'navigate-forward' : 'navigate-back'
      navCooldown = true
      accDeltaX = 0
      setTimeout(() => {
        navCooldown = false
      }, 600)
      ipcRenderer.sendToHost(dir)
    }
  },
  { passive: true }
)

// ---- SHIFT+CLICK IMAGE DOWNLOAD ----
document.addEventListener(
  'mousedown',
  (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (e.shiftKey && target.tagName === 'IMG') {
      e.preventDefault()
      e.stopPropagation()
      const src = (target as HTMLImageElement).src
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        const absoluteSrc = src.startsWith('//') ? 'https:' + src : src
        ipcRenderer.sendToHost('download-image', absoluteSrc)
      }
    }
  },
  true // capture phase — intercept before site handlers
)

// ---- SCROLL SYNC ----
//
// Use a counter (not a boolean) as the re-entry guard.
// Multiple stacked sync commands each increment/decrement independently,
// so the guard is only truly cleared after ALL pending syncs have settled —
// preventing premature flag clearance that causes echo feedback loops.
let syncScrollCount = 0
let rafPending = false

window.addEventListener(
  'scroll',
  () => {
    // Suppress scroll events that originated from our own syncScroll command
    if (syncScrollCount > 0) return
    if (rafPending) return

    rafPending = true
    requestAnimationFrame(() => {
      rafPending = false
      const el = document.documentElement
      if (el.clientHeight <= 0) return
      // Viewport-relative ratio: "how many viewport-heights have been scrolled"
      // This keeps visual scroll speed consistent across pages of different heights.
      const ratio = el.scrollTop / el.clientHeight
      ipcRenderer.sendToHost('scroll-update', ratio)
    })
  },
  { passive: true }
)

ipcRenderer.on('sync-scroll', (_e, ratio: number) => {
  const el = document.documentElement
  // Convert viewport-relative ratio back to absolute pixels for this page
  const top = ratio * el.clientHeight

  syncScrollCount++

  // Force instant jump — prevents CSS smooth-scroll from firing intermediate
  // scroll events during animation, which would leak back as false user scrolls
  const prev = el.style.scrollBehavior
  el.style.scrollBehavior = 'auto'
  window.scrollTo(0, top)
  el.style.scrollBehavior = prev

  setTimeout(() => {
    syncScrollCount = Math.max(0, syncScrollCount - 1)
  }, 100)
})
