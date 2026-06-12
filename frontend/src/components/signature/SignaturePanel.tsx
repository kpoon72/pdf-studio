import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, Check, Upload, PenTool, Type } from 'lucide-react';
import Button from '../common/Button';
import type { Signature } from '../../types';
import clsx from 'clsx';

const TYPE_FONTS = [
  { family: 'Dancing Script', label: 'Classic' },
  { family: 'Great Vibes', label: 'Elegant' },
  { family: 'Pacifico', label: 'Casual' },
  { family: 'Pinyon Script', label: 'Formal' },
  { family: 'Sacramento', label: 'Delicate' },
];

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&family=Pinyon+Script&family=Sacramento&display=swap';

function ensureFontsLoaded() {
  if (document.querySelector(`link[href="${FONTS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONTS_URL;
  document.head.appendChild(link);
}

interface SignaturePanelProps {
  signatures: Signature[];
  onSave: (sig: Signature) => void;
  onRemove: (id: string) => void;
  onSelect: (sig: Signature) => void;
  selectedId?: string;
}

const SignaturePanel: React.FC<SignaturePanelProps> = ({
  signatures, onSave, onRemove, onSelect, selectedId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [signatureName, setSignatureName] = useState('My Signature');
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Type mode
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(TYPE_FONTS[0].family);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { ensureFontsLoaded(); }, []);

  // ── Draw mode ────────────────────────────────────────────────────────────

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

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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

  const saveDrawnSignature = () => {
    const dataUrl = canvasRef.current!.toDataURL('image/png');
    onSave({ id: `sig-${Date.now()}`, name: signatureName || 'Signature', dataUrl, createdAt: new Date().toISOString() });
    initCanvas();
  };

  // ── Type mode ────────────────────────────────────────────────────────────

  const saveTypedSignature = async () => {
    if (!typedName.trim()) return;
    setIsSaving(true);
    try {
      await document.fonts.load(`80px '${selectedFont}'`);

      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d')!;

      const fontSize = 80;
      ctx.font = `${fontSize}px '${selectedFont}'`;
      const measured = ctx.measureText(typedName);

      offscreen.width = Math.ceil(measured.width) + 60;
      offscreen.height = Math.ceil(fontSize * 1.6);

      // Canvas resize resets ctx state — re-apply everything
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = `${fontSize}px '${selectedFont}'`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, offscreen.width / 2, offscreen.height / 2);

      onSave({
        id: `sig-${Date.now()}`,
        name: typedName,
        dataUrl: offscreen.toDataURL('image/png'),
        createdAt: new Date().toISOString(),
      });
      setTypedName('');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Upload mode ──────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onSave({
        id: `sig-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded Signature',
        dataUrl: ev.target?.result as string,
        createdAt: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const MODES = [
    { key: 'draw' as const, Icon: PenTool, label: 'Draw' },
    { key: 'type' as const, Icon: Type, label: 'Type' },
    { key: 'upload' as const, Icon: Upload, label: 'Upload' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Mode tabs */}
      <div className="flex p-1 gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {MODES.map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
              mode === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Draw ── */}
      {mode === 'draw' && (
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
            <Button variant="secondary" size="sm" onClick={initCanvas} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Clear
            </Button>
            <Button variant="primary" size="sm" fullWidth disabled={!hasStrokes} onClick={saveDrawnSignature} leftIcon={<Check className="w-3.5 h-3.5" />}>
              Save Signature
            </Button>
          </div>
        </div>
      )}

      {/* ── Type ── */}
      {mode === 'type' && (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder="Type your name…"
            className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />

          <div className="flex flex-col gap-2">
            {TYPE_FONTS.map(font => (
              <button
                key={font.family}
                onClick={() => setSelectedFont(font.family)}
                className={clsx(
                  'flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all text-left',
                  selectedFont === font.family
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50',
                )}
              >
                <span
                  className="text-gray-800 dark:text-gray-100 leading-none"
                  style={{ fontFamily: `'${font.family}', cursive`, fontSize: '26px' }}
                >
                  {typedName || 'Your Name'}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-3 flex-shrink-0">
                  {font.label}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            disabled={!typedName.trim() || isSaving}
            loading={isSaving}
            onClick={saveTypedSignature}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Save Signature
          </Button>
        </div>
      )}

      {/* ── Upload ── */}
      {mode === 'upload' && (
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
