"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return null;
  return (
    <div className="bg-[#fcf9f5] font-body text-[#1c1c1a] min-h-screen overflow-x-hidden selection:bg-[#ffdcc2] selection:text-[#6d3a00]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-3 max-w-7xl mx-auto rounded-2xl mt-4 mx-4 bg-[#fcf9f5]/80 backdrop-blur-3xl border border-white/20 shadow-[0_20px_40px_rgba(28,28,26,0.04)]">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-tighter text-[#894d0d]">Aether Suite</span>
          <div className="hidden md:flex gap-6 items-center">
            <Link className="text-[#894d0d] font-bold border-b-2 border-[#894d0d] text-xs uppercase tracking-widest" href="/">Workspace</Link>
            <Link className="text-stone-500 hover:bg-[#f6f3ef] transition-all px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest" href="/dashboard/bi">Control Tower</Link>
            <Link className="text-stone-500 hover:bg-[#f6f3ef] transition-all px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest" href="/admin/treasury">Treasury</Link>
            <Link className="text-stone-500 hover:bg-[#f6f3ef] transition-all px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest" href="/settings/team">Team</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="bg-[#894d0d] text-white px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-[#a76526] transition-all shadow-[0_8px_20px_rgba(137,77,13,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2">
            Open Atelier <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-44 md:pt-56 pb-32 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(137,77,13,0.1)_0%,transparent_70%)] rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(137,77,13,0.05)_0%,transparent_70%)] rounded-full blur-3xl opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffdcc2] text-[#6d3a00] rounded-full text-[10px] font-black tracking-[0.2em] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#894d0d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#894d0d]"></span>
              </span>
              Orbital v3.0 Live
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#1c1c1a] leading-[0.85]">
              Design the <span className="text-[#894d0d] italic font-serif">Infinite</span> <br/> Workspace.
            </h1>
            <p className="text-xl text-[#524439] max-w-lg leading-relaxed font-medium">
              Aether Suite bridges the tactile soul of the physical world with the ethereal precision of high-tech digital environments. Curated for the modern atelier.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/dashboard" className="bg-gradient-to-tr from-[#894d0d] to-[#a76526] shadow-[0_15px_35px_rgba(137,77,13,0.4)] text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                Enter Workspace
                <span className="material-symbols-outlined">north_east</span>
              </Link>
              <button className="bg-white/60 backdrop-blur-md border border-[#d8c3b4]/30 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-[#894d0d] hover:bg-white transition-all shadow-sm">
                View Showreel
              </button>
            </div>
            <div className="flex items-center gap-16 pt-8 border-t border-[#d8c3b4]/30">
              <div>
                <div className="text-3xl font-black text-[#894d0d]">12k+</div>
                <div className="text-[10px] uppercase tracking-widest text-[#857467] font-black mt-1">Active Nodes</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#894d0d]">0.4ms</div>
                <div className="text-[10px] uppercase tracking-widest text-[#857467] font-black mt-1">Latency Rate</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#894d0d]">∞</div>
                <div className="text-[10px] uppercase tracking-widest text-[#857467] font-black mt-1">Scalability</div>
              </div>
            </div>
          </div>

          {/* Floating Hero Element */}
          <div className="relative flex justify-center items-center group">
            <div className="relative w-full aspect-square max-w-xl">
              {/* Decorative Blur */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#894d0d]/20 to-[#006576]/10 rounded-[4rem] rotate-6 scale-105 blur-2xl group-hover:rotate-12 transition-transform duration-1000"></div>
              
              <div className="relative w-full h-full rounded-[3.5rem] overflow-hidden shadow-2xl bg-[#f0ede9] border border-white/40">
                <img 
                  alt="Architecture Inspiration" 
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] hover:scale-110 transition-transform duration-[2000ms]" 
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop"
                />
                
                {/* Floating Data Card */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/60 backdrop-blur-3xl border border-white/40 p-6 rounded-3xl flex flex-col gap-4 shadow-2xl">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-[#894d0d]">Telemetry Sync</span>
                    <span className="text-[#006576]">98.4% STABLE</span>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#894d0d] w-[98%] shadow-[0_0_10px_rgba(137,77,13,0.5)]"></div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="h-10 w-10 rounded-xl bg-[#31302e] flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#1c1c1a]">Orbital Pathing System</div>
                      <div className="text-[10px] text-[#857467] font-bold italic mt-0.5">Recalculating vectors...</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Icons */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-bounce duration-[3000ms] border border-[#d8c3b4]/30">
                <span className="material-symbols-outlined text-[#894d0d] text-4xl">hub</span>
              </div>
              <div className="absolute top-1/2 -left-10 w-16 h-16 bg-[#31302e] rounded-2xl shadow-2xl flex items-center justify-center animate-pulse border border-white/10">
                <span className="material-symbols-outlined text-white text-3xl">analytics</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Engine Section (Bento) */}
      <section className="py-32 relative bg-white/40">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-20 text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d]">The Neural Nexus</span>
            <h2 className="text-5xl font-black tracking-tighter">Core AI Engine</h2>
            <p className="text-[#524439] leading-relaxed font-medium">The celestial machinery driving our most complex predictions. A synthesis of biological intuition and silicon precision.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main Bento Tile */}
            <div className="md:col-span-8 bg-white/70 backdrop-blur-2xl border border-[#d8c3b4]/30 rounded-[3rem] p-12 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-700">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#894d0d]/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#894d0d] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#894d0d]/20">
                  <span className="material-symbols-outlined text-white text-4xl">psychology</span>
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tight">Deep Learning Synthesizer</h3>
                <p className="text-[#524439] max-w-md text-lg leading-relaxed font-medium opacity-80">
                  Processing multi-layered datasets through our proprietary transformer architecture. Experience pattern recognition that evolves with your workload.
                </p>
              </div>
              
              <div className="mt-12 flex gap-8">
                <div className="bg-[#f0ede9] p-6 rounded-2xl flex-1 border border-[#d8c3b4]/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#894d0d] mb-2">Efficiency</div>
                  <div className="text-3xl font-black">99.2%</div>
                </div>
                <div className="bg-[#f0ede9] p-6 rounded-2xl flex-1 border border-[#d8c3b4]/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#894d0d] mb-2">Adaptation</div>
                  <div className="text-3xl font-black">Instant</div>
                </div>
              </div>
            </div>

            {/* Right Stack */}
            <div className="md:col-span-4 flex flex-col gap-8">
              <div className="flex-1 bg-[#31302e] rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden group shadow-xl">
                 <div className="absolute inset-0 bg-[#894d0d]/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                     <span className="material-symbols-outlined text-white">share_reviews</span>
                   </div>
                   <h3 className="text-2xl font-bold mb-3 tracking-tight">Neural Networks</h3>
                   <p className="text-stone-400 text-sm font-medium leading-relaxed">Cross-platform integration for decentralized intelligence processing.</p>
                 </div>
                 <div className="relative z-10 flex justify-end">
                   <span className="material-symbols-outlined text-[#894d0d] text-4xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
                 </div>
              </div>
              
              <div className="flex-1 bg-white border border-[#d8c3b4]/30 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                   <div className="w-12 h-12 bg-[#f0ede9] rounded-xl flex items-center justify-center mb-6">
                     <span className="material-symbols-outlined text-[#894d0d]">timeline</span>
                   </div>
                   <h3 className="text-2xl font-bold mb-2 tracking-tight text-[#1c1c1a]">Predictive Stats</h3>
                   <p className="text-[#524439] text-sm font-medium">Anticipate market shifts with high-fidelity streams.</p>
                </div>
                <div className="flex items-end gap-1.5 h-12 mt-6">
                  {[30, 45, 25, 70, 40, 90, 50].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#894d0d] rounded-t-sm transition-all hover:brightness-110" style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-[#d8c3b4]/30">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-16">
          <div className="col-span-2 space-y-8">
            <span className="text-3xl font-black text-[#894d0d] tracking-tighter">Aether Suite</span>
            <p className="text-[#524439] max-w-sm font-medium leading-relaxed">
              Celestial atelier for the next generation of digital infrastructure. Built for scale, designed for soul.
            </p>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#894d0d] hover:bg-[#894d0d] hover:text-white transition-all shadow-sm cursor-pointer">
                <span className="material-symbols-outlined">language</span>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#894d0d] hover:bg-[#894d0d] hover:text-white transition-all shadow-sm cursor-pointer">
                <span className="material-symbols-outlined">alternate_email</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-[#894d0d]">Platform</h4>
            <nav className="flex flex-col gap-4 text-xs font-bold text-[#524439]">
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Workspace Engine</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Analytics Core</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Neural Gateways</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Marketplace</Link>
            </nav>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-[#894d0d]">Resources</h4>
            <nav className="flex flex-col gap-4 text-xs font-bold text-[#524439]">
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Documentation</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">API Reference</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">System Status</Link>
              <Link href="#" className="hover:text-[#894d0d] transition-colors">Privacy Policy</Link>
            </nav>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 pt-20 flex flex-col md:flex-row justify-between items-center text-[#857467] text-[10px] font-black tracking-[0.3em] uppercase">
          <span>© 2026 Aether Suite Celestial Atelier</span>
          <span className="mt-4 md:mt-0 opacity-60">Station Orbital-04 // All Systems Nominal</span>
        </div>
      </footer>
      
      <FloatingAIChat />
    </div>
  );
}
