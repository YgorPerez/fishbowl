import { queryOptions } from '@tanstack/react-query'

/**
 * Carregado sob demanda (chunk separado) e cacheado pelo TanStack Query —
 * não muda durante a sessão, por isso `staleTime: Infinity`.
 */
export const wordBankQuery = queryOptions({
  queryKey: ['word-bank'],
  queryFn: async () => (await import('./word-list')).WORD_BANK,
  staleTime: Infinity,
})

export function pickWords(
  bank: readonly string[],
  count: number,
  exclude: Iterable<string> = [],
) {
  const taken = new Set([...exclude].map((w) => w.trim().toLowerCase()))
  const pool = bank.filter((w) => !taken.has(w.toLowerCase()))
  const out: string[] = []
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    out.push(...pool.splice(i, 1))
  }
  return out
}
