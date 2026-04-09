export type JournalEntry = {
  id: string;
  date: string;
  moodLabel: string;
  moodScore: number;
  energyScore: number;
  stressScore: number;
  tags: string[];
  note: string;
};

export const todayPrompt = 'What is true for you right now?';

export const moodOptions = [
  { label: 'Low', emoji: '😞', score: 1 },
  { label: 'Heavy', emoji: '😕', score: 2 },
  { label: 'Steady', emoji: '🙂', score: 3 },
  { label: 'Good', emoji: '😊', score: 4 },
  { label: 'Strong', emoji: '😄', score: 5 },
];

export const sampleEntries: JournalEntry[] = [
  {
    id: '1',
    date: 'Thu, Apr 9',
    moodLabel: 'Good',
    moodScore: 4,
    energyScore: 4,
    stressScore: 2,
    tags: ['work', 'clarity'],
    note: 'Momentum is back. The idea feels bigger now that the structure is cleaner.',
  },
  {
    id: '2',
    date: 'Wed, Apr 8',
    moodLabel: 'Steady',
    moodScore: 3,
    energyScore: 3,
    stressScore: 3,
    tags: ['sleep', 'focus'],
    note: 'Not bad, just scattered. I need less input and a cleaner next action.',
  },
  {
    id: '3',
    date: 'Tue, Apr 7',
    moodLabel: 'Strong',
    moodScore: 5,
    energyScore: 5,
    stressScore: 1,
    tags: ['creative', 'music'],
    note: 'Everything connected today. This is the feeling I want to build around.',
  },
];
