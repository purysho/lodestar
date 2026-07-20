import React from 'react'

function getAdjacentStarIds(constellation, starId) {
  const index = constellation.starIds.indexOf(starId)
  if (index === -1) return []

  return [constellation.starIds[index - 1], constellation.starIds[index + 1]].filter(Boolean)
}

function ConstellationEditor({
  constellation,
  star,
  starsById,
  onDelete,
  onDisconnect,
  onRename,
  onStartConnection,
}) {
  const canExtend =
    constellation.starIds[0] === star.id ||
    constellation.starIds[constellation.starIds.length - 1] === star.id

  return (
    <div className="rounded-xl border border-white/10 bg-night-950/40 p-3">
      <input
        className="w-full border-b border-white/10 bg-transparent pb-2 text-sm text-starlight outline-none placeholder:text-slate-600 focus:border-aurora"
        aria-label={`Name constellation containing ${star.title}`}
        placeholder="Name this constellation"
        value={constellation.name}
        onChange={(event) => onRename(constellation.id, event.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {getAdjacentStarIds(constellation, star.id).map((adjacentStarId) => (
          <button
            key={adjacentStarId}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={() => onDisconnect(constellation.id, star.id, adjacentStarId)}
          >
            Disconnect from {starsById.get(adjacentStarId)?.title ?? 'star'}
          </button>
        ))}
        {canExtend ? (
          <button
            className="rounded-full border border-aurora/25 px-3 py-1.5 text-xs text-aurora transition hover:border-aurora focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={() => onStartConnection(star.id, constellation.id)}
          >
            Extend from here
          </button>
        ) : null}
        <button
          className="rounded-full px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          type="button"
          onClick={() => onDelete(constellation.id)}
        >
          Delete constellation
        </button>
      </div>
    </div>
  )
}

export default function StarDetailPopover({
  star,
  stars,
  constellations,
  onClose,
  onDelete,
  onDeleteConstellation,
  onDisconnect,
  onRenameConstellation,
  onStartConnection,
}) {
  const starsById = new Map(stars.map((candidate) => [candidate.id, candidate]))

  return (
    <aside
      className="absolute bottom-6 left-1/2 z-30 max-h-[calc(100vh-8rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:bottom-8 sm:left-8 sm:translate-x-0"
      aria-labelledby="star-detail-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="star-detail-title" className="truncate font-display text-xl text-starlight">
            {star.title}
          </h2>
          {star.note ? <p className="mt-2 text-sm leading-6 text-slate-300">{star.note}</p> : null}
        </div>
        <button
          className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
          type="button"
          aria-label="Close star details"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {star.tags.length > 0 ? (
        <p className="mt-4 text-xs tracking-wide text-aurora/90">{star.tags.join(' · ')}</p>
      ) : null}

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Constellations
          </h3>
          <button
            className="rounded-full border border-aurora/30 px-3 py-1.5 text-xs text-aurora transition hover:border-aurora focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={() => onStartConnection(star.id)}
          >
            Start a connection
          </button>
        </div>

        {constellations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {constellations.map((constellation) => (
              <ConstellationEditor
                key={constellation.id}
                constellation={constellation}
                star={star}
                starsById={starsById}
                onDelete={onDeleteConstellation}
                onDisconnect={onDisconnect}
                onRename={onRenameConstellation}
                onStartConnection={onStartConnection}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No lines drawn from this star yet.</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        {star.url ? (
          <a
            className="text-sm text-starlight underline decoration-white/25 underline-offset-4 transition hover:decoration-starlight focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            href={star.url}
            rel="noreferrer"
            target="_blank"
          >
            Open link
          </a>
        ) : (
          <span className="text-xs text-slate-600">No link attached</span>
        )}
        <button
          className="rounded-full px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          type="button"
          onClick={onDelete}
        >
          Delete star
        </button>
      </div>
    </aside>
  )
}
