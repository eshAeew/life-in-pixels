import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar as CalendarIcon,
  Grid,
  Clock,
  Layers,
  Sparkles,
  Info,
  Flag,
  Camera,
  Sun,
  Smile,
  Meh,
  CloudRain,
  Wind,
  CalendarDays,
  BookOpen,
  Compass,
  Heart,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { DailyEntry, Milestone, MoodType } from '../../types';
import { THEME_PALETTES, MOOD_CONFIG } from '../../theme/palettes';
import { formatDateKey, isFutureDate, calculateLifeTimeline, parseDateKey } from '../../utils/rules';
import { triggerHaptic } from '../../utils/haptics';
import { DayDetailModal } from '../../components/pixel-grid/DayDetailModal';

export type GridViewMode = 'month' | 'year' | 'multi-year' | 'lifetime';

interface LifeGridScreenProps {
  entries: DailyEntry[];
  milestones: Milestone[];
  themeId: string;
  weekStartsOn: 0 | 1;
  birthDate?: string;
  horizonYears: number;
  enableHaptics: boolean;
  showSymbols: boolean;
  onOpenCheckIn: (dateStr: string) => void;
  onDeleteEntry: (dateStr: string) => void;
  onUpdateBirthDate?: (birthDate: string) => void;
}

export const LifeGridScreen: React.FC<LifeGridScreenProps> = ({
  entries,
  milestones,
  themeId,
  weekStartsOn,
  birthDate,
  horizonYears,
  enableHaptics,
  showSymbols,
  onOpenCheckIn,
  onDeleteEntry,
  onUpdateBirthDate,
}) => {
  const [viewMode, setViewMode] = useState<GridViewMode>('month');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [inspectDate, setInspectDate] = useState<string | null>(null);
  const [setupBirthDate, setSetupBirthDate] = useState<string>('');

  // Lifetime perspective state
  const [activeHorizon, setActiveHorizon] = useState<number>(horizonYears);
  const [lifetimeSubView, setLifetimeSubView] = useState<'chapters' | 'tapestry' | 'currentYear'>('chapters');
  const [selectedWeek, setSelectedWeek] = useState<{
    yearIdx: number;
    weekIdx: number;
    totalWeekNumber: number;
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
    calYear: number;
    season: string;
    quarter: number;
  } | null>(null);
  const [expandedDecades, setExpandedDecades] = useState<Record<number, boolean>>({});

  const todayKey = formatDateKey(new Date());
  const palette = THEME_PALETTES[themeId as keyof typeof THEME_PALETTES] || THEME_PALETTES['softly-pastel'];

  // Map entries & milestones for O(1) lookup
  const entryMap = new Map<string, DailyEntry>();
  entries.forEach((e) => entryMap.set(e.date, e));

  const milestoneMap = new Map<string, Milestone>();
  milestones.forEach((m) => milestoneMap.set(m.date, m));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekdayLabels =
    weekStartsOn === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Change Month handler
  const handlePrevMonth = () => {
    triggerHaptic('light', enableHaptics);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic('light', enableHaptics);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Generate Month Days
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
  // Adjust based on weekStartsOn (1 = Monday, 0 = Sunday)
  const offset = weekStartsOn === 1 ? (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1) : firstDayOfWeek;

  const monthCells: Array<{ dayNumber: number; dateStr: string } | null> = [];
  for (let i = 0; i < offset; i++) {
    monthCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthFormatted = String(selectedMonth + 1).padStart(2, '0');
    const dayFormatted = String(d).padStart(2, '0');
    monthCells.push({
      dayNumber: d,
      dateStr: `${selectedYear}-${monthFormatted}-${dayFormatted}`,
    });
  }

  // Count recorded days in this month
  const recordedInMonth = entries.filter((e) =>
    e.date.startsWith(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`)
  ).length;

  const monthProgress = Math.round((recordedInMonth / daysInMonth) * 100);

  // Lifetime calculation - only calculates when user provides their real birthDate
  const isBirthDateSet = Boolean(birthDate && birthDate.trim().length > 0);
  const birthYear = isBirthDateSet ? parseInt(birthDate!.slice(0, 4), 10) : null;
  const timeline = isBirthDateSet ? calculateLifeTimeline(birthDate!, activeHorizon, todayKey) : null;
  const currentAge = timeline ? Math.floor(timeline.elapsedWeeks / 52.143) : null;
  const currentWeekOfAge = timeline ? Math.floor(timeline.elapsedWeeks % 52.143) : null;
  const currentCalYear = birthYear !== null && currentAge !== null ? birthYear + currentAge : null;

  const DECADE_THEMES = [
    { decade: 0, title: 'Childhood & First Wonders', years: 'Ages 0–9', quote: 'The first colors and senses of being alive.' },
    { decade: 1, title: 'Youth & Self-Discovery', years: 'Ages 10–19', quote: 'Finding your voice and following curiosities.' },
    { decade: 2, title: 'Independence & Becoming', years: 'Ages 20–29', quote: 'Stepping into the world, learning resilience and courage.' },
    { decade: 3, title: 'Depth & Foundations', years: 'Ages 30–39', quote: 'Nurturing deep roots, craft, and authentic love.' },
    { decade: 4, title: 'Mastery & Creative Peak', years: 'Ages 40–49', quote: 'Living with confidence and clear perspective.' },
    { decade: 5, title: 'Perspective & Generosity', years: 'Ages 50–59', quote: 'Savoring the rich harvest of experience.' },
    { decade: 6, title: 'Freedom & Reflection', years: 'Ages 60–69', quote: 'New chapters, gentle mornings, and inner peace.' },
    { decade: 7, title: 'Wisdom & Cherished Days', years: 'Ages 70–79', quote: 'Deep gratitude for every ordinary beauty.' },
    { decade: 8, title: 'Grace & Legacy', years: 'Ages 80–89', quote: 'Living lightly and leaving quiet warmth behind.' },
    { decade: 9, title: 'Centenarian Journey', years: 'Ages 90+', quote: 'A long, full tapestry of human living.' },
  ];

  const seasonsList = ['Winter / Reset', 'Spring / Growth', 'Summer / Energy', 'Autumn / Harvest'];

  return (
    <div className="space-y-5 pb-10">
      {/* View Mode Segmented Controls */}
      <div className="bg-[#FFFFFF] p-1.5 rounded-2xl border border-[#EFECE6] flex items-center justify-between shadow-xs">
        {[
          { id: 'month', label: 'Month', icon: CalendarIcon },
          { id: 'year', label: 'Year', icon: Grid },
          { id: 'multi-year', label: '3-Year', icon: Layers },
          { id: 'lifetime', label: 'Lifetime', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection', enableHaptics);
                setViewMode(tab.id as GridViewMode);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#292524] hover:bg-[#FAF9F5]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- 1. ENHANCED MONTH VIEW --- */}
      {viewMode === 'month' && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-5 sm:p-6 shadow-soft space-y-5">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                Calendar Tapestry
              </span>
              <h2 className="text-xl font-bold text-[#292524] tracking-tight">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-2 rounded-xl border border-[#EFECE6] hover:bg-[#FAF9F5] text-[#78716C] hover:text-[#292524] transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedMonth(new Date().getMonth());
                  setSelectedYear(new Date().getFullYear());
                }}
                className="px-3 py-1.5 rounded-xl border border-[#EFECE6] hover:bg-[#FAF9F5] text-xs font-semibold text-[#292524] cursor-pointer shadow-2xs"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-2 rounded-xl border border-[#EFECE6] hover:bg-[#FAF9F5] text-[#78716C] hover:text-[#292524] transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Month Progress & Stats Bar */}
          <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#292524]">
                {recordedInMonth} of {daysInMonth} days recorded
              </span>
              <div className="w-40 sm:w-56 h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FFB7B2] transition-all duration-500"
                  style={{ width: `${monthProgress}%` }}
                />
              </div>
            </div>

            <span className="text-xs font-bold text-[#FFB7B2] bg-white px-2.5 py-1 rounded-xl border border-[#EFECE6] shadow-2xs">
              {monthProgress}% colored
            </span>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {weekdayLabels.map((lbl) => (
              <span key={lbl} className="text-[11px] font-bold uppercase tracking-wider text-[#A8A29E] py-0.5">
                {lbl}
              </span>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {monthCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const entry = entryMap.get(cell.dateStr);
              const milestone = milestoneMap.get(cell.dateStr);
              const isToday = cell.dateStr === todayKey;
              const isFuture = isFutureDate(cell.dateStr, todayKey);

              const cellBg = entry
                ? entry.pixelColor
                : isFuture
                ? '#FAF9F6'
                : palette.unrecordedColor;

              const hasPhoto = entry?.photos && entry.photos.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => {
                    triggerHaptic('light', enableHaptics);
                    setInspectDate(cell.dateStr);
                  }}
                  aria-label={`Date ${cell.dateStr}: ${entry?.mood || (isFuture ? 'Future' : 'Unrecorded')}`}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all relative cursor-pointer border ${
                    isToday
                      ? 'ring-2 ring-[#292524] ring-offset-2 border-[#292524]/20 shadow-sm scale-102'
                      : 'border-black/5 hover:scale-105 active:scale-95 hover:shadow-xs'
                  }`}
                  style={{ backgroundColor: cellBg }}
                >
                  {/* Top row: day number & photo badge */}
                  <div className="w-full flex items-center justify-between leading-none">
                    <span
                      className={`text-[11px] font-bold ${
                        entry ? 'text-[#292524]' : isFuture ? 'text-[#C5C0B8]' : 'text-[#78716C]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasPhoto && (
                      <Camera size={10} className="text-[#292524]/70" />
                    )}
                  </div>

                  {/* Middle row: vector mood icon if recorded */}
                  <div className="flex items-center justify-center my-auto">
                    {entry && (
                      <span className="text-[#292524]/80">
                        {entry.mood === 'wonderful' && <Sun size={15} className="stroke-[2.2]" />}
                        {entry.mood === 'good' && <Smile size={15} className="stroke-[2.2]" />}
                        {entry.mood === 'okay' && <Meh size={15} className="stroke-[2.2]" />}
                        {entry.mood === 'low' && <CloudRain size={15} className="stroke-[2.2]" />}
                        {entry.mood === 'difficult' && <Wind size={15} className="stroke-[2.2]" />}
                      </span>
                    )}
                  </div>

                  {/* Bottom row: Milestone dot */}
                  <div className="h-1.5 flex items-center justify-center">
                    {milestone && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#292524] ring-1 ring-white"
                        title={milestone.title}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-3 border-t border-[#F0EEE6] flex items-center justify-between text-[11px] text-[#78716C] flex-wrap gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              {(Object.keys(palette.colors) as MoodType[]).map((m) => (
                <div key={m} className="flex items-center gap-1.5 bg-[#FAF9F5] px-2 py-1 rounded-lg border border-[#F0EEE6]">
                  <div
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.colors[m] }}
                  />
                  <span className="capitalize font-medium">{m}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF9F5] px-2 py-1 rounded-lg border border-[#F0EEE6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#292524]" />
              <span className="font-medium">Milestone</span>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. YEAR VIEW --- */}
      {viewMode === 'year' && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-5 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#292524]">{selectedYear} Full Year</h2>
              <p className="text-xs text-[#78716C]">
                365 days of light, color, and quiet memories.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-1.5 rounded-xl border border-[#EFECE6] hover:bg-[#FAF9F5] text-[#78716C]"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-bold text-xs text-[#292524]">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-1.5 rounded-xl border border-[#EFECE6] hover:bg-[#FAF9F5] text-[#78716C]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 12 Mini Monthly Grids */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {monthNames.map((mName, mIdx) => {
              const numDays = new Date(selectedYear, mIdx + 1, 0).getDate();
              const firstDay = new Date(selectedYear, mIdx, 1).getDay();
              const mOffset = weekStartsOn === 1 ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;

              return (
                <div
                  key={mName}
                  onClick={() => {
                    setSelectedMonth(mIdx);
                    setViewMode('month');
                    triggerHaptic('light', enableHaptics);
                  }}
                  className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] hover:border-[#D6D3CD] transition-all cursor-pointer group hover:bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#292524] group-hover:text-[#FFB7B2]">
                      {mName}
                    </span>
                    <Maximize2 size={11} className="text-[#A8A29E] opacity-0 group-hover:opacity-100" />
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: mOffset }).map((_, i) => (
                      <div key={`m-empty-${i}`} className="w-2.5 h-2.5" />
                    ))}
                    {Array.from({ length: numDays }).map((_, dIdx) => {
                      const dNum = dIdx + 1;
                      const dateStr = `${selectedYear}-${String(mIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                      const entry = entryMap.get(dateStr);
                      const isFuture = isFutureDate(dateStr, todayKey);
                      const isToday = dateStr === todayKey;

                      const color = entry
                        ? entry.pixelColor
                        : isFuture
                        ? '#FAF9F6'
                        : palette.unrecordedColor;

                      return (
                        <div
                          key={dateStr}
                          className={`w-2.5 h-2.5 rounded-sm border border-black/5 ${
                            isToday ? 'ring-1 ring-[#292524]' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          title={`${dateStr}: ${entry?.mood || (isFuture ? 'Future' : 'Unrecorded')}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- 3. MULTI-YEAR VIEW --- */}
      {viewMode === 'multi-year' && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-5 shadow-soft space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#292524]">Three-Year Tapestry</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Viewing 2024, 2025, and 2026 side-by-side.
            </p>
          </div>

          {[2024, 2025, 2026].map((yr) => (
            <div key={yr} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#292524]">{yr}</span>
                <span className="text-[11px] text-[#78716C]">
                  {entries.filter((e) => e.date.startsWith(`${yr}-`)).length} recorded days
                </span>
              </div>

              <div className="flex flex-wrap gap-1 p-3 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6]">
                {Array.from({ length: yr % 4 === 0 ? 366 : 365 }).map((_, idx) => {
                  const day = new Date(yr, 0, idx + 1);
                  const dateStr = formatDateKey(day);
                  const entry = entryMap.get(dateStr);
                  const isFuture = isFutureDate(dateStr, todayKey);

                  const bg = entry
                    ? entry.pixelColor
                    : isFuture
                    ? '#FAF9F6'
                    : palette.unrecordedColor;

                  return (
                    <div
                      key={dateStr}
                      className="w-2 h-2 rounded-[2px] border border-black/5"
                      style={{ backgroundColor: bg }}
                      title={`${dateStr}: ${entry?.mood || (isFuture ? 'Future' : 'Unrecorded')}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- 4. ELEVATED MINDFUL LIFETIME TAPESTRY --- */}
      {viewMode === 'lifetime' && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-4 sm:p-6 shadow-soft space-y-6">
          {/* Header & Perspective Selector */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9776A] uppercase tracking-wider bg-[#FFF2F0] px-2.5 py-1 rounded-full whitespace-nowrap">
                <Sparkles size={12} className="text-[#FFB7B2]" />
                <span>Mindful Life Tapestry</span>
              </span>
              <span className="text-xs text-[#78716C] font-medium hidden sm:inline-block">
                {activeHorizon} Years Horizon
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#292524] tracking-tight">
                The Tapestry of Your Life
              </h2>
              <p className="text-xs text-[#78716C] leading-relaxed mt-1">
                Inspired by the <em>Four Thousand Weeks</em> philosophy. Each square is one seven-day
                chapter of choices, growth, quiet Tuesdays, and memories.
              </p>
            </div>

            {/* Horizon Scenario Quick Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EEE6]">
              <span className="text-xs font-medium text-[#78716C]">Scenario Horizon:</span>
              <div className="inline-flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#EFECE6]">
                {[75, 80, 85, 90, 100].map((years) => (
                  <button
                    key={years}
                    onClick={() => {
                      triggerHaptic('light', enableHaptics);
                      setActiveHorizon(years);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeHorizon === years
                        ? 'bg-[#292524] text-white shadow-xs'
                        : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
                    }`}
                  >
                    {years}y
                  </button>
                ))}
              </div>
            </div>
          </div>

          {timeline && (
            <div className="space-y-4">
              {/* Mindful Life Horizon Journey Bar */}
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#FFF0EE] text-[#D9776A] flex items-center justify-center shrink-0">
                      <Compass size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#292524] block truncate">
                        Life Horizon Progress
                      </span>
                      <span className="text-[10px] text-[#A8A29E] block">
                        {activeHorizon} Years • {timeline.totalWeeks.toLocaleString()} Weeks Total
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-[#D9776A] bg-[#FFF0EE] px-2.5 py-1 rounded-full text-xs shrink-0">
                    {timeline.horizonPercentage}% Lived
                  </span>
                </div>

                {/* Smooth Progress Track */}
                <div className="relative w-full h-2.5 bg-[#EAE6DD] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFD3D0] via-[#FFB7B2] to-[#E5989B] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, timeline.horizonPercentage))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-0.5">
                  <span className="text-[#8C827A]">
                    {isBirthDateSet ? `Birth (${birthYear})` : `Baseline (${birthYear})`}
                  </span>
                  <span className="font-semibold text-[#292524] bg-white px-2 py-0.5 rounded-md border border-[#E8E4DA] shadow-2xs text-[11px] whitespace-nowrap">
                    ✦ Age {currentAge} • W{currentWeekOfAge + 1} (Now)
                  </span>
                  <span className="text-[#8C827A]">Horizon ({birthYear + activeHorizon})</span>
                </div>
              </div>

              {!isBirthDateSet && (
                <div className="px-3.5 py-2.5 bg-[#FAF9F5] border border-[#EFECE6] rounded-2xl text-[11px] text-[#78716C] flex items-center gap-2">
                  <Info size={13} className="text-[#D9776A] shrink-0" />
                  <span>Set your birth date in Settings anytime to calibrate your exact weeks.</span>
                </div>
              )}

              {/* 4 Balanced Cards in 2x2 grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#F0EEE6] flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FFF0EE] text-[#E5989B] flex items-center justify-center shrink-0">
                      <CalendarDays size={14} />
                    </div>
                    <span className="text-[11px] text-[#78716C] font-semibold uppercase tracking-wider">
                      Weeks Lived
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-bold text-[#292524] tracking-tight">
                      {timeline.elapsedWeeks.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#8C827A] mt-0.5">
                      ~{(timeline.elapsedWeeks / 52.143).toFixed(1)} years of experience
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#F0EEE6] flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FDF6E2] text-[#D97706] flex items-center justify-center shrink-0">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-[11px] text-[#78716C] font-semibold uppercase tracking-wider">
                      Weeks Ahead
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-bold text-[#292524] tracking-tight">
                      {timeline.remainingWeeks.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#8C827A] mt-0.5">
                      Unwritten possibilities
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#F0EEE6] flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#52796F] flex items-center justify-center shrink-0">
                      <Clock size={14} />
                    </div>
                    <span className="text-[11px] text-[#78716C] font-semibold uppercase tracking-wider">
                      Current Year
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-bold text-[#292524] tracking-tight">
                      Week {currentWeekOfAge + 1}
                      <span className="text-xs font-normal text-[#78716C]"> / 52</span>
                    </div>
                    <div className="text-[11px] text-[#8C827A] mt-0.5">
                      {Math.max(0, 52 - currentWeekOfAge - 1)} weeks left in {currentCalYear}
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#F0EEE6] flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F3EDF8] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      <Flag size={14} />
                    </div>
                    <span className="text-[11px] text-[#78716C] font-semibold uppercase tracking-wider">
                      Milestones
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl sm:text-2xl font-bold text-[#292524] tracking-tight">
                      {milestones.length}
                    </div>
                    <div className="text-[11px] text-[#8C827A] mt-0.5">
                      Life markers recorded
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subview Selector */}
          <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-2xl border border-[#EFECE6]">
            {[
              { id: 'chapters', label: 'Decade Chapters', icon: BookOpen },
              { id: 'tapestry', label: 'Full 80-Year Canvas', icon: Grid },
              { id: 'currentYear', label: `Age ${currentAge} Spotlight`, icon: Sparkles },
            ].map((sub) => {
              const Icon = sub.icon;
              const isActive = lifetimeSubView === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    triggerHaptic('selection', enableHaptics);
                    setLifetimeSubView(sub.id as any);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#292524] shadow-xs border border-[#EFECE6]'
                      : 'text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-[#FFB7B2]' : ''} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Seasonal Legend & Structure */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78716C] px-2 py-2 bg-[#FAF9F5] rounded-xl border border-[#F0EEE6]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#292524] ring-1 ring-[#FFB7B2]" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E5989B]" /> Lived
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#FAF8F5] border border-[#DDD6CC]" /> Unwritten
              </span>
            </div>
            <div className="text-[10px] text-[#A8A29E] font-medium">
              4 Seasons • 13 Weeks Each (Q1 Winter • Q2 Spring • Q3 Summer • Q4 Autumn)
            </div>
          </div>

          {/* --- SUBVIEW 1: DECADE CHAPTERS --- */}
          {lifetimeSubView === 'chapters' && (
            <div className="space-y-4">
              {Array.from({ length: Math.ceil(activeHorizon / 10) }).map((_, decadeIdx) => {
                const decadeStartAge = decadeIdx * 10;
                const decadeEndAge = Math.min(activeHorizon - 1, decadeStartAge + 9);
                const isCurrentDecade = currentAge >= decadeStartAge && currentAge <= decadeEndAge;
                const isPastDecade = currentAge > decadeEndAge;
                const isExpanded = expandedDecades[decadeIdx] !== false; // expanded by default or toggled
                const themeInfo = DECADE_THEMES[decadeIdx] || {
                  title: `Decade ${decadeIdx + 1}`,
                  years: `Ages ${decadeStartAge}–${decadeEndAge}`,
                  quote: 'Every season brings its own quiet wisdom.',
                };

                // Milestones in this decade
                const decadeMilestones = milestones.filter((m) => {
                  const mYear = parseDateKey(m.date).getFullYear();
                  const mAge = mYear - birthYear;
                  return mAge >= decadeStartAge && mAge <= decadeEndAge;
                });

                return (
                  <div
                    key={decadeIdx}
                    className={`rounded-2xl border transition-all ${
                      isCurrentDecade
                        ? 'border-[#FFB7B2] bg-gradient-to-b from-[#FFFDFC] to-[#FAF9F5] shadow-xs'
                        : isPastDecade
                        ? 'border-[#EFECE6] bg-[#FFFFFF]'
                        : 'border-[#F2EFE9] bg-[#FCFBF8]'
                    }`}
                  >
                    {/* Decade Card Header */}
                    <button
                      onClick={() => {
                        triggerHaptic('light', enableHaptics);
                        setExpandedDecades((prev) => ({
                          ...prev,
                          [decadeIdx]: !isExpanded,
                        }));
                      }}
                      className="w-full p-4 flex items-center justify-between cursor-pointer text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#292524]">
                            Ages {decadeStartAge}–{decadeEndAge}
                          </span>
                          <span className="text-xs text-[#78716C]">• {themeInfo.title}</span>
                          {isCurrentDecade && (
                            <span className="text-[10px] font-semibold bg-[#292524] text-white px-2 py-0.5 rounded-full">
                              ✦ Present Chapter
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A8A29E] italic">
                          "{themeInfo.quote}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {decadeMilestones.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#8B5CF6] bg-[#F3EDF8] px-2 py-0.5 rounded-md">
                            <Flag size={11} /> {decadeMilestones.length}
                          </span>
                        )}
                        <div className="w-6 h-6 rounded-lg bg-[#FAF9F5] border border-[#EFECE6] flex items-center justify-center text-[#78716C]">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </button>

                    {/* Decade Expanded Grid */}
                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-2 border-t border-[#F0EEE6]/80 mt-1">
                        {/* Milestones chips if present */}
                        {decadeMilestones.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 py-2">
                            {decadeMilestones.map((m) => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52796F] bg-[#EBF5EE] px-2.5 py-0.5 rounded-full border border-[#D5E8D8]"
                              >
                                <Star size={10} className="text-[#3D7058]" />
                                <span>{m.title}</span>
                                <span className="text-[9px] text-[#78716C]">
                                  (Age {parseDateKey(m.date).getFullYear() - birthYear})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 10 Year Rows with 4 Season Quarters */}
                        <div className="space-y-1.5">
                          {Array.from({ length: decadeEndAge - decadeStartAge + 1 }).map((_, offset) => {
                            const yearIdx = decadeStartAge + offset;
                            const isCurrentYear = yearIdx === currentAge;
                            const isPastYear = yearIdx < currentAge;
                            const calYr = birthYear + yearIdx;

                            return (
                              <div
                                key={yearIdx}
                                className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${
                                  isCurrentYear ? 'bg-[#FFF2F0]/50 ring-1 ring-[#FFB7B2]/40' : ''
                                }`}
                              >
                                <div className="w-16 shrink-0 flex items-center justify-between text-[11px]">
                                  <span className={`font-semibold ${isCurrentYear ? 'text-[#D9776A]' : 'text-[#44403C]'}`}>
                                    Age {yearIdx}
                                  </span>
                                  <span className="text-[10px] text-[#A8A29E] font-mono">
                                    {calYr}
                                  </span>
                                </div>

                                {/* 4 Seasonal Quarters (13 weeks each) */}
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {[0, 1, 2, 3].map((quarterIdx) => (
                                    <div key={quarterIdx} className="flex gap-[2px] flex-1">
                                      {Array.from({ length: 13 }).map((_, qWeekIdx) => {
                                        const weekIdx = quarterIdx * 13 + qWeekIdx;
                                        const totalWeekNumber = yearIdx * 52 + weekIdx;
                                        const isPastWeek = timeline ? totalWeekNumber < timeline.elapsedWeeks : false;
                                        const isCurrentWeek =
                                          timeline ? totalWeekNumber === timeline.elapsedWeeks : false;
                                        const isFutureWeek = !isPastWeek && !isCurrentWeek;

                                        let cellBg = '#FAF8F5'; // Future
                                        let borderClass = 'border-[#E7E2D8]';

                                        if (isCurrentWeek) {
                                          cellBg = '#292524';
                                          borderClass = 'ring-2 ring-[#FFB7B2] border-transparent scale-110 z-10';
                                        } else if (isPastWeek) {
                                          if (isCurrentYear) {
                                            cellBg = '#FFB7B2';
                                            borderClass = 'border-[#F29F98]';
                                          } else {
                                            cellBg = '#D6D0C5';
                                            borderClass = 'border-[#C7C0B4]';
                                          }
                                        }

                                        return (
                                          <button
                                            key={weekIdx}
                                            onClick={() => {
                                              triggerHaptic('selection', enableHaptics);
                                              setSelectedWeek({
                                                yearIdx,
                                                weekIdx,
                                                totalWeekNumber,
                                                isPast: isPastWeek,
                                                isCurrent: isCurrentWeek,
                                                isFuture: isFutureWeek,
                                                calYear: calYr,
                                                season: seasonsList[quarterIdx],
                                                quarter: quarterIdx + 1,
                                              });
                                            }}
                                            className={`h-2.5 sm:h-3 flex-1 rounded-[1.5px] border transition-transform hover:scale-135 hover:z-20 cursor-pointer ${borderClass}`}
                                            style={{ backgroundColor: cellBg }}
                                            title={`Age ${yearIdx} (${calYr}), Week ${weekIdx + 1} • Q${quarterIdx + 1}`}
                                          />
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- SUBVIEW 2: FULL 80-YEAR CANVAS --- */}
          {lifetimeSubView === 'tapestry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#78716C] px-1">
                <span>All {activeHorizon} Years Overview</span>
                <button
                  onClick={() => {
                    const el = document.getElementById(`life-year-row-${currentAge}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      triggerHaptic('selection', enableHaptics);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D9776A] hover:underline cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>Jump to Age {currentAge} (Now)</span>
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto no-scrollbar p-2 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] space-y-1">
                {Array.from({ length: activeHorizon }).map((_, yearIdx) => {
                  const isCurrentYear = yearIdx === currentAge;
                  const isPastYear = yearIdx < currentAge;
                  const calYr = birthYear + yearIdx;

                  return (
                    <div
                      key={yearIdx}
                      id={`life-year-row-${yearIdx}`}
                      className={`flex items-center gap-2 p-0.5 rounded transition-colors ${
                        isCurrentYear ? 'bg-[#FFF0EE] ring-1 ring-[#FFB7B2]' : ''
                      }`}
                    >
                      <div className="w-14 shrink-0 flex items-center justify-between text-[10px] font-mono">
                        <span className={`font-semibold ${isCurrentYear ? 'text-[#D9776A]' : 'text-[#78716C]'}`}>
                          {yearIdx}
                        </span>
                        <span className="text-[#A8A29E] text-[9px]">{calYr}</span>
                      </div>

                      {/* 4 Quarters */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {[0, 1, 2, 3].map((quarterIdx) => (
                          <div key={quarterIdx} className="flex gap-[1.5px] flex-1">
                            {Array.from({ length: 13 }).map((_, qWeekIdx) => {
                              const weekIdx = quarterIdx * 13 + qWeekIdx;
                              const totalWeekNumber = yearIdx * 52 + weekIdx;
                              const isPastWeek = timeline ? totalWeekNumber < timeline.elapsedWeeks : false;
                              const isCurrentWeek =
                                timeline ? totalWeekNumber === timeline.elapsedWeeks : false;
                              const isFutureWeek = !isPastWeek && !isCurrentWeek;

                              let cellBg = '#FFFFFF';
                              let borderClass = 'border-[#EAE6DD]';

                              if (isCurrentWeek) {
                                cellBg = '#292524';
                                borderClass = 'ring-1 ring-[#FFB7B2] border-transparent scale-125 z-10';
                              } else if (isPastWeek) {
                                cellBg = isCurrentYear ? '#FFB7B2' : '#D6D0C5';
                                borderClass = 'border-transparent';
                              }

                              return (
                                <button
                                  key={weekIdx}
                                  onClick={() => {
                                    triggerHaptic('selection', enableHaptics);
                                    setSelectedWeek({
                                      yearIdx,
                                      weekIdx,
                                      totalWeekNumber,
                                      isPast: isPastWeek,
                                      isCurrent: isCurrentWeek,
                                      isFuture: isFutureWeek,
                                      calYear: calYr,
                                      season: seasonsList[quarterIdx],
                                      quarter: quarterIdx + 1,
                                    });
                                  }}
                                  className={`h-2 flex-1 rounded-[1px] border cursor-pointer hover:scale-135 transition-transform ${borderClass}`}
                                  style={{ backgroundColor: cellBg }}
                                  title={`Age ${yearIdx} (${calYr}), Week ${weekIdx + 1}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SUBVIEW 3: CURRENT YEAR SPOTLIGHT --- */}
          {lifetimeSubView === 'currentYear' && (
            <div className="space-y-4">
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#F0EEE6] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#292524]">
                    Age {currentAge} • Year {currentCalYear}
                  </h3>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Week {currentWeekOfAge + 1} of 52 is active today. {Math.max(0, 52 - currentWeekOfAge - 1)} weeks remaining this year.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#FFF0EE] text-[#D9776A] flex items-center justify-center font-bold text-sm">
                  {Math.round(((currentWeekOfAge + 1) / 52) * 100)}%
                </div>
              </div>

              {/* 4 Seasons breakdown for the current year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Q1 Winter', weeks: [0, 12], theme: 'New Beginnings & Rest', bg: 'bg-[#F4F7F6]' },
                  { name: 'Q2 Spring', weeks: [13, 25], theme: 'Growth & Awakening', bg: 'bg-[#F7F9F5]' },
                  { name: 'Q3 Summer', weeks: [26, 38], theme: 'Vitality & Long Days', bg: 'bg-[#FFFDF5]' },
                  { name: 'Q4 Autumn', weeks: [39, 51], theme: 'Harvest & Gratitude', bg: 'bg-[#FFF7F4]' },
                ].map((s, sIdx) => {
                  const isCurrentSeason = currentWeekOfAge >= s.weeks[0] && currentWeekOfAge <= s.weeks[1];
                  return (
                    <div
                      key={s.name}
                      className={`p-3.5 rounded-2xl border ${
                        isCurrentSeason ? 'border-[#FFB7B2] bg-white shadow-xs' : 'border-[#EFECE6] bg-[#FAF9F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold text-[#292524]">{s.name}</span>
                          <span className="text-[10px] text-[#78716C] block">{s.theme}</span>
                        </div>
                        {isCurrentSeason && (
                          <span className="text-[10px] font-semibold bg-[#292524] text-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                        {Array.from({ length: 13 }).map((_, wOffset) => {
                          const wNum = s.weeks[0] + wOffset;
                          const isWCurrent = wNum === currentWeekOfAge;
                          const isWPast = wNum < currentWeekOfAge;

                          return (
                            <button
                              key={wNum}
                              onClick={() => {
                                triggerHaptic('selection', enableHaptics);
                                setSelectedWeek({
                                  yearIdx: currentAge,
                                  weekIdx: wNum,
                                  totalWeekNumber: currentAge * 52 + wNum,
                                  isPast: isWPast,
                                  isCurrent: isWCurrent,
                                  isFuture: !isWPast && !isWCurrent,
                                  calYear: currentCalYear,
                                  season: s.name,
                                  quarter: sIdx + 1,
                                });
                              }}
                              className={`aspect-square rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                                isWCurrent
                                  ? 'bg-[#292524] ring-2 ring-[#FFB7B2]'
                                  : isWPast
                                  ? 'bg-[#FFB7B2]'
                                  : 'bg-white border border-[#E0DCD3]'
                              }`}
                              title={`Week ${wNum + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gentle Mindful Footer */}
          <div className="p-3.5 bg-[#FAF9F5] border border-[#EFECE6] rounded-2xl flex items-center gap-3 text-xs text-[#292524]">
            <Heart size={16} className="text-[#FFB7B2] shrink-0" />
            <p className="leading-relaxed">
              Every row and block is a reminder that time is not something to rush through, but a quiet
              canvas to inhabit with presence, warmth, and care.
            </p>
          </div>
        </div>
      )}

      {/* Week Detail Modal */}
      {selectedWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-soft space-y-4 border border-[#EFECE6]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#D9776A] uppercase tracking-wider bg-[#FFF2F0] px-2.5 py-0.5 rounded-full">
                  {selectedWeek.season}
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-2">
                  Age {selectedWeek.yearIdx} • Week {selectedWeek.weekIdx + 1}
                </h3>
                <p className="text-xs text-[#78716C]">
                  Calendar Year {selectedWeek.calYear} (Quarter {selectedWeek.quarter})
                </p>
              </div>
              <button
                onClick={() => setSelectedWeek(null)}
                className="w-8 h-8 rounded-full bg-[#FAF9F5] flex items-center justify-center text-[#78716C] hover:text-[#292524] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] space-y-2">
              <div className="flex items-center gap-2">
                {selectedWeek.isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#292524]">
                    <Sparkles size={14} className="text-[#FFB7B2]" /> You are living this week right now!
                  </span>
                ) : selectedWeek.isPast ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#52796F]">
                    <CheckCircle2 size={14} className="text-[#52796F]" /> A woven chapter of your past
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78716C]">
                    <Compass size={14} className="text-[#A8A29E]" /> A future week waiting for your story
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78716C] leading-relaxed">
                {selectedWeek.isCurrent
                  ? '7 full days to be gentle with yourself, savor quiet rituals, and bring presence to whatever comes.'
                  : selectedWeek.isPast
                  ? `Completed during your ${selectedWeek.yearIdx}th year of life. Every memory here is part of your unique story.`
                  : `Waiting ahead in your timeline. What kind of person do you wish to be when you reach this week?`}
              </p>
            </div>

            <button
              onClick={() => setSelectedWeek(null)}
              className="w-full py-2.5 bg-[#292524] text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Day Inspector Modal */}
      {inspectDate && (
        <DayDetailModal
          date={inspectDate}
          entry={entryMap.get(inspectDate)}
          milestone={milestoneMap.get(inspectDate)}
          isOpen={!!inspectDate}
          onClose={() => setInspectDate(null)}
          onEdit={(d) => {
            setInspectDate(null);
            onOpenCheckIn(d);
          }}
          onDelete={onDeleteEntry}
          enableHaptics={enableHaptics}
          showSymbols={showSymbols}
        />
      )}
    </div>
  );
};
