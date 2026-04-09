import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { sampleEntries } from '@/lib/mock-data';

export default function TimelineScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>A clean record of mood, energy, and the story around them.</Text>

      {sampleEntries.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.date}>{entry.date}</Text>
            <Text style={styles.badge}>{entry.moodLabel}</Text>
          </View>
          <Text style={styles.metrics}>
            Mood {entry.moodScore}/5 • Energy {entry.energyScore}/5 • Stress {entry.stressScore}/5
          </Text>
          <Text style={styles.note}>{entry.note}</Text>
          <View style={styles.tagsRow}>
            {entry.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
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
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22252C',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4D57C8',
    backgroundColor: '#E9ECFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metrics: {
    fontSize: 13,
    color: '#6C7280',
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2B303B',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 12,
    color: '#6B4E41',
    backgroundColor: '#F3E8DF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
