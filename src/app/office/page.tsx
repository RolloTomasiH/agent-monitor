"use client";

import { useState } from "react";
import Link from "next/link";
import { useAgents } from "@/hooks/useAgents";
import { useOffice } from "@/hooks/useOffice";
import Navbar from "@/components/dashboard/Navbar";
import SettingsPanel from "@/components/settings/SettingsPanel";
import OfficeCanvasInner from "@/components/office/OfficeCanvas";
import OfficeControls from "@/components/office/OfficeControls";
import ChatWindow from "@/components/chat/ChatWindow";
import type { AgentBehavior, DashboardConfig } from "@/lib/types";
import { loadConfig, DEFAULT_OWNER } from "@/lib/config";

export default function OfficePage() {
  const [chatAgent, setChatAgent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>(() => loadConfig());

  const {
    agents,
    agentStates,
    demoMode,
    connected,
    chatMessages,
    sendChat,
    setBehavior,
    loadChatHistory,
  } = useAgents(config.demoMode);

  const { officeState, tick } = useOffice(agents, agentStates);

  const [ownerConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      return loadConfig().owner;
    }
    return DEFAULT_OWNER;
  });
  const openAgent = chatAgent ? agents.find((a) => a.id === chatAgent) : null;

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden" data-theme="default">
      <Navbar
        connected={connected}
        demoMode={demoMode}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Floating Back Button for instant one-click return */}
      <Link
        href="/"
        className="fixed top-14 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:scale-105 shadow-md"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)'
        }}
        title="返回仪表盘总览"
      >
        <span>←</span>
        <span>返回总览 (Dashboard)</span>
      </Link>

      <div className="flex-1 relative flex items-center justify-center overflow-auto pt-14">
        <OfficeCanvasInner
          officeState={officeState}
          agents={agents}
          owner={ownerConfig}
          onTick={tick}
          width={1100}
          height={620}
          connected={connected}
          demoMode={demoMode}
        />
      </div>

      <OfficeControls
        agents={agents}
        agentStates={agentStates}
        demoMode={demoMode}
        onSetBehavior={(id: string, b: AgentBehavior) => setBehavior(id, b)}
      />

      {openAgent && (
        <ChatWindow
          agentId={openAgent.id}
          agentName={openAgent.name}
          agentEmoji={openAgent.emoji}
          agentColor={openAgent.color}
          messages={chatMessages[openAgent.id] ?? []}
          onSend={sendChat}
          onClose={() => setChatAgent(null)}
          onOpen={() => loadChatHistory(openAgent.id)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          config={config}
          connected={connected}
          sessionCount={1}
          onUpdate={setConfig}
          onReset={() => {}}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
