import React from 'react'

import ConstellationLayer from './ConstellationLayer.jsx'
import Star from './Star.jsx'
import StarDetailPopover from './StarDetailPopover.jsx'

function TagColourKey({
  hiddenTagIds,
  tagColors,
  tagColorOverrides,
  onHideAllTags,
  onResetTagColor,
  onSetTagColor,
  onShowAllTags,
  onToggleTagVisibility,
}) {
  const tags = Object.keys(tagColors)
  if (tags.length === 0) return null

  return (
    <aside
      className="absolute bottom-5 left-5 z-20 max-h-44 max-w-[calc(100%-2.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-night-950/75 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-sm sm:bottom-8 sm:left-8"
      aria-label="Tag colour filters"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Filter by colour
        </p>
        <div className="flex items-center gap-1" aria-label="Colour filter shortcuts">
          <button
            className="rounded-full px-2 py-1 text-[0.65rem] font-medium text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={onShowAllTags}
          >
            All
          </button>
          <button
            className="rounded-full px-2 py-1 text-[0.65rem] font-medium text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={onHideAllTags}
          >
            None
          </button>
        </div>
      </div>
      <div className="mt-2 flex max-w-lg flex-wrap gap-2">
        {tags.map((tag) => {
          const isVisible = !hiddenTagIds.has(tag)

          return (
            <div
              key={tag}
              className={`flex items-center gap-1 rounded-full border py-1 pl-1.5 pr-2 transition ${
                isVisible
                  ? 'border-white/10 bg-night-900/65'
                  : 'border-white/5 bg-night-950/65 opacity-50'
              }`}
            >
              <input
                className="tag-colour-input"
                type="color"
                aria-label={`Change ${tag} colour`}
                value={tagColors[tag]}
                onInput={(event) => onSetTagColor(tag, event.target.value)}
              />
              <button
                className="rounded-full px-1 py-0.5 transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                type="button"
                aria-label={`${isVisible ? 'Hide' : 'Show'} ${tag} nodes`}
                aria-pressed={isVisible}
                onClick={() => onToggleTagVisibility(tag)}
              >
                <span
                  className={`tag-chip ${isVisible ? '' : 'line-through'}`}
                  style={{ '--tag-color': tagColors[tag] }}
                >
                  {tag}
                </span>
              </button>
              {tagColorOverrides[tag] ? (
                <button
                  className="rounded-full px-1 text-xs text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                  type="button"
                  aria-label={`Reset ${tag} colour`}
                  onClick={() => onResetTagColor(tag)}
                >
                  ↺
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default function SkyCanvas({
  stars,
  totalStarCount,
  constellations,
  suggestions,
  hiddenTagIds,
  tagColors,
  tagColorOverrides,
  selectedStar,
  selectedSuggestion,
  connectionDraft,
  onAcceptSuggestion,
  onAddStar,
  onOpenPrompts,
  onCancelConnection,
  onCloseStar,
  onCloseSuggestion,
  onDeleteConstellation,
  onDeleteStar,
  onDismissSuggestion,
  onDisconnectStars,
  onHideAllTags,
  onMoveStar,
  onRenameConstellation,
  onResetTagColor,
  onSelectSuggestion,
  onSelectStar,
  onSetConnectionMeaning,
  onSetTagColor,
  onShowAllTags,
  onStartConnection,
  onToggleTagVisibility,
  onUpdateStarTags,
  matchingStarIds,
}) {
  const connectionOrigin = stars.find((star) => star.id === connectionDraft?.fromStarId)
  const starsById = new Map(stars.map((star) => [star.id, star]))
  const suggestionStars = selectedSuggestion?.starIds.map((starId) => starsById.get(starId))
  const skyLabel = `${stars.length} ${stars.length === 1 ? 'star' : 'stars'} in your sky`

  return (
    <section className="absolute inset-0 z-10" aria-label="Your sky">
      <svg className="h-full w-full" role="group" aria-label={skyLabel}>
        <ConstellationLayer
          constellations={constellations}
          stars={stars}
          suggestions={suggestions}
          tagColors={tagColors}
          matchingStarIds={matchingStarIds}
          hiddenTagIds={hiddenTagIds}
          onSelectSuggestion={onSelectSuggestion}
        />
        {stars.map((star) => (
          <Star
            key={star.id}
            isConnectionOrigin={star.id === connectionDraft?.fromStarId}
            isDimmed={matchingStarIds ? !matchingStarIds.has(star.id) : false}
            isSelected={star.id === selectedStar?.id}
            star={star}
            tagColors={tagColors}
            hiddenTagIds={hiddenTagIds}
            onMove={onMoveStar}
            onSelect={onSelectStar}
          />
        ))}
      </svg>

      {stars.length === 0 ? (
        <div
          className="absolute inset-0 flex items-center justify-center px-6 pb-20 text-center"
          aria-live="polite"
        >
          <div className="max-w-md">
            <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-starlight shadow-star" />
            <h1 className="font-display text-3xl leading-tight text-slate-100 sm:text-4xl">
              {totalStarCount === 0 ? 'Your sky is empty.' : 'No colours are visible.'}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              {totalStarCount === 0
                ? 'Add something that struck you.'
                : 'Choose a tag from the colour key.'}
            </p>
            {totalStarCount === 0 ? (
              <>
                <button
                  className="mt-6 rounded-full border border-aurora/45 bg-night-900/70 px-5 py-2.5 text-sm font-medium text-starlight transition hover:border-aurora hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                  type="button"
                  onClick={onAddStar}
                >
                  Place your first light
                </button>
                <p className="mt-6 text-xs leading-6 text-slate-500">
                  A question that stays with you · a link worth returning to · a thought to keep nearby
                </p>
                <button className="mt-2 text-xs text-aurora transition hover:text-starlight focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora" type="button" onClick={onOpenPrompts}>
                  Need a spark?
                </button>
              </>
            ) : (
              <button
                className="mt-6 rounded-full border border-aurora/45 bg-night-900/70 px-5 py-2.5 text-sm font-medium text-starlight transition hover:border-aurora hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                type="button"
                onClick={onShowAllTags}
              >
                Show all colours
              </button>
            )}
          </div>
        </div>
      ) : null}

      <TagColourKey
        hiddenTagIds={hiddenTagIds}
        tagColors={tagColors}
        tagColorOverrides={tagColorOverrides}
        onHideAllTags={onHideAllTags}
        onResetTagColor={onResetTagColor}
        onSetTagColor={onSetTagColor}
        onShowAllTags={onShowAllTags}
        onToggleTagVisibility={onToggleTagVisibility}
      />

      {selectedStar ? (
        <StarDetailPopover
          constellations={constellations.filter((constellation) =>
            constellation.starIds.includes(selectedStar.id),
          )}
          star={selectedStar}
          stars={stars}
          tagColors={tagColors}
          onClose={onCloseStar}
          onDeleteConstellation={onDeleteConstellation}
          onDelete={() => onDeleteStar(selectedStar.id)}
          onDisconnect={onDisconnectStars}
          onRenameConstellation={onRenameConstellation}
          onSetConnectionMeaning={onSetConnectionMeaning}
          onStartConnection={onStartConnection}
          onUpdateTags={onUpdateStarTags}
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

      {selectedSuggestion && suggestionStars?.every(Boolean) ? (
        <aside
          className="absolute bottom-6 right-4 z-30 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-aurora/20 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:bottom-8 sm:right-8"
          aria-labelledby="suggestion-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-aurora/70">A faint possibility</p>
              <h2 id="suggestion-title" className="mt-2 font-display text-xl text-starlight">
                {suggestionStars[0].title} · {suggestionStars[1].title}
              </h2>
            </div>
            <button
              className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              aria-label="Close suggestion"
              onClick={onCloseSuggestion}
            >
              ×
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Shared{' '}
            {selectedSuggestion.sharedTags.map((tag, index) => (
              <React.Fragment key={tag}>
                {index > 0 ? ' · ' : null}
                <span style={{ color: tagColors[tag] }}>{tag}</span>
              </React.Fragment>
            ))}
          </p>
          <div className="mt-5 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              className="rounded-full px-3 py-2 text-sm text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={() => onDismissSuggestion(selectedSuggestion.id)}
            >
              Dismiss
            </button>
            <button
              className="rounded-full bg-starlight px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={() => onAcceptSuggestion(selectedSuggestion)}
            >
              Make it a constellation
            </button>
          </div>
        </aside>
      ) : null}
    </section>
  )
}
