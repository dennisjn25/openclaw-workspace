import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { moodOptions, sampleEntries, todayPrompt } from '@/lib/mock-data';

export default function TodayScreen() {
  const latest = sampleEntries[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Today</Text>
      <Text style={styles.title}>How are you landing right now?</Text>
      <Text style={styles.subtitle}>
        Fast enough for an ADHD brain, reflective enough to notice real patterns.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick mood check</Text>
        <View style={styles.moodRow}>
          {moodOptions.map((mood) => (
            <TouchableOpacity key={mood.score} style={styles.moodChip} activeOpacity={0.8}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Energy</Text>
          <Text style={styles.metricValue}>4 / 5</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Stress</Text>
          <Text style={styles.metricValue}>2 / 5</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Sleep</Text>
          <Text style={styles.metricValue}>7.5 h</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Journal prompt</Text>
        <Text style={styles.prompt}>{todayPrompt}</Text>
        <TextInput
          multiline
          placeholder="Write what happened, what you felt, or what your mind is doing."
          placeholderTextColor="#7B7F89"
          style={styles.input}
        />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Save entry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Grounding tools</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last check-in</Text>
        <Text style={styles.entryMeta}>
          {latest.date} • {latest.moodLabel} • Energy {latest.energyScore}/5
        </Text>
        <Text style={styles.entryNote}>{latest.note}</Text>
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
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B4F58',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#E8EEF8',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: '#566070',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
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
  entryMeta: {
    fontSize: 13,
    color: '#6C7280',
  },
  entryNote: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2B303B',
  },
});
