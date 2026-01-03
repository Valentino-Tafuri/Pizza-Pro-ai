
import React from 'react';
import { LayoutDashboard, Utensils, Beaker, Package, Settings } from 'lucide-react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  title: string;
  onOpenSettings: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, title, onOpenSettings }) => {
  const navItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu' as ViewType, label: 'Menu', icon: Utensils },
    { id: 'lab' as ViewType, label: 'Laboratorio', icon: Beaker },
    { id: 'economato' as ViewType, label: 'Economato', icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-start">
        <h1 className="text-4xl font-black text-black tracking-tight">{title}</h1>
        <button 
          onClick={onOpenSettings}
          className="p-3 bg-white shadow-sm rounded-full border border-gray-100 active:scale-90 transition-transform"
        >
          <Settings size={22} className="text-gray-600" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 ios-blur bg-white/80 border-t border-gray-100 px-6 pt-3 safe-area-bottom z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center space-y-1 transition-colors ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
