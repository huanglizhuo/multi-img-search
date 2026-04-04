import { contextBridge, ipcRenderer } from 'electron'
import { join } from 'path'

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),

  setSettings: (settings: object) => ipcRenderer.invoke('set-settings', settings),

  downloadImage: (url: string) => ipcRenderer.send('download-image', url),

  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),

  onDownloadComplete: (cb: (filename: string) => void) => {
    ipcRenderer.on('download-complete', (_e, filename: string) => cb(filename))
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // Absolute path to the webview preload script
  webviewPreloadPath: join(__dirname, 'webview.js')
})
