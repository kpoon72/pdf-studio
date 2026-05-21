import React, { useState, useCallback } from 'react';
import { Scissors, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DropZone from '../components/upload/DropZone';
import FileCard from '../components/upload/FileCard';
import SplitPanel from '../components/split/SplitPanel';
import { usePDF } from '../hooks/usePDF';
import { splitClientSidePDF, downloadBlob, toPdfBlob } from '../utils/pdfUtils';
import type { PDFFile } from '../types';
import Button from '../components/common/Button';

const Split: React.FC = () => {
  const { processFiles } = usePDF();
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const processed = await processFiles([files[0]]);
    if (processed.length > 0) setFile(processed[0]);
  }, [processFiles]);

  const handleSplit = async (ranges: Array<{ start: number; end: number; label: string }>) => {
    if (!file?.file) return;
    setIsSplitting(true);
    const toastId = toast.loading(`Splitting into ${ranges.length} PDF${ranges.length > 1 ? 's' : ''}…`);
    try {
      const results = await splitClientSidePDF(file.file, ranges);

      if (results.length === 1) {
        downloadBlob(toPdfBlob(results[0].data), `${results[0].label}.pdf`);
      } else {
        // Download each file with a small delay to avoid browser blocking
        for (let i = 0; i < results.length; i++) {
          await new Promise(r => setTimeout(r, i * 300));
          downloadBlob(toPdfBlob(results[i].data), `split_${i + 1}_${results[i].label}.pdf`);
        }
      }

      toast.success(`Split into ${results.length} PDF${results.length > 1 ? 's' : ''}!`, { id: toastId });
    } catch (err) {
      toast.error('Split failed. Please try again.', { id: toastId });
      console.error(err);
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Split PDF</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Divide a PDF into separate files by page ranges</p>
        </div>
      </div>

      {!file ? (
        <DropZone onFilesAdded={handleFilesAdded} multiple={false} />
      ) : (
        <div className="flex flex-col gap-6 animate-slide-up">
          {/* File card + change button */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FileCard file={file} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => setFile(null)}
            >
              Change
            </Button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          <SplitPanel file={file} onSplit={handleSplit} isSplitting={isSplitting} />
        </div>
      )}
    </div>
  );
};

export default Split;
