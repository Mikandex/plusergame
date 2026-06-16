import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import Picker from '@/components/Picker';
import { data, images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useProfileStore } from '@/store/ProfileStore';
import { Entypo, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import moment from 'moment';
import React, {  useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker'
import { useLoaderStore } from '@/store/loaderStore';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { File as ExpoFile } from 'expo-file-system'
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {

  const { userProfile, setProfile } = useProfileStore()
  const [date, setDate] = useState(userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth) : new Date());
  const [open, setOpen] = useState(false)
  const [hasPickedDate, setHasPickedDate] = useState(!!userProfile?.dateOfBirth);
  const [form, setForm] = useState({
    fullName: userProfile?.fullName || "",
    email: userProfile?.email || "",
    gender: userProfile?.gender || '',
  });

  const { isLoading, setLoading } = useLoaderStore()

  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const birthFormatted = moment(date).format("YYYY-MM-DD");
  
  const formerData = {
    fullName: userProfile.fullName,
    dateOfBirth: userProfile.dateOfBirth,
    gender: userProfile.gender
  }

  const newData = {
    fullName: form.fullName,
    dateOfBirth: birthFormatted,
    gender: form.gender
  }

  const hasChanges = () => {

    const current = JSON.stringify(newData);
    const original = JSON.stringify(formerData);

    return current !== original;
  };

  const handleContinue = async () => {

    if (isLoading) return

    if (!form.fullName) {
      return Toast.show({
        type: 'info',
        text1: "Full name is required",
        text2: "Please check your inputs.",
      });
    }

    if (!hasPickedDate) {
      return Toast.show({
        type: 'info',
        text1: "Date of birth is required",
        text2: "Please select your date of birth.",
      });
    }

    if (!form.gender) {
      return Toast.show({
        type: 'info',
        text1: "Gender is required",
        text2: "Please select your gender.",
      });
    }

    if (!hasChanges()) {
      return Toast.show({
        type: 'info',
        text1: "No changes detected",
        text2: "No fields has been edited so far.",
      });
    }

    try {

      setLoading(true)

      const data = {
        full_name: form.fullName,
        date_of_birth: birthFormatted,
        gender: form.gender
      }

      console.log(data)

      const result = await axiosClient.patch("/profile/update", data)

      const updateUser = {
        fullName: result.data.user.fullName || "",
        dateOfBirth: result.data.user.dateOfBirth || "",
        gender: result.data.user.gender || "",
      }

      console.log(result.data)

      await AsyncStorage.mergeItem('userProfile', JSON.stringify(updateUser));
    
      const recentProfile = await AsyncStorage.getItem('userProfile');
      const updatedProfile = recentProfile ? JSON.parse(recentProfile) : null;

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      Toast.show({
        type: 'success',
        text1: result.data.message,
        text2: "Profile Updated",
      });
      router.back()

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response.data.message || "Please try again later"
      });
      console.log(error.response.data)

    } finally {
      setLoading(false)
    } 
  } 

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];

      // Check file size
      // const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri);
      const file = new ExpoFile(selectedImage.uri);
      const fileInfo = file.info();

      // Ensure file exists and has a size
      if (!fileInfo.exists || typeof fileInfo.size !== 'number') {
        Alert.alert("Error", "Could not retrieve file info.");
        return;
      }

      if (fileInfo.size > 8 * 1024 * 1024) {
        Alert.alert("File too large", "Image must be less than 5MB.");
        return;
      }

      // Check mime type or extension
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const isValidType = allowedTypes.includes(selectedImage.mimeType || '');

      // Fallback if mimeType is missing (use URI extension)
      const extension = selectedImage.uri.split('.').pop()?.toLowerCase();
      const isValidExtension = ['jpg', 'jpeg', 'png'].includes(extension || '');

      if (!isValidType && !isValidExtension) {
        Alert.alert("Invalid file type", "Only JPG, JPEG or PNG images are allowed.");
        return;
      }

      setFile(selectedImage)
      setShowModal(true)
    }
  };

  const uploadImage = async () => {
  
    if (!file) {
      return Toast.show({
        type: 'info',
        text1: "Select a profile picture",
        text2: "Choose a photo.",
      });
    }

    setShowModal(false)

    const formData = new FormData();

    formData.append('avatar', {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName || `profile_${Date.now()}.jpg`,
    } as any);

    setLoading(true)
    console.log("calling api")
    try {
      const response = await axiosClient.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response.data)

      const user: any = {
        profilePicture: response.data.avatarUrl,
      }

      await AsyncStorage.mergeItem('userProfile', JSON.stringify(user));

      const recentProfile = await AsyncStorage.getItem('userProfile');
      const updatedProfile = recentProfile ? JSON.parse(recentProfile) : null;

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setFile(null)

      Toast.show({
        type: 'success',
        text1: "Profile picture updated",
        text2: "Picture changed."
      });

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response.data.message || "Please try again later"
      });

      console.log(error.response.data)
    } finally {
      setLoading(false)
    }
  };

  return (
    <View className='flex-1 bg-charcoal'>
          <Header title="Edit Profile" onpress={() => router.back()} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
              keyboardShouldPersistTaps="handled"
            >

                <View className='flex-row items-center justify-center gap-4 mb-6 mt-4'>
                    <View className='p-1 w-28 h-28 relative rounded-full border-2 border-yellow bg-charcoal'>
                        {!userProfile?.profilePicture ? (
                          <Image
                            source={images.avatar}
                            className='w-full h-full rounded-full'
                          />
                        ) : (
                          <ExpoImage source={{ uri: `${process.env.EXPO_PUBLIC_IMAGE_URI}${userProfile?.profilePicture}` }} placeholder={{ blurhash }} cachePolicy="disk" contentFit="cover" className='w-full h-full rounded-full overflow-hidden'/>
                        )}
                        <TouchableOpacity activeOpacity={0.9} className='absolute -right-1 bottom-2 z-50' onPress={pickImage}>
                            <View className={`flex items-center justify-center size-10 rounded-full bg-yellow`}>
                              <Entypo name="camera" size={18} color="#ffffff"  />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="bg-charcoal-light rounded-3xl p-6 mb-4">

                    <FormField title="Change Name" value={form.fullName} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, fullName: e })} />
                    <FormField title="Enter Email" value={form.email} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, email: e })} otherStyles="mt-4" disabled/>
                    <Picker title='Select gender' value={form.gender} placeholder="Select gender" handleChangeText={(e: any) => setForm({ ...form, gender: e.value })} data={data.gender}/>
                    <View className={`space-y-2 mt-4`}>
                      <Text className={`text-base font-mregular pb-2 text-white`}>Date of Birth</Text>
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(true)} className={`bg-gray flex-1 border w-full h-[46px] px-4 rounded-lg items-center flex-row gap-1`}>
                        <Text className='font-mregular text-charcoal capitalize' numberOfLines={1}>{hasPickedDate ? date.toISOString().split('T')[0] : 'select'}</Text>
                      </TouchableOpacity>
                    </View>
                    <CustomButton title="Save changes" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-7 mx-auto" textStyles='text-white'/>

                </View>

            </ScrollView>
          </KeyboardAvoidingView>

          <DatePicker
            modal
            open={open}
            mode="date"
            date={date}
            onConfirm={(date) => {
              setOpen(false)
              setHasPickedDate(true)
              setDate(date)
            }}
            onCancel={() => {
              setOpen(false)
            }}
            theme={'dark'}
          />

        <Modal transparent={false} visible={showModal} onRequestClose={() => setShowModal(false)}>
          <SafeAreaView className='flex-1 bg-charcoal'>
              <View className='flex-1 w-full px-4'>
                  <View className='flex-row items-center justify-between gap-2 py-2'>
                    <Text className='font-msbold text-lg text-white'>Photo Preview</Text>
                    <TouchableOpacity onPress={() => setShowModal(false)}>
                      <Ionicons name="close" size={28} color={"#fff"} />
                    </TouchableOpacity>
                  </View>
                  <View className='flex-1 items-center justify-center'>
                    <View className='size-[270px] rounded-full border border-gray-200 relative'>
                      {file?.uri && <Image source={{ uri: file?.uri }} resizeMode='cover' className='w-full h-full rounded-full'/>}
                      <TouchableOpacity activeOpacity={0.9} className='absolute -right-1 bottom-2 z-50' onPress={pickImage}>
                        <View className={`flex items-center justify-center size-20 rounded-full absolute -right-2 bottom-2 bg-charcoal-light`}>
                          <Entypo name="camera" size={38} color={"#fff"} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className='w-full justify-center my-6'>
                    <CustomButton title="Save & Close" handlePress={uploadImage} isLoading={isLoading} containerStyles="w-full mx-auto" textStyles='text-white'/>
                  </View>      
              </View>
          </SafeAreaView>
        </Modal>

        <StatusBar style="light" />
    </View>
  );
}