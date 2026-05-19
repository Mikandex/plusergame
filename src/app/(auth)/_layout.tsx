import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const _layout = () => {
  
  return (
    <>
      <Stack screenOptions={{
          headerShown: false
        }}>
        <Stack.Screen name='index'/>
      </Stack>

      <StatusBar style={"dark"} />
    </>
  )
}

export default _layout