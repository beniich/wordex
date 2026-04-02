"use client";

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useParams } from 'next/navigation';
import { dashboard } from '@/lib/api';

interface AMDECData {
  failureModes: Array<{
    mode: string;
    severity: number;
    occurrence: number;
    detection: number;
    rpn: number;
  }>;
  riskDistribution: Array<{
    category: string;
    count: number;
    color: string;
  }>;
  criticalFailures: Array<{
    equipment: string;
    failure: string;
    impact: number;
  }>;
}

const COLORS = ['#A67B5B', '#C9A56B', '#DCC6A0', '#D8C3B4', '#F5F1E6'];

export function AMDECWidget() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";
  const [amdecData, setAmdecData] = useState<AMDECData | null>(null);
  const [selectedRisk, setSelectedRisk] = useState('all');

  useEffect(() => {
    const loadAMDECData = async () => {
      try {
        const data = await dashboard.getAmdec(workspaceId, selectedRisk);
        setAmdecData(data || { failureModes: [], riskDistribution: [], criticalFailures: [] });
      } catch (err) {
        console.error(err);
      }
    };
    loadAMDECData();
  }, [workspaceId, selectedRisk]);

  if (!amdecData) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-[#F5F1E6]/40 rounded-2xl border border-[#A67B5B]/30 animate-pulse">
        <div className="text-[10px] font-black uppercase text-outline tracking-widest">Chargement AMDEC...</div>
      </div>
    );
  }

  return (
    <div className="amdec-widget bg-[#F5F1E6]/40 backdrop-blur-md rounded-2xl p-6 border border-[#A67B5B]/30 shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">AMDEC - Analyse des Modes de Défaillance</h3>
        <select 
          value={selectedRisk} 
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="bg-white/50 border border-[#A67B5B]/20 rounded-lg px-3 py-1.5 text-xs font-bold text-[#524439] outline-none"
          title="Risk Filter"
        >
          <option value="all">Tous les risques</option>
          <option value="critical">Critiques</option>
          <option value="medium">Moyens</option>
          <option value="low">Faibles</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Risk Radar Chart */}
        <div className="flex flex-col bg-white/40 p-4 rounded-xl border border-[#A67B5B]/10 group">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-4">Profil de criticité Moyenne</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={amdecData.failureModes.slice(0, 5)}>
                <PolarGrid stroke="#D8C3B4" />
                <PolarAngleAxis dataKey="mode" tick={{ fontSize: 8, fill: '#857467', fontWeight: 900 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar 
                  name="Score" 
                  dataKey="rpn" 
                  stroke="#A67B5B" 
                  fill="#A67B5B" 
                  fillOpacity={0.6} 
                />
                <Tooltip 
                   contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', fontSize: '9px', fontWeight: 'black' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="flex flex-col bg-white/40 p-4 rounded-xl border border-[#A67B5B]/10 group">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-4">Distribution des Risques</h4>
          <div className="h-[250px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={amdecData.riskDistribution} 
                   cx="50%" cy="50%" 
                   outerRadius={80} 
                   innerRadius={60}
                   fill="#8884d8" 
                   dataKey="count"
                   nameKey="category"
                   paddingAngle={5}
                   label={{ fontSize: 9, fontWeight: 900, fill: '#524439' }}
                 >
                   {amdecData.riskDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" wrapperStyle={{ paddingBottom: '0px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black' }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Modes Bar Chart (RPN Score) */}
        <div className="xl:col-span-2 flex flex-col bg-white/40 p-6 rounded-xl border border-[#A67B5B]/10">
           <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-6">Criticité RPN par Mode de Défaillance</h4>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart layout="vertical" data={amdecData.failureModes} margin={{ left: 50 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#D8C3B4" horizontal={false} />
                 <XAxis type="number" tick={{ fontSize: 9, fill: '#857467' }} />
                 <YAxis dataKey="mode" type="category" tick={{ fontSize: 8, fill: '#1c1c1a', fontWeight: 'black' }} width={120} />
                 <Tooltip 
                   contentStyle={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', fontSize: '9px', fontWeight: 'black' }} 
                 />
                 <Bar dataKey="rpn" fill="#A67B5B" radius={[0, 10, 10, 0]} barSize={25} name="RPN Score" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
}
