import { app, BrowserWindow, session, Menu, MenuItem, dialog, net } from 'electron'
import { join, extname, basename } from 'path'
import { createWriteStream } from 'fs'
import { registerIpcHandlers } from './ipc'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Electron throws "Render frame was disposed before WebFrameMain could be
// accessed" when a webview navigates (e.g. login redirects) and an internal
// callback races against the frame teardown. This is harmless — swallow it.
process.on('uncaughtException', (error) => {
  if (error.message?.includes('Render frame was disposed')) return
  console.error('Uncaught Exception:', error)
})

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

function saveImageFromUrl(url: string): void {
  // net.request only supports http/https — blob: and data: URLs cannot be fetched this way
  if (!url.startsWith('http://') && !url.startsWith('https://')) return

  let filename = basename(new URL(url).pathname) || 'image'
  if (!extname(filename)) filename += '.jpg'

  dialog
    .showSaveDialog({ defaultPath: join(app.getPath('downloads'), filename) })
    .then(({ canceled, filePath }) => {
      if (canceled || !filePath) return
      const req = net.request({ url, redirect: 'follow' })
      req.on('response', (res) => {
        const writer = createWriteStream(filePath)
        res.on('data', (chunk) => writer.write(chunk))
        res.on('end', () => writer.end())
      })
      req.on('error', (err) => console.error('Image download error:', err))
      req.end()
    })
}

function attachContextMenu(webContents: Electron.WebContents): void {
  webContents.on('context-menu', (_e, params) => {
    const menu = new Menu()

    // Image actions
    if (params.hasImageContents && params.srcURL) {
      menu.append(new MenuItem({
        label: 'Save Image As…',
        click: () => saveImageFromUrl(params.srcURL)
      }))
      menu.append(new MenuItem({
        label: 'Copy Image Address',
        click: () => { require('electron').clipboard.writeText(params.srcURL) }
      }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // Text selection
    if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // Navigation
    menu.append(new MenuItem({
      label: 'Back',
      enabled: webContents.canGoBack(),
      click: () => webContents.goBack()
    }))
    menu.append(new MenuItem({
      label: 'Forward',
      enabled: webContents.canGoForward(),
      click: () => webContents.goForward()
    }))
    menu.append(new MenuItem({
      label: 'Reload',
      click: () => webContents.reload()
    }))

    menu.popup()
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

  // Apply session overrides and context menu to each webview as it is created
  mainWindow.webContents.on('did-attach-webview', (_e, webContents) => {
    applyHeaderOverrides(webContents.session)
    attachContextMenu(webContents)
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
