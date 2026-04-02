"use client";

import { AgentTestingInterface } from "@/components/agents/AgentTestingInterface";
import AppShell from "@/components/layout/AppShell";

export default function AgentsAdminPage() {
  return (
    <AppShell>
      <AgentTestingInterface />
    </AppShell>
  );
}
