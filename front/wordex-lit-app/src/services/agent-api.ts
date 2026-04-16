const API_BASE = `${import.meta.env.VITE_API_URL || '/api'}/agents`;

export interface Agent {
  id: string;
  name: string;
  role: string;
  specialty: string;
}

export const AgentService = {
  async listAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/list-agents`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('wordex_token')}` }
    });
    const data = await res.json();
    return data.agents;
  },

  async *executeStreaming(agentName: string, task: string, context: string = "") {
    const res = await fetch(`${API_BASE}/execute/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('wordex_token')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ agent_name: agentName, task, context, stream: true })
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },

  async chat(agentName: string, message: string, context: string = ""): Promise<{ response: string, timestamp: string }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('wordex_token')}`
      },
      body: JSON.stringify({ agent_name: agentName, message, context })
    });
    const data = await res.json();
    return data;
  }
};
