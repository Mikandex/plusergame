import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

type formProps = {
  title: string; 
  value: string;
  placeholder?: any; 
  handleChangeText?: (e: any) => void;
  labelStyle?: string,
  otherStyles?: string;
  [props:string]: any;
}

const TextArea = ({ title, value, placeholder, handleChangeText, labelStyle, otherStyles, ...props}: formProps) => {
  
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View className={`space-y-2 w-full ${otherStyles}`}>
      <Text className={`text-base font-mregular pb-2 ${labelStyle ? labelStyle : 'text-black'}`}>{title}</Text>
      <View className={`border ${isFocused ? 'border-purple' : 'border-black'} w-full h-36 py-2 px-4 bg-white rounded-3xl flex-row`}>
        <TextInput className="flex-1 bg-white text-black font-mregular text-base" textAlignVertical='top' multiline={true} value={value} placeholder={placeholder} placeholderTextColor="#ccc" onChangeText={handleChangeText} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}/>
      </View>
    </View>
  )
}

export default TextArea