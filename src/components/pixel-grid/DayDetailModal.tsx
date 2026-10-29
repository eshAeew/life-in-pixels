import React from 'react';
import { X, Calendar, Edit3, Trash2, Heart, Sparkles, MapPin, Flag } from 'lucide-react';
import type { DailyEntry, Milestone, MoodType } from '../../types';
import { MOOD_CONFIG } from '../../theme/palettes';
import { isFutureDate, formatDateKey } from '../../utils/rules';
import { triggerHaptic } from '../../utils/haptics';

interface DayDetailModalProps {
  date: string; // YYYY-MM-DD
  entry?: DailyEntry;
  milestone?: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (date: string) => void;
  onDelete?: (date: string) => void;
  enableHaptics: boolean;
  showSymbols: boolean;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  date,
  entry,
  milestone,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  enableHaptics,
  showSymbols,
}) => {
  if (!isOpen) return null;

  const todayKey = formatDateKey(new Date());
  const isFuture = isFutureDate(date, todayKey);
  const isToday = date === todayKey;

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const moodInfo = entry?.mood ? MOOD_CONFIG[entry.mood] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${formattedDate}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Color accent banner */}
        <div
          className="h-20 w-full relative flex items-end p-4 border-b border-black/5"
          style={{
            backgroundColor: entry?.pixelColor || (isFuture ? '#FAF9F6' : '#F1EFEA'),
          }}
        >
          <button
            onClick={() => {
              triggerHaptic('light', enableHaptics);
              onClose();
            }}
            aria-label="Close day view"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#292524] transition-colors cursor-pointer shadow-xs"
          >
            <X size={16} />
          </button>

          {isToday && (
            <span className="bg-[#292524] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs">
              Today
            </span>
          )}
          {isFuture && (
            <span className="bg-white/90 text-[#78716C] text-[10px] uppercase font-medium tracking-wider px-2.5 py-1 rounded-full shadow-xs">
              Future Day
            </span>
          )}
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1">
          {/* Header Title */}
          <div>
            <span className="text-[11px] font-semibold text-[#78716C] tracking-wide uppercase">
              Day Record
            </span>
            <h2 className="text-xl font-bold text-[#292524] mt-0.5">{formattedDate}</h2>
          </div>

          {/* Milestone Badge if present */}
          {milestone && (
            <div className="p-3.5 bg-[#FFF8F0] border border-[#FFE8D6] rounded-2xl flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FFB7B2]/30 text-[#292524]">
                <Flag size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  {milestone.isFutureGoal ? 'Future Milestone Goal' : 'Life Milestone'}
                </span>
                <h4 className="text-sm font-semibold text-[#292524]">{milestone.title}</h4>
                {milestone.description && (
                  <p className="text-xs text-[#78716C] mt-0.5 leading-relaxed">
                    {milestone.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recorded Entry details */}
          {entry ? (
            <div className="space-y-4">
              {/* Mood & Ratings Pill */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-sans font-bold text-base text-[#292524] shadow-xs"
                    style={{ backgroundColor: entry.pixelColor }}
                  >
                    {showSymbols && moodInfo?.accessibleSymbol}
                  </div>
                  <div>
                    <div className="text-xs text-[#78716C]">Felt</div>
                    <div className="text-sm font-semibold text-[#292524]">
                      {moodInfo?.label || 'Recorded'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {entry.overallRating && (
                    <div>
                      <div className="text-[10px] text-[#78716C]">Rating</div>
                      <div className="text-xs font-semibold text-[#292524]">
                        {entry.overallRating}/5
                      </div>
                    </div>
                  )}
                  {entry.energyRating && (
                    <div>
                      <div className="text-[10px] text-[#78716C]">Energy</div>
                      <div className="text-xs font-semibold text-[#292524]">
                        {entry.energyRating}/5
                      </div>
                    </div>
                  )}
                  {entry.stressRating && (
                    <div>
                      <div className="text-[10px] text-[#78716C]">Stress</div>
                      <div className="text-xs font-semibold text-[#292524]">
                        {entry.stressRating}/5
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-white border border-[#EFECE6] text-[#78716C] rounded-lg text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Written Reflection */}
              {entry.reflection ? (
                <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                    Written Memory
                  </div>
                  <p className="text-sm text-[#292524] leading-relaxed whitespace-pre-wrap font-sans">
                    {entry.reflection}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#78716C] italic">No written reflection for this day.</p>
              )}

              {/* Photo attachment */}
              {entry.photos && entry.photos.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-[#EFECE6]">
                  <img
                    src={entry.photos[0]}
                    alt="Day photo"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}
            </div>
          ) : isFuture ? (
            <div className="p-6 bg-white rounded-2xl border border-[#EFECE6] text-center space-y-2">
              <Calendar size={28} className="mx-auto text-[#A8A29E]" />
              <h4 className="text-sm font-semibold text-[#292524]">An Unwritten Tomorrow</h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                This day lies in the future. Life in Pixels preserves moments as they happen without
                speculating or projecting.
              </p>
            </div>
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-[#EFECE6] text-center space-y-2">
              <Calendar size={28} className="mx-auto text-[#A8A29E]" />
              <h4 className="text-sm font-semibold text-[#292524]">No Entry Recorded</h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                An ordinary, unrecorded day. You can add a retrospective memory anytime if you’d like
                to record it.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#F0EEE6] flex items-center justify-between">
          {entry && onDelete ? (
            <button
              onClick={() => {
                triggerHaptic('medium', enableHaptics);
                if (confirm('Delete this day entry?')) {
                  onDelete(date);
                  onClose();
                }
              }}
              className="p-2 text-[#78716C] hover:text-red-600 rounded-xl transition-colors cursor-pointer"
              title="Delete Entry"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <div />
          )}

          {!isFuture && (
            <button
              onClick={() => {
                triggerHaptic('light', enableHaptics);
                onEdit(date);
                onClose();
              }}
              className="px-4 py-2 bg-[#FFB7B2] text-[#292524] rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FFA5A0] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Edit3 size={14} />
              <span>{entry ? 'Edit Entry' : 'Add Retrospective Entry'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
