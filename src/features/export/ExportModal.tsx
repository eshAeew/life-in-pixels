import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, Image as ImageIcon, FileText, Check, Shield } from 'lucide-react';
import type { DailyEntry, ThemePalette } from '../../types';
import { THEME_PALETTES, MOOD_CONFIG } from '../../theme/palettes';
import { triggerHaptic } from '../../utils/haptics';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyEntry[];
  themeId: string;
  enableHaptics: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  themeId,
  enableHaptics,
}) => {
  const [exportType, setExportType] = useState<'month' | 'year' | 'json' | 'csv'>('month');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [customQuote, setCustomQuote] = useState('My life, one pixel at a time.');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const palette = THEME_PALETTES[themeId as keyof typeof THEME_PALETTES] || THEME_PALETTES['softly-pastel'];

  // Generate Canvas PNG Preview
  useEffect(() => {
    if (!isOpen || (exportType !== 'month' && exportType !== 'year')) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (exportType === 'month') {
      // 800 x 800 high-res card
      canvas.width = 800;
      canvas.height = 800;

      // Background
      ctx.fillStyle = '#FDFCF8';
      ctx.fillRect(0, 0, 800, 800);

      // Subtle border
      ctx.strokeStyle = '#EFECE6';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 760);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const monthTitle = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      // Header
      ctx.fillStyle = '#292524';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.fillText(monthTitle, 60, 90);

      ctx.fillStyle = '#78716C';
      ctx.font = '18px Outfit, sans-serif';
      ctx.fillText('Life in Pixels — Visual Journal', 60, 120);

      // Quote if included
      if (customQuote.trim()) {
        ctx.fillStyle = '#FFB7B2';
        ctx.font = '28px "Reenie Beanie", cursive, sans-serif';
        ctx.fillText(`"${customQuote}"`, 60, 160);
      }

      // Draw Month Grid (7 columns)
      const startX = 60;
      const startY = 200;
      const cellSize = 75;
      const gap = 14;

      const entryMap = new Map(entries.map((e) => [e.date, e]));

      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const col = (day - 1) % 7;
        const row = Math.floor((day - 1) / 7);
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = entryMap.get(dateKey);

        ctx.fillStyle = entry ? entry.pixelColor : palette.unrecordedColor;

        // Rounded rect for each cell
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 16);
        ctx.fill();

        // Day number
        ctx.fillStyle = entry ? '#292524' : '#A8A29E';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText(String(day), x + 10, y + 24);
      }

      // Legend at bottom
      const legendY = 680;
      ctx.fillStyle = '#78716C';
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillText('Palette: ' + palette.name, 60, legendY);

      let lx = 60;
      const moods: Array<keyof typeof palette.colors> = ['wonderful', 'good', 'okay', 'low', 'difficult'];
      moods.forEach((m) => {
        ctx.fillStyle = palette.colors[m];
        ctx.beginPath();
        ctx.roundRect(lx, legendY + 15, 20, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#292524';
        ctx.font = '13px Outfit, sans-serif';
        ctx.fillText(MOOD_CONFIG[m].label, lx + 28, legendY + 30);
        lx += 120;
      });

      setPreviewUrl(canvas.toDataURL('image/png'));
    } else if (exportType === 'year') {
      // 900 x 900 high-res year tapestry
      canvas.width = 900;
      canvas.height = 900;

      ctx.fillStyle = '#FDFCF8';
      ctx.fillRect(0, 0, 900, 900);

      const currentYear = new Date().getFullYear();

      ctx.fillStyle = '#292524';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.fillText(`${currentYear} Life in Pixels`, 60, 90);

      ctx.fillStyle = '#78716C';
      ctx.font = '18px Outfit, sans-serif';
      ctx.fillText('365 Days of Life, Texture, and Memory', 60, 125);

      const entryMap = new Map(entries.map((e) => [e.date, e]));
      const startX = 60;
      const startY = 170;
      const cellSize = 18;
      const gap = 5;

      // 12 months in 3x4 layout
      for (let m = 0; m < 12; m++) {
        const mCol = m % 3;
        const mRow = Math.floor(m / 3);
        const mx = startX + mCol * 260;
        const my = startY + mRow * 160;

        ctx.fillStyle = '#292524';
        ctx.font = 'bold 14px Outfit, sans-serif';
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        ctx.fillText(mNames[m], mx, my - 8);

        const days = new Date(currentYear, m + 1, 0).getDate();
        for (let d = 1; d <= days; d++) {
          const col = (d - 1) % 7;
          const row = Math.floor((d - 1) / 7);
          const x = mx + col * (cellSize + gap);
          const y = my + row * (cellSize + gap);

          const dateKey = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const entry = entryMap.get(dateKey);

          ctx.fillStyle = entry ? entry.pixelColor : palette.unrecordedColor;
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, 4);
          ctx.fill();
        }
      }

      setPreviewUrl(canvas.toDataURL('image/png'));
    }
  }, [isOpen, exportType, entries, palette, customQuote]);

  if (!isOpen) return null;

  const handleDownload = () => {
    triggerHaptic('success', enableHaptics);

    if (exportType === 'month' || exportType === 'year') {
      if (!previewUrl) return;
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `life-in-pixels-${exportType}-2026.png`;
      a.click();
    } else if (exportType === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `life-in-pixels-backup-${Date.now()}.json`;
      a.click();
    } else if (exportType === 'csv') {
      const headers = ['Date', 'Mood', 'OverallRating', 'EnergyRating', 'StressRating', 'Tags', 'Reflection'];
      const rows = entries.map((e) => [
        e.date,
        e.mood,
        e.overallRating || '',
        e.energyRating || '',
        e.stressRating || '',
        `"${(e.tags || []).join(';')}"`,
        includeNotes ? `"${(e.reflection || '').replace(/"/g, '""')}"` : '""',
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const a = document.createElement('a');
      a.href = encodeURI(csvContent);
      a.download = `life-in-pixels-${Date.now()}.csv`;
      a.click();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export or Share Visual Grid"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#292524]/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FDFCF8] border border-[#EFECE6] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-[#F0EEE6] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
              Artifact Creation
            </span>
            <h3 className="text-lg font-bold text-[#292524]">Export & Share</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#292524]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1">
          {/* Format Selector */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'month', label: 'Month PNG', icon: ImageIcon },
              { id: 'year', label: 'Year PNG', icon: ImageIcon },
              { id: 'json', label: 'JSON Data', icon: FileText },
              { id: 'csv', label: 'CSV Table', icon: FileText },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = exportType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    triggerHaptic('selection', enableHaptics);
                    setExportType(f.id as any);
                  }}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    isActive
                      ? 'border-[#292524] bg-white ring-1 ring-[#292524]'
                      : 'border-[#EFECE6] bg-[#FAF9F5] text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[11px] font-bold">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Options */}
          {(exportType === 'month' || exportType === 'year') && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#78716C] block mb-1">
                  Personal Inscription / Title
                </label>
                <input
                  type="text"
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  placeholder="e.g. A year of gentle growth"
                  className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#EFECE6] text-xs text-[#292524] focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
                />
              </div>

              {/* Preview image */}
              {previewUrl && (
                <div className="border border-[#EFECE6] rounded-2xl overflow-hidden shadow-xs bg-white p-2">
                  <div className="text-[10px] text-[#78716C] uppercase font-bold tracking-wider mb-1.5 px-2">
                    Artifact Preview
                  </div>
                  <img
                    src={previewUrl}
                    alt="Export Preview"
                    className="w-full h-56 object-contain rounded-xl bg-[#FDFCF8]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#F0EEE6] flex items-center gap-2.5 text-xs text-[#78716C]">
            <Shield size={16} className="text-[#7EAE8B] shrink-0" />
            <span>
              <strong>Private & Local:</strong> Your exported file is rendered locally on your
              device and never transmitted to an external server.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F5] border-t border-[#F0EEE6] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#78716C] hover:text-[#292524]"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-[#FFB7B2] hover:bg-[#FFA5A0] text-[#292524] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Download {exportType.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
