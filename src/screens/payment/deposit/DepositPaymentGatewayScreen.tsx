import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { WebView } from 'react-native-webview'
import { Octicons } from '@expo/vector-icons'
import getWallet from '@/utils/WalletApi'
import { axiosClient } from '@/globalApi'

const { height, width } = Dimensions.get('window')
const CALLBACK_ORIGIN = 'https://buzzycash.viaspark.site/payment/callback'

function asQueryUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, 'https:')
}

function queryParam(url: string, key: string) {
  try {
    return decodeURIComponent(new URL(asQueryUrl(url)).searchParams.get(key) || '')
  } catch {
    const match = url.match(new RegExp(`[?&]${key}=([^&]+)`, 'i'))
    return match ? decodeURIComponent(match[1]) : ''
  }
}

function isCustomReturn(url: string) {
  const lower = url.toLowerCase()
  return (
    lower.startsWith('buzzycash://') ||
    lower.startsWith('plusergame://') ||
    lower.startsWith('exp+') ||
    lower.includes('://goto')
  )
}

const DepositPaymentGatewayScreen = () => {
  const params = useLocalSearchParams() as {
    paylink?: string | string[]
    reference?: string | string[]
    transaction_reference?: string | string[]
    amount?: string | string[]
  }
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)
  const paylink = first(params.paylink)
  const reference = first(params.reference) || ''
  const transactionReference = first(params.transaction_reference) || ''
  const merchantCallbackUrl =
    `${CALLBACK_ORIGIN}?orderReference=${encodeURIComponent(transactionReference)}` +
    (reference ? `&orderId=${encodeURIComponent(reference)}` : '')
  const [currentUri, setCurrentUri] = useState(paylink || '')
  const [visible, setVisible] = useState(false)
  const settled = useRef(false)

  const finish = async (url: string) => {
    if (settled.current) return
    settled.current = true
    const urlStatus = queryParam(url, 'status').toLowerCase()
    const urlReason = queryParam(url, 'reason').toLowerCase()
    const failedHint = urlStatus.includes('fail') || urlStatus.includes('cancel') || urlStatus.includes('error')

    await getWallet(true)

    let paymentStatus = ''
    let paidAt = ''
    let creditedAmount = first(params.amount) || ''
    try {
      const list = await axiosClient.get('/transactions/?limit=20&page=1')
      const txs = list.data?.transactions || []
      const match = txs.find((row: { id?: string; reference?: string; transaction_reference?: string }) =>
        row.reference === reference ||
        row.transaction_reference === transactionReference ||
        row.id === reference,
      )
      paymentStatus = String(match?.payment_status || '')
      paidAt = String(match?.paid_at || '')
      if (match?.amount != null) creditedAmount = String(match.amount)
    } catch {
      // Receipt still shows the return URL status if the list request fails.
    }

    const credited = paymentStatus.toLowerCase() === 'successful'
    const outcome = failedHint || !credited ? 'failed' : 'success'

    router.replace({
      pathname:
        outcome === 'success'
          ? '/(protected)/(routes)/SuccessfulDepositReceipt'
          : '/(protected)/(routes)/FailedDepositReceipt',
      params: {
        reference,
        transaction_reference: transactionReference,
        amount: creditedAmount,
        outcome,
        payment_status: paymentStatus || urlReason || urlStatus,
        paid_at: paidAt,
      },
    })
  }

  return (
    <SafeAreaView className="h-full flex-1 bg-white">
      <View className="flex-row justify-between gap-2 px-4 pb-4 py-2 relative">
        <TouchableOpacity onPress={() => router.back()}>
          <Octicons name="arrow-left" size={28} color="#0F1115" />
        </TouchableOpacity>
        <Text className="text-charcoal text-center text-lg font-msbold tracking-wide">
          Fund Wallet
        </Text>
        <View className="w-7" />
      </View>

      {currentUri ? (
        <WebView
          source={{ uri: currentUri }}
          originWhitelist={['*']}
          setSupportMultipleWindows={true}
          javaScriptEnabled
          onOpenWindow={(event) => {
            const targetUrl = event.nativeEvent.targetUrl
            if (targetUrl) setCurrentUri(targetUrl)
          }}
          onLoadStart={() => setVisible(true)}
          onLoadEnd={() => setVisible(false)}
          onShouldStartLoadWithRequest={(req) => {
            if (isCustomReturn(req.url)) {
              void finish(req.url)
              return false
            }
            return true
          }}
        />
      ) : null}

      <TouchableOpacity
        className="mx-4 mb-3 mt-2 rounded-lg bg-charcoal py-3"
        onPress={() => setCurrentUri(merchantCallbackUrl)}
      >
        <Text className="text-center text-white font-msbold">I have paid — confirm</Text>
      </TouchableOpacity>

      {visible ? (
        <ActivityIndicator
          size="large"
          color="#111625"
          style={{ position: 'absolute', top: height / 2, left: width / 2 }}
        />
      ) : null}
    </SafeAreaView>
  )
}

export default DepositPaymentGatewayScreen
