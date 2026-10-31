import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function parseRunsLog() {
  const logPath = join(process.env.HOME || process.env.USERPROFILE || '', 'agent-team', 'data', 'logs', 'runs.log');
  if (!existsSync(logPath)) return [];
  
  const content = readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').slice(-500); // tail 500
  
  const agentsMap = new Map();
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s+\[(.*?)\]\s+(start|ok|error|fail)\s*(.*)/);
    if (match) {
      const [_, timestamp, agentId, status, details] = match;
      let behavior = 'idle';
      if (status === 'start') behavior = 'working';
      if (status === 'error' || status === 'fail') behavior = 'error';
      
      const ts = new Date(timestamp).getTime();
      
      agentsMap.set(agentId, {
        id: agentId,
        key: `agent:${agentId}`,
        name: agentId.split('/').pop().replace(/_/g, ' '),
        emoji: '🤖', // default emoji
        behavior: behavior,
        isActive: behavior === 'working',
        isSubagent: false,
        updatedAt: ts,
        lastActivity: ts,
        totalTokens: 0,
        chatStatus: null,
        agentStatus: null,
        statusSummary: details
      });
    }
  }
  
  return Array.from(agentsMap.values());
}

export async function GET() {
  try {
    const sessions = parseRunsLog();
    return NextResponse.json({
      ok: true,
      timestamp: Date.now(),
      count: sessions.length,
      sessions: sessions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), sessions: [] },
      { status: 502 },
    );
  }
}
