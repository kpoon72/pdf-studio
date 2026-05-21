import React, { useState, useCallback } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DropZone from '../components/upload/DropZone';
import FileCard from '../components/upload/FileCard';
import PageOrganizer from '../components/organizer/PageOrganizer';
import { usePDF } from '../hooks/usePDF';
import { usePDFStore } from '../store/pdfStore';
import { organizeClientSidePDF, downloadBlob, toPdfBlob } from '../utils/pdfUtils';
import type { PDFFile, PageItem } from '../types';
import Button from '../components/common/Button';

const Organizer: React.FC = () => {
  const { processFiles } = usePDF();
  const { pages, setPages } = usePDFStore();
  const [file, setFile] = useState<PDFFile | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const processed = await processFiles([files[0]]);
    if (processed.length > 0) {
      const f = processed[0];
      setFile(f);
      // Build page items from thumbnails
      const pageItems: PageItem[] = (f.thumbnails || []).map((thumb, idx) => ({
        id: `${f.id}-pg-${idx}`,
        pageIndex: idx,
        fileId: f.id,
        thumbnail: thumb,
        rotation: 0,
        selected: false,
      }));
      setPages(pageItems);
    }
  }, [processFiles, setPages]);

  const handleDownload = async () => {
    if (!file?.file) return;
    setIsDownloading(true);
    const toastId = toast.loading('Saving organized PDF…');
    try {
      // Filter blank pages (pageIndex === -1) — they're added as placeholders
      const validPages = pages.filter(p => p.pageIndex >= 0);
      if (validPages.length === 0) {
        toast.error('No valid pages to export', { id: toastId });
        return;
      }

      const pageSpec = validPages.map(p => ({ pageIndex: p.pageIndex, rotation: p.rotation }));
      const bytes = await organizeClientSidePDF(file.file, pageSpec);
      downloadBlob(toPdfBlob(bytes), `organized_${file.originalName}`);
      toast.success(`Saved PDF with ${validPages.length} pages!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to save PDF', { id: toastId });
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organize Pages</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag to reorder, rotate, delete, or duplicate pages
            </p>
          </div>
        </div>

        {file && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => { setFile(null); setPages([]); }}
          >
            Change File
          </Button>
        )}
      </div>

      {!file ? (
        <DropZone onFilesAdded={handleFilesAdded} multiple={false} />
      ) : (
        <div className="flex flex-col gap-6 animate-slide-up">
          <FileCard file={file} />
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <PageOrganizer
            pages={pages}
            onPagesChange={setPages}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        </div>
      )}
    </div>
  );
};

export default Organizer;
