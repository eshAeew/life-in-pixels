import React, { useState } from 'react';
import {
  X,
  Palette,
  Calendar,
  Clock,
  Bell,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Shield,
  Smartphone,
  Eye,
  Info,
  Check,
} from 'lucide-react';
import type { UserSettings, ThemeId, MoodType } from '../../types';
import { THEME_PALETTES, MOOD_CONFIG } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { StorageService } from '../../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetToSampleData?: () => void;
  onClearAllData: () => void;
  onImportBackup: (data: any) => void;
  onExportBackup: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllData,
  onImportBackup,
  onExportBackup,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'theme' | 'data' | 'about'>(
    'general'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          onImportBackup(parsed);
          alert('Backup restored successfully!');
        } catch {
          alert('Invalid backup JSON format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings and Preferences"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
              Preferences
            </span>
            <h3 className="text-lg font-bold text-[#292524]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#292524] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-6 pt-3 pb-1 border-b border-[#F0EEE6] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'general', label: 'General & Ritual', icon: Clock },
            { id: 'theme', label: 'Themes & Colors', icon: Palette },
            { id: 'data', label: 'Data & Privacy', icon: Shield },
            { id: 'about', label: 'About & Logic', icon: Info },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('selection', settings.enableHaptics);
                  setActiveSection(tab.id as any);
                }}
                className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#FFB7B2] text-[#292524]'
                    : 'border-transparent text-[#78716C] hover:text-[#292524]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6 flex-1 text-xs">
          {/* SECTION: GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              {/* Profile Name */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-1.5">
                <label className="font-semibold text-[#292524] block">Your Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => onUpdateSettings({ displayName: e.target.value })}
                  placeholder="e.g. Your name"
                  className="w-full px-3 py-2 bg-[#FAF9F5] rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
                />
              </div>

              {/* Birth Date & Horizon */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <div>
                  <label className="font-semibold text-[#292524] block">Birth Date (Optional)</label>
                  <p className="text-[11px] text-[#78716C] mb-1.5">
                    Used solely to calculate elapsed weeks in the Lifetime visualization. Never
                    required for daily check-ins.
                  </p>
                  <input
                    type="date"
                    value={settings.birthDate || ''}
                    onChange={(e) => onUpdateSettings({ birthDate: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-[#FAF9F5] rounded-xl border border-[#EFECE6] text-xs text-[#292524]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#292524] block">
                    Lifetime Visualization Horizon
                  </label>
                  <p className="text-[11px] text-[#78716C] mb-1.5">
                    A personal framing horizon for the grid, never a prediction of lifespan.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[70, 80, 90, 100].map((yrs) => (
                      <button
                        key={yrs}
                        onClick={() => onUpdateSettings({ horizonYears: yrs })}
                        className={`py-2 rounded-xl font-semibold border cursor-pointer ${
                          settings.horizonYears === yrs
                            ? 'border-[#292524] bg-[#292524] text-white'
                            : 'border-[#EFECE6] bg-[#FAF9F5] text-[#78716C]'
                        }`}
                      >
                        {yrs} yrs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Week Starts On */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#292524] block">First Day of Week</span>
                  <span className="text-[11px] text-[#78716C]">Choose your calendar start day</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onUpdateSettings({ weekStartsOn: 1 })}
                    className={`px-3 py-1.5 rounded-xl font-medium border cursor-pointer ${
                      settings.weekStartsOn === 1
                        ? 'bg-[#292524] text-white border-[#292524]'
                        : 'bg-[#FAF9F5] text-[#78716C] border-[#EFECE6]'
                    }`}
                  >
                    Monday
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ weekStartsOn: 0 })}
                    className={`px-3 py-1.5 rounded-xl font-medium border cursor-pointer ${
                      settings.weekStartsOn === 0
                        ? 'bg-[#292524] text-white border-[#292524]'
                        : 'bg-[#FAF9F5] text-[#78716C] border-[#EFECE6]'
                    }`}
                  >
                    Sunday
                  </button>
                </div>
              </div>

              {/* Gentle Reminders */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#292524] block">Gentle Daily Reminder</span>
                    <span className="text-[11px] text-[#78716C]">
                      Non-judgmental, pressure-free prompt
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.remindersEnabled}
                    onChange={(e) => onUpdateSettings({ remindersEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#FFB7B2]"
                  />
                </div>

                {settings.remindersEnabled && (
                  <div className="flex items-center gap-3 pt-1 border-t border-[#F0EEE6]">
                    <div className="flex-1">
                      <span className="text-[10px] text-[#78716C] uppercase font-bold block mb-1">
                        Time
                      </span>
                      <input
                        type="time"
                        value={settings.reminderTime}
                        onChange={(e) => onUpdateSettings({ reminderTime: e.target.value })}
                        className="px-3 py-1.5 bg-[#FAF9F5] rounded-xl border border-[#EFECE6] text-xs text-[#292524]"
                      />
                    </div>
                    <div className="flex-1">
                      <CustomDropdown
                        label="Copy Style"
                        value={settings.reminderStyle}
                        onChange={(val) => onUpdateSettings({ reminderStyle: val as any })}
                        options={[
                          { value: 'gentle', label: 'Gentle', sublabel: '“A little moment for yourself”' },
                          { value: 'poetic', label: 'Poetic', sublabel: '“Your day is yours to record”' },
                          { value: 'mindful', label: 'Mindful', sublabel: '“Want to remember anything today?”' },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tactile & Viewport */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#292524] block">Tactile Feedback</span>
                    <span className="text-[11px] text-[#78716C]">
                      Restrained micro-haptics on taps and actions
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableHaptics}
                    onChange={(e) => onUpdateSettings({ enableHaptics: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#FFB7B2]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6]">
                  <div>
                    <span className="font-semibold text-[#292524] block">
                      Accessibility Symbols
                    </span>
                    <span className="text-[11px] text-[#78716C]">
                      Show geometric symbols inside pixel cells
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showAccessibilitySymbols}
                    onChange={(e) =>
                      onUpdateSettings({ showAccessibilitySymbols: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-[#FFB7B2]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0EEE6]">
                  <div>
                    <span className="font-semibold text-[#292524] block">Viewport Presentation</span>
                    <span className="text-[11px] text-[#78716C]">
                      Mobile device shell vs full width
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        viewportMode:
                          settings.viewportMode === 'mobile-frame' ? 'responsive' : 'mobile-frame',
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#EFECE6] text-[#292524] font-medium text-xs cursor-pointer"
                  >
                    {settings.viewportMode === 'mobile-frame' ? 'Mobile Frame' : 'Full Screen'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: THEMES */}
          {activeSection === 'theme' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[#292524] text-sm">Visual Color Themes</h4>
                <p className="text-[#78716C] text-xs mt-0.5">
                  Changing your palette adjusts the display colors of your grid without altering
                  your underlying journal entries or ratings.
                </p>
              </div>

              <div className="space-y-3">
                {Object.values(THEME_PALETTES).map((pal) => {
                  const isSelected = settings.themeId === pal.id;
                  return (
                    <button
                      key={pal.id}
                      onClick={() => {
                        triggerHaptic('selection', settings.enableHaptics);
                        onUpdateSettings({ themeId: pal.id });
                      }}
                      className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#292524] bg-white ring-1 ring-[#292524]'
                          : 'border-[#EFECE6] bg-[#FAF9F5] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#292524]">{pal.name}</span>
                        {isSelected && <Check size={16} className="text-[#292524]" />}
                      </div>

                      <p className="text-[11px] text-[#78716C] mb-3">{pal.description}</p>

                      {/* Swatches */}
                      <div className="flex gap-2">
                        {(Object.keys(pal.colors) as MoodType[]).map((m) => (
                          <div key={m} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full h-6 rounded-lg border border-black/10"
                              style={{ backgroundColor: pal.colors[m] }}
                            />
                            <span className="text-[9px] text-[#78716C] capitalize">{m}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: DATA & STORAGE SYSTEM */}
          {activeSection === 'data' && (
            <div className="space-y-4">
              {/* Storage System Status */}
              <div className="p-4 bg-[#FAF9F5] border border-[#EFECE6] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#52796F]" />
                    <span className="font-bold text-[#292524] text-xs">Storage System</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8EFE8] text-[#3D7058]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52796F] animate-pulse" />
                    Local & IndexedDB Active
                  </span>
                </div>
                <p className="text-[11px] text-[#78716C] leading-relaxed">
                  All your daily entries, ratings, reflections, mindful exercises, and milestones are
                  persisted locally on this device. No login, no cloud tracking, 100% private.
                </p>

                {(() => {
                  const stats = StorageService.getStats();
                  return (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 bg-white rounded-xl border border-[#F0EEE6]">
                        <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                          Daily Pixels
                        </span>
                        <span className="text-sm font-bold text-[#292524] mt-0.5 block">
                          {stats.entriesCount}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#F0EEE6]">
                        <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                          Memories
                        </span>
                        <span className="text-sm font-bold text-[#292524] mt-0.5 block">
                          {stats.memoriesCount}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#F0EEE6]">
                        <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                          Milestones
                        </span>
                        <span className="text-sm font-bold text-[#292524] mt-0.5 block">
                          {stats.milestonesCount}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Backup actions */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <span className="font-bold text-[#292524] block">Backup & Restore</span>
                <p className="text-[11px] text-[#78716C]">
                  Export a complete JSON snapshot of your journal or restore a previous backup anytime.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={onExportBackup}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE6] hover:bg-white text-[#292524] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} /> Download JSON
                  </button>

                  <label className="flex-1 py-2.5 px-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE6] hover:bg-white text-[#292524] font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload size={14} /> Restore Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Options */}
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                <span className="font-bold text-[#292524] block">Reset Options</span>

                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} /> Clear All Personal Data
                  </button>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <p className="text-[11px] text-red-700 font-medium">
                      Are you sure? This will permanently erase all your saved days and reflections
                      from this device.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onClearAllData();
                          setShowClearConfirm(false);
                          alert('All journal records cleared.');
                        }}
                        className="flex-1 py-1.5 bg-red-600 text-white rounded-lg font-bold"
                      >
                        Yes, Delete Everything
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 bg-white text-[#78716C] rounded-lg border border-[#EFECE6]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: ABOUT & LOGIC */}
          {activeSection === 'about' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-2">
                <h4 className="font-bold text-[#292524]">How Default Pixel Colors Are Determined</h4>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Life in Pixels uses 100% deterministic, transparent color logic—never machine
                  learning guessing or opaque algorithms:
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-[#78716C] text-[11px] leading-relaxed">
                  <li>
                    <strong>Primary Base Color:</strong> Mapped directly from your selected feeling
                    (Wonderful, Good, Okay, Low, Difficult) according to your active theme palette.
                  </li>
                  <li>
                    <strong>Lightness Modulation:</strong> Your overall rating (1-5) and energy
                    subtly adjust lightness by up to ±8% to give the grid organic texture without
                    breaking harmony.
                  </li>
                  <li>
                    <strong>Non-destructive:</strong> Changing your visual theme never overwrites or
                    damages your original answers or written memories.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] space-y-1">
                <span className="font-bold text-[#292524]">Life in Pixels — Softly</span>
                <p className="text-[11px] text-[#78716C]">
                  Version 1.0.0 • Digital Wellness & Mindful Journaling
                </p>
                <p className="text-[11px] text-[#78716C] italic font-handwriting text-base pt-1">
                  &ldquo;A color is a personal representation, not an objective judgment.&rdquo;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
