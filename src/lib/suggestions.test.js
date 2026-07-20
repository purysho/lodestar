import { describe, expect, it } from 'vitest'

import { deriveSuggestions, getSharedTags, getTagColor, normalizeTags } from './suggestions.js'

const stars = [
  { id: 'star-a', tags: ['Wonder', 'biology'] },
  { id: 'star-b', tags: ['wonder', 'space'] },
  { id: 'star-c', tags: ['history'] },
  { id: 'star-d', tags: [' biology ', 'wonder'] },
]

describe('tag-derived suggestions', () => {
  it('assigns the same deterministic colour to normalized versions of a tag', () => {
    expect(getTagColor('Wonder')).toBe(getTagColor(' wonder '))
    expect(getTagColor('Wonder')).toMatch(/^hsl\(\d{1,3} 82% 72%\)$/)
    expect(normalizeTags([' Wonder ', 'wonder', 'BIOLOGY'])).toEqual(['biology', 'wonder'])
  })

  it('keeps a representative sky palette distinct', () => {
    const colours = ['education', 'handbook', 'library', 'llms', 'science'].map(getTagColor)

    expect(new Set(colours).size).toBe(colours.length)
  })

  it('derives the colourable tags shared by a pair of stars', () => {
    expect(getSharedTags(stars[0], stars[3])).toEqual(['biology', 'wonder'])
  })

  it('suggests each pair that shares an exact normalized tag', () => {
    expect(deriveSuggestions(stars)).toEqual([
      {
        id: 'suggestion:star-a:star-b',
        starIds: ['star-a', 'star-b'],
        sharedTags: ['wonder'],
      },
      {
        id: 'suggestion:star-a:star-d',
        starIds: ['star-a', 'star-d'],
        sharedTags: ['biology', 'wonder'],
      },
      {
        id: 'suggestion:star-b:star-d',
        starIds: ['star-b', 'star-d'],
        sharedTags: ['wonder'],
      },
    ])
  })

  it('omits pairs already joined by an authored constellation line', () => {
    const constellations = [
      {
        id: 'con-1',
        name: 'Authored',
        starIds: ['star-a', 'star-b'],
        createdAt: '2026-07-20T12:00:00.000Z',
      },
    ]

    expect(deriveSuggestions(stars, constellations).map(({ id }) => id)).not.toContain(
      'suggestion:star-a:star-b',
    )
  })

  it('does not mutate stars or constellations while deriving links', () => {
    const originalStars = structuredClone(stars)
    const constellations = []

    deriveSuggestions(stars, constellations)

    expect(stars).toEqual(originalStars)
    expect(constellations).toEqual([])
  })
})
