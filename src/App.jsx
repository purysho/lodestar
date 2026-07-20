import React from 'react'

export default function App() {
  return (
    <main className="sky-shell relative min-h-screen overflow-hidden bg-night-950 text-white">
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <a
          className="font-display text-xl tracking-[0.18em] text-starlight"
          href="./"
          aria-label="Lodestar home"
        >
          Lodestar
        </a>
        <p className="text-xs tracking-[0.16em] text-slate-400">A sky that remembers</p>
      </header>

      <section
        className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-24 text-center"
        aria-labelledby="empty-sky-title"
      >
        <div className="max-w-md">
          <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-starlight shadow-star" />
          <h1
            id="empty-sky-title"
            className="font-display text-3xl leading-tight text-slate-100 sm:text-4xl"
          >
            Your sky is empty.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
            Add something that struck you.
          </p>
        </div>
      </section>
    </main>
  )
}
