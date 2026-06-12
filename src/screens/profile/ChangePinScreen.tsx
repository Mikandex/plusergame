import { View, Text, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import Header from '@/components/Header'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { OtpInput } from 'react-native-otp-entry'

const ChangePinScreen = () => {

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [resetKey, setResetKey] = useState(0);
  const bottom = useSafeAreaInsets().bottom

  console.log("currentpin", currentPin)

  const submit = async () => {

    
  }
  

  return (
    <View className="bg-charcoal h-full">
      <Header title="Change PIN" onpress={() => router.back()}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="w-full justify-center my-6 mt-6 px-4">
          <View style={{marginTop:10}}>
            <Text className="text-base text-white font-amedium">Current PIN</Text>
            <OtpInput
              key={`current-${resetKey}`}
              numberOfDigits={4}
              onTextChange={(code: string) => setCurrentPin(code)}
              theme={{
                containerStyle: styles.container,
                pinCodeContainerStyle: styles.pinCodeContainer,
                pinCodeTextStyle: styles.pinCodeText,
                focusStickStyle: styles.focusStick,
                focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                placeholderTextStyle: styles.placeholderText,
                filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
              }}
            />
          </View>
          <View style={{marginTop:10}}>
            <Text className="text-base text-white font-amedium">New PIN</Text>
            <OtpInput
              key={`new-${resetKey}`}
              numberOfDigits={4}
              onTextChange={(code: string) => setNewPin(code)}
              theme={{
                containerStyle: styles.container,
                pinCodeContainerStyle: styles.pinCodeContainer,
                pinCodeTextStyle: styles.pinCodeText,
                focusStickStyle: styles.focusStick,
                focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                placeholderTextStyle: styles.placeholderText,
                filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
              }}
            />
          </View>
          <View style={{marginTop:10}}>
            <Text className="text-base text-white font-amedium">Confirm New PIN</Text>
            <OtpInput
              key={`confirm-${resetKey}`}
              numberOfDigits={4}
              onTextChange={(code: string) => setConfirmNewPin(code)}
              theme={{
                containerStyle: styles.container,
                pinCodeContainerStyle: styles.pinCodeContainer,
                pinCodeTextStyle: styles.pinCodeText,
                focusStickStyle: styles.focusStick,
                focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                placeholderTextStyle: styles.placeholderText,
                filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
              }}
            />
          </View>
        </View>
    </ScrollView>
    <View className='w-full justify-center mt-4 px-4' style={{ marginBottom: bottom + 16 }}>
      <CustomButton title="Save Changes" handlePress={submit} containerStyles="w-full" textStyles='text-white'/>
    </View>

    <StatusBar style='light'/>
  </View>
  )
}


export default ChangePinScreen


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
    marginTop: 8
  },
  pinCodeContainer: {
    backgroundColor: "transparent",
    borderColor: "#D4AF37",
    borderWidth: 1,
    borderRadius: 6,
    width: 45,
    height: 45,
    color: "#000",
    fontSize: 16,
    textAlign: "center"
  },
  pinCodeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  focusStick: {
    backgroundColor: '#FF9249',
  },
  activePinCodeContainer: {
    borderColor: '#9A2121',
    borderWidth: 1,
  },
  placeholderText: {
    color: '#fff',
  },
  filledPinCodeContainer: {
    backgroundColor: 'transparent',
    borderColor: '#FFAE4D',
  },
  disabledPinCodeContainer: {
    backgroundColor: '#e0e0e0',
  },
});