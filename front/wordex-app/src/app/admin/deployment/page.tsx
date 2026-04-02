"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const SERVICES = [
  { name: "Frontend (Next.js)",  status: "running", uptime: "99.9%", cpu: 12,  mem: 38, version: "16.2.1", port: 3000 },
  { name: "Backend (FastAPI)",   status: "running", uptime: "99.7%", cpu: 28,  mem: 52, version: "1.0.0",  port: 8000 },
  { name: "Ollama AI",           status: "running", uptime: "98.2%", cpu: 67,  mem: 78, version: "0.5.1",  port: 11434 },
  { name: "Redis Cache",         status: "running", uptime: "99.9%", cpu: 4,   mem: 22, version: "7.2",    port: 6379 },
  { name: "Nginx Proxy",         status: "running", uptime: "100%",  cpu: 2,   mem: 8,  version: "1.25",   port: 80 },
  { name: "PostgreSQL DB",       status: "stopped", uptime: "0%",    cpu: 0,   mem: 0,  version: "16.1",   port: 5432 },
];

const DEPLOY_HISTORY = [
  { id: "d1", version: "v1.4.2", env: "production", status: "success", time: "Today 13:45", by: "CI/CD", duration: "2m 18s" },
  { id: "d2", version: "v1.4.1", env: "staging",    status: "success", time: "Today 11:20", by: "Alex R.", duration: "1m 55s" },
  { id: "d3", version: "v1.4.0", env: "production", status: "success", time: "Yesterday",   by: "CI/CD", duration: "2m 44s" },
  { id: "d4", version: "v1.3.9", env: "production", status: "failed",  time: "2 days ago",  by: "CI/CD", duration: "0m 48s" },
];

export default function DeploymentPage() {
  const [services, setServices] = useState(SERVICES);
  const [deploying, setDeploying] = useState(false);

  const toggleService = (name: string) => {
    setServices((s) => s.map((svc) => svc.name === name
      ? { ...svc, status: svc.status === "running" ? "stopped" : "running" }
      : svc
    ));
  };

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => setDeploying(false), 3000);
  };

  return (
    <AppShell title="Deployment Command Center">
      <div className="p-8 max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Deployment Center
            </h1>
            <p className="text-[#454652] text-sm mt-1">
              {services.filter((s) => s.status === "running").length}/{services.length} services running
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition-all active:scale-95
                ${deploying ? "bg-amber-500 text-white" : "bg-[#3a388b] text-white hover:bg-[#2d2c78]"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {deploying ? "sync" : "rocket_launch"}
              </span>
              {deploying ? "Deploying…" : "Deploy to Production"}
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="font-bold text-[#131b2e] mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div key={svc.name} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${svc.status === "stopped" ? "opacity-70" : ""}`}
                style={{ borderColor: svc.status === "running" ? "#89f5e7" : "#ffdad6" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm text-[#131b2e]">{svc.name}</p>
                    <p className="text-[10px] text-[#454652] mt-0.5">v{svc.version} · Port {svc.port}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${svc.status === "running" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <button
                      onClick={() => toggleService(svc.name)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition-colors
                        ${svc.status === "running" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                    >
                      {svc.status === "running" ? "Stop" : "Start"}
                    </button>
                  </div>
                </div>
                {svc.status === "running" && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-[#454652] mb-1">
                        <span>CPU</span><span>{svc.cpu}%</span>
                      </div>
                      <div className="h-1.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${svc.cpu}%`, background: svc.cpu > 70 ? "#dc2626" : svc.cpu > 40 ? "#d97706" : "#3a388b" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-[#454652] mb-1">
                        <span>Memory</span><span>{svc.mem}%</span>
                      </div>
                      <div className="h-1.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${svc.mem}%`, background: svc.mem > 80 ? "#dc2626" : svc.mem > 60 ? "#d97706" : "#004c45" }} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600">↑ {svc.uptime} uptime</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ollama Status Card */}
        <div className="bg-[#3a388b] text-white rounded-2xl p-6 flex items-center gap-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg" style={{ fontFamily: "'Manrope', sans-serif" }}>Ollama AI Agent</h3>
            <p className="text-white/70 text-sm mt-1">Running llama3.2:3b · nomic-embed-text · Port 11434</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs font-bold text-[#89f5e7]">
                <span className="w-2 h-2 bg-[#89f5e7] rounded-full animate-pulse" />Online
              </span>
              <span className="text-white/50 text-xs">67% GPU · 78% RAM</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/20 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-colors">
              Pull Model
            </button>
            <button className="px-4 py-2 bg-white text-[#3a388b] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
              View Logs
            </button>
          </div>
        </div>

        {/* Deploy History */}
        <div>
          <h2 className="font-bold text-[#131b2e] mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Deployment History</h2>
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#454652] font-bold bg-[#f2f3ff] border-b border-indigo-50">
                  <th className="px-6 py-4 text-left">Version</th>
                  <th className="px-6 py-4 text-left">Environment</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Triggered By</th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {DEPLOY_HISTORY.map((d) => (
                  <tr key={d.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono font-bold text-[#3a388b]">{d.version}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase
                        ${d.env === "production" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                        {d.env}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold w-fit
                        ${d.status === "success" ? "text-emerald-600" : "text-red-600"}`}>
                        <span className="material-symbols-outlined text-[14px]">{d.status === "success" ? "check_circle" : "cancel"}</span>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#454652]">{d.by}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#454652]">{d.duration}</td>
                    <td className="px-6 py-4 text-xs text-[#454652]">{d.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
