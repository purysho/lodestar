import React from 'react'

export default function SkyToolbar({
  suggestionCount,
  suggestionsVisible,
  onAddStar,
  onToggleSuggestions,
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label="Sky controls">
      <button
        className="rounded-full border border-white/10 bg-night-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora sm:px-4 sm:text-sm"
        type="button"
        aria-pressed={suggestionsVisible}
        onClick={onToggleSuggestions}
      >
        Suggestions {suggestionsVisible ? 'on' : 'off'}
        {suggestionCount > 0 ? ` · ${suggestionCount}` : ''}
      </button>
      <button
        className="rounded-full border border-aurora/40 bg-night-800/70 px-4 py-2 text-sm font-medium tracking-wide text-slate-100 transition hover:border-aurora hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
        type="button"
        onClick={onAddStar}
      >
        Add a star
      </button>
    </div>
  )
}
