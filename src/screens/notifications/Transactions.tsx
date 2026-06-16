import { View, Text, ScrollView, TouchableOpacity, SectionList, TouchableWithoutFeedback, Modal } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Octicons } from '@expo/vector-icons'
import displayCurrency from '@/utils/displayCurrency';
import moment from 'moment';
import Loading from '@/components/Loading';
import { axiosClient } from '@/globalApi';
import NotificationCard from '@/components/NotificationCard';

type NotificationItem = {
  id: string;
  amount: number; 
  created_at: string;
  currency: string; 
  display_time: string;
  status: string;
  message: string;
  title: string;
  is_read?: boolean;
};

type NotificationSection = {
  title: string;
  data: NotificationItem[];
}; 

const PAGE_SIZE = 20;

const Transactions = () => {
    
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [transactions, setTransactions] = useState<NotificationItem[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [readStatus, setReadStatus] = useState(true)
    const [notificationInfo, setNotificationInfo] = useState<NotificationItem | null>(null)
    const [page, setPage] = useState(1);

    useEffect(() => {
        getByTransactions(1, true)
    }, [])

    const getByTransactions = async (pageNum: number, isInitial = false) => {
        if (isInitial) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        try {
            const result = await axiosClient.get(`/notification/?type=transactions&limit=${PAGE_SIZE}&page=${pageNum}`)
            const newItems: NotificationItem[] = result.data.notifications || []

            setTransactions(prev => isInitial ? newItems : [...prev, ...newItems])
            setTotalItems(result.data.total_count || 0)
            setHasMore(result.data.hasMore ?? false)
        } catch (error: any) {
            console.log(error.response?.data || error.message)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        getByTransactions(nextPage);
    }, [loadingMore, hasMore, page]);

    const sections: NotificationSection[] = useMemo(() => {
        if (!Array.isArray(transactions) || transactions.length === 0) return [];

        const grouped: Record<string, any[]> = {};

        transactions.forEach((n: any) => {
            const dateKey = moment(n.created_at).format("MMMM YYYY");

            if (!grouped[dateKey]) grouped[dateKey] = [];

            grouped[dateKey].push({
                id: n?.id,
                title: n?.title?.trim() || "Untitled",
                message: n?.message?.trim() || "Untitled",
                amount: n?.amount,
                status: n?.status || "",
                is_read: n?.is_read,
                created_at: moment(n.created_at).format("MMM D YYYY @hh:mma"),
            });
        });

        return Object.keys(grouped).map((key) => ({
            title: key,
            data: grouped[key],
        }));
    }, [transactions]);

    const markAsRead = async () => {
        try {
            setTransactions((prev) =>
                prev.map((notification: any) => ({ ...notification, is_read: true }))
            );
            setReadStatus(false)
            await axiosClient.patch(`/notification/read-all?type=transactions`)
        } catch (error: any) {
            console.log(error.response?.data || error.message)
        }
    }

    const displayModal = (item: NotificationItem) => {
        setNotificationInfo(item)
        setShowModal(true)

        setTransactions((prev) =>
          prev.map((notification: any) =>
            notification.id === item.id
              ? { ...notification, is_read: true }
              : notification
          )
        );

        axiosClient.patch(`/notification/${item?.id}/read`)
    }

    const renderNotification = ({ item, section }: any) => (
        <NotificationCard item={item} section={section} handlePress={() => displayModal(item)}/>
    );

    const renderSectionHeader = ({ section: { title } }: any) => (
        <Text className="font-msbold text-lg py-2 bg-charcoal text-white">{title}</Text>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View className="py-4 items-center">
                <Loading />
            </View>
        );
    };

  return (
    <View className='flex-1 mt-2 px-4'>
        <View className='flex-1'>
            {loading ? (
                <Loading/>
            ) : (
                <View className='flex-1'>
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id}
                        renderItem={renderNotification}
                        renderSectionHeader={renderSectionHeader}
                        stickySectionHeadersEnabled
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={() => (
                            <View className='flex-1'>
                                <View className="w-full items-center mx-auto justify-center my-6 mt-16 max-w-64 flex-1">
                                    <View className='flex items-center justify-center size-16 rounded-full bg-green-lighter'>
                                        <Octicons name="bell-fill" size={32} color={"#fff"} />
                                    </View>
                                    <Text className="text-2xl text-center mt-4 font-mbold text-white">No notifications yet</Text>
                                    <Text className="text-sm text-center mt-1 font-mlight text-white">You don't have any transactions notification for now</Text>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
                    />
                </View>
            )}
        </View>  

        {sections.length > 0 && !loading && (
            <View className="flex-row justify-between px-4 my-2">
                {readStatus ? (
                    <TouchableOpacity onPress={markAsRead}>
                        <Text className="text-sm font-msbold text-white">MARK ALL AS READ</Text>
                    </TouchableOpacity>
                ) : (
                    <Text className="text-sm font-msbold text-white">MARKED AS READ</Text>
                )}
            </View>
        )}

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
                            <View className='flex-row items-start justify-between gap-3'>
                                <View className='flex-row gap-2 items-center justify-between w-36'>
                                    <Text className='font-msbold text-lg text-white'>Amount</Text>
                                    <Text className='font-msbold text-xl text-white'>:</Text>
                                </View>
                                <Text className="text-base font-mmedium flex-1 text-white">{displayCurrency(Number(notificationInfo?.amount))}</Text>
                            </View>
                            <View className='flex-row items-start justify-between gap-3'>
                                <View className='flex-row gap-2 items-center justify-between w-36'>
                                    <Text className='font-msbold text-lg text-white'>Title</Text>
                                    <Text className='font-msbold text-xl text-white'>:</Text>
                                </View>
                                <Text className="text-base font-mmedium flex-1 text-white">{notificationInfo?.title}</Text>
                            </View>
                            <View className='flex-row items-start justify-between gap-3'>
                                <View className='flex-row gap-2 items-center justify-between w-36'>
                                    <Text className='font-msbold text-lg text-white'>Message</Text>
                                    <Text className='font-msbold text-xl text-white'>:</Text>
                                </View>
                                <Text className="text-base font-mmedium flex-1 text-white">{notificationInfo?.message}</Text>
                            </View>
                            <View className='flex-row items-start justify-between gap-3'>
                                <View className='flex-row gap-2 items-center justify-between w-36'>
                                    <Text className='font-msbold text-lg text-white'>Status</Text>
                                    <Text className='font-msbold text-xl text-white'>:</Text>
                                </View>
                                <Text className={`capitalize text-base font-mmedium flex-1 ${notificationInfo?.status === "successful" ? "text-green-600" : notificationInfo?.status === "failed" ? "text-red-600" : "text-amber-500"}`}>{notificationInfo?.status}</Text>
                            </View>
                            <View className='flex-row items-center justify-between gap-3'>
                                <View className='flex-row gap-2 items-center justify-between w-36'>
                                    <Text className='font-msbold text-lg text-white'>Date</Text>
                                    <Text className='font-msbold text-xl text-white'>:</Text>
                                </View>
                                <Text className="text-base font-mmedium flex-1 text-white">{notificationInfo?.created_at}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </View>
  )
}

export default Transactions