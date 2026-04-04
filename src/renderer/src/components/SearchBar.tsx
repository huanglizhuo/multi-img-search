import React, { useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { SEARCH_ENGINES } from '../constants/engines'

export default function SearchBar(): React.JSX.Element {
  const query = useAppStore((s) => s.query)
  const activeEngineIds = useAppStore((s) => s.activeEngineIds)
  const setQuery = useAppStore((s) => s.setQuery)
  const submitQuery = useAppStore((s) => s.submitQuery)
  const toggleEngine = useAppStore((s) => s.toggleEngine)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') submitQuery()
  }

  return (
    <div className="search-bar">
      <div className="search-input-row">
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Search for images..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button className="search-btn" onClick={submitQuery}>
          Search
        </button>
      </div>
      <div className="engine-list">
        {SEARCH_ENGINES.map((engine) => (
          <label key={engine.id} className="engine-checkbox">
            <input
              type="checkbox"
              checked={activeEngineIds.includes(engine.id)}
              onChange={() => toggleEngine(engine.id)}
            />
            <span>{engine.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
