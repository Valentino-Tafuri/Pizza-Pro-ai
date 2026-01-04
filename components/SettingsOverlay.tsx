
import React, { useState, useRef } from 'react';
import { X, User, ArrowLeft, LogOut, Database, Upload, Download, Loader2, Bell } from 'lucide-react';
import { UserData, Supplier, Employee, Ingredient, SubRecipe, MenuItem } from '../types';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  suppliers: Supplier[];
  employees: Employee[];
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
  menu: MenuItem[];
  onAddSupplier: (supplier: Supplier) => Promise<string | undefined>;
  onAddEmployee: (employee: Employee) => Promise<string | undefined>;
  onAddIngredient: (ingredient: Ingredient) => Promise<string | undefined>;
  onAddSubRecipe: (sub: SubRecipe) => Promise<string | undefined>;
  onAddMenuItem: (item: MenuItem) => Promise<string | undefined>;
  onUpdateUserData?: (data: Partial<UserData>) => void;
  onSignOut: () => void;
}


const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, 
  onClose, 
  userData, 
  suppliers, 
  employees,
  ingredients,
  subRecipes,
  menu,
  onAddSupplier,
  onAddEmployee,
  onAddIngredient,
  onAddSubRecipe,
  onAddMenuItem,
  onUpdateUserData,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'user' | 'data'>('main');
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportData = () => {
    const data = { suppliers, ingredients, subRecipes, menu, employees, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_pizzacost.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.ingredients) for (const i of json.ingredients) await onAddIngredient(i);
        if (json.subRecipes) for (const sr of json.subRecipes) await onAddSubRecipe(sr);
        if (json.menu) for (const m of json.menu) await onAddMenuItem(m);
        alert("Importazione completata!");
        onClose();
      } catch (err) {
        alert("Errore nel file JSON.");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] ios-blur bg-white/95 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-black tracking-tight">Impostazioni</h2>
        <button onClick={onClose} className="bg-gray-100 p-3 rounded-full text-gray-600 active:scale-90 transition-transform">
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-12 scrollbar-hide">
        {activeTab === 'main' ? (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('user')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 border border-gray-50">
              <div className="bg-blue-50 text-blue-500 p-4 rounded-2xl"><User size={28}/></div>
              <div className="text-left"><h3 className="font-black text-lg">Profilo</h3><p className="text-xs text-gray-400 font-bold">Account e soglie food cost</p></div>
            </button>
            <button onClick={() => setActiveTab('data')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 border border-gray-50">
              <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl"><Database size={28}/></div>
              <div className="text-left"><h3 className="font-black text-lg">Dati</h3><p className="text-xs text-gray-400 font-bold">Import/Export database</p></div>
            </button>
            <button onClick={onSignOut} className="w-full mt-12 bg-red-50 text-red-500 py-4 rounded-[2rem] font-black text-sm flex items-center justify-center space-x-2">
              <LogOut size={18} /><span>Esci dall'Account</span>
            </button>
          </div>
        ) : activeTab === 'data' ? (
          <div className="space-y-6">
            <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400 mb-4"><ArrowLeft size={18} /> <b>Indietro</b></button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 space-y-4">
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
              <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} className="w-full bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center space-x-3 shadow-xl">
                {importLoading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span>Importa JSON</span>
              </button>
              <button onClick={handleExportData} className="w-full bg-gray-50 text-gray-600 py-5 rounded-[2rem] font-black flex items-center justify-center space-x-3">
                <Download size={20} /><span>Scarica Backup</span>
              </button>

            </div>
          </div>
        ) : (
           <div className="space-y-6">
            <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400 mb-4"><ArrowLeft size={18} /> <b>Indietro</b></button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-tight">Soglia Allerta Food Cost</label>
                <span className="text-xl font-black text-blue-600">{userData.foodCostThreshold}%</span>
              </div>
              <input type="range" min="15" max="60" className="w-full accent-black" value={userData.foodCostThreshold} onChange={(e) => onUpdateUserData?.({ foodCostThreshold: parseInt(e.target.value) })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsOverlay;
