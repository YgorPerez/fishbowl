import type { RoundKind } from './types'

export interface RoundInfo {
  kind: RoundKind
  emoji: string
  title: string
  short: string
  rules: string[]
}

export const ROUNDS: Record<RoundKind, RoundInfo> = {
  describe: {
    kind: 'describe',
    emoji: '🗣️',
    title: 'Descreva',
    short: 'Fale à vontade, sem dizer a palavra',
    rules: [
      'Fale o que quiser para seu time adivinhar.',
      'Não pode dizer a palavra, nem pedaços dela.',
      'Nada de soletrar, rimar ("rima com...") ou traduzir.',
    ],
  },
  oneWord: {
    kind: 'oneWord',
    emoji: '☝️',
    title: 'Uma palavra',
    short: 'Só UMA palavra por papel',
    rules: [
      'Você só pode dizer UMA palavra para cada papel.',
      'Pode repetir essa mesma palavra e fazer gestos de apoio.',
      'Seu time pode chutar quantas vezes quiser.',
    ],
  },
  charades: {
    kind: 'charades',
    emoji: '🤐',
    title: 'Mímica',
    short: 'Sem falar nada, só gestos',
    rules: [
      'Proibido falar ou fazer qualquer som.',
      'Só gestos, expressões e mímica.',
      'Apontar para objetos da sala vale (a não ser que o grupo combine o contrário).',
    ],
  },
  sounds: {
    kind: 'sounds',
    emoji: '🎵',
    title: 'Só sons',
    short: 'Apenas sons, sem palavras e sem gestos',
    rules: [
      'Faça só sons e barulhos — nada de palavras.',
      'Mãos paradas: sem gestos.',
      'Cantarolar melodias vale!',
    ],
  },
}

export const ALL_ROUND_KINDS: RoundKind[] = [
  'describe',
  'oneWord',
  'charades',
  'sounds',
]
