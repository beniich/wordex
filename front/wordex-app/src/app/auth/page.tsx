"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function AuthForm() {
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  const [mode, setMode]       = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when switching mode
  useEffect(() => { setError(null); }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const username = name.trim().replace(/\s+/g, "_").toLowerCase() || email.split("@")[0];
        await register(email, username, password);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center p-8 md:p-16 bg-white/40 backdrop-blur-3xl w-full h-full">
      <div className="max-w-md mx-auto w-full space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <span className="material-symbols-outlined text-[#ffb77b] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-extrabold tracking-tighter text-[#1c1c1a]">Aether Suite</span>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-[#1c1c1a]" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {mode === "login" ? "Welcome back" : "Join the Atelier"}
          </h3>
          <p className="text-[#524439] font-medium text-sm">
            {mode === "login" 
              ? "Please enter your credentials to access the workspace."
              : "Create an account to start crafting digital masterpieces."}
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex p-1 rounded-xl bg-[#f0ede9]/80 border border-[#d8c3b4]/30 shadow-inner">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-black rounded-lg transition-all duration-300 ${
                mode === m
                  ? "bg-white text-[#894d0d] shadow-md border border-[#d8c3b4]/40"
                  : "text-[#857467] hover:text-[#524439] hover:bg-white/50"
              }`}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* SSO Options */}
        {mode === "login" && (
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#d8c3b4]/50 bg-white/50 hover:bg-white hover:border-[#894d0d]/30 transition-all duration-300 shadow-sm hover:shadow-md group">
              <span className="text-xs font-black text-[#1c1c1a] uppercase tracking-widest">Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#d8c3b4]/50 bg-white/50 hover:bg-white hover:border-[#894d0d]/30 transition-all duration-300 shadow-sm hover:shadow-md group">
              <span className="material-symbols-outlined text-xl text-[#857467] group-hover:text-[#894d0d] transition-colors">fingerprint</span>
              <span className="text-xs font-black text-[#1c1c1a] uppercase tracking-widest">Okta SSO</span>
            </button>
          </div>
        )}

        {mode === "login" && (
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#d8c3b4]/50"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">or continue with email</span>
            <div className="flex-grow border-t border-[#d8c3b4]/50"></div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {mode === "signup" && (
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#857467] mb-2 ml-1" htmlFor="name">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d8c3b4] group-focus-within:text-[#894d0d] transition-colors">person</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-white/70 rounded-xl border border-[#d8c3b4]/40 focus:ring-2 focus:ring-[#894d0d]/20 focus:border-[#894d0d]/50 focus:bg-white transition-all duration-300 text-[#1c1c1a] placeholder:text-[#d8c3b4] font-medium text-sm shadow-sm"
                    id="name"
                    placeholder="Jane Doe"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#857467] mb-2 ml-1" htmlFor="email">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d8c3b4] group-focus-within:text-[#894d0d] transition-colors">mail</span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-white/70 rounded-xl border border-[#d8c3b4]/40 focus:ring-2 focus:ring-[#894d0d]/20 focus:border-[#894d0d]/50 focus:bg-white transition-all duration-300 text-[#1c1c1a] placeholder:text-[#d8c3b4] font-medium text-sm shadow-sm"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-end mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#857467]" htmlFor="password">Password</label>
                {mode === "login" && (
                  <a className="text-[10px] font-black uppercase tracking-widest text-[#894d0d] hover:text-[#a76526] transition-colors" href="#">Forgot?</a>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#d8c3b4] group-focus-within:text-[#894d0d] transition-colors">lock</span>
                <input
                  className="w-full pl-12 pr-12 py-4 bg-white/70 rounded-xl border border-[#d8c3b4]/40 focus:ring-2 focus:ring-[#894d0d]/20 focus:border-[#894d0d]/50 focus:bg-white transition-all duration-300 text-[#1c1c1a] placeholder:text-[#d8c3b4] font-medium text-sm shadow-sm"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d8c3b4] hover:text-[#857467] transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input className="w-5 h-5 rounded border-[#d8c3b4] text-[#894d0d] focus:ring-[#894d0d]/20 bg-white/70 shadow-sm cursor-pointer" id="remember" type="checkbox" />
            <label className="ml-3 text-xs font-bold text-[#524439] cursor-pointer" htmlFor="remember">Keep me signed in for 30 days</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-tr from-[#894d0d] to-[#a76526] py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(137,77,13,0.3)] hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(137,77,13,0.4)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : mode === "login" ? "Enter Workspace" : "Create Account"}
            {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
          </button>
        </form>

        <footer className="pt-8 text-center space-y-5">
          <p className="text-xs text-[#524439] font-bold">
            {mode === "login" ? "New to the suite? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[#894d0d] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">
              {mode === "login" ? "Request Access" : "Sign In"}
            </button>
          </p>
          <div className="flex justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-[#857467]">
            <a className="hover:text-[#894d0d] transition-colors" href="#">Terms of Service</a>
            <span className="text-[#d8c3b4]">•</span>
            <a className="hover:text-[#894d0d] transition-colors" href="#">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-body bg-[#fcf9f5] selection:bg-[#ffdcc2] selection:text-[#6d3a00]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      
      {/* Background radial sand gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#fcf9f5_0%,#f6f3ef_50%,#e5e2de_100%)]"></div>

      {/* Atmospheric Ambient Elements */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#894d0d]/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#006576]/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply"></div>

      <main className="w-full max-w-[1300px] mx-4 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-[2.5rem] bg-white/40 shadow-[0_40px_100px_rgba(28,28,26,0.06)] relative z-10 border border-[#d8c3b4]/30 min-h-[800px]">
        
        {/* Branding Section (Visual Side) */}
        <section className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-[#1c1c1a]">
          <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract flow" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1a] via-transparent to-[#1c1c1a]/50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffb77b] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h1 className="text-2xl font-black tracking-tighter text-[#fcf9f5] uppercase">Aether Suite</h1>
            </div>
          </div>
          
          <div className="relative z-10 space-y-6 mt-10">
            <h2 className="text-5xl lg:text-6xl font-extrabold text-[#fcf9f5] leading-[1.1] tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Crafting digital <br/>
              <span className="text-[#eabe9c] italic font-serif">masterpieces.</span>
            </h2>
            <p className="text-[#dcdad6] text-lg max-w-md font-medium leading-relaxed">
              Step into the Celestial Atelier. A workspace designed for those who weave code and creativity into timeless artifacts.
            </p>
          </div>
          
          <div className="relative z-10 pt-16 mt-auto flex items-center gap-5">
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#1c1c1a] overflow-hidden bg-[#a76526] shadow-md">
                 <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="User" />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#1c1c1a] overflow-hidden bg-[#006576] shadow-md">
                 <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" alt="User" />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#1c1c1a] overflow-hidden bg-[#5250a4] shadow-md flex items-center justify-center text-white text-[10px] font-black">
                 +12K
              </div>
            </div>
            <span className="text-[#dcdad6] text-xs font-bold uppercase tracking-widest">Joined by top creators</span>
          </div>
        </section>

        {/* Form Section */}
        <section className="flex flex-col relative w-full h-full">
           <Suspense fallback={<div className="flex w-full h-full items-center justify-center"><Loader2 className="animate-spin text-[#894d0d]" size={40} /></div>}>
              <AuthForm />
           </Suspense>
        </section>

      </main>

      {/* Floating Decorative Element */}
      <div className="absolute bottom-12 left-12 hidden xl:block pointer-events-none z-20">
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-[#d8c3b4]/30 shadow-2xl">
          <div className="w-12 h-12 bg-[#894d0d]/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[#894d0d]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#857467]">Encryption</p>
            <p className="text-xs font-black text-[#1c1c1a] mt-0.5">Enterprise Grade Secure</p>
          </div>
        </div>
      </div>

    </div>
  );
}
