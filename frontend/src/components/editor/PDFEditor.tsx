import React, { useRef, useEffect, useState } from 'react';
import { renderPageToCanvas } from '../../utils/pdfUtils';
import type { Annotation, EditorTool } from '../../types';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface PDFEditorProps {
  pdfFile: File;                          // File object — always yields a fresh buffer
  pageIndex: number;
  totalPages: number;
  onPageChange: (idx: number) => void;
  annotations: Annotation[];
  activeTool: EditorTool;
  activeColor: string;
  activeFontSize: number;
  activeOpacity: number;
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onRemoveAnnotation: (id: string) => void;
  selectedSignature?: string;
}

let annIdCounter = 0;
function newAnnId() { return `ann-${++annIdCounter}-${Date.now()}`; }

const PDFEditor: React.FC<PDFEditorProps> = ({
  pdfFile, pageIndex, totalPages, onPageChange,
  annotations, activeTool, activeColor, activeFontSize, activeOpacity,
  onAddAnnotation, onUpdateAnnotation, onRemoveAnnotation, selectedSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState<{ startX: number; startY: number; currentId: string } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Re-render whenever page changes — reads a fresh buffer each time
  useEffect(() => {
    if (!canvasRef.current || !pdfFile) return;
    setIsRendering(true);
    renderPageToCanvas(pdfFile, pageIndex + 1, canvasRef.current, 1.5)
      .then(({ width, height }) => setCanvasSize({ w: width, h: height }))
      .catch(console.error)
      .finally(() => setIsRendering(false));
  }, [pdfFile, pageIndex]);

  const pageAnnotations = annotations.filter(a => a.pageIndex === pageIndex);

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select') return;
    if (e.target !== overlayRef.current) return;
    const { x, y } = getRelativePos(e);

    if (activeTool === 'text') {
      const id = newAnnId();
      onAddAnnotation({ id, type: 'text', pageIndex, x, y, width: 150, height: activeFontSize + 8, content: 'Text here', color: activeColor, opacity: activeOpacity, fontSize: activeFontSize, fontFamily: 'Arial' });
      setTimeout(() => setEditingTextId(id), 50);
      return;
    }

    if (activeTool === 'signature' && selectedSignature) {
      onAddAnnotation({ id: newAnnId(), type: 'signature', pageIndex, x, y, width: 150, height: 75, color: activeColor, opacity: activeOpacity, dataUrl: selectedSignature });
      return;
    }

    if (['rect', 'circle', 'highlight'].includes(activeTool)) {
      const id = newAnnId();
      onAddAnnotation({ id, type: activeTool as Annotation['type'], pageIndex, x, y, width: 0, height: 0, color: activeColor, opacity: activeTool === 'highlight' ? 0.3 : activeOpacity });
      setDrawing({ startX: x, startY: y, currentId: id });
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (drawing) {
      const { x, y } = getRelativePos(e);
      const w = x - drawing.startX;
      const h = y - drawing.startY;
      onUpdateAnnotation(drawing.currentId, { x: w < 0 ? x : drawing.startX, y: h < 0 ? y : drawing.startY, width: Math.abs(w), height: Math.abs(h) });
    }
    if (dragging) {
      const { x, y } = getRelativePos(e);
      onUpdateAnnotation(dragging.id, { x: x - dragging.offsetX, y: y - dragging.offsetY });
    }
  };

  const handleOverlayMouseUp = () => { setDrawing(null); setDragging(null); };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Page navigation */}
      <div className="flex items-center gap-3">
        <button disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}
          className="px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
          ← Prev
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Page {pageIndex + 1} of {totalPages}
        </span>
        <button disabled={pageIndex >= totalPages - 1} onClick={() => onPageChange(pageIndex + 1)}
          className="px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
          Next →
        </button>
      </div>

      {/* Canvas + overlay */}
      <div className="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-xl"
        style={{ width: canvasSize.w || 'auto', maxWidth: '100%' }}>
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 z-10">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="block" />
        <div
          ref={overlayRef}
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={handleOverlayMouseUp}
          className={clsx('absolute inset-0', activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair')}
        >
          {pageAnnotations.map(ann => (
            <AnnotationElement
              key={ann.id}
              ann={ann}
              editingTextId={editingTextId}
              activeTool={activeTool}
              onEdit={setEditingTextId}
              onUpdate={onUpdateAnnotation}
              onRemove={onRemoveAnnotation}
              onDragStart={(id, ox, oy) => setDragging({ id, offsetX: ox, offsetY: oy })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface AnnElementProps {
  ann: Annotation;
  editingTextId: string | null;
  activeTool: EditorTool;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, u: Partial<Annotation>) => void;
  onRemove: (id: string) => void;
  onDragStart: (id: string, ox: number, oy: number) => void;
}

function AnnotationElement({ ann, editingTextId, activeTool, onEdit, onUpdate, onRemove, onDragStart }: AnnElementProps) {
  const isEditing = editingTextId === ann.id;
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onDragStart(ann.id, e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const base: React.CSSProperties = { position: 'absolute', left: ann.x, top: ann.y, width: ann.width || undefined, height: ann.height || undefined, opacity: ann.opacity, userSelect: 'none' };

  if (ann.type === 'text') return (
    <div style={{ ...base, minWidth: 80, minHeight: ann.fontSize }} onMouseDown={handleMouseDown} className="group cursor-move">
      {isEditing
        ? <input autoFocus defaultValue={ann.content} onBlur={e => { onUpdate(ann.id, { content: e.target.value }); onEdit(null); }} style={{ fontSize: ann.fontSize, color: ann.color, background: 'transparent', border: '1px dashed #9333ea', outline: 'none', width: '100%' }} onClick={e => e.stopPropagation()} />
        : <span style={{ fontSize: ann.fontSize, color: ann.color, fontFamily: ann.fontFamily || 'Arial', whiteSpace: 'nowrap' }} onDoubleClick={() => onEdit(ann.id)}>{ann.content}</span>}
      <DeleteBtn onRemove={() => onRemove(ann.id)} />
    </div>
  );

  if (ann.type === 'signature' && ann.dataUrl) return (
    <div style={base} onMouseDown={handleMouseDown} className="group cursor-move">
      <img src={ann.dataUrl} alt="signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
      <DeleteBtn onRemove={() => onRemove(ann.id)} />
    </div>
  );

  if (ann.type === 'rect') return (
    <div style={{ ...base, border: `2px solid ${ann.color}` }} onMouseDown={handleMouseDown} className="group cursor-move">
      <DeleteBtn onRemove={() => onRemove(ann.id)} />
    </div>
  );

  if (ann.type === 'circle') return (
    <div style={{ ...base, border: `2px solid ${ann.color}`, borderRadius: '50%' }} onMouseDown={handleMouseDown} className="group cursor-move">
      <DeleteBtn onRemove={() => onRemove(ann.id)} />
    </div>
  );

  if (ann.type === 'highlight') return (
    <div style={{ ...base, backgroundColor: ann.color, opacity: 0.35 }} onMouseDown={handleMouseDown} className="group cursor-move">
      <DeleteBtn onRemove={() => onRemove(ann.id)} />
    </div>
  );

  return null;
}

function DeleteBtn({ onRemove }: { onRemove: () => void }) {
  return (
    <button onClick={e => { e.stopPropagation(); onRemove(); }} className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50">
      <X className="w-3 h-3" />
    </button>
  );
}

export default PDFEditor;
