import { describe, expect, it, vi } from 'vitest'

import {
  createEmptySky,
  decodeSky,
  encodeSky,
  exportSky,
  importSky,
  loadSky,
  saveSky,
  STORAGE_KEY,
} from './store.js'

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))

  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
  }
}

function createSky() {
  return {
    schemaVersion: 2,
    stars: [
      {
        id: 'star-1',
        title: 'Why do we sleep?',
        note: 'Still thinking about it.',
        tags: ['biology', 'wonder'],
        url: 'https://example.com/sleep',
        x: 0.42,
        y: 0.61,
        origin: 'manual',
        createdAt: '2026-07-20T12:00:00.000Z',
      },
    ],
    constellations: [
      {
        id: 'con-1',
        name: 'Questions for midnight',
        starIds: ['star-1'],
        createdAt: '2026-07-20T12:05:00.000Z',
        edgeTagOverrides: {},
      },
    ],
    tagColorOverrides: {},
  }
}

describe('the Lodestar store', () => {
  it('starts with a versioned empty sky', () => {
    expect(loadSky({ storage: createMemoryStorage() })).toEqual(createEmptySky())
  })

  it('runs ordered migrations when loading an older blob', () => {
    const order = []
    const versionOne = {
      schemaVersion: 1,
      stars: [
        {
          id: 'star-old',
          title: 'An old light',
          note: undefined,
          tags: [],
          url: undefined,
          x: 0.5,
          y: 0.5,
          origin: undefined,
          createdAt: '2026-07-20T12:00:00.000Z',
        },
      ],
      constellations: [],
    }
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify(versionOne),
    })

    const migrated = loadSky({
      storage,
      currentVersion: 3,
      migrations: {
        1: (sky) => {
          order.push('v1->v2')
          return {
            ...sky,
            schemaVersion: 2,
            stars: sky.stars.map((star) => ({ ...star, origin: 'manual' })),
          }
        },
        2: (sky) => {
          order.push('v2->v3')
          return {
            ...sky,
            schemaVersion: 3,
            stars: sky.stars.map((star) => ({ ...star, note: star.note ?? '' })),
          }
        },
      },
    })

    expect(order).toEqual(['v1->v2', 'v2->v3'])
    expect(migrated).toMatchObject({
      schemaVersion: 3,
      stars: [{ id: 'star-old', origin: 'manual', note: '' }],
    })
  })

  it('migrates a schema v1 sky through the real v1 to v2 migration', () => {
    const versionOne = {
      schemaVersion: 1,
      stars: createSky().stars,
      constellations: createSky().constellations.map(
        ({ edgeTagOverrides: _edgeTagOverrides, ...constellation }) => constellation,
      ),
    }

    expect(importSky(JSON.stringify(versionOne))).toEqual({
      ...versionOne,
      schemaVersion: 2,
      constellations: versionOne.constellations.map((constellation) => ({
        ...constellation,
        edgeTagOverrides: {},
      })),
      tagColorOverrides: {},
    })
  })

  it('round-trips export and import without losing saved data', () => {
    const sky = createSky()

    expect(importSky(exportSky(sky))).toEqual(sky)
  })

  it('round-trips a Unicode sky through the share-link encoding', () => {
    const sky = createSky()
    sky.stars[0].title = 'A light beyond the horizon ✦'

    expect(decodeSky(encodeSky(sky))).toEqual(sky)
  })

  it('directs oversized share links to file export', () => {
    expect(() => encodeSky(createSky(), { maxLength: 8 })).toThrow(
      'Export a JSON file instead.',
    )
  })

  it('rejects malformed share-link data gracefully', () => {
    expect(() => decodeSky('not-a-valid-sky')).toThrow('shared sky link is invalid')
  })

  it('rejects imports with malformed nested records', () => {
    expect(() =>
      importSky(
        JSON.stringify({
          schemaVersion: 1,
          stars: [{ id: 'broken', title: 'Broken', x: 'far away', y: 0.5 }],
          constellations: [],
        }),
      ),
    ).toThrow('invalid star coordinates')
  })

  it('round-trips authored tag colours and connection meanings', () => {
    const sky = createSky()
    sky.stars.push({
      ...sky.stars[0],
      id: 'star-2',
      title: 'How memory forms',
      x: 0.7,
    })
    sky.constellations[0].starIds.push('star-2')
    sky.constellations[0].edgeTagOverrides['star-1::star-2'] = 'biology'
    sky.tagColorOverrides.biology = '#12abef'

    expect(importSky(exportSky(sky))).toEqual(sky)
  })

  it('rejects a connection meaning that its stars do not share', () => {
    const sky = createSky()
    sky.stars.push({
      ...sky.stars[0],
      id: 'star-2',
      title: 'A different light',
      tags: ['history'],
      x: 0.7,
    })
    sky.constellations[0].starIds.push('star-2')
    sky.constellations[0].edgeTagOverrides['star-1::star-2'] = 'biology'

    expect(() => importSky(JSON.stringify(sky))).toThrow(
      'connection tag that its stars do not share',
    )
  })

  it('persists only stars and user-drawn constellations, never suggestions', () => {
    const storage = createMemoryStorage()
    const sky = {
      ...createSky(),
      suggestions: [
        {
          id: 'suggested:star-1:star-2',
          starIds: ['star-1', 'star-2'],
        },
      ],
      derivedCache: { suggestionsVisible: true },
    }

    saveSky(sky, { storage })

    const persisted = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(Object.keys(persisted)).toEqual([
      'schemaVersion',
      'stars',
      'constellations',
      'tagColorOverrides',
    ])
    expect(JSON.stringify(persisted)).not.toContain('suggest')
  })
})
