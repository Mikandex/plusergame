import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

type buttonProps = {
  title: string;
  handlePress?: () => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
  disableButton?: boolean;
  src: ImageSourcePropType;
}

const GoogleButton = ({ title, handlePress, containerStyles, textStyles, isLoading, disableButton, src }: buttonProps) => {

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} className={`rounded-full min-h-[48px] justify-center items-center border bg-gray-tab ${containerStyles} ${isLoading || disableButton ? 'opacity-50' : ''}`} disabled={isLoading || disableButton}>
      {isLoading ? <FontAwesome5 name="circle-notch" size={20} color="white" className='animate-spin-fast'/> :
        <View className='flex-row items-center gap-3'>
          <Image source={src} className='size-6' resizeMode="contain" />
          <Text className={`font-msbold text-lg ${textStyles}`}>{title}</Text>
        </View>
        }
    </TouchableOpacity>
  )
}

export default GoogleButton