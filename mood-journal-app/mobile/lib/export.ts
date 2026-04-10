import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { EntryRecord } from './journal-db';

export async function exportEntriesToText(entries: EntryRecord[], profile: { displayName: string; conditions: string } | null): Promise<boolean> {
  if (entries.length === 0) {
    return false;
  }

  let content = '# Signal - Journal Export\n\n';
  
  if (profile) {
    content += `## User Profile\n`;
    content += `- Name: ${profile.displayName || 'Not set'}\n`;
    content += `- Conditions: ${profile.conditions || 'Not set'}\n\n`;
  }

  content += `## Journal Entries (${entries.length} total)\n\n`;

  for (const entry of entries) {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    content += `### ${date}\n`;
    content += `**Mood:** ${entry.moodLabel} (${entry.moodScore}/5)\n`;
    
    if (entry.energyScore) {
      content += `**Energy:** ${entry.energyScore}/5\n`;
    }
    if (entry.stressScore) {
      content += `**Stress:** ${entry.stressScore}/5\n`;
    }
    if (entry.sleepHours) {
      content += `**Sleep:** ${entry.sleepHours} hours\n`;
    }
    if (entry.impulseScore) {
      content += `**Impulse intensity:** ${entry.impulseScore}/5\n`;
    }
    if (entry.tags) {
      content += `**Tags:** ${entry.tags}\n`;
    }
    
    content += `\n${entry.note}\n\n---\n\n`;
  }

  content += `\n*Exported from Signal - ${new Date().toLocaleDateString()}*\n`;
  content += `*This is a personal support tool, not medical advice.*\n`;

  const fileName = `signal-export-${Date.now()}.txt`;
  const exportFile = new File(Paths.cache, fileName);
  await exportFile.write(content);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(exportFile.uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Export Journal for Therapist',
    });
    return true;
  }

  return false;
}