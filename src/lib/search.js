function normalizedValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function searchStars(stars, query) {
  const normalizedQuery = normalizedValue(query)
  if (!normalizedQuery) return stars

  return stars.filter((star) =>
    [star.title, star.note, ...(Array.isArray(star.tags) ? star.tags : [])].some((value) =>
      normalizedValue(value).includes(normalizedQuery),
    ),
  )
}
