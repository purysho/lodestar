function normalizeTags(tags) {
  return new Set(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => String(tag).trim().toLowerCase())
      .filter(Boolean),
  )
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
    const firstTags = normalizeTags(firstStar.tags)
    if (firstTags.size === 0) continue

    for (let secondIndex = firstIndex + 1; secondIndex < stars.length; secondIndex += 1) {
      const secondStar = stars[secondIndex]
      const id = pairId(firstStar.id, secondStar.id)
      if (authoredPairs.has(id)) continue

      const secondTags = normalizeTags(secondStar.tags)
      const sharedTags = [...firstTags].filter((tag) => secondTags.has(tag)).sort()
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
