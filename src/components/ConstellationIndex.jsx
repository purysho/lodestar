import React from 'react'
import { useEffect } from 'react'

function constellationTitle(constellation) {
  return constellation.name.trim() || 'Untitled constellation'
}

export default function ConstellationIndex({ constellations, stars, onClose, onSelect }) {
  const starsById = new Map(stars.map((star) => [star.id, star]))
  const orderedConstellations = [...constellations].sort(
    (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
  )

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
    <aside
      className="absolute bottom-6 right-4 z-30 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/10 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:bottom-8 sm:right-8"
      aria-labelledby="constellation-index-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="constellation-index-title" className="font-display text-xl text-starlight">
            Your constellations
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {constellations.length === 1
              ? 'One line you have drawn.'
              : `${constellations.length} lines you have drawn.`}
          </p>
        </div>
        <button
          className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
          type="button"
          aria-label="Close constellations"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {orderedConstellations.length > 0 ? (
        <div className="mt-4 max-h-72 space-y-1 overflow-y-auto border-t border-white/10 pt-3">
          {orderedConstellations.map((constellation) => {
            const starTitles = constellation.starIds
              .map((starId) => starsById.get(starId)?.title)
              .filter(Boolean)

            return (
              <button
                key={constellation.id}
                className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                type="button"
                onClick={() => onSelect(constellation)}
              >
                <span className="block text-sm text-starlight">{constellationTitle(constellation)}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {starTitles.join(' · ')}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 border-t border-white/10 px-3 py-4 text-sm leading-6 text-slate-500">
          Select a star, then choose “Start a connection” to draw your first line.
        </p>
      )}
    </aside>
  )
}
