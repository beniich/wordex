"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { useParams } from 'next/navigation';
import { dashboard } from '@/lib/api';

interface MachineData {
  machine: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  timeline: Array<{ time: string; value: number }>;
}

export function TRSOEEWidget() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";
  const [machinesData, setMachinesData] = useState<MachineData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    const loadTRSOEEData = async (timeframe: string) => {
      try {
        const data = await dashboard.getTrsOee(workspaceId, timeframe);
        setMachinesData(data?.machines || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadTRSOEEData(selectedTimeframe);
  }, [workspaceId, selectedTimeframe]);

  return (
    <div className="trs-oee-widget bg-[#F5F1E6]/40 backdrop-blur-md rounded-2xl p-6 border border-[#A67B5B]/30 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">TRS/OEE par Machine</h3>
        <select 
          value={selectedTimeframe} 
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="bg-white/50 border border-[#A67B5B]/20 rounded-lg px-3 py-1.5 text-xs font-bold text-[#524439] outline-none"
          title="Timeframe"
        >
          <option value="1h">1 heure</option>
          <option value="24h">24 heures</option>
          <option value="7d">7 jours</option>
          <option value="30d">30 jours</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {machinesData.map((machine) => (
          <div key={machine.machine} className="bg-white/60 p-4 rounded-xl border border-[#DCC6A0]/30 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-[#1c1c1a] uppercase">{machine.machine}</span>
              <span className="text-lg font-black text-[#A67B5B] italic">{machine.oee}%</span>
            </div>
            
            <div className="flex gap-2 mb-4">
              <KPIBadge label="Dispo" value={machine.availability} suffix="%" />
              <KPIBadge label="Perfo" value={machine.performance} suffix="%" />
              <KPIBadge label="Qualité" value={machine.quality} suffix="%" />
            </div>

            <div className="h-[60px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={machine.timeline}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#A67B5B" 
                    strokeWidth={3}
                    dot={false}
                    className="drop-shadow-sm"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #DCC6A0', background: 'rgba(255,255,255,0.9)', fontSize: '10px' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPIBadge({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  const getColor = () => {
    if (value >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (value >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className={`flex flex-col items-center flex-1 p-2 rounded-lg border ${getColor()} transition-all`}>
      <span className="text-[7px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</span>
      <span className="text-[10px] font-black">{value}{suffix}</span>
    </div>
  );
}
