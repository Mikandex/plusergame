import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import { Octicons } from '@expo/vector-icons';

type formProps = {
  value?: string;
  placeholder?: any; 
  handleChangeText?: (e: any) => void;
  labelStyle?: string;
  otherStyles?: string;
  disabled?: boolean;
  [props:string]: any;
}

const SearchInput = ({ value, placeholder, handleChangeText, labelStyle, disabled, otherStyles, ...props}: formProps) => {
  
    const [isFocused, setIsFocused] = useState(false);

    return (
    <View className={`space-y-2 ${otherStyles}`}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className={`border ${isFocused ? 'border-red' : 'border-gray'} w-full h-[46px] px-2 bg-gray rounded-lg items-center gap-1 flex-row`}>
          <TextInput className="flex-1 font-mregular text-base bg-gray" value={value} placeholder={placeholder} placeholderTextColor="#0F1115" onChangeText={handleChangeText} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} editable={disabled}/>
          <TouchableOpacity>
            <Octicons name="search" size={19} color="#1B1F27" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SearchInput