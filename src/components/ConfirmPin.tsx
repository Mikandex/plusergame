import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import CustomButtomSheet from './CustomButtomSheet';

const ConfirmPin = ({bottomSheetModalPinRef, closePinModal, onConfirmPin, isVisible}: {bottomSheetModalPinRef: any; closePinModal: () => void; onConfirmPin: (pin: string) => void; isVisible: boolean}) => {

  const { width, height } = Dimensions.get("window");
  const dialPad = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"];
  const dialPadSize = width * 0.2;
  const pinLength = 4;
  const [pinCode, setPinCode] = useState<any>([]);
  const [displayPinCode, setDisplayPinCode] = useState<any>([]);
  const [logoutToken, setLogoutToken] = useState<any>("")
  const snapPoints = useMemo(() => ["70%", "90%"], [])

  const resetState = () => {
    setPinCode([]);
    setDisplayPinCode([]);
  };

  useEffect(() => {
    resetState();
  }, [isVisible]);

  useEffect(() => {
    if(pinCode.length === 4){
      onConfirmPin(pinCode)
    }
  }, [pinCode])
    
  const handleSetPin = async () => {
    // if(pinCode.length === 4){
    //     closePinModal()
    //     router.push("/(vendor)/(protected)/(routes)/WithdrawalReceipt")
    // }else if (pinCode.length === 0){
    //     toast.show("Pin fields are empty",{
    //         type: "error",
    //     });
    // }else if (pinCode.length < 4){
    //     toast.show("Pin must be 4 numbers",{
    //         type: "error",
    //     });
    // }else if (pinCode.length > 4){
    //     toast.show("Pin is greater than 4 numbers",{
    //         type: "error",
    //     });
    // }
  }

  const SetPinDailPad = ({ onPress }: {onPress: (item: string | number) => void}) => {
      return (
        <View>
          <FlatList
            data={dialPad}
            numColumns={3}
            style={{ flexGrow: 1 }}
            keyExtractor={(_, index) => index.toString()}
            columnWrapperStyle={{ gap: 30 }}
            contentContainerStyle={{ gap: 22 , marginBottom: 30}}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => onPress(item)}
                  disabled={item === ""}
                  className={`${item !== "" && 'bg-gray text-charcoal-light rounded-lg p-1'}`}
                >
                  <View
                    style={{
                      width: dialPadSize,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item === "del" ? (
                      <MaterialCommunityIcons
                        name="backspace-outline"
                        size={dialPadSize / 3}
                        color="#003366"
                      />
                    ) : item === "" ? (
                      <View/>
                    ) : (
                      <Text
                        style={{
                          fontSize: dialPadSize / 3,
                          fontWeight: "500",
                          color: "#003366",
                        }}
                      >
                        {item}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      );
    };

  return (
    <CustomButtomSheet ref={bottomSheetModalPinRef} snapPoints={snapPoints} enablePenDown={false} onDismiss={closePinModal}>
        <View>

            <View className='flex-row w-full items-center justify-between gap-1'>
                <View className='w-8'/>
                <TouchableOpacity onPress={closePinModal}>
                    <SimpleLineIcons name="close" size={28} color="#fff" />
                </TouchableOpacity>
           </View>

            <Text className="text-2xl text-white mt-4 font-msbold text-center">Enter Login PIN</Text>
            <Text className="text-sm text-gray font-mmedium mb-1 text-center mt-1">Enter your 4-digit PIN</Text>

        <View className='items-center justify-between gap-2'>
            <View className='flex-row gap-2 my-4 items-center justify-center'>
            {[...Array(pinLength).keys()].map((index) => {
                // const isSelected = !!pinCode[index];
                const isSelected = displayPinCode[index] ?? "";

                return (
                <View key={index} className='size-10 border border-yellow rounded-lg items-center justify-center'>
                    <Text className='font-mmedium text-2xl text-white'>{isSelected}</Text>
                </View>
                );
            })}
            </View>
    
            <View style={{ justifyContent: 'center'}}>
              <SetPinDailPad
                  onPress={(item) => {
                  if (item === "del") {

                    if(pinCode.length > 0){
                      setPinCode((prevCode: any) => prevCode.slice(0, prevCode.length - 1));
                      setDisplayPinCode((prevCode: any) => prevCode.slice(0, prevCode.length - 1));
                    }

                  } else if (typeof item === "number") {

                    if(pinCode.length < 4){
                      setPinCode((prevCode: any) => [...prevCode, item]);
                      setDisplayPinCode((prevCode: any) => [...prevCode, item]);

                      // After 500ms, replace the last entered number with "*"
                      setTimeout(() => {
                        setDisplayPinCode((prevCode: any) => {
                          const updated = [...prevCode];
                          if (updated.length > 0) {
                            updated[updated.length - 1] = "*";
                          }
                          return updated;
                        });
                      }, 50);
                    }
                    
                  }
                  }}
              />
            </View>
        </View>
        </View>
    </CustomButtomSheet>
  )
}

export default ConfirmPin