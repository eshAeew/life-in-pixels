import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Smile,
  Meh,
  CloudRain,
  Wind,
  Check,
  Plus,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Camera,
  Quote as QuoteIcon,
  Zap,
  Activity,
  Heart,
  Star,
} from 'lucide-react';
import type { DailyEntry, MoodType, RatingScale } from '../../types';
import { MOOD_CONFIG } from '../../theme/palettes';
import { getPixelColor } from '../../utils/rules';
import { triggerHaptic } from '../../utils/haptics';
import { useLifeStore } from '../../store/useLifeStore';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { QuoteFinderModal } from '../quotes/QuoteFinderModal';

interface DailyCheckInModalProps {
  date: string; // YYYY-MM-DD
  existingEntry?: DailyEntry;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (entry: DailyEntry) => void;
}

const PRESET_TAGS = [
  'Work',
  'Study',
  'Family',
  'Friends',
  'Health & fitness',
  'Travel',
  'Creativity',
  'Rest',
  'Achievement',
  'Something new',
  'Difficult moment',
  'Quiet time',
];

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  date,
  existingEntry,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { settings, saveEntry } = useLifeStore();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 6;

  // Question 1: What was the overall feeling?
  const [mood, setMood] = useState<MoodType>(existingEntry?.mood || 'good');

  // Question 2: How was your energy? (1-5)
  const [energyRating, setEnergyRating] = useState<RatingScale>(
    existingEntry?.energyRating || 3
  );

  // Question 3: How stressful was today? (1-5)
  const [stressRating, setStressRating] = useState<RatingScale>(
    existingEntry?.stressRating || 3
  );

  // Question 4: Did today feel meaningful? (1-5)
  const [meaningRating, setMeaningRating] = useState<RatingScale>(
    existingEntry?.meaningRating || 3
  );

  // Question 5: How would you rate your day overall? (1-5)
  const [overallRating, setOverallRating] = useState<RatingScale>(
    existingEntry?.overallRating || 4
  );

  // Question 6: What do you want to remember? (Reflection, tags, photos)
  const [reflection, setReflection] = useState<string>(existingEntry?.reflection || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingEntry?.tags || []);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>(existingEntry?.photos || []);

  // UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQuoteFinderOpen, setIsQuoteFinderOpen] = useState(false);
  const [isSavedAnimating, setIsSavedAnimating] = useState(false);

  if (!isOpen) return null;

  // Multi-parametric color determined dynamically by all 5 questions (3,125 combinations)
  const previewPixelColor = getPixelColor(
    mood,
    overallRating,
    energyRating,
    stressRating,
    meaningRating,
    settings.themeId,
    settings.customMoodColors
  );

  const handleNext = () => {
    triggerHaptic('light', settings.enableHaptics);
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      handleFinalSave();
    }
  };

  const handleBack = () => {
    triggerHaptic('light', settings.enableHaptics);
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
      triggerHaptic('light', settings.enableHaptics);
    }
  };

  const toggleTag = (tag: string) => {
    triggerHaptic('selection', settings.enableHaptics);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos([reader.result]);
          triggerHaptic('light', settings.enableHaptics);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSave = () => {
    setIsSavedAnimating(true);
    triggerHaptic('success', settings.enableHaptics);

    const newEntry: DailyEntry = {
      id: existingEntry?.id || `entry-${date}`,
      date,
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mood,
      energyRating,
      stressRating,
      meaningRating,
      overallRating,
      meaningResponses: [
        {
          id: 'meaning-response',
          question: 'Did today feel meaningful?',
          answeredYes: meaningRating >= 4,
        },
      ],
      tags: selectedTags,
      reflection: reflection.trim() || undefined,
      photos,
      pixelColor: previewPixelColor,
      isCompleted: true,
    };

    saveEntry(newEntry);

    setTimeout(() => {
      setIsSavedAnimating(false);
      onSaved(newEntry);
      onClose();
    }, 450);
  };

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily Check-in Survey"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#292524]/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar with Live Color Indicator */}
        <div className="px-6 pt-5 pb-3 border-b border-[#F0EEE6] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
              Question {step} of {totalSteps} • {formattedDate}
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <div
                className="w-4 h-4 rounded-full border border-black/10 shadow-xs transition-colors duration-300"
                style={{ backgroundColor: previewPixelColor }}
                title="Dynamic pixel color resulting from your combined answers"
              />
              <span className="text-xs font-semibold text-[#292524]">
                Dynamic Pixel: {previewPixelColor}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close survey without saving"
            className="p-2 rounded-full text-[#78716C] hover:text-[#292524] hover:bg-[#E8EFE8]/40 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#F0EEE6] h-1">
          <div
            className="bg-[#FFB7B2] h-1 transition-all duration-300 rounded-r-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Question Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {/* 1. What was the overall feeling? */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  Question 1
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                  What was the overall feeling?
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Sets your pixel&apos;s base emotional hue.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: 'wonderful', icon: Sun, label: 'Wonderful', desc: 'Joyful, uplifting, radiant moments' },
                  { id: 'good', icon: Smile, label: 'Good', desc: 'Content, peaceful, pleasant' },
                  { id: 'okay', icon: Meh, label: 'Okay', desc: 'Steady, ordinary, calm and gentle' },
                  { id: 'low', icon: CloudRain, label: 'Low', desc: 'Quiet, weary, low energy or cloudy' },
                  { id: 'difficult', icon: Wind, label: 'Difficult', desc: 'Challenging, heavy, or tough moments' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = mood === item.id;
                  const color = MOOD_CONFIG[item.id as MoodType].softlyColor;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMood(item.id as MoodType);
                        triggerHaptic('selection', settings.enableHaptics);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#292524] bg-white ring-1 ring-[#292524] shadow-xs'
                          : 'border-[#EFECE6] bg-white/70 hover:bg-white hover:border-[#D6D3CD]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#292524] shadow-xs shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          <Icon size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#292524]">{item.label}</div>
                          <div className="text-[11px] text-[#78716C]">{item.desc}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#292524] text-white flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. How was your energy? */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  Question 2
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                  How was your energy?
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Modulates your pixel&apos;s saturation and vitality.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] space-y-4">
                <div className="flex justify-between text-xs text-[#78716C] font-semibold">
                  <span>1 • Drained</span>
                  <span>3 • Steady</span>
                  <span>5 • Energized</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setEnergyRating(val as RatingScale);
                        triggerHaptic('selection', settings.enableHaptics);
                      }}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        energyRating === val
                          ? 'bg-[#E8EFE8] text-[#292524] ring-2 ring-[#7EAE8B] font-bold shadow-xs'
                          : 'bg-[#FAF9F5] text-[#78716C] hover:bg-[#E8EFE8]/50 border border-[#EFECE6]'
                      }`}
                    >
                      <Zap size={15} className={energyRating === val ? 'text-[#7EAE8B]' : 'text-[#A8A29E]'} />
                      <span className="text-sm font-bold mt-1">{val}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-[#78716C] italic font-serif pt-1">
                  {energyRating === 1 && 'Low battery today — rest is welcome.'}
                  {energyRating === 2 && 'Slightly drained, taking it gentle.'}
                  {energyRating === 3 && 'A steady, balanced pace.'}
                  {energyRating === 4 && 'Feeling capable and refreshed.'}
                  {energyRating === 5 && 'High energy, vibrant, and alive.'}
                </p>
              </div>
            </div>
          )}

          {/* 3. How stressful was today? */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  Question 3
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                  How stressful was today?
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Adjusts color temperature and depth.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] space-y-4">
                <div className="flex justify-between text-xs text-[#78716C] font-semibold">
                  <span>1 • Peaceful</span>
                  <span>3 • Moderate</span>
                  <span>5 • Very Tense</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setStressRating(val as RatingScale);
                        triggerHaptic('selection', settings.enableHaptics);
                      }}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        stressRating === val
                          ? 'bg-[#EFEDF4] text-[#292524] ring-2 ring-[#B4A2D8] font-bold shadow-xs'
                          : 'bg-[#FAF9F5] text-[#78716C] hover:bg-[#EFEDF4]/50 border border-[#EFECE6]'
                      }`}
                    >
                      <Activity size={15} className={stressRating === val ? 'text-[#B4A2D8]' : 'text-[#A8A29E]'} />
                      <span className="text-sm font-bold mt-1">{val}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-[#78716C] italic font-serif pt-1">
                  {stressRating === 1 && 'Deeply peaceful and unhurried.'}
                  {stressRating === 2 && 'Gentle ease with minor demands.'}
                  {stressRating === 3 && 'Normal daily rhythm and routine.'}
                  {stressRating === 4 && 'Noticeable pressure and strain.'}
                  {stressRating === 5 && 'High stress — honoring your endurance.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. Did today feel meaningful? */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  Question 4
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                  Did today feel meaningful?
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Enhances richness and inner depth of your pixel.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] space-y-4">
                <div className="flex justify-between text-xs text-[#78716C] font-semibold">
                  <span>1 • Quiet/Plain</span>
                  <span>3 • Balanced</span>
                  <span>5 • Deeply Meaningful</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setMeaningRating(val as RatingScale);
                        triggerHaptic('selection', settings.enableHaptics);
                      }}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        meaningRating === val
                          ? 'bg-[#FFF3E0] text-[#292524] ring-2 ring-[#FFA726] font-bold shadow-xs'
                          : 'bg-[#FAF9F5] text-[#78716C] hover:bg-[#FFF3E0]/50 border border-[#EFECE6]'
                      }`}
                    >
                      <Heart size={15} className={meaningRating === val ? 'fill-[#FFA726] text-[#FFA726]' : 'text-[#A8A29E]'} />
                      <span className="text-sm font-bold mt-1">{val}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-[#78716C] italic font-serif pt-1">
                  {meaningRating === 1 && 'An ordinary pass-through day.'}
                  {meaningRating === 2 && 'A small quiet moment or two.'}
                  {meaningRating === 3 && 'Steady, meaningful connections.'}
                  {meaningRating === 4 && 'Felt purposeful and connected.'}
                  {meaningRating === 5 && 'Deeply memorable and profound.'}
                </p>
              </div>
            </div>
          )}

          {/* 5. How would you rate your day overall? */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                  Question 5
                </span>
                <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                  How would you rate your day overall?
                </h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Sets your pixel&apos;s luminosity and brightness.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#EFECE6] space-y-4">
                <div className="flex justify-between text-xs text-[#78716C] font-semibold">
                  <span>1 • Difficult</span>
                  <span>3 • Balanced</span>
                  <span>5 • Wonderful</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setOverallRating(val as RatingScale);
                        triggerHaptic('selection', settings.enableHaptics);
                      }}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        overallRating === val
                          ? 'bg-[#E8EFE8] text-[#292524] ring-2 ring-[#7EAE8B] font-bold shadow-xs'
                          : 'bg-[#FAF9F5] text-[#78716C] hover:bg-[#E8EFE8]/50 border border-[#EFECE6]'
                      }`}
                    >
                      <Star size={15} className={overallRating === val ? 'fill-[#7EAE8B] text-[#7EAE8B]' : 'text-[#A8A29E]'} />
                      <span className="text-sm font-bold mt-1">{val} / 5</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. What do you want to remember? */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#FFB7B2]">
                    Question 6
                  </span>
                  <h3 className="text-xl font-bold text-[#292524] mt-0.5">
                    What do you want to remember?
                  </h3>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Preserve thoughts, themes, and snapshots.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuoteFinderOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#EFECE6] hover:bg-white text-[11px] font-semibold text-[#78716C] hover:text-[#292524] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Browse inspirational quotes dictionary"
                >
                  <QuoteIcon size={13} className="text-[#FFB7B2]" />
                  <span>Quote Finder</span>
                </button>
              </div>

              {/* Reflection Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="A phrase someone said, the morning coffee aroma, a gentle moment to hold onto..."
                  className="w-full p-4 text-xs bg-white rounded-2xl border border-[#EFECE6] focus:outline-none focus:ring-2 focus:ring-[#FFB7B2]/40 text-[#292524] placeholder:text-[#A8A29E] leading-relaxed resize-none font-sans"
                />
                <div className="absolute right-3 bottom-3 text-[10px] text-[#A8A29E]">
                  {reflection.length} characters
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#78716C] block">
                  Themes & Activities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set([...PRESET_TAGS, ...selectedTags])).map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#292524] text-white shadow-xs'
                            : 'bg-white border border-[#EFECE6] text-[#78716C] hover:text-[#292524]'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom theme tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-[#EFECE6] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className="px-3 py-1.5 bg-[#FFB7B2] disabled:opacity-40 text-[#292524] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Photo Area with Device Camera */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#78716C] block">
                  Daily Photo Memory
                </span>

                <div className="bg-white p-4 rounded-2xl border border-[#EFECE6] space-y-3">
                  {photos.length > 0 ? (
                    <div className="relative rounded-2xl overflow-hidden group border border-[#EFECE6]">
                      <img
                        src={photos[0]}
                        alt="Daily memory"
                        className="w-full h-44 object-cover rounded-2xl"
                      />
                      <div className="absolute top-2 left-2 bg-[#292524]/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                        <Camera size={11} /> Photo attached
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotos([])}
                        aria-label="Remove photo"
                        className="absolute top-2 right-2 p-2 bg-[#292524]/80 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer shadow-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light', settings.enableHaptics);
                          setIsCameraOpen(true);
                        }}
                        className="p-3.5 rounded-2xl border-2 border-dashed border-[#FFB7B2] bg-[#FAF9F5] hover:bg-[#FFF5F4] flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors"
                      >
                        <Camera size={20} className="text-[#FFB7B2]" />
                        <span className="text-xs font-bold text-[#292524]">
                          Use Camera
                        </span>
                        <span className="text-[10px] text-[#78716C]">
                          Capture now
                        </span>
                      </button>

                      <label className="p-3.5 rounded-2xl border border-[#EFECE6] bg-[#FAF9F5] hover:bg-white flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors">
                        <ImageIcon size={20} className="text-[#A8A29E]" />
                        <span className="text-xs font-semibold text-[#292524]">
                          From Gallery
                        </span>
                        <span className="text-[10px] text-[#78716C]">
                          Upload file
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Pixel Final Recap */}
              <div className="bg-[#FAF9F5] p-4 rounded-3xl border border-[#F0EEE6] flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl border border-black/10 shadow-sm flex items-center justify-center text-white"
                    style={{ backgroundColor: previewPixelColor }}
                  >
                    <span className="text-[#292524]">
                      {mood === 'wonderful' && <Sun size={22} className="stroke-[2.2]" />}
                      {mood === 'good' && <Smile size={22} className="stroke-[2.2]" />}
                      {mood === 'okay' && <Meh size={22} className="stroke-[2.2]" />}
                      {mood === 'low' && <CloudRain size={22} className="stroke-[2.2]" />}
                      {mood === 'difficult' && <Wind size={22} className="stroke-[2.2]" />}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">
                      Combined Pixel Result
                    </span>
                    <span className="text-sm font-bold text-[#292524]">
                      {MOOD_CONFIG[mood].label} • {previewPixelColor}
                    </span>
                    <span className="text-[10px] text-[#78716C] block">
                      Tuned by energy, stress, meaning & rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#F0EEE6] bg-[#FAF9F5] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < totalSteps && (
              <button
                onClick={() => setStep(totalSteps)}
                className="px-3 py-2 text-xs text-[#78716C] hover:text-[#292524] cursor-pointer"
              >
                Skip to Review
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isSavedAnimating}
              className={`px-5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                step === totalSteps
                  ? 'bg-[#FFB7B2] text-[#292524] hover:bg-[#FFA5A0] active:scale-95'
                  : 'bg-[#292524] text-white hover:bg-[#3E3937]'
              }`}
            >
              {step === totalSteps ? (
                <>
                  <Check size={15} />
                  <span>{isSavedAnimating ? 'Saving Pixel...' : 'Save Today’s Pixel'}</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(dataUrl) => {
            setPhotos([dataUrl]);
            triggerHaptic('success', settings.enableHaptics);
          }}
        />
      )}

      {/* Quote Finder Modal */}
      {isQuoteFinderOpen && (
        <QuoteFinderModal
          isOpen={isQuoteFinderOpen}
          onClose={() => setIsQuoteFinderOpen(false)}
          onSelectQuote={(q) => {
            setReflection((r) => (r ? `${r}\n\n${q}` : q));
            triggerHaptic('success', settings.enableHaptics);
          }}
          enableHaptics={settings.enableHaptics}
        />
      )}
    </div>
  );
};
