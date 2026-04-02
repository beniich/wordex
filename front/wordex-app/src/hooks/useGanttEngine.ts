import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { ganttApi, GanttData, GanttTask, GanttResource } from '@/lib/api';

export type GanttZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export function useGanttEngine(docId: string) {
  const [data, setData] = useState<GanttData | null>(null);
  const [zoom, setZoom] = useState<GanttZoomLevel>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    if (docId) loadGanttData(docId);
  }, [docId]);

  const loadGanttData = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await ganttApi.get(id);
      setData(res);
    } catch (err) {
      console.error("Gantt load error:", err);
      // Optional: Initialize empty structure if 404 (meaning it's blank new doc)
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setData({ tasks: [], resources: [], metadata: {} });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced bulk save
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedBulkSave = useCallback(
    debounce(async (id: string, tasksToUpdate: Partial<GanttTask>[]) => {
      setSaveStatus('saving');
      try {
        await ganttApi.bulkUpdate(id, tasksToUpdate);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('unsaved');
      }
    }, 1000),
    []
  );

  const updateTasks = (newTasks: GanttTask[]) => {
    if (!data) return;
    const newData = { ...data, tasks: newTasks };
    setData(newData);
    setSaveStatus('unsaved');
    
    // Convert to partial to save only changed props or just send all
    debouncedBulkSave(docId, newTasks);
  };

  const updateResources = (newResources: GanttResource[]) => {
    if (!data) return;
    const newData = { ...data, resources: newResources };
    setData(newData);
    // Not bulk saving resources for now
  };

  const createTask = async (task: Partial<GanttTask>) => {
    if (!data) return;
    try {
      setSaveStatus('saving');
      const newTask = await ganttApi.createTask(docId, task);
      setData({ ...data, tasks: [...data.tasks, newTask] });
      setSaveStatus('saved');
    } catch(err) {
      console.error(err);
      setSaveStatus('unsaved');
    }
  };

  return {
    data,
    zoom,
    setZoom,
    isLoading,
    saveStatus,
    updateTasks,
    updateResources,
    createTask
  };
}
