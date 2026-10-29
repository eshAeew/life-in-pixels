import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustHexColor,
  getPixelColor,
  formatDateKey,
  parseDateKey,
  isFutureDate,
  calculateLifeTimeline,
  calculateInsights,
  generateMonthlyRecap,
  calculateCurrentStreak,
} from './rules.ts';
import type { DailyEntry } from '../types/index.ts';

test('adjustHexColor modifies RGB channels without overflowing', () => {
  const result = adjustHexColor('#FFFFFF', 20);
  assert.equal(result.toUpperCase(), '#FFFFFF');

  const darker = adjustHexColor('#808080', -20);
  assert.notEqual(darker, '#808080');
});

test('getPixelColor returns consistent deterministic colors based on mood and ratings and produces 2500+ combinations', () => {
  const baseColor = getPixelColor('wonderful', undefined, undefined, undefined, undefined, 'softly-pastel');
  assert.equal(baseColor, '#F7D486');

  // Higher rating produces slightly tuned hex
  const tunedColor = getPixelColor('wonderful', 5, 5, 1, 5, 'softly-pastel');
  assert.match(tunedColor, /^#[0-9a-fA-F]{6}$/);

  // Every single question changes the resulting color:
  const c1 = getPixelColor('good', 3, 3, 3, 3);
  const cEnergy = getPixelColor('good', 3, 4, 3, 3);
  const cStress = getPixelColor('good', 3, 3, 4, 3);
  const cMeaning = getPixelColor('good', 3, 3, 3, 4);
  const cOverall = getPixelColor('good', 4, 3, 3, 3);

  assert.notEqual(c1, cEnergy, 'Energy must change color');
  assert.notEqual(c1, cStress, 'Stress must change color');
  assert.notEqual(c1, cMeaning, 'Meaning must change color');
  assert.notEqual(c1, cOverall, 'Overall must change color');

  // Calculate unique outputs across all 3,125 discrete states (5 x 5 x 5 x 5 x 5)
  const moods = ['wonderful', 'good', 'okay', 'low', 'difficult'] as const;
  const scales = [1, 2, 3, 4, 5] as const;
  const uniqueColors = new Set<string>();

  for (const m of moods) {
    for (const energy of scales) {
      for (const stress of scales) {
        for (const meaning of scales) {
          for (const overall of scales) {
            uniqueColors.add(getPixelColor(m, overall, energy, stress, meaning, 'softly-pastel'));
          }
        }
      }
    }
  }

  // Assert that there are 2500+ possible unique color outputs
  assert.ok(uniqueColors.size >= 2500, `Expected >= 2500 unique colors, got ${uniqueColors.size}`);
});

test('formatDateKey and parseDateKey roundtrip dates accurately without timezone shifts', () => {
  const sample = new Date(2026, 9, 20); // October 20, 2026
  const key = formatDateKey(sample);
  assert.equal(key, '2026-10-20');

  const parsed = parseDateKey(key);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 9);
  assert.equal(parsed.getDate(), 20);
});

test('isFutureDate correctly detects future and past dates', () => {
  const ref = '2026-10-20';
  assert.equal(isFutureDate('2026-10-21', ref), true);
  assert.equal(isFutureDate('2026-10-20', ref), false);
  assert.equal(isFutureDate('2026-10-19', ref), false);
});

test('calculateLifeTimeline returns accurate non-judgmental horizon metrics', () => {
  const res = calculateLifeTimeline('2000-01-01', 80, '2026-10-20');
  assert.ok(res !== null);
  assert.equal(res.horizonYears, 80);
  assert.ok(res.totalWeeks > 4000);
  assert.ok(res.elapsedWeeks > 1000);
  assert.ok(res.remainingWeeks > 0);
  assert.ok(res.horizonPercentage > 25 && res.horizonPercentage < 40);

  // When birthDate is missing
  assert.equal(calculateLifeTimeline(undefined), null);
});

test('calculateInsights calculates stats without inventing data', () => {
  const mockEntries: DailyEntry[] = [
    {
      id: '1',
      date: '2026-10-18',
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
      mood: 'good',
      overallRating: 4,
      energyRating: 4,
      stressRating: 2,
      tags: ['creativity', 'rest'],
      pixelColor: '#FFB7B2',
      isCompleted: true,
      meaningResponses: [{ id: '1', question: 'Meaningful?', answeredYes: true }],
    },
    {
      id: '2',
      date: '2026-10-19',
      createdAt: '2026-10-19T10:00:00Z',
      updatedAt: '2026-10-19T10:00:00Z',
      mood: 'wonderful',
      overallRating: 5,
      energyRating: 5,
      stressRating: 1,
      tags: ['creativity', 'friends'],
      pixelColor: '#F7D486',
      isCompleted: true,
      meaningResponses: [{ id: '1', question: 'Meaningful?', answeredYes: true }],
    },
  ];

  const insights = calculateInsights(mockEntries, 'month', '2026-10-20');
  assert.equal(insights.totalRecorded, 2);
  assert.equal(insights.moodCounts.good, 1);
  assert.equal(insights.moodCounts.wonderful, 1);
  assert.equal(insights.averageRating, 4.5);
  assert.equal(insights.meaningfulDaysCount, 2);
  assert.equal(insights.topTags[0].tag, 'creativity');
  assert.equal(insights.topTags[0].count, 2);
});

test('generateMonthlyRecap creates respectful recap', () => {
  const recap = generateMonthlyRecap([], 2026, 9);
  assert.ok(recap.summary.includes('No entries were recorded'));
});

test('calculateCurrentStreak accurately calculates consecutive days including or pending today', () => {
  const entries: DailyEntry[] = [
    {
      id: 'e1',
      date: '2026-10-18',
      createdAt: '',
      updatedAt: '',
      mood: 'good',
      tags: [],
      pixelColor: '#fff',
      isCompleted: true,
    },
    {
      id: 'e2',
      date: '2026-10-19',
      createdAt: '',
      updatedAt: '',
      mood: 'good',
      tags: [],
      pixelColor: '#fff',
      isCompleted: true,
    },
  ];

  // If today is 2026-10-20 and not recorded yet, streak from yesterday is 2
  const pendingStreak = calculateCurrentStreak(entries, '2026-10-20');
  assert.equal(pendingStreak.currentStreak, 2);
  assert.equal(pendingStreak.isRecordedToday, false);

  // If today 2026-10-20 is added, streak becomes 3
  const entriesWithToday: DailyEntry[] = [
    ...entries,
    {
      id: 'e3',
      date: '2026-10-20',
      createdAt: '',
      updatedAt: '',
      mood: 'wonderful',
      tags: [],
      pixelColor: '#fff',
      isCompleted: true,
    },
  ];
  const activeStreak = calculateCurrentStreak(entriesWithToday, '2026-10-20');
  assert.equal(activeStreak.currentStreak, 3);
  assert.equal(activeStreak.isRecordedToday, true);

  // If streak was broken 3 days ago
  const brokenStreak = calculateCurrentStreak(
    [
      {
        id: 'e0',
        date: '2026-10-15',
        createdAt: '',
        updatedAt: '',
        mood: 'okay',
        tags: [],
        pixelColor: '#fff',
        isCompleted: true,
      },
    ],
    '2026-10-20'
  );
  assert.equal(brokenStreak.currentStreak, 0);
});

