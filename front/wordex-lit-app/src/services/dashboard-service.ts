import { apiFetch } from './api-client';

export interface MachineOEE {
  machine: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  timeline: { time: string; value: number }[];
}

class DashboardService {
  async getTrsOee(workspaceId: string): Promise<{ machines: MachineOEE[] }> {
    try {
      const res = await apiFetch(`/dashboard/trs-oee?workspace_id=${workspaceId}`);
      if (!res.ok) throw new Error('Erreur TRS-OEE');
      return await res.json();
    } catch (e) {
      console.warn("Dashboard service: using fallback mock data", e);
      return {
        machines: [
          {
            machine: "Unité de Calcul Alpha",
            oee: 87.5, availability: 92.0, performance: 95.0, quality: 99.8,
            timeline: [
              { time: "08h", value: 45 }, { time: "09h", value: 65 }, { time: "10h", value: 85 },
              { time: "11h", value: 92 }, { time: "12h", value: 88 }, { time: "13h", value: 95 }
            ]
          },
          {
            machine: "Flux de Données Bêta",
            oee: 72.3, availability: 85.0, performance: 88.0, quality: 96.5,
            timeline: [
              { time: "08h", value: 30 }, { time: "09h", value: 55 }, { time: "10h", value: 72 },
              { time: "11h", value: 68 }, { time: "12h", value: 75 }, { time: "13h", value: 82 }
            ]
          }
        ]
      };
    }
  }
}

export const dashboardService = new DashboardService();
