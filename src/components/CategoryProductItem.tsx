import displayCurrency from '@/utils/displayCurrency';
import { formatEnums } from '@/utils/formatEnums';
import { FontAwesome } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import Stars from 'react-native-stars';
import { Image } from 'expo-image';

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  badge: string | null;
  image: { uri: string };
  productStatus: "in_stock" | "out_of_stock" | "limited_stock";
  sectionIndex: number;
};

interface MenuItemProps {
  item: Item;
  isLast?: boolean;
}

export const CategoryProductItem = ({ item, isLast }: MenuItemProps) => {

  const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';

  return (
    <TouchableOpacity
      className={`bg-white p-4 ${!isLast ? 'border-b border-[#f0f0f0]' : ''}`}
      activeOpacity={0.7}>
      <View className="flex-row justify-between items-start">
        <View className="w-[130px] h-[150px] rounded-xl overflow-hidden bg-gray-50">
          <Image source={item?.image} placeholder={{ blurhash }} cachePolicy="disk" contentFit="cover" style={{width: "100%", height: "100%" }}/>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-msbold text-black mb-1" numberOfLines={2}>{item?.name}</Text>
          <Text className="mb-1 leading-5" numberOfLines={2}>
            {item?.description}
          </Text>
          <Text className={`text-sm font-msbold mb-1 ${item?.productStatus === 'in_stock' ? 'text-green-500' : 'text-red-500'}`}>
            {formatEnums(item?.productStatus)}
          </Text>
          <Text className="font-msbold mb-1">{displayCurrency(Number(item?.price))}</Text>
          {item?.badge && (
            <Text className="text-[10px] bg-black mb-2 px-2 py-[3px] rounded font-bold text-white self-start">
              {item?.badge}
            </Text>
          )}
          <View className='items-center justify-start flex-row gap-1 flex-wrap'>
            <Text numberOfLines={1} className="font-pregular text-xs">(4.8)</Text>
            <Stars
              display={4.5}
              spacing={2}
              count={5}
              starSize={14}
              fullStar= {<FontAwesome name="star" size={14} color="#FFA41C" />}
              emptyStar= {<FontAwesome name="star-o" size={14} color="#D5DBDB" />}
              halfStar={<FontAwesome name="star-half-o" size={14} color="#FFA41C" />}
            />
            <Text numberOfLines={1} className="font-pregular text-xs">(300)</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};