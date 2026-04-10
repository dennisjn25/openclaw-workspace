import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/journal-db';
import { cancelReminders, scheduleDailyReminder } from '@/lib/notifications';

const defaultProfile: Omit<UserProfile, 'id'> = {
  displayName: '',
  conditions: '',
  supportContact: '',
  crisisPlan: '',
  reminderEnabled: 0,
  reminderTime: '20:00',
};

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Omit<UserProfile, 'id'>>(defaultProfile);
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  const loadProfile = useCallback(async () => {
    const current = await getUserProfile(db);
    setProfile(current ?? defaultProfile);
    setTimeInput((current?.reminderTime) || '20:00');
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggleReminder = async (value: boolean) => {
    let success = true;
    if (value) {
      success = await scheduleDailyReminder(profile.reminderTime);
    } else {
      await cancelReminders();
    }

    if (!success) {
      Alert.alert(
        'Notifications blocked',
        'Please enable notifications in your device settings so you can receive reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    const next = { ...profile, reminderEnabled: value ? 1 : 0 };
    setProfile(next);
    await saveUserProfile(db, next);
  };

  const saveTime = async () => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeInput)) {
      Alert.alert('Invalid time', 'Please use 24-hour format like 20:00 or 09:30');
      return;
    }

    const next = { ...profile, reminderTime: timeInput };
    setProfile(next);
    await saveUserProfile(db, next);

    if (profile.reminderEnabled === 1) {
      await scheduleDailyReminder(timeInput);
    }

    setEditingTime(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Make the app gentler, clearer, and safer for the person using it.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile.displayName || 'Not set yet'}</Text>
        <Text style={styles.label}>Conditions</Text>
        <Text style={styles.value}>{profile.conditions || 'Not set yet'}</Text>
        <Text style={styles.label}>Support contact</Text>
        <Text style={styles.value}>{profile.supportContact || 'Not set yet'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/onboarding')}>
          <Text style={styles.secondaryButtonText}>Edit onboarding profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.cardTitle}>Daily reminder</Text>
            <Text style={styles.helper}>A gentle nudge, no streak pressure.</Text>
          </View>
          <Switch value={profile.reminderEnabled === 1} onValueChange={toggleReminder} />
        </View>
        {editingTime ? (
          <View style={styles.timeEdit}>
            <TextInput
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="default"
              style={styles.timeInput}
              placeholder="20:00"
              placeholderTextColor="#7B7F89"
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveTime}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTimeInput(profile.reminderTime);
                setEditingTime(false);
              }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingTime(true)}>
            <Text style={styles.label}>Reminder time</Text>
            <Text style={styles.timeValue}>{profile.reminderTime}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Privacy direction</Text>
        <Text style={styles.noticeText}>
          Sensitive mental health data should stay local by default until the sync and consent model is strong enough.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: '#F6F1EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1F24',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5E6472',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  label: {
    fontSize: 13,
    color: '#6C7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    color: '#27303D',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 16,
    color: '#27303D',
    fontWeight: '600',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5E6472',
  },
  timeEdit: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1E1F24',
  },
  saveButton: {
    backgroundColor: '#5B6CFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#EEF0F4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#394150',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#EEF0F4',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#394150',
    fontWeight: '600',
  },
  notice: {
    backgroundColor: '#FFF4E8',
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A4A15',
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7A4A15',
  },
});