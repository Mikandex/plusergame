import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const _layout = () => {
  
  return (
    <>
      <Stack screenOptions={{
          headerShown: false
        }}>
        <Stack.Screen name='index'/>
        <Stack.Screen name='Register'/>
        <Stack.Screen name='LogIn'/>
      </Stack>

      <StatusBar style={"light"} />
    </>
  )
}

export default _layout