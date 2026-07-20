import React from 'react'
import { useEffect, useRef, useState } from 'react'

const EMPTY_FORM = {
  title: '',
  note: '',
  tags: '',
  url: '',
}

export default function AddStarForm({ onCancel, onSave, prompt = '' }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const dialogRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const focusable = Array.from(focusableElements ?? [])
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) return

    onSave({
      title,
      note: form.note.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      url: form.url.trim(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-night-950/80 px-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-night-900/95 p-6 shadow-2xl shadow-black/40"
        role="dialog"
        aria-labelledby="add-star-title"
        aria-modal="true"
      >
        <div className="mb-6">
          <h2 id="add-star-title" className="font-display text-2xl text-starlight">
            Place a new light
          </h2>
          <p className="mt-2 text-sm text-slate-400">{prompt || 'Keep only what made you pause.'}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-300">
            Title <span className="text-aurora">*</span>
            <input
              autoFocus
              className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-aurora focus:ring-2 focus:ring-aurora/25"
              name="title"
              placeholder={prompt || 'Something that struck you'}
              required
              value={form.title}
              onChange={updateField}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Note
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-aurora focus:ring-2 focus:ring-aurora/25"
              maxLength="180"
              name="note"
              placeholder="One quiet line"
              value={form.note}
              onChange={updateField}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Tags
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-aurora focus:ring-2 focus:ring-aurora/25"
              name="tags"
              placeholder="wonder, science, memory"
              value={form.tags}
              onChange={updateField}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Link
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-night-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-aurora focus:ring-2 focus:ring-aurora/25"
              name="url"
              placeholder="https://"
              type="url"
              value={form.url}
              onChange={updateField}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-starlight px-5 py-2 text-sm font-semibold text-night-950 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
              type="submit"
            >
              Add to my sky
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
