import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryRecord, getEntries } from '@/lib/journal-db';

export default function InsightsScreen() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<EntryRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getEntries(db).then(setEntries);
    }, [db])
  );

  const stats = useMemo(() => buildStats(entries), [entries]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Pattern visibility, not overconfident mental health theater.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly read</Text>
        <Text style={styles.body}>{stats.summary}</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Average mood</Text>
          <Text style={styles.smallValue}>{stats.averageMood.toFixed(1)} / 5</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Average sleep</Text>
          <Text style={styles.smallValue}>{stats.averageSleep.toFixed(1)} h</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Most common tags</Text>
        <Text style={styles.body}>{stats.topTags}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Safety note</Text>
        <Text style={styles.noticeBody}>
          Keep insights descriptive. Avoid labels like manic episode, depressive episode, or personality event unless a clinician-designed workflow exists behind them.
        </Text>
      </View>
    </View>
  );
}

function buildStats(entries: EntryRecord[]) {
  if (entries.length === 0) {
    return {
      averageMood: 0,
      averageSleep: 0,
      topTags: 'No pattern data yet.',
      summary: 'Once entries exist, this screen can surface trends around mood, sleep, stress, and triggers.',
    };
  }

  const averageMood = entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length;
  const sleepValues = entries.map((entry) => entry.sleepHours ?? 0).filter((value) => value > 0);
  const averageSleep = sleepValues.length
    ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
    : 0;

  const tagCounts = new Map<string, number>();
  entries.forEach((entry) => {
    entry.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `${tag} (${count})`)
    .join(', ');

  const summary = averageSleep >= 7
    ? 'Sleep is landing in a steadier range, which often supports more stable mood and lower reactivity.'
    : 'Sleep is running light, which is worth watching because it can amplify mood swings, impulsivity, and overwhelm.';

  return {
    averageMood,
    averageSleep,
    topTags: topTags || 'No strong tag pattern yet.',
    summary,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#E8EEF8',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1F24',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  smallLabel: {
    fontSize: 13,
    color: '#566070',
  },
  smallValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
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
  noticeBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7A4A15',
  },
});
