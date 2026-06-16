import { View, Text, ScrollView, TouchableOpacity, SectionList, Modal, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Octicons } from '@expo/vector-icons'
import displayCurrency from '@/utils/displayCurrency';
import moment from 'moment';
import Loading from '@/components/Loading';
import { axiosClient } from '@/globalApi';
import NotificationCard from '@/components/NotificationCard';

type NotificationItem = {
  id: string;
  title: string;
  created_at: string;
  amount?: string;
  status?: string;
  is_read?: boolean;
  message: string;
};

type NotificationSection = {
  title: string;
  data: NotificationItem[];
};

const PAGE_SIZE = 20;

const Games = () => {
    
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [games, setGames] = useState<NotificationItem[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [readStatus, setReadStatus] = useState(true)
    const [notificationInfo, setNotificationInfo] = useState<NotificationItem | null>(null)
    const [page, setPage] = useState(1);

    useEffect(() => {
        getGames(1, true)
    }, [])

    const getGames = async (pageNum: number, isInitial = false) => {
        if (isInitial) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        try {
            const result = await axiosClient.get(`/notification/?type=games&limit=${PAGE_SIZE}&page=${pageNum}`)
            const newItems: NotificationItem[] = result.data.notifications || []
            
            setGames(prev => isInitial ? newItems : [...prev, ...newItems])
            setTotalItems(result.data.total_count || 0)
            setHasMore(result.data.hasMore ?? false)
        } catch (error: any) {
            console.log("error=", error.response?.data || error.message)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        getGames(nextPage);
    }, [loadingMore, hasMore, page]);

    const sections: NotificationSection[] = useMemo(() => {
        if (!Array.isArray(games) || games.length === 0) return [];

        const ongoing = games
            .filter((n: any) => n?.status === "pending")
            .map((n: any) => ({
                id: n?.id,
                title: n?.title?.trim() || "Untitled",
                message: n?.message?.trim() || "Untitled",
                amount: n?.amount,
                status: n?.status || "",
                is_read: n?.is_read,
                created_at: moment(n.created_at).format("MMM D YYYY @hh:mma")
            }));

        const recent = games
            .filter((n: any) => n?.status !== "pending")
            .map((n: any) => ({
                id: n?.id,
                title: n?.title?.trim() || "Untitled",
                message: n?.message?.trim() || "Untitled",
                amount: n?.amount,
                status: n?.status || "",
                is_read: n?.is_read,
                created_at: moment(n.created_at).format("MMM D YYYY @hh:mma")
            }));

        return [
            ...(ongoing.length > 0 ? [{ title: "Ongoing", data: ongoing }] : []),
            ...(recent.length > 0 ? [{ title: "Recent", data: recent }] : []),
        ];
    }, [games]);

    const markAsRead = async () => {
        try {
            setGames((prev) =>
                prev.map((notification: any) => ({ ...notification, is_read: true }))
            );
            setReadStatus(false)
            await axiosClient.patch(`/notification/read-all?type=games`)
        } catch (error: any) {
            console.log(error.response?.data || error.message)
        }
    }
    
    const displayModal = (item: NotificationItem) => {
        setNotificationInfo(item)
        setShowModal(true)

        setGames((prev) =>
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
                                    <Text className="text-2xl text-center mt-4 font-msbold text-white">No notifications yet</Text>
                                    <Text className="text-sm text-center mt-1 font-mlight text-white">You don't have any games notification for now</Text>
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

              <View className="rounded-2xl max-h-[60%] px-6 w-full bg-charcoal-light">
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className={`w-full py-6`}>
                    <Text className="font-mbold text-lg text-center mb-3 capitalize text-white">{notificationInfo?.status}</Text>
                    <View className='w-full mt-4'>
                        <Text className="font-msbold text-base capitalize text-white">{notificationInfo?.title}</Text>
                    </View>
                    <View className='w-full mt-4'>
                        <Text className="font-mmedium text-base capitalize text-white">{notificationInfo?.message}</Text>
                    </View>
                    <View className='w-full mt-4'>
                        <View className="flex-1 justify-between w-full flex-row items-start gap-2">
                            <View className='w-32'>
                                <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Payout</Text>
                            </View>
                            <View className='items-end justify-end gap-2 flex-1'>
                                <Text className="font-semibold text-base text-white">{displayCurrency(Number(notificationInfo?.amount))}</Text>
                            </View>
                        </View>
                    </View>
                    <View className='w-full mt-4'>
                        <View className="flex-1 justify-between w-full flex-row items-start gap-2">
                            <View className='w-32'>
                                <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Status</Text>
                            </View>
                            <View className='items-end justify-end gap-2 flex-1'>
                                <Text className={`font-msbold text-base capitalize ${notificationInfo?.status === "failed" ? "text-red-600" : notificationInfo?.status === "successful" ? "text-green-600" : "text-amber-600"}`}>{notificationInfo?.status}</Text>
                            </View>
                        </View>
                    </View>
                    <Text className='text-right font-mregular text-sm mt-4 text-white'>{notificationInfo?.created_at}</Text>
                  </View>
                </ScrollView>
              </View>
            </View>
        </Modal>
    </View>
  )
}

export default Games