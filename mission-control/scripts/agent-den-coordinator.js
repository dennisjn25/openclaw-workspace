import { AGENT_ROSTER } from './data.js';
import './agent-den-engine.js';

const DEFAULT_STATE = {
  topics: [],
  events: [],
  topicCounter: 0,
  lastUpdatedAt: null,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createTopicId(counter) {
  return `agent-den-topic-${counter}`;
}

function normalizeTopicType(type) {
  return type === 'social' ? 'social' : 'work';
}

function estimatePriority(request) {
  if ((request.signals || []).includes('blocker_present')) return 'urgent_blocker';
  if ((request.signals || []).includes('decision_needed')) return 'design_review';
  if ((request.signals || []).includes('lesson_capture_needed')) return 'lesson_capture';
  if (normalizeTopicType(request.topicType) === 'social') return 'healthy_social';
  return 'active_delivery';
}

function inferAgents(request) {
  const requested = Array.isArray(request.agentIds) ? request.agentIds.filter(Boolean) : [];
  if (requested.length) return requested;

  const text = `${request.title || ''} ${request.purpose || ''}`.toLowerCase();
  const inferred = [];

  if (text.includes('design') || text.includes('strategy')) inferred.push('zelda');
  if (text.includes('code') || text.includes('debug') || text.includes('automation')) inferred.push('tails', 'luigi', 'mario');
  if (text.includes('security') || text.includes('risk') || text.includes('qa')) inferred.push('samus', 'link');
  if (text.includes('social') || text.includes('brand') || text.includes('friend')) inferred.push('rinoa', 'peach');
  if (text.includes('music') || text.includes('creative')) inferred.push('selphie', 'squall', 'yuna');
  if (text.includes('lesson') || text.includes('docs') || text.includes('retro')) inferred.push('professor_oak');

  return [...new Set(inferred)].filter(function (id) {
    return Boolean(AGENT_ROSTER[id]);
  }).slice(0, 6);
}

function chooseOwner(agentIds, topicType) {
  if (topicType === 'social') return agentIds[0] || null;
  return agentIds[0] || 'kirby';
}

function scoreMemoryAffinity(memory, agentIds) {
  if (!memory || !Array.isArray(memory.collaborationEdges) || agentIds.length < 2) return [];

  return memory.collaborationEdges
    .filter(function (edge) {
      return agentIds.includes(edge.a) && agentIds.includes(edge.b);
    })
    .sort(function (a, b) {
      return (b.successScore || 0) - (a.successScore || 0);
    });
}

export function createAgentDenCoordinator(options) {
  const runtime = clone(options.runtime || {});
  const memory = clone(options.memory || { agents: {}, collaborationEdges: [], relationshipNotes: [] });
  const state = Object.assign({}, clone(DEFAULT_STATE), clone(options.state || {}));
  const engine = options.engine || window.AgentDenEngine;

  if (!engine || typeof engine.evaluateRequest !== 'function') {
    throw new Error('AgentDenEngine.evaluateRequest is required.');
  }

  function saveState() {
    state.lastUpdatedAt = nowIso();
    return clone(state);
  }

  function listTopics() {
    return clone(state.topics);
  }

  function listOpenTopics() {
    return state.topics.filter(function (topic) {
      return topic.state !== 'closed';
    }).map(clone);
  }

  function recordEvent(event) {
    state.events.unshift({
      at: nowIso(),
      type: event.type,
      details: clone(event.details || {}),
    });
    state.events = state.events.slice(0, 200);
    saveState();
  }

  function createTopicFromRequest(request, evaluation) {
    state.topicCounter += 1;
    const topicType = normalizeTopicType(request.topicType);
    const agentIds = inferAgents(request);
    const topic = {
      id: createTopicId(state.topicCounter),
      title: request.title || evaluation?.suggestedTopic?.title || 'Untitled Topic',
      type: topicType,
      purpose: request.purpose || evaluation?.suggestedTopic?.purpose || 'coordination',
      state: 'open',
      priority: estimatePriority(request),
      owner: chooseOwner(agentIds, topicType),
      agents: agentIds,
      messageCount: request.messageCount || 0,
      source: request.source || 'manual',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      summary: request.summary || '',
      memoryAffinity: scoreMemoryAffinity(memory, agentIds),
    };

    state.topics.push(topic);
    recordEvent({ type: 'topic_created', details: { topicId: topic.id, title: topic.title, type: topic.type } });
    return clone(topic);
  }

  function closeTopic(topicId, reason) {
    const topic = state.topics.find(function (item) {
      return item.id === topicId;
    });

    if (!topic) return null;

    topic.state = 'closed';
    topic.closedAt = nowIso();
    topic.closedReason = reason || 'inactive';
    topic.updatedAt = nowIso();
    recordEvent({ type: 'topic_closed', details: { topicId: topic.id, reason: topic.closedReason } });
    return clone(topic);
  }

  function markDormantTopics(hoursIdle) {
    const thresholdHours = typeof hoursIdle === 'number' ? hoursIdle : runtime?.decisionThresholds?.dormantAfterHours || 48;
    const cutoff = Date.now() - (thresholdHours * 60 * 60 * 1000);
    const changed = [];

    state.topics.forEach(function (topic) {
      if (topic.state === 'closed') return;
      const updatedAt = Date.parse(topic.updatedAt || topic.createdAt || nowIso());
      if (Number.isFinite(updatedAt) && updatedAt < cutoff) {
        topic.state = 'dormant';
        topic.updatedAt = nowIso();
        changed.push(clone(topic));
      }
    });

    if (changed.length) {
      recordEvent({ type: 'topics_marked_dormant', details: { count: changed.length } });
    }

    return changed;
  }

  function applyRequest(request) {
    const evaluation = engine.evaluateRequest(runtime, request, state.topics);

    if (evaluation.action === 'reuse_topic') {
      const topic = state.topics.find(function (item) {
        return item.id === evaluation.topicId;
      });
      if (topic) {
        topic.updatedAt = nowIso();
        topic.messageCount = Math.max(topic.messageCount || 0, request.messageCount || 0);
        recordEvent({ type: 'topic_reused', details: { topicId: topic.id, title: topic.title } });
      }
    }

    if (evaluation.action === 'close_then_create_topic' && evaluation.closeTopicId) {
      closeTopic(evaluation.closeTopicId, 'capacity_reclaim');
      const created = createTopicFromRequest(request, evaluation);
      return {
        evaluation,
        createdTopic: created,
        state: saveState(),
      };
    }

    if (evaluation.action === 'create_topic') {
      const created = createTopicFromRequest(request, evaluation);
      return {
        evaluation,
        createdTopic: created,
        state: saveState(),
      };
    }

    saveState();
    return {
      evaluation,
      state: clone(state),
    };
  }

  function getSnapshot() {
    return {
      runtime: clone(runtime),
      memory: clone(memory),
      state: clone(state),
    };
  }

  return {
    applyRequest,
    closeTopic,
    getSnapshot,
    listTopics,
    listOpenTopics,
    markDormantTopics,
    recordEvent,
  };
}
