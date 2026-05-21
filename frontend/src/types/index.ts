export interface PDFFile {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  pageCount: number;
  uploadedAt: string;
  thumbnails?: string[];
  file?: File;
}

export interface ParsedRange {
  id: string;
  input: string;
  start: number;
  end: number;
  label: string;
  isValid: boolean;
  error?: string;
}

export interface PageItem {
  id: string;
  pageIndex: number;
  fileId: string;
  thumbnail?: string;
  rotation: number;
  selected: boolean;
}

export interface Annotation {
  id: string;
  type: 'text' | 'rect' | 'highlight' | 'signature' | 'circle';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color: string;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  dataUrl?: string;
}

export interface Signature {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export type Theme = 'light' | 'dark';

export type EditorTool = 'select' | 'text' | 'rect' | 'highlight' | 'circle' | 'signature';
