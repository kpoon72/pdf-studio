import React, { useState, useCallback } from 'react';
import { Scissors, Download, Info, Plus } from 'lucide-react';
import clsx from 'clsx';
import Button from '../common/Button';
import { RangeTag, RANGE_COLORS } from './RangeInput';
import { parseRangeInput, validRangesOnly } from '../../utils/rangeParser';
import type { PDFFile, ParsedRange } from '../../types';

interface SplitPanelProps {
  file: PDFFile;
  onSplit: (ranges: Array<{ start: number; end: number; label: string }>) => Promise<void>;
  isSplitting: boolean;
}

// Color map from range index to page numbers
function getPageColor(pageNum: number, ranges: ParsedRange[], colors: string[]): string | null {
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (r.isValid && pageNum >= r.start && pageNum <= r.end) return colors[i % colors.length];
  }
  return null;
}

const SplitPanel: React.FC<SplitPanelProps> = ({ file, onSplit, isSplitting }) => {
  const [rangeInput, setRangeInput] = useState('');
  const [parsedRanges, setParsedRanges] = useState<ParsedRange[]>([]);

  const handleInputChange = useCallback((val: string) => {
    setRangeInput(val);
    if (val.trim()) {
      setParsedRanges(parseRangeInput(val, file.pageCount));
    } else {
      setParsedRanges([]);
    }
  }, [file.pageCount]);

  const removeRange = (id: string) => {
    const remaining = parsedRanges.filter(r => r.id !== id);
    setParsedRanges(remaining);
    setRangeInput(remaining.map(r => r.input).join(', '));
  };

  const validRanges = validRangesOnly(parsedRanges);
  const hasError = parsedRanges.some(r => !r.isValid);

  const quickPresets = [
    { label: 'All pages', value: `1-${file.pageCount}` },
    { label: 'First half', value: `1-${Math.ceil(file.pageCount / 2)}` },
    { label: 'Second half', value: `${Math.ceil(file.pageCount / 2) + 1}-${file.pageCount}` },
    { label: 'Each page', value: Array.from({ length: file.pageCount }, (_, i) => i + 1).join(',') },
  ];

  const thumbnails = file.thumbnails || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Input */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Page Ranges
        </label>

        <div className="relative">
          <input
            type="text"
            value={rangeInput}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="e.g. 1-3, 4, 5-7, 8"
            className={clsx(
              'w-full px-4 py-3 pr-10 rounded-xl border text-sm font-mono transition-colors',
              'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
              hasError
                ? 'border-red-400 dark:border-red-600 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-primary-400',
            )}
          />
          <Scissors className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Use commas to separate ranges. A single number exports one page. Ranges like <code className="font-mono bg-blue-100 dark:bg-blue-800/50 px-1 rounded">1-3</code> export multiple pages. Each range becomes a separate PDF.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {quickPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => handleInputChange(preset.value)}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border border-gray-200 dark:border-gray-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parsed range tags */}
      {parsedRanges.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Detected ranges ({parsedRanges.length})
            </p>
            <span className="text-xs text-gray-400">
              {validRanges.length} valid · {parsedRanges.length - validRanges.length} invalid
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedRanges.map((r, i) => (
              <RangeTag key={r.id} range={r} onRemove={removeRange} color={RANGE_COLORS[i % RANGE_COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {/* Page preview grid */}
      {thumbnails.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Page Preview ({file.pageCount} pages)
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {thumbnails.map((thumb, idx) => {
              const pageNum = idx + 1;
              const colorClass = getPageColor(pageNum, parsedRanges, RANGE_COLORS);
              const rangeIdx = parsedRanges.findIndex(r => r.isValid && pageNum >= r.start && pageNum <= r.end);

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={clsx(
                    'w-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all duration-200',
                    colorClass
                      ? 'border-current shadow-sm scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 opacity-40',
                  )} style={colorClass ? { borderColor: undefined } : {}}>
                    {colorClass && (
                      <div className={clsx('absolute inset-0 opacity-30 rounded-lg pointer-events-none', colorClass)} />
                    )}
                    <div className="relative w-full h-full">
                      <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-full object-cover" />
                      {rangeIdx >= 0 && (
                        <div className={clsx('absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white', ['bg-blue-500','bg-green-500','bg-orange-500','bg-purple-500','bg-pink-500','bg-teal-500'][rangeIdx % 6])}>
                          {rangeIdx + 1}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600">{pageNum}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isSplitting}
        disabled={validRanges.length === 0 || isSplitting}
        onClick={() => onSplit(validRanges)}
        leftIcon={<Download className="w-4 h-4" />}
      >
        {isSplitting ? 'Splitting…' : `Split into ${validRanges.length} PDF${validRanges.length !== 1 ? 's' : ''}`}
      </Button>
    </div>
  );
};

export default SplitPanel;
