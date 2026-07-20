import React from 'react'

import Star from './Star.jsx'

export default function SkyCanvas({ stars }) {
  return (
    <section className="absolute inset-0 z-10" aria-label="Your sky">
      <svg className="h-full w-full" role="group" aria-label={`${stars.length} stars in your sky`}>
        {stars.map((star) => (
          <Star key={star.id} star={star} />
        ))}
      </svg>

      {stars.length === 0 ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 pb-20 text-center"
          aria-live="polite"
        >
          <div className="max-w-md">
            <div className="mx-auto mb-8 h-1.5 w-1.5 rounded-full bg-starlight shadow-star" />
            <h1 className="font-display text-3xl leading-tight text-slate-100 sm:text-4xl">
              Your sky is empty.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              Add something that struck you.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
