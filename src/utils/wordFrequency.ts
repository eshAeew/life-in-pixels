import type { DailyEntry } from '../types';
import { formatDateKey, parseDateKey } from './rules';

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'days', 'today',
  'most', 'us', 'is', 'was', 'are', 'were', 'been', 'had', 'has', 'did', 'felt', 'feel',
]);

export interface WordCount {
  word: string;
  count: number;
  weight: number; // 1 to 5 scale for visualization font size & pastel opacity
}

export function extractWordFrequencies(entries: DailyEntry[]): WordCount[] {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    if (!entry.reflection) continue;
    const words = entry.reflection
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/);

    for (const w of words) {
      const clean = w.trim();
      if (clean.length > 2 && !STOP_WORDS.has(clean)) {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);

  if (sorted.length === 0) return [];

  const maxCount = sorted[0][1];
  const minCount = sorted[sorted.length - 1][1];

  return sorted.map(([word, count]) => {
    const normalized = maxCount === minCount ? 3 : 1 + Math.round(((count - minCount) / (maxCount - minCount)) * 4);
    return {
      word,
      count,
      weight: normalized,
    };
  });
}

export interface WeeklyMoodTrendPoint {
  weekLabel: string;
  startDate: string;
  avgMoodScore: number | null; // 1 = difficult, 2 = low, 3 = okay, 4 = good, 5 = wonderful
  avgEnergy: number | null;
  avgStress: number | null;
  daysCount: number;
}

const MOOD_SCORES: Record<string, number> = {
  difficult: 1,
  low: 2,
  okay: 3,
  good: 4,
  wonderful: 5,
};

/**
 * Calculates weekly mood trends over the last month for Recharts.
 * Zero dummy values: weeks with no user records have null averages.
 */
export function calculateWeeklyMoodTrends(entries: DailyEntry[], todayDateStr = formatDateKey(new Date())): WeeklyMoodTrendPoint[] {
  const points: WeeklyMoodTrendPoint[] = [];
  const refDate = parseDateKey(todayDateStr);

  // 4 consecutive 7-day windows leading up to today
  const weeks = [3, 2, 1, 0].map((weeksAgo, idx) => {
    const end = new Date(refDate);
    end.setDate(refDate.getDate() - (weeksAgo * 7));
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startStr = formatDateKey(start);
    const endStr = formatDateKey(end);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const label = startMonth === endMonth
      ? `W${idx + 1} (${startMonth} ${start.getDate()}-${end.getDate()})`
      : `W${idx + 1} (${startMonth} ${start.getDate()}-${endMonth} ${end.getDate()})`;

    return {
      label,
      start: startStr,
      end: endStr,
    };
  });

  for (const w of weeks) {
    const weekEntries = entries.filter((e) => e.date >= w.start && e.date <= w.end && e.isCompleted);

    if (weekEntries.length === 0) {
      points.push({
        weekLabel: w.label,
        startDate: w.start,
        avgMoodScore: null,
        avgEnergy: null,
        avgStress: null,
        daysCount: 0,
      });
      continue;
    }

    let moodTotal = 0;
    let energyTotal = 0;
    let energyCount = 0;
    let stressTotal = 0;
    let stressCount = 0;

    for (const e of weekEntries) {
      moodTotal += MOOD_SCORES[e.mood] || 3;
      if (e.energyRating) {
        energyTotal += e.energyRating;
        energyCount++;
      }
      if (e.stressRating) {
        stressTotal += e.stressRating;
        stressCount++;
      }
    }

    const avgMood = Number((moodTotal / weekEntries.length).toFixed(1));
    const avgEnergy = energyCount > 0 ? Number((energyTotal / energyCount).toFixed(1)) : null;
    const avgStress = stressCount > 0 ? Number((stressTotal / stressCount).toFixed(1)) : null;

    points.push({
      weekLabel: w.label,
      startDate: w.start,
      avgMoodScore: avgMood,
      avgEnergy,
      avgStress,
      daysCount: weekEntries.length,
    });
  }

  return points;
}
