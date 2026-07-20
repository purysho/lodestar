export const STORAGE_KEY = 'lodestar:sky'
export const CURRENT_SCHEMA_VERSION = 2
export const MAX_SHARE_URL_LENGTH = 8_000

// Add migrations as the schema grows: key N migrates version N to N + 1.
export const MIGRATIONS = Object.freeze({
  1: (sky) => ({
    ...sky,
    schemaVersion: 2,
    tagColorOverrides: {},
    constellations: sky.constellations.map((constellation) => ({
      ...constellation,
      edgeTagOverrides: {},
    })),
  }),
})

const HEX_COLOR = /^#[0-9a-f]{6}$/iu

function normalizeTag(tag) {
  return typeof tag === 'string' ? tag.trim().toLowerCase() : ''
}

function edgeKey(firstStarId, secondStarId) {
  return [firstStarId, secondStarId].sort().join('::')
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Sky data has an invalid ${field}.`)
  }
  return value
}

function toPersistedStar(star) {
  if (!star || typeof star !== 'object' || Array.isArray(star)) {
    throw new Error('Sky data contains an invalid star.')
  }
  if (!Number.isFinite(star.x) || !Number.isFinite(star.y)) {
    throw new Error('Sky data contains invalid star coordinates.')
  }
  if (star.x < 0 || star.x > 1 || star.y < 0 || star.y > 1) {
    throw new Error('Sky data contains star coordinates outside the sky.')
  }
  if (star.tags !== undefined && !Array.isArray(star.tags)) {
    throw new Error('Sky data contains invalid star tags.')
  }
  if (star.tags?.some((tag) => typeof tag !== 'string')) {
    throw new Error('Sky data contains invalid star tags.')
  }

  return {
    id: requireNonEmptyString(star.id, 'star id'),
    title: requireNonEmptyString(star.title, 'star title'),
    note: typeof star.note === 'string' ? star.note : '',
    tags: structuredClone(star.tags ?? []),
    url: typeof star.url === 'string' ? star.url : '',
    x: star.x,
    y: star.y,
    origin: requireNonEmptyString(star.origin, 'star origin'),
    createdAt: requireNonEmptyString(star.createdAt, 'star creation date'),
  }
}

function toPersistedEdgeTagOverrides(value, starIds) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sky data contains invalid connection tag overrides.')
  }

  const validEdgeKeys = new Set(
    starIds.slice(1).map((starId, index) => edgeKey(starIds[index], starId)),
  )

  return Object.fromEntries(
    Object.entries(value).map(([key, tag]) => {
      const normalizedTag = normalizeTag(tag)
      if (!validEdgeKeys.has(key) || !normalizedTag) {
        throw new Error('Sky data contains invalid connection tag overrides.')
      }
      return [key, normalizedTag]
    }),
  )
}

function toPersistedConstellation(constellation, schemaVersion) {
  if (!constellation || typeof constellation !== 'object' || Array.isArray(constellation)) {
    throw new Error('Sky data contains an invalid constellation.')
  }
  if (
    !Array.isArray(constellation.starIds) ||
    constellation.starIds.some((starId) => typeof starId !== 'string' || !starId.trim())
  ) {
    throw new Error('Sky data contains invalid constellation stars.')
  }

  const persisted = {
    id: requireNonEmptyString(constellation.id, 'constellation id'),
    name: typeof constellation.name === 'string' ? constellation.name : '',
    starIds: structuredClone(constellation.starIds),
    createdAt: requireNonEmptyString(
      constellation.createdAt,
      'constellation creation date',
    ),
  }

  if (schemaVersion >= 2) {
    persisted.edgeTagOverrides = toPersistedEdgeTagOverrides(
      constellation.edgeTagOverrides,
      persisted.starIds,
    )
  }

  return persisted
}

function toPersistedTagColorOverrides(value) {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sky data contains invalid tag colour overrides.')
  }

  return Object.fromEntries(
    Object.entries(value).map(([tag, color]) => {
      const normalizedTag = normalizeTag(tag)
      if (!normalizedTag || typeof color !== 'string' || !HEX_COLOR.test(color)) {
        throw new Error('Sky data contains invalid tag colour overrides.')
      }
      return [normalizedTag, color.toLowerCase()]
    }),
  )
}

function getStorage(storage) {
  if (storage) return storage
  if (typeof globalThis.localStorage === 'undefined') return null
  return globalThis.localStorage
}

function assertSkyShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sky data must be an object.')
  }
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1) {
    throw new Error('Sky data has an invalid schemaVersion.')
  }
  if (!Array.isArray(value.stars) || !Array.isArray(value.constellations)) {
    throw new Error('Sky data must include stars and constellations arrays.')
  }
}

function toPersistedSky(sky, schemaVersion = sky.schemaVersion) {
  assertSkyShape(sky)

  const stars = sky.stars.map(toPersistedStar)
  const constellations = sky.constellations.map((constellation) =>
    toPersistedConstellation(constellation, schemaVersion),
  )
  const starIds = new Set(stars.map((star) => star.id))
  const constellationIds = new Set(constellations.map((constellation) => constellation.id))

  if (starIds.size !== stars.length || constellationIds.size !== constellations.length) {
    throw new Error('Sky data contains duplicate ids.')
  }
  if (
    constellations.some(
      (constellation) =>
        new Set(constellation.starIds).size !== constellation.starIds.length ||
        constellation.starIds.some((starId) => !starIds.has(starId)),
    )
  ) {
    throw new Error('Sky data contains invalid constellation stars.')
  }

  if (schemaVersion >= 2) {
    const starsById = new Map(stars.map((star) => [star.id, star]))

    for (const constellation of constellations) {
      for (const [key, tag] of Object.entries(constellation.edgeTagOverrides)) {
        const edgeIndex = constellation.starIds.findIndex(
          (starId, index) =>
            constellation.starIds[index + 1] &&
            edgeKey(starId, constellation.starIds[index + 1]) === key,
        )
        const firstStar = starsById.get(constellation.starIds[edgeIndex])
        const secondStar = starsById.get(constellation.starIds[edgeIndex + 1])
        const firstTags = new Set(firstStar.tags.map(normalizeTag))
        const secondTags = new Set(secondStar.tags.map(normalizeTag))

        if (!firstTags.has(tag) || !secondTags.has(tag)) {
          throw new Error('Sky data contains a connection tag that its stars do not share.')
        }
      }
    }
  }

  const persisted = {
    schemaVersion,
    stars,
    constellations,
  }

  if (schemaVersion >= 2) {
    persisted.tagColorOverrides = toPersistedTagColorOverrides(sky.tagColorOverrides)
  }

  return persisted
}

export function createEmptySky(schemaVersion = CURRENT_SCHEMA_VERSION) {
  const sky = {
    schemaVersion,
    stars: [],
    constellations: [],
  }

  if (schemaVersion >= 2) sky.tagColorOverrides = {}

  return sky
}

export function migrateSky(
  sky,
  {
    currentVersion = CURRENT_SCHEMA_VERSION,
    migrations = MIGRATIONS,
  } = {},
) {
  assertSkyShape(sky)

  if (!Number.isInteger(currentVersion) || currentVersion < 1) {
    throw new Error('The current schema version must be a positive integer.')
  }
  if (sky.schemaVersion > currentVersion) {
    throw new Error(`Sky schema version ${sky.schemaVersion} is newer than ${currentVersion}.`)
  }

  let migrated = structuredClone(sky)

  while (migrated.schemaVersion < currentVersion) {
    const fromVersion = migrated.schemaVersion
    const migration = migrations[fromVersion]

    if (typeof migration !== 'function') {
      throw new Error(`Missing migration from schema version ${fromVersion}.`)
    }

    migrated = migration(structuredClone(migrated))
    assertSkyShape(migrated)

    if (migrated.schemaVersion !== fromVersion + 1) {
      throw new Error(`Migration ${fromVersion} must produce version ${fromVersion + 1}.`)
    }
  }

  return toPersistedSky(migrated, currentVersion)
}

export function serializeSky(
  sky,
  {
    currentVersion = CURRENT_SCHEMA_VERSION,
    migrations = MIGRATIONS,
  } = {},
) {
  return JSON.stringify(migrateSky(sky, { currentVersion, migrations }))
}

export function deserializeSky(
  serialized,
  {
    currentVersion = CURRENT_SCHEMA_VERSION,
    migrations = MIGRATIONS,
  } = {},
) {
  let parsed

  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw new Error('Sky data is not valid JSON.')
  }

  return migrateSky(parsed, { currentVersion, migrations })
}

export function loadSky({
  storage,
  key = STORAGE_KEY,
  currentVersion = CURRENT_SCHEMA_VERSION,
  migrations = MIGRATIONS,
} = {}) {
  const target = getStorage(storage)
  const serialized = target?.getItem(key)

  if (!serialized) return createEmptySky(currentVersion)

  try {
    return deserializeSky(serialized, { currentVersion, migrations })
  } catch {
    return createEmptySky(currentVersion)
  }
}

export function saveSky(
  sky,
  {
    storage,
    key = STORAGE_KEY,
    currentVersion = CURRENT_SCHEMA_VERSION,
    migrations = MIGRATIONS,
  } = {},
) {
  const target = getStorage(storage)
  const persisted = migrateSky(sky, { currentVersion, migrations })

  if (!target) throw new Error('localStorage is unavailable.')
  target.setItem(key, JSON.stringify(persisted))

  return persisted
}

export function exportSky(sky, options) {
  return serializeSky(sky, options)
}

export function importSky(serialized, options) {
  return deserializeSky(serialized, options)
}

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return globalThis
    .btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function fromBase64Url(value) {
  if (!value || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error('The shared sky link is invalid.')
  }

  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    const binary = globalThis.atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    throw new Error('The shared sky link is invalid.')
  }
}

export function encodeSky(
  sky,
  {
    maxLength = MAX_SHARE_URL_LENGTH,
    currentVersion = CURRENT_SCHEMA_VERSION,
  } = {},
) {
  const encoded = toBase64Url(serializeSky(sky, { currentVersion }))

  if (encoded.length > maxLength) {
    throw new Error('This sky is too large for a share link. Export a JSON file instead.')
  }

  return encoded
}

export function decodeSky(
  encoded,
  {
    currentVersion = CURRENT_SCHEMA_VERSION,
    migrations = MIGRATIONS,
  } = {},
) {
  try {
    return deserializeSky(fromBase64Url(encoded), { currentVersion, migrations })
  } catch {
    throw new Error('The shared sky link is invalid.')
  }
}
