import { useState, useRef, useEffect } from 'react';
import { useAdvancedSheetEngine } from '@/hooks/useAdvancedSheetEngine';
import { useSheetPersistence } from '@/hooks/useSheetPersistence';

// Basic icons to avoid large dependency issues
const FileIcon = () => <span>📄</span>;
const FolderOpenIcon = () => <span>📂</span>;
const SaveIcon = () => <span>💾</span>;
const HistoryIcon = () => <span>🕒</span>;
const ShareIcon = () => <span>📤</span>;

interface CellPosition {
  row: number;
  col: number;
}

export function ExcelStyleSheet({ sheetId }: { sheetId: string }) {
  const { sheetData, updateCell, SaveIndicator } = useAdvancedSheetEngine(sheetId);
  const { getVersionHistory, restoreVersion, versionHistory } = useSheetPersistence(sheetId);
  
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [formulaBar, setFormulaBar] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const rows = 100;
  const cols = 26; // A-Z

  // Convertir numéro de colonne en lettre (0->A, 1->B, etc.)
  const getColumnLetter = (colIndex: number): string => {
    return String.fromCharCode(65 + colIndex);
  };

  // Obtenir la valeur d'une cellule
  const getCellValue = (row: number, col: number): string | number => {
    if (!sheetData) return '';
    const cellId = `${getColumnLetter(col)}${row + 1}`;
    const cell = sheetData.cells[cellId];
    return cell?.computedValue ?? cell?.value ?? '';
  };

  // Gestion de la sélection avec clavier/souris
  const handleCellClick = (row: number, col: number) => {
    setActiveCell({ row, col });
    const cellValue = getCellValue(row, col);
    setFormulaBar(typeof cellValue === 'string' ? cellValue : String(cellValue));
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    const cellId = `${getColumnLetter(col)}${row + 1}`;
    // Passer en mode édition
    document.getElementById(`cell-${cellId}`)?.focus();
  };

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gridRef.current?.contains(document.activeElement)) return;

      // Arrow navigation
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: Math.max(0, prev.row - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: prev.row + 1 }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, col: Math.max(0, prev.col - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, col: prev.col + 1 }));
          break;
        case 'Enter':
          e.preventDefault();
          setActiveCell(prev => ({ ...prev, row: prev.row + 1 }));
          break;
        case 'F2':
          e.preventDefault();
          handleCellDoubleClick(activeCell.row, activeCell.col);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCell]);

  if (!sheetData) {
    return (
      <div className="sheet-loading sable-theme flex items-center justify-center p-8 h-full">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 font-semibold">Chargement du tableur...</p>
      </div>
    );
  }

  return (
    <div className="excel-style-sheet sable-theme">
      {/* Barre d'outils */}
      <div className="sheet-toolbar cuivre-accent">
        <div className="toolbar-section">
          <button className="tool-btn" title="Nouveau">
            <FileIcon />
          </button>
          <button className="tool-btn" title="Ouvrir">
            <FolderOpenIcon />
          </button>
          <button className="tool-btn" title="Sauvegarder">
            <SaveIcon />
          </button>
        </div>
        
        <div className="toolbar-section flex-1 justify-center">
          <SaveIndicator />
        </div>
        
        <div className="toolbar-section spacer"></div>
        
        <div className="toolbar-section">
          <button 
            className="tool-btn" 
            title="Historique"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) getVersionHistory();
            }}
          >
            <HistoryIcon />
          </button>
          <button className="tool-btn" title="Partager">
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* Barre de formule */}
      <div className="formula-bar sable-light">
        <div className="cell-address">
          {getColumnLetter(activeCell.col)}{activeCell.row + 1}
        </div>
        <input
          type="text"
          value={formulaBar}
          onChange={(e) => setFormulaBar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
              updateCell(cellId, formulaBar);
            }
          }}
          className="formula-input"
          placeholder="Entrez une formule ou une valeur..."
        />
        <button 
          className="formula-btn bg-[#A67B5B] text-white px-2 py-1 flex items-center justify-center rounded-sm hover:opacity-90 transition-opacity"
          onClick={() => {
            const cellId = `${getColumnLetter(activeCell.col)}${activeCell.row + 1}`;
            updateCell(cellId, formulaBar);
          }}
        >
          ✓
        </button>
      </div>

      {/* Grille principale */}
      <div className="sheet-grid-container flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-max">
          {/* En-têtes de colonnes */}
          <div className="column-headers flex sticky top-0 z-10 bg-[#E8E2D0] border-b-2 border-[#A67B5B]">
            <div className="corner-header w-10 min-w-[40px] sticky left-0 z-20 bg-[#E8E2D0] border-r border-[#DCC6A0]"></div>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} className="column-header w-24 min-w-[96px] h-8 flex items-center justify-center border-r border-[#DCC6A0] font-bold bg-[#F5F1E6]">
                {getColumnLetter(colIndex)}
              </div>
            ))}
          </div>

          {/* Corps de la grille */}
          <div className="grid-body flex">
            {/* En-têtes de lignes */}
            <div className="row-headers flex flex-col sticky left-0 z-[5]">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="row-header w-10 min-w-[40px] h-6 flex items-center justify-center border-b border-[#DCC6A0] bg-[#F5F1E6] font-bold text-xs flex-shrink-0">
                  {rowIndex + 1}
                </div>
              ))}
            </div>

            {/* Cellules */}
            <div className="cells-grid grid" style={{ gridTemplateColumns: `repeat(${cols}, 96px)`, gridAutoRows: '24px' }}>
              {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: cols }).map((_, colIndex) => {
                  const cellId = `${getColumnLetter(colIndex)}${rowIndex + 1}`;
                  const cellValue = getCellValue(rowIndex, colIndex);
                  const isActive = activeCell.row === rowIndex && activeCell.col === colIndex;
                  
                  return (
                    <div
                      key={cellId}
                      tabIndex={0}
                      id={`cell-${cellId}`}
                      className={`cell border-r border-b border-[#E0E0E0] px-1 py-0.5 flex items-center text-xs outline-none cursor-cell overflow-hidden whitespace-nowrap ${isActive ? 'active' : 'hover:bg-[#A67B5B]/10'}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                    >
                      {cellValue}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panneau historique (optionnel) */}
      {showHistory && (
        <div className="history-panel sable-theme absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-[#DCC6A0] shadow-[-2px_0_10px_rgba(0,0,0,0.1)] z-50 flex flex-col">
          <div className="panel-header flex justify-between items-center p-4 bg-[#A67B5B] text-white">
            <h3 className="font-bold">Historique des versions</h3>
            <button className="hover:opacity-80" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="panel-content flex-1 overflow-auto">
            {versionHistory.map((version: { version: number; id: string; created_at: string }) => (
              <div key={version.version} className="version-item flex justify-between items-center p-3 border-b border-[#EEE]">
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-[#A67B5B]">v{version.version}</span>
                  <span className="text-gray-500 text-xs">{new Date(version.created_at).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => restoreVersion(version.id)}
                  className="restore-btn bg-[#A67B5B] text-white text-xs py-1 px-2 rounded hover:bg-[#894d0d] transition-colors"
                >
                  Restaurer
                </button>
              </div>
            ))}
            {versionHistory.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucun historique disponible
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles CSS intégrés pour le thème Sable & Cuivre */}
      <style jsx>{`
        .sable-theme {
          background: linear-gradient(135deg, #F5F1E6 0%, #E8E2D0 100%);
          color: #2D2D2D;
          font-family: 'Inter', sans-serif;
        }
        
        .cuivre-accent {
          background: linear-gradient(90deg, #A67B5B 0%, #C9A56B 100%);
          color: white;
        }
        
        .sable-light {
          background-color: #FCF9F5;
          border-bottom: 1px solid #DCC6A0;
        }
        
        .excel-style-sheet {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          overflow: hidden;
        }
        
        .sheet-toolbar {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          gap: 16px;
        }
        
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tool-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tool-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        
        .formula-bar {
          display: flex;
          align-items: center;
          padding: 8px 16px;
        }
        
        .cell-address {
          background: #DCC6A0;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          min-width: 60px;
          text-align: center;
          color: #2D2D2D;
        }
        
        .formula-input {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid #DCC6A0;
          border-radius: 4px;
          background: white;
          outline: none;
        }
        .formula-input:focus {
          border-color: #A67B5B;
          box-shadow: 0 0 0 2px rgba(166, 123, 91, 0.2);
        }
        
        .cell.active {
          background: #FFF5E6;
          box-shadow: inset 0 0 0 2px #A67B5B;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
