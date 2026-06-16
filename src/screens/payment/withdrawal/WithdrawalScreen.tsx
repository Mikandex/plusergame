import BalanceCardWithdrawal from '@/components/BalanceCardWithdrawal';
import ConfirmPin from '@/components/ConfirmPin';
import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import Picker from '@/components/Picker';
import NgnBankModal from '@/components/select-modals/NgnBankModal';
import { data } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useLoaderStore } from '@/store/loaderStore';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import z from 'zod';

const baseSchema = z.object({
  means: z.string().min(1, 'Select a withdrawal means'),
  amount: z.string()
    .min(1, 'Add an amount to withdraw')
    .refine(val => Number(val) >= 100, 'Amount should be at least 100 Naira'),
})

const airtimeOrDataSchema = baseSchema.extend({
  phone: z.string().min(1, 'Enter a phone number'),
})

const cashSchema = baseSchema.extend({
  account_number: z.string().min(10, 'Enter a valid account number'),
  bank_name: z.string().min(1, 'Select a bank'),
  bank_code: z.string().min(1, 'Select a bank'),
  account_name: z.string().min(1, 'Account name not found, check your details'),
})

const getSchema = (means: string) => {
  if (means === 'airtime' || means === 'data') return airtimeOrDataSchema
  if (means === 'cash') return cashSchema
  return baseSchema
}

