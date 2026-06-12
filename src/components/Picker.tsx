import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown';

type PickerItem = { label: string; value: string | number };

type formProps = {
  title: string; 
  value: string | number;
  placeholder?: any; 
  handleChangeText: (item: PickerItem) => void;
  labelStyle?: string;
  data: Array<object>;
  inputBg?: string;
  otherStyles?: string;
  [props:string]: any;
}

const Picker = ({ title, value, placeholder, data, inputBg, handleChangeText, labelStyle, otherStyles, ...props}: formProps) => {
  
    return (
    <View className={`space-y-2 w-full mt-4 ${otherStyles}`}>
        <Text className={`text-base text-white font-mregular pb-2`}>{title}</Text>
        <Dropdown
          style={styles.dropdownCustom}
          placeholderStyle={styles.placeholderCustom}
          selectedTextStyle={styles.selectedTextCustom}
          itemTextStyle={styles.itemTextCustom}
          data={data}
          activeColor="#D4AF37"
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={placeholder || "Select here"}
          value={value}
          onChange={handleChangeText}
          renderRightIcon={() => (
            <Ionicons name="chevron-down-circle-sharp" size={24} color="#0F1115" />
          )}
          containerStyle={styles.boxContainerCustom}
        />
    </View>
  )
}

export default Picker

const styles = StyleSheet.create({
  dropdownCustom: {
    height: 46,
    backgroundColor: "#9CA3AF",
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  placeholderCustom: {
    fontSize: 14,
    color: "#0F1115",
    flex: 1,
  },
  selectedTextCustom: {
    fontSize: 14,
    color: "#0F1115",
    flex: 1
  },
  boxContainerCustom: {
    backgroundColor: "#0F1115",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1B1F27"
  },
  itemTextCustom: {
    color: "#fff",
    fontSize: 14
  }
});