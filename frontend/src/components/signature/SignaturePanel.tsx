import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, Check, Download, Upload, PenTool } from 'lucide-react';
import Button from '../common/Button';
import type { Signature } from '../../types';
import clsx from 'clsx';

interface SignaturePanelProps {
  signatures: Signature[];
  onSave: (sig: Signature) => void;
  onRemove: (id: string) => void;
  onSelect: (sig: Signature) => void;
  selectedId?: string;
}

const SignaturePanel: React.FC<SignaturePanelProps> = ({ signatures, onSave, onRemove, onSelect, selectedId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [signatureName, setSignatureName] = useState('My Signature');
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasStrokes(false);
  }, []);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  const getPos = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('pressure' in e) {
      return { x: (e as React.PointerEvent).clientX - rect.left, y: (e as React.PointerEvent).clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasStrokes(true);
  };

  const endDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const clearCanvas = () => { initCanvas(); };

  const saveSignature = () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    const sig: Signature = {
      id: `sig-${Date.now()}`,
      name: signatureName || 'Signature',
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    onSave(sig);
    clearCanvas();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const sig: Signature = {
        id: `sig-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded Signature',
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      onSave(sig);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode tabs */}
      <div className="flex p-1 gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {(['draw', 'upload'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              mode === m ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700',
            )}
          >
            {m === 'draw' ? <PenTool className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {m === 'draw' ? 'Draw' : 'Upload Image'}
          </button>
        ))}
      </div>

      {mode === 'draw' ? (
        <div className="flex flex-col gap-3">
          <canvas
            ref={canvasRef}
            width={340}
            height={140}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">Draw your signature above</p>

          <input
            type="text"
            value={signatureName}
            onChange={e => setSignatureName(e.target.value)}
            placeholder="Signature label"
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={clearCanvas} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Clear
            </Button>
            <Button variant="primary" size="sm" fullWidth disabled={!hasStrokes} onClick={saveSignature} leftIcon={<Check className="w-3.5 h-3.5" />}>
              Save Signature
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Click to upload a signature image<br />
            <span className="text-xs text-gray-400">PNG, JPG with transparent background recommended</span>
          </span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      )}

      {/* Saved signatures */}
      {signatures.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Saved Signatures ({signatures.length})
          </p>
          <div className="flex flex-col gap-2">
            {signatures.map(sig => (
              <div
                key={sig.id}
                onClick={() => onSelect(sig)}
                className={clsx(
                  'group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  selectedId === sig.id
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                )}
              >
                <div className="w-24 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 dark:border-gray-600 flex-shrink-0">
                  <img src={sig.dataUrl} alt={sig.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{sig.name}</p>
                  {selectedId === sig.id && (
                    <p className="text-xs text-primary-600 dark:text-primary-400">Selected — click on PDF to place</p>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onRemove(sig.id); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePanel;
