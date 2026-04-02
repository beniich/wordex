"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const TEMPLATES = [
  { id: "t1", name: "Professional Proposal", category: "Business", preview: "#3a388b", uses: 1240, stars: 4.9, desc: "Clean, structured proposal template for client-facing documents." },
  { id: "t2", name: "Technical Specs Doc", category: "Engineering", preview: "#1e40af", uses: 890,  stars: 4.8, desc: "API documentation and technical specifications template." },
  { id: "t3", name: "Executive Summary", category: "Business", preview: "#004c45", uses: 2100, stars: 4.9, desc: "Concise executive summary template for leadership presentations." },
  { id: "t4", name: "Data Analysis Report", category: "Analytics", preview: "#5250a4", uses: 680,  stars: 4.7, desc: "Statistical analysis and insights report template with charts." },
  { id: "t5", name: "Project Brief", category: "Management", preview: "#9c4000", uses: 1540, stars: 4.8, desc: "Project overview, goals, timeline, and stakeholder template." },
  { id: "t6", name: "Meeting Minutes", category: "Operations", preview: "#003d37", uses: 3200, stars: 4.6, desc: "Structured meeting notes and action items template." },
  { id: "t7", name: "Quarterly Review", category: "Analytics", preview: "#1e3a5f", uses: 760,  stars: 4.7, desc: "Q-over-Q performance analysis with KPI tracking sections." },
  { id: "t8", name: "Brand Guidelines", category: "Design", preview: "#3d1f63", uses: 410,  stars: 4.9, desc: "Brand identity documentation with color, typography, and usage rules." },
];

const CATEGORIES = ["All", "Business", "Engineering", "Analytics", "Management", "Operations", "Design"];

export default function TemplatesPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch]     = useState("");

  const filtered = TEMPLATES
    .filter((t) => category === "All" || t.category === category)
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Template Registry">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Template Registry
            </h1>
            <p className="text-[#454652] text-sm mt-1">
              {TEMPLATES.length} professionally crafted templates
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3a388b] text-white font-bold text-sm rounded-xl hover:bg-[#2d2c78] transition-all active:scale-95">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Template
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-10 pr-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/30 rounded-xl text-sm text-[#131b2e] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3a388b]/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
                  ${category === cat ? "bg-[#3a388b] text-white shadow-sm" : "bg-[#f2f3ff] text-[#454652] hover:bg-[#eaedff]"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group bg-white rounded-2xl border border-indigo-50 shadow-sm hover:shadow-lg hover:border-[#3a388b]/20 transition-all overflow-hidden cursor-pointer"
            >
              {/* Preview Card */}
              <div
                className="h-36 flex items-center justify-center relative overflow-hidden"
                style={{ background: t.preview + "18" }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  {[0,1,2,3,4].map((i) => (
                    <div key={i} className="absolute h-0.5 left-4 right-4 bg-[#131b2e]/30"
                      style={{ top: `${16 + i * 16}px` }} />
                  ))}
                </div>
                <div
                  className="w-16 h-20 rounded-lg shadow-xl flex flex-col overflow-hidden"
                  style={{ background: "white" }}
                >
                  <div className="h-4 w-full flex-shrink-0" style={{ background: t.preview }} />
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="mx-2 mt-1 h-1 rounded-full bg-[#c5c5d4]"
                      style={{ width: ["90%","70%","80%","60%"][i] }} />
                  ))}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#3a388b]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button className="px-4 py-2 bg-white text-[#3a388b] text-xs font-bold rounded-xl hover:scale-105 transition-transform">
                    Preview
                  </button>
                  <button className="px-4 py-2 bg-[#3a388b] text-white text-xs font-bold rounded-xl hover:scale-105 transition-transform border border-white/30">
                    Use This
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm text-[#131b2e] leading-tight">{t.name}</h3>
                  <span className="text-[10px] font-bold text-[#3a388b] bg-[#eaedff] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-[#454652] leading-relaxed mb-3 line-clamp-2">{t.desc}</p>
                <div className="flex items-center justify-between text-[10px] text-[#454652] font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">download</span>
                    {t.uses.toLocaleString()} uses
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {t.stars}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[64px] text-[#c5c5d4] block mb-4">search_off</span>
            <h3 className="font-bold text-[#131b2e] text-lg mb-2">No templates found</h3>
            <p className="text-[#454652] text-sm">Try a different search or category filter</p>
          </div>
        )}
      </div>

      <FloatingAIChat defaultAgent="editor" />
    </AppShell>
  );
}
