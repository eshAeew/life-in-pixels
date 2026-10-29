import React, { useState } from 'react';
import {
  Search,
  Plus,
  Heart,
  Flag,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';
import type { Memory, Milestone, MoodType } from '../../types';
import { MOOD_CONFIG } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';
import { AddMemoryModal } from './AddMemoryModal';
import { AddMilestoneModal } from './AddMilestoneModal';
import { QuoteFinderModal } from '../quotes/QuoteFinderModal';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';
import { Quote as QuoteIcon } from 'lucide-react';

interface MemoriesScreenProps {
  memories: Memory[];
  milestones: Milestone[];
  enableHaptics: boolean;
  onSaveMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSaveMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  memories,
  milestones,
  enableHaptics,
  onSaveMemory,
  onDeleteMemory,
  onToggleFavorite,
  onSaveMilestone,
  onDeleteMilestone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'milestones' | 'photos'>(
    'all'
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | undefined>(undefined);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>(undefined);
  const [isQuoteFinderOpen, setIsQuoteFinderOpen] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags || [])));

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = m.text.toLowerCase().includes(q);
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchTag = m.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchText && !matchTitle && !matchTag) return false;
    }

    if (activeFilter === 'favorites' && !m.isFavorite) return false;
    if (activeFilter === 'photos' && (!m.photos || m.photos.length === 0)) return false;
    if (selectedTag && !m.tags.includes(selectedTag)) return false;

    return true;
  });

  // Past milestones vs Future Goals
  const pastMilestones = milestones.filter((ms) => !ms.isFutureGoal);
  const futureGoals = milestones.filter((ms) => ms.isFutureGoal);

  const filterDropdownOptions: DropdownOption[] = [
    { value: 'all', label: 'All Records', sublabel: `${memories.length} memories & milestones` },
    { value: 'favorites', label: 'Favorites Only', sublabel: `${memories.filter((m) => m.isFavorite).length} starred memories` },
    { value: 'milestones', label: 'Milestones & Goals', sublabel: `${milestones.length} life milestones` },
    { value: 'photos', label: 'With Photos', sublabel: `${memories.filter((m) => m.photos?.length).length} photo entries` },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-handwriting text-2xl text-[#FFB7B2]">the little things</span>
          <h2 className="text-2xl font-bold tracking-tight text-[#292524] mt-0.5">Memories</h2>
          <p className="text-xs text-[#78716C] mt-1">
            Words, snapshots, and milestones that give shape to your years.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            onClick={() => {
              triggerHaptic('light', enableHaptics);
              setIsQuoteFinderOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-white border border-[#EFECE6] text-[#78716C] hover:text-[#292524] flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
            title="Browse Inspirational Quotes"
          >
            <QuoteIcon size={14} className="text-[#FFB7B2]" />
            <span className="hidden sm:inline">Quotes</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light', enableHaptics);
              setEditingMilestone(undefined);
              setIsMilestoneModalOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-white border border-[#EFECE6] text-[#78716C] hover:text-[#292524] flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
            title="Add Milestone"
          >
            <Flag size={14} />
            <span className="hidden sm:inline">Milestone</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light', enableHaptics);
              setEditingMemory(undefined);
              setIsMemoryModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-2xl bg-[#FFB7B2] hover:bg-[#FFA5A0] text-[#292524] flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdown & Search Bar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2 relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]"
          />
          <input
            type="text"
            placeholder="Search memories, reflections, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2] placeholder:text-[#A8A29E] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#A8A29E] hover:text-[#292524] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <CustomDropdown
            options={filterDropdownOptions}
            value={activeFilter}
            onChange={(val) => {
              triggerHaptic('selection', enableHaptics);
              setActiveFilter(val as any);
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'milestones', label: 'Milestones & Goals', icon: Flag },
          { id: 'photos', label: 'With Photos', icon: ImageIcon },
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection', enableHaptics);
                setActiveFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'bg-white border border-[#EFECE6] text-[#78716C] hover:border-[#D6D3CD]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tag Chips filter */}
      {allTags.length > 0 && activeFilter !== 'milestones' && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] text-[#78716C] shrink-0 font-medium mr-1">Tags:</span>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => {
                  triggerHaptic('selection', enableHaptics);
                  setSelectedTag(isSelected ? null : tag);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] shrink-0 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#FFB7B2] text-[#292524] font-semibold'
                    : 'bg-[#FAF9F5] text-[#78716C] border border-[#F0EEE6] hover:text-[#292524]'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* MILESTONES & GOALS SECTION (When selected or when on Milestones tab) */}
      {(activeFilter === 'milestones' || (!searchQuery && !selectedTag && activeFilter === 'all')) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag size={16} className="text-[#FFB7B2]" />
              <h3 className="text-sm font-bold text-[#292524]">Life Milestones</h3>
            </div>
            <button
              onClick={() => {
                setEditingMilestone(undefined);
                setIsMilestoneModalOpen(true);
              }}
              className="text-[11px] font-semibold text-[#FFB7B2] hover:text-[#FFA5A0] cursor-pointer"
            >
              + Add Milestone
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pastMilestones.map((ms) => (
              <div
                key={ms.id}
                className="p-4 bg-white rounded-3xl border border-[#EFECE6] shadow-soft space-y-2 relative group"
              >
                <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                  <span className="font-medium text-[#FFB7B2] uppercase tracking-wider text-[10px]">
                    {ms.category}
                  </span>
                  <span>{ms.date}</span>
                </div>
                <h4 className="text-sm font-bold text-[#292524]">{ms.title}</h4>
                {ms.description && (
                  <p className="text-xs text-[#78716C] leading-relaxed">{ms.description}</p>
                )}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0EEE6] opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingMilestone(ms);
                      setIsMilestoneModalOpen(true);
                    }}
                    className="p-1 text-[#78716C] hover:text-[#292524]"
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this milestone?')) onDeleteMilestone(ms.id);
                    }}
                    className="p-1 text-[#78716C] hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FUTURE GOALS (Separated clearly as requested) */}
          {futureGoals.length > 0 && (
            <div className="pt-2 space-y-3">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">
                Upcoming Life Goals
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {futureGoals.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 bg-[#FAF9F5] rounded-3xl border border-dashed border-[#D6D3CD] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#78716C]">
                      <span className="font-semibold text-[#7EAE8B] uppercase">Target Date</span>
                      <span>{g.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#292524]">{g.title}</h4>
                    {g.description && <p className="text-xs text-[#78716C]">{g.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHRONOLOGICAL MEMORIES LIST */}
      {activeFilter !== 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#292524]">
              Timeline Records ({filteredMemories.length})
            </h3>
          </div>

          {filteredMemories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EFECE6] p-8 text-center space-y-2">
              <p className="font-handwriting text-2xl text-[#FFB7B2]">a quiet page</p>
              <h4 className="text-sm font-semibold text-[#292524]">No memories found</h4>
              <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                No memories match your search or filter. You can add one anytime using the button
                above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMemories.map((mem) => {
                const moodInfo = mem.mood ? MOOD_CONFIG[mem.mood] : null;

                return (
                  <article
                    key={mem.id}
                    className="bg-white rounded-3xl border border-[#EFECE6] p-5 shadow-soft space-y-3 hover:border-[#D6D3CD] transition-all relative group"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {moodInfo && (
                          <div
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: moodInfo.softlyColor }}
                            title={`Felt ${moodInfo.label}`}
                          />
                        )}
                        <span className="text-[11px] font-semibold text-[#78716C]">
                          {mem.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            triggerHaptic('light', enableHaptics);
                            onToggleFavorite(mem.id);
                          }}
                          aria-label={mem.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            mem.isFavorite
                              ? 'text-[#FFB7B2] hover:text-[#FFA5A0]'
                              : 'text-[#D6D3CD] hover:text-[#78716C]'
                          }`}
                        >
                          <Heart
                            size={16}
                            className={mem.isFavorite ? 'fill-[#FFB7B2]' : ''}
                          />
                        </button>

                        <button
                          onClick={() => {
                            setEditingMemory(mem);
                            setIsMemoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-full text-[#A8A29E] hover:text-[#292524] cursor-pointer"
                          title="Edit Memory"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Delete this memory?')) {
                              onDeleteMemory(mem.id);
                            }
                          }}
                          className="p-1.5 rounded-full text-[#A8A29E] hover:text-red-500 cursor-pointer"
                          title="Delete Memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Title if present */}
                    {mem.title && (
                      <h4 className="text-sm font-bold text-[#292524]">{mem.title}</h4>
                    )}

                    {/* Written text */}
                    <p className="text-xs text-[#292524] leading-relaxed whitespace-pre-wrap font-sans">
                      {mem.text}
                    </p>

                    {/* Photos if present */}
                    {mem.photos && mem.photos.length > 0 && (
                      <div
                        onClick={() => {
                          triggerHaptic('light', enableHaptics);
                          setZoomPhoto(mem.photos[0]);
                        }}
                        className="rounded-2xl overflow-hidden border border-[#EFECE6] max-h-56 cursor-zoom-in group/img relative shadow-2xs hover:border-[#FFB7B2] transition-colors"
                      >
                        <img
                          src={mem.photos[0]}
                          alt="Memory attachment"
                          className="w-full h-full object-cover group-hover/img:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-xs rounded-lg text-white text-[10px] font-medium flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <ImageIcon size={11} /> Tap to expand
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mem.tags.map((t) => (
                          <span
                            key={t}
                            onClick={() => setSelectedTag(t)}
                            className="text-[10px] px-2.5 py-0.5 bg-[#FAF9F5] border border-[#F0EEE6] text-[#78716C] rounded-lg cursor-pointer hover:border-[#D6D3CD]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isMemoryModalOpen && (
        <AddMemoryModal
          isOpen={isMemoryModalOpen}
          existingMemory={editingMemory}
          onClose={() => {
            setIsMemoryModalOpen(false);
            setEditingMemory(undefined);
          }}
          onSave={onSaveMemory}
          enableHaptics={enableHaptics}
        />
      )}

      {isMilestoneModalOpen && (
        <AddMilestoneModal
          isOpen={isMilestoneModalOpen}
          existingMilestone={editingMilestone}
          onClose={() => {
            setIsMilestoneModalOpen(false);
            setEditingMilestone(undefined);
          }}
          onSave={onSaveMilestone}
          enableHaptics={enableHaptics}
        />
      )}

      {/* Quote Finder Modal */}
      {isQuoteFinderOpen && (
        <QuoteFinderModal
          isOpen={isQuoteFinderOpen}
          onClose={() => setIsQuoteFinderOpen(false)}
          enableHaptics={enableHaptics}
        />
      )}

      {/* Photo Lightbox Modal */}
      {zoomPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged memory photograph"
          onClick={() => setZoomPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#FAF9F5] p-3 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-2 px-1">
              <span className="text-xs font-semibold text-[#78716C]">Photograph Memory</span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#292524] flex items-center justify-center cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <img
              src={zoomPhoto}
              alt="Memory detail full"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-[#EFECE6]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
