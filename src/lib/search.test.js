import { describe, expect, it } from 'vitest'

import { searchStars } from './search.js'

const stars = [
  { id: 'star-1', title: 'Why do we sleep?', note: 'Still thinking about it.', tags: ['biology'] },
  { id: 'star-2', title: 'A distant signal', note: 'From the radio sky.', tags: ['space', 'wonder'] },
  { id: 'star-3', title: 'The long archive', note: '', tags: ['history'] },
]

describe('sky search', () => {
  it('matches titles, notes, and tags without regard to case', () => {
    expect(searchStars(stars, 'SLEEP')).toEqual([stars[0]])
    expect(searchStars(stars, 'radio')).toEqual([stars[1]])
    expect(searchStars(stars, 'WONDER')).toEqual([stars[1]])
  })

  it('keeps all stars visible for an empty query', () => {
    expect(searchStars(stars, '   ')).toEqual(stars)
  })

  it('returns no stars when there is no match', () => {
    expect(searchStars(stars, 'ocean')).toEqual([])
  })
})
