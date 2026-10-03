import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { writingOrder } from '#/game/engine'
import { newSeed } from '#/game/random'
import type { GameState } from '#/game/types'
import type { Dispatch } from '#/game/useGame'
import { pickWords, wordBankQuery } from '#/game/word-bank'
import { Button, Fishbowl, Screen, TeamDot } from './ui'

export function WritingScreen({
  state,
  dispatch,
}: {
  state: GameState
  dispatch: Dispatch
}) {
  if (state.phase.name !== 'writing') return null
  const { cursor, revealed } = state.phase
  const order = writingOrder(state.teams)
  const writer = order[cursor]
  const team = state.teams[writer.teamIdx]

  if (!revealed) {
    return (
      <Screen className="items-center justify-between text-center">
        <div className="flex w-full items-center justify-between text-sm text-foam/60">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 font-semibold active:bg-white/10"
            onClick={() => {
              if (window.confirm('Voltar para a configuração? Os papéis já escritos serão descartados.'))
                dispatch({ type: 'BACK_TO_SETUP' })
            }}
          >
            ← Times
          </button>
          <span className="font-bold tabular-nums">
            {cursor + 1} de {order.length}
          </span>
        </div>

        <div className="space-y-5">
          <Fishbowl count={state.slips.length} size={140} />
          <p className="text-lg text-foam/70">Passe o celular para</p>
          <h1 className="font-display text-5xl font-black break-words">
            {writer.player}
          </h1>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-bold">
            <TeamDot color={team.color} /> {team.name}
          </p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: 'REVEAL_WRITER' })}
        >
          Sou eu! Escrever papéis
        </Button>
      </Screen>
    )
  }

  return (
    <WordsForm
      key={cursor}
      player={writer.player}
      count={state.settings.wordsPerPlayer}
      onSubmit={(words) =>
        dispatch({ type: 'SUBMIT_WORDS', words, seed: newSeed() })
      }
    />
  )
}

function WordsForm({
  player,
  count,
  onSubmit,
}: {
  player: string
  count: number
  onSubmit: (words: string[]) => void
}) {
  const [words, setWords] = useState<string[]>(() => Array(count).fill(''))
  const [error, setError] = useState('')
  const wordBank = useQuery(wordBankQuery)

  const setWord = (i: number, value: string) => {
    setError('')
    setWords((ws) => ws.map((w, j) => (j === i ? value : w)))
  }

  const suggest = (i: number) => {
    const [word] = pickWords(wordBank.data ?? [], 1, words)
    if (word) setWord(i, word)
  }

  const submit = () => {
    const trimmed = words.map((w) => w.trim())
    if (trimmed.some((w) => !w)) {
      setError(`Preencha os ${count} papéis.`)
      return
    }
    const unique = new Set(trimmed.map((w) => w.toLowerCase()))
    if (unique.size !== trimmed.length) {
      setError('Tem papel repetido.')
      return
    }
    onSubmit(trimmed)
  }

  return (
    <Screen className="gap-5">
      <header className="pt-2">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
          Só {player} pode olhar 👀
        </p>
        <h1 className="font-display mt-1 text-3xl font-black">
          Escreva {count} {count === 1 ? 'papel' : 'papéis'}
        </h1>
        <p className="mt-1 text-sm text-foam/70">
          Pessoas famosas, personagens, lugares, objetos, expressões… qualquer
          coisa que o grupo possa conhecer.
        </p>
      </header>

      <form
        className="flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {words.map((w, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-2xl bg-white/10 px-4 py-3.5 text-lg font-semibold outline-none placeholder:text-foam/30 focus:ring-2 focus:ring-amber-300"
              placeholder={`Papel ${i + 1}`}
              value={w}
              maxLength={60}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint={i === words.length - 1 ? 'done' : 'next'}
              onChange={(e) => setWord(i, e.target.value)}
            />
            <button
              type="button"
              aria-label="Sugerir um papel"
              title="Sugerir"
              disabled={!wordBank.data}
              className="w-14 rounded-2xl bg-white/10 text-xl active:bg-white/20 disabled:opacity-40"
              onClick={() => suggest(i)}
            >
              🎲
            </button>
          </div>
        ))}

        {error && (
          <p role="alert" className="text-sm font-bold text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Button type="submit" size="lg" className="w-full">
            Dobrar e jogar no pote 🐟
          </Button>
        </div>
      </form>
    </Screen>
  )
}
