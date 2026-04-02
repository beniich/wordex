"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex@wordex.io",
    title: "Lead Architect",
    bio: "Passionate about building scalable UI systems and collaborating globally.",
  });

  return (
    <AppShell title="Profile Settings">
      <div className="p-8 max-w-4xl mx-auto space-y-10">
        
        <div className="flex items-center justify-between border-b border-indigo-50 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              My Profile
            </h1>
            <p className="text-[#454652] text-sm mt-1">Manage your personal information and preferences</p>
          </div>
          <button className="px-5 py-2.5 bg-[#3a388b] text-white font-bold text-sm rounded-xl hover:bg-[#2d2c78] transition-all">
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Avatar Section */}
           <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-indigo-50 shadow-sm">
             <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-[#3a388b] text-white flex items-center justify-center text-4xl font-black mb-4 relative overflow-hidden group cursor-pointer">
                <span>{profile.firstName[0]}{profile.lastName[0]}</span>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
             </div>
             <p className="font-bold text-[#131b2e] text-lg">{profile.firstName} {profile.lastName}</p>
             <span className="px-3 py-1 bg-[#eaedff] text-[#3a388b] rounded-full text-xs font-bold uppercase mt-1">Wordex Pro Plan</span>
             <p className="text-center text-xs text-[#454652] mt-4 leading-relaxed line-clamp-3">
               {profile.bio}
             </p>
           </div>

           {/* Form Section */}
           <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6 space-y-4">
                 <h2 className="font-bold text-[#131b2e] mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Personal Information</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#454652] uppercase block mb-1.5">First Name</label>
                      <input 
                        value={profile.firstName} 
                        onChange={e => setProfile({...profile, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20 text-[#131b2e]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#454652] uppercase block mb-1.5">Last Name</label>
                      <input 
                        value={profile.lastName}
                        onChange={e => setProfile({...profile, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20 text-[#131b2e]" 
                      />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-[#454652] uppercase block mb-1.5">Email Address</label>
                    <input 
                      value={profile.email} disabled
                      className="w-full px-4 py-3 bg-[#f2f3ff]/50 border border-[#c5c5d4]/40 rounded-xl text-sm outline-none text-[#454652] cursor-not-allowed opacity-70" 
                    />
                    <p className="text-[10px] text-amber-600 mt-1 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span> Email cannot be changed here. Contact support.
                    </p>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-[#454652] uppercase block mb-1.5">Job Title</label>
                    <input 
                      value={profile.title}
                      onChange={e => setProfile({...profile, title: e.target.value})}
                      className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20 text-[#131b2e]" 
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-[#454652] uppercase block mb-1.5">Bio</label>
                    <textarea 
                      value={profile.bio} rows={3}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20 text-[#131b2e] resize-none" 
                    />
                 </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6 space-y-4">
                 <h2 className="font-bold text-[#131b2e] mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Site Preferences</h2>
                 {[
                   { id: "dark_mode", title: "Enable Dark Mode", desc: "Use a dark theme for the entire application interface" },
                   { id: "email_notifs", title: "Email Notifications", desc: "Receive summary emails when you are mentioned or assigned tasks" },
                   { id: "compact_view", title: "Compact Editor View", desc: "Reduce padding and margins in the document editor" },
                 ].map(pref => (
                    <div key={pref.id} className="flex items-start justify-between p-3 rounded-xl hover:bg-[#f2f3ff] transition-colors border border-transparent hover:border-[#c5c5d4]/30 cursor-pointer">
                      <div>
                         <p className="text-sm font-bold text-[#131b2e]">{pref.title}</p>
                         <p className="text-xs text-[#454652] mt-0.5">{pref.desc}</p>
                      </div>
                      <div className="w-10 h-6 bg-[#c5c5d4] rounded-full relative shadow-inner">
                         <div className="absolute left-1 top-1 bottom-1 w-4 bg-white rounded-full transition-all" />
                      </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
      <FloatingAIChat defaultAgent="general" />
    </AppShell>
  );
}
