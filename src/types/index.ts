export type MoodType = 'wonderful' | 'good' | 'okay' | 'low' | 'difficult';

export type RatingScale = 1 | 2 | 3 | 4 | 5;

export interface MeaningAnswer {
  id: string;
  question: string;
  answeredYes: boolean;
}

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  mood: MoodType;
  overallRating?: RatingScale;
  energyRating?: RatingScale;
  stressRating?: RatingScale;
  meaningRating?: RatingScale;
  meaningResponses?: MeaningAnswer[];
  tags: string[];
  reflection?: string;
  photos?: string[];
  pixelColor: string;
  isCustomColor?: boolean;
  symbolPattern?: 'dot' | 'cross' | 'star' | 'circle' | 'none';
  isCompleted: boolean;
}

export interface Milestone {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  category: 'life' | 'career' | 'relationship' | 'health' | 'creative' | 'travel' | 'other';
  color?: string;
  isFutureGoal?: boolean;
  createdAt: string;
}

export interface Memory {
  id: string;
  date: string;
  title?: string;
  text: string;
  tags: string[];
  photos: string[];
  isFavorite: boolean;
  mood?: MoodType;
  milestoneId?: string;
  createdAt: string;
}

export type ThemeId = 'softly-pastel' | 'botanical' | 'lavender-dreams' | 'warm-earth' | 'monochrome' | 'sunset-glow';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  description: string;
  colors: Record<MoodType, string>;
  unrecordedColor: string;
  futureColor: string;
}

export interface UserSettings {
  displayName: string;
  birthDate?: string; // YYYY-MM-DD
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  themeId: ThemeId;
  customMoodColors?: Partial<Record<MoodType, string>>;
  horizonYears: number;
  customStartDate?: string;
  enableHaptics: boolean;
  reducedMotion: boolean;
  remindersEnabled: boolean;
  reminderTime: string;
  reminderStyle: 'gentle' | 'poetic' | 'mindful';
  showAccessibilitySymbols: boolean;
  onboardingCompleted: boolean;
  viewportMode: 'mobile-frame' | 'responsive';
}
