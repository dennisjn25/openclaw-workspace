import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { getUserProfile, saveUserProfile, UserProfile } from '@/lib/journal-db';

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

  const loadProfile = useCallback(async () => {
    const current = await getUserProfile(db);
    setProfile(current ?? defaultProfile);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggleReminder = async (value: boolean) => {
    const next = { ...profile, reminderEnabled: value ? 1 : 0 };
    setProfile(next);
    await saveUserProfile(db, next);
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
            <Text style={styles.helper}>Keep it opt-in and low pressure.</Text>
          </View>
          <Switch value={profile.reminderEnabled === 1} onValueChange={toggleReminder} />
        </View>
        <Text style={styles.label}>Reminder time</Text>
        <Text style={styles.value}>{profile.reminderTime}</Text>
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
