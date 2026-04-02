import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { documents as sheets } from '@/lib/api';
import { HyperFormula } from 'hyperformula';

export interface CellData {
  value: unknown;
  formula?: string;
  computedValue?: unknown;
  format?: string;
  lastModified: Date;
}

export interface SheetMetadata {
  columns: number;
  rows: number;
  title: string;
  createdAt: string;
  lastModified: string;
  version: number;
  [key: string]: unknown;
}

export interface SheetData {
  cells: Record<string, CellData>;
  metadata: SheetMetadata;
}

// Convert "A1" to [col, row], 0-indexed. Example "B3" -> [1, 2]
function parseCellId(cellId: string): [number, number] {
  const match = cellId.match(/^([a-zA-Z]+)(\d+)$/);
  if (!match) return [0, 0];
  let col = 0;
  const letters = match[1].toUpperCase();
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return [col - 1, parseInt(match[2], 10) - 1];
}

export function useAdvancedSheetEngine(sheetId: string) {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const hfInst = useRef<HyperFormula | null>(null);

  useEffect(() => {
    if (!hfInst.current) {
      hfInst.current = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
      hfInst.current.addSheet('Sheet1');
    }
  }, []);

  useEffect(() => {
    if (sheetId && hfInst.current) {
       loadSheetData(sheetId);
    }
     
  }, [sheetId]);

  // ── Real-time Remote Sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sheetId || typeof window === 'undefined') return;

    const token = localStorage.getItem("wordex_access_token");
    if (!token) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/notifications/stream?token=${token}`;
    const es = new EventSource(url);

    es.onerror = () => {
      console.warn("[SSE] Spreadsheet sync connection failed, retrying...");
      es.close();
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'sheet.updated' && payload.data.document_id === sheetId) {
          console.log("[SSE] Remote update detected for sheet", sheetId);
          // Reload the document from server
          loadSheetData(sheetId);
        }
      } catch (err) {
        // Heartbeats or unknown data
      }
    };

    return () => es.close();
  }, [sheetId]);

  const loadSheetData = async (id: string) => {
    try {
      const doc = await sheets.get(id);
      let sData: SheetData;
      
      const defaultData: SheetData = {
          cells: {}, 
          metadata: { title: doc?.title || "Untitled", createdAt: new Date().toISOString(), lastModified: new Date().toISOString(), version: 1, columns: 26, rows: 100 }
      };

      if (!doc || !doc.content) {
         sData = defaultData;
      } else {
         sData = doc.content as unknown as SheetData;
         if (!sData.metadata) sData.metadata = defaultData.metadata;
         if (!sData.cells) sData.cells = {};
      }
      
      const hf = hfInst.current!;
      hf.clearSheet(0);
      
      const data: unknown[][] = [];
      Object.entries(sData.cells).forEach(([cellId, cell]) => {
         const [c, r] = parseCellId(cellId);
         while (data.length <= r) {
            data.push([]);
         }
         for (let i = 0; i <= r; i++) {
            if (!data[i]) data[i] = [];
         }
         while (data[r].length <= c) {
            data[r].push("");
         }
         data[r][c] = cell.formula || cell.value?.toString() || "";
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hf.setSheetContent(0, data as any);
      
      const newCells = { ...sData.cells };
      Object.keys(newCells).forEach(cellId => {
         const [col, row] = parseCellId(cellId);
         if (newCells[cellId].formula) {
            newCells[cellId].computedValue = hf.getCellValue({ sheet: 0, col, row });
         }
      });
      
      sData.cells = newCells;
      setSheetData(sData);
    } catch (error) {
      console.error('Failed to load sheet:', error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (cells: Record<string, CellData>, currentMetadata: Record<string, unknown>) => {
      setIsSaving(true);
      setSaveStatus('saving');
      
      try {
        await sheets.update(sheetId, {
          content: {
            cells,
            metadata: {
              ...currentMetadata,
              lastModified: new Date().toISOString()
            }
          }
        });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('unsaved');
        console.error('Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [sheetId]
  );

  const updateCell = async (cellId: string, newValue: unknown) => {
    if (!sheetData || !hfInst.current) return;
    const hf = hfInst.current;
    const [c, r] = parseCellId(cellId);

    const valToSet = typeof newValue === 'number' ? newValue : (newValue?.toString() || "");
    hf.setCellContents({ sheet: 0, col: c, row: r }, [[valToSet]]);

    const updatedCells = { ...sheetData.cells };
    const cellToUpdate = updatedCells[cellId] || { value: newValue, lastModified: new Date() };

    cellToUpdate.value = newValue;
    cellToUpdate.lastModified = new Date();

    if (typeof newValue === 'string' && newValue.startsWith('=')) {
      cellToUpdate.formula = newValue;
      cellToUpdate.computedValue = hf.getCellValue({ sheet: 0, col: c, row: r });
    } else {
      delete cellToUpdate.formula;
      delete cellToUpdate.computedValue;
    }

    updatedCells[cellId] = cellToUpdate;

    // Refresh dependencies
    Object.keys(updatedCells).forEach(id => {
       if (updatedCells[id].formula && id !== cellId) {
          const [cc, rr] = parseCellId(id);
          updatedCells[id].computedValue = hf.getCellValue({ sheet: 0, col: cc, row: rr });
       }
    });

    const newSheetData = {
      ...sheetData,
      cells: updatedCells,
      metadata: {
        ...sheetData.metadata,
        lastModified: new Date().toISOString(),
        version: (sheetData.metadata.version || 0) + 1
      }
    };

    setSheetData(newSheetData);
    setSaveStatus('unsaved');
    debouncedSave(updatedCells, sheetData.metadata);
  };

  const SaveIndicator = () => (
    <div className={`save-indicator ${saveStatus} text-sm flex items-center gap-2`}>
      {saveStatus === 'saving' && (
        <>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-outline font-bold text-xs">Sauvegarde...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <span className="text-emerald-500 font-bold material-symbols-outlined text-[14px]">check_circle</span>
          <span className="text-slate-500 font-bold text-xs">Sauvegardé</span>
        </>
      )}
      {saveStatus === 'unsaved' && (
        <>
          <span className="text-amber-500 font-bold material-symbols-outlined text-[14px]">warning</span>
          <span className="text-slate-500 font-bold text-xs">Modifications non sauvegardées</span>
        </>
      )}
    </div>
  );

  return {
    sheetData,
    updateCell,
    saveStatus,
    SaveIndicator,
    isSaving
  };
}
