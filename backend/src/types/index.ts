export interface PDFFileInfo {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  pageCount: number;
  uploadedAt: string;
}

export interface SplitRange {
  start: number;
  end: number;
  label: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
