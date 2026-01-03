
import React, { useMemo } from 'react';
import { TrendingUp, Percent, DollarSign, Star, AlertTriangle, ChevronRight } from 'lucide-react';
import { MenuItem, Ingredient, SubRecipe } from '../../types';
import { calculateMenuItemCost } from '../../services/calculator';

interface DashboardViewProps {
  menu: MenuItem[];
  ingredients: Ingredient[];
  subRecipes: SubRecipe[];
  threshold?: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ menu, ingredients, subRecipes, threshold = 30 }) => {
  const stats = useMemo(() => {
    if (menu.length === 0) return [
      { label: 'Food Cost Medio', value: '0%', icon: Percent, color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Margine Medio', value: '€ 0.00', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
      { label: 'Top Seller', value: 'N/D', icon: Star, color: 'text-orange-500', bg: 'bg-orange-50' },
      { label: 'Trend Mese', value: '0%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    const totalStats = menu.reduce((acc, item) => {
      const cost = calculateMenuItemCost(item, ingredients, subRecipes);
      const margin = item.sellingPrice - cost;
      const fc = item.sellingPrice > 0 ? (cost / item.sellingPrice) * 100 : 0;
      return { cost: acc.cost + fc, margin: acc.margin + margin };
    }, { cost: 0, margin: 0 });

    return [
      { label: 'Food Cost Medio', value: `${(totalStats.cost / menu.length).toFixed(1)}%`, icon: Percent, color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Margine Medio', value: `€ ${(totalStats.margin / menu.length).toFixed(2)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
      { label: 'Top Performance', value: menu[0]?.name || 'N/D', icon: Star, color: 'text-orange-500', bg: 'bg-orange-50' },
      { label: 'Trend Mese', value: '+4.2%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];
  }, [menu, ingredients, subRecipes]);

  const criticalAlerts = useMemo(() => {
    const alerts: { title: string, subtitle: string, value: string }[] = [];
    
    // Check Food Cost Threshold for Menu Items
    menu.forEach(item => {
      const cost = calculateMenuItemCost(item, ingredients, subRecipes);
      const fc = item.sellingPrice > 0 ? (cost / item.sellingPrice) * 100 : 0;
      if (fc > threshold) {
        alerts.push({
          title: 'Food Cost Critico',
          subtitle: item.name,
          value: `${fc.toFixed(1)}%`
        });
      }
    });

    return alerts;
  }, [menu, ingredients, subRecipes, threshold]);

  const topPerformers = menu.map(item => {
    const cost = calculateMenuItemCost(item, ingredients, subRecipes);
    const fcPercentage = item.sellingPrice > 0 ? (cost / item.sellingPrice) * 100 : 0;
    return { ...item, fcPercentage, margin: item.sellingPrice - cost };
  }).sort((a, b) => b.margin - a.margin);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Alerts Center - Focus on Food Cost only */}
      {criticalAlerts.length > 0 && (
        <section className="px-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-black uppercase tracking-widest flex items-center space-x-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span>Avvisi Critici ({criticalAlerts.length})</span>
            </h2>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
            {criticalAlerts.map((alert, idx) => (
              <div key={idx} className="min-w-[260px] bg-white p-5 rounded-[2rem] shadow-sm border border-red-50 space-y-3 relative overflow-hidden group active:scale-95 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <AlertTriangle size={18} />
                  </div>
                  <span className="text-lg font-black text-red-600">{alert.value}</span>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{alert.title}</p>
                  <p className="font-black text-black truncate">{alert.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-50 active:scale-95 transition-all">
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-tight">{stat.label}</p>
            <p className="text-2xl font-black text-black mt-1 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Top Performance List */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-black text-black">Performance</h2>
          <button className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Vedi Tutti</button>
        </div>
        <div className="space-y-3">
          {topPerformers.slice(0, 5).map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm flex items-center justify-between border border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner border border-white">🍕</div>
                <div>
                  <p className="font-black text-black tracking-tight">{item.name}</p>
                  <p className="text-xs text-gray-400 font-bold">Margine: <span className="text-green-600">€ {item.margin.toFixed(2)}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                  item.fcPercentage < threshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.fcPercentage.toFixed(1)}%
                </div>
                <ChevronRight size={16} className="text-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
