'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAgents } from '@/hooks/useAgents';
import Navbar from '@/components/dashboard/Navbar';
import AgentDetail from '@/components/agent/AgentDetail';
import TokenUsage from '@/components/agent/TokenUsage';
import TaskList from '@/components/agent/TaskList';
import SessionLog from '@/components/agent/SessionLog';
import ChatWindow from '@/components/chat/ChatWindow';

export default function AgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [showChat, setShowChat] = useState(false);

  const { agents, agentStates, chatMessages, sendChat, loadChatHistory, connected, demoMode } = useAgents();

  const agent = agents.find((entry) => entry.id === agentId);
  const state = agentStates[agentId];

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="text-4xl mb-4">?</div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Agent not found</div>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 rounded-xl text-sm font-mono"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#000' }}
          >
            ← 返回仪表盘 (Back to Dashboard)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-12">
      <Navbar connected={connected} demoMode={demoMode} onSettingsClick={() => {}} />

      <div className="max-w-4xl mx-auto space-y-6 px-4 pt-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:scale-105 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }}
        >
          <span>←</span>
          <span>返回总览 (Back to Dashboard)</span>
        </Link>

        <AgentDetail agent={agent} state={state} onChatClick={() => setShowChat(true)} />

        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Token Usage</h3>
          <TokenUsage data={state?.tokenUsage ?? []} />
        </div>

        <TaskList
          currentTask={state?.currentTask ?? null}
          taskHistory={state?.taskHistory ?? []}
        />

        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Session Log</h3>
          <SessionLog entries={state?.sessionLog ?? []} />
        </div>
      </div>

      {showChat && (
        <ChatWindow
          agentId={agent.id}
          agentName={agent.name}
          agentEmoji={agent.emoji}
          agentColor={agent.color}
          messages={chatMessages[agent.id] ?? []}
          onSend={sendChat}
          onClose={() => setShowChat(false)}
          onOpen={() => loadChatHistory(agent.id)}
        />
      )}
    </div>
  );
}
