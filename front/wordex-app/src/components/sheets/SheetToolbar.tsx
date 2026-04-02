import React, { useState } from 'react';

// Basic icons to avoid large library dependencies here for snippet
const ShareIcon = () => <span>📤</span>;
const HistoryIcon = () => <span>🕒</span>;
const SettingsIcon = () => <span>⚙️</span>;

import { useAdvancedSheetEngine } from '@/hooks/useAdvancedSheetEngine';

export function SheetToolbar({ sheetId }: { sheetId: string }) {
  const { saveStatus, SaveIndicator } = useAdvancedSheetEngine(sheetId);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white/50 backdrop-blur-md glassmorphism-surface">
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md shadow hover:bg-primary-focus transition-colors">
          New Sheet
        </button>
        <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          Import CSV
        </button>
      </div>
      
      <div className="flex items-center justify-center flex-1">
        <SaveIndicator />
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Share">
          <ShareIcon />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="History">
          <HistoryIcon />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="Settings">
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}
