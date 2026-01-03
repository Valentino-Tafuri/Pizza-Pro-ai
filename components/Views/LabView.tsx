
import React, { useState, useMemo } from 'react';
import { Scale, Search, Plus, Edit2, Trash2, X, Loader2, PlusCircle, AlertTriangle, Wand2, Check, ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { SubRecipe, Ingredient, ComponentUsage, Unit, Supplier } from '../../types';
import { calculateSubRecipeCostPerKg } from '../../services/calculator';
import { GoogleGenAI, Type } from "@google/genai";

interface LabViewProps {
  subRecipes: SubRecipe[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  onAdd: (sub: SubRecipe) => void;
  onUpdate: (sub: SubRecipe) => void;
  onDelete?: (id: string) => void;
  onAddIngredient: (ing: Ingredient) => Promise<string | undefined>;
  onAddSupplier?: (sup: Supplier) => Promise<string | undefined>;
}

const LabView: React.FC<LabViewProps> = ({ subRecipes, ingredients, suppliers, onAdd, onUpdate, onDelete, onAddIngredient, onAddSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<SubRecipe>>({ components: [] });
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipePrompt, setAiRecipePrompt] = useState('');
  const [showAIInput, setShowAIInput] = useState(false);
  const [missingIngredients, setMissingIngredients] = useState<any[]>([]);
  const [currentMissingIdx, setCurrentMissingIdx] = useState<number>(-1);

  // Confirmation/Deletion States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [compToRemove, setCompToRemove] = useState<string | null>(null);

  // Quick Modals
  const [showQuickIng, setShowQuickIng] = useState(false);
  const [quickIngLoading, setQuickIngLoading] = useState(false);
  const [quickIng, setQuickIng] = useState<Partial<Ingredient>>({ unit: 'kg', pricePerUnit: 0, category: '', supplierId: '' });

  const [activeRow, setActiveRow] = useState<{type: 'ingredient'|'subrecipe', id: string, qty: string}>({
    type: 'ingredient', id: '', qty: ''
  });

  const handleDelete = (id: string) => {
    if (onDelete) onDelete(id);
    setConfirmDeleteId(null);
  };

  const confirmRemoveComp = (id: string) => {
    setForm(prev => ({ ...prev, components: prev.components?.filter(c => c.id !== id) }));
    setCompToRemove(null);
  };

  const filtered = subRecipes.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const ingCategories = Array.from(new Set(ingredients.map(i => i.category)));

  const handleAICreate = async () => {
    if (!aiRecipePrompt) return;
    setAiLoading(true);
    try {
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crea una ricetta professionale per semilavorato di pizzeria: "${aiRecipePrompt}". 
        Usa solo grammi per gli ingredienti. Restituisci JSON.
        Ingredienti disponibili (usa questi ID se corrispondono): ${JSON.stringify(ingredients.map(i => ({id: i.id, name: i.name})))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              yieldWeight: { type: Type.NUMBER, description: "Peso finale stimato in kg" },
              components: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER, description: "Grammi" },
                    matchedId: { type: Type.STRING, description: "ID se trovato nell'elenco fornito, altrimenti vuoto" }
                  }
                }
              },
              procedure: { type: Type.STRING }
            },
            required: ["name", "components", "yieldWeight"]
          }
        }
      });

      const data = JSON.parse(response.text);
      const newComponents: ComponentUsage[] = [];
      const missing: any[] = [];

      data.components.forEach((c: any) => {
        if (c.matchedId) {
          newComponents.push({ id: c.matchedId, type: 'ingredient', quantity: c.quantity });
        } else {
          missing.push(c);
        }
      });

      setForm({
        name: data.name,
        yieldWeight: data.yieldWeight,
        components: newComponents,
        procedure: data.procedure
      });

      if (missing.length > 0) {
        setMissingIngredients(missing);
        setCurrentMissingIdx(0);
      } else {
        setShowAIInput(false);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleResolveMissing = async (action: 'create' | 'skip') => {
    const current = missingIngredients[currentMissingIdx];
    
    if (action === 'create') {
      setShowQuickIng(true);
      setQuickIng({ name: current.name, category: 'Nuovi', unit: 'kg', pricePerUnit: 0 });
    } else {
      moveToNextMissing();
    }
  };

  const moveToNextMissing = () => {
    if (currentMissingIdx < missingIngredients.length - 1) {
      setCurrentMissingIdx(prev => prev + 1);
    } else {
      setMissingIngredients([]);
      setCurrentMissingIdx(-1);
      setShowAIInput(false);
    }
  };

  const handleQuickIngSave = async () => {
    if (!quickIng.name || !onAddIngredient) return;
    setQuickIngLoading(true);
    try {
      const newIng = { ...quickIng, category: quickIng.category || 'Generale' } as Ingredient;
      const realId = await onAddIngredient(newIng);
      if (realId) {
        const qtyFromAI = missingIngredients[currentMissingIdx]?.quantity || 0;
        setForm(prev => ({ 
          ...prev, 
          components: [...(prev.components || []), { id: realId, type: 'ingredient', quantity: qtyFromAI }] 
        }));
        setShowQuickIng(false);
        moveToNextMissing();
      }
    } finally {
      setQuickIngLoading(false);
    }
  };

  const renderForm = (isEdit: boolean) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-6 animate-in slide-in-from-bottom-8 duration-500 mb-8 max-h-[90vh] overflow-y-auto scrollbar-hide relative">
      
      {/* AI Suggestion Dialogue */}
      {missingIngredients.length > 0 && currentMissingIdx !== -1 && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto">
              <Wand2 size={32} />
            </div>
            <div>
              <h4 className="font-black text-xl">Ingrediente Mancante</h4>
              <p className="text-sm text-gray-500 mt-2">
                L'AI suggerisce <span className="font-black text-black">"{missingIngredients[currentMissingIdx].name}"</span>, ma non è nel tuo economato.
              </p>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleResolveMissing('create')} className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2">
                <Plus size={18} /> <span>Crea nuovo ingrediente</span>
              </button>
              <button onClick={() => handleResolveMissing('skip')} className="w-full bg-gray-50 text-gray-400 py-4 rounded-2xl font-bold text-sm">
                Modifica ricetta (Rimuovi)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Ingredient Form */}
      {showQuickIng && (
        <div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h4 className="font-black text-xl text-center">Configura Ingrediente</h4>
            <div className="space-y-4 text-left">
              <input placeholder="Nome" className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.name || ''} onChange={e => setQuickIng({...quickIng, name: e.target.value})} />
              <select className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.category || ''} onChange={e => setQuickIng({...quickIng, category: e.target.value})}>
                <option value="">Categoria...</option>
                {ingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Nuovi">+ Nuova...</option>
              </select>
              <select className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.supplierId || ''} onChange={e => setQuickIng({...quickIng, supplierId: e.target.value})}>
                <option value="">Fornitore...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="decimal" placeholder="Prezzo (€)" className="w-full bg-black text-white rounded-2xl px-5 py-4 text-sm font-black text-center" onChange={e => setQuickIng({...quickIng, pricePerUnit: parseFloat(e.target.value.replace(',', '.'))})} />
                <select className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-bold border-none" value={quickIng.unit} onChange={e => setQuickIng({...quickIng, unit: e.target.value as Unit})}>
                  <option value="kg">AL KG</option><option value="l">AL LITRO</option>
                </select>
              </div>
            </div>
            <button onClick={handleQuickIngSave} disabled={quickIngLoading} className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center">
              {quickIngLoading ? <Loader2 size={18} className="animate-spin" /> : 'Conferma e Aggiungi'}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h3 className="font-black text-2xl tracking-tight text-black">{isEdit ? 'Modifica Lab' : 'Nuovo Lab'}</h3>
          
          {/* Pulsante + per resettare/creare nuovo */}
          <button 
            onClick={() => { setForm({ components: [] }); setInputValues({}); setEditingId(null); setIsAdding(true); }}
            className="p-1.5 bg-gray-100 text-black rounded-lg active:scale-90 transition-all shadow-sm border border-gray-200"
            title="Svuota e Inizia Nuova Ricetta"
          >
            <Plus size={18} />
          </button>

          {!isEdit && (
            <button onClick={() => setShowAIInput(true)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full flex items-center space-x-1 active:scale-90 transition-all">
              < Wand2 size={14} /><span className="text-[10px] font-black uppercase">Crea con AI</span>
            </button>
          )}
        </div>
        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-gray-100 p-2 rounded-full text-gray-400"><X size={20}/></button>
      </div>

      {showAIInput && !isEdit && (
        <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex space-x-2 animate-in slide-in-from-top-2">
          <input 
            placeholder="Es: Impasto napoletano 72h..." 
            className="flex-1 bg-transparent border-none text-sm font-bold text-blue-900 placeholder:text-blue-300 focus:ring-0" 
            value={aiRecipePrompt}
            onChange={e => setAiRecipePrompt(e.target.value)}
          />
          <button 
            onClick={handleAICreate}
            disabled={aiLoading || !aiRecipePrompt}
            className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-30 shadow-lg shadow-blue-200"
          >
            {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          </button>
        </div>
      )}

      <div className="space-y-5">
        <input type="text" className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome Semilavorato" />
        
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Componenti Ricetta</label>
          <div className="space-y-2">
            {form.components?.map((comp) => {
              const item = comp.type === 'ingredient' ? ingredients.find(i => i.id === comp.id) : subRecipes.find(s => s.id === comp.id);
              // MODIFICA: Sia ING che LAB ora usano i grammi (g) come unità di visualizzazione
              const unitLabel = (comp.type === 'ingredient' || comp.type === 'subrecipe') ? 'g' : 'unit';
              return (
                <div key={comp.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <div className="w-12 text-[9px] font-black text-white uppercase text-center bg-black py-2 rounded-xl shrink-0">
                    {comp.type === 'ingredient' ? 'ING' : 'LAB'}
                  </div>
                  <div className="flex-1 font-bold text-xs truncate px-2 text-black">{item?.name || 'Sync...'}</div>
                  <div className="flex items-center bg-white rounded-xl border border-gray-100 px-3 py-1.5 shrink-0 shadow-sm">
                    <input type="text" inputMode="decimal" className="w-12 border-none bg-transparent text-xs font-black text-center p-0" value={inputValues[comp.id] || comp.quantity.toString()} onChange={e => {
                      const val = e.target.value.replace(',', '.');
                      setInputValues(prev => ({ ...prev, [comp.id]: e.target.value }));
                      if (!isNaN(parseFloat(val))) setForm(prev => ({ ...prev, components: prev.components?.map(c => c.id === comp.id ? { ...c, quantity: parseFloat(val) } : c) }));
                    }} />
                    <span className="text-[9px] text-gray-400 font-bold ml-1 uppercase">{unitLabel}</span>
                  </div>
                  <button onClick={() => setCompToRemove(comp.id)} className="text-gray-300 p-2"><Trash2 size={16}/></button>
                </div>
              );
            })}

            {/* Insertion Row stile Menu */}
            <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border-2 border-dashed border-gray-100 mt-4">
              <select className="w-16 bg-gray-100 border-none rounded-xl py-2 px-1 text-[9px] font-black text-black appearance-none text-center" value={activeRow.type} onChange={e => setActiveRow({...activeRow, type: e.target.value as any, id: ''})}>
                <option value="ingredient">ING</option><option value="subrecipe">LAB</option>
              </select>
              <div className="flex-1 min-w-0 flex items-center space-x-1">
                <select className="flex-1 bg-gray-50 border-none rounded-xl py-2 px-3 text-[11px] font-bold text-gray-700 appearance-none truncate" value={activeRow.id} onChange={e => setActiveRow({...activeRow, id: e.target.value})}>
                  <option value="">Seleziona...</option>
                  {activeRow.type === 'ingredient' && ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  {activeRow.type === 'subrecipe' && subRecipes.filter(s => s.id !== editingId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="w-24 flex items-center bg-gray-50 rounded-xl px-2 py-1.5 shrink-0">
                <input placeholder="Quantità" inputMode="decimal" className="w-full border-none bg-transparent text-[11px] font-black text-center p-0" value={activeRow.qty} onChange={e => setActiveRow({...activeRow, qty: e.target.value})} />
                {/* MODIFICA: Anche qui 'G' per il semilavorato */}
                <span className="text-[8px] text-gray-400 font-bold ml-1 uppercase">G</span>
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

        <div className="grid grid-cols-2 gap-4 bg-black text-white p-5 rounded-3xl">
          {/* MODIFICA: Calcolo initialWeight ora divide per 1000 sia per ING che per LAB poichè entrambi in grammi */}
          <div><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Iniziale (kg)</label><p className="text-lg font-black">{(form.components?.reduce((s, c) => s + ((c.quantity || 0)/1000), 0) || 0).toFixed(3)} kg</p></div>
          <div><label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Resa Finale (kg)</label><input type="text" inputMode="decimal" className="w-full bg-white/10 border-none rounded-xl px-2 py-1 text-lg font-black text-white" value={inputValues['yield'] || (form.yieldWeight?.toString() || '')} onChange={e => { setInputValues(p => ({...p, yield: e.target.value})); const val = parseFloat(e.target.value.replace(',', '.')); if(!isNaN(val)) setForm({...form, yieldWeight: val}); }} /></div>
        </div>

        {/* editable procedure section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-400">
            <BookOpen size={14} />
            <label className="text-[10px] font-black uppercase tracking-widest">Procedimento Ricetta</label>
          </div>
          <textarea 
            rows={5} 
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-black/5 scrollbar-hide" 
            placeholder="Descrivi i passaggi della preparazione..."
            value={form.procedure || ''}
            onChange={e => setForm({...form, procedure: e.target.value})}
          />
        </div>
      </div>

      <button onClick={() => {
        // MODIFICA: Calcolo initialWeight anche nel payload finale trattando LAB in grammi
        const initialWeight = form.components?.reduce((s, c) => s + ((c.quantity || 0)/1000), 0) || 0;
        const payload = { ...form, initialWeight, yieldWeight: form.yieldWeight || initialWeight, components: form.components || [] } as SubRecipe;
        if (editingId) onUpdate(payload); else onAdd({ ...payload, id: Math.random().toString(36).substr(2, 9) });
        setIsAdding(false); setEditingId(null); setForm({ components: [] }); setInputValues({});
      }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-base shadow-2xl active:scale-95 transition-all">
        {isEdit ? 'Aggiorna Semilavorato' : 'Salva Semilavorato'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Component Removal Confirmation */}
      {compToRemove && (
        <div className="fixed inset-0 z-[160] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[280px] rounded-[2rem] p-6 shadow-2xl text-center space-y-4">
            <p className="text-sm font-bold text-black leading-tight">Rimuovere dalla ricetta?</p>
            <div className="flex flex-col space-y-2">
              <button onClick={() => confirmRemoveComp(compToRemove)} className="w-full py-3 bg-red-50 text-red-600 font-black rounded-xl text-xs uppercase">Sì, Rimuovi</button>
              <button onClick={() => setCompToRemove(null)} className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-xl text-xs uppercase">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Deletion Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-10 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm space-y-3 animate-in slide-in-from-bottom-10">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 text-center border-b border-gray-100">
                <AlertTriangle className="mx-auto text-red-500 mb-2" size={24} />
                <h4 className="text-sm font-black text-black uppercase">Elimina Semilavorato</h4>
                <p className="text-[11px] text-gray-500 mt-1">Questa azione non può essere annullata. Confermi?</p>
              </div>
              <button onClick={() => handleDelete(confirmDeleteId)} className="w-full py-4 text-red-600 font-black text-base active:bg-red-50">Elimina Definitivamente</button>
            </div>
            <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-white py-4 rounded-2xl font-black text-base shadow-xl text-black">Annulla</button>
          </div>
        </div>
      )}

      <div className="relative px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Cerca ricetta..." className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ components: [] }); setInputValues({}); }} className="absolute right-5 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-xl shadow-sm"><Plus size={16} /></button>
      </div>

      {(isAdding || editingId) && renderForm(!!editingId)}

      <div className="space-y-4 px-2">
        {filtered.map((sub) => {
          const costPerKg = calculateSubRecipeCostPerKg(sub, ingredients, subRecipes);
          return (
            <div key={sub.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all">
              <div className="flex-1">
                <h3 className="text-xl font-black text-black tracking-tight">{sub.name}</h3>
                <div className="flex mt-4 space-x-8">
                  <div><p className="text-[9px] uppercase text-gray-300 font-black tracking-widest">Costo al KG</p><p className="text-lg font-black text-black">€ {costPerKg.toFixed(2)}</p></div>
                  <div><p className="text-[9px] uppercase text-gray-300 font-black tracking-widest">Resa</p><p className="text-lg font-black text-gray-400">{sub.yieldWeight.toFixed(3)}kg</p></div>
                </div>
                {sub.procedure && (
                   <div className="mt-4 flex items-center space-x-2 text-blue-500 bg-blue-50 w-max px-2 py-1 rounded-lg">
                     <BookOpen size={10} />
                     <span className="text-[8px] font-black uppercase">Procedimento salvato</span>
                   </div>
                )}
              </div>
              <div className="flex flex-col space-y-3">
                <button onClick={() => { 
                  setEditingId(sub.id); 
                  setForm({ ...sub }); 
                  const inputs: Record<string, string> = { yield: sub.yieldWeight.toString() };
                  sub.components.forEach(c => inputs[c.id] = c.quantity.toString());
                  setInputValues(inputs);
                }} className="bg-gray-50 p-3 rounded-2xl text-gray-400 border border-gray-100 active:bg-black active:text-white transition-all"><Edit2 size={18} /></button>
                <button onClick={() => setConfirmDeleteId(sub.id)} className="bg-red-50 p-3 rounded-2xl text-red-300 border border-red-50"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabView;
