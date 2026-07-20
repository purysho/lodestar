import React from 'react'

function hashString(value) {
  let hash = 0
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) % 997
  return hash
}

export default function Star({ star }) {
  const hash = hashString(star.id)
  const ageInDays = Math.max(0, (Date.now() - Date.parse(star.createdAt)) / 86_400_000)
  const recencyGlow = Math.max(0, 1 - ageInDays / 30)
  const radius = 3.4 + recencyGlow * 1.2

  return (
    <g
      className="star-node cursor-pointer outline-none"
      role="button"
      tabIndex="0"
      aria-label={`${star.title}. Star in your sky.`}
      style={{
        '--twinkle-delay': `${-(hash % 37) / 10}s`,
        '--twinkle-duration': `${4.8 + (hash % 23) / 10}s`,
      }}
    >
      <title>{star.title}</title>
      <circle
        className="star-halo"
        cx={`${star.x * 100}%`}
        cy={`${star.y * 100}%`}
        r={radius * 3.8}
      />
      <circle
        className="star-core"
        cx={`${star.x * 100}%`}
        cy={`${star.y * 100}%`}
        r={radius}
      />
    </g>
  )
}
