import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React, { useMemo, useState } from 'react'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Feather } from '@expo/vector-icons'
import Header from '@/components/Header'
import { GAME_DETAILS, SUPPORT_LINKS } from '@/constants/data'
import displayCurrency from '@/utils/displayCurrency'

type Faq = { q: string; a: string }

// Answers only state what the app and the API actually do. Payment timings, fees and
// limits are left out until the business confirms them.
function buildFaqs(): Faq[] {
  const games = Object.values(GAME_DETAILS)
  const minStake = Math.min(...games.map((g) => g.minStake))
  const topMax = Math.max(...games.map((g) => g.maxStake))
  const lower = games.filter((g) => g.maxStake < topMax)
  const stakeAnswer =
    `Every round starts from ${displayCurrency(minStake)}. Most games allow up to ${displayCurrency(topMax)} per round` +
    (lower.length
      ? `; ${lower.map((g) => `${g.title} up to ${displayCurrency(g.maxStake)}`).join(', ')}.`
      : '.')

  return [
    {
      q: 'How do I play a game?',
      a: 'Pick a game on the Home screen, read its details, then tap Play Now. Set your stake and play. Every game has a ? button at the top with its rules.',
    },
    { q: 'How much can I stake?', a: stakeAnswer },
    {
      q: 'Why won’t my game start?',
      a: 'Your wallet balance has to cover the stake. If it does not, the game shows "User does not have enough balance". Top up with Deposit on the Home screen, or lower your stake.',
    },
    {
      q: 'Where do my winnings go?',
      a: 'Winnings are paid into your wallet. Your balance is shown at the top of every game and on the Home screen.',
    },
    {
      q: 'Can I log in with my email?',
      a: 'Yes. You can log in with the phone number or the email address on your account.',
    },
    {
      q: 'I forgot my password. What do I do?',
      a: 'On the Log In screen, tap Forgot Password and enter your phone number or email. We send you a code; enter it and choose a new password.',
    },
    {
      q: 'Why does it say my account is not verified?',
      a: 'New accounts must be verified once. When you log in, a code is sent to your phone and email. Enter that code to finish.',
    },
    {
      q: 'How does Crash work?',
      a: 'Choose a cash-out point, for example 2.00x, then launch. If the rocket climbs past your point, you win your stake times that point. If it crashes first, the stake is lost.',
    },
    {
      q: 'What happens if I leave a Mines round?',
      a: 'Your round stays open for 24 hours. Come back to the Mines game to keep opening tiles or cash out. A round left longer than 24 hours ends and its stake is lost.',
    },
    ...(SUPPORT_LINKS.supportPhone || SUPPORT_LINKS.supportEmail
      ? [
          {
            q: 'How do I reach support?',
            a: 'Go to Profile, then Help and Support. Our contact details are listed under Contact Us.',
          },
        ]
      : []),
  ]
}

const FaqScreen = () => {
  const faqs = useMemo(buildFaqs, [])
  const [open, setOpen] = useState<number | null>(0)

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='FAQ' onpress={() => router.back()} />
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className='mt-4 gap-3'>
          {faqs.map((item, index) => {
            const expanded = open === index
            return (
              <TouchableOpacity
                key={item.q}
                activeOpacity={0.85}
                onPress={() => setOpen(expanded ? null : index)}
                className='rounded-xl bg-charcoal-light px-4 py-4'
                accessibilityRole='button'
                accessibilityState={{ expanded }}
              >
                <View className='flex-row items-center justify-between gap-3'>
                  <Text className='flex-1 text-base font-msbold text-white'>{item.q}</Text>
                  <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color='#D4AF37' />
                </View>
                {expanded ? <Text className='mt-3 text-[15px] leading-6 font-mregular text-gray'>{item.a}</Text> : null}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
      <StatusBar style='light' />
    </View>
  )
}

export default FaqScreen
