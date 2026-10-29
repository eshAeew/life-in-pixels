import type { DailyEntry, MoodType, RatingScale, ThemeId } from '../types/index.ts';
import { THEME_PALETTES } from '../theme/palettes.ts';

/**
 * Adjust hex color lightness slightly based on rating, energy, and stress.
 * Deterministic, non-destructive, and respectful.
 */
export function adjustHexColor(hex: string, amount: number): string {
  // Amount: -50 (darker) to +50 (lighter)
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert Hex to HSL
 */
export function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h * 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert HSL to Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Multi-parametric Color Determination Engine.
 * Modulates color across ALL 5 core daily dimensions:
 * 1. Feeling/Mood (5 base anchors)
 * 2. Energy (1-5: shifts saturation and warmth)
 * 3. Stress (1-5: shifts hue temperature & depth)
 * 4. Meaning (1-5: shifts chroma richness & depth)
 * 5. Overall Day Rating (1-5: shifts luminosity & brightness)
 * Produces over 3,125 (5^5) mathematically distinct, harmonious outputs.
 */
export function getPixelColor(
  mood: MoodType,
  overallRating?: RatingScale,
  energyRating?: RatingScale,
  stressRating?: RatingScale,
  meaningRating?: RatingScale,
  themeId: ThemeId = 'softly-pastel',
  customColors?: Partial<Record<MoodType, string>>
): string {
  const palette = THEME_PALETTES[themeId] || THEME_PALETTES['softly-pastel'];
  const baseColor = customColors?.[mood] || palette.colors[mood] || '#E0E0E0';

  // Base HSL
  const [baseH, baseS, baseL] = hexToHsl(baseColor);

  // Default neutral rating is 3 if omitted
  const overall = overallRating ?? 3;
  const energy = energyRating ?? 3;
  const stress = stressRating ?? 3;
  const meaning = meaningRating ?? 3;

  // If everything is exactly neutral (3) and no parameters specified, return clean base
  if (!overallRating && !energyRating && !stressRating && !meaningRating) {
    return baseColor;
  }

  // 1. Hue modulation:
  // Stress cools hue slightly, energy adds slight warm shift, overall gives fine tuning
  const hueShift = (stress - 3) * 3.5 - (energy - 3) * 1.8 + (overall - 3) * 0.9;
  const finalH = baseH + hueShift;

  // 2. Saturation modulation:
  // Energy directly expands chroma; Meaning deepens saturation; Stress slightly softens
  const satShift = (energy - 3) * 3.6 + (meaning - 3) * 2.4 - (stress - 3) * 1.2;
  const finalS = Math.max(15, Math.min(95, baseS + satShift));

  // 3. Lightness modulation:
  // Overall rating directly raises/lowers brightness; Stress deepens; Meaning balances
  const lightShift = (overall - 3) * 4.2 - (stress - 3) * 1.5 + (meaning - 3) * 1.2;
  const finalL = Math.max(22, Math.min(88, baseL + lightShift));

  return hslToHex(finalH, finalS, finalL);
}

/**
 * Format Date into local YYYY-MM-DD string safely without UTC shifts.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string into local Date object safely.
 */
export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date string is in the future compared to reference date.
 */
export function isFutureDate(dateStr: string, referenceDateStr?: string): boolean {
  const target = parseDateKey(dateStr);
  const ref = referenceDateStr ? parseDateKey(referenceDateStr) : new Date();
  ref.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target.getTime() > ref.getTime();
}

/**
 * Calculate weekly lifetime horizon stats without predicting lifespan.
 */
export function calculateLifeTimeline(
  birthDateStr: string | undefined,
  horizonYears: number = 80,
  referenceDateStr?: string
) {
  if (!birthDateStr) {
    return null;
  }

  const birthDate = parseDateKey(birthDateStr);
  const refDate = referenceDateStr ? parseDateKey(referenceDateStr) : new Date();

  const totalWeeks = Math.round(horizonYears * 52.143);
  const diffMs = refDate.getTime() - birthDate.getTime();
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const elapsedWeeks = Math.max(0, Math.floor(elapsedDays / 7));
  const remainingWeeks = Math.max(0, totalWeeks - elapsedWeeks);
  const horizonPercentage = Math.min(100, Math.max(0, (elapsedWeeks / totalWeeks) * 100));

  return {
    horizonYears,
    totalWeeks,
    elapsedDays,
    elapsedWeeks,
    remainingWeeks,
    horizonPercentage: Number(horizonPercentage.toFixed(1)),
    birthDateStr,
  };
}

/**
 * Filter entries by period and compute deterministic insights.
 */
export function calculateInsights(
  entries: DailyEntry[],
  period: 'month' | 'past3Months' | 'year' | 'all',
  currentDateStr: string = formatDateKey(new Date())
) {
  const now = parseDateKey(currentDateStr);
  
  const filtered = entries.filter((entry) => {
    if (!entry.isCompleted) return false;
    const entryDate = parseDateKey(entry.date);
    if (period === 'month') {
      return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth();
    }
    if (period === 'past3Months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return entryDate >= threeMonthsAgo && entryDate <= now;
    }
    if (period === 'year') {
      return entryDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRecorded = filtered.length;

  const moodCounts: Record<MoodType, number> = {
    wonderful: 0,
    good: 0,
    okay: 0,
    low: 0,
    difficult: 0,
  };

  let ratingSum = 0;
  let ratingCount = 0;
  let energySum = 0;
  let energyCount = 0;
  let stressSum = 0;
  let stressCount = 0;
  let meaningfulDaysCount = 0;

  const tagFrequency: Record<string, number> = {};

  for (const entry of filtered) {
    if (entry.mood && moodCounts[entry.mood] !== undefined) {
      moodCounts[entry.mood]++;
    }
    if (entry.overallRating) {
      ratingSum += entry.overallRating;
      ratingCount++;
    }
    if (entry.energyRating) {
      energySum += entry.energyRating;
      energyCount++;
    }
    if (entry.stressRating) {
      stressSum += entry.stressRating;
      stressCount++;
    }
    if (entry.meaningResponses?.some((m) => m.answeredYes)) {
      meaningfulDaysCount++;
    }
    if (entry.tags && Array.isArray(entry.tags)) {
      for (const tag of entry.tags) {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      }
    }
  }

  const sortedTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalRecorded,
    period,
    moodCounts,
    averageRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : null,
    averageEnergy: energyCount > 0 ? Number((energySum / energyCount).toFixed(1)) : null,
    averageStress: stressCount > 0 ? Number((stressSum / stressCount).toFixed(1)) : null,
    meaningfulDaysCount,
    topTags: sortedTags,
    hasEnoughData: totalRecorded >= 1,
  };
}

/**
 * Calculate current consecutive streak of daily entries.
 * If today is completed, streak includes today.
 * If today is not completed yet, streak checks consecutive days ending yesterday.
 */
export function calculateCurrentStreak(
  entries: DailyEntry[],
  todayDateStr: string = formatDateKey(new Date())
): { currentStreak: number; longestStreak: number; isRecordedToday: boolean } {
  const completedDateSet = new Set(
    entries.filter((e) => e.isCompleted).map((e) => e.date)
  );

  const isRecordedToday = completedDateSet.has(todayDateStr);

  const todayObj = parseDateKey(todayDateStr);
  let streak = 0;

  // Starting anchor: today if recorded, otherwise yesterday
  let anchorDate = new Date(todayObj);
  if (!isRecordedToday) {
    anchorDate.setDate(anchorDate.getDate() - 1);
  }

  // Count backwards consecutively
  while (true) {
    const checkStr = formatDateKey(anchorDate);
    if (completedDateSet.has(checkStr)) {
      streak++;
      anchorDate.setDate(anchorDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak historically
  const sortedDates = Array.from(completedDateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const cur = parseDateKey(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = cur.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = cur;
  }

  return {
    currentStreak: streak,
    longestStreak: Math.max(streak, longestStreak),
    isRecordedToday,
  };
}

/**
 * Deterministic Monthly Journal Reflection.
 * Generates an honest, grounding, warm recap from recorded days without hallucinating.
 */
export function generateMonthlyRecap(
  entries: DailyEntry[],
  year: number,
  monthIndex: number // 0-11
): {
  title: string;
  summary: string;
  highlightTags: string[];
  climateLabel: string;
  reflectionsCount: number;
} {
  const monthEntries = entries.filter((e) => {
    const d = parseDateKey(e.date);
    return d.getFullYear() === year && d.getMonth() === monthIndex && e.isCompleted;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[monthIndex];

  if (monthEntries.length === 0) {
    return {
      title: `${monthName} ${year}`,
      summary: `No entries were recorded for ${monthName}. Every month is a fresh canvas whenever you're ready to reflect.`,
      highlightTags: [],
      climateLabel: 'Unrecorded',
      reflectionsCount: 0,
    };
  }

  const counts: Record<MoodType, number> = {
    wonderful: 0,
    good: 0,
    okay: 0,
    low: 0,
    difficult: 0,
  };

  const tagMap: Record<string, number> = {};
  let writtenReflectionsCount = 0;
  let meaningfulCount = 0;

  for (const entry of monthEntries) {
    counts[entry.mood]++;
    if (entry.reflection && entry.reflection.trim().length > 0) {
      writtenReflectionsCount++;
    }
    if (entry.meaningResponses?.some((m) => m.answeredYes)) {
      meaningfulCount++;
    }
    for (const tag of entry.tags) {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  let toneDescriptor = 'steady, balanced, and observant';
  let climate = 'Grounded Equilibrium';

  if (counts.wonderful + counts.good >= monthEntries.length * 0.55) {
    toneDescriptor = 'luminous, nourishing, and creatively engaged';
    climate = 'Warm & Flourishing';
  } else if (counts.difficult + counts.low >= monthEntries.length * 0.45) {
    toneDescriptor = 'reflective and tender, honoring life through challenging passages';
    climate = 'Quietly Reflective';
  } else if (counts.okay >= monthEntries.length * 0.4) {
    toneDescriptor = 'anchored in gentle routines, peaceful walks, and ordinary moments';
    climate = 'Gentle & Steady';
  }

  const summary = `You recorded ${monthEntries.length} ${
    monthEntries.length === 1 ? 'day' : 'days'
  } during ${monthName}. The overall atmosphere was ${toneDescriptor}. You noted ${meaningfulCount} deeply meaningful ${
    meaningfulCount === 1 ? 'moment' : 'moments'
  } and penned ${writtenReflectionsCount} handwritten reflections.`;

  return {
    title: `${monthName} ${year} Chapter`,
    summary,
    highlightTags: topTags,
    climateLabel: climate,
    reflectionsCount: writtenReflectionsCount,
  };
}
