import React from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { RotateCcw, RotateCw, Trash2, Copy, CheckSquare, Square, PlusSquare } from 'lucide-react';
import clsx from 'clsx';
import PageThumbnail from './PageThumbnail';
import Button from '../common/Button';
import type { PageItem } from '../../types';

interface PageOrganizerProps {
  pages: PageItem[];
  onPagesChange: (pages: PageItem[]) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

const PageOrganizer: React.FC<PageOrganizerProps> = ({ pages, onPagesChange, onDownload, isDownloading }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = pages.findIndex(p => p.id === active.id);
      const newIdx = pages.findIndex(p => p.id === over.id);
      onPagesChange(arrayMove(pages, oldIdx, newIdx));
    }
  };

  const toggleSelect = (id: string) =>
    onPagesChange(pages.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  const selectAll = () => onPagesChange(pages.map(p => ({ ...p, selected: true })));
  const deselectAll = () => onPagesChange(pages.map(p => ({ ...p, selected: false })));
  const rotateOne = (id: string) =>
    onPagesChange(pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  const deleteOne = (id: string) =>
    onPagesChange(pages.filter(p => p.id !== id));
  const duplicateOne = (id: string) => {
    const idx = pages.findIndex(p => p.id === id);
    if (idx === -1) return;
    const dup: PageItem = { ...pages[idx], id: `${id}-dup-${Date.now()}`, selected: false };
    const next = [...pages];
    next.splice(idx + 1, 0, dup);
    onPagesChange(next);
  };

  const addBlankPage = () => {
    const blank: PageItem = { id: `blank-${Date.now()}`, pageIndex: -1, fileId: '', thumbnail: undefined, rotation: 0, selected: false };
    onPagesChange([...pages, blank]);
  };

  const selectedCount = pages.filter(p => p.selected).length;
  const rotateSelected = (deg: number) =>
    onPagesChange(pages.map(p => p.selected ? { ...p, rotation: (p.rotation + deg) % 360 } : p));
  const deleteSelected = () => onPagesChange(pages.filter(p => !p.selected));

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={selectedCount === pages.length ? deselectAll : selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
          >
            {selectedCount === pages.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
            {selectedCount === pages.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedCount > 0 && (
            <>
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{selectedCount} selected</span>
              <div className="flex items-center gap-1">
                <button title="Rotate left" onClick={() => rotateSelected(-90)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button title="Rotate right" onClick={() => rotateSelected(90)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button title="Delete selected" onClick={deleteSelected} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addBlankPage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <PlusSquare className="w-3.5 h-3.5" />
            Add Blank
          </button>
          <span className="text-xs text-gray-400">{pages.length} pages</span>
        </div>
      </div>

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {pages.map((page, idx) => (
              <PageThumbnail
                key={page.id}
                page={page}
                pageNumber={idx + 1}
                onToggleSelect={toggleSelect}
                onRotate={rotateOne}
                onDelete={deleteOne}
                onDuplicate={duplicateOne}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Download */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isDownloading}
          disabled={pages.length === 0}
          onClick={onDownload}
        >
          {isDownloading ? 'Saving…' : `Save & Download (${pages.length} pages)`}
        </Button>
      </div>
    </div>
  );
};

export default PageOrganizer;
