import { createAgentDenCoordinator } from './agent-den-coordinator.js';

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

export async function createAgentDenRuntime() {
  const [runtime, memory] = await Promise.all([
    loadJson('agent_den_runtime.json'),
    loadJson('agent_den_memory.json'),
  ]);

  return createAgentDenCoordinator({ runtime, memory });
}

export async function processAgentDenEvents(events, runtimeInstance) {
  const coordinator = runtimeInstance || await createAgentDenRuntime();
  const results = [];

  for (const event of events || []) {
    const result = coordinator.applyRequest({
      source: event.source || 'telegram',
      title: event.title,
      topicType: event.topicType,
      purpose: event.purpose,
      signals: event.signals,
      messageCount: event.messageCount,
      agentIds: event.agentIds,
      summary: event.summary,
    });

    results.push({
      eventId: event.id,
      result,
    });
  }

  return {
    coordinator,
    results,
  };
}
