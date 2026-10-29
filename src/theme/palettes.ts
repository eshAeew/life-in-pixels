import type { MoodType, ThemeId, ThemePalette } from '../types/index.ts';

export const CORE_COLORS = {
  warmIvory: '#FDFCF8',
  sage: '#E8EFE8',
  lavender: '#EFEDF4',
  coral: '#FFB7B2',
  coralDark: '#E59B96',
  primaryText: '#292524',
  mutedText: '#78716C',
  white: '#FFFFFF',
  borderStone: '#E7E5E4',
  borderSoft: '#F0EEE6',
  subtleCard: '#FAF9F5',
};

export const MOOD_CONFIG: Record<
  MoodType,
  {
    label: string;
    description: string;
    softlyColor: string;
    iconName: string;
    accessibleSymbol: string;
  }
> = {
  wonderful: {
    label: 'Wonderful',
    description: 'Joyful, uplifting, radiant moments',
    softlyColor: '#F7D486', // warm golden pastel
    iconName: 'Sun',
    accessibleSymbol: '★',
  },
  good: {
    label: 'Good',
    description: 'Pleasant, content, peaceful day',
    softlyColor: '#FFB7B2', // soft coral / peach
    iconName: 'Smile',
    accessibleSymbol: '▲',
  },
  okay: {
    label: 'Okay',
    description: 'Steady, ordinary, calm and gentle',
    softlyColor: '#C8DEC8', // soft sage green
    iconName: 'Meh',
    accessibleSymbol: '●',
  },
  low: {
    label: 'Low',
    description: 'Quiet, reflective, low energy or weary',
    softlyColor: '#CFCAE4', // muted lavender
    iconName: 'CloudRain',
    accessibleSymbol: '◆',
  },
  difficult: {
    label: 'Difficult',
    description: 'Heavy, challenging, or tough moments',
    softlyColor: '#B4C0CB', // soft blue-grey
    iconName: 'Wind',
    accessibleSymbol: '■',
  },
};

export const THEME_PALETTES: Record<ThemeId, ThemePalette> = {
  'softly-pastel': {
    id: 'softly-pastel',
    name: 'Softly Pastel',
    description: 'The signature warm journal palette with gentle coral and sage',
    colors: {
      wonderful: '#F7D486',
      good: '#FFB7B2',
      okay: '#C8DEC8',
      low: '#CFCAE4',
      difficult: '#B4C0CB',
    },
    unrecordedColor: '#F1EFEA',
    futureColor: '#FAF9F6',
  },
  botanical: {
    id: 'botanical',
    name: 'Botanical Garden',
    description: 'Natural garden tones inspired by fresh leaves, moss, and florals',
    colors: {
      wonderful: '#E5EEB4',
      good: '#A3D2A1',
      okay: '#7EAE8B',
      low: '#9AB4A2',
      difficult: '#647D6B',
    },
    unrecordedColor: '#ECEEE9',
    futureColor: '#F6F7F4',
  },
  'lavender-dreams': {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    description: 'Soothing lilacs, soft purples, and gentle misty evening hues',
    colors: {
      wonderful: '#FCE4EC',
      good: '#E5CBEB',
      okay: '#CFBAE8',
      low: '#B4A2D8',
      difficult: '#8E7EB3',
    },
    unrecordedColor: '#EFEBF2',
    futureColor: '#FAF7FC',
  },
  'warm-earth': {
    id: 'warm-earth',
    name: 'Warm Earth',
    description: 'Terracotta, ochre, clay, and grounding warmth of the soil',
    colors: {
      wonderful: '#F4C27F',
      good: '#E89874',
      okay: '#D4A373',
      low: '#C29482',
      difficult: '#8D6E63',
    },
    unrecordedColor: '#EFECE6',
    futureColor: '#FAF8F5',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Paper',
    description: 'Understated newsprint, graphite, and clean ink gradations',
    colors: {
      wonderful: '#F5F5F5',
      good: '#D6D6D6',
      okay: '#A3A3A3',
      low: '#737373',
      difficult: '#383838',
    },
    unrecordedColor: '#EAEAEA',
    futureColor: '#FAFAFA',
  },
  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm twilight hues from apricot dusk to dusky rose skies',
    colors: {
      wonderful: '#FDE047',
      good: '#FB923C',
      okay: '#F472B6',
      low: '#C084FC',
      difficult: '#818CF8',
    },
    unrecordedColor: '#F5ECEB',
    futureColor: '#FCF9F9',
  },
};
