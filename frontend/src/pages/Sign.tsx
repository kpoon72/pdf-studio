import React, { useState, useCallback } from 'react';
import { PenTool, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DropZone from '../components/upload/DropZone';
import FileCard from '../components/upload/FileCard';
import SignaturePanel from '../components/signature/SignaturePanel';
import PDFEditor from '../components/editor/PDFEditor';
import { usePDF } from '../hooks/usePDF';
import { usePDFStore } from '../store/pdfStore';
import { downloadBlob, toPdfBlob } from '../utils/pdfUtils';
import type { PDFFile, Annotation } from '../types';
import Button from '../components/common/Button';

const Sign: React.FC = () => {
  const { processFiles } = usePDF();
  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearAnnotations, signatures, addSignature, removeSignature } = usePDFStore();
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedSigId, setSelectedSigId] = useState<string | undefined>();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const processed = await processFiles([files[0]]);
    if (processed.length > 0) {
      setFile(processed[0]);
      setPageIndex(0);
      clearAnnotations();
    }
  }, [processFiles, clearAnnotations]);

  const handleAddAnnotation = (ann: Annotation) => addAnnotation(ann);

  const handleDownload = async () => {
    if (!file?.file) return;
    setIsDownloading(true);
    const toastId = toast.loading('Embedding signatures into PDF…');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const buf = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);

      const signatureAnns = annotations.filter(a => a.type === 'signature' && a.dataUrl);

      for (const ann of signatureAnns) {
        const page = pdfDoc.getPage(ann.pageIndex);
        const { height, width } = page.getSize();
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const scaleX = width / (canvas?.width || 600);
        const scaleY = height / (canvas?.height || 800);

        const x = ann.x * scaleX;
        const y = height - (ann.y + ann.height) * scaleY;

        try {
          const isPng = ann.dataUrl!.includes('image/png');
          const base64 = ann.dataUrl!.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
          page.drawImage(img, {
            x, y,
            width: ann.width * scaleX,
            height: ann.height * scaleY,
            opacity: ann.opacity,
          });
        } catch { /* skip */ }
      }

      const bytes = await pdfDoc.save();
      downloadBlob(toPdfBlob(bytes), `signed_${file.originalName}`);
      toast.success('PDF signed and downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to sign PDF', { id: toastId });
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedSig = signatures.find(s => s.id === selectedSigId);

  return (
    <div className="flex flex-col h-full">
      {!file ? (
        <div className="max-w-2xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign PDF</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Draw or upload a signature and place it on your PDF</p>
            </div>
          </div>
          <DropZone onFilesAdded={handleFilesAdded} multiple={false} />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Signature tools */}
          <div className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Signature Tools</h2>
                <Button variant="ghost" size="xs" leftIcon={<RefreshCw className="w-3 h-3" />} onClick={() => { setFile(null); clearAnnotations(); }}>
                  Change
                </Button>
              </div>
              <FileCard file={file} />
            </div>

            <div className="p-4">
              <SignaturePanel
                signatures={signatures}
                onSave={addSignature}
                onRemove={removeSignature}
                onSelect={(sig) => {
                  setSelectedSigId(sig.id);
                  toast.success('Signature selected — click on PDF to place it');
                }}
                selectedId={selectedSigId}
              />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={isDownloading}
                disabled={annotations.filter(a => a.type === 'signature').length === 0}
                onClick={handleDownload}
              >
                {isDownloading ? 'Saving…' : 'Download Signed PDF'}
              </Button>
              {annotations.filter(a => a.type === 'signature').length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-2">Place at least one signature to download</p>
              )}
            </div>
          </div>

          {/* Right: PDF viewer */}
          <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-950">
            {file?.file && (
              <PDFEditor
                pdfFile={file.file}
                pageIndex={pageIndex}
                totalPages={file.pageCount}
                onPageChange={setPageIndex}
                annotations={annotations}
                activeTool={selectedSig ? 'signature' : 'select'}
                activeColor="#000000"
                activeFontSize={14}
                activeOpacity={1}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={updateAnnotation}
                onRemoveAnnotation={removeAnnotation}
                selectedSignature={selectedSig?.dataUrl}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sign;
