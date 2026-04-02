import { useState, useEffect, useCallback } from 'react';
import { documents, analytics, Document } from '@/lib/api';

export interface AnalyticsVariable {
  id: string;
  kpi_name: string;
  source_doc: string;  // sheetId
  cell_range: string;
  aggregation: string;
}

export function useAnalyticsEngine(workspaceId: string) {
  const [availableSheets, setAvailableSheets] = useState<Document[]>([]);
  const [variables, setVariables] = useState<AnalyticsVariable[]>([]);
  const [mappedData, setMappedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documents.list(workspaceId);
      const sheets = docs.filter(d => d.doc_type === 'spreadsheet');
      setAvailableSheets(sheets);
      
      const { variables } = await analytics.getVariables(workspaceId);
      setVariables(variables);

      // Simple resolver: for each variable, find its value in the sheet content
      const resolvedData: Record<string, any> = {};
      for (const v of variables) {
          const sheet = sheets.find(s => s.id === v.source_doc);
          if (sheet && sheet.content) {
              const content = sheet.content as any;
              const cellData = content.cells?.[v.cell_range];
              resolvedData[v.kpi_name] = cellData?.computedValue ?? cellData?.value ?? 0;
          }
      }
      setMappedData(resolvedData);
    } catch (err) {
      console.error("Analytics sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const saveVariable = async (v: Omit<AnalyticsVariable, 'id'>) => {
    try {
      await analytics.createVariable(workspaceId, v);
      await loadAnalytics();
    } catch (err) {
      console.error("Failed to save variable:", err);
    }
  };

  return {
    availableSheets,
    variables,
    mappedData,
    isLoading,
    refreshManual: loadAnalytics,
    saveVariable
  };
}
