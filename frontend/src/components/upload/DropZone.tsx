import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  multiple?: boolean;
  compact?: boolean;
  className?: string;
}

function filterPDFs(files: File[]): File[] {
  return files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, multiple = true, compact = false, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const counter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); counter.current++; setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); counter.current--; if (counter.current === 0) setIsDragging(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); counter.current = 0; setIsDragging(false);
    const all = Array.from(e.dataTransfer.files);
    const pdfs = filterPDFs(all);
    if (pdfs.length) onFilesAdded(pdfs);
    else if (all.length) toast.error('Only PDF files are supported here');
  }, [onFilesAdded]);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || []);
    const pdfs = filterPDFs(all);
    if (pdfs.length) onFilesAdded(pdfs);
    else if (all.length) toast.error('Only PDF files are supported here');
    e.target.value = '';
  }, [onFilesAdded]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed transition-all duration-200 text-sm font-medium cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
            : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800',
          className,
        )}
      >
        <Upload className="w-4 h-4" />
        {isDragging ? 'Drop here' : 'Add PDFs'}
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple={multiple} onChange={onChange} className="hidden" />
      </button>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
      className={clsx(
        'relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group select-none',
        isDragging
          ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-900/20 scale-[1.01]'
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/40',
        className,
      )}
    >
      {/* Subtle radial gradient */}
      <div className={clsx(
        'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 bg-gradient-to-br from-primary-500/10 to-purple-500/10 pointer-events-none',
        isDragging ? 'opacity-100' : 'group-hover:opacity-60',
      )} />

      <div className={clsx(
        'relative flex flex-col items-center gap-5 transition-transform duration-200',
        isDragging ? 'scale-110' : 'group-hover:scale-[1.04]',
      )}>
        <div className={clsx(
          'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
          isDragging
            ? 'bg-primary-500 shadow-glow'
            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30',
        )}>
          {isDragging
            ? <FileText className="w-10 h-10 text-white" />
            : <Upload className="w-10 h-10 text-gray-400 group-hover:text-primary-500 transition-colors" />}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {isDragging ? 'Release to upload' : 'Upload PDF Files'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {isDragging ? 'Drop your files here' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            PDF files up to 100 MB{multiple ? ' • Multiple files supported' : ''}
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple={multiple} onChange={onChange} className="hidden" />
    </div>
  );
};

export default DropZone;
