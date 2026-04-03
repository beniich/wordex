import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { documents as sheets } from '@/lib/api';
import { HyperFormula } from 'hyperformula';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  bg?: string;
  fontSize?: number;
}

export interface CellData {
  value: unknown;
  formula?: string;
  computedValue?: unknown;
  format?: string;
  style?: CellStyle;
  lastModified: Date;
}

export interface SheetMetadata {
  columns: number;
  rows: number;
  title: string;
  createdAt: string;
  lastModified: string;
  version: number;
  activeSheetIndex?: number;
  sheetNames?: string[];
  [key: string]: unknown;
}

export interface SheetData {
  cells: Record<string, CellData>; // key format: "sheetIndex!cellId" e.g. "0!A1"
  metadata: SheetMetadata;
}

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
  const [activeSheet, setActiveSheet] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const hfInst = useRef<HyperFormula | null>(null);

  useEffect(() => {
    if (!hfInst.current) {
      hfInst.current = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
    }
  }, []);

  const loadSheetData = useCallback(async (id: string) => {
    try {
      const doc = await sheets.get(id);
      let sData: SheetData;
      
      const defaultData: SheetData = {
          cells: {}, 
          metadata: { 
            title: doc?.title || "Untitled", 
            createdAt: new Date().toISOString(), 
            lastModified: new Date().toISOString(), 
            version: 1, 
            columns: 26, 
            rows: 100, 
            activeSheetIndex: 0,
            sheetNames: ["Sheet 1"]
          }
      };

      if (!doc || !doc.content) {
         sData = defaultData;
      } else {
         sData = doc.content as unknown as SheetData;
         if (!sData.metadata) sData.metadata = defaultData.metadata;
         if (!sData.cells) sData.cells = {};
         if (!sData.metadata.sheetNames) sData.metadata.sheetNames = ["Sheet 1"];
      }
      
      const hf = hfInst.current!;
      
      // Ensure at least one sheet exists
      if (hf.getSheetNames().length === 0) {
         hf.addSheet("Sheet1");
      } else {
         hf.clearSheet(0);
      }
      
      const data: unknown[][] = [];
      Object.entries(sData.cells).forEach(([fullId, cell]) => {
         const [sIdxStr, cellId] = fullId.includes('!') ? fullId.split('!') : ["0", fullId];
         if (parseInt(sIdxStr) !== 0) return; // currently only handles index 0 formulas for sync

         const [c, r] = parseCellId(cellId);
         while (data.length <= r) data.push([]);
         for (let i = 0; i <= r; i++) if (!data[i]) data[i] = [];
         while (data[r].length <= c) data[r].push("");
         data[r][c] = cell.formula || cell.value?.toString() || "";
      });
      
      hf.setSheetContent(0, data as (string | number | null)[][]);
      
      const updatedCells = { ...sData.cells };
      Object.keys(updatedCells).forEach(fullId => {
         const [sIdxStr, id] = fullId.includes('!') ? fullId.split('!') : ["0", fullId];
         const [col, row] = parseCellId(id);
         if (updatedCells[fullId].formula && parseInt(sIdxStr) === 0) {
            updatedCells[fullId].computedValue = hf.getCellValue({ sheet: 0, col, row });
         }
      });
      
      setSheetData({ ...sData, cells: updatedCells });
      setActiveSheet(sData.metadata.activeSheetIndex || 0);
    } catch (error) {
      console.error('Failed to load sheet:', error);
    }
  }, []);

  useEffect(() => {
    if (sheetId && hfInst.current) {
       loadSheetData(sheetId);
    }
  }, [sheetId, loadSheetData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (cells: Record<string, CellData>, currentMetadata: SheetMetadata) => {
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        await sheets.update(sheetId, {
          content: { cells, metadata: { ...currentMetadata, lastModified: new Date().toISOString() } }
        });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('unsaved');
        console.error('Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [sheetId]
  );

  const updateCell = async (cellId: string, newValue: unknown, style?: CellStyle) => {
    if (!sheetData || !hfInst.current) return;
    const hf = hfInst.current;
    
    const fullId = `${activeSheet}!${cellId}`;
    const [c, r] = parseCellId(cellId);

    const updatedCells = { ...sheetData.cells };
    const cellToUpdate = updatedCells[fullId] || { value: newValue, lastModified: new Date() };

    if (newValue !== undefined) {
      const valToSet = typeof newValue === 'number' ? newValue : (newValue?.toString() || "");
      if (activeSheet === 0) hf.setCellContents({ sheet: 0, col: c, row: r }, [[valToSet]]);
      
      cellToUpdate.value = newValue;
      if (typeof newValue === 'string' && newValue.startsWith('=')) {
        cellToUpdate.formula = newValue;
        if (activeSheet === 0) cellToUpdate.computedValue = hf.getCellValue({ sheet: 0, col: c, row: r });
      } else {
        delete cellToUpdate.formula;
        delete cellToUpdate.computedValue;
      }
    }

    if (style) {
      cellToUpdate.style = { ...(cellToUpdate.style || {}), ...style };
    }

    cellToUpdate.lastModified = new Date();
    updatedCells[fullId] = cellToUpdate;

    // Refresh formula dependencies (simplified)
    Object.keys(updatedCells).forEach(id => {
       if (updatedCells[id].formula) {
          const [sIdx, cid] = id.includes('!') ? id.split('!') : ["0", id];
          if (parseInt(sIdx) === 0) {
             const [cc, rr] = parseCellId(cid);
             updatedCells[id].computedValue = hf.getCellValue({ sheet: 0, col: cc, row: rr });
          }
       }
    });

    const newSheetData = { ...sheetData, cells: updatedCells };
    setSheetData(newSheetData);
    setSaveStatus('unsaved');
    debouncedSave(updatedCells, sheetData.metadata);
  };

  const addSheet = () => {
     if (!sheetData) return;
     const names = [...(sheetData.metadata.sheetNames || ["Sheet 1"])];
     const nextNum = names.length + 1;
     names.push(`Sheet ${nextNum}`);
     const newMetadata = { ...sheetData.metadata, sheetNames: names };
     setSheetData({ ...sheetData, metadata: newMetadata });
     setSaveStatus('unsaved');
     debouncedSave(sheetData.cells, newMetadata);
  };

  return {
    sheetData,
    updateCell,
    saveStatus,
    activeSheet,
    setActiveSheet,
    addSheet,
    isSaving,
    SaveIndicator: () => (
      <div className={`save-indicator ${saveStatus} text-[10px] text-white/80 font-bold uppercase flex items-center gap-1`}>
         {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
      </div>
    )
  };
}
