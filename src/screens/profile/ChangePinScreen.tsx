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
import z from 'zod'
import Toast from 'react-native-toast-message'
import { axiosClient } from '@/globalApi'
import { useLoaderStore } from '@/store/loaderStore'

const pinSchema = z
.object({
  currentPin: z
    .string()
    .min(1, "Current pin is required"),

  newPin: z
    .string()
    .length(4, "New PIN must be exactly 4 digits")
    .regex(/^\d+$/, "New PIN must contain only digits"),

  confirmNewPin: z
    .string()
    .min(1, "Please confirm your new PIN"),
})
.refine((data) => data.newPin === data.confirmNewPin, {
  message: "New PINs do not match",
  path: ["confirmNewPin"],
})

const ChangePinScreen = () => {

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [resetKey, setResetKey] = useState(0);
  const bottom = useSafeAreaInsets().bottom
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isLoading, setLoading } = useLoaderStore()

  console.log("currentpin", currentPin)

  const submit = async () => {
    if (isLoading) return

    const data = {
      currentPin,
      newPin,
      confirmNewPin
    }
    const result = pinSchema.safeParse(data)
            
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs.",
      });
    }

    try {

      setLoading(true)
  
      const result = await axiosClient.patch("/auth/change-password", {
        current_password: currentPin,
        new_password: newPin,
        confirm_new_password: confirmNewPin
      })

      Toast.show({
        type: 'success',
        text1: result.data.message,
        text2: "Password Updated",
      });

      setCurrentPin("")
      setNewPin("")
      setConfirmNewPin("")

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || "Please try again later"
      });

    } finally {
      setLoading(false)
    } 
    
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