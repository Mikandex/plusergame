// hooks/useSfx.ts
import { sounds } from '@/constants'
import { useAudioPlayer } from 'expo-audio'

export const useSfx = () => {
  const flipPlayer  = useAudioPlayer(sounds.flipPlayer)
  const winPlayer   = useAudioPlayer(sounds.winPlayer)
  const losePlayer  = useAudioPlayer(sounds.losePlayer)
  const nextPlayer  = useAudioPlayer(sounds.startPlayer)
  const errorPlayer = useAudioPlayer(sounds.errorPlayer)

  flipPlayer.volume  = 1.0
  winPlayer.volume   = 1.0
  losePlayer.volume  = 1.0
  nextPlayer.volume  = 1.0
  errorPlayer.volume = 1.0

  const play = (player: typeof flipPlayer) => {
    try {
      player.seekTo(0)
      player.play()
    } catch {}
  }

  return {
    flip:  () => play(flipPlayer),
    win:   () => play(winPlayer),
    lose:  () => play(losePlayer),
    next:  () => play(nextPlayer),
    error: () => play(errorPlayer),
  }
}