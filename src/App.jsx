import React from 'react'
import { useMemo, useRef, useState } from 'react'

import AddStarForm from './components/AddStarForm.jsx'
import ConstellationIndex from './components/ConstellationIndex.jsx'
import SkyCanvas from './components/SkyCanvas.jsx'
import SkySearch from './components/SkySearch.jsx'
import SkyToolbar from './components/SkyToolbar.jsx'
import { searchStars } from './lib/search.js'
import {
  decodeSky,
  encodeSky,
  exportSky,
  importSky,
  loadSky,
  MAX_SHARE_URL_LENGTH,
  saveSky,
} from './lib/store.js'
import {
  deriveSuggestions,
  deriveTagColors,
  getEdgeKey,
  getSharedTags,
  normalizeTags,
} from './lib/suggestions.js'

function createId(prefix) {
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `${prefix}-${token}`
}

function positionForStar(index) {
  const angle = index * 2.3999632297 - Math.PI / 2
  const radius = Math.min(0.38, 0.12 + index * 0.032)

  return {
    x: Math.min(0.9, Math.max(0.1, 0.5 + Math.cos(angle) * radius)),
    y: Math.min(0.86, Math.max(0.14, 0.52 + Math.sin(angle) * radius)),
  }
}

function splitConstellation(constellation, segments) {
  const viableSegments = segments.filter((starIds) => starIds.length >= 2)

  return viableSegments.map((starIds, index) => ({
    ...constellation,
    id: index === 0 ? constellation.id : createId('con'),
    starIds,
    edgeTagOverrides: Object.fromEntries(
      starIds.slice(1).flatMap((starId, edgeIndex) => {
        const key = getEdgeKey(starIds[edgeIndex], starId)
        const tag = constellation.edgeTagOverrides?.[key]
        return tag ? [[key, tag]] : []
      }),
    ),
  }))
}

function pruneConnectionMeanings(constellations, stars) {
  const starsById = new Map(stars.map((star) => [star.id, star]))
  const tagOrder = Object.keys(deriveTagColors(stars))

  return constellations.map((constellation) => ({
    ...constellation,
    edgeTagOverrides: Object.fromEntries(
      constellation.starIds.slice(1).flatMap((starId, index) => {
        const from = starsById.get(constellation.starIds[index])
        const to = starsById.get(starId)
        const key = getEdgeKey(from.id, to.id)
        const tag = constellation.edgeTagOverrides?.[key]

        return tag && getSharedTags(from, to, tagOrder).includes(tag) ? [[key, tag]] : []
      }),
    ),
  }))
}

function removeStarFromConstellation(constellation, starId) {
  const index = constellation.starIds.indexOf(starId)
  if (index === -1) return [constellation]

  return splitConstellation(constellation, [
    constellation.starIds.slice(0, index),
    constellation.starIds.slice(index + 1),
  ])
}

function removeEdgeFromConstellation(constellation, firstStarId, secondStarId) {
  const firstIndex = constellation.starIds.findIndex(
    (starId, index) =>
      (starId === firstStarId && constellation.starIds[index + 1] === secondStarId) ||
      (starId === secondStarId && constellation.starIds[index + 1] === firstStarId),
  )

  if (firstIndex === -1) return [constellation]

  return splitConstellation(constellation, [
    constellation.starIds.slice(0, firstIndex + 1),
    constellation.starIds.slice(firstIndex + 1),
  ])
}

function readSharedSkyFromUrl() {
  if (typeof globalThis.location === 'undefined') return { sky: null, error: null }

  const encoded = new URLSearchParams(globalThis.location.hash.slice(1)).get('sky')
  if (!encoded) return { sky: null, error: null }

  try {
    return { sky: decodeSky(encoded), error: null }
  } catch (error) {
    return { sky: null, error: error.message }
  }
}

function clearShareHash() {
  if (typeof globalThis.history === 'undefined') return
  const cleanUrl = `${globalThis.location.pathname}${globalThis.location.search}`
  globalThis.history.replaceState(null, '', cleanUrl)
}

