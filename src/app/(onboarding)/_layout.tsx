import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function OnboardingLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  )
}
