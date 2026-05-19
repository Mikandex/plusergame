import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ReactElement } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type buttonProps = {
  title: string;
  handlePress?: () => void;
  containerStyles?: string;
  textStyles?: string;
  loadingColor?: string;
  loadingText?: string;
  icon?: ReactElement;
  isLoading?: boolean;
}

const WhiteButton = ({ title, handlePress, loadingColor, loadingText, icon, containerStyles, textStyles, isLoading }: buttonProps) => {
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} className={`flex-row gap-1 rounded-full min-h-[20px] justify-center border items-center px-3 py-2 ${containerStyles} ${isLoading ? 'opacity-80' : ''}`} disabled={isLoading}>
        {icon && icon}
        {isLoading ? 
          <View className='flex-row items-center gap-1'>
            <Text className={`font-mmedium text-sm ${textStyles}`}>{loadingText}</Text>
            <FontAwesome5 name="circle-notch" size={14} color={loadingColor} className='animate-spin'/>
          </View> :
          <Text className={`font-mmedium text-sm ${textStyles}`}>{title}</Text>
        }
    </TouchableOpacity>
  )
}

export default WhiteButton