export default function App() {
  const [sky, setSky] = useState(() => loadSky())
  const [isAddingStar, setIsAddingStar] = useState(false)
  const [selectedStarId, setSelectedStarId] = useState(null)
  const [connectionDraft, setConnectionDraft] = useState(null)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)
  const [hiddenTagIds, setHiddenTagIds] = useState(() => new Set())
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(() => new Set())
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null)
  const [sharedSky, setSharedSky] = useState(readSharedSkyFromUrl)
  const [shareUrl, setShareUrl] = useState('')
  const [notice, setNotice] = useState('')
  const [undoState, setUndoState] = useState(null)
  const addStarButtonRef = useRef(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isConstellationIndexOpen, setIsConstellationIndexOpen] = useState(false)

  const tagColors = useMemo(
    () => deriveTagColors(sky.stars, sky.tagColorOverrides),
    [sky.stars, sky.tagColorOverrides],
  )
  const visibleStars = useMemo(
    () =>
      sky.stars.filter((star) => {
        const tags = normalizeTags(star.tags)
        return tags.length === 0 || tags.some((tag) => !hiddenTagIds.has(tag))
      }),
    [hiddenTagIds, sky.stars],
  )
  const visibleStarIds = useMemo(
    () => new Set(visibleStars.map((star) => star.id)),
    [visibleStars],
  )
  const suggestions = useMemo(
    () =>
      deriveSuggestions(sky.stars, sky.constellations).filter(
        (suggestion) => !dismissedSuggestionIds.has(suggestion.id),
      ),
    [dismissedSuggestionIds, sky.constellations, sky.stars],
  )
  const visibleSuggestions = useMemo(
    () =>
      suggestions
        .map((suggestion) => ({
          ...suggestion,
          sharedTags: suggestion.sharedTags.filter((tag) => !hiddenTagIds.has(tag)),
        }))
        .filter(
          (suggestion) =>
            visibleStarIds.has(suggestion.starIds[0]) &&
            visibleStarIds.has(suggestion.starIds[1]) &&
            suggestion.sharedTags.length > 0,
        ),
    [hiddenTagIds, suggestions, visibleStarIds],
  )
  const selectedStar = visibleStars.find((star) => star.id === selectedStarId) ?? null
  const selectedSuggestion =
    visibleSuggestions.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null
  const searchResults = useMemo(
    () => searchStars(sky.stars, searchQuery),
    [searchQuery, sky.stars],
  )
  const matchingStarIds = searchQuery.trim()
    ? new Set(searchResults.map((star) => star.id))
    : null

  function closeAddStarForm() {
    setIsAddingStar(false)
    globalThis.requestAnimationFrame(() => addStarButtonRef.current?.focus())
  }

  function handleAddStar(values) {
    setSky((currentSky) => {
      const position = positionForStar(currentSky.stars.length)
      const nextSky = {
        ...currentSky,
        stars: [
          ...currentSky.stars,
          {
            id: createId('star'),
            ...values,
            tags: normalizeTags(values.tags),
            ...position,
            origin: 'manual',
            createdAt: new Date().toISOString(),
          },
        ],
      }

      return saveSky(nextSky)
    })
    closeAddStarForm()
  }

  function handleMoveStar(starId, position) {
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        stars: currentSky.stars.map((star) =>
          star.id === starId ? { ...star, ...position } : star,
        ),
      }),
    )
  }

  function handleDeleteStar(starId) {
    const previousSky = structuredClone(sky)
    setUndoState({ sky: previousSky, label: 'Star deletion' })
    setSky(
      saveSky({
        ...sky,
        stars: sky.stars.filter((star) => star.id !== starId),
        constellations: sky.constellations.flatMap((constellation) =>
          removeStarFromConstellation(constellation, starId),
        ),
      }),
    )
    setSelectedStarId(null)
    setNotice('Star deleted.')
  }

  function handleStartConnection(starId, constellationId = null) {
    // Click-click keeps drawing distinct from dragging and preserves keyboard parity.
    setConnectionDraft({ fromStarId: starId, constellationId })
    setSelectedStarId(null)
  }

  function handleSelectStar(starId) {
    if (!connectionDraft) {
      setSelectedStarId(starId)
      return
    }

    if (starId === connectionDraft.fromStarId) return

    setSky((currentSky) => {
      if (connectionDraft.constellationId) {
        const constellation = currentSky.constellations.find(
          (candidate) => candidate.id === connectionDraft.constellationId,
        )

        if (!constellation || constellation.starIds.includes(starId)) return currentSky

        const isFirst = constellation.starIds[0] === connectionDraft.fromStarId
        const isLast =
          constellation.starIds[constellation.starIds.length - 1] ===
          connectionDraft.fromStarId

        if (!isFirst && !isLast) return currentSky

        return saveSky({
          ...currentSky,
          constellations: currentSky.constellations.map((candidate) =>
            candidate.id === constellation.id
              ? {
                  ...candidate,
                  starIds: isFirst
                    ? [starId, ...candidate.starIds]
                    : [...candidate.starIds, starId],
                }
              : candidate,
          ),
        })
      }

      const pairAlreadyExists = currentSky.constellations.some((constellation) =>
        constellation.starIds.some(
          (candidateId, index) =>
            (candidateId === connectionDraft.fromStarId &&
              constellation.starIds[index + 1] === starId) ||
            (candidateId === starId &&
              constellation.starIds[index + 1] === connectionDraft.fromStarId),
        ),
      )

      if (pairAlreadyExists) return currentSky

      return saveSky({
        ...currentSky,
        constellations: [
          ...currentSky.constellations,
          {
            id: createId('con'),
            name: '',
            starIds: [connectionDraft.fromStarId, starId],
            createdAt: new Date().toISOString(),
            edgeTagOverrides: {},
          },
        ],
      })
    })

    setConnectionDraft(null)
    setSelectedStarId(starId)
  }

  function handleRenameConstellation(constellationId, name) {
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        constellations: currentSky.constellations.map((constellation) =>
          constellation.id === constellationId ? { ...constellation, name } : constellation,
        ),
      }),
    )
  }

  function handleUpdateStarTags(starId, tags) {
    setSky((currentSky) => {
      const stars = currentSky.stars.map((star) =>
        star.id === starId ? { ...star, tags: normalizeTags(tags) } : star,
      )

      return saveSky({
        ...currentSky,
        stars,
        constellations: pruneConnectionMeanings(currentSky.constellations, stars),
      })
    })
    setDismissedSuggestionIds(new Set())
  }

  function handleSetTagColor(tag, color) {
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        tagColorOverrides: {
          ...currentSky.tagColorOverrides,
          [tag]: color,
        },
      }),
    )
  }

  function handleResetTagColor(tag) {
    setSky((currentSky) => {
      const tagColorOverrides = { ...currentSky.tagColorOverrides }
      delete tagColorOverrides[tag]

      return saveSky({ ...currentSky, tagColorOverrides })
    })
  }

  function resetSelectionForColourFilter() {
    setConnectionDraft(null)
    setSelectedStarId(null)
    setSelectedSuggestionId(null)
  }

  function handleToggleTagVisibility(tag) {
    setHiddenTagIds((current) => {
      const next = new Set(current)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
    resetSelectionForColourFilter()
  }

  function handleShowAllTags() {
    setHiddenTagIds(new Set())
    resetSelectionForColourFilter()
  }

  function handleHideAllTags() {
    setHiddenTagIds(new Set(Object.keys(tagColors)))
    resetSelectionForColourFilter()
  }

  function handleSetConnectionMeaning(
    constellationId,
    firstStarId,
    secondStarId,
    tag,
  ) {
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        constellations: currentSky.constellations.map((constellation) => {
          if (constellation.id !== constellationId) return constellation

          const edgeTagOverrides = { ...constellation.edgeTagOverrides }
          const key = getEdgeKey(firstStarId, secondStarId)
          if (tag) edgeTagOverrides[key] = tag
          else delete edgeTagOverrides[key]

          return { ...constellation, edgeTagOverrides }
        }),
      }),
    )
  }

  function handleDisconnectStars(constellationId, firstStarId, secondStarId) {
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        constellations: currentSky.constellations.flatMap((constellation) =>
          constellation.id === constellationId
            ? removeEdgeFromConstellation(constellation, firstStarId, secondStarId)
            : [constellation],
        ),
      }),
    )
  }

  function handleDeleteConstellation(constellationId) {
    const previousSky = structuredClone(sky)
    setUndoState({ sky: previousSky, label: 'Constellation deletion' })
    setSky(
      saveSky({
        ...sky,
        constellations: sky.constellations.filter(
          (constellation) => constellation.id !== constellationId,
        ),
      }),
    )
    setIsConstellationIndexOpen(false)
    setNotice('Constellation deleted.')
  }

  function handleAcceptSuggestion(suggestion) {
    setSky((currentSky) => {
      const alreadyAuthored = currentSky.constellations.some((constellation) =>
        constellation.starIds.some(
          (starId, index) =>
            (starId === suggestion.starIds[0] &&
              constellation.starIds[index + 1] === suggestion.starIds[1]) ||
            (starId === suggestion.starIds[1] &&
              constellation.starIds[index + 1] === suggestion.starIds[0]),
        ),
      )

      if (alreadyAuthored) return currentSky

      return saveSky({
        ...currentSky,
        constellations: [
          ...currentSky.constellations,
          {
            id: createId('con'),
            name: '',
            starIds: [...suggestion.starIds],
            createdAt: new Date().toISOString(),
            edgeTagOverrides: {},
          },
        ],
      })
    })
    setSelectedSuggestionId(null)
  }

  function handleDismissSuggestion(suggestionId) {
    setDismissedSuggestionIds((current) => new Set([...current, suggestionId]))
    setSelectedSuggestionId(null)
  }

  function replaceSky(nextSky, message) {
    setUndoState({ sky: structuredClone(sky), label: 'Sky replacement' })
    setSky(saveSky(nextSky))
    setHiddenTagIds(new Set())
    setConnectionDraft(null)
    setSelectedStarId(null)
    setSelectedSuggestionId(null)
    setDismissedSuggestionIds(new Set())
    setShareUrl('')
    setNotice(message)
  }

  function handleUndo() {
    if (!undoState) return

    setSky(saveSky(undoState.sky))
    setUndoState(null)
    setNotice(`${undoState.label} undone.`)
  }

  function handleExport() {
    const blob = new Blob([exportSky(sky)], { type: 'application/json' })
    const objectUrl = URL.createObjectURL(blob)
    const download = document.createElement('a')
    download.href = objectUrl
    download.download = `lodestar-sky-${new Date().toISOString().slice(0, 10)}.json`
    download.hidden = true
    document.body.append(download)
    download.click()
    download.remove()
    globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    setNotice('Your sky was exported as JSON.')
  }

  async function handleImportFile(file) {
    if (!file) return

    const confirmed = globalThis.confirm(
      'Importing replaces the sky currently saved in this browser. Continue?',
    )
    if (!confirmed) return

    try {
      replaceSky(importSky(await file.text()), 'Imported sky saved in this browser.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  function handleCreateShareLink() {
    try {
      const baseUrl = `${globalThis.location.origin}${globalThis.location.pathname}${globalThis.location.search}`
      const prefix = `${baseUrl}#sky=`
      const encoded = encodeSky(sky, {
        maxLength: Math.max(1, MAX_SHARE_URL_LENGTH - prefix.length),
      })
      setShareUrl(`${prefix}${encoded}`)
      setNotice('Share link ready. It imports only after the recipient confirms.')
    } catch (error) {
      setShareUrl('')
      setNotice(error.message)
    }
  }

  async function handleCopyShareLink() {
    try {
      await globalThis.navigator.clipboard.writeText(shareUrl)
      setNotice('Share link copied.')
    } catch {
      setNotice('Copy was unavailable. Select the link and copy it manually.')
    }
  }

  function handleApplySharedSky() {
    replaceSky(sharedSky.sky, 'Shared sky imported into this browser.')
    setSharedSky({ sky: null, error: null })
    clearShareHash()
  }

  function handleDismissSharedSky() {
    setSharedSky({ sky: null, error: null })
    clearShareHash()
  }

  return (
    <main className="sky-shell relative min-h-screen overflow-hidden bg-night-950 text-white">
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10 sm:py-6">
        <a
          className="font-display text-xl tracking-[0.18em] text-starlight"
          href="./"
          aria-label="Lodestar home"
        >
          Lodestar
        </a>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-5">
          <p className="hidden text-xs tracking-[0.16em] text-slate-400 sm:block">
            A sky that remembers
          </p>
          <SkyToolbar
            addButtonRef={addStarButtonRef}
            constellationCount={sky.constellations.length}
            suggestionCount={visibleSuggestions.length}
            suggestionsVisible={suggestionsVisible}
            onAddStar={() => setIsAddingStar(true)}
            onExport={handleExport}
            onImportFile={handleImportFile}
            onOpenConstellations={() => {
              setIsSearching(false)
              setSearchQuery('')
              setIsConstellationIndexOpen(true)
            }}
            onOpenSearch={() => {
              setIsConstellationIndexOpen(false)
              setIsSearching(true)
            }}
            onShare={handleCreateShareLink}
            onToggleSuggestions={() => {
              setSuggestionsVisible((visible) => !visible)
              setSelectedSuggestionId(null)
            }}
          />
        </div>
      </header>

      <SkyCanvas
        connectionDraft={connectionDraft}
        constellations={sky.constellations}
        hiddenTagIds={hiddenTagIds}
        selectedSuggestion={selectedSuggestion}
        stars={visibleStars}
        totalStarCount={sky.stars.length}
        tagColors={tagColors}
        tagColorOverrides={sky.tagColorOverrides}
        suggestions={suggestionsVisible ? visibleSuggestions : []}
        selectedStar={selectedStar}
        onAcceptSuggestion={handleAcceptSuggestion}
        onAddStar={() => setIsAddingStar(true)}
        onCancelConnection={() => setConnectionDraft(null)}
        onCloseStar={() => setSelectedStarId(null)}
        onCloseSuggestion={() => setSelectedSuggestionId(null)}
        onDeleteConstellation={handleDeleteConstellation}
        onDeleteStar={handleDeleteStar}
        onDismissSuggestion={handleDismissSuggestion}
        onDisconnectStars={handleDisconnectStars}
        onMoveStar={handleMoveStar}
        onHideAllTags={handleHideAllTags}
        onRenameConstellation={handleRenameConstellation}
        onResetTagColor={handleResetTagColor}
        onSelectSuggestion={setSelectedSuggestionId}
        onSelectStar={handleSelectStar}
        onSetConnectionMeaning={handleSetConnectionMeaning}
        onSetTagColor={handleSetTagColor}
        onShowAllTags={handleShowAllTags}
        onStartConnection={handleStartConnection}
        onToggleTagVisibility={handleToggleTagVisibility}
        onUpdateStarTags={handleUpdateStarTags}
        matchingStarIds={matchingStarIds}
      />

      {isSearching ? (
        <SkySearch
          query={searchQuery}
          results={searchResults}
          tags={Object.keys(tagColors)}
          onClose={() => {
            setIsSearching(false)
            setSearchQuery('')
          }}
          onQueryChange={setSearchQuery}
          onSelectStar={(starId) => {
            setSelectedStarId(starId)
            setIsSearching(false)
            setSearchQuery('')
          }}
        />
      ) : null}

      {isConstellationIndexOpen ? (
        <ConstellationIndex
          constellations={sky.constellations}
          stars={sky.stars}
          onClose={() => setIsConstellationIndexOpen(false)}
          onSelect={(constellation) => {
            setSelectedStarId(constellation.starIds[0] ?? null)
            setIsConstellationIndexOpen(false)
          }}
        />
      ) : null}

      {isAddingStar ? (
        <AddStarForm onCancel={closeAddStarForm} onSave={handleAddStar} />
      ) : null}

      {shareUrl ? (
        <section
          className="absolute right-4 top-28 z-30 w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-white/10 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:right-8 sm:top-24"
          aria-labelledby="share-sky-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="share-sky-title" className="font-display text-xl text-starlight">
                Carry this sky elsewhere
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Opening the link asks before replacing any saved sky.
              </p>
            </div>
            <button
              className="rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              aria-label="Close share link"
              onClick={() => setShareUrl('')}
            >
              ×
            </button>
          </div>
          <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-slate-500">
            Shareable link
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-3 py-3 text-sm text-slate-300 outline-none focus:border-aurora focus:ring-2 focus:ring-aurora/25"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              className="rounded-full bg-starlight px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={handleCopyShareLink}
            >
              Copy link
            </button>
          </div>
        </section>
      ) : null}

      {sharedSky.sky || sharedSky.error ? (
        <section
          className="absolute left-1/2 top-28 z-30 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-aurora/20 bg-night-900/95 p-5 text-center shadow-2xl shadow-black/40 backdrop-blur-md sm:top-24"
          aria-labelledby="shared-sky-title"
        >
          <h2 id="shared-sky-title" className="font-display text-xl text-starlight">
            {sharedSky.sky ? 'A shared sky is waiting' : 'This shared sky could not be read'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {sharedSky.sky
              ? 'Importing replaces the sky currently saved in this browser.'
              : sharedSky.error}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={handleDismissSharedSky}
            >
              {sharedSky.sky ? 'Keep my sky' : 'Dismiss'}
            </button>
            {sharedSky.sky ? (
              <button
                className="rounded-full bg-starlight px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
                type="button"
                onClick={handleApplySharedSky}
              >
                Import shared sky
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {notice ? (
        <div
          className="absolute bottom-4 left-1/2 z-50 flex max-w-[calc(100%-2rem)] items-center gap-3 -translate-x-1/2 rounded-full border border-white/10 bg-night-900/95 px-4 py-2 text-center text-sm text-slate-300 shadow-xl shadow-black/30"
          aria-live="polite"
        >
          <span>{notice}</span>
          {undoState ? (
            <button
              className="rounded-full border border-aurora/35 px-3 py-1 text-xs font-medium text-aurora transition hover:border-aurora hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={handleUndo}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}
