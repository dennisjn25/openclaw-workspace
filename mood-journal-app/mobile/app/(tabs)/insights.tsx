import { StyleSheet, Text, View } from 'react-native';

export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Not diagnosis. Just pattern visibility with a calmer interface.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly read</Text>
        <Text style={styles.body}>
          Mood is steadier on days with stronger sleep. Stress spikes cluster around work-tagged entries.
        </Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Sleep</Text>
          <Text style={styles.smallValue}>↑ helps</Text>
        </View>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Energy swings</Text>
          <Text style={styles.smallValue}>2 this week</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support tools</Text>
        <Text style={styles.body}>Future modules: grounding, DBT prompts, medication logs, reminders, and trusted-person sharing.</Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Safety note</Text>
        <Text style={styles.noticeBody}>
          This app should support reflection and early awareness. It should not present itself as crisis care, diagnosis, or a substitute for treatment.
        </Text>
      </View>
    </View>
  );
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
