import { useState } from 'react';
import { useMultiAgent } from '@/hooks/use-multi-agent';

export function AgentWorkflowPanel() {
  const [workflowType, setWorkflowType] = useState<'industrial' | 'maintenance'>('industrial');
  const [sampleData, setSampleData] = useState({
    machines: [
      { name: "M1", trs: 78, oee: 65, availability: 85, performance: 82, quality: 92 },
      { name: "M2", trs: 82, oee: 71, availability: 88, performance: 85, quality: 95 },
      { name: "M3", trs: 65, oee: 52, availability: 75, performance: 78, quality: 88 }
    ],
    timeframe: "Semaine dernière"
  });
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<any>(null);
  const { runIndustrialAnalysis } = useMultiAgent();

  const runWorkflow = async () => {
    setIsRunning(true);
    setWorkflowResult(null);
    
    try {
      const result = await runIndustrialAnalysis('test_workspace', sampleData);
      setWorkflowResult(result);
    } catch (error) {
      console.error('Workflow failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="workflow-panel">
      <div className="workflow-controls border-r border-[#DCC6A0]/30 pr-6">
        <h3>🧪 Scénarios d'Analyse</h3>
        
        <div className="workflow-selector my-6 flex flex-col gap-3">
          <button 
            className={`workflow-btn p-4 rounded-xl border-2 text-left transition-all ${workflowType === 'industrial' ? 'border-[#A67B5B] bg-[#FFF5E6] shadow-md' : 'border-[#E0E0E0] bg-white'}`}
            onClick={() => setWorkflowType('industrial')}
          >
            <strong>🏭 Analyse Industrielle Complète</strong>
            <p className="text-[10px] opacity-60 mt-1 uppercase tracking-wider font-bold">Analyste → Rédacteur → Designer</p>
          </button>
          <button 
            className={`workflow-btn p-4 rounded-xl border-2 text-left transition-all ${workflowType === 'maintenance' ? 'border-[#A67B5B] bg-[#FFF5E6] shadow-md' : 'border-[#E0E0E0] bg-white'}`}
            onClick={() => setWorkflowType('maintenance')}
          >
            <strong>🔧 Prévision Maintenance</strong>
            <p className="text-[10px] opacity-60 mt-1 uppercase tracking-wider font-bold">Maintenance → Qualité</p>
          </button>
        </div>

        <div className="sample-data mb-6">
          <h4 className="text-[11px] uppercase tracking-widest font-black text-outline mb-2">Données d'Exemple</h4>
          <pre className="bg-[#f8f8f8] p-3 rounded-lg text-[10px] font-mono leading-relaxed max-height-[200px] overflow-auto border border-outline-variant/10">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </div>

        <button 
          onClick={runWorkflow}
          disabled={isRunning}
          className="run-workflow-btn w-full py-4 bg-gradient-to-r from-[#A67B5B] to-[#C9A56B] text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs"
        >
          {isRunning ? '⏳ Exécution en cours...' : '🚀 Lancer l\'Analyse Multi-Agents'}
        </button>
      </div>

      <div className="workflow-results flex-1 bg-white/50 backdrop-blur-sm rounded-2xl p-6 overflow-y-auto">
        <h3 className="mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            📊 Résultats de la Mission
        </h3>
        
        {workflowResult ? (
          <div className="results-content space-y-6">
            <div className="phases-timeline space-y-4">
              {workflowResult.result?.phases?.map((phase: any, index: number) => (
                <div key={index} className="phase-card bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="phase-header flex items-center justify-between mb-4 border-b border-outline-variant/10 pb-2">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                            {index + 1}
                        </span>
                        <h4 className="text-sm font-black text-foreground">{phase.agent}</h4>
                    </div>
                    {phase.tokens && (
                        <span className="text-[9px] font-bold text-outline-variant uppercase tracking-widest bg-surface px-2 py-0.5 rounded border border-outline-variant/20">
                            {phase.tokens} TOKENS
                        </span>
                    )}
                  </div>
                  <div className="phase-content text-xs text-outline leading-relaxed whitespace-pre-wrap font-medium font-manrope">
                    {phase.output}
                  </div>
                </div>
              ))}
            </div>
            
            {workflowResult.result?.summary && (
              <div className="summary-card bg-inverse-surface text-inverse-on-surface p-6 rounded-2xl shadow-xl mt-8">
                <h4 className="text-[10px] uppercase font-black tracking-[0.3em] mb-4 opacity-70">📈 Résumé de l'Exécution</h4>
                <div className="flex gap-12">
                  <div className="stat-item">
                    <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Total Tokens</p>
                    <p className="text-xl font-black">{workflowResult.result.summary.total_tokens}</p>
                  </div>
                  <div className="stat-item">
                    <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Agents Actifs</p>
                    <p className="text-xl font-black">3</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-12">
            {isRunning ? (
              <div className="loading-state flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-bold text-sm">Les agents partagent leurs analyses...</p>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[64px] mb-4">robot_2</span>
                <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Sélectionnez un scénario et lancez la collaboration pour voir la puissance de Wordex Crew.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .workflow-panel {
          display: flex;
          gap: 24px;
          height: calc(100vh - 200px);
        }
        .workflow-controls {
          width: 380px;
        }
      `}</style>
    </div>
  );
}
