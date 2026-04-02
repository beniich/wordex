"use client";

import { useState, useEffect } from 'react';
import { Task, Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useParams } from 'next/navigation';
import { dashboard } from '@/lib/api';

interface ProjectTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string[];
  type: 'task' | 'milestone' | 'project';
  project?: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

const getTaskStyles = (priority: string) => {
  switch (priority) {
    case 'high': return { backgroundColor: '#FF6B6B', progressColor: '#FF5252' };
    case 'medium': return { backgroundColor: '#4ECDC4', progressColor: '#26A69A' };
    case 'low': return { backgroundColor: '#D8C3B4', progressColor: '#BCAAA4' };
    default: return {};
  }
};

const mapToGanttTask = (task: ProjectTask): Task => ({
  id: task.id,
  name: task.name,
  start: new Date(task.start),
  end: new Date(task.end),
  progress: task.progress,
  dependencies: task.dependencies || [],
  type: task.type as "task" | "milestone" | "project",
  project: task.project,
  hideChildren: false,
  styles: getTaskStyles(task.priority)
});

export function GanttWidget() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [view, setView] = useState<ViewMode>(ViewMode.Day);

  useEffect(() => {
    const loadGanttData = async () => {
      try {
        const data = await dashboard.gantt(workspaceId, selectedProject, selectedTeam);
        setTasks((data?.tasks || []).map(mapToGanttTask));
        setProjects(data?.projects || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadGanttData();
  }, [workspaceId, selectedProject, selectedTeam]);

  return (
    <div className="gantt-widget bg-[#F5F1E6]/40 backdrop-blur-md rounded-2xl p-6 border border-[#A67B5B]/30 shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Planning Gantt Multi-Projets</h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/40 p-1 rounded-xl">
             {([ViewMode.Week, ViewMode.Day] as ViewMode[]).map(vm => (
               <button 
                 key={vm}
                 onClick={() => setView(vm)}
                 className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${view === vm ? 'bg-[#A67B5B] text-white shadow-md' : 'text-outline hover:bg-white/50'}`}
               >
                 {vm}
               </button>
             ))}
          </div>

          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white/50 border border-[#A67B5B]/20 rounded-lg px-3 py-1 text-xs font-bold text-[#524439] outline-none"
            title="Project Filter"
          >
            <option value="all">Tous les projets</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-white/50 border border-[#A67B5B]/20 rounded-lg px-3 py-1 text-xs font-bold text-[#524439] outline-none"
            title="Team Filter"
          >
            <option value="all">Toutes les équipes</option>
            <option value="production">Production</option>
            <option value="maintenance">Maintenance</option>
            <option value="qualite">Qualité</option>
          </select>
        </div>
      </div>

      <div className="gantt-container rounded-xl overflow-hidden border border-[#DCC6A0]/30 min-h-[400px]">
        {tasks.length > 0 ? (
          <Gantt
            tasks={tasks}
            viewMode={view}
            locale="fr-FR"
            fontSize="11"
            fontFamily="'Manrope', sans-serif"
            listCellWidth="150px"
            columnWidth={view === ViewMode.Day ? 60 : 100}
            headerHeight={50}
            rowHeight={45}
            barCornerRadius={12}
            handleWidth={8}
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-xs font-black text-outline uppercase tracking-widest">Initialisation Planning...</div>
        )}
      </div>
    </div>
  );
}
