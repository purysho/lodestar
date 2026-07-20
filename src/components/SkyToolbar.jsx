import React from 'react'

export default function SkyToolbar({
  suggestionCount,
  suggestionsVisible,
  onAddStar,
  onExport,
  onImportFile,
  onShare,
  onToggleSuggestions,
}) {
  function handleFileChange(event) {
    const file = event.target.files?.[0]
    onImportFile(file)
    event.target.value = ''
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" aria-label="Sky controls">
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
        className="rounded-full border border-white/10 bg-night-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora sm:text-sm"
        type="button"
        onClick={onExport}
      >
        Export
      </button>
      <label className="cursor-pointer rounded-full border border-white/10 bg-night-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25 hover:text-white focus-within:ring-2 focus-within:ring-aurora sm:text-sm">
        Import
        <input
          className="sr-only"
          type="file"
          accept="application/json,.json"
          aria-label="Import sky from JSON"
          onChange={handleFileChange}
        />
      </label>
      <button
        className="rounded-full border border-white/10 bg-night-900/60 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora sm:text-sm"
        type="button"
        onClick={onShare}
      >
        Share
      </button>
      <button
        className="rounded-full border border-aurora/40 bg-night-800/70 px-4 py-2 text-xs font-medium tracking-wide text-slate-100 transition hover:border-aurora hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora sm:text-sm"
        type="button"
        aria-label="Add a star"
        onClick={onAddStar}
      >
        Add<span className="hidden sm:inline"> a star</span>
      </button>
    </div>
  )
}
