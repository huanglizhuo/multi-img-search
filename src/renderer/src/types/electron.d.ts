import type { AppSettings } from '../store/appStore'

export {}

declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<AppSettings>
      setSettings: (s: Partial<AppSettings>) => Promise<void>
      downloadImage: (url: string) => void
      openFolderDialog: () => Promise<string | null>
      onDownloadComplete: (cb: (filename: string) => void) => void
      removeAllListeners: (channel: string) => void
      webviewPreloadPath: string
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          preload?: string
          partition?: string
          webpreferences?: string
          allowpopups?: string
          useragent?: string
        },
        HTMLElement
      > & {
        ref?: React.Ref<Electron.WebviewTag>
      }
    }
  }
}
