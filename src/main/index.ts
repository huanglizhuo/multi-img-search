import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function applyHeaderOverrides(sess: Electron.Session): void {
  sess.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    // Strip frame-busting headers so webviews can embed external sites
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']
    // Strip CSP frame-ancestors directive
    const cspKey = Object.keys(headers).find((k) => k.toLowerCase() === 'content-security-policy')
    if (cspKey && headers[cspKey]) {
      headers[cspKey] = headers[cspKey].map((v: string) =>
        v.replace(/frame-ancestors[^;]*(;|$)/gi, '')
      )
    }
    callback({ responseHeaders: headers })
  })
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webviewTag: true, // CRITICAL: enables <webview> tag
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Apply header overrides to default session
  applyHeaderOverrides(session.defaultSession)

  // Apply header overrides to each webview partition as they are created
  mainWindow.webContents.on('did-attach-webview', (_e, webContents) => {
    const partitionSession = webContents.session
    applyHeaderOverrides(partitionSession)
  })

  registerIpcHandlers(mainWindow)

  if (isDev) {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      mainWindow.loadURL(devUrl)
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
