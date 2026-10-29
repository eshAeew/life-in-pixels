import React, { useState } from 'react';
import { X, Search, Sparkles, Copy, Check, Shuffle, BookOpen, Quote as QuoteIcon } from 'lucide-react';
import { QUOTE_DICTIONARY, Quote } from '../../utils/quotes';
import { triggerHaptic } from '../../utils/haptics';

interface QuoteFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuote?: (quoteText: string) => void;
  enableHaptics: boolean;
}

export const QuoteFinderModal: React.FC<QuoteFinderModalProps> = ({
  isOpen,
  onClose,
  onSelectQuote,
  enableHaptics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [featuredQuote, setFeaturedQuote] = useState<Quote>(
    () => QUOTE_DICTIONARY[Math.floor(Math.random() * QUOTE_DICTIONARY.length)]
  );

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'presence', label: 'Presence' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'ordinary', label: 'Ordinary Life' },
    { id: 'rest', label: 'Rest & Balance' },
    { id: 'joy', label: 'Joy & Wonder' },
    { id: 'growth', label: 'Growth' },
  ];

  const filteredQuotes = QUOTE_DICTIONARY.filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = q.text.toLowerCase().includes(query);
      const matchAuthor = q.author.toLowerCase().includes(query);
      const matchTag = q.tags.some((t) => t.toLowerCase().includes(query));
      return matchText || matchAuthor || matchTag;
    }
    return true;
  });

  const handleShuffle = () => {
    triggerHaptic('light', enableHaptics);
    const random = QUOTE_DICTIONARY[Math.floor(Math.random() * QUOTE_DICTIONARY.length)];
    setFeaturedQuote(random);
  };

  const handleCopy = (quote: Quote) => {
    triggerHaptic('success', enableHaptics);
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quote Finder & Inspiration Dictionary"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFB7B2]/20 text-[#292524] flex items-center justify-center">
              <QuoteIcon size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                Inspirational Dictionary
              </span>
              <h3 className="text-base font-bold text-[#292524]">Quote Finder</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close quote finder"
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#292524] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1">
          {/* Featured Quote of the Moment */}
          <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F2] to-[#FFF3F1] p-5 rounded-3xl border border-[#FFE8E6] shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FFB7B2] flex items-center gap-1">
                <Sparkles size={12} /> Spark of the Day
              </span>
              <button
                onClick={handleShuffle}
                className="text-[11px] font-semibold text-[#78716C] hover:text-[#292524] flex items-center gap-1 cursor-pointer bg-white/70 px-2.5 py-1 rounded-full border border-[#EFECE6]"
              >
                <Shuffle size={12} /> New Quote
              </button>
            </div>

            <p className="text-xs text-[#292524] font-serif italic leading-relaxed text-balance">
              &ldquo;{featuredQuote.text}&rdquo;
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-[#78716C]">
                — {featuredQuote.author}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(featuredQuote)}
                  className="p-1.5 text-[#78716C] hover:text-[#292524] bg-white rounded-lg border border-[#EFECE6] cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copiedId === featuredQuote.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                </button>
                {onSelectQuote && (
                  <button
                    onClick={() => {
                      onSelectQuote(`"${featuredQuote.text}" — ${featuredQuote.author}`);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-[#FFB7B2] text-[#292524] rounded-lg text-[10px] font-semibold hover:bg-[#FFA5A0] cursor-pointer"
                  >
                    Use in Journal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
            <input
              type="text"
              placeholder="Search by topic, author, or word (e.g. rest, time, tea)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-2xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    triggerHaptic('selection', enableHaptics);
                    setSelectedCategory(c.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium shrink-0 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#292524] text-white shadow-xs'
                      : 'bg-white border border-[#EFECE6] text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Quotes List */}
          <div className="space-y-2.5">
            {filteredQuotes.map((q) => (
              <div
                key={q.id}
                className="p-4 bg-white rounded-2xl border border-[#EFECE6] hover:border-[#D6D3CD] transition-all space-y-2 group"
              >
                <p className="text-xs text-[#292524] leading-relaxed font-serif italic">
                  &ldquo;{q.text}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="font-semibold text-[#78716C]">— {q.author}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(q)}
                      className="p-1 text-[#78716C] hover:text-[#292524] cursor-pointer"
                      title="Copy Quote"
                    >
                      {copiedId === q.id ? (
                        <Check size={13} className="text-green-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    {onSelectQuote && (
                      <button
                        onClick={() => {
                          onSelectQuote(`"${q.text}" — ${q.author}`);
                          onClose();
                        }}
                        className="px-2 py-0.5 bg-[#FAF9F5] hover:bg-[#FFB7B2]/30 text-[#292524] border border-[#EFECE6] rounded-md text-[10px] font-medium cursor-pointer"
                      >
                        Insert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
