import { useState, useEffect } from 'react';
import { useMultiAgent } from '@/hooks/use-multi-agent';

interface AgentCardProps {
    name: string;
    role: string;
    specialty: string;
    emoji: string;
    description: string;
}

function AgentCard({ name, role, specialty, emoji, description }: AgentCardProps) {
    return (
        <div className="agent-card bg-white p-6 rounded-[2.5rem] border border-outline-variant/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {emoji}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full">Active</span>
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">{role}</p>
            <p className="text-xs text-outline leading-relaxed mb-6 italic opacity-70">&quot;{description}&quot;</p>
            <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/10">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{specialty}</span>
            </div>
        </div>
    );
}

export function AgentDashboard() {
    const { isAnalyzing, analysisResult, runIndustrialAnalysis } = useMultiAgent();
    const [sampleData] = useState({
        machines: [
            { name: "M1", trs: 78, oee: 65, availability: 85, performance: 82, quality: 92 },
            { name: "M2", trs: 82, oee: 71, availability: 88, performance: 85, quality: 95 },
            { name: "M3", trs: 65, oee: 52, availability: 75, performance: 78, quality: 88 }
        ],
        timeframe: "Last 24 Hours"
    });

    const handleAnalyze = async () => {
        try {
            await runIndustrialAnalysis('demo-ws', sampleData);
        } catch (error) {
            console.error('Analysis failed:', error);
        }
    };

    return (
        <div className="agent-dashboard space-y-10">
            {/* Hero Section */}
            <header className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-foreground font-manrope">
                        Agentic <span className="text-primary italic">Crew</span>
                    </h2>
                    <p className="text-outline uppercase text-[10px] font-black tracking-[0.4em] mt-2">Industrial Orchestration Hub</p>
                </div>
                <button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="group relative px-8 py-4 bg-inverse-surface text-inverse-on-surface rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    <span className="relative z-10">{isAnalyzing ? 'Orchestrating...' : 'Launch Global Analysis'}</span>
                    <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </header>

            {/* Results Display */}
            {analysisResult && (
                <div className="analysis-feed space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-outline ml-1">Live Intelligence Feed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {analysisResult.result.phases.map((phase: any, index: number) => (
                            <div key={index} className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-outline-variant/30 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20" />
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-[9px] font-black rounded-full">{index + 1}</span>
                                    <h4 className="text-xs font-black uppercase tracking-widest">{phase.agent}</h4>
                                </div>
                                <div className="h-40 overflow-y-auto text-xs text-outline leading-relaxed pr-2 font-medium">
                                    {phase.output}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AgentCard 
                    emoji="📊"
                    name="Chief Industrial Analyst"
                    role="Performance Expert"
                    specialty="OEE/TRS Optimization"
                    description="Expert in Lean Manufacturing. I identify root causes of machine downtime."
                />
                <AgentCard 
                    emoji="📝"
                    name="Strategic Writer"
                    role="Strategic Reporter"
                    specialty="Board Communications"
                    description="I translate technical data into high-impact executive summaries for stakeholders."
                />
                <AgentCard 
                    emoji="🎨"
                    name="Visual Content Manager"
                    role="Experience Designer"
                    specialty="Data Storytelling"
                    description="I structure information for visual impact and slide-ready layouts."
                />
                <AgentCard 
                    emoji="🔧"
                    name="Maintenance Master"
                    role="Predictive Specialist"
                    specialty="IoT Failure Forecast"
                    description="I monitor sensor health to predict breakdowns before they cost you productivity."
                />
                <AgentCard 
                    emoji="🔍"
                    name="Quality Guardian"
                    role="Assurance Expert"
                    specialty="ISO Compliance"
                    description="I ensure every process change maintains the peak quality standards of your catalog."
                />
            </div>

            {/* Performance Stats */}
            <footer className="pt-10 border-t border-outline-variant/20 flex gap-12">
                <div className="stat">
                    <p className="text-[9px] uppercase tracking-widest text-outline mb-1">Crew Latency</p>
                    <p className="text-lg font-black text-primary">1.2s</p>
                </div>
                <div className="stat">
                    <p className="text-[9px] uppercase tracking-widest text-outline mb-1">Knowledge Sync</p>
                    <p className="text-lg font-black text-primary">99.8%</p>
                </div>
                <div className="stat">
                    <p className="text-[9px] uppercase tracking-widest text-outline mb-1">Active Neural Path</p>
                    <p className="text-lg font-black text-primary">3/5 Agents</p>
                </div>
            </footer>
        </div>
    );
}
