import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { triggerHaptic } from '@/utils/vibration';

const showError = (reason: string) => {
  Toast.show({ type: 'error', text1: 'Unable to open', text2: reason });
};

const openLink = async (url: string) => {
  triggerHaptic('light');

  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      showError('No app available to handle this link');
      return;
    }

    await Linking.openURL(url);
  } catch (error: any) {
    showError(error?.message || 'Please try again later');
  }
};

export default openLink;
