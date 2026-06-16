import ConfirmPin from '@/components/ConfirmPin';
import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import Picker from '@/components/Picker';
import { data } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useAuthStore } from '@/store/AuthStore';
import { useLoaderStore } from '@/store/loaderStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { z } from 'zod'

const baseSchema = z.object({
  means: z.string().min(1, 'Select a deposit means'),
  amount: z.string()
    .min(1, 'Add an amount to deposit')
    .refine(val => Number(val) >= 100, 'Amount should be at least 100 Naira'),
})

const airtimeSchema = baseSchema.extend({
  phone: z.string().min(1, 'Enter a phone number'),
})

const getSchema = (means: string) => {
  if (means === 'airtime') return airtimeSchema
  return baseSchema
}

export default function DepositScreen() {

  const { isLoading, setLoading } = useLoaderStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    means: '',
    amount: '',
    phone: ''
  });
    const [accountName, setAccountName] = useState(null)
    const bottomSheetConfirmPinModalRef = useRef<BottomSheetModal>(null);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const snapPoints = useMemo(() => ["80%"], [])

  const bottom = useSafeAreaInsets().bottom;
  const { login } = useAuthStore()

  const handleContinue = async () => {
    if (isLoading) return

    const result = getSchema(form.means).safeParse(form)

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs.",
      });
    }

    if(form.means === "cash"){

      try {
        setLoading(true)
    
        const result = await axiosClient.post("/wallet/fund", { amount: Number(form.amount), payment_method: "nomba" })
        console.log(result.data)
    
        setForm({
          means: '',
          amount: '',
          phone: ''
        })
    
        router.push({
            pathname: "/(protected)/(routes)/DepositPaymentGateway",
            params: { paylink: result.data.checkout_link }
        })
    
      } catch (error: any) {
          Toast.show({
              type: 'error',
              text1: error.response.data.message || "Please try again later"
          });
    
      } finally {
        setLoading(false)
      } 
    }

    // handlePresentModalConfirmPinPress()
  };

  const handleShowModal = () => {
      setShowModal(!showModal)
    }

    const handlePress = (bank: {code: string; logo: string; name: string}) => {
      // setForm({ ...form, recipientBankName: bank?.name, recipientBankCode: bank?.code, recipientAccountNumber: "" })
      setShowModal(!showModal)
      setAccountName(null)   
    }

    const closeModal = () => {
        setShowModal(false) 
    }

    // confirmPin callbacks
  const handlePresentModalConfirmPinPress = useCallback(() => {
    bottomSheetConfirmPinModalRef.current?.present();
  }, []);

  const closeConfirmPinModal = useCallback(() => {
    bottomSheetConfirmPinModalRef.current?.close()
  }, []);

  const processPayment = (pin: any) => {
    closeConfirmPinModal()
    router.replace("/(protected)/(routes)/FailedDepositReceipt")
  }

  return (
    <View className='flex-1 bg-charcoal'>
          <Header title="Deposit" onpress={() => router.back()} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
              keyboardShouldPersistTaps="handled"
            >

              {/* Form Card */}
              <View className="bg-charcoal-light rounded-2xl px-6 pb-6" style={{ marginBottom: bottom + 16 }}>

                <Picker title='Select means of deposit' value={form.means} placeholder="Select deposit means" handleChangeText={(e: any) => setForm({ ...form, means: e.value })} data={data.depositMethod}/>

                {form.means && (
                    <FormField title="Amount to deposit" value={form.amount} placeholder="Enter amount" handleChangeText={(e: any) => setForm({ ...form, amount: e })} keyboardType='numeric' otherStyles='mt-4'/>
                )}

                {/* Airtime Deposit */}
                {form.means === "airtime" && (
                    <FormField title="Phone no." value={form.phone} placeholder="Enter phone no" handleChangeText={(e: any) => setForm({ ...form, phone: e })} keyboardType='numeric' otherStyles='mt-4'/>
                )}

                {form.means && (
                    <CustomButton title="Deposit" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-8 mx-auto" textStyles='text-white'/>
                )}

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        <ConfirmPin onConfirmPin={(pin: string) => processPayment(pin)} bottomSheetModalPinRef={bottomSheetConfirmPinModalRef} closePinModal={closeConfirmPinModal} isVisible={pinModalVisible}/>
        <StatusBar style="light" />
    </View>
  );
}