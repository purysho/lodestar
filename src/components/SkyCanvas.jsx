import React from 'react'

import ConstellationLayer from './ConstellationLayer.jsx'
import Star from './Star.jsx'
import StarDetailPopover from './StarDetailPopover.jsx'

export default function SkyCanvas({
  stars,
  constellations,
  selectedStar,
  connectionDraft,
  onCancelConnection,
  onCloseStar,
  onDeleteConstellation,
  onDeleteStar,
  onDisconnectStars,
  onMoveStar,
  onRenameConstellation,
  onSelectStar,
  onStartConnection,
}) {
  const connectionOrigin = stars.find((star) => star.id === connectionDraft?.fromStarId)

  return (
    <section className="absolute inset-0 z-10" aria-label="Your sky">
      <svg className="h-full w-full" role="group" aria-label={`${stars.length} stars in your sky`}>
        <ConstellationLayer constellations={constellations} stars={stars} />
        {stars.map((star) => (
          <Star
            key={star.id}
            isConnectionOrigin={star.id === connectionDraft?.fromStarId}
            isSelected={star.id === selectedStar?.id}
            star={star}
            onMove={onMoveStar}
            onSelect={onSelectStar}
          />
        ))}
      </svg>

      {stars.length === 0 ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 pb-20 text-center"
          aria-live="polite"
        >
          <div className="max-w-md">
            <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-starlight shadow-star" />
            <h1 className="font-display text-3xl leading-tight text-slate-100 sm:text-4xl">
              Your sky is empty.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              Add something that struck you.
            </p>
          </div>
        </div>
      ) : null}

      {selectedStar ? (
        <StarDetailPopover
          constellations={constellations.filter((constellation) =>
            constellation.starIds.includes(selectedStar.id),
          )}
          star={selectedStar}
          stars={stars}
          onClose={onCloseStar}
          onDeleteConstellation={onDeleteConstellation}
          onDelete={() => onDeleteStar(selectedStar.id)}
          onDisconnect={onDisconnectStars}
          onRenameConstellation={onRenameConstellation}
          onStartConnection={onStartConnection}
        />
      ) : null}

      {connectionOrigin ? (
        <div
          className="absolute left-1/2 top-24 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-aurora/30 bg-night-900/90 px-4 py-2 text-sm text-slate-200 shadow-xl shadow-black/30 backdrop-blur-md"
          aria-live="polite"
        >
          <span>Choose another star to connect from {connectionOrigin.title}.</span>
          <button
            className="rounded-full px-2 py-1 text-xs text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={onCancelConnection}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  )
}
