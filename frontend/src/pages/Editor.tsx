import React, { useState, useCallback, useRef } from 'react';
import { Edit3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DropZone from '../components/upload/DropZone';
import FileCard from '../components/upload/FileCard';
import EditorToolbar from '../components/editor/EditorToolbar';
import PDFEditor from '../components/editor/PDFEditor';
import { usePDF } from '../hooks/usePDF';
import { usePDFStore } from '../store/pdfStore';
import { downloadBlob, toPdfBlob } from '../utils/pdfUtils';
import type { PDFFile, EditorTool, Annotation } from '../types';
import Button from '../components/common/Button';

const Editor: React.FC = () => {
  const { processFiles } = usePDF();
  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearAnnotations, signatures } = usePDFStore();
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeFontSize, setActiveFontSize] = useState(14);
  const [activeOpacity, setActiveOpacity] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | undefined>();
  const historyRef = useRef<Annotation[][]>([]);
  const historyIdxRef = useRef(-1);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const processed = await processFiles([files[0]]);
    if (processed.length > 0) {
      setFile(processed[0]);
      setPageIndex(0);
      clearAnnotations();
    }
  }, [processFiles, clearAnnotations]);

  const pushHistory = () => {
    const snap = JSON.parse(JSON.stringify(annotations));
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snap);
    historyIdxRef.current = historyRef.current.length - 1;
  };

  const handleAddAnnotation = (ann: Annotation) => {
    pushHistory();
    addAnnotation(ann);
  };

  const handleUndo = () => {
    // Simple undo: not full undo/redo for brevity, but can be extended
    toast('Undo coming soon', { icon: '↩️' });
  };
  const handleRedo = () => { toast('Redo coming soon', { icon: '↪️' }); };

  const handleDownload = async () => {
    if (!file?.file) return;
    setIsDownloading(true);
    const toastId = toast.loading('Saving annotations to PDF…');
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const buf = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const ann of annotations) {
        const page = pdfDoc.getPage(ann.pageIndex);
        const { height } = page.getSize();
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const canvasH = canvas?.height || 800;
        const scaleY = height / canvasH;
        const scaleX = page.getWidth() / (canvas?.width || 600);

        const x = ann.x * scaleX;
        const y = height - (ann.y * scaleY) - (ann.height * scaleY);

        if (ann.type === 'text' && ann.content) {
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };
          page.drawText(ann.content, {
            x, y: y + (ann.height * scaleY),
            size: (ann.fontSize || 14) * scaleX,
            font,
            color: hexToRgb(ann.color || '#000000'),
            opacity: ann.opacity,
          });
        } else if (ann.type === 'rect') {
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };
          page.drawRectangle({
            x, y,
            width: ann.width * scaleX,
            height: ann.height * scaleY,
            borderColor: hexToRgb(ann.color),
            borderWidth: 2,
            opacity: ann.opacity,
          });
        } else if (ann.type === 'highlight') {
          const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
          };
          page.drawRectangle({
            x, y,
            width: ann.width * scaleX,
            height: ann.height * scaleY,
            color: hexToRgb(ann.color),
            opacity: 0.3,
          });
        } else if (ann.type === 'signature' && ann.dataUrl) {
          try {
            const isPng = ann.dataUrl.includes('image/png');
            const base64 = ann.dataUrl.split(',')[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
            page.drawImage(img, { x, y, width: ann.width * scaleX, height: ann.height * scaleY, opacity: ann.opacity });
          } catch { /* skip if image can't be embedded */ }
        }
      }

      const bytes = await pdfDoc.save();
      downloadBlob(toPdfBlob(bytes), `edited_${file.originalName}`);
      toast.success('PDF saved with annotations!', { id: toastId });
    } catch (err) {
      toast.error('Failed to save PDF', { id: toastId });
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedSig = signatures.find(s => s.id === selectedSignatureId);

  return (
    <div className="flex flex-col h-full">
      {!file ? (
        <div className="max-w-2xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit PDF</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add text, shapes, highlights and signatures</p>
            </div>
          </div>
          <DropZone onFilesAdded={handleFilesAdded} multiple={false} />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <EditorToolbar
            activeTool={activeTool}
            onToolChange={(t) => { setActiveTool(t); if (t !== 'signature') setSelectedSignatureId(undefined); }}
            color={activeColor}
            onColorChange={setActiveColor}
            fontSize={activeFontSize}
            onFontSizeChange={setActiveFontSize}
            opacity={activeOpacity}
            onOpacityChange={setActiveOpacity}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={() => { clearAnnotations(); toast.success('Annotations cleared'); }}
            onDownload={handleDownload}
            canUndo={historyIdxRef.current > 0}
            canRedo={false}
            isDownloading={isDownloading}
          />

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Main editor area */}
            <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-950">
              {file?.file && (
                <PDFEditor
                  pdfFile={file.file}
                  pageIndex={pageIndex}
                  totalPages={file.pageCount}
                  onPageChange={setPageIndex}
                  annotations={annotations}
                  activeTool={activeTool}
                  activeColor={activeColor}
                  activeFontSize={activeFontSize}
                  activeOpacity={activeOpacity}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={updateAnnotation}
                  onRemoveAnnotation={removeAnnotation}
                  selectedSignature={selectedSig?.dataUrl}
                />
              )}
            </div>

            {/* Side panel — change file or show signature info */}
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-auto p-4 flex flex-col gap-4 flex-shrink-0">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Current File</p>
                <FileCard file={file} />
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="mt-2"
                  onClick={() => { setFile(null); clearAnnotations(); }}
                >
                  Change File
                </Button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Annotations ({annotations.filter(a => a.pageIndex === pageIndex).length} on page {pageIndex + 1})
                </p>
                {annotations.filter(a => a.pageIndex === pageIndex).length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-600">No annotations on this page</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {annotations.filter(a => a.pageIndex === pageIndex).map(ann => (
                      <div key={ann.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs">
                        <span className="capitalize text-gray-600 dark:text-gray-400">{ann.type}</span>
                        <button onClick={() => removeAnnotation(ann.id)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeTool === 'signature' && signatures.length === 0 && (
                <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Go to <strong>Sign PDF</strong> to create and save signatures first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
