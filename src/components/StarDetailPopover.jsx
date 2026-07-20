import React from 'react'

export default function StarDetailPopover({ star, onClose, onDelete }) {
  return (
    <aside
      className="absolute bottom-6 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-night-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:bottom-8 sm:left-8 sm:translate-x-0"
      aria-labelledby="star-detail-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="star-detail-title" className="truncate font-display text-xl text-starlight">
            {star.title}
          </h2>
          {star.note ? <p className="mt-2 text-sm leading-6 text-slate-300">{star.note}</p> : null}
        </div>
        <button
          className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
          type="button"
          aria-label="Close star details"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {star.tags.length > 0 ? (
        <p className="mt-4 text-xs tracking-wide text-aurora/90">{star.tags.join(' · ')}</p>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        {star.url ? (
          <a
            className="text-sm text-starlight underline decoration-white/25 underline-offset-4 transition hover:decoration-starlight focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
            href={star.url}
            rel="noreferrer"
            target="_blank"
          >
            Open link
          </a>
        ) : (
          <span className="text-xs text-slate-600">No link attached</span>
        )}
        <button
          className="rounded-full px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          type="button"
          onClick={onDelete}
        >
          Delete star
        </button>
      </div>
    </aside>
  )
}
