import React, { useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { SEARCH_ENGINES } from '../constants/engines'
import { computeLayoutGrid } from '../constants/layout'
import SearchPane, { SearchPaneHandle } from './SearchPane'

export default function PaneGrid(): React.JSX.Element {
  const submittedQuery = useAppStore((s) => s.submittedQuery)
  const activeEngineIds = useAppStore((s) => s.activeEngineIds)
  const layoutMode = useAppStore((s) => s.layoutMode)
  const layoutFixed = useAppStore((s) => s.layoutFixed)
  const syncScrollEnabled = useAppStore((s) => s.settings.syncScroll)

  const paneRefs = useRef<Map<string, SearchPaneHandle>>(new Map())

  const setRef = useCallback((id: string, handle: SearchPaneHandle | null): void => {
    if (handle) {
      paneRefs.current.set(id, handle)
    } else {
      paneRefs.current.delete(id)
    }
  }, [])

  const handleScrollUpdate = useCallback((sourceId: string, ratio: number): void => {
    paneRefs.current.forEach((handle, id) => {
      if (id !== sourceId) handle.syncScroll(ratio)
    })
  }, [])

  const activeEngines = SEARCH_ENGINES.filter((e) => activeEngineIds.includes(e.id))
  const count = activeEngines.length

  if (count === 0) {
    return (
      <div className="pane-grid-empty">
        Select at least one search engine above
      </div>
    )
  }

  const { rows, totalGridCols, normalSpan, orphanSpan, lastRowCount } =
    computeLayoutGrid(layoutMode, layoutFixed, count)

  // Orphan panels are the last `lastRowCount` items (the incomplete final row)
  const orphanStart = lastRowCount > 0 ? count - lastRowCount : count

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${totalGridCols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`
  }

  return (
    <div className="pane-grid" style={gridStyle}>
      {activeEngines.map((engine, index) => {
        const isOrphan = lastRowCount > 0 && index >= orphanStart
        const span = isOrphan ? orphanSpan : normalSpan
        return (
          <SearchPane
            key={engine.id}
            ref={(handle) => setRef(engine.id, handle)}
            engine={engine}
            url={submittedQuery ? engine.buildUrl(submittedQuery) : 'about:blank'}
            onScrollUpdate={handleScrollUpdate}
            syncScrollEnabled={syncScrollEnabled}
            colSpan={span}
          />
        )
      })}
    </div>
  )
}
