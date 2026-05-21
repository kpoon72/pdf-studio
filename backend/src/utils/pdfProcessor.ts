import { PDFDocument, degrees } from 'pdf-lib';
import * as fs from 'fs';
import { SplitRange } from '../types';

export async function getPageCount(filePath: string): Promise<number> {
  const bytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

export async function mergePDFs(filePaths: string[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const filePath of filePaths) {
    const bytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  return mergedPdf.save();
}

export async function splitPDF(filePath: string, ranges: SplitRange[]): Promise<Uint8Array[]> {
  const bytes = fs.readFileSync(filePath);
  const sourcePdf = await PDFDocument.load(bytes);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let i = range.start - 1; i < range.end; i++) pageIndices.push(i);
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function rotatePages(filePath: string, pageIndices: number[], angleDeg: number): Promise<Uint8Array> {
  const bytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(bytes);
  pageIndices.forEach(idx => {
    const page = pdf.getPage(idx);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angleDeg) % 360));
  });
  return pdf.save();
}

export async function deletePages(filePath: string, pageIndices: number[]): Promise<Uint8Array> {
  const bytes = fs.readFileSync(filePath);
  const pdf = await PDFDocument.load(bytes);
  const sorted = [...pageIndices].sort((a, b) => b - a);
  sorted.forEach(idx => pdf.removePage(idx));
  return pdf.save();
}

export async function reorderPages(filePath: string, newOrder: number[]): Promise<Uint8Array> {
  const bytes = fs.readFileSync(filePath);
  const sourcePdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, newOrder.map(i => i - 1));
  pages.forEach(page => newPdf.addPage(page));
  return newPdf.save();
}
