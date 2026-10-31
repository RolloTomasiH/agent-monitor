import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

function parseRunsLog() {
  const logPath = join(process.env.HOME || process.env.USERPROFILE || '', 'agent-team', 'data', 'logs', 'runs.log');
  if (!existsSync(logPath)) return [];
  const content = readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').slice(-100);
  
  const agentsMap = new Map();
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s+\[(.*?)\]\s+(start|ok|error|fail)\s*(.*)/);
    if (match) {
      const [_, timestamp, agentId, status, details] = match;
      let behavior = 'idle';
      if (status === 'start') behavior = 'working';
      if (status === 'error' || status === 'fail') behavior = 'error';
      
      agentsMap.set(agentId, {
        sessionKey: `agent:${agentId}`,
        behavior: behavior,
        agentName: agentId.split('/').pop().replace(/_/g, ' '),
        statusSummary: details
      });
    }
  }
  return Array.from(agentsMap.values());
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      function send(event: string, data: string) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {}
      }
      
      send('open', JSON.stringify({ ts: Date.now(), ready: true }));
      
      let lastStates = '';
      const interval = setInterval(() => {
        try {
          const currentStates = parseRunsLog();
          const currentStr = JSON.stringify(currentStates);
          if (currentStr !== lastStates) {
            for (const state of currentStates) {
              send('state', JSON.stringify(state));
            }
            lastStates = currentStr;
          }
        } catch (err) {}
      }, 1000);
      
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(interval);
          clearInterval(heartbeat);
        }
      }, 30000);
    },
    cancel() {}
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
