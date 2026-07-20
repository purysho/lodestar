import React from 'react'
import { useRef, useState } from 'react'

import { normalizeTags } from '../lib/suggestions.js'

function hashString(value) {
  let hash = 0
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) % 997
  return hash
}

export default function Star({
  star,
  tagColors,
  hiddenTagIds,
  isSelected,
  isConnectionOrigin,
  onMove,
  onSelect,
}) {
  const activePointer = useRef(null)
  const movedDuringGesture = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const hash = hashString(star.id)
  const ageInDays = Math.max(0, (Date.now() - Date.parse(star.createdAt)) / 86_400_000)
  const recencyGlow = Math.max(0, 1 - ageInDays / 30)
  const radius = 3.4 + recencyGlow * 1.2
  const visibleTags = normalizeTags(star.tags)
    .filter((tag) => !hiddenTagIds.has(tag))
    .slice(0, 3)
  const primaryTagColor = tagColors[visibleTags[0]] ?? '#fff4cf'

  function handlePointerDown(event) {
    if (event.button !== 0) return
    activePointer.current = event.pointerId
    movedDuringGesture.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    if (activePointer.current !== event.pointerId) return
    const svg = event.currentTarget.ownerSVGElement
    const bounds = svg.getBoundingClientRect()
    const x = Math.min(0.97, Math.max(0.03, (event.clientX - bounds.left) / bounds.width))
    const y = Math.min(0.97, Math.max(0.03, (event.clientY - bounds.top) / bounds.height))

    movedDuringGesture.current = true
    onMove(star.id, { x, y })
  }

  function finishPointerGesture(event) {
    if (activePointer.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    activePointer.current = null
    setIsDragging(false)
  }

  function handleClick() {
    if (movedDuringGesture.current) {
      movedDuringGesture.current = false
      return
    }
    onSelect(star.id)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(star.id)
  }

  return (
    <g
      className={`star-node touch-none outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      role="button"
      tabIndex="0"
      aria-label={`${star.title}. Star in your sky.`}
      aria-pressed={isSelected}
      data-primary-tag={visibleTags[0] ?? 'neutral'}
      data-connection-origin={isConnectionOrigin ? 'true' : 'false'}
      style={{
        '--star-tag-color': primaryTagColor,
        '--twinkle-delay': `${-(hash % 37) / 10}s`,
        '--twinkle-duration': `${4.8 + (hash % 23) / 10}s`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerCancel={finishPointerGesture}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
    >
      <title>{star.title}</title>
      <circle
        className="star-halo"
        cx={`${star.x * 100}%`}
        cy={`${star.y * 100}%`}
        r={radius * 3.8}
      />
      {visibleTags.map((tag, index) => (
        <circle
          key={tag}
          className="star-tag-ring"
          cx={`${star.x * 100}%`}
          cy={`${star.y * 100}%`}
          r={radius * (2.1 + index * 0.7)}
          style={{ '--tag-color': tagColors[tag] }}
        >
          <title>{tag}</title>
        </circle>
      ))}
      <circle
        className="star-core"
        cx={`${star.x * 100}%`}
        cy={`${star.y * 100}%`}
        r={radius}
      />
    </g>
  )
}
