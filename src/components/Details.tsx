import { View, Text, Pressable } from 'react-native'

type rowProp = {
    title: string;
    value: string; 
    status?: string;
    type?: string
}

export default function Details({title, value, status, type}: rowProp) {
  return (
    <View className="justify-between w-full flex-row gap-10 items-start border-b border-gray-200 py-2">
      <View className="items-center flex-row gap-1">
        <Text className="font-mmedium text-sm">{title}</Text>
      </View>

      <Text className={`font-mmedium text-base text-right flex-1 capitalize ${status === "successful" || type === "credit" ? "text-green-600" : status === "failed" || type === "debit" ? "text-red-600" : status === "pending" || status === "reversed" ? "text-yellow-600" : "text-black"}`} numberOfLines={3}>{value}</Text>
    </View>
  )
}