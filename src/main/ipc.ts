import { ipcMain, dialog, app, net, BrowserWindow } from 'electron'
import { createWriteStream, mkdirSync } from 'fs'
import { join, extname } from 'path'
import Store from 'electron-store'

interface AppSettings {
  syncSearch: boolean
  syncScroll: boolean
  downloadFolder: string
}

const store = new Store<AppSettings>({
  defaults: {
    syncSearch: true,
    syncScroll: true,
    downloadFolder: app.getPath('downloads')
  }
})

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ---- SETTINGS ----
  ipcMain.handle('get-settings', () => {
    return {
      syncSearch: store.get('syncSearch'),
      syncScroll: store.get('syncScroll'),
      downloadFolder: store.get('downloadFolder')
    }
  })

  ipcMain.handle('set-settings', (_e, partial: Partial<AppSettings>) => {
    for (const [key, value] of Object.entries(partial)) {
      store.set(key as keyof AppSettings, value as AppSettings[keyof AppSettings])
    }
  })

  // ---- FOLDER DIALOG ----
  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // ---- IMAGE DOWNLOAD ----
  ipcMain.on('download-image', (_e, imageUrl: string) => {
    const downloadFolder = store.get('downloadFolder') as string

    // Ensure download folder exists
    try {
      mkdirSync(downloadFolder, { recursive: true })
    } catch {
      // ignore if already exists
    }

    // Derive a filename from the URL, fallback to timestamp
    let ext = extname(new URL(imageUrl).pathname) || '.jpg'
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext.toLowerCase())) {
      ext = '.jpg'
    }
    const filename = `img-${Date.now()}${ext}`
    const savePath = join(downloadFolder, filename)

    const request = net.request({
      url: imageUrl,
      redirect: 'follow'
    })

    request.on('response', (response) => {
      const writer = createWriteStream(savePath)
      response.on('data', (chunk) => writer.write(chunk))
      response.on('end', () => {
        writer.end(() => {
          mainWindow.webContents.send('download-complete', filename)
        })
      })
      response.on('error', (err) => {
        writer.destroy()
        console.error('Download stream error:', err)
      })
    })

    request.on('error', (err) => {
      console.error('Download request error:', err)
    })

    request.end()
  })
}
