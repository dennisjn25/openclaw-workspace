import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getUserProfile, saveUserProfile } from '@/lib/journal-db';

const conditionOptions = ['ADHD', 'BPD', 'Bipolar', 'Depression', 'Anxiety'];

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const [displayName, setDisplayName] = useState('');
  const [conditions, setConditions] = useState<string[]>(['ADHD']);
  const [supportContact, setSupportContact] = useState('');
  const [crisisPlan, setCrisisPlan] = useState('Text my sister, pause decisions, then call therapist if it keeps escalating.');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserProfile(db).then((profile) => {
      if (!profile) {
        return;
      }
      setDisplayName(profile.displayName);
      setConditions(profile.conditions ? profile.conditions.split(',').filter(Boolean) : []);
      setSupportContact(profile.supportContact);
      setCrisisPlan(profile.crisisPlan);
      setReminderEnabled(profile.reminderEnabled === 1);
      setReminderTime(profile.reminderTime);
    });
  }, [db]);

  const toggleCondition = (condition: string) => {
    setConditions((current) =>
      current.includes(condition)
        ? current.filter((value) => value !== condition)
        : [...current, condition]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveUserProfile(db, {
        displayName: displayName.trim(),
        conditions: conditions.join(','),
        supportContact: supportContact.trim(),
        crisisPlan: crisisPlan.trim(),
        reminderEnabled: reminderEnabled ? 1 : 0,
        reminderTime: reminderTime.trim() || '20:00',
      });
      Alert.alert('Saved', 'Your support profile is stored locally on this device.');
      router.back();
    } catch {
      Alert.alert('Could not save', 'Something broke while saving the profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Onboarding</Text>
      <Text style={styles.title}>Set the app up to support the actual person using it.</Text>
      <Text style={styles.subtitle}>
        Keep the UX gentle, personal, and explicit about what helps when things start slipping.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basics</Text>
        <TextInput
          placeholder="Display name"
          placeholderTextColor="#7B7F89"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conditions this app should account for</Text>
        <View style={styles.chipRow}>
          {conditionOptions.map((condition) => {
            const active = conditions.includes(condition);
            return (
              <TouchableOpacity
                key={condition}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleCondition(condition)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{condition}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support plan</Text>
        <TextInput
          placeholder="Trusted support contact"
          placeholderTextColor="#7B7F89"
          value={supportContact}
          onChangeText={setSupportContact}
          style={styles.input}
        />
        <TextInput
          multiline
          placeholder="When things escalate, what should this person do first?"
          placeholderTextColor="#7B7F89"
          value={crisisPlan}
          onChangeText={setCrisisPlan}
          style={[styles.input, styles.textarea]}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.cardTitle}>Gentle reminder</Text>
            <Text style={styles.helper}>A nudge for daily check-ins, without shame or streak pressure.</Text>
          </View>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
        </View>
        <TextInput
          placeholder="20:00"
          placeholderTextColor="#7B7F89"
          value={reminderTime}
          onChangeText={setReminderTime}
          style={styles.input}
        />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Safety boundary</Text>
        <Text style={styles.noticeText}>
          This app can support awareness and reflection. It should not market itself as diagnosis, emergency care, or a replacement for treatment.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: '#F6F1EB',
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B5E57',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  input: {
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    padding: 14,
    color: '#1E1F24',
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#EEF0F4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#E6D6FB',
  },
  chipText: {
    color: '#445065',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#5A31A8',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
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
  primaryButton: {
    backgroundColor: '#5B6CFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
