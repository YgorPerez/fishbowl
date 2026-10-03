import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ROUNDS } from '#/game/rounds'
import { totalScore } from '#/game/engine'
import type { GameState } from '#/game/types'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-amber-400 text-ocean-950 shadow-[0_6px_0_#b45309] active:translate-y-1 active:shadow-[0_2px_0_#b45309]',
  secondary:
    'bg-white/12 text-foam ring-1 ring-white/20 active:bg-white/20',
  ghost: 'bg-transparent text-foam/80 active:bg-white/10',
  success:
    'bg-emerald-400 text-emerald-950 shadow-[0_6px_0_#047857] active:translate-y-1 active:shadow-[0_2px_0_#047857]',
  danger:
    'bg-rose-500 text-white shadow-[0_6px_0_#9f1239] active:translate-y-1 active:shadow-[0_2px_0_#9f1239]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-xl',
    md: 'px-5 py-3.5 text-base rounded-2xl',
    lg: 'px-6 py-5 text-xl rounded-3xl',
  }
  return (
    <button
      type="button"
      className={`no-select font-extrabold transition disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 ${sizes[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function Screen({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <main
      className={`screen mx-auto flex w-full max-w-md flex-col ${className}`}
      style={style}
    >
      {children}
    </main>
  )
}

export function TeamDot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full ring-2 ring-white/40"
      style={{ background: color, width: size, height: size }}
    />
  )
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl bg-white/8 p-4 ring-1 ring-white/12 backdrop-blur ${className}`}
    >
      {children}
    </section>
  )
}

export function Fishbowl({ count, size = 120 }: { count?: number; size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0369a1" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M30 14 h40 v6 c14 8 22 22 22 38 c0 22 -18 34 -42 34 s-42 -12 -42 -34 c0 -16 8 -30 22 -38z"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2.5"
        />
        <path
          d="M11 50 c0 0 10 -5 20 0 s20 5 30 0 s20 -5 28 0 c2 4 3 6 3 8 c0 22 -18 34 -42 34 s-42 -12 -42 -34 c0 -3 1 -5 3 -8z"
          fill="url(#water)"
        />
        {/* papéis dobrados */}
        <rect x="28" y="66" width="14" height="9" rx="1.5" fill="#fde68a" transform="rotate(-18 35 70)" />
        <rect x="46" y="70" width="14" height="9" rx="1.5" fill="#fbcfe8" transform="rotate(12 53 74)" />
        <rect x="58" y="62" width="14" height="9" rx="1.5" fill="#bbf7d0" transform="rotate(-6 65 66)" />
        {/* peixinho */}
        <g transform="translate(38 52)">
          <ellipse cx="8" cy="4" rx="8" ry="5" fill="#fb923c" />
          <path d="M15 4 l7 -5 v10z" fill="#fb923c" />
          <circle cx="4" cy="3" r="1.3" fill="#061428" />
        </g>
        <path d="M24 28 c-4 8 -6 16 -5 24" stroke="white" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="bubble absolute left-[58%] top-[40%] h-2 w-2 rounded-full bg-white/70" />
      <span
        className="bubble absolute left-[48%] top-[45%] h-1.5 w-1.5 rounded-full bg-white/70"
        style={{ animationDelay: '2s' }}
      />
      {count !== undefined && (
        <span className="absolute -right-2 -top-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-black text-ocean-950 shadow">
          {count}
        </span>
      )}
    </div>
  )
}

export function Scoreboard({
  state,
  highlightRound,
}: {
  state: GameState
  highlightRound?: number
}) {
  const ranking = state.teams
    .map((team, idx) => ({ team, idx, total: totalScore(state, idx) }))
    .sort((a, b) => b.total - a.total)
  return (
    <div className="space-y-2">
      {ranking.map(({ team, idx, total }) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3"
        >
          <TeamDot color={team.color} size={14} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{team.name}</div>
            <div className="flex gap-2 text-xs text-foam/60">
              {state.settings.rounds.map((kind, r) => (
                <span
                  key={kind}
                  className={r === highlightRound ? 'font-bold text-amber-300' : ''}
                >
                  {ROUNDS[kind].emoji} {state.scores[idx]?.[r] ?? 0}
                </span>
              ))}
            </div>
          </div>
          <div className="font-display text-3xl font-black tabular-nums">{total}</div>
        </div>
      ))}
    </div>
  )
}

export function QuitButton({ onQuit }: { onQuit: () => void }) {
  return (
    <button
      type="button"
      aria-label="Sair do jogo"
      className="rounded-full px-3 py-1.5 text-sm font-semibold text-foam/60 active:bg-white/10"
      onClick={() => {
        if (window.confirm('Sair do jogo? O placar e as palavras serão perdidos.'))
          onQuit()
      }}
    >
      ✕ Sair
    </button>
  )
}
