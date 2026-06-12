import BalanceCardWithdrawal from '@/components/BalanceCardWithdrawal';
import ConfirmPin from '@/components/ConfirmPin';
import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import Picker from '@/components/Picker';
import NgnBankModal from '@/components/select-modals/NgnBankModal';
import { data } from '@/constants';
import { useAuthStore } from '@/store/AuthStore';
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

export default function WithdrawalScreen() {

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    means: '',
    amount: '',
    account_number: '',
    bank_name: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGettingName, setIsGettingName] = useState(false)
    const [accountName, setAccountName] = useState(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const bottomSheetConfirmPinModalRef = useRef<BottomSheetModal>(null);
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const snapPoints = useMemo(() => ["80%"], [])

  const bottom = useSafeAreaInsets().bottom;
  const { login } = useAuthStore()

  const handleContinue = () => {
    handlePresentModalConfirmPinPress()
    // router.push('/(tabs)/Home');
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
    router.replace("/(protected)/(routes)/SuccessfulWithdrawalReceipt")
  }

  return (
    <View className='flex-1 bg-charcoal'>
      <Header title="Withdraw" onpress={() => router.back()} />

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
          <BalanceCardWithdrawal/>

          {/* Form Card */}
          <View className="bg-charcoal-light rounded-2xl px-6 pb-6 mt-5" style={{ marginBottom: bottom + 16 }}>

            <Picker title='Select means of withdraw' value={form.means} placeholder="Select withdraw means" handleChangeText={(e: any) => setForm({ ...form, means: e.value })} data={data.withdrawMethod}/>

            {form.means && (
              <FormField title="Amount to withdraw" value={form.amount} placeholder="Enter amount" handleChangeText={(e: any) => setForm({ ...form, amount: e })} keyboardType='numeric' otherStyles='mt-4'/>
            )}

            {/* Airtime Deposit */}
            {(form.means === "data" || form.means === "airtime") && (
              <FormField title="Phone no." value={form.phone} placeholder="Enter phone no" handleChangeText={(e: any) => setForm({ ...form, phone: e })} keyboardType='numeric' otherStyles='mt-4'/>
            )}

            {/* Cash Deposit */}
            {form.means === "cash" && (
                <>
                  <FormField title="Account number" value={form.account_number} placeholder="Enter account number" handleChangeText={(e: any) => setForm({ ...form, account_number: e })} keyboardType='numeric' otherStyles='mt-4'/>
                  <NgnBankModal placeholder='Select Bank' selectedValue={form.bank_name} header="Select Bank" title='Select Bank' showModal={showModal} close={closeModal} handlePress={handlePress} handleShowModal={() => handleShowModal()} />
                </>
            )}

            {form.means && (
                <CustomButton title="Withdraw" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-8 mx-auto" textStyles='text-white'/>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmPin onConfirmPin={(pin: string) => processPayment(pin)} bottomSheetModalPinRef={bottomSheetConfirmPinModalRef} closePinModal={closeConfirmPinModal} isVisible={pinModalVisible}/>
      <StatusBar style="light" />
    </View>
  );
}