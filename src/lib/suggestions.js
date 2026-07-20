const TAG_COLORS = [
  '#7dd3fc',
  '#c4b5fd',
  '#fda4af',
  '#fde68a',
  '#86efac',
  '#fdba74',
  '#f0abfc',
  '#93c5fd',
]

export function normalizeTags(tags) {
  return [
    ...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean),
    ),
  ].sort()
}

export function getTagColor(tag) {
  const normalizedTag = String(tag).trim().toLowerCase()
  let hash = 2166136261

  for (const character of normalizedTag) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return TAG_COLORS[(hash >>> 0) % TAG_COLORS.length]
}

export function getSharedTags(firstStar, secondStar) {
  const secondTags = new Set(normalizeTags(secondStar.tags))
  return normalizeTags(firstStar.tags).filter((tag) => secondTags.has(tag))
}

function pairId(firstStarId, secondStarId) {
  return `suggestion:${[firstStarId, secondStarId].sort().join(':')}`
}

function getAuthoredPairs(constellations) {
  return new Set(
    constellations.flatMap((constellation) =>
      constellation.starIds
        .slice(1)
        .map((starId, index) => pairId(constellation.starIds[index], starId)),
    ),
  )
}

export function deriveSuggestions(stars, constellations = []) {
  const authoredPairs = getAuthoredPairs(constellations)
  const suggestions = []

  for (let firstIndex = 0; firstIndex < stars.length; firstIndex += 1) {
    const firstStar = stars[firstIndex]
    if (normalizeTags(firstStar.tags).length === 0) continue

    for (let secondIndex = firstIndex + 1; secondIndex < stars.length; secondIndex += 1) {
      const secondStar = stars[secondIndex]
      const id = pairId(firstStar.id, secondStar.id)
      if (authoredPairs.has(id)) continue

      const sharedTags = getSharedTags(firstStar, secondStar)
      if (sharedTags.length === 0) continue

      suggestions.push({
        id,
        starIds: [firstStar.id, secondStar.id],
        sharedTags,
      })
    }
  }

  return suggestions
}
