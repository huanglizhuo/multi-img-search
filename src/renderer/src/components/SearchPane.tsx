import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { SearchEngine } from '../constants/engines'

export interface SearchPaneHandle {
  syncScroll: (ratio: number) => void
  getWebview: () => Electron.WebviewTag | null
}

interface Props {
  engine: SearchEngine
  url: string
  onScrollUpdate: (engineId: string, ratio: number) => void
  syncScrollEnabled: boolean
  colSpan?: number
}

const SearchPane = forwardRef<SearchPaneHandle, Props>(function SearchPane(
  { engine, url, onScrollUpdate, syncScrollEnabled, colSpan = 1 },
  ref
) {
  const webviewRef = useRef<Electron.WebviewTag>(null)

  useImperativeHandle(ref, () => ({
    getWebview: () => webviewRef.current,
    syncScroll: (ratio: number) => {
      const wv = webviewRef.current
      if (!wv) return
      try {
        wv.send('sync-scroll', ratio)
      } catch {
        // webview not yet ready
      }
    }
  }))

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const handleIpcMessage = (e: Electron.IpcMessageEvent): void => {
      if (e.channel === 'scroll-update') {
        const ratio = e.args[0] as number
        if (syncScrollEnabled) onScrollUpdate(engine.id, ratio)
      } else if (e.channel === 'download-image') {
        window.electronAPI.downloadImage(e.args[0] as string)
      } else if (e.channel === 'navigate-back') {
        if (wv.canGoBack()) wv.goBack()
      } else if (e.channel === 'navigate-forward') {
        if (wv.canGoForward()) wv.goForward()
      }
    }

    wv.addEventListener('ipc-message', handleIpcMessage as EventListener)
    return () => wv.removeEventListener('ipc-message', handleIpcMessage as EventListener)
  }, [engine.id, syncScrollEnabled, onScrollUpdate])

  const preloadPath = window.electronAPI?.webviewPreloadPath

  return (
    <div
      className="search-pane"
      style={colSpan > 1 ? { gridColumn: `span ${colSpan}` } : undefined}
    >
      {/* Hover-only label — floats over the webview, invisible until hover */}
      <div className="pane-label">{engine.name}</div>
      <webview
        ref={webviewRef}
        src={url}
        preload={preloadPath ? `file://${preloadPath}` : undefined}
        partition={`persist:${engine.id}`}
        webpreferences="contextIsolation=false"
        allowpopups=""
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default SearchPane
