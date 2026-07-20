import React from 'react'
import { useEffect } from 'react'

const PROMPT_PACKS = [
  { name: 'Curiosity', prompts: ['A question I keep returning to', 'Something I want to understand', 'A fact that changed my sense of scale'] },
  { name: 'Creative fuel', prompts: ['A piece of work I want to make', 'A reference I want nearby', 'A strange combination worth exploring'] },
  { name: 'Open questions', prompts: ['A mystery I would love answered', 'A tension I notice in the world', 'A possibility I do not want to forget'] },
]

export default function StarterPrompts({ onChoose, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <section className="absolute left-1/2 top-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-night-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-md" role="dialog" aria-labelledby="starter-prompts-title">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="starter-prompts-title" className="font-display text-2xl text-starlight">A little spark</h2><p className="mt-2 text-sm text-slate-400">Choose a prompt, then make it your own. Nothing is saved yet.</p></div>
        <button className="-mr-2 -mt-2 rounded-full px-2 py-1 text-lg text-slate-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora" type="button" aria-label="Close prompts" onClick={onClose}>×</button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PROMPT_PACKS.map((pack) => <section key={pack.name} className="rounded-xl border border-white/10 bg-night-950/45 p-4"><h3 className="text-sm font-semibold text-starlight">{pack.name}</h3><div className="mt-3 space-y-2">{pack.prompts.map((prompt) => <button key={prompt} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs leading-5 text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora" type="button" onClick={() => onChoose(prompt)}>{prompt}</button>)}</div></section>)}
      </div>
    </section>
  )
}
