import { useState } from 'react';
import { sheets } from '@/lib/api';

export function useSheetPersistence(sheetId: string) {
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  
  const getVersionHistory = async () => {
    try {
      const history = await sheets.versions(sheetId);
      setVersionHistory(history);
      return history;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      await sheets.restore(sheetId, versionId);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return { getVersionHistory, restoreVersion, versionHistory };
}
