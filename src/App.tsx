import React, { useState } from 'react';
import { useLifeStore } from './store/useLifeStore';
import { Header } from './components/common/Header';
import { BottomNav, TabType } from './components/common/BottomNav';
import { TodayScreen } from './features/today/TodayScreen';
import { LifeGridScreen } from './features/life-grid/LifeGridScreen';
import { MemoriesScreen } from './features/memories/MemoriesScreen';
import { InsightsScreen } from './features/insights/InsightsScreen';
import { DailyCheckInModal } from './features/daily-checkin/DailyCheckInModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { ExportModal } from './features/export/ExportModal';
import { OnboardingModal } from './features/onboarding/OnboardingModal';
import { Smartphone, Monitor } from 'lucide-react';
import { formatDateKey } from './utils/rules';

export default function App() {
  const {
    entries,
    milestones,
    memories,
    settings,
    saveEntry,
    deleteEntry,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleFavoriteMemory,
    updateSettings,
    clearAllData,
    importData,
    getEntryByDate,
  } = useLifeStore();

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [activeCheckInDate, setActiveCheckInDate] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const todayDate = formatDateKey(new Date());
  const todayEntry = getEntryByDate(todayDate);

  const isMobileFrame = settings.viewportMode === 'mobile-frame';

  return (
    <div className="min-h-screen bg-[#F4F2EB] flex flex-col items-center justify-start relative text-[#292524] selection:bg-[#FFB7B2]/30">
      {/* Subtle paper grain texture overlay */}
      <div className="paper-grain-overlay" aria-hidden="true" />

      {/* Viewport switcher pill in top desktop bar */}
      <aside
        aria-label="Viewport Controls"
        className="hidden md:flex items-center gap-2 fixed top-3 right-4 z-50 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#EFECE6] shadow-sm text-xs text-[#78716C]"
      >
        <span>Preview mode:</span>
        <button
          onClick={() => updateSettings({ viewportMode: 'mobile-frame' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition-all ${
            isMobileFrame
              ? 'bg-[#292524] text-white font-medium shadow-xs'
              : 'hover:text-[#292524]'
          }`}
        >
          <Smartphone size={13} /> Mobile Shell
        </button>
        <button
          onClick={() => updateSettings({ viewportMode: 'responsive' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition-all ${
            !isMobileFrame
              ? 'bg-[#292524] text-white font-medium shadow-xs'
              : 'hover:text-[#292524]'
          }`}
        >
          <Monitor size={13} /> Responsive View
        </button>
      </aside>

      {/* Main Container */}
      <main
        className={`w-full transition-all duration-300 relative flex flex-col ${
          isMobileFrame
            ? 'max-w-[430px] my-0 md:my-6 md:rounded-[44px] md:border-[10px] md:border-[#292524] md:shadow-2xl overflow-hidden h-[100dvh] md:h-[860px] bg-[#FDFCF8]'
            : 'max-w-2xl h-[100dvh] bg-[#FDFCF8] border-x border-[#EFECE6] overflow-hidden'
        }`}
      >
        {/* Simulated Mobile Status Bar (Visible only on desktop frame mockup) */}
        {isMobileFrame && (
          <div className="hidden md:flex px-7 pt-3 pb-1 items-center justify-between text-[11px] font-semibold text-[#292524] select-none bg-[#FDFCF8] shrink-0">
            <span>9:41</span>
            <div className="w-20 h-4 bg-[#292524] rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-5 h-2.5 rounded-[4px] border border-[#292524] p-[1px] flex items-center">
                <div className="h-full w-3 bg-[#292524] rounded-[2px]" />
              </div>
            </div>
          </div>
        )}

        {/* Global App Header */}
        <Header
          displayName={settings.displayName}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          enableHaptics={settings.enableHaptics}
        />

        {/* Dynamic Tab Body */}
        <div className="flex-1 px-5 pt-5 pb-6 overflow-y-auto no-scrollbar">
          {activeTab === 'today' && (
            <TodayScreen
              todayDate={todayDate}
              todayEntry={todayEntry}
              recentEntries={entries}
              recentMemories={memories}
              milestones={milestones}
              displayName={settings.displayName}
              themeId={settings.themeId}
              enableHaptics={settings.enableHaptics}
              onOpenCheckIn={(d) => setActiveCheckInDate(d)}
              onNavigateToLife={() => setActiveTab('life')}
              onNavigateToMemories={() => setActiveTab('memories')}
              onAddMilestone={addMilestone}
              onNavigateToMilestones={() => setActiveTab('memories')}
            />
          )}

          {activeTab === 'life' && (
            <LifeGridScreen
              entries={entries}
              milestones={milestones}
              themeId={settings.themeId}
              weekStartsOn={settings.weekStartsOn}
              birthDate={settings.birthDate}
              horizonYears={settings.horizonYears}
              enableHaptics={settings.enableHaptics}
              showSymbols={settings.showAccessibilitySymbols}
              onOpenCheckIn={(d) => setActiveCheckInDate(d)}
              onDeleteEntry={deleteEntry}
              onUpdateBirthDate={(bDate) => updateSettings({ birthDate: bDate })}
            />
          )}

          {activeTab === 'memories' && (
            <MemoriesScreen
              memories={memories}
              milestones={milestones}
              enableHaptics={settings.enableHaptics}
              onSaveMemory={(mem) => {
                const existing = memories.find((m) => m.id === mem.id);
                if (existing) updateMemory(mem);
                else addMemory(mem);
              }}
              onDeleteMemory={deleteMemory}
              onToggleFavorite={toggleFavoriteMemory}
              onSaveMilestone={(ms) => {
                const existing = milestones.find((m) => m.id === ms.id);
                if (existing) updateMilestone(ms);
                else addMilestone(ms);
              }}
              onDeleteMilestone={deleteMilestone}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsScreen entries={entries} enableHaptics={settings.enableHaptics} />
          )}
        </div>

        {/* Bottom Mobile Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          enableHaptics={settings.enableHaptics}
        />

        {/* Simulated Home Indicator Bar */}
        {isMobileFrame && (
          <div className="py-1.5 flex items-center justify-center bg-[#FFFFFF]">
            <div className="w-28 h-1 rounded-full bg-[#292524]/20" />
          </div>
        )}
      </main>

      {/* --- MODALS & WORKFLOWS --- */}

      {/* Daily Check-in Modal */}
      {activeCheckInDate && (
        <DailyCheckInModal
          date={activeCheckInDate}
          existingEntry={getEntryByDate(activeCheckInDate)}
          isOpen={!!activeCheckInDate}
          onClose={() => setActiveCheckInDate(null)}
          onSaved={(savedEntry) => {
            saveEntry(savedEntry);
            setActiveCheckInDate(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          onClearAllData={clearAllData}
          onImportBackup={importData}
          onExportBackup={() => setIsExportOpen(true)}
        />
      )}

      {/* Export & Share Modal */}
      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          entries={entries}
          themeId={settings.themeId}
          enableHaptics={settings.enableHaptics}
        />
      )}

      {/* First-time Onboarding Modal */}
      {!settings.onboardingCompleted && (
        <OnboardingModal
          isOpen={!settings.onboardingCompleted}
          onComplete={(init) => updateSettings(init)}
          enableHaptics={settings.enableHaptics}
        />
      )}
    </div>
  );
}
