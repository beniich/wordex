import { useState, useRef, useEffect, useCallback } from 'react';
import { useAdvancedSheetEngine, CellStyle } from '@/hooks/useAdvancedSheetEngine';
import * as XLSX from 'xlsx';

// Helper for Material Symbols
const Icon = ({ name, size = 18, color = 'currentColor', className = "" }: { name: string, size?: number, color?: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, color }}>{name}</span>
);

interface CellPosition {
  row: number;
  col: number;
}

type SuiteTheme = 'sablecuivre' | 'excel' | 'openoffice';

export function ExcelStyleSheet({ sheetId, embedded = false }: { sheetId: string, embedded?: boolean }) {
  const { sheetData, updateCell, saveStatus, activeSheet, setActiveSheet, addSheet } = useAdvancedSheetEngine(sheetId);
  
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [formulaBar, setFormulaBar] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [suiteTheme, setSuiteTheme] = useState<SuiteTheme>('sablecuivre');
  
  const gridRef = useRef<HTMLDivElement>(null);
  const rows = 100;
  const cols = 26; 

  const getColumnLetter = (colIndex: number): string => {
    let letter = '';
    let curr = colIndex;
    while (curr >= 0) {
      letter = String.fromCharCode(65 + (curr % 26)) + letter;
      curr = Math.floor(curr / 26) - 1;
    }
    return letter;
  };

  const getCellState = useCallback((row: number, col: number) => {
    if (!sheetData) return null;
    const cellId = `${getColumnLetter(col)}${row + 1}`;
    return sheetData.cells[`${activeSheet}!${cellId}`];
  }, [sheetData, activeSheet]);

  const getCellValue = useCallback((row: number, col: number): string | number => {
    const cell = getCellState(row, col);
    const value = cell?.computedValue ?? cell?.value ?? '';
    return (typeof value === 'object' && value !== null) ? '' : (value as string | number);
  }, [getCellState]);

  const handleCellClick = (row: number, col: number) => {
    setActiveCell({ row, col });
    setIsEditing(false);
    const cellValue = getCellValue(row, col);
    setFormulaBar(typeof cellValue === 'string' ? cellValue : String(cellValue));
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setActiveCell({ row, col });
    setIsEditing(true);
  };

  const toggleStyle = (style: CellStyle) => {
    const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
    const current = getCellState(activeCell.row, activeCell.col)?.style || {};
    
    // Toggle logic for booleans
    const newStyle: any = { ...style };
    if (style.bold !== undefined) newStyle.bold = !current.bold;
    if (style.italic !== undefined) newStyle.italic = !current.italic;
    if (style.underline !== undefined) newStyle.underline = !current.underline;

    updateCell(cellId, undefined, newStyle);
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
    updateCell(cellId, undefined, { align });
  };

  const handleAutoSum = () => {
    let r = activeCell.row - 1;
    let foundNumbers = false;
    let startRow = activeCell.row;
    
    while (r >= 0) {
      const val = getCellValue(r, activeCell.col);
      if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && val !== '')) {
        foundNumbers = true;
        startRow = r;
        r--;
      } else {
        break;
      }
    }

    const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
    if (foundNumbers) {
      const formula = `=SUM(${getColumnLetter(activeCell.col)}${startRow + 1}:${getColumnLetter(activeCell.col)}${activeCell.row})`;
      updateCell(cellId, formula);
      setFormulaBar(formula);
    }
  };

  const handleSort = (direction: 'asc' | 'desc') => {
    // Basic sorting logic for the current column's view (mocking full engine sort for now)
    console.log(`Sorting column ${getColumnLetter(activeCell.col)} ${direction}`);
    // In a real app, this would trigger a re-ordering of row data in HyperFormula
  };

  const handleClearCell = () => {
    const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
    updateCell(cellId, "");
    setFormulaBar("");
  };

  const exportToODS = () => {
    if (!sheetData) return;
    const wb = XLSX.utils.book_new();
    const sheetNames = sheetData.metadata.sheetNames || ["Sheet 1"];
    
    sheetNames.forEach((name, sIdx) => {
       const data: any[][] = [];
       for (let r = 0; r < 50; r++) {
          const rowData: any[] = [];
          for (let c = 0; c < 20; c++) {
             const cellId = `${getColumnLetter(c)}${r + 1}`;
             const cell = sheetData.cells[`${sIdx}!${cellId}`];
             rowData.push(cell?.computedValue ?? cell?.value ?? "");
          }
          data.push(rowData);
       }
       const ws = XLSX.utils.aoa_to_sheet(data);
       XLSX.utils.book_append_sheet(wb, ws, name);
    });

    const fileName = `${sheetData.metadata.title || 'Wordex_Spreadsheet'}.ods`;
    XLSX.writeFile(wb, fileName, { bookType: 'ods' });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (isEditing) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: Math.max(0, prev.row - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: Math.min(rows - 1, prev.row + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, col: Math.max(0, prev.col - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, col: Math.min(cols - 1, prev.col + 1) }));
          break;
        case 'Enter':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: Math.min(rows - 1, prev.row + 1) }));
          break;
        case 'Backspace':
        case 'Delete':
          const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
          updateCell(cellId, "");
          break;
        case 'F2':
        case 'f2':
          e.preventDefault();
          setIsEditing(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, isEditing, updateCell]);

  if (!sheetData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F1E6]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
           <p className="font-bold text-xs uppercase tracking-widest text-[#A67B5B]">Chargement du moteur Wordex...</p>
        </div>
      </div>
    );
  }

  const currentStyles = getCellState(activeCell.row, activeCell.col)?.style || {};
  const isOO = suiteTheme === 'openoffice';
  const isSable = suiteTheme === 'sablecuivre';

  const themeColors = {
    primary: isSable ? '#A67B5B' : (isOO ? '#004494' : '#107c41'),
    secondary: isSable ? '#894d0d' : (isOO ? '#003370' : '#0d6b38'),
    bg: isSable ? '#F5F1E6' : (isOO ? '#f4f4f4' : '#f3f2f1'),
    grid: isSable ? '#D2B48C' : (isOO ? '#cccccc' : '#edebe9'),
    text: isSable ? '#4A3728' : (isOO ? '#000000' : '#201f1e')
  };

  return (
    <div className={`wordex-spreadsheet h-full w-full flex flex-col font-sans overflow-hidden transition-all duration-500`} style={{ backgroundColor: themeColors.bg, color: themeColors.text }}>
      
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className={`h-12 flex items-center px-4 justify-between shrink-0 transition-colors shadow-md`} style={{ backgroundColor: themeColors.primary }}>
         <div className="flex items-center gap-4">
            <button title="Apps" className="hover:bg-black/10 p-1 rounded-md text-white">
               <Icon name="apps" size={20} />
            </button>
            <div className="flex items-center gap-2">
               {isOO ? (
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden">
                        <div className="w-4 h-4 bg-[#004494] flex items-center justify-center text-white text-[8px] font-bold">OO</div>
                     </div>
                     <span className="text-white font-semibold text-sm">OpenOffice Calc</span>
                  </div>
               ) : isSable ? (
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-[#894d0d] rounded flex items-center justify-center text-[#F5F1E6] font-bold text-xs shadow-sm">W</div>
                     <span className="text-white font-black tracking-tighter text-sm uppercase">Wordex Sheet</span>
                  </div>
               ) : (
                  <>
                     <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[#107c41] font-black text-xs shadow-sm">X</div>
                     <span className="text-white font-semibold text-sm">Excel</span>
                  </>
               )}
            </div>
            <div className={`h-12 flex items-center px-4 mx-4 transition-colors`} style={{ backgroundColor: themeColors.secondary }}>
               <span className="text-white text-xs font-bold uppercase tracking-wider">{sheetData.metadata.title} — {saveStatus === 'saved' ? 'Synchronisé' : 'En cours...'}</span>
            </div>
            
            <div className="relative flex-1 max-w-md hidden lg:block">
               <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
               <input 
                 title="Rechercher une commande"
                 type="text" 
                 placeholder="Actions Wordex..." 
                 className="w-full h-8 bg-white/10 rounded px-10 text-xs text-white placeholder:text-white/70 border-none outline-none focus:bg-white focus:text-[#4A3728] transition-all"
               />
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white text-[10px] uppercase font-black mr-4">
               <span className="opacity-50">Theme Mode</span>
               <div className="flex bg-black/20 p-0.5 rounded-full">
                  <div title="Sable Cuivre" onClick={() => setSuiteTheme('sablecuivre')} className={`w-5 h-5 rounded-full cursor-pointer transition-all ${isSable ? 'bg-[#A67B5B] shadow-lg scale-110' : 'hover:bg-white/10'}`} />
                  <div title="Excel Online" onClick={() => setSuiteTheme('excel')} className={`w-5 h-5 rounded-full cursor-pointer transition-all ${suiteTheme === 'excel' ? 'bg-[#107c41] shadow-lg scale-110' : 'hover:bg-white/10'}`} />
                  <div title="OpenOffice Calc" onClick={() => setSuiteTheme('openoffice')} className={`w-5 h-5 rounded-full cursor-pointer transition-all ${isOO ? 'bg-[#004494] shadow-lg scale-110' : 'hover:bg-white/10'}`} />
               </div>
            </div>
            <button onClick={exportToODS} title="Exporter au format industriel (.ods)" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase transition-all shadow-md active:scale-95">
               <Icon name="file_download" size={16} />
               <span>Export ODS</span>
            </button>
            <div className={`w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center text-white text-[10px] font-black cursor-pointer bg-[#894d0d] shadow-lg`}>WS</div>
         </div>
      </div>

      {/* ── Ribbon Tabs ───────────────────────────────────────────────────── */}
      <div className={`h-8 border-b flex items-center px-4 shrink-0 transition-colors shadow-sm`} style={{ backgroundColor: isSable ? '#E8DFD0' : (isOO ? '#f0f0f0' : 'white'), borderColor: themeColors.grid }}>
         {['Fichier', 'Accueil', 'Insertion', 'Formules', 'Données', 'Révision', 'Affichage'].map(tab => (
           <button 
             key={tab} 
             title={tab}
             onClick={() => setActiveTab(tab)}
             className={`h-full px-5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center transition-all relative ${activeTab === tab ? `text-[${themeColors.primary}] after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-[${themeColors.primary}]` : 'text-[#8B7E74] hover:bg-black/5'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* ── Dynamic Ribbon Content ─────────────────────────────────────────── */}
      <div className={`h-28 border-b flex items-center px-6 gap-8 shrink-0 overflow-x-auto no-scrollbar shadow-inner transition-all`} style={{ backgroundColor: isSable ? '#FAF7F0' : (isOO ? '#f8f8f8' : 'white'), borderColor: themeColors.grid }}>
         
         {activeTab === 'Fichier' && (
            <div className="flex items-center gap-6 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center text-[#894d0d] hover:bg-orange-200/50 transition-all">
                     <Icon name="description" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter">Nouveau</span>
               </div>
               <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={exportToODS}>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#894d0d] hover:bg-orange-100 transition-all">
                     <Icon name="file_download" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter">Exporter ODS</span>
               </div>
               <div className="flex flex-col items-center gap-1 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                     <Icon name="print" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter">Imprimer</span>
               </div>
            </div>
         )}

         {activeTab === 'Accueil' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1.5 border-r border-black/5 pr-8">
                  <div className="flex items-center gap-3">
                     <div className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer transition-all active:scale-95 group">
                        <Icon name="content_paste" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-70">Coller</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <button className="flex items-center gap-2 p-1 hover:bg-black/5 rounded text-[9px] font-bold uppercase"><Icon name="content_cut" size={14} /> Couper</button>
                        <button className="flex items-center gap-2 p-1 hover:bg-black/5 rounded text-[9px] font-bold uppercase"><Icon name="content_copy" size={14} /> Copier</button>
                     </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Presse-papiers</span>
               </div>

               <div className="flex flex-col items-center gap-1.5 border-r border-black/5 pr-8">
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl">
                        <button title="Gras" onClick={() => toggleStyle({ bold: true })} className={`p-2 rounded-lg transition-all ${currentStyles.bold ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_bold" size={18} /></button>
                        <button title="Italique" onClick={() => toggleStyle({ italic: true })} className={`p-2 rounded-lg transition-all ${currentStyles.italic ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_italic" size={18} /></button>
                        <button title="Souligné" onClick={() => toggleStyle({ underline: true })} className={`p-2 rounded-lg transition-all ${currentStyles.underline ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_underlined" size={18} /></button>
                     </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Police</span>
               </div>

               <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-0.5 bg-black/5 p-1 rounded-xl">
                        <button onClick={() => setAlignment('left')} className={`p-2 rounded-lg ${currentStyles.align === 'left' ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_align_left" size={18} /></button>
                        <button onClick={() => setAlignment('center')} className={`p-2 rounded-lg ${currentStyles.align === 'center' ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_align_center" size={18} /></button>
                        <button onClick={() => setAlignment('right')} className={`p-2 rounded-lg ${currentStyles.align === 'right' ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}><Icon name="format_align_right" size={18} /></button>
                     </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Alignement</span>
               </div>
            </div>
         )}

         {activeTab === 'Insertion' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer" onClick={() => addSheet()}>
                        <Icon name="note_add" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Feuille</span>
                     </div>
                     <div className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer">
                        <Icon name="table_rows" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Tableau</span>
                     </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Objets</span>
               </div>
            </div>
         )}

         {activeTab === 'Formules' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={handleAutoSum}
                        className="flex flex-col items-center p-2 bg-[#894d0d]/10 text-[#894d0d] rounded-xl hover:bg-[#894d0d]/20 transition-all font-black"
                     >
                        <Icon name="functions" size={24} />
                        <span className="text-[8px] uppercase mt-1">Somme Auto</span>
                     </button>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Bibliothèque</span>
               </div>
            </div>
         )}

         {activeTab === 'Données' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-3">
                     <div 
                        onClick={() => handleSort('asc')}
                        className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer"
                     >
                        <Icon name="sort" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Trier</span>
                     </div>
                     <div className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer">
                        <Icon name="filter_list" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Filtrer</span>
                     </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Organisation</span>
               </div>
               <div className="flex flex-col items-center gap-1.5">
                   <div 
                     onClick={handleClearCell}
                     className="flex flex-col items-center p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer transition-all"
                   >
                      <Icon name="backspace" size={24} />
                      <span className="text-[9px] font-bold mt-1 uppercase">Effacer</span>
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Nettoyage</span>
               </div>
            </div>
         )}

         {activeTab === 'Affichage' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
               <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
                      <button onClick={() => setSuiteTheme('sablecuivre')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isSable ? 'bg-[#894d0d] text-white shadow-md' : 'hover:bg-white/50'}`}>Sable</button>
                      <button onClick={() => setSuiteTheme('excel')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${suiteTheme === 'excel' ? 'bg-[#107c41] text-white shadow-md' : 'hover:bg-white/50'}`}>Excel</button>
                      <button onClick={() => setSuiteTheme('openoffice')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isOO ? 'bg-[#004494] text-white shadow-md' : 'hover:bg-white/50'}`}>Calc</button>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Mode Thème</span>
               </div>
            </div>
         )}
         
         {activeTab === 'Révision' && (
            <div className="flex items-center gap-8 animate-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col items-center gap-1.5">
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center p-2 hover:bg-black/5 rounded-xl cursor-pointer">
                        <Icon name="add_comment" size={24} color={themeColors.primary} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Commentaire</span>
                      </div>
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Outils de Relecture</span>
                </div>
            </div>
         )}

      </div>

      {/* ── Formula Bar ────────────────────────────────────────────────────── */}
      <div className={`h-10 flex items-center border-b shrink-0 px-2 gap-2 transition-colors border-black/5 shadow-sm`} style={{ backgroundColor: isSable ? '#F2E9DC' : 'white' }}>
         <div className={`w-16 h-7 rounded-md flex items-center justify-center text-[11px] font-black tracking-widest bg-black/5`} style={{ color: themeColors.primary }}>
           {getColumnLetter(activeCell.col)}{activeCell.row + 1}
         </div>
         <div className="w-px h-5 bg-black/10" />
         <div className={`w-10 h-full flex items-center justify-center`} style={{ color: themeColors.primary }}>
            <Icon name="functions" size={20} />
         </div>
         <div className="w-px h-5 bg-black/10" />
         <input 
           title="Barre de formule"
           type="text" 
           value={formulaBar}
           onChange={(e) => setFormulaBar(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               updateCell(`${getColumnLetter(activeCell.col)}${activeCell.row + 1}`, formulaBar);
               setIsEditing(false);
             }
           }}
           className={`flex-1 h-8 rounded-lg outline-none px-4 text-xs font-medium transition-all ${isSable ? 'bg-white shadow-inner focus:shadow-md' : 'bg-transparent'}`}
           placeholder="Insérer une formule ou du texte..."
         />
      </div>

      {/* ── Grid Container ─────────────────────────────────────────────────── */}
      <div className={`flex-1 relative overflow-auto no-scrollbar overflow-x-auto`} ref={gridRef}>
         <div className="inline-block min-w-full">
            {/* Headers */}
            <div className="flex sticky top-0 z-40 bg-inherit shadow-md">
               <div className={`w-12 h-8 shrink-0 border-r border-b flex items-center justify-center sticky left-0 z-50`} style={{ backgroundColor: themeColors.bg, borderColor: themeColors.grid }}>
                  <Icon name="dashboard" size={14} className="opacity-30" />
               </div>
               {Array.from({ length: cols }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-28 h-8 shrink-0 border-r border-b flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all ${activeCell.col === i ? `bg-[${themeColors.primary}] text-white shadow-md z-10` : 'text-[#8B7E74]'}`}
                   style={{ borderColor: themeColors.grid, backgroundColor: activeCell.col === i ? themeColors.primary : 'transparent' }}
                 >
                   {getColumnLetter(i)}
                 </div>
               ))}
            </div>

            {/* Rows */}
            <div className="flex">
               {/* Fixed Row Headers */}
               <div className="flex flex-col sticky left-0 z-30 shadow-md">
                  {Array.from({ length: rows }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-12 h-7 shrink-0 border-r border-b flex items-center justify-center text-[10px] font-bold transition-all ${activeCell.row === i ? `bg-[${themeColors.primary}] text-white shadow-md z-10` : 'text-[#8B7E74]'}`}
                      style={{ borderColor: themeColors.grid, backgroundColor: activeCell.row === i ? themeColors.primary : 'transparent' }}
                    >
                      {i + 1}
                    </div>
                  ))}
               </div>

               {/* Cells Grid */}
               <div className="relative">
                  {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex">
                       {Array.from({ length: cols }).map((_, c) => {
                         const isActive = activeCell.row === r && activeCell.col === c;
                         const state = getCellState(r, c);
                         const value = state?.computedValue ?? state?.value ?? '';
                         const style = state?.style || {};
                         const cellId = `${getColumnLetter(c)}${r + 1}`;
                         
                         return (
                           <div 
                             key={c}
                             onClick={() => handleCellClick(r, c)}
                             onDoubleClick={() => handleCellDoubleClick(r, c)}
                             className={`w-28 h-7 border-r border-b px-2 py-0.5 text-[11px] truncate transition-all cursor-cell relative overflow-hidden ${isActive ? `ring-2 ring-inset z-10 shadow-lg` : ''}`}
                             style={{
                               fontWeight: style.bold ? 'bold' : 'normal',
                               fontStyle: style.italic ? 'italic' : 'normal',
                               textDecoration: style.underline ? 'underline' : 'none',
                               textAlign: style.align || 'left',
                               color: style.color || 'inherit',
                               borderColor: themeColors.grid,
                               backgroundColor: style.bg || (isActive ? (isSable ? '#FAF3E0' : (isOO ? '#cfe7f5' : '#f3f9f5')) : (isSable && r % 2 === 0 ? '#FDFBF7' : 'white')),
                               ringColor: themeColors.primary
                             }}
                           >
                             {isEditing && isActive ? (
                                <input 
                                  title="Cellule en cours d'édition"
                                  autoFocus 
                                  className="w-full h-full outline-none border-none bg-transparent font-bold"
                                  value={formulaBar}
                                  onChange={(e) => setFormulaBar(e.target.value)}
                                  onBlur={() => { setIsEditing(false); updateCell(cellId, formulaBar); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditing(false); updateCell(cellId, formulaBar); } }}
                                />
                             ) : (value as string | number)}
                             {isActive && <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-tl-sm shadow-sm" style={{ backgroundColor: themeColors.primary }} />}
                           </div>
                         );
                       })}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────── */}
      <div className={`h-8 border-t shrink-0 flex items-center px-4 justify-between transition-colors shadow-inner`} style={{ backgroundColor: isSable ? '#E8DFD0' : (isOO ? '#f0f0f0' : '#f3f2f1'), borderColor: themeColors.grid }}>
         <div className="flex items-center h-full">
            <div className={`flex items-center gap-3 px-4 hover:bg-black/5 h-full cursor-pointer transition-colors border-r opacity-50`} style={{ borderColor: themeColors.grid }}>
               <Icon name="first_page" size={16} />
               <Icon name="last_page" size={16} />
            </div>
            <div className="flex items-center h-full">
               {(sheetData.metadata.sheetNames || ["Feuille 1"]).map((name, idx2) => (
                 <button 
                   key={idx2} 
                   title={`Basculer vers ${name}`}
                   onClick={() => setActiveSheet(idx2)}
                   className={`h-full px-6 flex items-center border-x text-[10px] font-black uppercase tracking-widest transition-all relative ${activeSheet === idx2 ? `bg-white shadow-md z-10` : 'opacity-50 hover:bg-black/5'}`}
                   style={{ color: activeSheet === idx2 ? themeColors.primary : themeColors.text, borderColor: themeColors.grid }}
                 >
                    {name}
                    {activeSheet === idx2 && <div className="absolute bottom-0 left-0 w-full h-[3px]" style={{ backgroundColor: themeColors.primary }} />}
                 </button>
               ))}
               <button title="Ajouter une feuille" onClick={addSheet} className="h-full px-4 hover:bg-black/5 flex items-center transition-colors">
                  <Icon name="add_circle" size={18} color={themeColors.primary} />
               </button>
            </div>
            <div className="w-px h-4 mx-4 bg-black/10" />
            <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-wider opacity-60">
               <span className="flex items-center gap-1"><Icon name="verified_user" size={12} /> Standard Wordex Artisanal</span>
               <span className="flex items-center gap-1"><Icon name="sync_alt" size={12} /> Cloud Sync: OK</span>
            </div>
         </div>

         <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-wider opacity-60">
            <div className="flex items-center gap-3 pr-4">
               <Icon name="zoom_out" size={16} className="cursor-pointer hover:scale-110" />
               <div className={`w-32 h-1 rounded-full relative bg-black/10`}>
                  <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md cursor-pointer hover:scale-110 active:scale-95`} style={{ backgroundColor: themeColors.primary }} />
               </div>
               <Icon name="zoom_in" size={16} className="cursor-pointer hover:scale-110" />
               <span className="w-10">100%</span>
            </div>
         </div>
      </div>

      {/* Bottom Floating Save Buttons */}
      <div className="absolute bottom-12 right-10 flex gap-4 z-[100]">
         <button onClick={() => updateCell(`${getColumnLetter(activeCell.col)}${activeCell.row + 1}`, formulaBar)} className={`px-12 py-3 text-white rounded-full font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center gap-3 backdrop-blur-sm`} style={{ backgroundColor: themeColors.primary }}>
            <Icon name="check_circle" size={20} />
            <span>Enregistrer</span>
         </button>
         <button className={`px-12 py-3 bg-white border-2 rounded-full font-black uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 text-[${themeColors.primary}]`} style={{ borderColor: themeColors.primary, color: themeColors.primary }}>
            <span>Retour</span>
         </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .wordex-spreadsheet input:focus { border: none; ring: none; }
      ` }} />
    </div>
  );
}
