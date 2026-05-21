import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitMerge, Scissors, Edit3, Layers, PenTool, ArrowLeftRight, ArrowRight, FileText, Zap, Shield, Star } from 'lucide-react';

const TOOLS = [
  {
    path: '/merge',
    icon: GitMerge,
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into one. Drag & drop to reorder pages before merging.',
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-500',
  },
  {
    path: '/split',
    icon: Scissors,
    title: 'Split PDF',
    description: 'Split into individual pages or custom ranges. Enter "1-3, 4, 5-7" to get separate PDFs.',
    color: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800/50',
    iconBg: 'bg-orange-500',
  },
  {
    path: '/editor',
    icon: Edit3,
    title: 'Edit PDF',
    description: 'Add text, shapes, highlights, and annotations to your PDF pages.',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/50',
    iconBg: 'bg-green-500',
  },
  {
    path: '/organize',
    icon: Layers,
    title: 'Organize Pages',
    description: 'Rearrange, rotate, delete, or duplicate pages with drag & drop.',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/50',
    iconBg: 'bg-purple-500',
  },
  {
    path: '/sign',
    icon: PenTool,
    title: 'Sign PDF',
    description: 'Draw or upload a signature and place it anywhere on your PDF.',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800/50',
    iconBg: 'bg-pink-500',
  },
  {
    path: '/convert',
    icon: ArrowLeftRight,
    title: 'Convert',
    description: 'Convert PDF pages to a Word document, or turn JPG/PNG images into a PDF.',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    iconBg: 'bg-indigo-500',
  },
];

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'All processing happens locally in your browser — no server uploads needed.' },
  { icon: Shield, title: 'Privacy First', desc: 'Your files never leave your device. 100% client-side processing.' },
  { icon: Star, title: 'Free Forever', desc: 'No watermarks, no file limits, no sign-up required.' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Modern PDF Toolkit — Runs 100% in Your Browser
          </div>

          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            The PDF tools you've
            <span className="bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent"> always wanted</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Merge, split, edit, organize, and sign your PDFs instantly. No uploads, no watermarks, no limits.
          </p>

          <button
            onClick={() => navigate('/merge')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold text-lg hover:from-primary-600 hover:to-purple-700 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tools grid */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">All PDF Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ path, icon: Icon, title, description, color, bg, border, iconBg }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`group flex flex-col gap-4 p-6 rounded-2xl border ${bg} ${border} text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                Use tool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
