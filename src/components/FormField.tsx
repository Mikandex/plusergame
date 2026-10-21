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
  [props: string]: any;
};

function isSecretField(title?: string) {
  const label = (title ?? '').toLowerCase();
  return label.includes('password') || label.includes('pin');
}

const FormField = ({
  title,
  value,
  placeholder,
  inputBg,
  keyboardType,
  handleChangeText,
  disabled,
  labelStyle,
  otherStyles,
  ...props
}: formProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const secret = isSecretField(title);

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      {title ? (
        <Text className={`text-base text-white font-mregular pb-2 ${labelStyle ? labelStyle : 'text-black'}`}>
          {title}
        </Text>
      ) : null}
      <View
        className={`${inputBg ? inputBg : 'bg-gray'} border w-full h-[46px] px-4 rounded-lg ${isFocused ? 'border-red' : 'border-gray'} items-center flex-row gap-1`}
      >
        <TextInput
          className={`${inputBg ? inputBg : 'bg-inputBg'} flex-1 text-black font-mregular text-base h-full`}
          style={{ textAlignVertical: 'center' }}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#1B1F27"
          onChangeText={handleChangeText}
          secureTextEntry={secret && !visible}
          autoCapitalize={secret ? 'none' : undefined}
          autoCorrect={!secret}
          textContentType={secret ? 'password' : undefined}
          keyboardType={keyboardType ? keyboardType : 'default'}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secret ? (
          <TouchableOpacity onPress={() => setVisible((current) => !current)} accessibilityLabel="Toggle password visibility">
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={24} color="#1B1F27" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default FormField;
