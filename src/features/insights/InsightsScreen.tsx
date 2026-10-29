import React, { useState } from 'react';
import {
  Sparkles,
  Smile,
  Zap,
  Tag,
  Compass,
  Heart,
  Feather,
  Sun,
  Meh,
  CloudRain,
  Wind,
  TrendingUp,
  Quote as QuoteIcon,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import type { DailyEntry, MoodType } from '../../types';
import { MOOD_CONFIG, THEME_PALETTES } from '../../theme/palettes';
import { calculateInsights, generateMonthlyRecap, formatDateKey } from '../../utils/rules';
import { triggerHaptic } from '../../utils/haptics';
import {
  extractWordFrequencies,
  calculateWeeklyMoodTrends,
  WordCount,
} from '../../utils/wordFrequency';
import { QuoteFinderModal } from '../quotes/QuoteFinderModal';

interface InsightsScreenProps {
  entries: DailyEntry[];
  enableHaptics: boolean;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ entries, enableHaptics }) => {
  const [period, setPeriod] = useState<'month' | 'past3Months' | 'year' | 'all'>('month');
  const [isQuoteFinderOpen, setIsQuoteFinderOpen] = useState(false);
  const [activeWordFilter, setActiveWordFilter] = useState<string | null>(null);

  const now = new Date();
  const todayKey = formatDateKey(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysPassedInMonth = now.getDate();

  const insights = calculateInsights(entries, period, todayKey);
  const monthlyRecap = generateMonthlyRecap(entries, currentYear, currentMonth);

  const totalMoods = Object.values(insights.moodCounts).reduce((a, b) => a + b, 0);

  // Consistency percentage
  const consistencyRate =
    period === 'month' && daysPassedInMonth > 0
      ? Math.round((insights.totalRecorded / daysPassedInMonth) * 100)
      : null;

  // Energy & Stress
  const energyPercent = insights.averageEnergy ? Math.round((insights.averageEnergy / 5) * 100) : 0;
  const calmScore = insights.averageStress ? Number((6 - insights.averageStress).toFixed(1)) : null;
  const calmPercent = calmScore ? Math.round((calmScore / 5) * 100) : 0;

  // Dominant mood
  const dominantMood =
    totalMoods > 0
      ? (Object.keys(insights.moodCounts) as MoodType[]).reduce((a, b) =>
          insights.moodCounts[a] >= insights.moodCounts[b] ? a : b
        )
      : null;

  // Weekly mood trend points for Recharts (null for empty weeks)
  const weeklyTrends = calculateWeeklyMoodTrends(entries, todayKey);
  const hasWeeklyData = weeklyTrends.some((w) => w.daysCount > 0);

  // Word frequencies for visualizer
  const wordFrequencies = extractWordFrequencies(entries);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-handwriting text-2xl text-[#FFB7B2]">patterns & presence</span>
          <h2 className="text-2xl font-bold tracking-tight text-[#292524] mt-0.5">
            Life Insights
          </h2>
          <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
            Visual trends, reflection word themes, and honest observations from your personal journal.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light', enableHaptics);
            setIsQuoteFinderOpen(true);
          }}
          className="p-2.5 rounded-2xl bg-white border border-[#EFECE6] text-[#78716C] hover:text-[#292524] flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs shrink-0"
          title="Open Inspirational Quote Dictionary"
        >
          <QuoteIcon size={14} className="text-[#FFB7B2]" />
          <span className="hidden sm:inline">Quotes</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFECE6] p-8 text-center space-y-4 shadow-soft">
          <div className="w-16 h-16 rounded-3xl bg-[#FFB7B2]/20 border border-[#FFB7B2]/40 flex items-center justify-center mx-auto text-[#292524] shadow-xs">
            <Compass size={28} className="text-[#FFB7B2]" />
          </div>
          <div>
            <span className="font-handwriting text-2xl text-[#FFB7B2]">a fresh canvas</span>
            <h3 className="text-xl font-bold text-[#292524] mt-1">No check-ins recorded yet</h3>
            <p className="text-xs text-[#78716C] leading-relaxed mt-2 max-w-sm mx-auto">
              Every day you record weaves color, words, and reflections into this space. Once you complete your daily check-in, your emotional climate, weekly trends, vitality balance, and word clouds will appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                triggerHaptic('light', enableHaptics);
                setIsQuoteFinderOpen(true);
              }}
              className="px-4 py-2 bg-[#FAF9F5] border border-[#EFECE6] text-[#292524] rounded-xl text-xs font-semibold hover:bg-white inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <QuoteIcon size={14} className="text-[#FFB7B2]" />
              <span>Browse Quotes for Inspiration</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Period Filter Tabs */}
          <div className="bg-[#FFFFFF] p-1.5 rounded-2xl border border-[#EFECE6] flex items-center justify-between shadow-xs">
            {[
              { id: 'month', label: 'This Month' },
              { id: 'past3Months', label: 'Past 3 Months' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Records' },
            ].map((tab) => {
              const isActive = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('selection', enableHaptics);
                    setPeriod(tab.id as any);
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-center ${
                    isActive
                      ? 'bg-[#292524] text-white shadow-xs'
                      : 'text-[#78716C] hover:text-[#292524] hover:bg-[#FAF9F5]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* HERO: Monthly Chapter Climate Banner */}
          <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F2] to-[#F5EFE6] rounded-3xl border border-[#EFECE6] p-6 shadow-soft relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5">
                  <Compass size={13} className="text-[#FFB7B2]" /> Emotional Climate
                </span>
                <h3 className="text-xl font-bold text-[#292524]">
                  {monthlyRecap.climateLabel}
                </h3>
              </div>

              {consistencyRate !== null && (
                <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-[#EFECE6] text-right shadow-xs">
                  <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                    Consistency
                  </span>
                  <span className="text-sm font-bold text-[#292524]">
                    {consistencyRate}% recorded
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-[#292524] leading-relaxed font-sans">
              {monthlyRecap.summary}
            </p>

            {/* 3 Key Anchors */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#EFECE6]/80">
              <div className="bg-white/80 p-3 rounded-2xl border border-[#F0EEE6]">
                <span className="text-[10px] font-bold text-[#78716C] uppercase block">
                  Days Saved
                </span>
                <span className="text-lg font-bold text-[#292524]">
                  {insights.totalRecorded}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-[#F0EEE6]">
                <span className="text-[10px] font-bold text-[#78716C] uppercase block">
                  Meaningful
                </span>
                <span className="text-lg font-bold text-[#FFB7B2]">
                  {insights.meaningfulDaysCount} days
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-[#F0EEE6]">
                <span className="text-[10px] font-bold text-[#78716C] uppercase block">
                  Reflections
                </span>
                <span className="text-lg font-bold text-[#292524]">
                  {monthlyRecap.reflectionsCount} written
                </span>
              </div>
            </div>
          </div>

          {/* RECHARTS: Weekly Mood Trend Line Chart */}
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFB7B2]/20 text-[#292524] flex items-center justify-center">
                  <TrendingUp size={18} className="text-[#FFB7B2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292524]">Weekly Mood Trend</h3>
                  <p className="text-[11px] text-[#78716C]">
                    Average feeling rating (1 = Difficult to 5 = Wonderful) over the last month
                  </p>
                </div>
              </div>
            </div>

            {!hasWeeklyData ? (
              <div className="p-6 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] text-center space-y-1.5">
                <p className="text-xs font-semibold text-[#292524]">No check-ins in the last 4 weeks</p>
                <p className="text-[11px] text-[#78716C]">
                  Record your daily reflections to see your weekly mood trajectory without artificial projections.
                </p>
              </div>
            ) : (
              <>
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFB7B2" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FFB7B2" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEE6" />
                      <XAxis
                        dataKey="weekLabel"
                        tick={{ fontSize: 11, fill: '#78716C' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 11, fill: '#78716C' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as (typeof weeklyTrends)[0];
                            if (data.avgMoodScore === null) return null;
                            const moodLabel =
                              data.avgMoodScore >= 4.5
                                ? 'Wonderful'
                                : data.avgMoodScore >= 3.5
                                ? 'Good'
                                : data.avgMoodScore >= 2.5
                                ? 'Okay'
                                : data.avgMoodScore >= 1.5
                                ? 'Low'
                                : 'Difficult';

                            return (
                              <div className="bg-[#292524] text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                                <div className="font-bold">{data.weekLabel}</div>
                                <div className="text-[11px] text-[#FFB7B2]">
                                  Avg Mood: {data.avgMoodScore} / 5 ({moodLabel})
                                </div>
                                {data.avgEnergy !== null && data.avgStress !== null && (
                                  <div className="text-[10px] text-[#A8A29E]">
                                    Energy: {data.avgEnergy} • Calm: {Number((6 - data.avgStress).toFixed(1))}
                                  </div>
                                )}
                                <div className="text-[10px] text-[#A8A29E]">
                                  {data.daysCount} {data.daysCount === 1 ? 'day recorded' : 'days recorded'}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgMoodScore"
                        stroke="#FFB7B2"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#moodGradient)"
                        connectNulls={false}
                        activeDot={{ r: 6, fill: '#292524', stroke: '#FFB7B2', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-2 border-t border-[#F0EEE6]">
                  <span>1: Difficult</span>
                  <span>3: Balanced / Neutral</span>
                  <span>5: Wonderful</span>
                </div>
              </>
            )}
          </div>

      {/* WORD FREQUENCY VISUALIZER */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-[#292524] flex items-center justify-center">
              <MessageSquare size={17} className="text-[#FFB7B2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#292524]">Word Frequency Visualizer</h3>
              <p className="text-[11px] text-[#78716C]">
                Most common words and recurring themes in your journal reflections
              </p>
            </div>
          </div>
        </div>

        {wordFrequencies.length === 0 ? (
          <p className="text-xs text-[#78716C] italic py-3">
            Write a few daily reflections to discover your most common journal words.
          </p>
        ) : (
          <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] flex flex-wrap gap-2 items-center justify-center min-h-[140px]">
            {wordFrequencies.map((item) => {
              // Font size scaled by weight (1 to 5)
              const fontClasses = [
                'text-xs opacity-75 font-normal',
                'text-xs opacity-90 font-medium',
                'text-sm font-semibold',
                'text-base font-bold text-[#292524]',
                'text-lg font-extrabold text-[#292524]',
              ][item.weight - 1] || 'text-xs';

              const isHighlighted = activeWordFilter === item.word;

              return (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light', enableHaptics);
                    setActiveWordFilter(isHighlighted ? null : item.word);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${fontClasses} ${
                    isHighlighted
                      ? 'bg-[#292524] text-white shadow-xs'
                      : 'bg-white hover:bg-[#FFB7B2]/20 border border-[#EFECE6] text-[#292524]'
                  }`}
                  title={`"${item.word}" appeared ${item.count} times`}
                >
                  <span>{item.word}</span>
                  <span className="text-[10px] text-[#78716C] ml-1.5 opacity-70">
                    ×{item.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filtered reflection snippets when a word is clicked */}
        {activeWordFilter && (
          <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#EFECE6] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C]">
              <span>Reflections featuring &ldquo;{activeWordFilter}&rdquo;:</span>
              <button
                type="button"
                onClick={() => setActiveWordFilter(null)}
                className="text-[10px] font-semibold text-[#FFB7B2] hover:text-[#FFA5A0] cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {entries
                .filter((e) =>
                  e.reflection?.toLowerCase().includes(activeWordFilter.toLowerCase())
                )
                .map((e) => (
                  <div
                    key={e.date}
                    className="p-2.5 bg-white rounded-xl text-xs border border-[#F0EEE6] shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-[#78716C] font-bold mb-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.pixelColor }} />
                      <span>{e.date}</span>
                    </div>
                    <p className="text-[11px] text-[#292524] italic leading-relaxed">
                      &ldquo;{e.reflection}&rdquo;
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION: THE EMOTIONAL LANDSCAPE (Visual Bug Fixed: Single column, generous width, no wrapping) */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFB7B2]/20 text-[#292524] flex items-center justify-center">
              <Smile size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#292524]">The Emotional Landscape</h3>
              <p className="text-[11px] text-[#78716C]">
                Distribution across {totalMoods} recorded check-ins
              </p>
            </div>
          </div>

          {dominantMood && (
            <span className="text-[11px] font-semibold text-[#292524] bg-[#FAF9F5] px-3 py-1 rounded-full border border-[#EFECE6]">
              Mainly {MOOD_CONFIG[dominantMood].label}
            </span>
          )}
        </div>

        {/* Visual Proportional Palette Bar */}
        <div className="w-full h-4 rounded-full flex overflow-hidden p-0.5 bg-[#F4F2EB] border border-black/5 gap-0.5">
          {(['wonderful', 'good', 'okay', 'low', 'difficult'] as MoodType[]).map((m) => {
            const count = insights.moodCounts[m];
            if (count === 0) return null;
            const pct = (count / totalMoods) * 100;
            return (
              <div
                key={m}
                style={{
                  width: `${pct}%`,
                  backgroundColor: MOOD_CONFIG[m].softlyColor,
                }}
                className="h-full rounded-full transition-all duration-300"
                title={`${MOOD_CONFIG[m].label}: ${count} days (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Clean, Full-Width List Cards (Fixes the squished multi-column layout from screenshot!) */}
        <div className="space-y-2.5 pt-1">
          {(['wonderful', 'good', 'okay', 'low', 'difficult'] as MoodType[]).map((m) => {
            const count = insights.moodCounts[m];
            const pct = totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0;
            const config = MOOD_CONFIG[m];

            return (
              <div
                key={m}
                className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#F0EEE6] flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#292524] shadow-xs shrink-0"
                    style={{ backgroundColor: config.softlyColor }}
                  >
                    {m === 'wonderful' && <Sun size={17} className="stroke-[2.2]" />}
                    {m === 'good' && <Smile size={17} className="stroke-[2.2]" />}
                    {m === 'okay' && <Meh size={17} className="stroke-[2.2]" />}
                    {m === 'low' && <CloudRain size={17} className="stroke-[2.2]" />}
                    {m === 'difficult' && <Wind size={17} className="stroke-[2.2]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#292524] block">
                      {config.label}
                    </span>
                    <span className="text-[11px] text-[#78716C] truncate block">
                      {config.description}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-xs font-bold text-[#292524] whitespace-nowrap">
                    {count} {count === 1 ? 'day' : 'days'}
                  </div>
                  <div className="text-[10px] text-[#78716C] font-semibold whitespace-nowrap">
                    {pct}% of days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: VITALITY & INNER CALM */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E8EFE8] text-[#292524] flex items-center justify-center">
            <Zap size={18} className="text-[#7EAE8B]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#292524]">Vitality & Inner Calm</h3>
            <p className="text-[11px] text-[#78716C]">
              Self-reported physical vigor and emotional ease
            </p>
          </div>
        </div>

        {/* Energy Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#292524]">Energy & Vitality</span>
            <span className="font-bold text-[#292524]">
              {insights.averageEnergy !== null ? `${insights.averageEnergy} / 5` : 'No rating yet'}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#FAF9F5] border border-[#F0EEE6] overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-[#A3D2A1] transition-all duration-500"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#78716C]">
            <span>Low Battery</span>
            <span>Steady</span>
            <span>High Vitality</span>
          </div>
        </div>

        {/* Calmness Bar */}
        <div className="space-y-1.5 pt-1 border-t border-[#F0EEE6]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#292524]">Inner Calm & Ease</span>
            <span className="font-bold text-[#292524]">
              {calmScore !== null ? `${calmScore} / 5` : 'No rating yet'}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#FAF9F5] border border-[#F0EEE6] overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-[#CFBAE8] transition-all duration-500"
              style={{ width: `${calmPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#78716C]">
            <span>High Stress</span>
            <span>Balanced</span>
            <span>Deep Peace</span>
          </div>
        </div>
      </div>

      {/* SECTION: FREQUENT THEMES OF LIVING */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#EFECE6] p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F5] border border-[#F0EEE6] text-[#292524] flex items-center justify-center">
              <Tag size={17} className="text-[#FFB7B2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#292524]">Themes & Daily Threads</h3>
              <p className="text-[11px] text-[#78716C]">What shaped your experiences</p>
            </div>
          </div>
        </div>

        {insights.topTags.length === 0 ? (
          <p className="text-xs text-[#78716C] italic py-2">
            No tags recorded in this time period.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {insights.topTags.map((item, index) => (
              <div
                key={item.tag}
                className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 transition-transform hover:scale-[1.02] ${
                  index === 0
                    ? 'bg-[#FFB7B2]/20 border-[#FFB7B2] text-[#292524]'
                    : 'bg-[#FAF9F5] border-[#EFECE6] text-[#292524]'
                }`}
              >
                <span className="text-xs font-semibold">#{item.tag}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white text-[#78716C] border border-[#EFECE6] shadow-2xs">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grounding Wellness Principle */}
      <div className="p-4 bg-[#E8EFE8]/30 border border-[#C8DEC8] rounded-3xl flex items-start gap-3">
        <Heart size={18} className="text-[#7EAE8B] shrink-0 mt-0.5" />
        <p className="text-xs text-[#292524] leading-relaxed">
          <strong>A gentle reminder:</strong> A low or quiet day is not a failed score. Life in
          Pixels honors every shade of human experience—the joyous peaks, the gentle pauses, and the
          tender, quiet passages alike.
        </p>
      </div>
        </>
      )}

      {/* Quote Finder Modal */}
      {isQuoteFinderOpen && (
        <QuoteFinderModal
          isOpen={isQuoteFinderOpen}
          onClose={() => setIsQuoteFinderOpen(false)}
          enableHaptics={enableHaptics}
        />
      )}
    </div>
  );
};
