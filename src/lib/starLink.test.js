import { describe, expect, it } from 'vitest'

import {
  buildStarPayload,
  decodeStarPayload,
  dedupeKey,
  encodeStarPayload,
  isEncodedPayloadTooLarge,
  readIncomingEncoded,
  STAR_LINK_LIMITS,
  STAR_LINK_VERSION,
  validateStarPayload,
} from './starLink.js'

const sample = {
  title: 'fernwood / solarpunk-grid',
  note: 'found via Treasure Hunt',
  tags: ['climate', 'rust'],
  url: 'https://github.com/fernwood/solarpunk-grid',
  origin: 'treasure-hunt',
}

describe('star-link contract round-trip', () => {
  it('encodes then decodes back to the exact payload, field-for-field', () => {
    const payload = buildStarPayload(sample)
    const decoded = decodeStarPayload(encodeStarPayload(payload))

    expect(decoded).toEqual(payload)
    expect(decoded.v).toBe(STAR_LINK_VERSION)
    expect(decoded.title).toBe(sample.title)
    expect(decoded.tags).toEqual(sample.tags)
    expect(decoded.url).toBe(sample.url)
    expect(decoded.origin).toBe('treasure-hunt')
  })

  it('survives unicode titles (Atlas questions) byte-for-byte', () => {
    const payload = buildStarPayload({
      title: 'Does 4/n = 1/a + 1/b + 1/c for every n > 1? — Erdős–Straus',
      note: 'Egyptian fractions',
      tags: ['mathematics'],
      url: 'https://en.wikipedia.org/wiki/Erdős–Straus_conjecture',
      origin: 'atlas',
    })
    expect(decodeStarPayload(encodeStarPayload(payload))).toEqual(payload)
  })

  it('reads the encoded string out of the ingest hash', () => {
    const encoded = encodeStarPayload(buildStarPayload(sample))
    expect(readIncomingEncoded(`#/add?s=${encoded}`)).toBe(encoded)
    expect(readIncomingEncoded('#sky=abc')).toBeNull()
    expect(readIncomingEncoded('')).toBeNull()
  })
})

describe('receiver integrity — the four cases', () => {
  it('VALID: accepts a well-formed payload and returns a clean copy', () => {
    const result = validateStarPayload(buildStarPayload(sample))
    expect(result.ok).toBe(true)
    expect(result.payload.origin).toBe('treasure-hunt')
    expect(result.payload.tags).toEqual(['climate', 'rust'])
  })

  it('MALFORMED: rejects unknown version, missing title, bad origin, bad url, non-object', () => {
    expect(validateStarPayload({ ...sample, v: 99 }).ok).toBe(false)
    expect(validateStarPayload({ ...sample, v: 1, title: '   ' }).ok).toBe(false)
    expect(validateStarPayload({ ...sample, v: 1, origin: 'evil' }).ok).toBe(false)
    expect(validateStarPayload({ ...sample, v: 1, url: 'javascript:alert(1)' }).ok).toBe(false)
    expect(validateStarPayload({ ...sample, v: 1, tags: 'nope' }).ok).toBe(false)
    expect(validateStarPayload('not-an-object').ok).toBe(false)
    expect(validateStarPayload(null).ok).toBe(false)
  })

  it('MALFORMED: strips control characters and caps oversized strings', () => {
    const dirty = validateStarPayload({
      v: 1,
      title: `clean${String.fromCharCode(0)}title${String.fromCharCode(7)}here`,
      note: 'x'.repeat(1000),
      tags: [],
      url: '',
      origin: 'manual',
    })
    expect(dirty.ok).toBe(true)
    expect(dirty.payload.title).toBe('clean title here')
    expect(dirty.payload.note.length).toBeLessThanOrEqual(STAR_LINK_LIMITS.note)
  })

  it('OVERSIZED: flags an encoded string beyond the cap, and buildStarPayload trims to fit', () => {
    const huge = 's'.repeat(STAR_LINK_LIMITS.encoded + 1)
    expect(isEncodedPayloadTooLarge(huge)).toBe(true)
    expect(isEncodedPayloadTooLarge(encodeStarPayload(buildStarPayload(sample)))).toBe(false)

    const trimmed = buildStarPayload({
      title: 'A'.repeat(200),
      note: 'B'.repeat(280),
      tags: Array.from({ length: 12 }, (_, i) => `tag-${i}-${'c'.repeat(40)}`),
      url: `https://example.com/${'d'.repeat(1000)}`,
      origin: 'atlas',
    })
    expect(encodeStarPayload(trimmed).length).toBeLessThanOrEqual(STAR_LINK_LIMITS.encoded)
    expect(trimmed.title).toBe('A'.repeat(200)) // essential field preserved
  })

  it('DUPLICATE: same origin+url (or origin+title) collapses to one dedupe key', () => {
    const a = { origin: 'treasure-hunt', url: 'https://github.com/fernwood/solarpunk-grid', title: 'x' }
    const b = { origin: 'treasure-hunt', url: 'https://github.com/fernwood/solarpunk-grid/', title: 'y' }
    expect(dedupeKey(a)).toBe(dedupeKey(b)) // trailing slash normalized

    const noUrlA = { origin: 'atlas', url: '', title: 'Why is sleep?' }
    const noUrlB = { origin: 'atlas', url: '', title: 'why is sleep?' }
    expect(dedupeKey(noUrlA)).toBe(dedupeKey(noUrlB)) // title-based, case-insensitive

    const different = { origin: 'manual', url: 'https://example.com/a', title: 'x' }
    expect(dedupeKey(a)).not.toBe(dedupeKey(different))
  })
})
