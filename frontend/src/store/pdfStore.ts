import { create } from 'zustand';
import type { PDFFile, PageItem, Annotation, Signature, Theme } from '../types';

interface PDFStore {
  uploadedFiles: PDFFile[];
  selectedFileId: string | null;
  pages: PageItem[];
  annotations: Annotation[];
  signatures: Signature[];
  theme: Theme;
  isLoading: boolean;
  loadingMessage: string;

  addFiles: (files: PDFFile[]) => void;
  removeFile: (id: string) => void;
  setSelectedFile: (id: string | null) => void;
  updateFile: (id: string, updates: Partial<PDFFile>) => void;

  setPages: (pages: PageItem[]) => void;
  reorderPages: (oldIndex: number, newIndex: number) => void;
  togglePageSelection: (pageId: string) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  rotateSelectedPages: (deg: number) => void;
  deleteSelectedPages: () => void;
  duplicatePage: (pageId: string) => void;

  addAnnotation: (ann: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;

  addSignature: (sig: Signature) => void;
  removeSignature: (id: string) => void;

  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean, message?: string) => void;
  reset: () => void;
}

const initial = {
  uploadedFiles: [] as PDFFile[],
  selectedFileId: null as string | null,
  pages: [] as PageItem[],
  annotations: [] as Annotation[],
  signatures: [] as Signature[],
  theme: 'light' as Theme,
  isLoading: false,
  loadingMessage: '',
};

export const usePDFStore = create<PDFStore>()((set) => ({
  ...initial,

  addFiles: (files) => set((s) => ({ uploadedFiles: [...s.uploadedFiles, ...files] })),
  removeFile: (id) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter(f => f.id !== id),
    selectedFileId: s.selectedFileId === id ? null : s.selectedFileId,
  })),
  setSelectedFile: (id) => set({ selectedFileId: id }),
  updateFile: (id, updates) => set((s) => ({
    uploadedFiles: s.uploadedFiles.map(f => f.id === id ? { ...f, ...updates } : f),
  })),

  setPages: (pages) => set({ pages }),
  reorderPages: (oldIdx, newIdx) => set((s) => {
    const pages = [...s.pages];
    const [removed] = pages.splice(oldIdx, 1);
    pages.splice(newIdx, 0, removed);
    return { pages };
  }),
  togglePageSelection: (pageId) => set((s) => ({
    pages: s.pages.map(p => p.id === pageId ? { ...p, selected: !p.selected } : p),
  })),
  selectAllPages: () => set((s) => ({ pages: s.pages.map(p => ({ ...p, selected: true })) })),
  deselectAllPages: () => set((s) => ({ pages: s.pages.map(p => ({ ...p, selected: false })) })),
  rotateSelectedPages: (deg) => set((s) => ({
    pages: s.pages.map(p => p.selected ? { ...p, rotation: (p.rotation + deg) % 360 } : p),
  })),
  deleteSelectedPages: () => set((s) => ({ pages: s.pages.filter(p => !p.selected) })),
  duplicatePage: (pageId) => set((s) => {
    const idx = s.pages.findIndex(p => p.id === pageId);
    if (idx === -1) return s;
    const page = s.pages[idx];
    const newPage: PageItem = { ...page, id: `${page.id}-dup-${Date.now()}`, selected: false };
    const pages = [...s.pages];
    pages.splice(idx + 1, 0, newPage);
    return { pages };
  }),

  addAnnotation: (ann) => set((s) => ({ annotations: [...s.annotations, ann] })),
  updateAnnotation: (id, updates) => set((s) => ({
    annotations: s.annotations.map(a => a.id === id ? { ...a, ...updates } : a),
  })),
  removeAnnotation: (id) => set((s) => ({ annotations: s.annotations.filter(a => a.id !== id) })),
  clearAnnotations: () => set({ annotations: [] }),

  addSignature: (sig) => set((s) => ({ signatures: [...s.signatures, sig] })),
  removeSignature: (id) => set((s) => ({ signatures: s.signatures.filter(s2 => s2.id !== id) })),

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('pdf-studio-theme', theme);
  },
  setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
  reset: () => set(initial),
}));
