import React, { useState } from 'react';
import { Sparkles, Calendar, Palette, Shield, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import type { UserSettings, ThemeId, MoodType } from '../../types';
import { THEME_PALETTES } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (initialSettings: Partial<UserSettings>) => void;
  enableHaptics: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  enableHaptics,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('softly-pastel');

  if (!isOpen) return null;

  const handleNext = () => {
    triggerHaptic('light', enableHaptics);
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      triggerHaptic('success', enableHaptics);
      onComplete({
        displayName: name.trim() || 'Friend',
        birthDate: birthDate || undefined,
        weekStartsOn,
        themeId: selectedTheme,
        onboardingCompleted: true,
      });
    }
  };

  const handleBack = () => {
    triggerHaptic('light', enableHaptics);
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Onboarding Flow"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Step Indicator */}
        <div className="p-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
            Step {step} of 4
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-[#FFB7B2]'
                    : i < step
                    ? 'w-2 bg-[#292524]'
                    : 'w-2 bg-[#EFECE6]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-5">
          {/* SCREEN 1: INTRO */}
          {step === 1 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FFB7B2]/20 border border-[#FFB7B2]/40 flex items-center justify-center mx-auto text-[#292524] shadow-xs">
                <Sparkles size={28} className="text-[#FFB7B2]" />
              </div>

              <div>
                <span className="font-handwriting text-2xl text-[#FFB7B2]">life in pixels</span>
                <h2 className="text-2xl font-bold text-[#292524] mt-1">
                  Your life, one day at a time.
                </h2>
                <p className="text-xs text-[#78716C] leading-relaxed mt-2 max-w-xs mx-auto">
                  Give each day a little space. Over time, the small moments become a story only you
                  can tell.
                </p>
              </div>

              {/* Pixel sample preview */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] grid grid-cols-7 gap-1.5 max-w-xs mx-auto">
                {[
                  '#F7D486', '#FFB7B2', '#C8DEC8', '#CFCAE4', '#B4C0CB',
                  '#FFB7B2', '#F7D486', '#C8DEC8', '#FAF9F6', '#CFCAE4',
                  '#F7D486', '#FFB7B2', '#C8DEC8', '#B4C0CB'
                ].map((c, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border border-black/5"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 2: BASIC SETUP */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[#292524]">Make it your own</h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Set up basic preferences for your daily ritual.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Your name"
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-0.5">
                    Birth Date (Optional)
                  </label>
                  <p className="text-[11px] text-[#78716C] mb-1.5">
                    Used to calculate elapsed weeks in the Lifetime visualization. You can skip this
                    anytime.
                  </p>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#292524] block mb-1">
                    Preferred First Day of Week
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWeekStartsOn(1)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                        weekStartsOn === 1
                          ? 'border-[#292524] bg-[#292524] text-white'
                          : 'border-[#EFECE6] bg-white text-[#78716C]'
                      }`}
                    >
                      Monday
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekStartsOn(0)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                        weekStartsOn === 0
                          ? 'border-[#292524] bg-[#292524] text-white'
                          : 'border-[#EFECE6] bg-white text-[#78716C]'
                      }`}
                    >
                      Sunday
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: COLOR PALETTE */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-[#292524]">Select a Visual Theme</h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Choose a harmonious palette. You can change this anytime without losing answers.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {Object.values(THEME_PALETTES).map((pal) => {
                  const isSelected = selectedTheme === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSelectedTheme(pal.id)}
                      className={`w-full p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#292524] bg-white ring-1 ring-[#292524]'
                          : 'border-[#EFECE6] bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#292524]">{pal.name}</span>
                        {isSelected && <Check size={14} className="text-[#292524]" />}
                      </div>
                      <div className="flex gap-1.5">
                        {(Object.keys(pal.colors) as MoodType[]).map((m) => (
                          <div
                            key={m}
                            className="flex-1 h-3 rounded-md"
                            style={{ backgroundColor: pal.colors[m] }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 4: PRIVACY */}
          {step === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-3xl bg-[#E8EFE8] flex items-center justify-center mx-auto text-[#7EAE8B]">
                <Shield size={26} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#292524]">Your Journal, Private & Local</h3>
                <p className="text-xs text-[#78716C] leading-relaxed mt-2 max-w-xs mx-auto">
                  Life in Pixels requires no account, email, or passwords. Your entries, ratings,
                  reflections, and photos remain on this device.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] text-left text-xs text-[#78716C] space-y-1.5">
                <p>• No cloud tracking or ads.</p>
                <p>• Data persists across app restarts.</p>
                <p>• You can export your data anytime in Settings.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#F0EEE6] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button
              onClick={() => {
                onComplete({ displayName: name.trim() || 'Friend', onboardingCompleted: true });
              }}
              className="px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              Skip Intro
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[#FFB7B2] text-[#292524] text-xs font-semibold flex items-center gap-1 hover:bg-[#FFA5A0] shadow-xs cursor-pointer"
          >
            <span>{step === 4 ? 'Begin Journal' : 'Continue'}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
