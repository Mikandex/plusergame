import { router } from 'expo-router'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import OrderCard from '@/components/OrderCard';
import { images } from '@/constants';

const orders = [
  {
    id: "ORD-001",
    date: "Jan. 3rd 2025 1:17 PM",
    deliveryDate: "Jan. 8th 2025",
    seller: "Nike Official Store",
    status: "Delivered",
    totalPrice: "35000",
    items: [
      {
        id: "1",
        title: "DJ Jimmy Jat House Show",
        location: "Eko Atlantic City, Lagos",
        date: "Feb. 10th 2025",
        time: "4:00 PM",
        host: "DJ Jimmy Jat",
        quantity: "1 ticket",
        price: "15000",
      },
      {
        id: "2",
        title: "Afrobeats Night Live",
        location: "Admiralty Way, Lekki Phase 1, Lagos",
        date: "Mar. 5th 2025",
        time: "7:30 PM",
        host: "DJ Spinall",
        quantity: "2 tickets",
        price: "20000",
      },
    ],
  },
  {
    id: "ORD-002",
    date: "Feb. 14th 2025 1:30 PM",
    deliveryDate: "Feb. 19th 2025",
    seller: "Elegushi Beach Events",
    status: "Pending",
    totalPrice: "10000",
    items: [
      {
        id: "3",
        title: "Sunset Vibes Party",
        location: "Tarkwa Bay Beach, Lagos",
        date: "Apr. 12th 2025",
        time: "5:00 PM",
        host: "DJ Neptune",
        quantity: "1 ticket",
        price: "10000",
      },
    ],
  },
  {
    id: "ORD-003",
    date: "Mar. 1st 2025 5:17 PM",
    deliveryDate: "Mar. 6th 2025",
    seller: "Lagos Fests Ltd",
    status: "Processing",
    totalPrice: "30000",
    items: [
      {
        id: "4",
        title: "Lagos Party Festival",
        location: "Ozumba Mbadiwe Road, Victoria Island, Lagos",
        date: "May. 20th 2025",
        time: "6:00 PM",
        host: "DJ Consequence",
        quantity: "3 tickets",
        price: "30000",
      },
    ],
  },
  {
    id: "ORD-004",
    date: "Mar. 20th 2025 3:30 PM",
    deliveryDate: "Mar. 25th 2025",
    seller: "VI Rooftop Events",
    status: "Shipped",
    totalPrice: "37000",
    items: [
      {
        id: "5",
        title: "Rooftop Chill & Grill",
        location: "Victoria Island Rooftop, Lagos",
        date: "Jun. 8th 2025",
        time: "8:00 PM",
        host: "DJ Obi",
        quantity: "1 ticket",
        price: "12000",
      },
      {
        id: "7",
        title: "Beach Rave Experience",
        location: "Elegushi Beach, Lagos",
        date: "Aug. 2nd 2025",
        time: "3:00 PM",
        host: "DJ Kaywise",
        quantity: "1 ticket",
        price: "8000",
      },
      {
        id: "8",
        title: "Old School Throwback Party",
        location: "Surulere Event Hall, Lagos",
        date: "Sep. 14th 2025",
        time: "6:30 PM",
        host: "DJ Jimmy Jat",
        quantity: "2 tickets",
        price: "18000",
      },
    ],
  },
  {
    id: "ORD-005",
    date: "Apr. 5th 2025 2:45 PM",
    deliveryDate: "Apr. 10th 2025",
    seller: "Ikoyi Nightlife Co.",
    status: "Out for Delivery",
    totalPrice: "25000",
    items: [
      {
        id: "6",
        title: "Midnight House Party",
        location: "Ikoyi Club Road, Ikoyi, Lagos",
        date: "Jul. 18th 2025",
        time: "10:00 PM",
        host: "DJ Xclusive",
        quantity: "2 tickets",
        price: "25000",
      },
    ],
  },
  {
    id: "ORD-006",
    date: "Apr. 22nd 2025 1:45 PM",
    deliveryDate: "Apr. 27th 2025",
    seller: "Luxury Events Lagos",
    status: "Cancelled",
    totalPrice: "35000",
    items: [
      {
        id: "9",
        title: "Luxury Lounge Night",
        location: "The Palms, Lekki, Lagos",
        date: "Oct. 25th 2025",
        time: "9:00 PM",
        host: "DJ Cuppy",
        quantity: "1 ticket",
        price: "35000",
      },
    ],
  },
  {
    id: "ORD-007",
    date: "May. 10th 2025 1:30 PM",
    deliveryDate: "May. 15th 2025",
    seller: "Eko Hotel Events",
    status: "Refunded",
    totalPrice: "50000",
    items: [
      {
        id: "10",
        title: "End of Year Mega Party",
        location: "Eko Hotel & Suites, Victoria Island, Lagos",
        date: "Dec. 31st 2025",
        time: "10:00 PM",
        host: "DJ Neptune",
        quantity: "4 tickets",
        price: "50000",
      },
    ],
  },
  {
    id: "ORD-008",
    date: "May. 25th 2025 1:30 PM",
    deliveryDate: "May. 30th 2025",
    seller: "Lagos Mega Events",
    status: "Failed",
    totalPrice: "85000",
    items: [
      {
        id: "9",
        title: "Luxury Lounge Night",
        location: "The Palms, Lekki, Lagos",
        date: "Oct. 25th 2025",
        time: "9:00 PM",
        host: "DJ Cuppy",
        quantity: "1 ticket",
        price: "35000",
      },
      {
        id: "10",
        title: "End of Year Mega Party",
        location: "Eko Hotel & Suites, Victoria Island, Lagos",
        date: "Dec. 31st 2025",
        time: "10:00 PM",
        host: "DJ Neptune",
        quantity: "4 tickets",
        price: "50000",
      },
    ],
  },
];

const Ongoing = () => {

  const renderEvent = ({item, index}: {item: any, index: number}) => {

    return (
      <OrderCard item={item} index={index} handlePress={() => router.push("/(user)/(protected)/(routes)/EventDetails")} />
    )
  }

  return (
    <View className='flex-1 px-4'>
      <FlatList
        nestedScrollEnabled={true}
        scrollEnabled={true}
        data={orders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderEvent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={() => (
          <View>
            <View className="w-full items-center mx-auto justify-center my-6 mt-8 max-w-64 flex-1">
              <Image source={images.shoppingBag} className='size-36' resizeMode='contain'/>
              <Text className="text-2xl text-center text-blue mt-4 font-mbold">No Orders Yet!</Text>
              <Text className="text-sm text-center text-gray-600 mt-1 font-mmedium">We are waiting for your first order, Your ongoing orders will appear here</Text>
              <TouchableOpacity 
                onPress={() => router.replace("/(tabs)/Home")}
                className="mt-6 px-6 py-2 bg-red rounded-full border border-red"
              >
                <Text className="text-white text-sm font-mmedium">Order Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}

export default Ongoing