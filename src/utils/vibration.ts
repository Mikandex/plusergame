import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'light' | 'roll' | 'win' | 'lose') => {
  if (type === 'roll' || type === 'light') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  if (type === 'win') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (type === 'lose') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};