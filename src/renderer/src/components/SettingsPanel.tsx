import React from 'react'
import { useAppStore } from '../store/appStore'

export default function SettingsPanel(): React.JSX.Element {
  const open = useAppStore((s) => s.settingsPanelOpen)
  const settings = useAppStore((s) => s.settings)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const handleToggle = (key: 'syncSearch' | 'syncScroll') => {
    const newVal = !settings[key]
    updateSettings({ [key]: newVal })
    window.electronAPI.setSettings({ [key]: newVal })
  }

  const handleBrowseFolder = async (): Promise<void> => {
    const folder = await window.electronAPI.openFolderDialog()
    if (folder) {
      updateSettings({ downloadFolder: folder })
      window.electronAPI.setSettings({ downloadFolder: folder })
    }
  }

  if (!open) return <></>

  return (
    <>
      <div className="settings-overlay" onClick={() => setSettingsPanelOpen(false)} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={() => setSettingsPanelOpen(false)}>
            ✕
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <h3>Sync</h3>

            <label className="settings-toggle">
              <div className="toggle-info">
                <span className="toggle-title">Sync Search</span>
                <span className="toggle-desc">All panes search simultaneously</span>
              </div>
              <div
                className={`toggle-switch ${settings.syncSearch ? 'on' : ''}`}
                onClick={() => handleToggle('syncSearch')}
              >
                <div className="toggle-knob" />
              </div>
            </label>

            <label className="settings-toggle">
              <div className="toggle-info">
                <span className="toggle-title">Sync Scroll</span>
                <span className="toggle-desc">Scrolling one pane scrolls all others</span>
              </div>
              <div
                className={`toggle-switch ${settings.syncScroll ? 'on' : ''}`}
                onClick={() => handleToggle('syncScroll')}
              >
                <div className="toggle-knob" />
              </div>
            </label>
          </div>

          <div className="settings-section">
            <h3>Downloads</h3>
            <div className="folder-picker">
              <span className="folder-path">{settings.downloadFolder || 'Default Downloads'}</span>
              <button className="folder-browse-btn" onClick={handleBrowseFolder}>
                Browse
              </button>
            </div>
            <p className="settings-hint">Shift+click any image to download it</p>
          </div>
        </div>
      </div>
    </>
  )
}
