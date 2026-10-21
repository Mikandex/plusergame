import { images } from '@/constants'
import type { ImageSourcePropType } from 'react-native'

export type VirtualGame = {
  id: string
  title: string
  description: string
  image: ImageSourcePropType
  route: string
}

export const VIRTUAL_GAMES: VirtualGame[] = [
  {
    id: '1',
    title: 'Dice',
    description: 'Bet even, high, or an exact total — two dice.',
    image: images.dice,
    route: '/(protected)/(routes)/GameDetails?gameKey=dice',
  },
  {
    id: '2',
    title: 'Lottery',
    description: 'Pick five. Watch the hopper draw the rest.',
    image: images.lottery,
    route: '/(protected)/(routes)/GameDetails?gameKey=lottery',
  },
  {
    id: '3',
    title: 'Card',
    description: 'Higher or lower — read the next card.',
    image: images.card,
    route: '/(protected)/(routes)/GameDetails?gameKey=card',
  },
  {
    id: '4',
    title: 'Coin',
    description: 'Heads, tails, or the rare edge — a real toss.',
    image: images.coinPlaceholder,
    route: '/(protected)/(routes)/GameDetails?gameKey=coin',
  },
  {
    id: '5',
    title: 'Hot Cold',
    description: 'Guess the house number. Hot is close. Only exact pays.',
    image: images.hotCold,
    route: '/(protected)/(routes)/GameDetails?gameKey=hotcold',
  },
  {
    id: '6',
    title: 'Lucky Box',
    description: 'Three lids. One prize. Watch it open.',
    image: images.box,
    route: '/(protected)/(routes)/GameDetails?gameKey=luckybox',
  },
  {
    id: '7',
    title: 'Reel Streak',
    description: 'Three reels. Hit the gold payline.',
    image: images.fruit,
    route: '/(protected)/(routes)/GameDetails?gameKey=reelstreak',
  },
  {
    id: '8',
    title: 'RPS Bet',
    description: 'Throw rock, paper, or scissors. House throws back.',
    image: images.betting,
    route: '/(protected)/(routes)/GameDetails?gameKey=rpsbet',
  },
  {
    id: '9',
    title: 'Spin 2 Win',
    description: 'The peg at the top is the payline.',
    image: images.spinToWin,
    route: '/(protected)/(routes)/GameDetails?gameKey=spinwheel',
  },
]

export function featuredGameOfDay(now = new Date()) {
  const start = Date.UTC(now.getFullYear(), 0, 1)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const day = Math.floor((today - start) / 86400000)
  return VIRTUAL_GAMES[day % VIRTUAL_GAMES.length]
}
