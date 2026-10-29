import React, { useState } from 'react';
import {
  X,
  Flag,
  Sparkles,
  Heart,
  Briefcase,
  Compass,
  Palette,
  Activity,
  Award,
} from 'lucide-react';
import type { Milestone } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { formatDateKey } from '../../utils/rules';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
  existingMilestone?: Milestone;
  enableHaptics: boolean;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingMilestone,
  enableHaptics,
}) => {
  const [title, setTitle] = useState(existingMilestone?.title || '');
  const [date, setDate] = useState(existingMilestone?.date || formatDateKey(new Date()));
  const [description, setDescription] = useState(existingMilestone?.description || '');
  const [category, setCategory] = useState<Milestone['category']>(
    existingMilestone?.category || 'life'
  );
  const [isFutureGoal, setIsFutureGoal] = useState(existingMilestone?.isFutureGoal || false);

  if (!isOpen) return null;

  const categoryOptions: DropdownOption[] = [
    { value: 'life', label: 'Life & Living', icon: <Compass size={14} /> },
    { value: 'career', label: 'Career & Purpose', icon: <Briefcase size={14} /> },
    { value: 'relationship', label: 'Relationships & Love', icon: <Heart size={14} /> },
    { value: 'creative', label: 'Creative & Arts', icon: <Palette size={14} /> },
    { value: 'health', label: 'Health & Vitality', icon: <Activity size={14} /> },
    { value: 'travel', label: 'Travel & Places', icon: <Compass size={14} /> },
    { value: 'other', label: 'Other Significance', icon: <Award size={14} /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic('success', enableHaptics);
    onSave({
      id: existingMilestone?.id || `milestone-${Date.now()}`,
      date,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      isFutureGoal,
      createdAt: existingMilestone?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Life Milestone or Goal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFB7B2]/20 text-[#292524] flex items-center justify-center">
              <Flag size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                Significant Moments
              </span>
              <h3 className="text-base font-bold text-[#292524]">
                {existingMilestone ? 'Edit Milestone' : 'Add Milestone or Goal'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#292524]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
              Milestone Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Moved into the sunlit flat, Ran first 10k..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
              />
            </div>

            <div>
              <CustomDropdown
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={(val) => setCategory(val as Milestone['category'])}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
              Description & Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Why does this moment matter? Who was there? What did it feel like?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-white rounded-2xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2] resize-none leading-relaxed"
            />
          </div>

          {/* Goal vs Past milestone toggle */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#EFECE6] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#292524] block">
                Future Life Goal
              </span>
              <span className="text-[11px] text-[#78716C]">
                Highlights this as an upcoming aspiration rather than a past record
              </span>
            </div>
            <input
              type="checkbox"
              checked={isFutureGoal}
              onChange={(e) => setIsFutureGoal(e.target.checked)}
              className="h-4 w-4 rounded accent-[#FFB7B2] cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#F0EEE6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#78716C] hover:text-[#292524] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#FFB7B2] text-[#292524] text-xs font-semibold hover:bg-[#FFA5A0] cursor-pointer shadow-xs"
            >
              Save Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
