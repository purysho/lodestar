const TAG_PALETTE = [
  '#22d3ee',
  '#f472b6',
  '#facc15',
  '#a78bfa',
  '#4ade80',
  '#fb7185',
  '#38bdf8',
  '#e879f9',
  '#2dd4bf',
  '#fb923c',
  '#818cf8',
  '#a3e635',
]

function componentToHex(value) {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')
}

function hslToHex(hue, saturation, lightness) {
  const normalizedSaturation = saturation / 100
  const normalizedLightness = lightness / 100
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation
  const hueSegment = hue / 60
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1))
  const offset = normalizedLightness - chroma / 2

  let red = 0
  let green = 0
  let blue = 0

  if (hueSegment < 1) [red, green] = [chroma, secondary]
  else if (hueSegment < 2) [red, green] = [secondary, chroma]
  else if (hueSegment < 3) [green, blue] = [chroma, secondary]
  else if (hueSegment < 4) [green, blue] = [secondary, chroma]
  else if (hueSegment < 5) [red, blue] = [secondary, chroma]
  else [red, blue] = [chroma, secondary]

  return `#${componentToHex(red + offset)}${componentToHex(green + offset)}${componentToHex(blue + offset)}`
}

function paletteColor(index) {
  if (index < TAG_PALETTE.length) return TAG_PALETTE[index]
  return hslToHex((index * 137.508) % 360, 78, 68)
}

export function normalizeTags(tags) {
  return [
    ...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

export function getOrderedTags(stars) {
  return normalizeTags(stars.flatMap((star) => normalizeTags(star.tags))).sort()
}

export function deriveTagColors(stars, overrides = {}) {
  return Object.fromEntries(
    getOrderedTags(stars).map((tag, index) => [tag, overrides[tag] ?? paletteColor(index)]),
  )
}

export function getSharedTags(firstStar, secondStar, tagOrder = []) {
  const firstTags = new Set(normalizeTags(firstStar.tags))
  const secondTags = new Set(normalizeTags(secondStar.tags))
  const orderedTags = tagOrder.length > 0 ? normalizeTags(tagOrder) : normalizeTags(firstStar.tags)

  return orderedTags.filter((tag) => firstTags.has(tag) && secondTags.has(tag))
}

export function getEdgeKey(firstStarId, secondStarId) {
  return [firstStarId, secondStarId].sort().join('::')
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
  const orderedTags = getOrderedTags(stars)
  const suggestions = []

  for (let firstIndex = 0; firstIndex < stars.length; firstIndex += 1) {
    const firstStar = stars[firstIndex]
    if (normalizeTags(firstStar.tags).length === 0) continue

    for (let secondIndex = firstIndex + 1; secondIndex < stars.length; secondIndex += 1) {
      const secondStar = stars[secondIndex]
      const id = pairId(firstStar.id, secondStar.id)
      if (authoredPairs.has(id)) continue

      const sharedTags = getSharedTags(firstStar, secondStar, orderedTags)
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
