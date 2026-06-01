import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Text, TouchableOpacity, View } from 'react-native';

type buttonProps = {
  title: string;
  handlePress?: () => void;
  containerStyles?: string;
  bgColor?: string;
  textStyles?: string;
  isLoading?: boolean;
  disableButton?: boolean;
  icon?: React.ReactNode;   // ← add this
}

const CustomButton = ({ title, handlePress, containerStyles, bgColor, textStyles, isLoading, disableButton, icon }: buttonProps) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className={`${bgColor ? bgColor : "bg-red"} rounded-full min-h-[48px] justify-center items-center ${containerStyles} ${isLoading || disableButton ? 'opacity-50' : ''}`}
      disabled={isLoading || disableButton}
    >
      {isLoading
        ? <FontAwesome5 name="circle-notch" size={20} color="white" className="animate-spin-fast" />
        : (
          <View className="flex-row items-center gap-2">
            <Text className={`font-msbold text-base ${textStyles}`}>{title}</Text>
            {icon && icon}
          </View>
        )
      }
    </TouchableOpacity>
  );
};

export default CustomButton;