import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryRecord, getEntries } from '@/lib/journal-db';

export default function TimelineScreen() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    const rows = await getEntries(db);
    setEntries(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>A clean record of mood, energy, sleep, and the story around them.</Text>

      {entries.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
            <Text style={styles.badge}>{entry.moodLabel}</Text>
          </View>
          <Text style={styles.metrics}>
            Mood {entry.moodScore}/5 • Energy {entry.energyScore ?? '-'} • Stress {entry.stressScore ?? '-'} • Sleep {entry.sleepHours ?? '-'}h
          </Text>
          <Text style={styles.note}>{entry.note}</Text>
          <View style={styles.tagsRow}>
            {splitTags(entry.tags).map((tag) => (
              <Text key={`${entry.id}-${tag}`} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        </View>
      ))}

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyText}>Your timeline will populate after the first saved check-in.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5E6472',
  },
});
