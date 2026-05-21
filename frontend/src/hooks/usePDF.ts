import { useCallback } from 'react';
import { usePDFStore } from '../store/pdfStore';
import { loadPDFInfo } from '../utils/pdfUtils';
import toast from 'react-hot-toast';
import type { PDFFile, PageItem } from '../types';

export function usePDF() {
  const { addFiles, setPages, setLoading, uploadedFiles } = usePDFStore();

  const processFiles = useCallback(async (files: File[]): Promise<PDFFile[]> => {
    setLoading(true, `Processing ${files.length} file(s)…`);
    const processed: PDFFile[] = [];

    for (const file of files) {
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        // Load once — gets both pageCount and thumbnails without reusing the buffer
        const { pageCount, thumbnails } = await loadPDFInfo(file, 160);

        processed.push({
          id,
          originalName: file.name,
          filename: file.name,
          size: file.size,
          pageCount,
          uploadedAt: new Date().toISOString(),
          thumbnails,
          file,
        });
      } catch (err) {
        console.error(err);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (processed.length > 0) {
      addFiles(processed);
      toast.success(`Loaded ${processed.length} PDF file${processed.length > 1 ? 's' : ''}`);
    }
    setLoading(false);
    return processed;
  }, [addFiles, setLoading]);

  const loadPagesFromFile = useCallback((fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.thumbnails) return;

    const pages: PageItem[] = file.thumbnails.map((thumbnail, index) => ({
      id: `${fileId}-page-${index}`,
      pageIndex: index,
      fileId,
      thumbnail,
      rotation: 0,
      selected: false,
    }));
    setPages(pages);
  }, [uploadedFiles, setPages]);

  return { processFiles, loadPagesFromFile };
}
