import * as PDFJS from 'pdfjs-dist';

// Use locally bundled worker so the app works without internet access
PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Load PDF once, render all thumbnails from the same document instance.
// Avoids the DataCloneError caused by re-using a transferred ArrayBuffer.
export async function loadPDFInfo(
  file: File,
  maxWidth = 160,
): Promise<{ pageCount: number; thumbnails: string[] }> {
  // file.arrayBuffer() always returns a fresh copy — safe to transfer
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFJS.getDocument({ data: buf }).promise;
  const thumbnails: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    thumbnails.push(await renderOnePage(pdf, i, maxWidth));
  }

  return { pageCount: pdf.numPages, thumbnails };
}

// Render a single page from an already-loaded PDFDocumentProxy
async function renderOnePage(
  pdf: PDFJS.PDFDocumentProxy,
  pageNum: number,
  maxWidth: number,
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = maxWidth / unscaled.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.75);
}

// Render a single page onto a provided canvas element.
// Reads a fresh ArrayBuffer from the File each call so the buffer is never reused.
export async function renderPageToCanvas(
  file: File,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5,
): Promise<{ width: number; height: number }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFJS.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  return { width: viewport.width, height: viewport.height };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// pdf-lib returns Uint8Array backed by a standard ArrayBuffer; safe to cast
export function toPdfBlob(bytes: Uint8Array): Blob {
  const buf = (bytes.buffer as ArrayBuffer).slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([buf], { type: 'application/pdf' });
}

export async function mergeClientSidePDFs(files: File[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buf);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }
  return merged.save();
}

export async function splitClientSidePDF(
  file: File,
  ranges: Array<{ start: number; end: number; label: string }>,
): Promise<Array<{ data: Uint8Array; label: string }>> {
  const { PDFDocument } = await import('pdf-lib');
  const buf = await file.arrayBuffer();
  const source = await PDFDocument.load(buf);
  const results: Array<{ data: Uint8Array; label: string }> = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const indices: number[] = [];
    for (let i = range.start - 1; i < range.end; i++) indices.push(i);
    const pages = await newPdf.copyPages(source, indices);
    pages.forEach(p => newPdf.addPage(p));
    results.push({ data: await newPdf.save(), label: range.label });
  }
  return results;
}

export async function organizeClientSidePDF(
  file: File,
  pages: Array<{ pageIndex: number; rotation: number }>,
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const buf = await file.arrayBuffer();
  const source = await PDFDocument.load(buf);
  const newPdf = await PDFDocument.create();

  const copied = await newPdf.copyPages(source, pages.map(p => p.pageIndex));
  copied.forEach((page, i) => {
    if (pages[i].rotation !== 0) page.setRotation(degrees(pages[i].rotation));
    newPdf.addPage(page);
  });
  return newPdf.save();
}
