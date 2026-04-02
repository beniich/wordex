"use client";

import React, { useState } from "react";
import { useWASP } from "@/hooks/use-wasp";
import { ShieldCheck, Lock, Activity, ShieldAlert, Cpu } from "lucide-react";

/**
 * SecureCollaborativeEditor - Wraps the TipTap editor with WASP protection layers.
 * Provides visual feedback on the state of end-to-end encryption.
 */
export default function SecureCollaborativeEditor({ children, isLive }: { children: React.ReactNode, isLive: boolean }) {
  const { wasp, isInitialized, sessionLabel, encryptionLevel } = useWASP();
  const [showStatus, setShowStatus] = useState(false);

  return (
    <div className="relative group/secure flex flex-col w-full h-full">
      
      {/* ── WASP Security HUD (The HUD of the Future) ────────────────────── */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md 
            ${isInitialized ? 'bg-primary text-white shadow-primary/20' : 'bg-stone-200 text-stone-500 animate-pulse'}`}>
             {isInitialized ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
          </div>
          <div className="flex flex-col">
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Protocol Environment</span>
             <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">
                {isInitialized ? `Secured by ${sessionLabel}` : "Initializing WASP Environment..."}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowStatus(!showStatus)}
             className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all
               ${isInitialized ? 'bg-white border-primary/20 text-primary hover:bg-primary hover:text-white' : 'bg-stone-100 border-stone-200 text-stone-400'}`}
           >
             Protocol Intel
           </button>
           {isLive && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/10">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[pulse_2s_infinite]" />
                <span className="text-[8px] font-black text-foreground uppercase tracking-widest">WASM Live Channel</span>
             </div>
           )}
        </div>
      </div>

      {/* ── Status Overlay ────────────────────────────────────────── */}
      {showStatus && isInitialized && (
        <div className="absolute top-16 right-4 z-50 w-72 p-6 bg-inverse-surface text-surface rounded-3xl shadow-2xl border border-white/10 animate-fade-in-up backdrop-blur-3xl overflow-hidden group/intel">
           {/* Ambient background effect inside card */}
           <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl pointer-events-none" />
           
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <Cpu size={18} className="text-primary" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{sessionLabel} Manifest</h4>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-widest opacity-40 uppercase">Protection Tier</p>
                    <p className="text-sm font-black tracking-tight">{encryptionLevel}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black tracking-widest opacity-40 uppercase">Operational Status</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-primary italic">End-to-End Tunnel Active</span>
                       <Activity size={12} className="text-primary animate-pulse" />
                    </div>
                 </div>
                 <div className="pt-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white hover:text-primary transition-all cursor-pointer group/link">
                       <Lock size={10} />
                       <span className="uppercase tracking-[0.2em]">Verify Audit Trail Signature</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── The Protected Canvas ──────────────────────────────────── */}
      <div className={`relative flex-1 rounded-[3rem] transition-all duration-700 
        ${isInitialized ? 'bg-white shadow-[0_40px_100px_rgba(28,28,26,0.06)]' : 'bg-surface-container-low opacity-60 filter blur-sm'}`}>
         
         {!isInitialized && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-md rounded-[3rem]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-xl shadow-primary/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Establishing Secure Nexus</p>
           </div>
         )}
         
         {/* The Editor */}
         <div className="h-full overflow-hidden">
           {children}
         </div>
      </div>

    </div>
  );
}
