import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeftRight, FileType2, FileText, Image as ImageIcon, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import * as PDFJS from 'pdfjs-dist';
import Button from '../components/common/Button';
import { downloadBlob, toPdfBlob, formatFileSize } from '../utils/pdfUtils';

PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

type Tab = 'pdf-to-word' | 'image-to-pdf' | 'word-to-pdf';
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const ACCEPTED_WORD = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Letter page size in CSS px at 96 DPI
const PAGE_W = 816;
const PAGE_H = 1056;
const PAGE_MARGIN = 48;

const Convert: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pdf-to-word');

  // PDF → Word state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Image → PDF state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imgDragOver, setImgDragOver] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Word → PDF state
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [wordDragOver, setWordDragOver] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);

  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync previews with imageFiles — revoke old URLs to avoid memory leaks
  useEffect(() => {
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [imageFiles]);

  // ── Drop handlers ──────────────────────────────────────────────────────────

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
    if (file) setPdfFile(file);
    else toast.error('Please drop a PDF file');
  }, []);

  const handleImgDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImgDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => ACCEPTED_IMAGES.includes(f.type));
    if (files.length) setImageFiles(prev => [...prev, ...files]);
    else toast.error('Supported formats: JPG, PNG, WebP, GIF, BMP');
  }, []);

  const handleWordDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setWordDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(
      f => ACCEPTED_WORD.includes(f.type) || f.name.toLowerCase().endsWith('.docx'),
    );
    if (file) setWordFile(file);
    else toast.error('Please drop a .docx file');
  }, []);

  // ── PDF → Word ─────────────────────────────────────────────────────────────

  const convertPdfToWord = async () => {
    if (!pdfFile) return;
    setConverting(true);
    setProgress(0);
    const toastId = toast.loading('Converting PDF to Word…');
    try {
      const { Document, Packer, Paragraph, ImageRun } = await import('docx');

      const buf = new Uint8Array(await pdfFile.arrayBuffer());
      const pdf = await PDFJS.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const paragraphs: InstanceType<typeof Paragraph>[] = [];

      for (let i = 1; i <= total; i++) {
        setProgress(Math.round((i / total) * 88));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;

        const b64 = canvas.toDataURL('image/png').split(',')[1];
        const imgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

        // Target ~6.5 inch wide at 96 DPI ≈ 624px (fits A4/letter with margins)
        const targetW = 624;
        const targetH = Math.round(targetW * viewport.height / viewport.width);

        paragraphs.push(
          new Paragraph({
            pageBreakBefore: i > 1,
            children: [
              new ImageRun({
                data: imgBytes,
                transformation: { width: targetW, height: targetH },
                type: 'png',
              }),
            ],
          }),
        );
      }

      setProgress(95);
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, pdfFile.name.replace(/\.pdf$/i, '') + '.docx');
      toast.success('Downloaded as Word document!', { id: toastId });
    } catch (err) {
      toast.error('Conversion failed', { id: toastId });
      console.error(err);
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  // ── Image → PDF ────────────────────────────────────────────────────────────

  const convertImagesToPdf = async () => {
    if (!imageFiles.length) return;
    setConverting(true);
    setProgress(0);
    const toastId = toast.loading('Creating PDF…');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (let i = 0; i < imageFiles.length; i++) {
        setProgress(Math.round(((i + 1) / imageFiles.length) * 90));
        const file = imageFiles[i];

        let embed: Awaited<ReturnType<typeof pdf.embedPng>>;

        if (file.type === 'image/jpeg') {
          embed = await pdf.embedJpg(await file.arrayBuffer());
        } else if (file.type === 'image/png') {
          embed = await pdf.embedPng(await file.arrayBuffer());
        } else {
          // Convert webp / gif / bmp via canvas → PNG
          const objUrl = URL.createObjectURL(file);
          const img = new window.Image();
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = rej;
            img.src = objUrl;
          });
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
          URL.revokeObjectURL(objUrl);
          const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'));
          embed = await pdf.embedPng(await blob.arrayBuffer());
        }

        const { width, height } = embed.size();
        const page = pdf.addPage([width, height]);
        page.drawImage(embed, { x: 0, y: 0, width, height });
      }

      setProgress(96);
      const bytes = await pdf.save();
      const outName = imageFiles.length === 1
        ? imageFiles[0].name.replace(/\.[^.]+$/, '') + '.pdf'
        : 'images.pdf';
      downloadBlob(toPdfBlob(bytes), outName);
      toast.success(
        `PDF created from ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}!`,
        { id: toastId },
      );
    } catch (err) {
      toast.error('Conversion failed', { id: toastId });
      console.error(err);
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  // ── Word → PDF ─────────────────────────────────────────────────────────────

  const convertWordToPdf = async () => {
    if (!wordFile) return;
    setConverting(true);
    setProgress(0);
    const toastId = toast.loading('Converting Word to PDF…');
    let container: HTMLDivElement | null = null;
    try {
      const [{ convertToHtml }, html2canvas, { PDFDocument }] = await Promise.all([
        import('mammoth'),
        import('html2canvas').then(m => m.default),
        import('pdf-lib'),
      ]);
      setProgress(15);

      const arrayBuffer = await wordFile.arrayBuffer();
      const { value: html } = await convertToHtml({ arrayBuffer });
      setProgress(30);

      const contentW = PAGE_W - PAGE_MARGIN * 2;
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-99999px';
      container.style.top = '0';
      container.style.width = `${contentW}px`;
      container.style.fontFamily = 'Georgia, "Times New Roman", serif';
      container.style.fontSize = '15px';
      container.style.lineHeight = '1.6';
      container.style.color = '#111827';
      container.style.background = '#ffffff';
      container.innerHTML = html;
      document.body.appendChild(container);

      const fullCanvas = await html2canvas(container, {
        width: contentW,
        windowWidth: contentW,
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      document.body.removeChild(container);
      container = null;
      setProgress(60);

      const pdf = await PDFDocument.create();
      const renderScale = fullCanvas.width / contentW;
      const pageSliceHeightPx = (PAGE_H - PAGE_MARGIN * 2) * renderScale;
      const totalPages = Math.max(1, Math.ceil(fullCanvas.height / pageSliceHeightPx));

      for (let i = 0; i < totalPages; i++) {
        setProgress(60 + Math.round(((i + 1) / totalPages) * 35));
        const sliceHeight = Math.min(pageSliceHeightPx, fullCanvas.height - i * pageSliceHeightPx);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = fullCanvas.width;
        sliceCanvas.height = sliceHeight;
        sliceCanvas.getContext('2d')!.drawImage(
          fullCanvas,
          0, i * pageSliceHeightPx, fullCanvas.width, sliceHeight,
          0, 0, fullCanvas.width, sliceHeight,
        );

        const blob = await new Promise<Blob>(r => sliceCanvas.toBlob(b => r(b!), 'image/png'));
        const embed = await pdf.embedPng(await blob.arrayBuffer());

        const page = pdf.addPage([PAGE_W, PAGE_H]);
        const drawWidth = contentW;
        const drawHeight = drawWidth * (sliceHeight / fullCanvas.width);
        page.drawImage(embed, {
          x: PAGE_MARGIN,
          y: PAGE_H - PAGE_MARGIN - drawHeight,
          width: drawWidth,
          height: drawHeight,
        });
      }

      setProgress(97);
      const bytes = await pdf.save();
      downloadBlob(toPdfBlob(bytes), wordFile.name.replace(/\.docx?$/i, '') + '.pdf');
      toast.success('Downloaded as PDF!', { id: toastId });
    } catch (err) {
      if (container) document.body.removeChild(container);
      toast.error('Conversion failed', { id: toastId });
      console.error(err);
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; Icon: typeof ArrowLeftRight; label: string }[] = [
    { key: 'pdf-to-word', Icon: FileType2, label: 'PDF → Word' },
    { key: 'word-to-pdf', Icon: FileText, label: 'Word → PDF' },
    { key: 'image-to-pdf', Icon: ImageIcon, label: 'Image → PDF' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
          <ArrowLeftRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Convert</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">PDF to Word · Word to PDF · Images to PDF</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-8">
        {TABS.map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── PDF → Word tab ── */}
      {tab === 'pdf-to-word' && (
        <div className="flex flex-col gap-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setPdfDragOver(true); }}
            onDragLeave={() => setPdfDragOver(false)}
            onDrop={handlePdfDrop}
            onClick={() => pdfInputRef.current?.click()}
            className={`flex flex-col items-center gap-3 py-16 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              pdfDragOver
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
            }`}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]); e.target.value = ''; }}
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Upload className="w-7 h-7 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Drop a PDF here</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">or click to browse</p>
            </div>
          </div>

          {/* Selected file */}
          {pdfFile && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
              <FileType2 className="w-8 h-8 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pdfFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(pdfFile.size)}</p>
              </div>
              <button
                onClick={() => setPdfFile(null)}
                className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Progress */}
          {converting && progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!pdfFile || converting}
            loading={converting}
            onClick={convertPdfToWord}
            className="!from-indigo-500 !to-blue-600 hover:!from-indigo-600 hover:!to-blue-700"
          >
            {converting ? `Converting… ${progress}%` : 'Convert to Word (.docx)'}
          </Button>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Note:</strong> Each PDF page is embedded as a high-quality image in the Word document.
              Text is not extracted — for editable text export, copy directly from the PDF viewer.
            </p>
          </div>
        </div>
      )}

      {/* ── Word → PDF tab ── */}
      {tab === 'word-to-pdf' && (
        <div className="flex flex-col gap-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setWordDragOver(true); }}
            onDragLeave={() => setWordDragOver(false)}
            onDrop={handleWordDrop}
            onClick={() => wordInputRef.current?.click()}
            className={`flex flex-col items-center gap-3 py-16 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              wordDragOver
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
            }`}
          >
            <input
              ref={wordInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) setWordFile(e.target.files[0]); e.target.value = ''; }}
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <FileText className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Drop a Word document here</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">.docx only · or click to browse</p>
            </div>
          </div>

          {/* Selected file */}
          {wordFile && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <FileText className="w-8 h-8 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{wordFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(wordFile.size)}</p>
              </div>
              <button
                onClick={() => setWordFile(null)}
                className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Progress */}
          {converting && progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!wordFile || converting}
            loading={converting}
            onClick={convertWordToPdf}
            className="!from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700"
          >
            {converting ? `Converting… ${progress}%` : 'Convert to PDF'}
          </Button>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Note:</strong> Text, headings, lists, and images are preserved. Complex layouts,
              headers/footers, and precise Word formatting may not carry over exactly.
            </p>
          </div>
        </div>
      )}

      {/* ── Image → PDF tab ── */}
      {tab === 'image-to-pdf' && (
        <div className="flex flex-col gap-6">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setImgDragOver(true); }}
            onDragLeave={() => setImgDragOver(false)}
            onDrop={handleImgDrop}
            onClick={() => imgInputRef.current?.click()}
            className={`flex flex-col items-center gap-3 py-16 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              imgDragOver
                ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
            }`}
          >
            <input
              ref={imgInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                e.target.value = '';
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Drop images here</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                JPG · PNG · WebP · GIF · BMP &nbsp;·&nbsp; multiple files OK
              </p>
            </div>
          </div>

          {/* Image grid */}
          {imageFiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} — one page each
                </p>
                <button
                  onClick={() => setImageFiles([])}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${file.size}-${i}`}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-[4/3]"
                  >
                    {imagePreviews[i] && (
                      <img
                        src={imagePreviews[i]}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />

                    {/* Page number badge */}
                    <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center font-semibold">
                      {i + 1}
                    </span>

                    {/* Remove button */}
                    <button
                      onClick={e => { e.stopPropagation(); setImageFiles(prev => prev.filter((_, j) => j !== i)); }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Filename tooltip on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] truncate">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {converting && progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={imageFiles.length === 0 || converting}
            loading={converting}
            onClick={convertImagesToPdf}
          >
            {converting
              ? `Creating PDF… ${progress}%`
              : imageFiles.length === 0
                ? 'Add images to convert'
                : `Create PDF from ${imageFiles.length} Image${imageFiles.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Convert;
