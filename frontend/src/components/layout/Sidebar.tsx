import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, GitMerge, Scissors, Edit3, Layers, PenTool, ArrowLeftRight, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Dashboard', end: true },
  { path: '/merge', icon: GitMerge, label: 'Merge PDFs', end: false },
  { path: '/split', icon: Scissors, label: 'Split PDF', end: false },
  { path: '/editor', icon: Edit3, label: 'Edit PDF', end: false },
  { path: '/organize', icon: Layers, label: 'Organize', end: false },
  { path: '/sign', icon: PenTool, label: 'Sign PDF', end: false },
  { path: '/convert', icon: ArrowLeftRight, label: 'Convert', end: false },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => (
  <aside className={clsx(
    'relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out shadow-xl z-20 flex-shrink-0',
    isOpen ? 'w-60' : 'w-[68px]',
  )}>
    {/* Logo */}
    <div className={clsx('flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800', isOpen ? 'gap-3' : 'justify-center')}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center shadow-glow flex-shrink-0">
        <FileText className="w-5 h-5 text-white" />
      </div>
      {isOpen && <span className="font-bold text-gray-900 dark:text-white text-[17px] tracking-tight">PDF Studio</span>}
    </div>

    {/* Toggle */}
    <button
      onClick={onToggle}
      className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-30"
    >
      {isOpen ? <ChevronLeft className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
    </button>

    {/* Nav */}
    <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
      {NAV_ITEMS.map(({ path, icon: Icon, label, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          title={!isOpen ? label : undefined}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group whitespace-nowrap overflow-hidden',
            isActive
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
          )}
        >
          <Icon className="w-[18px] h-[18px] flex-shrink-0" />
          {isOpen && <span className="font-medium text-sm">{label}</span>}
        </NavLink>
      ))}
    </nav>

    {isOpen && (
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">PDF Studio v1.0</p>
      </div>
    )}
  </aside>
);

export default Sidebar;
