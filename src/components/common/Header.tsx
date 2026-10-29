import React from 'react';
import { Settings, Share2, Sparkles, Sun, Sunrise, Moon } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface HeaderProps {
  displayName?: string;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  enableHaptics: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  displayName,
  onOpenSettings,
  onOpenExport,
  enableHaptics,
}) => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

  // Time of day greeting icon
  const hour = today.getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  // Approximate week number
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDays = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
  const weekNumber = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);

  return (
    <header className="px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-[#F0EEE6]/80 bg-[#FDFCF8]/95 backdrop-blur-md sticky top-0 z-30 select-none">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-[#78716C]">
          <span className="flex items-center text-[#FFB7B2]">
            {isMorning ? <Sunrise size={13} /> : isAfternoon ? <Sun size={13} /> : <Moon size={13} />}
          </span>
          <span>{formattedDate}</span>
          <span className="w-1 h-1 rounded-full bg-[#D6D3CD]" />
          <span className="text-[10px] bg-[#FAF9F5] border border-[#F0EEE6] px-1.5 py-0.2 rounded-md font-semibold text-[#78716C]">
            W{weekNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-xl font-bold tracking-tight text-[#292524]">
            Life in Pixels
          </h1>
          <span className="font-handwriting text-xl text-[#FFB7B2] font-bold select-none pt-0.5">
            softly
          </span>
          {displayName && (
            <span className="text-[10px] font-semibold text-[#78716C] bg-[#FAF9F5] border border-[#F0EEE6] px-2 py-0.5 rounded-full hidden sm:inline-block">
              {displayName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            triggerHaptic('light', enableHaptics);
            onOpenExport();
          }}
          aria-label="Export or Share Visual Grid"
          className="p-2.5 rounded-2xl text-[#78716C] hover:text-[#292524] bg-white/70 hover:bg-[#FAF9F5] border border-[#EFECE6] active:scale-95 transition-all cursor-pointer shadow-2xs"
          title="Export Visual Life Grid"
        >
          <Share2 size={16} className="stroke-[2]" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light', enableHaptics);
            onOpenSettings();
          }}
          aria-label="Settings and Preferences"
          className="p-2.5 rounded-2xl text-[#78716C] hover:text-[#292524] bg-white/70 hover:bg-[#FAF9F5] border border-[#EFECE6] active:scale-95 transition-all cursor-pointer shadow-2xs"
          title="Settings"
        >
          <Settings size={16} className="stroke-[2]" />
        </button>
      </div>
    </header>
  );
};
