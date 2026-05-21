import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import type { ParsedRange } from '../../types';

interface RangeTagProps {
  range: ParsedRange;
  onRemove: (id: string) => void;
  color: string;
}

export function RangeTag({ range, onRemove, color }: RangeTagProps) {
  return (
    <div className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
      range.isValid
        ? `${color} border-transparent`
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
    )}>
      {range.isValid
        ? <CheckCircle className="w-3 h-3" />
        : <XCircle className="w-3 h-3" />}
      <span>{range.isValid ? range.label : `${range.input}: ${range.error}`}</span>
      <button onClick={() => onRemove(range.id)} className="ml-0.5 hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Palette of distinct colors for ranges
export const RANGE_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
];
