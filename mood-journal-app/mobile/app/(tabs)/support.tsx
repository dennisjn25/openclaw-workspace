import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const groundingSteps = [
  'Name 5 things you can see around you.',
  'Name 4 things you can physically feel.',
  'Name 3 things you can hear right now.',
  'Name 2 things you can smell.',
  'Name 1 thing you can taste.',
];

const dbtDistractions = [
  { name: 'ACCEPTS', description: 'Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations' },
  'Call a friend or text someone safe.',
  'Watch something calming on your phone.',
  'Listen to a favorite song.',
  'Take a warm shower or splash cold water on your face.',
  'Do a quick stretch or 5 jumping jacks.',
  'Organize something small — a drawer, a shelf, a corner.',
  'Write a quick list of things you need to do later (not now).',
  'Look at photos that make you feel grounded.',
  'Step outside and notice the weather.',
];

const emotionRegulation = [
  'Name the emotion you are feeling right now. Just name it, don\'t fix it.',
  'Ask: "What is this emotion trying to tell me?"',
  'Ask: "Is this emotion facts or a story?"',
  'Take 3 slow breaths. In for 4, hold for 4, out for 6.',
  'Reminder: Emotions are waves. They rise and they fall. You don\'t have to stop them — just stay afloat.',
];

const selfSoothing = [
  'Wrap yourself in a blanket.',
  'Hold something warm — a mug, a heating pad.',
  'Place your hand on your heart and feel it beat.',
  'Say to yourself: "This is hard. I\'m doing my best."',
  'Drink a glass of water slowly.',
  'Tighten and release each muscle group.',
];

export default function SupportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Support</Text>
      <Text style={styles.subtitle}>Tools for when the mind is loud or the feelings are moving fast.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>5-4-3-2-1 Grounding</Text>
        <Text style={styles.cardHelper}>Use when you feel dissociated, panicky, or overwhelmed.</Text>
        {groundingSteps.map((step) => (
          <Text key={step} style={styles.listItem}>
            • {step}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>DBT: TIPP Skills</Text>
        <Text style={styles.cardHelper}>Quick physical interventions to lower emotional intensity fast.</Text>
        <Text style={styles.body}><Text style={styles.bold}>T</Text>emperature: Hold ice or cold water</Text>
        <Text style={styles.body}><Text style={styles.bold}>I</Text>ntensive exercise: Quick movement</Text>
        <Text style={styles.body}><Text style={styles.bold}>P</Text>aced breathing: Slow exhale focus</Text>
        <Text style={styles.body}><Text style={styles.bold}>P</Text>rogressive relaxation: Tense + release</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Distraction (ACCEPTS)</Text>
        <Text style={styles.cardHelper}>Shift attention away from the spike.</Text>
        {dbtDistractions.slice(1).map((item, i) => (
          <Text key={i} style={styles.body}>• {typeof item === 'string' ? item : item.name}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emotion check-in</Text>
        {emotionRegulation.map((item, i) => (
          <Text key={i} style={styles.body}>• {item}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Self-soothing</Text>
        <Text style={styles.cardHelper}>Gentle ways to signal safety to your nervous system.</Text>
        {selfSoothing.map((item, i) => (
          <Text key={i} style={styles.body}>• {item}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crisis support</Text>
        <Text style={styles.body}>
          If you feel unsafe, overwhelmed in a dangerous way, or at risk of harming yourself or someone else — reach out now.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => Linking.openURL('tel:988')}>
          <Text style={styles.primaryButtonText}>Call or text 988</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.secondaryButton, { marginTop: 10 }]} 
          onPress={() => Linking.openURL('sms:741741')}>
          <Text style={styles.secondaryButtonText}>Text "HOME" to 741741</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>A note</Text>
        <Text style={styles.noticeText}>
          These tools support coping but don\'t replace professional care. If you\'re in crisis, the resources above are a starting point. Your safety matters.
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
  cardHelper: {
    fontSize: 13,
    color: '#5E6472',
    marginBottom: 4,
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
  bold: {
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#5B6CFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
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