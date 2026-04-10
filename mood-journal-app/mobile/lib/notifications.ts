import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(time: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return false;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hours, minutes] = time.split(':').map(Number);
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: hours,
    minute: minutes,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check in',
      body: 'How are you landing right now? A quick check-in can help you notice patterns.',
      data: { type: 'reminder' },
    },
    trigger,
  });

  return true;
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}