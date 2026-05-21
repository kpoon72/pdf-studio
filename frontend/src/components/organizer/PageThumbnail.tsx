import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, Trash2, Copy, GripVertical, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import type { PageItem } from '../../types';

interface PageThumbnailProps {
  page: PageItem;
  pageNumber: number;
  onToggleSelect: (id: string) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page, pageNumber, onToggleSelect, onRotate, onDelete, onDuplicate,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all duration-150 select-none',
        isDragging ? 'opacity-50 z-50 shadow-2xl border-primary-400' : page.selected
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md',
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Select checkbox */}
      <button
        onClick={() => onToggleSelect(page.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-gray-400 hover:text-primary-500"
      >
        {page.selected
          ? <CheckSquare className="w-4 h-4 text-primary-500" />
          : <Square className="w-4 h-4" />}
      </button>

      {/* Thumbnail */}
      <div
        className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer"
        style={{ transform: `rotate(${page.rotation}deg)`, transition: 'transform 0.3s ease' }}
        onClick={() => onToggleSelect(page.id)}
      >
        {page.thumbnail ? (
          <img src={page.thumbnail} alt={`Page ${pageNumber}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No preview</div>
        )}
      </div>

      {/* Page number */}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{pageNumber}</span>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRotate(page.id)}
          title="Rotate 90°"
          className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDuplicate(page.id)}
          title="Duplicate"
          className="p-1 rounded-md text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(page.id)}
          title="Delete"
          className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PageThumbnail;
