"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import GaugeChart from 'react-gauge-chart';
import { useParams } from 'next/navigation';
import { dashboard } from '@/lib/api';

interface ScurveDataPoint {
  date: string;
  reference: number;
  replanifie: number;
  reel: number;
}

export function SCurveWidget() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";
  const [scData, setScData] = useState<ScurveDataPoint[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [delayPercentage, setDelayPercentage] = useState(0);

  useEffect(() => {
    const loadSCurveData = async () => {
      try {
        const data = await dashboard.getSCurve(workspaceId);
        setScData(data?.curve || []);
        setCompletionRate(data?.completionRate || 0);
        setDelayPercentage(data?.delayPercentage || 0);
      } catch (err) {
        console.error(err);
      }
    };
    loadSCurveData();
  }, [workspaceId]);

  const getCurrentDate = () => {
    return scData[11]?.date;
  };

  return (
    <div className="scurve-widget bg-[#F5F1E6]/40 backdrop-blur-md rounded-2xl p-6 border border-[#A67B5B]/30 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Courbe S - Avancement Projet</h3>
        <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-xl border border-[#A67B5B]/10">
          <div className="text-center group">
            <div className="text-[7px] font-black uppercase opacity-60 text-outline">Complété</div>
            <div className="text-[14px] font-black text-emerald-600 transition-all group-hover:scale-110">{Math.round(completionRate * 100)}%</div>
          </div>
          <div className="w-px h-6 bg-[#D8C3B4]"></div>
          <div className="text-center group">
             <div className="text-[7px] font-black uppercase opacity-60 text-outline">Retard</div>
             <div className="text-[14px] font-black text-red-500 transition-all group-hover:scale-110">{delayPercentage}%</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8C3B4" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#857467' }} />
              <YAxis tick={{ fontSize: 9, fill: '#857467' }} />
              <Tooltip 
                contentStyle={{ border: 'none', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', fontSize: '10px' }}
              />
              
              <Area 
                type="monotone" 
                dataKey="reference" 
                name="Référence" 
                stroke="#A67B5B" 
                fill="#A67B5B" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="replanifie" 
                name="Replanifié" 
                stroke="#894d0d" 
                fill="#894d0d" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="reel" 
                name="Réel" 
                stroke="#006576" 
                fill="#006576" 
                fillOpacity={0.5}
                strokeWidth={4}
                className="drop-shadow-lg"
              />
              
              <ReferenceLine 
                x={getCurrentDate()} 
                stroke="#FF6B6B" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'AUJOURD\'HUI', position: 'top', fill: '#FF6B6B', fontSize: 8, fontWeight: 900 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full xl:w-64 flex flex-col gap-6 justify-center">
          <div className="bg-white/40 p-4 rounded-2xl border border-[#A67B5B]/10 flex flex-col items-center">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">Santé du Projet</h4>
            <div className="w-full h-32 flex items-center justify-center p-2">
                <GaugeChart 
                  id="completion-gauge"
                  nrOfLevels={30}
                  percent={completionRate}
                  arcWidth={0.2}
                  colors={['#FF6B6B', '#FFD93D', '#6BCB77']}
                  textColor="#1c1c1a"
                  fontSize="12px"
                  animate={true}
                  needleColor="#A67B5B"
                  needleBaseColor="#894d0d"
                />
            </div>
          </div>

          <div className="bg-white/40 p-4 rounded-2xl border border-[#A67B5B]/10 flex flex-col items-center">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">Indice de Retard</h4>
            <div className="w-full h-32 flex items-center justify-center p-2">
                <GaugeChart 
                  id="delay-gauge"
                  nrOfLevels={20}
                  percent={delayPercentage / 100}
                  arcWidth={0.2}
                  colors={['#6BCB77', '#FFD93D', '#FF6B6B']}
                  textColor="#1c1c1a"
                  fontSize="12px"
                  animate={true}
                  needleColor="#A67B5B"
                  needleBaseColor="#894d0d"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
