import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { createEntry } from '@/lib/journal-db';
import { moodOptions, todayPrompt } from '@/lib/mock-data';

const scale = [1, 2, 3, 4, 5];
const quickTags = ['sleep', 'work', 'relationships', 'health', 'money', 'overwhelm', 'focus', 'trigger'];

export default function TodayScreen() {
  const db = useSQLiteContext();
  const [selectedMood, setSelectedMood] = useState(moodOptions[2]);
  const [energyScore, setEnergyScore] = useState(3);
  const [stressScore, setStressScore] = useState(3);
  const [impulseScore, setImpulseScore] = useState(2);
  const [sleepHours, setSleepHours] = useState('7.5');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['focus']);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => note.trim().length > 0, [note]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  };

  const saveEntry = async () => {
    if (!canSave || saving) {
      return;
    }

    try {
      setSaving(true);
      await createEntry(db, {
        moodLabel: selectedMood.label,
        moodScore: selectedMood.score,
        energyScore,
        stressScore,
        impulseScore,
        sleepHours: Number.parseFloat(sleepHours) || null,
        note: note.trim(),
        tags: selectedTags.join(','),
      });
      setNote('');
      Alert.alert('Saved', 'Your check-in is stored on this device.');
    } catch {
      Alert.alert('Could not save', 'Something slipped. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Today</Text>
      <Text style={styles.title}>How are you landing right now?</Text>
      <Text style={styles.subtitle}>
        Low-friction check-ins for attention swings, emotional intensity, and mood patterns.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick mood check</Text>
        <View style={styles.moodRow}>
          {moodOptions.map((mood) => {
            const active = selectedMood.score === mood.score;
            return (
              <TouchableOpacity
                key={mood.score}
                style={[styles.moodChip, active && styles.moodChipActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedMood(mood)}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{mood.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signals worth tracking</Text>
        <MetricSelector label="Energy" value={energyScore} onChange={setEnergyScore} />
        <MetricSelector label="Stress" value={stressScore} onChange={setStressScore} />
        <MetricSelector label="Impulse intensity" value={impulseScore} onChange={setImpulseScore} />
        <View style={styles.sleepRow}>
          <Text style={styles.metricHeading}>Sleep hours</Text>
          <TextInput
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="decimal-pad"
            style={styles.sleepInput}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tags</Text>
        <View style={styles.tagRow}>
          {quickTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, active && styles.tagTextActive]}>#{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journal prompt</Text>
        <Text style={styles.prompt}>{todayPrompt}</Text>
        <TextInput
          multiline
          placeholder="Write what happened, what you felt, what your mind is doing, or what set things off."
          placeholderTextColor="#7B7F89"
          style={styles.input}
          value={note}
          onChangeText={setNote}
        />
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, !canSave && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={saveEntry}
            disabled={!canSave || saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save entry'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Grounding tools</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Support, not diagnosis</Text>
        <Text style={styles.noticeText}>
          This app should help users externalize patterns earlier. It should never pretend to diagnose, predict crises, or replace treatment.
        </Text>
      </View>
    </ScrollView>
  );
}

function MetricSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricHeading}>{label}</Text>
      <View style={styles.metricRow}>
        {scale.map((option) => {
          const active = option === value;
          return (
            <TouchableOpacity
              key={`${label}-${option}`}
              style={[styles.metricPill, active && styles.metricPillActive]}
              onPress={() => onChange(option)}>
              <Text style={[styles.metricPillText, active && styles.metricPillTextActive]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
    fontSize: 30,
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
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    width: '18%',
    minWidth: 60,
    backgroundColor: '#F3E8DF',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  moodChipActive: {
    backgroundColor: '#5B6CFF',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4F58',
  },
  moodLabelActive: {
    color: '#FFFFFF',
  },
  metricBlock: {
    gap: 8,
  },
  metricHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E4350',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#EEF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPillActive: {
    backgroundColor: '#1E1F24',
  },
  metricPillText: {
    color: '#434957',
    fontWeight: '700',
  },
  metricPillTextActive: {
    color: '#FFFFFF',
  },
  sleepRow: {
    gap: 8,
  },
  sleepInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1E1F24',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#EEF0F4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipActive: {
    backgroundColor: '#E6D6FB',
  },
  tagText: {
    color: '#445065',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#5A31A8',
  },
  prompt: {
    fontSize: 15,
    color: '#3D4351',
  },
  input: {
    minHeight: 140,
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    padding: 14,
    textAlignVertical: 'top',
    color: '#1E1F24',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#5B6CFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#EEF0F4',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#394150',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
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
