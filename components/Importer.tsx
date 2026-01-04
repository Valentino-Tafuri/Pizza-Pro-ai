import React, { useState } from 'react';
import Papa from 'papaparse';
import { Ingredient, SubRecipe, MenuItem } from '../types';

interface ImporterProps {
  userId?: string;
  onAddIngredient: (ing: Ingredient) => Promise<string | undefined>;
  onAddSubRecipe: (sr: SubRecipe) => Promise<string | undefined>;
  onAddMenuItem: (m: MenuItem) => Promise<string | undefined>;
  onClose?: () => void;
}

type RawRow = Record<string, string | number | undefined>;

const guessField = (k: string) => {
  const key = k.toLowerCase().trim();
  if (key.includes('name')) return 'name';
  if (key.includes('price')) return 'pricePerUnit';
  if (key.includes('unit')) return 'unit';
  if (key.includes('category')) return 'category';
  if (key.includes('supplier')) return 'supplierId';
  if (key.includes('yield')) return 'yieldWeight';
  if (key.includes('components')) return 'components';
  return k;
};

const Importer: React.FC<ImporterProps> = ({ onAddIngredient, onAddSubRecipe, onAddMenuItem, onClose }) => {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState<'ingredients' | 'subRecipes' | 'menu'>('ingredients');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const onFile = (file: File) => {
    setErrors([]);
    if (!file) return;
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (Array.isArray(data)) {
            setRows(data.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [guessField(k), v])) as RawRow));
          } else if (data[collection]) {
            setRows((data[collection] as any[]).map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [guessField(k), v])) as RawRow));
          } else {
            setErrors(["JSON non contiene un array valido o la chiave corretta per la collection scelta"]);
          }
        } catch (err:any) {
          setErrors([err.message || 'JSON non valido']);
        }
      };
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data as RawRow[];
          const normalized = parsed.map(r => {
            const out: RawRow = {};
            for (const k in r) out[guessField(k)] = (r as any)[k];
            return out;
          });
          setRows(normalized);
        },
        error: (err) => setErrors([err.message])
      });
    }
  };

  const validateRow = (r: RawRow) => {
    if (!r.name) return 'Manca il campo name';
    return null;
  };

  const handleSave = async () => {
    if (rows.length === 0) return;
    setLoading(true);
    setProgress({ done: 0, total: rows.length });
    const chunkSize = 200;
    try {
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (r) => {
          const err = validateRow(r);
          if (err) {
            setErrors(prev => [...prev, `Riga ${i + 1}: ${err}`]);
            setProgress(p => ({ ...p, done: p.done + 1 }));
            return;
          }
          if (collection === 'ingredients') {
            const payload: Ingredient = {
              id: (r as any).id || undefined,
              name: String(r.name),
              unit: (r.unit as any) || 'kg',
              pricePerUnit: Number((r.pricePerUnit as any) || 0),
              category: (r.category as any) || 'Generale',
              supplierId: (r.supplierId as any) || ''
            };
            await onAddIngredient(payload);
          } else if (collection === 'subRecipes') {
            const payload: SubRecipe = {
              id: (r as any).id || undefined,
              name: String(r.name),
              yieldWeight: Number((r.yieldWeight as any) || 1),
              components: []
            };
            await onAddSubRecipe(payload);
          } else {
            const payload: MenuItem = {
              id: (r as any).id || undefined,
              name: String(r.name),
              price: Number((r.price as any) || 0),
            };
            await onAddMenuItem(payload);
          }
          setProgress(p => ({ ...p, done: p.done + 1 }));
        }));
      }
      alert('Import completato');
      setRows([]);
      onClose?.();
    } catch (err: any) {
      setErrors([err.message || 'Errore durante l\'import']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-xl">Importa Dati (CSV / JSON)</h3>
          <div className="flex items-center space-x-2">
            <select value={collection} onChange={(e) => setCollection(e.target.value as any)} className="rounded-xl p-2 border">
              <option value="ingredients">Ingredienti</option>
              <option value="subRecipes">Preparazioni</option>
              <option value="menu">Menu</option>
            </select>
            <button onClick={() => onClose?.()} className="text-sm text-gray-400">Chiudi</button>
          </div>
        </div>

        <div className="space-y-3">
          <input type="file" accept=".csv,.json" onChange={e => e.target.files && onFile(e.target.files[0])} />
          <a className="text-xs text-blue-600" href="/templates/ingredients-template.csv" download>Scarica template CSV (Ingredienti)</a>
        </div>

        {errors.length > 0 && <div className="bg-red-50 text-red-600 p-3 rounded"><strong>Errori:</strong><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}

        <div className="max-h-56 overflow-auto border rounded p-2">
          {rows.length === 0 ? <div className="text-sm text-gray-400">Nessuna riga caricata</div> : (
            <table className="w-full text-sm"><thead><tr>{Object.keys(rows[0]).map(k => <th key={k} className="text-left pr-3">{k}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} className="pr-3">{String(v ?? '')}</td>)}</tr>)}</tbody></table>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">{progress.done}/{progress.total || rows.length} importate</div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setRows([]); setErrors([]); }} className="px-4 py-2 rounded-xl border">Reset</button>
            <button onClick={handleSave} disabled={loading || rows.length === 0} className="px-4 py-2 rounded-xl bg-black text-white">{loading ? 'Import in corso...' : 'Importa'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Importer;
