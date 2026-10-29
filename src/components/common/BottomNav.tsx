import React from 'react';
import { Calendar, Compass, BookOpen, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export type TabType = 'today' | 'life' | 'memories' | 'insights';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  enableHaptics: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  enableHaptics,
}) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ size: number; className?: string }> }> = [
    { id: 'today', label: 'Today', icon: Compass },
    { id: 'life', label: 'My Life', icon: Calendar },
    { id: 'memories', label: 'Memories', icon: BookOpen },
    { id: 'insights', label: 'Insights', icon: Sparkles },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="sticky bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#EFECE6] px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom,0.65rem))] flex items-center justify-around shadow-bottom-nav select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic('light', enableHaptics);
              onChangeTab(tab.id);
            }}
            aria-label={tab.label}
            aria-selected={isActive}
            role="tab"
            className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-[#292524] font-semibold'
                : 'text-[#78716C] hover:text-[#292524] active:scale-95'
            }`}
          >
            {isActive && (
              <span
                className="absolute inset-0 bg-[#FFB7B2]/20 rounded-2xl -z-10 animate-fade-in"
                aria-hidden="true"
              />
            )}
            <Icon
              size={19}
              className={`transition-all duration-200 ${
                isActive ? 'scale-110 text-[#292524] stroke-[2.3]' : 'stroke-[1.7]'
              }`}
            />
            <span className="text-[11px] tracking-tight mt-1 font-sans">
              {tab.label}
            </span>
            {isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#FFB7B2] mt-0.5 animate-pulse-subtle"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
