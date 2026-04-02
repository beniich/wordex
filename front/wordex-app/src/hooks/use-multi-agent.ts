import { useState } from 'react';

interface AgentAnalysisResult {
  success: boolean;
  analysis_type: string;
  result: any;
}

export function useMultiAgent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AgentAnalysisResult | null>(null);

  const runIndustrialAnalysis = async (workspaceId: string, data: any) => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/agents/orchestrate/industrial-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          data: data,
          analysis_type: 'industrial'
        })
      });
      
      const result = await response.json();
      setAnalysisResult(result);
      
      return result;
    } catch (error) {
      console.error('Agent analysis failed:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeSingleAgent = async (agentName: string, task: string, context: string = '') => {
    try {
      const response = await fetch('/api/agents/execute/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_name: agentName,
          task: task,
          context: context
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Single agent execution failed:', error);
      throw error;
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    runIndustrialAnalysis,
    executeSingleAgent
  };
}
