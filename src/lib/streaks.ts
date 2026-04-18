import { Tool, UsageEntry } from '@/types/tool';
import { isSameDay, differenceInDays, parseISO, startOfDay } from 'date-fns';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastUsedDate: Date | null;
  isActiveToday: boolean;
}

export function calculateStreak(usageHistory: UsageEntry[] = [], lastUsed: string | null): StreakInfo {
  if (!usageHistory.length && !lastUsed) {
    return { currentStreak: 0, longestStreak: 0, lastUsedDate: null, isActiveToday: false };
  }

  // Combine usage history dates with lastUsed
  const dates = usageHistory.map(entry => startOfDay(parseISO(entry.timestamp)));
  if (lastUsed && !usageHistory.length) {
    dates.push(startOfDay(parseISO(lastUsed)));
  }

  // Remove duplicates and sort descending
  const uniqueDates = [...new Map(dates.map(d => [d.getTime(), d])).values()]
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastUsedDate: null, isActiveToday: false };
  }

  const today = startOfDay(new Date());
  const lastUsedDate = uniqueDates[0];
  const isActiveToday = isSameDay(lastUsedDate, today);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = isActiveToday ? today : startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
  
  for (const date of uniqueDates) {
    if (isSameDay(date, checkDate)) {
      currentStreak++;
      checkDate = startOfDay(new Date(checkDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (date < checkDate) {
      break;
    }
  }

  // If streak was broken (last use wasn't today or yesterday), reset to today only
  if (!isActiveToday && differenceInDays(today, lastUsedDate) > 1) {
    currentStreak = 0;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diff = differenceInDays(uniqueDates[i], uniqueDates[i + 1]);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastUsedDate,
    isActiveToday,
  };
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '⚡';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '✨';
  return '';
}

export function getStreakMessage(streak: number): string {
  if (streak >= 30) return 'Legendary streak!';
  if (streak >= 14) return 'On fire!';
  if (streak >= 7) return 'Week warrior!';
  if (streak >= 3) return 'Building momentum!';
  if (streak >= 1) return 'Keep it going!';
  return '';
}

export function getTopStreakTools(tools: Tool[]): { tool: Tool; streak: StreakInfo }[] {
  return tools
    .map(tool => ({
      tool,
      streak: calculateStreak(tool.usageHistory, tool.lastUsed)
    }))
    .filter(item => item.streak.currentStreak > 0)
    .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
    .slice(0, 5);
}
