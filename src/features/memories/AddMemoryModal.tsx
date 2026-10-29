import React, { useState } from 'react';
import {
  X,
  Heart,
  Plus,
  Image as ImageIcon,
  Trash2,
  Check,
  Camera,
  Quote as QuoteIcon,
  Sun,
  Smile,
  Meh,
  CloudRain,
  Wind,
} from 'lucide-react';
import type { Memory, MoodType } from '../../types';
import { MOOD_CONFIG } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';
import { formatDateKey } from '../../utils/rules';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { QuoteFinderModal } from '../quotes/QuoteFinderModal';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: Memory) => void;
  existingMemory?: Memory;
  enableHaptics: boolean;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingMemory,
  enableHaptics,
}) => {
  const [date, setDate] = useState<string>(existingMemory?.date || formatDateKey(new Date()));
  const [title, setTitle] = useState<string>(existingMemory?.title || '');
  const [text, setText] = useState<string>(existingMemory?.text || '');
  const [tags, setTags] = useState<string[]>(existingMemory?.tags || ['Moments']);
  const [customTag, setCustomTag] = useState('');
  const [isFavorite, setIsFavorite] = useState<boolean>(existingMemory?.isFavorite || false);
  const [mood, setMood] = useState<MoodType>(existingMemory?.mood || 'good');
  const [photos, setPhotos] = useState<string[]>(existingMemory?.photos || []);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQuoteFinderOpen, setIsQuoteFinderOpen] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos([reader.result]);
          triggerHaptic('light', enableHaptics);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
      triggerHaptic('light', enableHaptics);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    triggerHaptic('success', enableHaptics);
    onSave({
      id: existingMemory?.id || `mem-${Date.now()}`,
      date,
      title: title.trim() || undefined,
      text: text.trim(),
      tags,
      photos,
      isFavorite,
      mood,
      createdAt: existingMemory?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add or Edit Memory"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
              Personal Journal
            </span>
            <h3 className="text-base font-bold text-[#292524]">
              {existingMemory ? 'Edit Memory' : 'Preserve a Memory'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#292524] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto no-scrollbar space-y-4 flex-1">
          {/* Date & Favorite */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                Favorite
              </label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection', enableHaptics);
                  setIsFavorite(!isFavorite);
                }}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isFavorite
                    ? 'bg-[#FFB7B2]/20 border-[#FFB7B2] text-[#FFB7B2]'
                    : 'bg-white border-[#EFECE6] text-[#A8A29E]'
                }`}
              >
                <Heart size={16} className={isFavorite ? 'fill-[#FFB7B2]' : ''} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Afternoon rain, Grandma's apple cake..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
            />
          </div>

          {/* Memory text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#78716C]">
                Memory Reflection *
              </label>
              <button
                type="button"
                onClick={() => setIsQuoteFinderOpen(true)}
                className="text-[10px] text-[#FFB7B2] hover:text-[#FFA5A0] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <QuoteIcon size={11} /> Quote Inspiration
              </button>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Write the details, sensations, or words spoken..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3.5 bg-white rounded-2xl border border-[#EFECE6] text-xs leading-relaxed text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2] resize-none"
            />
          </div>

          {/* Mood association */}
          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1.5">
              Feeling Tone
            </label>
            <div className="flex gap-1.5">
              {(['wonderful', 'good', 'okay', 'low', 'difficult'] as MoodType[]).map((m) => {
                const isSelected = mood === m;
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      triggerHaptic('selection', enableHaptics);
                      setMood(m);
                    }}
                    className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-semibold border text-center capitalize transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-[#292524] bg-white ring-1 ring-[#292524] shadow-xs text-[#292524]'
                        : 'border-transparent text-[#78716C] opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: isSelected ? 'white' : MOOD_CONFIG[m].softlyColor }}
                  >
                    <span>
                      {m === 'wonderful' && <Sun size={13} className="stroke-[2.2]" />}
                      {m === 'good' && <Smile size={13} className="stroke-[2.2]" />}
                      {m === 'okay' && <Meh size={13} className="stroke-[2.2]" />}
                      {m === 'low' && <CloudRain size={13} className="stroke-[2.2]" />}
                      {m === 'difficult' && <Wind size={13} className="stroke-[2.2]" />}
                    </span>
                    <span className="leading-none">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 bg-white border border-[#EFECE6] rounded-lg text-[10px] text-[#78716C] flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-[#FAF9F5] border border-[#EFECE6] rounded-xl text-xs font-semibold text-[#292524] cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Photo attachment with Camera support */}
          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1">Photo</label>
            {photos.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden h-36 border border-[#EFECE6]">
                <img src={photos[0]} alt="Uploaded" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light', enableHaptics);
                    setIsCameraOpen(true);
                  }}
                  className="p-3 bg-[#FAF9F5] hover:bg-[#FFF5F4] border-2 border-dashed border-[#FFB7B2] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#292524] cursor-pointer"
                >
                  <Camera size={16} className="text-[#FFB7B2]" />
                  <span>Camera</span>
                </button>

                <label className="p-3 bg-[#FAF9F5] hover:bg-white border border-[#EFECE6] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-[#78716C] cursor-pointer">
                  <ImageIcon size={16} />
                  <span>Gallery</span>
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

          <div className="pt-3 border-t border-[#F0EEE6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#FFB7B2] disabled:opacity-40 text-[#292524] text-xs font-semibold hover:bg-[#FFA5A0] transition-colors cursor-pointer shadow-xs"
            >
              Save Memory
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(dataUrl) => {
            setPhotos([dataUrl]);
            triggerHaptic('success', enableHaptics);
          }}
        />
      )}

      {/* Quote Finder Modal */}
      {isQuoteFinderOpen && (
        <QuoteFinderModal
          isOpen={isQuoteFinderOpen}
          onClose={() => setIsQuoteFinderOpen(false)}
          onSelectQuote={(q) => {
            setText((prev) => (prev ? `${prev}\n\n${q}` : q));
            triggerHaptic('success', enableHaptics);
          }}
          enableHaptics={enableHaptics}
        />
      )}
    </div>
  );
};