export default function WithdrawalScreen() {

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    means: '',
    amount: '',
    account_number: '',
    bank_name: '',
    bank_code: '',
    phone: '',
    account_name: '',
  });
    const { isLoading, setLoading } = useLoaderStore()
  const [isGettingName, setIsGettingName] = useState(false)
  const [accountName, setAccountName] = useState<{ name: string; number: string; status: boolean } | null>(null)
  const bottomSheetConfirmPinModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], [])

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue = () => {
    const result = getSchema(form.means).safeParse(form)

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs.",
      });
    }

    handlePresentModalConfirmPinPress()
  };

  const handleShowModal = () => {
    setShowModal(!showModal)
  }

  const handlePress = (bank: { code: string; logo: string; name: string }) => {
    setForm({ ...form, bank_name: bank?.name, bank_code: bank?.code, account_number: '' })
    setShowModal(false)
    setAccountName(null)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  useEffect(() => {
    if (form.account_number.length === 10) {
      getAccountName()
    } else {
      setAccountName(null)
      setForm(prev => ({ ...prev, account_name: '' }))
    }
  }, [form.account_number]);

  const getAccountName = async () => {
    if (!form.bank_name) {
      return Toast.show({
        type: 'info',
        text1: "Select Bank Name",
        text2: "Please choose a bank first",
      });
    }

    setIsGettingName(true)
    try {
      const result = await axiosClient.post(`/withdrawal/account-details`, {
        account_number: form.account_number,
        bank_code: form.bank_code
      })

      const name = result.data?.accountName || ""
      const number = result.data?.accountNumber || ""

      setAccountName({ name, number, status: true })
      setForm(prev => ({ ...prev, account_name: name }))

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || "Could not fetch account name",
      });
      setAccountName({ name: "", number: "", status: false })
      setForm(prev => ({ ...prev, account_name: '' }))
    } finally {
      setIsGettingName(false)
    }
  }

  // const withdraw = async (pin: string) => {
  const withdraw = async () => {
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

    setLoading(true)
    try {
      const payload = form.means === 'cash'
        ? {
            account_name: accountName?.name,
            account_number: accountName?.number,
            amount: Number(form.amount),
            bank_code: form.bank_code,
            currency: "NGN"
          }
        : {
            means: form.means,
            phone: form.phone,
            amount: Number(form.amount),
            currency: "NGN"
          }

      const result = await axiosClient.post("/withdrawal/initiate", payload)
      const info = result.data
      console.log("withdrawal", result.data)

      setAccountName(null)
      setForm({
        means: '',
        amount: '',
        account_number: '',
        bank_name: '',
        bank_code: '',
        phone: '',
        account_name: '',
      })

      const data = {
        amount: info?.amount,
        category: info?.category,
        currency: info?.currency,
        customer_email: info?.customer_email,
        message: info?.message,
        payment_method: info?.payment_method,
        payment_type: info?.payment_type,
        reference: info?.reference,
        status: info?.status,
        transaction_id: info?.transaction_id,
        transaction_reference: info?.transaction_reference,
        transaction_type: info?.transaction_type,
        user_id: info?.user_id,
      }

      router.push({
        pathname: "/(protected)/(routes)/SuccessfulWithdrawalReceipt",
        params: { info: JSON.stringify(data) },
      });

    } catch (error: any) {
      console.log(error.response?.data)
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || error.response?.data?.error || "Please try again later",
      });
    } finally {
      setLoading(false)
    }
  }

  const handlePresentModalConfirmPinPress = useCallback(() => {
    bottomSheetConfirmPinModalRef.current?.present();
  }, []);

  const closeConfirmPinModal = useCallback(() => {
    bottomSheetConfirmPinModalRef.current?.close()
  }, []);

  const processPayment = (pin: string) => {
    closeConfirmPinModal()
    // withdraw(pin)
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
          <BalanceCardWithdrawal />

          <View className="bg-charcoal-light rounded-2xl px-6 pb-6 mt-5" style={{ marginBottom: bottom + 16 }}>

            <Picker
              title='Select means of withdraw'
              value={form.means}
              placeholder="Select withdraw means"
              handleChangeText={(e: any) => setForm({ ...form, means: e.value })}
              data={data.withdrawMethod}
            />

            {form.means && (
              <FormField
                title="Amount to withdraw"
                value={form.amount}
                placeholder="Enter amount"
                handleChangeText={(e: any) => setForm({ ...form, amount: e })}
                keyboardType='numeric'
                otherStyles='mt-4'
              />
            )}

            {(form.means === "data" || form.means === "airtime") && (
              <FormField
                title="Phone no."
                value={form.phone}
                placeholder="Enter phone no"
                handleChangeText={(e: any) => setForm({ ...form, phone: e })}
                keyboardType='numeric'
                otherStyles='mt-4'
              />
            )}

            {form.means === "cash" && (
              <>
                <NgnBankModal
                  placeholder='Select Bank'
                  selectedValue={form.bank_name}
                  header="Select Bank"
                  title='Select Bank'
                  showModal={showModal}
                  close={closeModal}
                  handlePress={handlePress}
                  handleShowModal={handleShowModal}
                />
                <FormField
                  title="Account number"
                  value={form.account_number}
                  placeholder="Enter account number"
                  handleChangeText={(e: any) => setForm({ ...form, account_number: e })}
                  keyboardType='numeric'
                  otherStyles='mt-4'
                />
                {isGettingName ? (
                    <View className={`w-full py-2 rounded-md items-center flex-row gap-2`}>
                        <ActivityIndicator size={"small"} color={"#16a34a"}/>
                        <Text className="text-base text-green-600 font-msbold flex-1">Verifying account details</Text>
                    </View>
                ) : (accountName?.name && accountName?.number) && accountName?.status === true ? (
                    <View className='gap-4'>
                        <View className={`w-full py-2 rounded-md items-center flex-row gap-2`}>
                            <MaterialIcons name="verified-user" size={22} color="#16a34a" />
                            <Text className="text-lg text-green-600 font-msbold uppercase flex-1">{accountName?.name}</Text>
                        </View>
                    </View>
                ) : (!accountName?.name || !accountName?.number) && accountName?.status === false ? (
                    <View className={`w-full py-2 rounded-md items-center flex-row gap-2`}>
                      <AntDesign name="close-circle" size={20} color="#dc2626" />
                      <Text className="text-base text-red-600 font-msbold flex-1">Account verification failed. Please check the details or try again later.</Text>
                    </View>
                ) : ''}
              </>
            )}

            {form.means && (
              <CustomButton
                title="Withdraw"
                // handlePress={handleContinue}
                handlePress={withdraw}
                containerStyles="w-[70%] rounded-lg mt-8 mx-auto"
                textStyles='text-white'
              />
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmPin
        onConfirmPin={(pin: string) => processPayment(pin)}
        bottomSheetModalPinRef={bottomSheetConfirmPinModalRef}
        closePinModal={closeConfirmPinModal}
        isVisible={false}
      />
      <StatusBar style="light" />
    </View>
  );
}