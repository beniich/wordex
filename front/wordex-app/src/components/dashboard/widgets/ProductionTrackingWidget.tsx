"use client";

import { useState, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useParams } from 'next/navigation';
import { dashboard } from '@/lib/api';

interface ProductionData {
  equipe: string;
  lotsProduits: number;
  oee: number;
  target: number;
}

export function ProductionTrackingWidget() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [viewMode, setViewMode] = useState<'lots' | 'oee'>('lots');

  useEffect(() => {
    const loadProductionData = async () => {
      try {
        const data = await dashboard.getProduction(workspaceId);
        setProductionData((data?.production as ProductionData[]) || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadProductionData();
  }, [workspaceId]);

  return (
    <div className="production-tracking-widget widget-card !p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Suivi de Production</h3>
        <div className="flex bg-[var(--surface-high)] p-1 rounded-xl border border-[var(--border)]">
          <button 
            className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${viewMode === 'lots' ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'}`}
            onClick={() => setViewMode('lots')}
          >
            Lots Produits
          </button>
          <button 
            className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${viewMode === 'oee' ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'}`}
            onClick={() => setViewMode('oee')}
          >
            OEE
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={productionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="equipe" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 900 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 900 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ border: '1px solid var(--border)', background: 'var(--surface)', backdropFilter: 'blur(10px)', borderRadius: '16px', boxShadow: 'var(--shadow-card)', fontSize: '10px', color: 'var(--text-primary)' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
            
            <Bar 
              dataKey={viewMode === 'lots' ? 'lotsProduits' : 'oee'} 
              name={viewMode === 'lots' ? 'Lots Produits' : 'OEE (%)'}
              fill="url(#primaryGradient)"
              radius={[10, 10, 0, 0]}
              barSize={40}
            />
            
            {viewMode === 'oee' && (
              <Line 
                type="monotone" 
                dataKey="target" 
                name="Objectif" 
                stroke="var(--accent-secondary)" 
                strokeWidth={4}
                dot={{ fill: 'var(--accent-secondary)', r: 4 }}
                strokeDasharray="5 5"
              />
            )}

            <defs>
               <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-primary-light)" />
               </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

