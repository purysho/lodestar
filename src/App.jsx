import React from 'react'
import { useState } from 'react'

import AddStarForm from './components/AddStarForm.jsx'
import SkyCanvas from './components/SkyCanvas.jsx'
import { loadSky, saveSky } from './lib/store.js'

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

export default function App() {
  const [sky, setSky] = useState(() => loadSky())
  const [isAddingStar, setIsAddingStar] = useState(false)
  const [selectedStarId, setSelectedStarId] = useState(null)
  const [connectionDraft, setConnectionDraft] = useState(null)

  const selectedStar = sky.stars.find((star) => star.id === selectedStarId) ?? null

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
            ...position,
            origin: 'manual',
            createdAt: new Date().toISOString(),
          },
        ],
      }

      return saveSky(nextSky)
    })
    setIsAddingStar(false)
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
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        stars: currentSky.stars.filter((star) => star.id !== starId),
        constellations: currentSky.constellations.flatMap((constellation) =>
          removeStarFromConstellation(constellation, starId),
        ),
      }),
    )
    setSelectedStarId(null)
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
    setSky((currentSky) =>
      saveSky({
        ...currentSky,
        constellations: currentSky.constellations.filter(
          (constellation) => constellation.id !== constellationId,
        ),
      }),
    )
  }

  return (
    <main className="sky-shell relative min-h-screen overflow-hidden bg-night-950 text-white">
      <header className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10">
        <a
          className="font-display text-xl tracking-[0.18em] text-starlight"
          href="./"
          aria-label="Lodestar home"
        >
          Lodestar
        </a>
        <div className="flex items-center gap-5">
          <p className="hidden text-xs tracking-[0.16em] text-slate-400 sm:block">
            A sky that remembers
          </p>
          <button
            className="rounded-full border border-aurora/40 bg-night-800/70 px-4 py-2 text-sm font-medium tracking-wide text-slate-100 transition hover:border-aurora hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            type="button"
            onClick={() => setIsAddingStar(true)}
          >
            Add a star
          </button>
        </div>
      </header>

      <SkyCanvas
        connectionDraft={connectionDraft}
        constellations={sky.constellations}
        stars={sky.stars}
        selectedStar={selectedStar}
        onCancelConnection={() => setConnectionDraft(null)}
        onCloseStar={() => setSelectedStarId(null)}
        onDeleteConstellation={handleDeleteConstellation}
        onDeleteStar={handleDeleteStar}
        onDisconnectStars={handleDisconnectStars}
        onMoveStar={handleMoveStar}
        onRenameConstellation={handleRenameConstellation}
        onSelectStar={handleSelectStar}
        onStartConnection={handleStartConnection}
      />

      {isAddingStar ? (
        <AddStarForm onCancel={() => setIsAddingStar(false)} onSave={handleAddStar} />
      ) : null}
    </main>
  )
}
