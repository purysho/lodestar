import { describe, expect, it } from 'vitest'

import {
  deriveSuggestions,
  deriveTagColors,
  getEdgeKey,
  getOrderedTags,
  getSharedTags,
  normalizeTags,
} from './suggestions.js'

const stars = [
  { id: 'star-a', tags: ['Wonder', 'biology'] },
  { id: 'star-b', tags: ['wonder', 'space'] },
  { id: 'star-c', tags: ['history'] },
  { id: 'star-d', tags: [' biology ', 'wonder'] },
]

describe('tag-derived suggestions', () => {
  it('preserves star tag order while using a stable automatic colour order', () => {
    expect(normalizeTags([' Wonder ', 'wonder', 'BIOLOGY'])).toEqual(['wonder', 'biology'])
    expect(getOrderedTags(stars)).toEqual(['biology', 'history', 'space', 'wonder'])
    expect(
      getOrderedTags(stars.map((star) => ({ ...star, tags: [...star.tags].reverse() }))),
    ).toEqual(['biology', 'history', 'space', 'wonder'])
  })

  it('assigns ordered, distinct colours and applies authored overrides', () => {
    const tagColors = deriveTagColors(stars, { biology: '#123456' })

    expect(tagColors).toMatchObject({
      biology: '#123456',
      history: '#f472b6',
      space: '#facc15',
      wonder: '#a78bfa',
    })
    expect(new Set(Object.values(tagColors)).size).toBe(4)
  })

  it('derives the colourable tags shared by a pair of stars', () => {
    expect(getSharedTags(stars[0], stars[3], getOrderedTags(stars))).toEqual([
      'biology',
      'wonder',
    ])
    expect(getEdgeKey('star-b', 'star-a')).toBe('star-a::star-b')
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
