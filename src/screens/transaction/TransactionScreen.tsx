import Header from '@/components/Header'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Modal, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native'
import TransactionCard from '@/components/TransactionCard'
import displayCurrency from '@/utils/displayCurrency'
import { data } from '@/constants'
import SelectDropdown from 'react-native-select-dropdown'
import { StyleSheet } from 'react-native'
import SearchInput from '@/components/SearchInput'
import Entypo from '@expo/vector-icons/Entypo';
import { router } from 'expo-router'
import Loading from '@/components/Loading'
import { transactionsType } from '../../../types/types'
import { axiosClient } from '../../globalApi'

const PAGE_SIZE = 20;

const TransactionScreen = () => {

  const [transactions, setTransactions] = useState<transactionsType[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [transactionInfo, setTransactionInfo] = useState<transactionsType | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [hasMore, setHasMore] = useState(false) 
  const [refreshing, setRefreshing] = useState(false)
  const [remark, setRemark] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1);

  const handleModal = (item: transactionsType) => {
    setTransactionInfo(item)
    setShowModal(true)
  }

  useEffect(() => {
    setPage(1)
    setTransactions([])
    getTransactions(1, false)
  }, [remark, type])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      setTransactions([])
      getTransactions(1, false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (page === 1) return
    getTransactions(page, true)
  }, [page])

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loadingTransactions || !hasMore) return
    setPage(prev => prev + 1)
  }, [loadingMore, loadingTransactions, hasMore])

  const handleSearchChange = (text: string) => {
    setSearch(text)
  }

  const getTransactions = async (pageNum: number, isLoadMore: boolean) => {
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoadingTransactions(true)
    }

    try {
      let result
      if (search) {
        result = await axiosClient.get(`/transactions/search?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&page=${pageNum}`)
      } else {
        let query = `/transactions/?limit=${PAGE_SIZE}&page=${pageNum}`
        if (remark) query += `&payment_status=${remark}`
        if (type) query += `&payment_type=${type}`
        result = await axiosClient.get(query)
      }

      const newTransactions: transactionsType[] = result.data.transactions || []

      setTransactions(prev => isLoadMore ? [...prev, ...newTransactions] : newTransactions)
      setHasMore(result.data.has_more ?? false) 
      console.log("tdata=", result.data)
    } catch (error: any) {
      console.log(error.response?.data || error.message)
    } finally {
      setLoadingTransactions(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      let result
      if (search) {
        result = await axiosClient.get(`/transactions/search?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&page=1`)
      } else {
        let query = `/transactions/?limit=${PAGE_SIZE}&page=1`
        if (remark) query += `&payment_status=${remark}`
        if (type) query += `&payment_type=${type}`
        result = await axiosClient.get(query)
      }

      const newTransactions: transactionsType[] = result.data.transactions || []
      setTransactions(newTransactions) 
      setHasMore(result.data.has_more ?? false)
      setPage(1)
    } catch (error: any) {
      console.log(error.response?.data || error.message)
    } finally {
      setRefreshing(false)
    }
  }

  const renderTickets = ({ item, index }: { item: transactionsType, index: number }) => (
    <TransactionCard item={item} index={index} handlePress={() => handleModal(item)}/>
  )

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='Transactions' onpress={() => router.back()}/>
     
      <View className="mt-4 px-4 flex-1">
        <FlatList
          ListHeaderComponent={() => (
            <View className='bg-charcoal'>
              <View className='flex flex-row w-full'>
                <SearchInput
                  placeholder="Search Transactions..."
                  value={search}
                  handleChangeText={handleSearchChange}
                  otherStyles='w-full'
                />
              </View>
              <View className='my-3 flex-row items-center justify-between gap-1'>
                <SelectDropdown
                  data={data.transactionType}
                  defaultValue={data.transactionType.find(item => item.value === type) || null}
                  onSelect={(selectedItem) => {
                    setSearch("")
                    setType(selectedItem.value)
                  }}
                  renderButton={(selectedItem, isOpened) => (
                    <View style={styles.dropdownButtonStyle2} className='bg-gray'>
                      <Text style={styles.dropdownButtonTxtStyle} className='font-mregular'>
                        {(selectedItem && selectedItem.title) || 'Type'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-small-up' : 'chevron-small-down'} style={styles.dropdownButtonArrowStyle} size={30} color="#0F1115" />
                    </View>
                  )}
                  renderItem={(item, index, isSelected) => (
                    <View key={index} style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D4AF37' }) }} className='bg-charcoal-light'>
                      <Text style={styles.dropdownItemTxtStyle} className='text-white'>{item.title}</Text>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={{ borderRadius: 8 }}
                />

                <SelectDropdown
                  data={data.transactionRemark}
                  defaultValue={data.transactionRemark.find(item => item.value === remark) || null}
                  onSelect={(selectedItem) => {
                    setSearch("")
                    setRemark(selectedItem.value)
                  }}
                  renderButton={(selectedItem, isOpened) => (
                    <View style={styles.dropdownButtonStyle1} className='bg-gray'>
                      <Text style={styles.dropdownButtonTxtStyle} numberOfLines={1} className='font-mregular'>
                        {(selectedItem && selectedItem.title) || 'Remark'}
                      </Text>
                      <Entypo name={isOpened ? 'chevron-small-up' : 'chevron-small-down'} style={styles.dropdownButtonArrowStyle} size={30} color="#0F1115" />
                    </View>
                  )}
                  renderItem={(item, index, isSelected) => (
                    <View key={index} style={{ ...styles.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D4AF37' }) }} className='bg-charcoal-light'>
                      <Text style={styles.dropdownItemTxtStyle} className='text-white'>{item.title}</Text>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={{ borderRadius: 8 }}
                />
              </View>
            </View>
          )}
          data={loadingTransactions ? [] : transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTickets}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={!loadingTransactions ? (
            <View className="items-center justify-center py-44">
              <Text className="text-xl text-center font-msbold text-white">
                {search ? "No result found!" : "No Transactions yet!"}
              </Text>
              <Text className="text-sm text-center mt-1 font-mlight text-white">
                All your transaction history will show here.
              </Text>
            </View>
          ) : null}
          ListFooterComponent={
            loadingTransactions ? (
              <View className="items-center justify-center py-44">
                <Loading />
              </View>
            ) : loadingMore ? (
              <View className="items-center justify-center py-6">
                <Loading />
              </View>
            ) : null
          }
        />
      </View>

      <Modal
        transparent={true}
        visible={showModal}
        statusBarTranslucent={true}
        onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 justify-center items-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View className="absolute top-0 left-0 right-0 bottom-0" />
          </TouchableWithoutFeedback>

          <View className="rounded-2xl max-h-[60%] px-4 w-full bg-charcoal-light">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className='my-7 gap-5'>
                <View className='flex-row items-center justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>Amount</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className="text-base font-mmedium flex-1 text-white">{displayCurrency(Number(transactionInfo?.amount))}</Text>
                </View>
                <View className='flex-row items-center justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>P-Type</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className="text-base font-mmedium flex-1 capitalize text-white">{transactionInfo?.payment_type}</Text>
                </View>
                <View className='flex-row items-center justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>Status</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className={`text-base font-mmedium flex-1 capitalize ${transactionInfo?.payment_status === "successful" ? "text-green-600" : transactionInfo?.payment_status === "failed" ? "text-red-600" : "text-amber-600"}`}>
                    {transactionInfo?.payment_status}
                  </Text>
                </View>
                <View className='flex-row items-center justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>Category</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className="text-base font-mmedium flex-1 capitalize text-white">{transactionInfo?.category}</Text>
                </View>
                <View className='flex-row items-center justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>Type</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className={`text-base font-mmedium flex-1 capitalize ${transactionInfo?.transaction_type === "credit" ? "text-green-600" : transactionInfo?.transaction_type === "debit" ? "text-red-600" : "text-orange-600"}`}>
                    {transactionInfo?.transaction_type}
                  </Text>
                </View>
                <View className='flex-row items-start justify-between gap-3'>
                  <View className='flex-row gap-2 items-center justify-between w-36'>
                    <Text className='font-msbold text-lg text-white'>Txn No</Text>
                    <Text className='font-msbold text-xl text-white'>:</Text>
                  </View>
                  <Text className="text-base font-mmedium flex-1 text-white">{transactionInfo?.transaction_reference}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatusBar style={"light"}/>
    </View>
  )
}

export default TransactionScreen

const styles = StyleSheet.create({
  dropdownButtonStyle1: {
    width: "55%",
    height: 45,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonStyle2: {
    width: "40%",
    height: 45,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 16,
    color: '#0F1115'
  },
  dropdownButtonArrowStyle: {
    fontSize: 30,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: "Raleway-Medium",
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});