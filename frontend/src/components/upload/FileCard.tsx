import React from 'react';
import { FileText, Trash2, ChevronRight, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import { formatFileSize } from '../../utils/pdfUtils';
import type { PDFFile } from '../../types';

interface FileCardProps {
  file: PDFFile;
  onRemove?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  draggableHandle?: React.HTMLAttributes<HTMLDivElement>;
  dragRef?: (node: HTMLElement | null) => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

const FileCard: React.FC<FileCardProps> = ({
  file, onRemove, onSelect, isSelected = false,
  draggableHandle, dragRef, isDragging = false, style,
}) => (
  <div
    ref={dragRef as React.Ref<HTMLDivElement>}
    style={style}
    onClick={() => onSelect?.(file.id)}
    className={clsx(
      'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none',
      isDragging ? 'opacity-50 scale-[0.98] shadow-xl' : '',
      isSelected
        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300 dark:hover:border-primary-600/50 hover:shadow-md',
    )}
  >
    {draggableHandle && (
      <div {...draggableHandle} className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
    )}

    {/* Thumbnail */}
    <div className="w-12 h-[60px] flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
      {file.thumbnails?.[0] ? (
        <img src={file.thumbnails[0]} alt="page 1" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(file.size)}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
          {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {onSelect && <ChevronRight className="w-4 h-4 text-gray-300" />}
    </div>
  </div>
);

export default FileCard;
