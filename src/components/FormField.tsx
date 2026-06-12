import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardTypeOptions, Text, TextInput, TouchableOpacity, View } from 'react-native';

type formProps = {
  title?: string; 
  value?: string;
  placeholder?: any; 
  handleChangeText?: (e: any) => void;
  labelStyle?: string;
  inputBg?: string;
  disabled?: boolean;
  otherStyles?: string;
  keyboardType?: KeyboardTypeOptions;
  [props:string]: any;
}

const FormField = ({ title, value, placeholder, inputBg, keyboardType, handleChangeText, disabled, labelStyle, otherStyles, ...props}: formProps) => {
    
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  
    return (
    <View className={`space-y-2 ${otherStyles}`}>
      {title ? <Text className={`text-base text-white font-mregular pb-2 ${labelStyle ? labelStyle : 'text-black'}`}>{title}</Text> : ''}
      <View className={`${inputBg ? inputBg : 'bg-gray'} border w-full h-[46px] px-4 rounded-lg ${isFocused ? 'border-red' : 'border-gray'} items-center flex-row gap-1`}>
        <TextInput className={`${inputBg ? inputBg : 'bg-inputBg'} flex-1 text-black font-mregular text-base h-full`} style={{ textAlignVertical: 'center' }} value={value} placeholder={placeholder} placeholderTextColor="#1B1F27" onChangeText={handleChangeText} secureTextEntry={(title === "Create Pin" || title === "Enter Pin") ? !showPassword : title === "Confirm Pin" ? !showConfirmPassword : title === "Current Pin" ? !showCurrentPassword : title === "New Pin" ? !showNewPassword : title === "Confirm New Pin" ? !showConfirmNewPassword : false} keyboardType={keyboardType ? keyboardType: 'default'} editable={disabled} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}/>
        {(title === 'Create Pin' || title === 'Enter Pin') && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={!showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#1B1F27" />
            </TouchableOpacity>
        )}
        {title === "Confirm Pin" && (
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={!showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#1B1F27" />
            </TouchableOpacity>
        )}
        {title === "Current Pin" && (
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons name={!showCurrentPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#1B1F27" />
            </TouchableOpacity>
        )}
        {title === "New Pin" && (
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={!showNewPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#1B1F27" />
            </TouchableOpacity>
        )}
        {title === "Confirm New Pin" && (
            <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                <Ionicons name={!showConfirmNewPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#1B1F27" />
            </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField
