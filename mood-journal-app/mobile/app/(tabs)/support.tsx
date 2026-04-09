import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const groundingSteps = [
  'Name 5 things you can see.',
  'Name 4 things you can touch.',
  'Name 3 things you can hear.',
  'Name 2 things you can smell.',
  'Name 1 thing you can taste.',
];

export default function SupportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Support</Text>
      <Text style={styles.subtitle}>Short, calm tools for when the mind is loud or the feelings are fast.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Grounding</Text>
        {groundingSteps.map((step) => (
          <Text key={step} style={styles.listItem}>
            • {step}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>DBT-style reminder</Text>
        <Text style={styles.body}>
          Pause the story. Name the feeling. Lower the body alarm first, then decide what action actually protects you.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>When to reach out</Text>
        <Text style={styles.body}>
          If a user feels unsafe, overwhelmed, impulsive in a dangerous way, or at risk of harming themselves or someone else, the app should push them toward real human support fast.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => Linking.openURL('tel:988')}>
          <Text style={styles.primaryButtonText}>Call or text 988</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Crisis note</Text>
        <Text style={styles.noticeBody}>
          In the United States and Canada, 988 connects to crisis support. If there is immediate danger, call emergency services now.
        </Text>
      </View>
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1F24',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#5B6CFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
