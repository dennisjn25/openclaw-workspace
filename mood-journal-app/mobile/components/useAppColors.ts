import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#F6F1EB',
  card: '#FFFFFF',
  cardTitle: '#1E1F24',
  text: '#1E1F24',
  textSecondary: '#5E6472',
  textTertiary: '#6C7280',
  primary: '#5B6CFF',
  primaryText: '#FFFFFF',
  secondary: '#EEF0F4',
  secondaryText: '#394150',
  accent: '#F3E8DF',
  accentText: '#4B4F58',
  purple: '#E6D6FB',
  purpleText: '#5A31A8',
  notice: '#FFF4E8',
  noticeTitle: '#7A4A15',
  noticeText: '#7A4A15',
  input: '#F8F6F3',
  inputText: '#1E1F24',
  placeholder: '#7B7F89',
  border: '#EEF0F4',
  tabActive: '#5B6CFF',
  tabInactive: '#8B90A0',
  moodLow: '#E8B4B4',
  moodMedium: '#F3E8DF',
  moodHigh: '#E8EEF8',
};

const darkColors = {
  background: '#1A1B1F',
  card: '#25262B',
  cardTitle: '#EAEAEC',
  text: '#EAEAEC',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  primary: '#6366F1',
  primaryText: '#FFFFFF',
  secondary: '#374151',
  secondaryText: '#D1D5DB',
  accent: '#374151',
  accentText: '#D1D5DB',
  purple: '#4C1D95',
  purpleText: '#D8B4FE',
  notice: '#451A03',
  noticeTitle: '#FCD34D',
  noticeText: '#FDE68A',
  input: '#2D2F35',
  inputText: '#EAEAEC',
  placeholder: '#6B7280',
  border: '#374151',
  tabActive: '#6366F1',
  tabInactive: '#6B7280',
  moodLow: '#7F1D1D',
  moodMedium: '#451A03',
  moodHigh: '#1E3A5F',
};

export function useAppColors() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}

export type AppColors = typeof lightColors;