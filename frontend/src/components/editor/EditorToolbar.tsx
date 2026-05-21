import React from 'react';
import { MousePointer2, Type, Square, Circle, Highlighter, PenTool, Trash2, Undo2, Redo2, Download } from 'lucide-react';
import clsx from 'clsx';
import type { EditorTool } from '../../types';

interface EditorToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDownloading: boolean;
}

const TOOLS: Array<{ id: EditorTool; icon: React.ElementType; label: string }> = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'signature', icon: PenTool, label: 'Signature' },
];

const COLORS = ['#000000', '#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5', '#dd6b20', '#ffffff'];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool, onToolChange, color, onColorChange,
  fontSize, onFontSizeChange, opacity, onOpacityChange,
  onUndo, onRedo, onClear, onDownload, canUndo, canRedo, isDownloading,
}) => (
  <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
    {/* Tools */}
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => onToolChange(id)}
          className={clsx(
            'p-2 rounded-lg transition-all duration-150',
            activeTool === id
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>

    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

    {/* Color palette */}
    <div className="flex items-center gap-1.5">
      {COLORS.map(c => (
        <button
          key={c}
          title={c}
          onClick={() => onColorChange(c)}
          className={clsx(
            'w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110',
            color === c ? 'border-primary-500 scale-110' : 'border-gray-300 dark:border-gray-600',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={e => onColorChange(e.target.value)}
        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden"
        title="Custom color"
      />
    </div>

    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

    {/* Font size (shown for text tool) */}
    {(activeTool === 'text') && (
      <select
        value={fontSize}
        onChange={e => onFontSizeChange(Number(e.target.value))}
        className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
      </select>
    )}

    {/* Opacity */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">Opacity</span>
      <input
        type="range" min="10" max="100" step="5" value={opacity * 100}
        onChange={e => onOpacityChange(Number(e.target.value) / 100)}
        className="w-20 accent-primary-500"
      />
      <span className="text-xs text-gray-500 w-8">{Math.round(opacity * 100)}%</span>
    </div>

    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

    {/* History */}
    <div className="flex items-center gap-1">
      <button onClick={onUndo} disabled={!canUndo} title="Undo" className="p-2 rounded-lg text-gray-500 disabled:opacity-30 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:cursor-not-allowed">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo" className="p-2 rounded-lg text-gray-500 disabled:opacity-30 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:cursor-not-allowed">
        <Redo2 className="w-4 h-4" />
      </button>
      <button onClick={onClear} title="Clear all annotations" className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>

    <div className="flex-1" />

    <button
      onClick={onDownload}
      disabled={isDownloading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-medium hover:from-primary-600 hover:to-purple-700 shadow-glow transition-all disabled:opacity-50"
    >
      {isDownloading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isDownloading ? 'Saving…' : 'Download PDF'}
    </button>
  </div>
);

export default EditorToolbar;
