import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AccessibilityInfo, useWindowDimensions } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import z from 'zod'
import Toast from 'react-native-toast-message'
import { hasEnoughBalance } from '@/utils/stakeGuard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import GameBalancePill from '@/components/virtuals/GameBalancePill'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import displayCurrency from '@/utils/displayCurrency'
import { triggerHaptic } from '@/utils/vibration'
import GameRulesSheet from '@/components/virtuals/GameRulesSheet'
import RoundResultOverlay from '@/components/virtuals/RoundResultOverlay'
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import MinesTile, { GemIcon, type TileState } from '@/components/virtuals/MinesTile'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  mines: z.number().int().min(1, 'Play with at least 1 mine').max(24, 'Play with at most 24 mines'),
})

const RULES_KEY = 'plusergame.rules.mines.v1'
const GRID = 25
const MINE_CHIPS = [1, 3, 5, 10, 24]

const MINES_RULES = [
  'Choose how many mines hide in the 25 tiles. More mines, bigger multipliers.',
  'Tap Start. Your stake is taken and the round begins.',
  'Open tiles one at a time. Every gem raises your multiplier.',
  'Cash out whenever you like to collect stake × multiplier. Hit a mine and the round is lost.',
  'An unfinished round waits for you for 24 hours. Stake ₦50–₦1,000.',
]

// Mirrors the server: 97% return, capped at 1000x.
function minesMultiplier(mines: number, safe: number) {
  if (safe <= 0) return 1
  let m = 0.97
  for (let i = 0; i < safe; i += 1) m *= (GRID - i) / (GRID - mines - i)
  return Math.min(Math.floor(m * 100 + 1e-9) / 100, 1000)
}

type Status = 'idle' | 'playing' | 'lost' | 'cashed_out' | 'cleared'

type Round = {
  status: Status
  stake: number
  mines: number
  revealed: number[]
  mineTiles: number[]
  hit: number | null
  multiplier: number
  nextMultiplier: number
  payout: number
}

const EMPTY: Round = {
  status: 'idle',
  stake: 0,
  mines: 3,
  revealed: [],
  mineTiles: [],
  hit: null,
  multiplier: 1,
  nextMultiplier: 1,
  payout: 0,
}

function parseMultiplier(raw: unknown) {
  return typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace('x', '')) || 0
}

function toRound(game: Record<string, any>): Round {
  return {
    status: (game.status as Status) || 'playing',
    stake: Number(game.stake) || 0,
    mines: Number(game.mines) || 3,
    revealed: Array.isArray(game.revealed) ? game.revealed.map(Number) : [],
    mineTiles: Array.isArray(game.mine_tiles) ? game.mine_tiles.map(Number) : [],
    hit: game.hit != null ? Number(game.hit) : null,
    multiplier: parseMultiplier(game.multiplier),
    nextMultiplier: parseMultiplier(game.next_multiplier),
    payout: Number(game.payout) || 0,
  }
}

const MinesScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [mines, setMines] = useState(3)
  const [round, setRound] = useState<Round>(EMPTY)
  const [history, setHistory] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingTile, setPendingTile] = useState<number | null>(null)
  const [fetchWallet, setFetchWallet] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const playing = round.status === 'playing'
  const ended = round.status === 'lost' || round.status === 'cashed_out' || round.status === 'cleared'
  const gap = 8
  const tileSize = Math.floor((Math.min(width, 520) - 24 - 20 - gap * 4) / 5)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      sub?.remove?.()
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY)
      .then((seen) => {
        if (!seen) setRulesOpen(true)
      })
      .catch(() => {})

    // Resume a round left open earlier.
    axiosClient
      .get('/virtual/mines/active')
      .then((res) => {
        const game = res.data?.game
        if (game) {
          const resumed = toRound(game)
          setRound(resumed)
          setMines(resumed.mines)
          setStake(String(resumed.stake))
          Toast.show({ type: 'info', text1: 'Your Mines round is still open' })
        }
      })
      .catch(() => {})
  }, [])

  const flashOverlay = () => {
    setShowOverlay(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => setShowOverlay(false), 2400)
  }

  const start = async () => {
    if (loading) return
    const parsed = schema.safeParse({ stake, mines })
    if (!parsed.success) {
      return Toast.show({ type: 'info', text1: parsed.error.issues[0].message })
    }

    if (!hasEnoughBalance(Number(stake))) return

    try {
      setLoading(true)
      setShowOverlay(false)
      sfx.flip()
      triggerHaptic('roll')
      const res = await axiosClient.post('/virtual/mines/start', { stake: Number(stake), mines })
      const game = res.data?.game
      if (!game) throw new Error(res.data?.message || 'The round did not start. Try again.')
      setRound(toRound(game))
      setFetchWallet(true)
    } catch (error: unknown) {
      sfx.error()
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  const reveal = async (tile: number) => {
    if (!playing || loading) return
    try {
      setLoading(true)
      setPendingTile(tile)
      triggerHaptic('light')
      const res = await axiosClient.post('/virtual/mines/reveal', { tile })
      const game = res.data?.game
      if (!game) throw new Error(res.data?.message || 'That tile did not open. Try again.')
      const next = toRound(game)
      setRound(next)

      if (next.status === 'lost') {
        sfx.lose()
        triggerHaptic('lose')
        setHistory((prev) => [false, ...prev].slice(0, 12))
        flashOverlay()
      } else if (next.status === 'cleared') {
        sfx.win()
        triggerHaptic('win')
        setHistory((prev) => [true, ...prev].slice(0, 12))
        flashOverlay()
      } else {
        sfx.next()
      }
    } catch (error: unknown) {
      sfx.error()
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    } finally {
      setPendingTile(null)
      setLoading(false)
    }
  }

  const cashOut = async () => {
    if (!playing || loading || round.revealed.length === 0) return
    try {
      setLoading(true)
      const res = await axiosClient.post('/virtual/mines/cashout')
      const game = res.data?.game
      if (!game) throw new Error(res.data?.message || 'Cash-out did not go through. Try again.')
      setRound(toRound(game))
      sfx.win()
      triggerHaptic('win')
      setHistory((prev) => [true, ...prev].slice(0, 12))
      flashOverlay()
    } catch (error: unknown) {
      sfx.error()
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  const newRound = () => {
    sfx.next()
    setShowOverlay(false)
    setRound({ ...EMPTY, mines })
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const tileState = (i: number): TileState => {
    const opened = round.revealed.includes(i)
    if (round.hit === i) return 'hit'
    if (opened) return 'gem'
    if (ended) return round.mineTiles.includes(i) ? 'mine-faded' : 'gem-faded'
    return 'hidden'
  }

  const safeCount = round.revealed.length - (round.hit != null ? 1 : 0)
  const shownMines = playing || ended ? round.mines : mines
  const firstPick = minesMultiplier(shownMines, 1)
  const cashValue = Math.floor(round.stake * round.multiplier * 100) / 100
  const gemsLeft = GRID - shownMines - Math.max(0, safeCount)

  const overlayTitle =
    round.status === 'lost' ? 'Boom' : round.status === 'cleared' ? 'Board cleared' : `Cashed out at ${round.multiplier.toFixed(2)}x`
  const overlayDetail =
    round.status === 'lost' ? `${safeCount} gem${safeCount === 1 ? '' : 's'} before the mine` : `+${displayCurrency(round.payout)}`

  return (
    <LinearGradient colors={['#121a33', '#080c1c']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, gap: 14, padding: 12 }}>
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#f5d27a" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <GemIcon size={28} />
            </View>
            <Text style={styles.title}>Mines</Text>
          </View>
          <TouchableOpacity onPress={() => setRulesOpen(true)} style={styles.helpBtn} accessibilityLabel="How to play">
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <GameBalancePill />
        </View>

        <GameStatsRow
          stake={stake}
          onStakeChange={setStake}
          payout={playing && safeCount > 0 ? displayCurrency(cashValue) : ended && round.payout ? displayCurrency(round.payout) : '—'}
          multiplier={playing || ended ? `${round.multiplier.toFixed(2)}x` : `${firstPick.toFixed(2)}x`}
          stakeEditable={!playing && !loading}
        />

        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>MINES</Text>
            <Text style={[styles.infoValue, { color: '#ff8a7a' }]}>{shownMines}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>GEMS LEFT</Text>
            <Text style={[styles.infoValue, { color: '#3fe08a' }]}>{gemsLeft}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>NEXT GEM</Text>
            <Text style={styles.infoValue}>
              {playing ? `${round.nextMultiplier.toFixed(2)}x` : `${firstPick.toFixed(2)}x`}
            </Text>
          </View>
        </View>

        <View style={styles.board}>
          {Array.from({ length: GRID }, (_, i) => (
            <MinesTile
              key={i}
              size={tileSize}
              state={tileState(i)}
              disabled={!playing || (loading && pendingTile !== i)}
              onPress={() => reveal(i)}
            />
          ))}
        </View>

        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={round.status !== 'lost'}
            title={overlayTitle}
            detail={overlayDetail}
            reduceMotion={reduceMotion}
          />
        </View>

        {!playing && !ended ? (
          <View style={styles.panel}>
            <Text style={styles.panelLabel}>MINES ON THE BOARD</Text>
            <View style={styles.mineRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={loading}
                onPress={() => {
                  sfx.next()
                  setMines((m) => Math.max(1, m - 1))
                }}
              >
                <Feather name="minus" size={20} color="#f5d27a" />
              </TouchableOpacity>
              <View style={styles.mineBox}>
                <Text style={styles.mineCount}>{mines}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                disabled={loading}
                onPress={() => {
                  sfx.next()
                  setMines((m) => Math.min(24, m + 1))
                }}
              >
                <Feather name="plus" size={20} color="#f5d27a" />
              </TouchableOpacity>
            </View>
            <View style={styles.chips}>
              {MINE_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => {
                    sfx.next()
                    setMines(chip)
                  }}
                  style={[styles.chip, mines === chip && styles.chipActive]}
                >
                  <Text style={[styles.chipText, mines === chip && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {playing ? (
          <TouchableOpacity
            style={[styles.cashBtn, (safeCount === 0 || loading) && styles.btnOff]}
            disabled={safeCount === 0 || loading}
            onPress={cashOut}
          >
            <Text style={styles.cashText}>{safeCount === 0 ? 'OPEN A TILE' : `CASH OUT ${displayCurrency(cashValue)}`}</Text>
            {safeCount > 0 ? <Text style={styles.cashSub}>{round.multiplier.toFixed(2)}x</Text> : null}
          </TouchableOpacity>
        ) : ended ? (
          <TouchableOpacity style={styles.playBtn} onPress={newRound}>
            <Text style={styles.playText}>NEW ROUND</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.playBtn, loading && styles.btnOff]} disabled={loading} onPress={start}>
            <Text style={styles.playText}>{loading ? 'STARTING…' : 'START'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Play a round to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Mines works"
        steps={MINES_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default MinesScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1b2a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#dce7f5',
    fontSize: 20,
    fontWeight: '700',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#f5d27a',
    fontSize: 18,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoPill: {
    flex: 1,
    backgroundColor: '#13213b',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.14)',
  },
  infoLabel: {
    color: '#9fb3c8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  board: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.16)',
    maxWidth: 520,
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#13213b',
    borderRadius: 18,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.18)',
  },
  panelLabel: {
    color: '#9fb3c8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1b2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mineBox: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0a1626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mineCount: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#1b2a4a',
  },
  chipActive: {
    backgroundColor: '#f5d27a',
  },
  chipText: {
    color: '#dce7f5',
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#121a33',
  },
  playBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#e3a843',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  playText: {
    color: '#121a33',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cashBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#3fe08a',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
  },
  cashText: {
    color: '#07140d',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  cashSub: {
    color: '#0b3a22',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  btnOff: {
    opacity: 0.5,
  },
})
