import React, { useState } from 'react';
import {
  Sparkles,
  Edit3,
  Calendar,
  Check,
  ChevronRight,
  Heart,
  BookOpen,
  Sun,
  Smile,
  Meh,
  CloudRain,
  Wind,
  Flame,
  Eye,
  Play,
  Compass,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import type { DailyEntry, Memory, Milestone } from '../../types';
import { MOOD_CONFIG, THEME_PALETTES } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';
import { calculateCurrentStreak, formatDateKey, parseDateKey } from '../../utils/rules';
import { MindfulExercisesModal, ExerciseType } from '../mindfulness/MindfulExercisesModal';

interface TodayScreenProps {
  todayDate: string; // '2026-10-20'
  todayEntry?: DailyEntry;
  recentEntries: DailyEntry[];
  recentMemories: Memory[];
  milestones: Milestone[];
  displayName?: string;
  themeId: string;
  enableHaptics: boolean;
  onOpenCheckIn: (date: string) => void;
  onNavigateToLife: () => void;
  onNavigateToMemories: () => void;
  onAddMilestone?: (milestone: Milestone) => void;
  onNavigateToMilestones?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  todayDate,
  todayEntry,
  recentEntries,
  recentMemories,
  milestones,
  displayName,
  themeId,
  enableHaptics,
  onOpenCheckIn,
  onNavigateToLife,
  onNavigateToMemories,
  onAddMilestone,
  onNavigateToMilestones,
}) => {
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [activeExerciseType, setActiveExerciseType] = useState<ExerciseType>('breathing');
  const [copiedReflection, setCopiedReflection] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [inspectedDay, setInspectedDay] = useState<{ dateStr: string; entry?: DailyEntry } | null>(null);
  const isRecorded = !!todayEntry?.isCompleted;
  const moodInfo = todayEntry?.mood ? MOOD_CONFIG[todayEntry.mood] : null;
  const palette = THEME_PALETTES[themeId as keyof typeof THEME_PALETTES] || THEME_PALETTES['softly-pastel'];

  // Calculate Streak
  const streakInfo = calculateCurrentStreak(recentEntries, todayDate);

  // Past 7 days strip
  const past7Days: Array<{ dateStr: string; label: string; entry?: DailyEntry }> = [];
  const todayObj = todayDate ? parseDateKey(todayDate) : new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayObj);
    d.setDate(todayObj.getDate() - i);
    const dateFormatted = formatDateKey(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const match = recentEntries.find((e) => e.date === dateFormatted);
    past7Days.push({
      dateStr: dateFormatted,
      label: dayName,
      entry: match,
    });
  }

  return (
    <div className="space-y-5 pb-10">
      {/* CURRENT STREAK CARD — Displayed at the very top of TodayScreen */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-4.5 shadow-soft relative overflow-hidden transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFB7B2]/25 border border-[#FFB7B2]/40 text-[#E59B96] flex items-center justify-center shadow-xs">
              <Flame size={22} className="fill-[#FFB7B2] text-[#E59B96]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                  Current Streak
                </span>
                {streakInfo.longestStreak > 0 && (
                  <span className="text-[10px] bg-[#FAF9F5] border border-[#F0EEE6] px-2 py-0.5 rounded-full text-[#78716C] font-medium">
                    Best: {streakInfo.longestStreak}d
                  </span>
                )}
              </div>

              <div className="text-xl font-bold text-[#292524] mt-0.5 tracking-tight flex items-baseline gap-2">
                <span>{streakInfo.currentStreak}</span>
                <span className="text-xs font-semibold text-[#78716C]">
                  {streakInfo.currentStreak === 1 ? 'consecutive day' : 'consecutive days'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            {streakInfo.isRecordedToday ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7EAE8B] bg-[#E8EFE8]/70 px-2.5 py-1 rounded-full border border-[#C8DEC8]/50">
                <Check size={12} strokeWidth={3} /> Active Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#78716C] bg-[#FAF9F5] px-2.5 py-1 rounded-full border border-[#EFECE6]">
                Pending Today
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-[#78716C] mt-2.5 pt-2.5 border-t border-[#F0EEE6] leading-relaxed">
          {streakInfo.isRecordedToday
            ? 'Wonderful! You’ve recorded today’s pixel and nurtured your mindful journaling habit.'
            : streakInfo.currentStreak > 0
            ? `Reflect on today to extend your ${streakInfo.currentStreak}-day streak and color today’s pixel.`
            : 'Take a quiet moment today to begin your mindful journaling streak.'}
        </p>

        {/* 7-Day Mini Consistency Tracker */}
        <div className="mt-3 pt-2.5 border-t border-[#F0EEE6] flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider">
            7-Day Ritual
          </span>
          <div className="flex items-center gap-1.5">
            {past7Days.map((d) => (
              <div key={d.dateStr} className="flex flex-col items-center gap-0.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                    d.entry
                      ? 'border border-black/10 shadow-2xs'
                      : d.dateStr === todayDate
                      ? 'bg-[#FAF9F5] border-2 border-[#FFB7B2] text-[#FFB7B2]'
                      : 'bg-[#FAF9F5] border border-dashed border-[#D6D3CD] text-[#A8A29E]'
                  }`}
                  style={{ backgroundColor: d.entry?.pixelColor }}
                >
                  {d.entry ? '✓' : ''}
                </span>
                <span className="text-[8px] text-[#78716C] font-semibold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warm Greeting & Welcome */}
      <div>
        <span className="font-handwriting text-2xl text-[#FFB7B2]">
          welcome to your space
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-[#292524] mt-0.5">
          {displayName ? `Hello, ${displayName}` : 'Quiet Moments'}
        </h2>
        <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
          Give each day a little space. Every pixel is a chapter in the story only you can tell.
        </p>
      </div>

      {/* TODAY'S PIXEL CARD — Heart of the Ritual */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft relative overflow-hidden transition-all hover:shadow-card-hover">
        {/* Soft decorative background tint if recorded */}
        {isRecorded && (
          <div
            className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl -z-10 opacity-30 animate-pulse-subtle"
            style={{ backgroundColor: todayEntry?.pixelColor }}
          />
        )}

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
              <span>Today’s Pixel</span>
              {isRecorded && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E8EFE8] text-[#558262] font-semibold">
                  Saved
                </span>
              )}
            </span>
            <h3 className="text-lg font-bold text-[#292524] mt-0.5">
              {isRecorded ? `${moodInfo?.label} Day` : 'Ready for Reflection'}
            </h3>
          </div>

          {/* Resulting Pixel Swatch */}
          <div
            className="w-13 h-13 rounded-2xl border border-black/10 shadow-sm flex items-center justify-center text-[#292524] transition-all relative overflow-hidden"
            style={{
              backgroundColor: isRecorded ? todayEntry?.pixelColor : '#F1EFEA',
            }}
          >
            {/* Subtle glass reflection highlight */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-2xl" />

            {isRecorded ? (
              <span className="text-[#292524] relative z-10">
                {todayEntry?.mood === 'wonderful' && <Sun size={24} className="stroke-[2.2]" />}
                {todayEntry?.mood === 'good' && <Smile size={24} className="stroke-[2.2]" />}
                {todayEntry?.mood === 'okay' && <Meh size={24} className="stroke-[2.2]" />}
                {todayEntry?.mood === 'low' && <CloudRain size={24} className="stroke-[2.2]" />}
                {todayEntry?.mood === 'difficult' && <Wind size={24} className="stroke-[2.2]" />}
              </span>
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-dashed border-[#78716C]/60" />
            )}
          </div>
        </div>

        {/* Status description */}
        <div className="mt-4">
          {isRecorded ? (
            <div className="space-y-3">
              <p className="text-xs text-[#78716C] leading-relaxed">
                You’ve preserved today’s moment in your life grid. Your answers are saved locally.
              </p>

              {/* Micro-ratings indicator row */}
              {(todayEntry?.energyRating || todayEntry?.stressRating || todayEntry?.meaningRating || todayEntry?.overallRating) && (
                <div className="grid grid-cols-4 gap-1.5 py-1">
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-center">
                    <span className="text-[10px] text-[#78716C] block font-medium">Energy</span>
                    <span className="text-xs font-bold text-[#292524] mt-0.5 block">
                      ⚡ {todayEntry.energyRating || 3}/5
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-center">
                    <span className="text-[10px] text-[#78716C] block font-medium">Calmness</span>
                    <span className="text-xs font-bold text-[#292524] mt-0.5 block">
                      🍃 {6 - (todayEntry.stressRating || 3)}/5
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-center">
                    <span className="text-[10px] text-[#78716C] block font-medium">Meaning</span>
                    <span className="text-xs font-bold text-[#292524] mt-0.5 block">
                      ✨ {todayEntry.meaningRating || 3}/5
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-center">
                    <span className="text-[10px] text-[#78716C] block font-medium">Rating</span>
                    <span className="text-xs font-bold text-[#292524] mt-0.5 block">
                      ★ {todayEntry.overallRating || 3}/5
                    </span>
                  </div>
                </div>
              )}

              {/* Reflection Card with Copy action */}
              {todayEntry?.reflection && (
                <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] relative group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-[#292524] italic font-sans leading-relaxed flex-1">
                      &ldquo;{todayEntry.reflection}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light', enableHaptics);
                        if (todayEntry.reflection) {
                          navigator.clipboard.writeText(todayEntry.reflection);
                          setCopiedReflection(true);
                          setTimeout(() => setCopiedReflection(false), 2000);
                        }
                      }}
                      className="p-1 rounded-lg text-[#78716C] hover:text-[#292524] hover:bg-white transition-all cursor-pointer shrink-0"
                      title="Copy reflection to clipboard"
                    >
                      {copiedReflection ? (
                        <Check size={13} className="text-[#7EAE8B]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  {copiedReflection && (
                    <span className="text-[10px] font-semibold text-[#7EAE8B] block mt-1">
                      Copied reflection to clipboard ✨
                    </span>
                  )}
                </div>
              )}

              {/* Photo Attachment Thumbnail */}
              {todayEntry?.photos && todayEntry.photos.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <div
                    onClick={() => todayEntry?.photos?.[0] && setZoomedPhoto(todayEntry.photos[0])}
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group shrink-0"
                  >
                    <img
                      src={todayEntry.photos[0]}
                      alt="Today's memory snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ImageIcon size={14} />
                    </div>
                  </div>
                  <span className="text-[11px] text-[#78716C]">
                    Photo attached • tap to view
                  </span>
                </div>
              )}

              {/* Tags pill */}
              {todayEntry?.tags && todayEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {todayEntry.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2.5 py-1 bg-[#E8EFE8]/50 text-[#292524] rounded-lg font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#78716C] leading-relaxed">
              Take 30 seconds to reflect on how today felt. No scores, no streaks—just an honest
              glance at your day.
            </p>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="mt-6 pt-4 border-t border-[#F0EEE6] flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('medium', enableHaptics);
              onOpenCheckIn(todayDate);
            }}
            className="w-full py-3 px-5 rounded-2xl bg-[#FFB7B2] hover:bg-[#FFA5A0] active:scale-[0.98] text-[#292524] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Edit3 size={15} />
            <span>{isRecorded ? 'Edit Today’s Entry' : 'Reflect on Today'}</span>
          </button>
        </div>
      </div>

      {/* YOUR MOOD — THIS WEEK (Matching Left Screen in Reference Image) */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-5 shadow-soft space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#292524] tracking-tight">Your mood</h3>
            <span className="text-xs font-semibold text-[#78716C]">This week</span>
          </div>

          <button
            onClick={onNavigateToLife}
            className="text-[11px] font-semibold text-[#78716C] hover:text-[#292524] flex items-center gap-0.5 cursor-pointer pt-0.5"
          >
            Full Tapestry <ChevronRight size={13} />
          </button>
        </div>

        {/* Vertical Pill Bar Chart (7-day columns) */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-7 gap-2.5 items-end h-32 px-1">
            {past7Days.map((item) => {
              const isToday = item.dateStr === todayDate;
              const mood = item.entry?.mood;

              // Compute bar height based on mood (matching screenshot pill heights)
              let barHeight = 'h-5'; // unrecorded baseline
              if (mood === 'wonderful') barHeight = 'h-28'; // Tallest (Great)
              else if (mood === 'good') barHeight = 'h-[86px]'; // Medium-high (Good)
              else if (mood === 'okay') barHeight = 'h-[62px]'; // Mid (Okay)
              else if (mood === 'low') barHeight = 'h-[44px]'; // Low (Bad)
              else if (mood === 'difficult') barHeight = 'h-[28px]'; // Lowest (Awful)

              const barBg = item.entry
                ? item.entry.pixelColor
                : isToday
                ? '#FAF9F6'
                : palette.unrecordedColor;

              return (
                <div key={item.dateStr} className="flex flex-col items-center gap-2 h-full justify-end">
                  {/* Vertical Rounded Pill Bar */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light', enableHaptics);
                      onOpenCheckIn(item.dateStr);
                    }}
                    title={`${item.dateStr}: ${item.entry ? item.entry.mood : 'Unrecorded'}`}
                    aria-label={`Date ${item.dateStr}: ${item.entry ? item.entry.mood : 'Unrecorded'}`}
                    className={`w-full max-w-[34px] rounded-full transition-all duration-300 cursor-pointer flex flex-col items-center justify-start pt-1.5 shadow-2xs hover:scale-105 active:scale-95 relative overflow-hidden ${barHeight} ${
                      isToday
                        ? 'ring-2 ring-[#292524] ring-offset-2'
                        : 'border border-black/5 hover:border-black/20'
                    }`}
                    style={{ backgroundColor: barBg }}
                  >
                    {/* Glass enamel highlight */}
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none" />
                    {item.entry && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 block mt-0.5 relative z-10 shadow-xs" />
                    )}
                  </button>

                  {/* Day Label (e.g. 21, 22...) & narrow weekday */}
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-[#292524] block leading-none">
                      {item.dateStr.split('-')[2]}
                    </span>
                    <span className="text-[9px] font-medium text-[#78716C] block mt-0.5">
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Category Breakdown Legend (Dot rows from screenshot) */}
        <div className="pt-2 border-t border-[#F0EEE6] space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {/* Great / Wonderful */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F7D486]" />
                <span className="text-[#292524] font-medium">Great</span>
              </div>
              <span className="text-[#78716C] font-semibold">
                {past7Days.filter((d) => d.entry?.mood === 'wonderful').length}
              </span>
            </div>

            {/* Good */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB7B2]" />
                <span className="text-[#292524] font-medium">Good</span>
              </div>
              <span className="text-[#78716C] font-semibold">
                {past7Days.filter((d) => d.entry?.mood === 'good').length}
              </span>
            </div>

            {/* Okay */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8DEC8]" />
                <span className="text-[#292524] font-medium">Okay</span>
              </div>
              <span className="text-[#78716C] font-semibold">
                {past7Days.filter((d) => d.entry?.mood === 'okay').length}
              </span>
            </div>

            {/* Bad / Low */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CFCAE4]" />
                <span className="text-[#292524] font-medium">Bad</span>
              </div>
              <span className="text-[#78716C] font-semibold">
                {past7Days.filter((d) => d.entry?.mood === 'low').length}
              </span>
            </div>

            {/* Awful / Difficult */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B4C0CB]" />
                <span className="text-[#292524] font-medium">Awful</span>
              </div>
              <span className="text-[#78716C] font-semibold">
                {past7Days.filter((d) => d.entry?.mood === 'difficult').length}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Encouraging Message Card (Exact card from screenshot) */}
        {(() => {
          const greatCount = past7Days.filter((d) => d.entry?.mood === 'wonderful').length;
          const goodCount = past7Days.filter((d) => d.entry?.mood === 'good').length;
          const totalGood = greatCount + goodCount;
          const difficultCount = past7Days.filter((d) => d.entry?.mood === 'difficult' || d.entry?.mood === 'low').length;
          const hasEntries = past7Days.some((d) => !!d.entry);

          let message = "Take each day as it comes. You're doing wonderful. ♡";
          if (totalGood >= 2 && totalGood >= difficultCount) {
            message = "You had more good days this week! Keep going. ♡";
          } else if (hasEntries && totalGood >= 1) {
            message = "Cherishing your peaceful moments this week. Keep going. ♡";
          } else if (hasEntries) {
            message = "Every day has its own rhythm. Thank yourself for showing up. ♡";
          }

          return (
            <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFB7B2]/30 text-[#E59B96] flex items-center justify-center shrink-0">
                <Heart size={16} className="fill-[#FFB7B2]" />
              </div>
              <p className="text-xs font-medium text-[#292524] leading-relaxed">
                {message}
              </p>
            </div>
          );
        })()}

        {/* MINDFUL EXERCISES LAUNCHER (Take a Breath & Relax Your Eyes from screenshot) */}
        <div className="pt-2 border-t border-[#F0EEE6]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#FFB7B2]" />
              <span className="text-xs font-bold text-[#292524]">Mindful Exercises</span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light', enableHaptics);
                setActiveExerciseType('breathing');
                setIsExerciseModalOpen(true);
              }}
              className="text-[11px] font-semibold text-[#FFB7B2] hover:text-[#FFA5A0] cursor-pointer"
            >
              All Exercises
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Take a Breath Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium', enableHaptics);
                setActiveExerciseType('breathing');
                setIsExerciseModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-[#FFF5F3] to-[#FAF9F5] border border-[#FFB7B2]/40 hover:border-[#FFB7B2] text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="w-7 h-7 rounded-full bg-[#FFB7B2]/30 flex items-center justify-center text-[#E59B96] mb-1.5">
                  <Wind size={15} />
                </div>
                <div className="text-xs font-bold text-[#292524] group-hover:text-[#E59B96] transition-colors">
                  Take a Breath
                </div>
                <p className="text-[10px] text-[#78716C] mt-0.5 leading-tight">
                  Box breathing & gentle reset
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#FFB7B2] mt-2 pt-1.5 border-t border-[#FFB7B2]/20">
                <Play size={10} className="fill-[#FFB7B2]" /> Start (64s)
              </div>
            </button>

            {/* Relax Your Eyes Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium', enableHaptics);
                setActiveExerciseType('eyes');
                setIsExerciseModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-[#F4F8F4] to-[#FAF9F5] border border-[#C8DEC8]/60 hover:border-[#7EAE8B] text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="w-7 h-7 rounded-full bg-[#C8DEC8]/40 flex items-center justify-center text-[#558262] mb-1.5">
                  <Eye size={15} />
                </div>
                <div className="text-xs font-bold text-[#292524] group-hover:text-[#558262] transition-colors">
                  Relax Your Eyes
                </div>
                <p className="text-[10px] text-[#78716C] mt-0.5 leading-tight">
                  20-20-20 screen relief
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#7EAE8B] mt-2 pt-1.5 border-t border-[#C8DEC8]/30">
                <Play size={10} className="fill-[#7EAE8B]" /> Start (60s)
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* RECENT MEMORY HIGHLIGHT */}
      {recentMemories.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#FFB7B2]" />
              <span className="text-xs font-bold text-[#292524]">Recent Memory</span>
            </div>
            <button
              onClick={onNavigateToMemories}
              className="text-[11px] font-semibold text-[#78716C] hover:text-[#292524] flex items-center gap-0.5 cursor-pointer"
            >
              All Memories <ChevronRight size={13} />
            </button>
          </div>

          <div
            onClick={onNavigateToMemories}
            className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] hover:border-[#D6D3CD] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] text-[#78716C] mb-1">
              <span>{recentMemories[0].date}</span>
              {recentMemories[0].isFavorite && (
                <Heart size={13} className="fill-[#FFB7B2] text-[#FFB7B2]" />
              )}
            </div>
            <h4 className="text-xs font-semibold text-[#292524] group-hover:text-[#FFB7B2] transition-colors">
              {recentMemories[0].title || 'Personal Moment'}
            </h4>
            <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed font-sans">
              {recentMemories[0].text}
            </p>
          </div>
        </div>
      )}

      {/* Mindful Exercises Full-Screen Interactive Modal */}
      <MindfulExercisesModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        initialExercise={activeExerciseType}
        todayDate={todayDate}
        enableHaptics={enableHaptics}
        onAddMilestone={(milestone) => {
          if (onAddMilestone) {
            onAddMilestone(milestone);
          }
        }}
        onNavigateToMilestones={onNavigateToMilestones}
      />

      {/* Photo Zoom Lightbox Modal */}
      {zoomedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged photo memory"
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#FAF9F5] p-3 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-2 px-1">
              <span className="text-xs font-semibold text-[#78716C]">Photo Memory</span>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#292524] flex items-center justify-center cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <img
              src={zoomedPhoto}
              alt="Memory detail"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-[#EFECE6]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
