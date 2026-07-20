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

export default function App() {
  const [sky, setSky] = useState(() => loadSky())
  const [isAddingStar, setIsAddingStar] = useState(false)
  const [selectedStarId, setSelectedStarId] = useState(null)

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
        constellations: currentSky.constellations
          .map((constellation) => ({
            ...constellation,
            starIds: constellation.starIds.filter((id) => id !== starId),
          }))
          .filter((constellation) => constellation.starIds.length > 0),
      }),
    )
    setSelectedStarId(null)
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
        stars={sky.stars}
        selectedStar={selectedStar}
        onCloseStar={() => setSelectedStarId(null)}
        onDeleteStar={handleDeleteStar}
        onMoveStar={handleMoveStar}
        onSelectStar={setSelectedStarId}
      />

      {isAddingStar ? (
        <AddStarForm onCancel={() => setIsAddingStar(false)} onSave={handleAddStar} />
      ) : null}
    </main>
  )
}
