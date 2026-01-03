
import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, Plus, X, Edit2, Trash2, PlusCircle, Loader2, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { MenuItem, Ingredient, SubRecipe, ComponentUsage, Unit, Supplier } from '../../types';
import { calculateMenuItemCost, getFoodCostColor } from '../../services/calculator';

interface MenuViewProps {
  menu: MenuItem[];
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
  suppliers: Supplier[];
  onAdd: (item: MenuItem) => void;
  onUpdate: (item: MenuItem) => void;
  onDelete?: (id: string) => void;
  onAddIngredient?: (ingredient: Ingredient) => Promise<string | undefined>;
  onAddSupplier?: (supplier: Supplier) => Promise<string | undefined>;
}

const MenuView: React.FC<MenuViewProps> = ({ menu, ingredients, subRecipes, suppliers, onAdd, onUpdate, onDelete, onAddIngredient, onAddSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MenuItem>>({ components: [] });
  const [newCategory, setNewCategory] = useState('');
  
  // Confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [compToRemove, setCompToRemove] = useState<string | null>(null);

  // Ingredient modal state
  const [showQuickIng, setShowQuickIng] = useState(false);
  const [quickIngLoading, setQuickIngLoading] = useState(false);
  const [quickIng, setQuickIng] = useState<Partial<Ingredient>>({ unit: 'kg', pricePerUnit: 0, category: '', supplierId: '' });
  const [newQuickCategory, setNewQuickCategory] = useState('');

  // Quick Supplier Modal State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supForm, setSupForm] = useState<Partial<Supplier>>({ deliveryDays: [] });
  const [supLoading, setSupLoading] = useState(false);

  const [activeRow, setActiveRow] = useState<{type: 'ingredient'|'subrecipe'|'menuitem', id: string, qty: string}>({
    type: 'ingredient', id: '', qty: ''
  });

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const menuCategories = Array.from(new Set(menu.map(i => i.category)));
  const ingCategories = Array.from(new Set(ingredients.map(i => i.category)));
  const allCategories = [null, ...menuCategories];
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Calcolo costo "Live" per il form
  const liveCost = useMemo(() => {
    const tempItem = { ...form, components: form.components || [] } as MenuItem;
    return calculateMenuItemCost(tempItem, ingredients, subRecipes, menu);
  }, [form, ingredients, subRecipes, menu]);

  const liveFC = useMemo(() => {
    if (!form.sellingPrice || form.sellingPrice <= 0) return 0;
    return (liveCost / form.sellingPrice) * 100;
  }, [liveCost, form.sellingPrice]);

  const filtered = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
    setConfirmDeleteId(null);
  };

  const confirmRemoveComp = (id: string) => {
    setForm(prev => ({ ...prev, components: prev.components?.filter(c => c.id !== id) }));
    setCompToRemove(null);
  };

  const handleQuickIngSave = async () => {
    const finalCat = quickIng.category === 'NEW' ? newQuickCategory : quickIng.category;
    if (!quickIng.name || !finalCat || !onAddIngredient) return;
    setQuickIngLoading(true);
    try {
      const newIng = { name: quickIng.name, unit: (quickIng.unit as Unit) || 'kg', pricePerUnit: quickIng.pricePerUnit || 0, category: finalCat, supplierId: quickIng.supplierId || '' } as Ingredient;
      const realId = await onAddIngredient(newIng);
      if (realId) {
        setForm(prev => ({ ...prev, components: [...(prev.components || []), { id: realId, type: 'ingredient', quantity: 0 }] }));
        setShowQuickIng(false);
        setQuickIng({ unit: 'kg', pricePerUnit: 0, category: '', supplierId: '' });
      }
    } finally {
      setQuickIngLoading(false);
    }
  };

  const handleQuickSupplierSave = async () => {
    if (!supForm.name || !onAddSupplier) return;
    setSupLoading(true);
    try {
      const realId = await onAddSupplier(supForm as Supplier);
      if (realId) {
        setQuickIng(prev => ({ ...prev, supplierId: realId }));
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
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto scrollbar-hide">
        <h4 className="text-xl font-black text-center">Nuovo Fornitore</h4>
        <div className="space-y-4">
          <input placeholder="Ragione Sociale" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supForm.name || ''} onChange={e => setSupForm({...supForm, name: e.target.value})} />
          <input placeholder="Merceologia" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={supForm.category || ''} onChange={e => setSupForm({...supForm, category: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
             <input placeholder="Tel" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xs font-bold border-none" value={supForm.phone || ''} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
             <input placeholder="Email" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xs font-bold border-none" value={supForm.email || ''} onChange={e => setSupForm({...supForm, email: e.target.value})} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {daysOfWeek.map(day => (
              <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-2 rounded-xl text-[9px] font-black border transition-all ${supForm.deliveryDays?.includes(day) ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent'}`}>{day}</button>
            ))}
          </div>
        </div>
        <div className="flex space-x-3">
           <button onClick={handleQuickSupplierSave} disabled={supLoading || !supForm.name} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm">{supLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Salva'}</button>
           <button onClick={() => setShowSupplierModal(false)} className="px-6 bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold text-sm">Esci</button>
        </div>
      </div>
    </div>
  );

  const renderForm = (isEdit: boolean) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 animate-in slide-in-from-bottom-8 duration-500 mb-8 max-h-[92vh] overflow-y-auto scrollbar-hide relative">
      {showSupplierModal && renderSupplierModal()}
      
      {/* Modal rimozione ingrediente singolo dalla ricetta */}
      {compToRemove && (
        <div className="fixed inset-0 z-[160] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[280px] rounded-[2rem] p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <p className="text-sm font-bold text-black leading-tight">Rimuovere questo elemento dalla ricetta?</p>
            <div className="flex flex-col space-y-2">
              <button onClick={() => confirmRemoveComp(compToRemove)} className="w-full py-3 bg-red-50 text-red-600 font-black rounded-xl text-xs uppercase tracking-wider">Sì, Rimuovi</button>
              <button onClick={() => setCompToRemove(null)} className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-wider">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {showQuickIng && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-gray-100">
            <h4 className="font-black text-xl text-center">Nuova Materia Prima</h4>
            <div className="space-y-4">
              <input placeholder="Nome" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.name || ''} onChange={e => setQuickIng({...quickIng, name: e.target.value})} />
              <select className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.category || ''} onChange={e => setQuickIng({...quickIng, category: e.target.value})}>
                <option value="">Categoria...</option>
                {ingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="NEW">+ Nuova...</option>
              </select>
              {quickIng.category === 'NEW' && <input placeholder="Nome categoria" className="w-full bg-blue-50/50 rounded-2xl px-5 py-3 text-xs font-bold border-none" value={newQuickCategory} onChange={e => setNewQuickCategory(e.target.value)} />}
              
              <div className="flex space-x-2">
                <select className="flex-1 bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.supplierId || ''} onChange={e => setQuickIng({...quickIng, supplierId: e.target.value})}>
                  <option value="">Fornitore...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={() => setShowSupplierModal(true)} className="bg-white border border-gray-100 p-4 rounded-2xl text-blue-500 shadow-sm"><PlusCircle size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="decimal" placeholder="Prezzo (€)" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" onChange={e => setQuickIng({...quickIng, pricePerUnit: parseFloat(e.target.value.replace(',', '.'))})} />
                <select className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.unit} onChange={e => setQuickIng({...quickIng, unit: e.target.value as Unit})}>
                  <option value="kg">AL KG</option><option value="l">AL LITRO</option><option value="unit">A UNITÀ</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button onClick={handleQuickIngSave} disabled={quickIngLoading || !quickIng.name} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2">
                {quickIngLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Salva</span>}
              </button>
              <button onClick={() => setShowQuickIng(false)} className="px-6 bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold text-sm">Esci</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-black text-2xl tracking-tight text-black">{isEdit ? 'Modifica Pizza' : 'Nuova Ricetta'}</h3>
        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-gray-100 p-2 rounded-full text-gray-400"><X size={20}/></button>
      </div>

      <div className="space-y-6">
        <input type="text" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-black placeholder:text-gray-300" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome Pizza" />

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista Ingredienti / Basi</label>
          <div className="space-y-2">
            {form.components?.map(comp => {
              const item = comp.type === 'ingredient' ? ingredients.find(i => i.id === comp.id) : comp.type === 'subrecipe' ? subRecipes.find(s => s.id === comp.id) : menu.find(m => m.id === comp.id);
              // MODIFICA: Sia ingredienti che semilavorati (LAB) vengono ora mostrati in grammi (g)
              const unit = comp.type === 'ingredient' ? 'g' : comp.type === 'subrecipe' ? 'g' : 'pz';
              return (
                <div key={comp.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <div className="w-12 text-[9px] font-black text-white uppercase text-center bg-black py-2 rounded-xl shrink-0">
                    {comp.type === 'ingredient' ? 'ING' : comp.type === 'subrecipe' ? 'LAB' : 'MEN'}
                  </div>
                  <div className="flex-1 font-bold text-xs truncate px-2 text-black">{item?.name || 'Sync...'}</div>
                  <div className="flex items-center bg-white rounded-xl border border-gray-100 px-3 py-1.5 shrink-0 shadow-sm">
                    <input type="text" inputMode="decimal" className="w-12 border-none bg-transparent text-xs font-black text-center p-0" value={inputValues[comp.id] || comp.quantity.toString()} onChange={e => {
                      const val = e.target.value.replace(',', '.');
                      setInputValues(prev => ({ ...prev, [comp.id]: e.target.value }));
                      if (!isNaN(parseFloat(val))) setForm(prev => ({ ...prev, components: prev.components?.map(c => c.id === comp.id ? { ...c, quantity: parseFloat(val) } : c) }));
                    }} />
                    <span className="text-[9px] text-gray-400 font-bold ml-1 uppercase">{unit}</span>
                  </div>
                  <button onClick={() => setCompToRemove(comp.id)} className="text-gray-300 p-2"><Trash2 size={16}/></button>
                </div>
              );
            })}

            <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border-2 border-dashed border-gray-100 mt-4">
              <select className="w-16 bg-gray-100 border-none rounded-xl py-2 px-1 text-[9px] font-black text-black appearance-none text-center" value={activeRow.type} onChange={e => setActiveRow({...activeRow, type: e.target.value as any, id: ''})}>
                <option value="ingredient">ING</option><option value="subrecipe">LAB</option><option value="menuitem">MEN</option>
              </select>
              <div className="flex-1 min-w-0 flex items-center space-x-1">
                <select className="flex-1 bg-gray-50 border-none rounded-xl py-2 px-3 text-[11px] font-bold text-gray-700 appearance-none truncate" value={activeRow.id} onChange={e => setActiveRow({...activeRow, id: e.target.value})}>
                  <option value="">Seleziona...</option>
                  {activeRow.type === 'ingredient' && ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  {activeRow.type === 'subrecipe' && subRecipes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {activeRow.type === 'menuitem' && menu.filter(m => m.id !== editingId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {activeRow.type === 'ingredient' && <button onClick={() => setShowQuickIng(true)} className="p-2 text-blue-500"><PlusCircle size={18} /></button>}
              </div>
              <div className="w-24 flex items-center bg-gray-50 rounded-xl px-2 py-1.5 shrink-0">
                <input placeholder="Quantità" inputMode="decimal" className="w-full border-none bg-transparent text-[11px] font-black text-center p-0" value={activeRow.qty} onChange={e => setActiveRow({...activeRow, qty: e.target.value})} />
                {/* MODIFICA: Anche qui mostriamo 'G' per il semilavorato (subrecipe) */}
                <span className="text-[8px] text-gray-400 font-bold ml-1 uppercase">{activeRow.type === 'ingredient' ? 'G' : activeRow.type === 'subrecipe' ? 'G' : 'PZ'}</span>
              </div>
              <button onClick={() => {
                if (!activeRow.id || !activeRow.qty) return;
                const qtyNum = parseFloat(activeRow.qty.replace(',', '.'));
                if (isNaN(qtyNum)) return;
                setForm(prev => ({ ...prev, components: [...(prev.components || []), { id: activeRow.id, type: activeRow.type, quantity: qtyNum }] }));
                setActiveRow({ type: 'ingredient', id: '', qty: '' });
              }} disabled={!activeRow.id || !activeRow.qty} className="bg-black text-white p-2 rounded-xl disabled:opacity-20 shrink-0"><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Categoria</label>
            <select className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-xs font-bold" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="">Seleziona...</option>
              {menuCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="NEW">+ Nuova...</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Prezzo Vendita (€)</label>
            <input type="text" inputMode="decimal" className="w-full bg-black text-white border-none rounded-2xl px-4 py-3 text-lg font-black text-center" value={inputValues['sellingPrice'] || (form.sellingPrice?.toString() || '')} onChange={e => {
              setInputValues(prev => ({...prev, sellingPrice: e.target.value}));
              const val = parseFloat(e.target.value.replace(',', '.'));
              if(!isNaN(val)) setForm({...form, sellingPrice: val});
            }} placeholder="0.00" />
            
            {/* Live Stats Display */}
            <div className="mt-2 flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Costo Ricetta</span>
                <span className="text-xs font-black text-black">€ {liveCost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Food Cost</span>
                <span className={`text-xs font-black ${liveFC > 25 ? 'text-red-500' : 'text-green-500'}`}>
                  {liveFC.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => {
        const finalCategory = newCategory || form.category || 'Pizze';
        const payload = { ...form, category: finalCategory, components: form.components || [] } as MenuItem;
        if (editingId) onUpdate(payload); else onAdd({ ...payload, id: Math.random().toString(36).substr(2, 9) });
        setIsAdding(false); setEditingId(null); setForm({ components: [] });
      }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-base shadow-2xl active:scale-95 transition-all">
        {isEdit ? 'Aggiorna Pizza' : 'Crea Pizza'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* iOS Confirmation Action Sheet - ELIMINAZIONE PIZZA */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-10 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm space-y-3 animate-in slide-in-from-bottom-10">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 text-center border-b border-gray-100">
                <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
                <h4 className="text-sm font-black text-black uppercase tracking-tight">Conferma Eliminazione</h4>
                <p className="text-[11px] text-gray-500 mt-1">Sei sicuro di voler eliminare questa pizza? L'operazione è irreversibile.</p>
              </div>
              <button onClick={() => handleDelete(confirmDeleteId)} className="w-full py-4 text-red-600 font-black text-base active:bg-red-50 transition-colors">Elimina Pizza</button>
            </div>
            <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-white py-4 rounded-2xl font-black text-base text-black shadow-xl">Annulla</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative px-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cerca nel menù..." className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ components: [] }); setInputValues({}); }} className="absolute right-5 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-xl shadow-sm"><Plus size={16} /></button>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide px-3">
          {allCategories.map((cat) => (
            <button key={cat || 'all'} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}>{cat || 'Tutte'}</button>
          ))}
        </div>
      </div>

      {(isAdding || editingId) && renderForm(!!editingId)}

      <div className="space-y-4 px-2">
        {filtered.map((item) => {
          const cost = calculateMenuItemCost(item, ingredients, subRecipes, menu);
          const fc = item.sellingPrice > 0 ? (cost / item.sellingPrice) * 100 : 0;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-black tracking-tight">{item.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${getFoodCostColor(fc)}`}>{fc.toFixed(1)}% FC</span>
                </div>
                <div className="flex mt-4 space-x-8">
                  <div><p className="text-[9px] uppercase text-gray-300 font-black tracking-widest">Prezzo</p><p className="text-lg font-black text-black">€ {item.sellingPrice.toFixed(2)}</p></div>
                  <div><p className="text-[9px] uppercase text-gray-300 font-black tracking-widest">Margine</p><p className="text-lg font-black text-green-600">€ {(item.sellingPrice - cost).toFixed(2)}</p></div>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <button onClick={() => { setEditingId(item.id); setForm({ ...item }); setInputValues({sellingPrice: item.sellingPrice.toString()}); item.components.forEach(c => setInputValues(p => ({...p, [c.id]: c.quantity.toString()}))); }} className="bg-gray-50 p-3 rounded-2xl text-gray-400 border border-gray-100"><Edit2 size={18} /></button>
                <button onClick={() => setConfirmDeleteId(item.id)} className="bg-red-50 p-3 rounded-2xl text-red-300 border border-red-50"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuView;
