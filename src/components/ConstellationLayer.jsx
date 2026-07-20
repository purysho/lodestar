import React from 'react'

function SuggestedLine({ suggestion, from, to, onSelect }) {
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
  onSelectSuggestion,
}) {
  const starsById = new Map(stars.map((star) => [star.id, star]))

  return (
    <>
      <g aria-label={`${constellations.length} authored constellations`}>
        {constellations.flatMap((constellation) =>
          constellation.starIds.slice(1).map((starId, index) => {
            const from = starsById.get(constellation.starIds[index])
            const to = starsById.get(starId)
            if (!from || !to) return null

            return (
              <line
                key={`${constellation.id}:${from.id}:${to.id}`}
                className="constellation-line"
                x1={`${from.x * 100}%`}
                y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`}
                y2={`${to.y * 100}%`}
              >
                <title>{constellation.name || 'Untitled constellation'}</title>
              </line>
            )
          }),
        )}
      </g>
      <g aria-label={`${suggestions.length} suggested connections`}>
        {suggestions.map((suggestion) => {
          const from = starsById.get(suggestion.starIds[0])
          const to = starsById.get(suggestion.starIds[1])
          if (!from || !to) return null

          return (
            <SuggestedLine
              key={suggestion.id}
              suggestion={suggestion}
              from={from}
              to={to}
              onSelect={onSelectSuggestion}
            />
          )
        })}
      </g>
    </>
  )
}
