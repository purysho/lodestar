import React from 'react'

import { getEdgeKey, getSharedTags } from '../lib/suggestions.js'

function SuggestedLine({ suggestion, from, to, tagColors, onSelect }) {
  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(suggestion.id)
  }

  const label = `Suggested connection between ${from.title} and ${to.title}; shared ${suggestion.sharedTags.join(', ')}`

  return (
    <g
      className="suggested-connection outline-none"
      role="button"
      tabIndex="0"
      aria-label={label}
      data-link-tag={suggestion.sharedTags[0]}
      style={{ '--link-color': tagColors[suggestion.sharedTags[0]] }}
      onClick={() => onSelect(suggestion.id)}
      onKeyDown={handleKeyDown}
    >
      <title>{label}</title>
      <line
        className="suggestion-hit-area"
        x1={`${from.x * 100}%`}
        y1={`${from.y * 100}%`}
        x2={`${to.x * 100}%`}
        y2={`${to.y * 100}%`}
      />
      <line
        className="suggestion-line"
        x1={`${from.x * 100}%`}
        y1={`${from.y * 100}%`}
        x2={`${to.x * 100}%`}
        y2={`${to.y * 100}%`}
      />
    </g>
  )
}

export default function ConstellationLayer({
  constellations,
  stars,
  suggestions,
  tagColors,
  onSelectSuggestion,
}) {
  const starsById = new Map(stars.map((star) => [star.id, star]))
  const constellationLabel = `${constellations.length} authored ${constellations.length === 1 ? 'constellation' : 'constellations'}`
  const suggestionLabel = `${suggestions.length} suggested ${suggestions.length === 1 ? 'connection' : 'connections'}`

  return (
    <>
      <g aria-label={constellationLabel}>
        {constellations.flatMap((constellation) =>
          constellation.starIds.slice(1).map((starId, index) => {
            const from = starsById.get(constellation.starIds[index])
            const to = starsById.get(starId)
            if (!from || !to) return null
            const sharedTags = getSharedTags(from, to, Object.keys(tagColors))
            const edgeTag = constellation.edgeTagOverrides?.[getEdgeKey(from.id, to.id)]
            const linkTag = edgeTag ?? sharedTags[0]

            return (
              <line
                key={`${constellation.id}:${from.id}:${to.id}`}
                className="constellation-line"
                data-link-tag={linkTag ?? 'neutral'}
                style={linkTag ? { '--link-color': tagColors[linkTag] } : undefined}
                x1={`${from.x * 100}%`}
                y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`}
                y2={`${to.y * 100}%`}
              >
                <title>
                  {constellation.name || 'Untitled constellation'}
                  {linkTag ? ` · ${linkTag}` : ''}
                </title>
              </line>
            )
          }),
        )}
      </g>
      <g aria-label={suggestionLabel}>
        {suggestions.map((suggestion) => {
          const from = starsById.get(suggestion.starIds[0])
          const to = starsById.get(suggestion.starIds[1])
          if (!from || !to) return null

          return (
            <SuggestedLine
              key={suggestion.id}
              suggestion={suggestion}
              from={from}
              tagColors={tagColors}
              to={to}
              onSelect={onSelectSuggestion}
            />
          )
        })}
      </g>
    </>
  )
}
