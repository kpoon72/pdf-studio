import React from 'react';
import clsx from 'clsx';

type PBColor = 'primary' | 'green' | 'red' | 'yellow' | 'blue';
type PBSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: PBColor;
  size?: PBSize;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const COLORS: Record<PBColor, string> = {
  primary: 'from-primary-500 to-purple-600',
  green: 'from-green-400 to-emerald-500',
  red: 'from-red-400 to-rose-500',
  yellow: 'from-yellow-400 to-amber-500',
  blue: 'from-blue-400 to-indigo-500',
};

const HEIGHTS: Record<PBSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, color = 'primary', size = 'md',
  showLabel = false, animated = false, className,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden', HEIGHTS[size])}>
        <div
          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out', COLORS[color], animated && 'animate-pulse')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
