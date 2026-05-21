import React, { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FileText, ArrowDown } from 'lucide-react';
import clsx from 'clsx';
import Button from '../common/Button';
import { formatFileSize } from '../../utils/pdfUtils';
import type { PDFFile } from '../../types';

interface SortableFileProps {
  file: PDFFile;
  index: number;
  onRemove: (id: string) => void;
}

function SortableFile({ file, index, onRemove }: SortableFileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border transition-all duration-150',
        isDragging
          ? 'border-primary-400 shadow-xl shadow-primary-500/20 opacity-90 z-50'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
      )}
    >
      <span className="text-xs font-bold text-gray-400 dark:text-gray-600 w-5 text-center">{index + 1}</span>

      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="w-10 h-[50px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        {file.thumbnails?.[0] ? (
          <img src={file.thumbnails[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{file.pageCount}p</span>
        </div>
      </div>

      <button
        onClick={() => onRemove(file.id)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface MergePanelProps {
  files: PDFFile[];
  onOrderChange: (files: PDFFile[]) => void;
  onRemove: (id: string) => void;
  onMerge: (ordered: PDFFile[]) => void;
  isMerging: boolean;
}

const MergePanel: React.FC<MergePanelProps> = ({ files, onOrderChange, onRemove, onMerge, isMerging }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = files.findIndex(f => f.id === active.id);
      const newIdx = files.findIndex(f => f.id === over.id);
      onOrderChange(arrayMove(files, oldIdx, newIdx));
    }
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span><span className="font-semibold text-gray-900 dark:text-white">{files.length}</span> files</span>
          <span><span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span> total pages</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ArrowDown className="w-3.5 h-3.5" />
          Drag to reorder
        </div>
      </div>

      {/* Sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
              <SortableFile key={file.id} file={file} index={index} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isMerging}
        disabled={files.length < 2}
        onClick={() => onMerge(files)}
        leftIcon={<FileText className="w-4 h-4" />}
      >
        {isMerging ? 'Merging…' : `Merge ${files.length} PDFs`}
      </Button>
    </div>
  );
};

export default MergePanel;
