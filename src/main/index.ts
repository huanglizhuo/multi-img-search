import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Mimic a real Chrome browser — prevents sites like Pexels/Yandex from
// rejecting requests that carry the default Electron UA string.
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36'

function applySessionOverrides(sess: Electron.Session): void {
  // Override User-Agent on every outgoing request from this session
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = CHROME_UA
    callback({ requestHeaders: details.requestHeaders })
  })

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

// Keep old name as alias so call sites don't need changing
const applyHeaderOverrides = applySessionOverrides

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

  // Apply header overrides to each webview partition as they are created
  mainWindow.webContents.on('did-attach-webview', (_e, webContents) => {
    const partitionSession = webContents.session
    applyHeaderOverrides(partitionSession)
  })

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
  // Register IPC handlers once at startup — they are app-scoped, not window-scoped
  registerIpcHandlers()
  applyHeaderOverrides(session.defaultSession)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
