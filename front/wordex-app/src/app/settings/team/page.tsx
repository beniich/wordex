"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const TEAM = [
  { id: "1", name: "Alex Rivera",   email: "alex@wordex.io",   role: "Owner",  avatar: "AR", color: "#894d0d", joined: "Jan 2024", status: "Active" },
  { id: "2", name: "Sarah Johnson", email: "sarah@wordex.io",  role: "Admin",  avatar: "SJ", color: "#a76526", joined: "Feb 2024", status: "Active" },
  { id: "3", name: "Mike Torres",   email: "mike@wordex.io",   role: "Editor", avatar: "MT", color: "#006576", joined: "Mar 2024", status: "Active" },
  { id: "4", name: "Lila Martinez", email: "lila@wordex.io",   role: "Editor", avatar: "LM", color: "#79573c", joined: "Apr 2024", status: "Away" },
  { id: "5", name: "Chen Wei",      email: "chen@wordex.io",   role: "Viewer", avatar: "CW", color: "#857467", joined: "May 2024", status: "Pending" },
];

const ROLES = ["Owner", "Admin", "Editor", "Viewer"];

export default function TeamSettingsPage() {
  const [team, setTeam] = useState(TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");

  return (
    <AppShell title="Team Management">
      <div className="p-8 max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
           <div className="max-w-2xl">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#79573c] font-bold mb-4 block">Organization Control</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1c1c1a] mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>Team Management</h1>
              <p className="text-lg text-[#524439] leading-relaxed font-medium max-w-xl">
                 Orchestrate your collective of artisans and managers. Control access levels across the entire platform with copper-grade precision.
              </p>
           </div>
           
           <div className="flex gap-4">
              <div className="flex -space-x-4">
                 <div className="w-12 h-12 rounded-full border-4 border-[#fcf9f5] overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="User" />
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-[#fcf9f5] overflow-hidden shadow-sm">
                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="User" />
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-[#fcf9f5] bg-[#e5e2de] flex items-center justify-center text-xs font-bold text-[#79573c] z-10 shadow-sm">
                    {`+${Math.max(0, team.length - 2)}`}
                 </div>
              </div>
           </div>
        </header>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
           <div className="md:col-span-4 bg-white/60 backdrop-blur-2xl border border-[#d8c3b4]/30 rounded-[1.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                 <span className="material-symbols-outlined text-[#006576]">person_add</span>
                 <span className="text-[10px] font-bold text-[#857467] tracking-widest uppercase">Active Seats</span>
              </div>
              <div className="text-4xl font-extrabold text-[#1c1c1a] mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>{team.length} / 50</div>
              <div className="h-1.5 w-full bg-[#f0ede9] rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-tr from-[#894d0d] to-[#a76526] transition-all duration-1000" style={{ width: `${(team.length / 50) * 100}%` }}></div>
              </div>
           </div>
           
           <div className="md:col-span-4 bg-white/60 backdrop-blur-2xl border border-[#d8c3b4]/30 rounded-[1.5rem] p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                 <span className="material-symbols-outlined text-[#006576]">verified_user</span>
                 <span className="text-[10px] font-bold text-[#857467] tracking-widest uppercase">Security Score</span>
              </div>
              <div className="text-4xl font-extrabold text-[#1c1c1a] mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>94%</div>
              <p className="text-xs text-[#524439] font-medium">2FA enabled for {team.length - 1} members</p>
           </div>
           
           <div className="md:col-span-4 bg-[#31302e] rounded-[1.5rem] p-8 shadow-[0_20px_40px_rgba(28,28,26,0.1)] relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <span className="text-[10px] font-bold text-[#e5e2de] tracking-widest uppercase">Invite Member</span>
                    <h3 className="text-2xl font-bold text-white mt-2 leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>Scale your<br/>atelier workflow.</h3>
                 </div>
                 <button 
                    onClick={() => setShowInvite(true)}
                    className="mt-6 bg-white text-[#1c1c1a] py-3 px-6 rounded-xl font-bold text-sm tracking-wide self-start transition-transform group-hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                 >
                    Launch Invite Modal
                 </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-tr from-[#894d0d] to-[#a76526] opacity-[0.15] rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
           </div>
        </section>

        {/* Team Table Area */}
        <section className="bg-[#f6f3ef] rounded-[2rem] p-1.5 overflow-hidden shadow-inner">
           <div className="bg-white rounded-[1.75rem] overflow-hidden shadow-sm border border-[#d8c3b4]/20">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                    <thead>
                       <tr className="bg-[#f0ede9]/50">
                          <th className="py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-[#857467] border-b border-[#d8c3b4]/30">Member</th>
                          <th className="py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-[#857467] border-b border-[#d8c3b4]/30">Access Level</th>
                          <th className="py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-[#857467] border-b border-[#d8c3b4]/30">Status</th>
                          <th className="py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-[#857467] border-b border-[#d8c3b4]/30">Last Active</th>
                          <th className="py-5 px-8 text-[10px] font-bold uppercase tracking-widest text-[#857467] border-b border-[#d8c3b4]/30 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ede9]">
                       {team.map((member) => (
                          <tr key={member.id} className="hover:bg-[#fcf9f5] transition-colors group">
                             <td className="py-5 px-8">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style={{ background: member.color }}>
                                      {member.avatar}
                                   </div>
                                   <div>
                                      <p className="font-bold text-[#1c1c1a] text-sm">{member.name}</p>
                                      <p className="text-xs text-[#857467] mt-0.5">{member.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-5 px-8">
                                <select
                                   value={member.role}
                                   disabled={member.role === "Owner"}
                                   onChange={(e) => setTeam((t) => t.map((m) => m.id === member.id ? { ...m, role: e.target.value } : m))}
                                   className="px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-orange-50/50 text-[#894d0d] border border-[#894d0d]/30 outline-none focus:ring-1 focus:ring-[#894d0d] disabled:opacity-50 appearance-none pr-8 cursor-pointer disabled:cursor-not-allowed"
                                   style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23894d0d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1em" }}
                                >
                                   {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                             </td>
                             <td className="py-5 px-8">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full shadow-sm
                                      ${member.status === 'Active' ? 'bg-teal-500' : member.status === 'Pending' ? 'bg-[#ffb77b]' : 'bg-[#d8c3b4]'}`}
                                   ></div>
                                   <span className="text-xs font-bold text-[#524439]">{member.status}</span>
                                </div>
                             </td>
                             <td className="py-5 px-8 text-xs font-medium text-[#857467]">{member.joined}</td>
                             <td className="py-5 px-8 text-right">
                                {member.role !== "Owner" && (
                                   <button 
                                      onClick={() => setTeam((t) => t.filter((m) => m.id !== member.id))}
                                      className="text-[#d8c3b4] hover:text-red-500 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-100 transition-all active:scale-95"
                                      title="Remove Member"
                                   >
                                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                   </button>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {team.length === 0 && (
                 <div className="text-center py-16 text-[#857467]">
                   <span className="material-symbols-outlined text-[48px] opacity-30 mb-2">groups</span>
                   <p className="font-bold text-sm">No members found</p>
                 </div>
              )}
           </div>
        </section>

        {/* Invite Modal (Floating Over Content) */}
        {showInvite && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#31302e]/60 backdrop-blur-md p-4">
              <div className="w-full max-w-xl bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(28,28,26,0.15)] overflow-hidden relative border border-[#d8c3b4]/40 animate-in fade-in zoom-in duration-300">
                 
                 {/* Decorative Light Leak */}
                 <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#894d0d]/10 blur-[80px] rounded-full pointer-events-none"></div>

                 <div className="p-10 md:p-12 relative z-10">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h2 className="text-3xl font-extrabold text-[#1c1c1a] tracking-tight mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Invite Artisan</h2>
                          <p className="text-[#857467] font-medium text-sm">Grant access to the Atelier Nord environment.</p>
                       </div>
                       <button 
                          onClick={() => setShowInvite(false)}
                          className="w-10 h-10 rounded-full bg-[#f0ede9] hover:bg-[#e5e2de] flex items-center justify-center text-[#524439] hover:text-[#1c1c1a] transition-colors border border-transparent shadow-sm"
                       >
                          <span className="material-symbols-outlined text-[20px]">close</span>
                       </button>
                    </div>

                    <form 
                       className="space-y-8"
                       onSubmit={(e) => {
                          e.preventDefault();
                          if (inviteEmail) {
                             setTeam((t) => [...t, {
                               id: Date.now().toString(), name: inviteEmail.split("@")[0] || "New User", email: inviteEmail,
                               role: inviteRole, avatar: inviteEmail.charAt(0).toUpperCase(), color: "#a76526",
                               joined: "Just now", status: "Pending"
                             }]);
                             setInviteEmail("");
                             setShowInvite(false);
                          }
                       }}
                    >
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-[#79573c] mb-3 ml-1">Email Address</label>
                          <input 
                             type="email" 
                             required
                             value={inviteEmail}
                             onChange={(e) => setInviteEmail(e.target.value)}
                             className="w-full bg-[#f6f3ef] border border-transparent rounded-xl py-4 px-6 text-[#1c1c1a] font-medium placeholder:text-[#d8c3b4] focus:ring-2 focus:ring-[#894d0d]/20 focus:border-[#894d0d]/40 focus:bg-white transition-all outline-none shadow-sm" 
                             placeholder="artisan@atelier-nord.com" 
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-widest text-[#79573c] mb-3 ml-1">Role Designation</label>
                             <div className="relative">
                                <select 
                                   value={inviteRole}
                                   onChange={(e) => setInviteRole(e.target.value)}
                                   className="w-full bg-[#f6f3ef] border border-transparent rounded-xl py-4 px-6 appearance-none text-[#1c1c1a] font-bold text-sm focus:ring-2 focus:ring-[#894d0d]/20 focus:bg-white focus:border-[#894d0d]/40 transition-all shadow-sm outline-none cursor-pointer"
                                >
                                   {ROLES.filter(r => r !== "Owner").map(r => (
                                      <option key={r} value={r}>{r}</option>
                                   ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#857467]">expand_more</span>
                             </div>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-widest text-[#79573c] mb-3 ml-1">Workspace Target</label>
                             <div className="relative">
                                <select className="w-full bg-[#f6f3ef] border border-transparent rounded-xl py-4 px-6 appearance-none text-[#1c1c1a] font-bold text-sm focus:ring-2 focus:ring-[#894d0d]/20 focus:bg-white focus:border-[#894d0d]/40 transition-all shadow-sm outline-none cursor-pointer">
                                   <option>Global Production</option>
                                   <option>Archive Beta</option>
                                   <option>Treasury HQ</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#857467]">expand_more</span>
                             </div>
                          </div>
                       </div>

                       <div className="pt-4 flex gap-4 md:flex-row flex-col">
                          <button 
                             type="button"
                             onClick={() => setShowInvite(false)}
                             className="md:flex-1 py-4 px-8 rounded-xl font-black text-[11px] tracking-widest uppercase border-2 border-[#d8c3b4] text-[#524439] hover:bg-[#fcf9f5] hover:border-[#857467] hover:text-[#1c1c1a] transition-all"
                          >
                             Cancel
                          </button>
                          <button 
                             type="submit"
                             className="md:flex-[2] bg-gradient-to-tr from-[#894d0d] to-[#a76526] text-white py-4 px-8 rounded-xl font-black text-[11px] tracking-widest uppercase shadow-lg shadow-[#894d0d]/30 hover:shadow-xl hover:shadow-[#894d0d]/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          >
                             Send Invitation <span className="material-symbols-outlined text-[16px]">send</span>
                          </button>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
        )}

      </div>
      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
