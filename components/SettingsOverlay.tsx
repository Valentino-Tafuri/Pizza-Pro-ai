
import React, { useState, useRef } from 'react';
import { X, User, Truck, Users, ArrowLeft, Check, LogOut, Phone, Calendar, Briefcase, MapPin, Edit2, Plus, Database, Upload, Download, AlertCircle, Loader2, Bell } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'main' | 'user' | 'suppliers' | 'employees' | 'new-supplier' | 'new-employee' | 'data'>('main');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({ deliveryDays: [] });
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({ 
    monthlyHours: 0, 
    monthlySalary: 0, 
    contributionPercentage: 0,
    department: '',
    role: ''
  });

  if (!isOpen) return null;

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const handleExportData = () => {
    const data = {
      suppliers,
      ingredients,
      subRecipes,
      menu,
      employees,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pizzacost_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (json.suppliers) {
          for (const s of json.suppliers) await onAddSupplier(s);
        }
        if (json.ingredients) {
          for (const i of json.ingredients) await onAddIngredient(i);
        }
        if (json.subRecipes) {
          for (const sr of json.subRecipes) await onAddSubRecipe(sr);
        }
        if (json.menu) {
          for (const m of json.menu) await onAddMenuItem(m);
        }
        if (json.employees) {
          for (const emp of json.employees) await onAddEmployee(emp);
        }

        alert("Importazione completata con successo!");
        setActiveTab('main');
      } catch (err) {
        setImportError("Errore nel formato del file JSON.");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'data':
        return (
          <div className="space-y-6">
            <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400 mb-4">
              <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
            </button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 space-y-8">
              <div className="text-center space-y-2">
                <div className="bg-orange-50 text-orange-500 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Database size={32} />
                </div>
                <h3 className="text-2xl font-black text-black">Gestione Dati</h3>
                <p className="text-sm text-gray-400 font-medium text-center">Carica o scarica l'intero archivio della tua pizzeria.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
                <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} className="w-full bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center space-x-3 shadow-xl disabled:opacity-50">
                  {importLoading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  <span>{importLoading ? 'Importazione...' : 'Importa JSON'}</span>
                </button>
                <button onClick={handleExportData} className="w-full bg-gray-50 text-gray-600 py-5 rounded-[2rem] font-black flex items-center justify-center space-x-3 active:scale-95 transition-all">
                  <Download size={20} />
                  <span>Esporta Backup</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'user':
        return (
          <div className="space-y-6">
            <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400 mb-4">
              <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
            </button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 space-y-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-blue-50 text-blue-500 p-4 rounded-3xl"><User size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-black">{userData.firstName} {userData.lastName}</h3>
                  <p className="text-sm text-gray-400 font-bold">{userData.email}</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex items-center space-x-3 text-black mb-2">
                   <Bell size={18} className="text-blue-500" />
                   <h4 className="font-black text-sm uppercase tracking-widest">Notifiche & Soglie</h4>
                </div>
                <div className="space-y-4 bg-gray-50 p-6 rounded-[2rem]">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-black uppercase tracking-tight">Soglia Food Cost Critico</label>
                    <span className="text-lg font-black text-blue-600">{userData.foodCostThreshold}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="60" 
                    step="1" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    value={userData.foodCostThreshold}
                    onChange={(e) => onUpdateUserData?.({ foodCostThreshold: parseInt(e.target.value) })}
                  />
                  <p className="text-[10px] text-gray-400 font-bold leading-tight">
                    Verrai avvisato nella Dashboard quando una pizza supera questa percentuale di costo rispetto al prezzo di vendita.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 px-1">
              <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400">
                <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
              </button>
              <button onClick={() => { setEditingId(null); setSupplierForm({deliveryDays: []}); setActiveTab('new-supplier'); }} className="bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight">
                Nuovo Fornitore
              </button>
            </div>
            <div className="space-y-3">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <h4 className="font-black text-xl text-black leading-none">{s.name}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Phone size={14} className="text-gray-300" />
                        <span className="text-sm font-bold">{s.phone || 'N/D'}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Calendar size={14} className="text-gray-300" />
                        <div className="flex flex-wrap gap-1">
                          {s.deliveryDays?.map(day => (
                            <span key={day} className="bg-gray-50 text-gray-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-gray-100 uppercase">{day}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setSupplierForm(s); setEditingId(s.id); setActiveTab('new-supplier'); }} className="p-3 bg-gray-50 text-gray-400 rounded-2xl active:bg-black active:text-white transition-all ml-2">
                    <Edit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'employees':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-4 px-1">
              <button onClick={() => setActiveTab('main')} className="flex items-center space-x-2 text-gray-400">
                <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
              </button>
              <button onClick={() => { setEditingId(null); setEmployeeForm({monthlyHours:0, monthlySalary:0, contributionPercentage:0}); setActiveTab('new-employee'); }} className="bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight">
                Nuovo Dipendente
              </button>
            </div>
            <div className="space-y-3">
              {employees.map(e => (
                <div key={e.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <h4 className="font-black text-xl text-black leading-none">{e.firstName} {e.lastName}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <MapPin size={14} className="text-gray-300" />
                        <span className="text-sm font-bold">Reparto: <span className="text-black">{e.department || 'N/D'}</span></span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Briefcase size={14} className="text-gray-300" />
                        <span className="text-sm font-bold">Ruolo: <span className="text-black">{e.role || 'N/D'}</span></span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setEmployeeForm(e); setEditingId(e.id); setActiveTab('new-employee'); }} className="p-3 bg-gray-50 text-gray-400 rounded-2xl active:bg-black active:text-white transition-all ml-2">
                    <Edit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'new-employee':
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('employees')} className="flex items-center space-x-2 text-gray-400 mb-4">
              <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
            </button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 className="text-2xl font-black text-black">{editingId ? 'Modifica Dipendente' : 'Nuovo Dipendente'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Nome" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={employeeForm.firstName || ''} onChange={e => setEmployeeForm({...employeeForm, firstName: e.target.value})} />
                  <input placeholder="Cognome" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={employeeForm.lastName || ''} onChange={e => setEmployeeForm({...employeeForm, lastName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Reparto" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={employeeForm.department || ''} onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})} />
                  <input placeholder="Ruolo" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={employeeForm.role || ''} onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Stipendio" className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-black text-center border-none" value={employeeForm.monthlySalary || ''} onChange={e => setEmployeeForm({...employeeForm, monthlySalary: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Ore" className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-black text-center border-none" value={employeeForm.monthlyHours || ''} onChange={e => setEmployeeForm({...employeeForm, monthlyHours: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Contrib %" className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-black text-center border-none" value={employeeForm.contributionPercentage || ''} onChange={e => setEmployeeForm({...employeeForm, contributionPercentage: parseInt(e.target.value)})} />
                </div>
              </div>
              <button onClick={() => { onAddEmployee(employeeForm as Employee); setActiveTab('employees'); }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center space-x-2 shadow-xl">
                <Check size={20} /> <span>Salva Dipendente</span>
              </button>
            </div>
          </div>
        );
      case 'new-supplier':
        return (
          <div className="space-y-4">
            <button onClick={() => setActiveTab('suppliers')} className="flex items-center space-x-2 text-gray-400 mb-4">
              <ArrowLeft size={18} /> <span className="text-sm font-bold">Indietro</span>
            </button>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 className="text-2xl font-black text-black">{editingId ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</h3>
              <div className="space-y-4">
                <input placeholder="Ragione Sociale" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supplierForm.name || ''} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
                <input placeholder="Categoria" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supplierForm.category || ''} onChange={e => setSupplierForm({...supplierForm, category: e.target.value})} />
                <input placeholder="Telefono" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supplierForm.phone || ''} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                <input placeholder="Email" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supplierForm.email || ''} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Giorni di Consegna</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button key={day} onClick={() => {
                        const current = supplierForm.deliveryDays || [];
                        setSupplierForm({ ...supplierForm, deliveryDays: current.includes(day) ? current.filter(d => d !== day) : [...current, day] });
                      }} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${supplierForm.deliveryDays?.includes(day) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => { onAddSupplier(supplierForm as Supplier); setActiveTab('suppliers'); }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black flex items-center justify-center space-x-2 shadow-xl">
                <Check size={20} /> <span>Salva Fornitore</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4 mt-8">
            <button onClick={() => setActiveTab('user')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 active:scale-[0.98] transition-all border border-gray-50">
              <div className="bg-blue-50 text-blue-500 p-4 rounded-2xl"><User size={28}/></div>
              <div className="text-left">
                <h3 className="font-black text-black text-lg">Account & Notifiche</h3>
                <p className="text-xs text-gray-400 font-bold">Gestione profilo e soglie allerta</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('data')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 active:scale-[0.98] transition-all border border-gray-50">
              <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl"><Database size={28}/></div>
              <div className="text-left">
                <h3 className="font-black text-black text-lg">Importa / Esporta</h3>
                <p className="text-xs text-gray-400 font-bold">Gestione database e backup</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('suppliers')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 active:scale-[0.98] transition-all border border-gray-50">
              <div className="bg-green-50 text-green-500 p-4 rounded-2xl"><Truck size={28}/></div>
              <div className="text-left">
                <h3 className="font-black text-black text-lg">I tuoi Fornitori</h3>
                <p className="text-xs text-gray-400 font-bold">Contatti e giorni di scarico</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('employees')} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center space-x-5 active:scale-[0.98] transition-all border border-gray-50">
              <div className="bg-purple-50 text-purple-500 p-4 rounded-2xl"><Users size={28}/></div>
              <div className="text-left">
                <h3 className="font-black text-black text-lg">I tuoi Dipendenti</h3>
                <p className="text-xs text-gray-400 font-bold">Organigramma e reparti</p>
              </div>
            </button>
            <button onClick={onSignOut} className="w-full mt-12 bg-red-50 text-red-500 py-4 rounded-[2rem] font-black text-sm flex items-center justify-center space-x-2 active:scale-95 transition-all">
              <LogOut size={18} />
              <span>Esci dall'Account</span>
            </button>
          </div>
        );
    }
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
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsOverlay;
