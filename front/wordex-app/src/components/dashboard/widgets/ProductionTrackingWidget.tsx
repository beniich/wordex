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
        setProductionData(data?.production || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadProductionData();
  }, [workspaceId]);

  return (
    <div className="production-tracking-widget bg-[#F5F1E6]/40 backdrop-blur-md rounded-2xl p-6 border border-[#A67B5B]/30 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Suivi de Production</h3>
        <div className="flex bg-white/40 p-1 rounded-xl border border-[#A67B5B]/10">
          <button 
            className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${viewMode === 'lots' ? 'bg-[#A67B5B] text-white shadow-lg' : 'text-outline hover:bg-white/50'}`}
            onClick={() => setViewMode('lots')}
          >
            Lots Produits
          </button>
          <button 
            className={`px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${viewMode === 'oee' ? 'bg-[#A67B5B] text-white shadow-lg' : 'text-outline hover:bg-white/50'}`}
            onClick={() => setViewMode('oee')}
          >
            OEE
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={productionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8C3B4" vertical={false} />
            <XAxis dataKey="equipe" tick={{ fontSize: 10, fill: '#857467', fontWeight: 900 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#857467', fontWeight: 900 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', color: '#1c1c1a' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
            
            <Bar 
              dataKey={viewMode === 'lots' ? 'lotsProduits' : 'oee'} 
              name={viewMode === 'lots' ? 'Lots Produits' : 'OEE (%)'}
              fill="url(#copperGradient)"
              radius={[10, 10, 0, 0]}
              barSize={40}
            />
            
            {viewMode === 'oee' && (
              <Line 
                type="monotone" 
                dataKey="target" 
                name="Objectif" 
                stroke="#006576" 
                strokeWidth={4}
                dot={{ fill: '#006576', r: 4 }}
                strokeDasharray="5 5"
              />
            )}

            <defs>
               <linearGradient id="copperGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A67B5B" />
                  <stop offset="100%" stopColor="#894d0d" />
               </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
