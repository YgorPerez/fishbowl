import { createFileRoute } from '@tanstack/react-router'
import { FishbowlGame } from '#/components/game/FishbowlGame'
import { Fishbowl } from '#/components/game/ui'
import { wordBankQuery } from '#/game/word-bank'

export const Route = createFileRoute('/')({
  // O jogo vive no localStorage e usa APIs do navegador (wake lock, áudio):
  // renderiza só no cliente.
  ssr: false,
  loader: ({ context }) => context.queryClient.prefetchQuery(wordBankQuery),
  pendingComponent: Loading,
  component: FishbowlGame,
})

function Loading() {
  return (
    <main className="screen grid place-items-center">
      <Fishbowl size={120} />
    </main>
  )
}
