export const STORAGE_KEY = 'lodestar:sky'
export const CURRENT_SCHEMA_VERSION = 1

// Add migrations as the schema grows: key N migrates version N to N + 1.
export const MIGRATIONS = Object.freeze({})

const STAR_FIELDS = [
  'id',
  'title',
  'note',
  'tags',
  'url',
  'x',
  'y',
  'origin',
  'createdAt',
]

const CONSTELLATION_FIELDS = ['id', 'name', 'starIds', 'createdAt']

function cloneAllowedFields(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, structuredClone(value[field])]))
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

  return {
    schemaVersion,
    stars: sky.stars.map((star) => cloneAllowedFields(star, STAR_FIELDS)),
    constellations: sky.constellations.map((constellation) =>
      cloneAllowedFields(constellation, CONSTELLATION_FIELDS),
    ),
  }
}

export function createEmptySky(schemaVersion = CURRENT_SCHEMA_VERSION) {
  return {
    schemaVersion,
    stars: [],
    constellations: [],
  }
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
  { currentVersion = CURRENT_SCHEMA_VERSION } = {},
) {
  return JSON.stringify(toPersistedSky(sky, currentVersion))
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
  } = {},
) {
  const target = getStorage(storage)
  const persisted = toPersistedSky(sky, currentVersion)

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
