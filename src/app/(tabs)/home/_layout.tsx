import { Stack } from 'expo-router'

const _layout = () => {

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen name='index'/>
      <Stack.Screen name='Deposit'/>
      <Stack.Screen name='Withdraw'/>
    </Stack>
  )
}

export default _layout