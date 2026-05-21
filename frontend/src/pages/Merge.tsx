import React, { useState, useCallback } from 'react';
import { GitMerge, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DropZone from '../components/upload/DropZone';
import MergePanel from '../components/merge/MergePanel';
import { usePDF } from '../hooks/usePDF';
import { usePDFStore } from '../store/pdfStore';
import { mergeClientSidePDFs, downloadBlob, toPdfBlob } from '../utils/pdfUtils';
import type { PDFFile } from '../types';

const Merge: React.FC = () => {
  const { processFiles } = usePDF();
  const { removeFile } = usePDFStore();
  const [orderedFiles, setOrderedFiles] = useState<PDFFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedCount, setMergedCount] = useState(0);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const processed = await processFiles(files);
    setOrderedFiles(prev => [...prev, ...processed]);
  }, [processFiles]);

  const handleRemove = (id: string) => {
    removeFile(id);
    setOrderedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleMerge = async (files: PDFFile[]) => {
    setIsMerging(true);
    const toastId = toast.loading('Merging PDFs…');
    try {
      const fileObjs = files.map(f => f.file!).filter(Boolean);
      if (fileObjs.length < 2) { toast.error('Need at least 2 files', { id: toastId }); return; }
      const merged = await mergeClientSidePDFs(fileObjs);
      downloadBlob(toPdfBlob(merged), 'merged.pdf');
      setMergedCount(c => c + 1);
      toast.success(`Merged ${files.length} PDFs successfully!`, { id: toastId });
    } catch (err) {
      toast.error('Merge failed. Please try again.', { id: toastId });
      console.error(err);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
          <GitMerge className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Merge PDFs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Combine multiple PDFs into one file</p>
        </div>
      </div>

      {mergedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            Successfully merged {mergedCount} time{mergedCount > 1 ? 's' : ''}! Your download should have started.
          </p>
        </div>
      )}

      {/* Upload area */}
      <div className="flex flex-col gap-6">
        <DropZone onFilesAdded={handleFilesAdded} multiple />

        {orderedFiles.length > 0 && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Files to merge ({orderedFiles.length})
              </h2>
              <DropZone onFilesAdded={handleFilesAdded} multiple compact />
            </div>

            <MergePanel
              files={orderedFiles}
              onOrderChange={setOrderedFiles}
              onRemove={handleRemove}
              onMerge={handleMerge}
              isMerging={isMerging}
            />
          </div>
        )}

        {orderedFiles.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Upload 2 or more PDF files to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Merge;
