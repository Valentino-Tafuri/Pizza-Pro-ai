
import React, { useState } from 'react';
import { Search, Edit2, Plus, Trash2, X, AlertTriangle, PlusCircle, Check, Loader2 } from 'lucide-react';
import { Ingredient, Unit, Supplier } from '../../types';

interface EconomatoViewProps {
  ingredients: Ingredient[];
  suppliers: Supplier[];
  onUpdate: (ingredient: Ingredient) => void;
  onAdd: (ingredient: Ingredient) => void;
  onDelete?: (id: string) => void;
  onAddSupplier?: (supplier: Supplier) => Promise<string | undefined>;
}

const EconomatoView: React.FC<EconomatoViewProps> = ({ ingredients, suppliers, onUpdate, onAdd, onDelete, onAddSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Ingredient>>({ unit: 'kg' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);

  // Quick Supplier Modal State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supForm, setSupForm] = useState<Partial<Supplier>>({ deliveryDays: [] });
  const [supLoading, setSupLoading] = useState(false);

  // Confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = Array.from(new Set(ingredients.map(i => i.category)));
  const allCategories = [null, ...categories];
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const filtered = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? i.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
    setConfirmDeleteId(null);
  };

  const handleQuickSupplierSave = async () => {
    if (!supForm.name || !onAddSupplier) return;
    setSupLoading(true);
    try {
      const realId = await onAddSupplier(supForm as Supplier);
      if (realId) {
        setForm(prev => ({ ...prev, supplierId: realId }));
        setShowSupplierModal(false);
        setSupForm({ deliveryDays: [] });
      }
    } finally {
      setSupLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    const current = supForm.deliveryDays || [];
    setSupForm({ 
      ...supForm, 
      deliveryDays: current.includes(day) ? current.filter(d => d !== day) : [...current, day] 
    });
  };

  const renderSupplierModal = () => (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-black">Nuovo Fornitore</h3>
          <button onClick={() => setShowSupplierModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Ragione Sociale</label>
            <input placeholder="es. Global Food S.p.A." className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none focus:ring-2 focus:ring-black/5" value={supForm.name || ''} onChange={e => setSupForm({...supForm, name: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Merceologia</label>
            <input placeholder="es. Latticini / Farine" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none focus:ring-2 focus:ring-black/5" value={supForm.category || ''} onChange={e => setSupForm({...supForm, category: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Telefono</label>
              <input placeholder="02..." className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none focus:ring-2 focus:ring-black/5" value={supForm.phone || ''} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
              <input placeholder="info@..." className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none focus:ring-2 focus:ring-black/5" value={supForm.email || ''} onChange={e => setSupForm({...supForm, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Giorni di Consegna</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${supForm.deliveryDays?.includes(day) ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 text-gray-400 border-transparent'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleQuickSupplierSave} disabled={supLoading || !supForm.name} className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2">
          {supLoading ? <Loader2 size={20} className="animate-spin" /> : <><Check size={20} /><span>Crea e Seleziona</span></>}
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-gray-100 mb-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-2xl tracking-tight">{editingId ? 'Modifica' : 'Nuovo Ingrediente'}</h3>
        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-gray-100 p-2 rounded-full text-gray-400"><X size={20}/></button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome Materia Prima</label>
          <input type="text" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="es. Farina di Forza" />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Appartenenza Merceologica</label>
          <select className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold appearance-none" value={isCreatingNewCategory ? 'NEW' : (form.category || '')} onChange={(e) => { if (e.target.value === 'NEW') setIsCreatingNewCategory(true); else { setIsCreatingNewCategory(false); setForm({ ...form, category: e.target.value }); } }}>
            <option value="" disabled>Seleziona categoria...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="NEW" className="text-blue-500 font-black">+ Nuova categoria...</option>
          </select>
          {isCreatingNewCategory && <input type="text" placeholder="Nome nuova categoria" className="mt-2 w-full bg-blue-50/30 border-none rounded-2xl px-5 py-3 text-xs font-bold" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />}
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Fornitore</label>
          <div className="flex space-x-2">
            <select className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold appearance-none" value={form.supplierId || ''} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Nessuno</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => setShowSupplierModal(true)} className="bg-white border border-gray-100 p-4 rounded-2xl text-blue-500 shadow-sm active:scale-90 transition-all">
              <PlusCircle size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Prezzo (€)</label>
            <input type="number" step="0.01" className="w-full bg-black text-white border-none rounded-2xl px-5 py-4 text-lg font-black text-center" value={form.pricePerUnit || ''} onChange={(e) => setForm({ ...form, pricePerUnit: parseFloat(e.target.value) })} placeholder="0.00" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Unità base</label>
            <div className="flex bg-gray-100 rounded-2xl p-1 h-[58px]">
              {['kg', 'l', 'unit'].map(u => (
                <button key={u} onClick={() => setForm({ ...form, unit: u as Unit })} className={`flex-1 rounded-xl text-[10px] font-black transition-all ${form.unit === u ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>{u.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => { 
        const finalCategory = isCreatingNewCategory ? newCategoryName : form.category; 
        if (!form.name || !finalCategory) return; 
        const payload = { ...form, category: finalCategory } as Ingredient; 
        if (editingId) onUpdate(payload); else onAdd({ ...payload, id: Math.random().toString(36).substr(2, 9) }); 
        setIsAdding(false); setEditingId(null); setIsCreatingNewCategory(false); 
      }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-base shadow-2xl active:scale-95 transition-all">
        {editingId ? 'Aggiorna Ingrediente' : 'Salva Ingrediente'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {showSupplierModal && renderSupplierModal()}
      
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm space-y-3 animate-in slide-in-from-bottom-10">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 text-center border-b border-gray-100">
                <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
                <h4 className="text-sm font-black text-black uppercase tracking-tight">Elimina Materia Prima</h4>
                <p className="text-[11px] text-gray-500 mt-1">Questa azione rimuoverà l'ingrediente dall'economato. Confermi?</p>
              </div>
              <button onClick={() => handleDelete(confirmDeleteId)} className="w-full py-4 text-red-600 font-black text-base active:bg-red-50 transition-colors">Elimina Definitivamente</button>
            </div>
            <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-white py-4 rounded-2xl font-black text-base text-black shadow-xl">Annulla</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative px-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cerca ingrediente..." className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ unit: 'kg' }); }} className="absolute right-5 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-xl shadow-sm"><Plus size={16} /></button>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide px-3">
          {allCategories.map((cat) => (
            <button key={cat || 'all'} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}>{cat || 'Tutti'}</button>
          ))}
        </div>
      </div>

      {(isAdding || editingId) && renderForm()}

      <div className="space-y-3 px-2">
        {filtered.map((ing) => (
          <div key={ing.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">📦</div>
              <div>
                <p className="font-black text-black text-sm tracking-tight">{ing.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[8px] text-gray-400 uppercase font-black bg-gray-100 px-1.5 py-0.5 rounded-md">{ing.category}</span>
                  {ing.supplierId && (
                    <span className="text-[8px] text-blue-400 uppercase font-black bg-blue-50 px-1.5 py-0.5 rounded-md">
                      {suppliers.find(s => s.id === ing.supplierId)?.name || 'Fornitore'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right mr-3">
                <p className="font-black text-black text-sm">€ {ing.pricePerUnit.toFixed(2)}</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase">AL {ing.unit.toUpperCase()}</p>
              </div>
              <button onClick={() => { setEditingId(ing.id); setForm({ ...ing }); setIsCreatingNewCategory(false); }} className="text-gray-300 p-3 bg-gray-50 rounded-2xl active:bg-black active:text-white transition-all"><Edit2 size={16} /></button>
              <button onClick={() => setConfirmDeleteId(ing.id)} className="text-red-200 p-3 bg-red-50/30 rounded-2xl"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomatoView;
