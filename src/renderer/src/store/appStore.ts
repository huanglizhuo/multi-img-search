import { create } from 'zustand'
import { ENGINE_IDS } from '../constants/engines'
import { LayoutMode } from '../constants/layout'

export type { LayoutMode }

export interface AppSettings {
  syncSearch: boolean
  syncScroll: boolean
  downloadFolder: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  syncSearch: true,
  syncScroll: true,
  downloadFolder: ''
}

interface AppState {
  query: string
  submittedQuery: string
  activeEngineIds: string[]
  layoutMode: LayoutMode
  layoutFixed: number // cols when fix-cols, rows when fix-rows, ignored for auto
  settings: AppSettings
  settingsPanelOpen: boolean
  notification: string | null
  notificationTimer: ReturnType<typeof setTimeout> | null

  setQuery: (q: string) => void
  submitQuery: () => void
  toggleEngine: (id: string) => void
  setLayoutMode: (mode: LayoutMode) => void
  setLayoutFixed: (value: number) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  setSettingsPanelOpen: (open: boolean) => void
  showNotification: (msg: string) => void
  clearNotification: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  query: '',
  submittedQuery: '',
  activeEngineIds: [...ENGINE_IDS],
  layoutMode: 'auto',
  layoutFixed: 3,
  settings: DEFAULT_SETTINGS,
  settingsPanelOpen: false,
  notification: null,
  notificationTimer: null,

  setQuery: (q) => set({ query: q }),

  submitQuery: () => {
    const { query } = get()
    if (!query.trim()) return
    set({ submittedQuery: query.trim() })
  },

  toggleEngine: (id) =>
    set((state) => {
      const next = state.activeEngineIds.includes(id)
        ? state.activeEngineIds.filter((e) => e !== id)
        : [...state.activeEngineIds, id]
      return { activeEngineIds: next }
    }),

  setLayoutMode: (mode) => set({ layoutMode: mode }),

  setLayoutFixed: (value) => set({ layoutFixed: value }),

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

  showNotification: (msg) => {
    const { notificationTimer } = get()
    if (notificationTimer) clearTimeout(notificationTimer)
    const timer = setTimeout(() => set({ notification: null, notificationTimer: null }), 3000)
    set({ notification: msg, notificationTimer: timer })
  },

  clearNotification: () => {
    const { notificationTimer } = get()
    if (notificationTimer) clearTimeout(notificationTimer)
    set({ notification: null, notificationTimer: null })
  }
}))
