import { useEffect } from 'react'
import { useGame } from '#/game/useGame'
import { GameOverScreen, RoundEndScreen, RoundIntroScreen } from './RoundScreens'
import { SetupScreen } from './SetupScreen'
import { TurnActiveScreen, TurnReadyScreen, TurnReviewScreen } from './TurnScreens'
import { WritingScreen } from './WritingScreen'

export function FishbowlGame() {
  const [state, dispatch] = useGame()
  const phase = state.phase.name

  // Cada tela nova começa do topo (o celular passa de mão em mão)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase])

  const props = { state, dispatch }
  switch (phase) {
    case 'setup':
      return <SetupScreen {...props} />
    case 'writing':
      return <WritingScreen {...props} />
    case 'roundIntro':
      return <RoundIntroScreen {...props} />
    case 'turnReady':
      return <TurnReadyScreen {...props} />
    case 'turnActive':
      return <TurnActiveScreen {...props} />
    case 'turnReview':
      return <TurnReviewScreen {...props} />
    case 'roundEnd':
      return <RoundEndScreen {...props} />
    case 'gameOver':
      return <GameOverScreen {...props} />
  }
}
