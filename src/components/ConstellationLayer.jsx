import React from 'react'

export default function ConstellationLayer({ constellations, stars }) {
  const starsById = new Map(stars.map((star) => [star.id, star]))

  return (
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
  )
}
