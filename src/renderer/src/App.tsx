import React, { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import SearchBar from './components/SearchBar'
import LayoutSelector from './components/LayoutSelector'
import PaneGrid from './components/PaneGrid'
import SettingsPanel from './components/SettingsPanel'

export default function App(): React.JSX.Element {
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)
  const notification = useAppStore((s) => s.notification)
  const showNotification = useAppStore((s) => s.showNotification)

  // Load persisted settings from main process on startup
  useEffect(() => {
    window.electronAPI.getSettings().then((settings) => {
      updateSettings(settings)
    })

    window.electronAPI.onDownloadComplete((filename) => {
      showNotification(`Downloaded: ${filename}`)
    })

    return () => {
      window.electronAPI.removeAllListeners('download-complete')
    }
  }, [])

  return (
    <div className="app">
      <div className="toolbar">
        <SearchBar />
        <div className="toolbar-right">
          <LayoutSelector />
          <button
            className="settings-btn"
            onClick={() => setSettingsPanelOpen(true)}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      <PaneGrid />

      <SettingsPanel />

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </div>
  )
}
