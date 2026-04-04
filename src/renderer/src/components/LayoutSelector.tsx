import React from 'react'
import { useAppStore, LayoutMode } from '../store/appStore'

const MODE_LABELS: Record<LayoutMode, string> = {
  auto: 'Auto',
  'fix-cols': 'Cols',
  'fix-rows': 'Rows'
}

export default function LayoutSelector(): React.JSX.Element {
  const layoutMode = useAppStore((s) => s.layoutMode)
  const layoutFixed = useAppStore((s) => s.layoutFixed)
  const activeCount = useAppStore((s) => s.activeEngineIds.length)
  const setLayoutMode = useAppStore((s) => s.setLayoutMode)
  const setLayoutFixed = useAppStore((s) => s.setLayoutFixed)

  const maxFixed = Math.max(1, activeCount)
  const numbers = Array.from({ length: maxFixed }, (_, i) => i + 1)

  return (
    <div className="layout-selector">
      {/* Mode buttons */}
      <div className="layout-mode-group">
        {(Object.keys(MODE_LABELS) as LayoutMode[]).map((mode) => (
          <button
            key={mode}
            className={`layout-btn ${layoutMode === mode ? 'active' : ''}`}
            onClick={() => setLayoutMode(mode)}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Number picker — only shown for fix-cols / fix-rows */}
      {layoutMode !== 'auto' && (
        <div className="layout-number-group">
          <span className="layout-number-label">
            {layoutMode === 'fix-cols' ? 'cols:' : 'rows:'}
          </span>
          {numbers.map((n) => (
            <button
              key={n}
              className={`layout-num-btn ${layoutFixed === n ? 'active' : ''}`}
              onClick={() => setLayoutFixed(n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
