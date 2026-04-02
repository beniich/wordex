"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Metric {
  totalDeliveries: number;
  successRate: number;
  avgResponseTime: number;
  failedDeliveries: number;
  trend: string;
}

export default function WebhookAnalytics() {
  const [metrics] = useState<Metric>({
    totalDeliveries: 1250,
    successRate: 98.4,
    avgResponseTime: 420,
    failedDeliveries: 12,
    trend: "+2.3%"
  });

  return (
    <div className="space-y-6 font-body">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary opacity-60">Performance Profile</span>
        <h2 className="text-2xl font-black text-foreground tracking-tighter">Event Telemetry</h2>
      </div>

      {/* ── Metrics Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Success Rate" 
          value={`${metrics.successRate}%`} 
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
          trend={metrics.trend}
          isSuccess={true}
        />
        <MetricCard 
          title="Latency" 
          value={`${metrics.avgResponseTime}ms`} 
          icon={<Clock className="w-4 h-4 text-tertiary" />}
          trend="-15ms"
          isSuccess={true}
        />
        <MetricCard 
          title="Total Flows" 
          value={metrics.totalDeliveries.toLocaleString()} 
          icon={<Activity className="w-4 h-4 text-secondary" />}
          trend="+12%"
          isSuccess={true}
        />
        <MetricCard 
          title="Deviations" 
          value={metrics.failedDeliveries} 
          icon={<AlertCircle className="w-4 h-4 text-red-500" />}
          trend="+1.2%"
          isSuccess={false}
        />
      </div>

      {/* ── Sub-Layer (The Tonal Ground) ───────────────────── */}
      <div className="bg-surface-container-low/40 rounded-4xl p-8 border border-outline-variant/10 shadow-sm backdrop-blur-3xl">
         <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-on-surface-variant">Live Pulse</h3>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Online</span>
            </div>
         </div>
         {/* Atmospheric visualization placeholder */}
         <div className="h-48 w-full bg-linear-to-b from-primary/5 to-transparent rounded-2xl flex items-end justify-between px-8 pb-4">
            {[40, 70, 45, 90, 65, 80, 50, 40, 85, 30, 45, 60, 55, 75, 90, 40].map((h, i) => (
                <div key={i} className="w-2 bg-primary/20 rounded-full transition-all hover:bg-primary/60 cursor-pointer group relative" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-inverse-surface text-surface text-[8px] font-black px-2 py-1 rounded shadow-xl pointer-events-none">
                        {h*10}ms
                    </div>
                </div>
            ))}
         </div>
         <p className="mt-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-center opacity-40 italic">Streaming real-time telemetry from the Aether Grid</p>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  isSuccess: boolean;
}

function MetricCard({ title, value, icon, trend, isSuccess }: MetricCardProps) {
  return (
    <div className="group p-6 rounded-4xl bg-white shadow-[20px_0_40px_rgba(28,28,26,0.02)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-outline-variant/5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-surface-container-low flex items-center justify-center group-hover:bg-primary/5 transition-colors">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isSuccess ? 'text-primary' : 'text-red-500'}`}>
          {isSuccess ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-1 opacity-60">{title}</p>
      <p className="text-3xl font-black text-foreground tracking-tighter leading-none">{value}</p>
    </div>
  );
}

