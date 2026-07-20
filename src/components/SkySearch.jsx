import React from 'react'
import { useEffect, useRef } from 'react'

export default function SkySearch({
  query,
  results,
  tags,
  onClose,
  onQueryChange,
  onSelectStar,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <section
      className="absolute right-4 top-28 z-30 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:right-8 sm:top-24"
      role="dialog"
      aria-labelledby="sky-search-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="sky-search-title" className="font-display text-xl text-starlight">
            Find a star
          </h2>
          <p className="mt-1 text-sm text-slate-400">Search titles, notes, and tags.</p>
        </div>
        <button
          className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
          type="button"
          aria-label="Close search"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Search your sky
        <input
          ref={inputRef}
          className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-3 py-3 text-sm normal-case tracking-normal text-slate-200 outline-none focus:border-aurora focus:ring-2 focus:ring-aurora/25"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter by tag">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`rounded-full border px-3 py-1 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora ${
                query.toLowerCase() === tag
                  ? 'border-aurora/60 bg-aurora/10 text-starlight'
                  : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
              }`}
              type="button"
              onClick={() => onQueryChange(query.toLowerCase() === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 max-h-64 overflow-y-auto border-t border-white/10 pt-3">
        {query.trim() ? (
          results.length > 0 ? (
            <div className="space-y-1" aria-label={`${results.length} matching stars`}>
              {results.map((star) => (
                <button
                  key={star.id}
                  className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                  type="button"
                  onClick={() => onSelectStar(star.id)}
                >
                  <span className="block text-sm text-starlight">{star.title}</span>
                  {star.note ? <span className="mt-0.5 block truncate text-xs text-slate-500">{star.note}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-4 text-sm text-slate-500">No stars match that search.</p>
          )
        ) : (
          <p className="px-3 py-4 text-sm text-slate-500">Choose a tag or start typing.</p>
        )}
      </div>
    </section>
  )
}
