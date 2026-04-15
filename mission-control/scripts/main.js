// mission-control/scripts/main.js
import { AGENT_ROSTER, QUEST_CATEGORIES, GAME_STATE, loadQuests, saveQuests, calculateSynergy } from './data.js';

let quests = [];
let questFilter = null;
const hudDisplay = { xp: 0, credits: 0, crystals: 0 };
const expandedChildMissions = new Set();

const UPGRADE_CATALOG = [
  { id: 'hq_console_mk2', name: 'HQ Console MK-II', costCredits: 120, costCrystals: 2, effect: '+10% command speed', room: 'HQ Desk' },
  { id: 'strategy_orrery', name: 'Strategy Orrery', costCredits: 90, costCrystals: 2, effect: 'Better quest recommendations', room: 'Strategy Chamber' },
  { id: 'codeforge_overclock', name: 'Codeforge Overclock', costCredits: 140, costCrystals: 3, effect: '+15% automation output', room: 'Code Lab' },
  { id: 'social_signal_beacon', name: 'Signal Beacon', costCredits: 110, costCrystals: 2, effect: '+12% launch momentum', room: 'Social Hub' },
  { id: 'healing_grove_halo', name: 'Grove Halo', costCredits: 80, costCrystals: 1, effect: 'Lower recovery time', room: 'Healing Grove' }
];

const LIVE_EVENT_TYPES = [
  'mission stuck',
  'urgent task spike',
  'creative breakthrough',
  'risk alert',
  'trend spike',
  'energy low',
  'recovery needed'
];

let eventSimulationTimer = null;
let threatConsoleTimer = null;
const STATE_STORAGE_KEY = 'mission-control-v1-state';
const IMMERSION_STATE = {
  ambienceFx: true,
  uiAudio: true,
  audioContext: null,
  dayNightTimer: null
};

const STATION_LAYOUT = {
  kirby: { x: 50, y: 50 },
  zelda: { x: 20, y: 18 },
  tails: { x: 29, y: 70 },
  link: { x: 81, y: 18 },
  samus: { x: 82, y: 44 },
  professor_oak: { x: 68, y: 17 },
  tom_nook: { x: 18, y: 43 },
  peach: { x: 67, y: 74 },
  mario: { x: 19, y: 83 },
  luigi: { x: 8, y: 65 },
  sonic: { x: 83, y: 73 },
  selphie: { x: 34, y: 18 },
  squall: { x: 49, y: 83 },
  rinoa: { x: 61, y: 84 },
  edea: { x: 91, y: 59 },
  yuna: { x: 75, y: 87 },
  saria: { x: 92, y: 85 }
};

function safeParseNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function saveRuntimeState() {
  try {
    const snapshot = {
      xp: GAME_STATE.xp,
      credits: GAME_STATE.credits,
      crystals: GAME_STATE.crystals,
      unlockedUpgrades: GAME_STATE.unlockedUpgrades || [],
      missionLog: GAME_STATE.missionLog || [],
      immersion: {
        ambienceFx: IMMERSION_STATE.ambienceFx,
        uiAudio: IMMERSION_STATE.uiAudio
      },
      quests,
      ideaFlow: GAME_STATE.ideaFlow || null
    };
    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('State save skipped:', error);
  }
}

function loadRuntimeState() {
  try {
    const raw = window.localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    GAME_STATE.xp = safeParseNumber(state.xp, 0);
    GAME_STATE.credits = safeParseNumber(state.credits, 0);
    GAME_STATE.crystals = safeParseNumber(state.crystals, 0);
    GAME_STATE.unlockedUpgrades = Array.isArray(state.unlockedUpgrades) ? state.unlockedUpgrades : [];
    GAME_STATE.missionLog = Array.isArray(state.missionLog) ? state.missionLog : [];
    IMMERSION_STATE.ambienceFx = state.immersion?.ambienceFx ?? true;
    IMMERSION_STATE.uiAudio = state.immersion?.uiAudio ?? true;
    if (Array.isArray(state.quests) && state.quests.length) {
      quests = state.quests.map(quest => quest.ideaFlow
        ? { ...quest, ideaFlow: normalizeIdeaFlow(quest.ideaFlow, quest.id) }
        : quest);
    }
    GAME_STATE.ideaFlow = normalizeIdeaFlow(state.ideaFlow, state.ideaFlow?.questId) || null;
  } catch (error) {
    console.warn('State load skipped:', error);
  }
}

function createIdeaFlowId() {
  return `idea_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeIdeaFlow(flow, fallbackQuestId = null) {
  if (!flow?.idea || !flow?.polish || !flow?.orchestration) return flow;
  const orchestration = buildKirbyOrchestration(flow.idea, flow.polish);
  const questId = flow.questId || flow.parentQuestId || fallbackQuestId || createIdeaFlowId();
  const subquests = Array.isArray(flow.subquests) && flow.subquests.length
    ? flow.subquests
    : buildKirbySubquests(flow.idea, flow.polish, orchestration, questId);

  return {
    ...flow,
    questId,
    subquests,
    orchestration: {
      ...flow.orchestration,
      ...orchestration,
      primaryBranch: orchestration.primaryBranch,
      branches: orchestration.branches,
      commandNote: orchestration.commandNote,
      phases: orchestration.phases,
      squad: flow.orchestration.squad || orchestration.squad
    }
  };
}

function summarizeIdea(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
}

function inferAudience(text = '') {
  const raw = text.toLowerCase();
  if (raw.includes('founder') || raw.includes('business') || raw.includes('team')) return 'Operators and founders who need leverage';
  if (raw.includes('music') || raw.includes('artist') || raw.includes('creative')) return 'Creators who want faster expression';
  if (raw.includes('agent') || raw.includes('automation') || raw.includes('ai')) return 'Builders who want an AI-first workflow';
  return 'People who want the result without extra friction';
}

function inferValueProposition(title, summary, goal) {
  const raw = `${title} ${summary} ${goal}`.toLowerCase();
  if (raw.includes('mobile')) return 'Turn the idea into an always-available companion experience.';
  if (raw.includes('automation') || raw.includes('workflow')) return 'Replace drag with a system that compounds output.';
  if (raw.includes('content') || raw.includes('brand')) return 'Package the idea so it lands clearly and spreads.';
  if (raw.includes('dashboard') || raw.includes('control')) return 'Make complex moving parts feel commandable in one place.';
  return 'Clarify the vision so the build can move with confidence.';
}

function inferDeliverables(text = '') {
  const raw = text.toLowerCase();
  const deliverables = ['Refined concept brief', 'Production quest with execution squad'];
  if (raw.includes('app') || raw.includes('mobile') || raw.includes('web')) deliverables.push('Product scope and feature stack');
  if (raw.includes('brand') || raw.includes('content') || raw.includes('launch')) deliverables.push('Messaging and launch positioning');
  if (raw.includes('automation') || raw.includes('workflow') || raw.includes('agent')) deliverables.push('Automation plan and system handoffs');
  return [...new Set(deliverables)].slice(0, 4);
}

function buildSelphiePolish({ title, summary, goal }) {
  return {
    spark: summarizeIdea(summary) || `${title} needs a cleaner shape before production starts.`,
    audience: inferAudience(`${title} ${summary} ${goal}`),
    value: inferValueProposition(title, summary, goal),
    deliverables: inferDeliverables(`${title} ${summary} ${goal}`),
    hook: `${title} should feel focused, desirable, and easy to act on.`
  };
}

function inferProductionTrack(text = '') {
  const raw = text.toLowerCase();
  if (raw.includes('automation') || raw.includes('workflow') || raw.includes('agent')) return 'Automation Mission';
  if (raw.includes('brand') || raw.includes('content') || raw.includes('launch')) return 'Launch Mission';
  if (raw.includes('music') || raw.includes('creative')) return 'Creative Mission';
  return 'Main Quest';
}

function getKirbyBranchCatalog() {
  return {
    product_build: {
      id: 'product_build',
      label: 'Product Build',
      lead: 'tails',
      support: ['mario', 'zelda'],
      keywords: ['app', 'platform', 'dashboard', 'mobile', 'web', 'product', 'saas', 'tool', 'feature', 'ui', 'ux'],
      summary: 'Turns the concept into scoped features, system design, and a first build path.',
      phases: ['Scope the MVP surface', 'Map the system and UX flow', 'Build the first deployable version'],
      type: 'main_quests'
    },
    launch: {
      id: 'launch',
      label: 'Launch',
      lead: 'sonic',
      support: ['rinoa', 'peach'],
      keywords: ['launch', 'campaign', 'go to market', 'go-to-market', 'promotion', 'audience', 'traffic', 'distribution'],
      summary: 'Prepares momentum, activation, and rollout for release.',
      phases: ['Define the launch angle', 'Build the rollout sequence', 'Trigger momentum and distribution'],
      type: 'main_quests'
    },
    content: {
      id: 'content',
      label: 'Content',
      lead: 'rinoa',
      support: ['peach', 'selphie'],
      keywords: ['content', 'brand', 'messaging', 'copy', 'story', 'social', 'creative', 'creator'],
      summary: 'Shapes the narrative, messaging, and content assets around the idea.',
      phases: ['Clarify the message', 'Create core assets and prompts', 'Prepare content for publishing'],
      type: 'creative_missions'
    },
    automation: {
      id: 'automation',
      label: 'Automation',
      lead: 'mario',
      support: ['tails', 'kirby'],
      keywords: ['automation', 'workflow', 'agent', 'system', 'integration', 'ops', 'process'],
      summary: 'Converts the idea into repeatable systems, automations, and operating flows.',
      phases: ['Identify manual drag', 'Design the handoff system', 'Deploy the automation chain'],
      type: 'automation_missions'
    },
    research: {
      id: 'research',
      label: 'Research',
      lead: 'link',
      support: ['zelda', 'professor_oak'],
      keywords: ['research', 'market', 'validate', 'discovery', 'analysis', 'insight', 'intel'],
      summary: 'Generates evidence, market clarity, and strategic intelligence before execution.',
      phases: ['Frame the key questions', 'Pull evidence and signal', 'Turn findings into direction'],
      type: 'main_quests'
    }
  };
}

function detectKirbyBranches(text = '') {
  const raw = text.toLowerCase();
  const catalog = getKirbyBranchCatalog();
  const ranked = Object.values(catalog)
    .map(branch => ({
      ...branch,
      score: branch.keywords.reduce((acc, keyword) => acc + (raw.includes(keyword) ? 1 : 0), 0)
    }))
    .filter(branch => branch.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  if (ranked.length === 0) {
    return [catalog.product_build, catalog.research];
  }

  const branches = ranked.slice(0, 3);
  if (!branches.some(branch => branch.id === 'product_build') && raw.match(/app|platform|product|tool|dashboard|mobile|web|feature/)) {
    branches.unshift(catalog.product_build);
  }
  return [...new Map(branches.map(branch => [branch.id, branch])).values()].slice(0, 3);
}

function buildKirbyOrchestration(idea, polish) {
  const raw = `${idea.title} ${idea.summary} ${idea.goal}`.toLowerCase();
  const selectedBranches = detectKirbyBranches(raw);
  const primaryBranch = selectedBranches[0];
  const squad = ['kirby', 'selphie', primaryBranch.lead, ...primaryBranch.support];
  selectedBranches.slice(1).forEach(branch => {
    squad.push(branch.lead, ...branch.support.slice(0, 1));
  });
  if (squad.length < 4) squad.push('zelda');

  const branchPlans = selectedBranches.map((branch, index) => ({
    id: branch.id,
    label: branch.label,
    summary: branch.summary,
    lead: branch.lead,
    support: branch.support,
    type: branch.type,
    priority: index + 1,
    phases: branch.phases.map((phase, phaseIndex) => `${index + 1}.${phaseIndex + 1} ${phase}`)
  }));

  const branchLine = branchPlans.map(branch => branch.label).join(' → ');

  return {
    track: inferProductionTrack(raw),
    primaryBranch: primaryBranch.label,
    branches: branchPlans,
    squad: [...new Set(squad)].slice(0, 5),
    phases: [
      `Selphie refines the concept into a clear build brief around “${idea.title}.”`,
      `Kirby routes the mission through ${branchLine}.`,
      `Team executes toward ${idea.goal || 'a polished first deliverable'}.`
    ],
    commandNote: `Kirby is orchestrating ${idea.title} with Selphie as the creative lead through the ${primaryBranch.label} branch.`
  };
}

function buildKirbySubquests(idea, polish, orchestration, parentQuestId) {
  return orchestration.branches.map((branch, index) => ({
    id: `${parentQuestId}::${branch.id}`,
    parentQuestId,
    branchId: branch.id,
    title: `${branch.label} Mission`,
    description: `${branch.summary} ${polish.value}`,
    status: 'backlog',
    type: branch.type,
    difficulty: index === 0 ? 'medium' : 'easy',
    urgency: idea.goal ? 'medium' : 'low',
    risk: branch.id === 'launch' ? 'high' : 'medium',
    estimatedDuration: `${Math.max(1, branch.phases.length)}h`,
    reward: {
      xp: 45 + (branch.phases.length * 12),
      credits: 18 + (index * 6),
      crystals: branch.id === 'product_build' || branch.id === 'automation' ? 1 : 0
    },
    recommendedAgents: [branch.lead, ...branch.support].slice(0, 3),
    assignedAgents: [branch.lead, ...branch.support].slice(0, 3),
    subtasks: branch.phases.map(phase => ({ title: phase.replace(/^\d+\.\d+\s+/, ''), done: false })),
    comments: [
      { author: 'Kirby', text: `${branch.label} branch activated.` },
      { author: AGENT_ROSTER[branch.lead]?.name || branch.lead, text: branch.summary }
    ],
    branchData: branch
  }));
}

function getQuestSubquests(quest) {
  return Array.isArray(quest?.ideaFlow?.subquests) ? quest.ideaFlow.subquests : [];
}

function getAssignedAgents(mission) {
  return Array.isArray(mission?.assignedAgents) && mission.assignedAgents.length
    ? mission.assignedAgents
    : Array.isArray(mission?.recommendedAgents)
      ? mission.recommendedAgents.slice(0, 3)
      : [];
}

function getMissionById(missionId) {
  for (const quest of quests) {
    if (quest.id === missionId) return { mission: quest, parentQuest: quest, isSubquest: false };
    const subquest = getQuestSubquests(quest).find(child => child.id === missionId);
    if (subquest) return { mission: subquest, parentQuest: quest, isSubquest: true };
  }
  return { mission: null, parentQuest: null, isSubquest: false };
}

function countMissionProgress(mission) {
  const done = (mission.subtasks || []).filter(s => s.done).length;
  const total = (mission.subtasks || []).length;
  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0
  };
}

function toggleChildMissionExpansion(subquestId) {
  if (!subquestId) return;
  if (expandedChildMissions.has(subquestId)) {
    expandedChildMissions.delete(subquestId);
  } else {
    expandedChildMissions.add(subquestId);
  }
}

function setChildMissionStep(subquestId, stepIndex, checked) {
  const { mission, parentQuest, isSubquest } = getMissionById(subquestId);
  if (!mission || !isSubquest) return;
  const step = mission.subtasks?.[stepIndex];
  if (!step) return;

  step.done = checked;
  const doneCount = (mission.subtasks || []).filter(item => item.done).length;
  const totalCount = (mission.subtasks || []).length;
  if (doneCount === totalCount && totalCount > 0) {
    mission.status = 'done';
  } else if (doneCount > 0) {
    mission.status = 'in_progress';
  } else {
    mission.status = 'backlog';
  }

  syncIdeaQuestProgress(parentQuest);
  saveRuntimeState();
  renderQuestBoard();
  renderIdeaFlowPanels();
  renderActiveMissions();
  renderHqSystems();
  renderAgentStations();
  renderThreatConsole();
  updateAdvisorRecommendation();
}

function toggleChildMissionAgent(subquestId, agentId) {
  const { mission, parentQuest, isSubquest } = getMissionById(subquestId);
  if (!mission || !isSubquest || !AGENT_ROSTER[agentId]) return;

  const assigned = getAssignedAgents(mission);
  const hasAgent = assigned.includes(agentId);
  let nextAssigned;

  if (hasAgent) {
    nextAssigned = assigned.filter(id => id !== agentId);
  } else if (assigned.length < 3) {
    nextAssigned = [...assigned, agentId];
  } else {
    nextAssigned = [assigned[0], assigned[1], agentId];
  }

  mission.assignedAgents = nextAssigned;
  mission.recommendedAgents = nextAssigned.length ? [...nextAssigned] : mission.recommendedAgents;
  parentQuest.recommendedAgents = getQuestSubquests(parentQuest)
    .flatMap(child => getAssignedAgents(child))
    .filter((id, index, arr) => arr.indexOf(id) === index)
    .slice(0, 3);

  saveRuntimeState();
  renderQuestBoard();
  renderIdeaFlowPanels();
  renderActiveMissions();
  renderHqSystems();
  renderAgentStations();
  renderThreatConsole();
  updateAdvisorRecommendation();
}

function renderChildMissionAssignments(subquest) {
  const assigned = getAssignedAgents(subquest);
  const candidates = [subquest.branchData?.lead, ...(subquest.branchData?.support || []), ...subquest.recommendedAgents]
    .filter((id, index, arr) => id && AGENT_ROSTER[id] && arr.indexOf(id) === index)
    .slice(0, 5);

  return `
    <div class="child-mission-assignment-block">
      <div class="child-mission-assignment-head">
        <span>Assigned Squad</span>
        <strong>${assigned.map(id => AGENT_ROSTER[id]?.name || id).join(', ') || 'Unassigned'}</strong>
      </div>
      <div class="child-mission-agent-row">
        ${candidates.map(agentId => `
          <button type="button" class="child-mission-agent-pill ${assigned.includes(agentId) ? 'active' : ''}" data-agent-toggle="${subquest.id}" data-agent-id="${agentId}">
            ${AGENT_ROSTER[agentId]?.name || agentId}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderChildMissionCards(quest) {
  const subquests = getQuestSubquests(quest);
  if (!subquests.length) return '';
  return `
    <div class="child-mission-list">
      ${subquests.map(subquest => {
        const progress = countMissionProgress(subquest);
        const expanded = expandedChildMissions.has(subquest.id);
        return `
          <div class="child-mission-card ${expanded ? 'expanded' : ''}" data-subquest-id="${subquest.id}">
            <button type="button" class="child-mission-summary" data-subquest-id="${subquest.id}">
              <span class="child-mission-topline">
              <strong>${subquest.title}</strong>
                <span>${subquest.status.replace('_', ' ')}</span>
              </span>
              <span class="child-mission-meta">${AGENT_ROSTER[subquest.branchData?.lead]?.name || subquest.branchData?.lead || 'Branch lead'} • ${subquest.estimatedDuration}</span>
              <span class="child-mission-progress"><i style="width:${progress.percent}%"></i></span>
            </button>
            <div class="child-mission-actions">
              <button type="button" class="child-mission-inline-action" data-open-subquest="${subquest.id}">Open</button>
              <button type="button" class="child-mission-inline-action" data-toggle-subquest="${subquest.id}">${expanded ? 'Collapse' : 'Expand'}</button>
            </div>
            ${expanded ? `
              <div class="child-mission-checklist">
                ${renderChildMissionAssignments(subquest)}
                ${(subquest.subtasks || []).map((step, index) => `
                  <label class="child-mission-check">
                    <input type="checkbox" data-step-toggle="${subquest.id}" data-step-index="${index}" ${step.done ? 'checked' : ''}>
                    <span>${step.title}</span>
                  </label>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function syncIdeaQuestProgress(quest) {
  const subquests = getQuestSubquests(quest);
  if (!subquests.length) return;

  const branchSubtasks = (quest.subtasks || []).filter(task => task.branchId);
  branchSubtasks.forEach(task => {
    const subquest = subquests.find(child => child.branchId === task.branchId);
    if (!subquest) return;
    task.done = subquest.status === 'done' || (subquest.subtasks || []).every(step => step.done);
  });

  const allDone = subquests.every(subquest => subquest.status === 'done' || (subquest.subtasks || []).every(step => step.done));
  if (allDone) quest.status = 'review';
}

function buildIdeaQuest(idea, polish, orchestration) {
  const questId = createIdeaFlowId();
  const recommendedAgents = orchestration.squad.slice(0, 3);
  const questType = orchestration.branches[0]?.type || (orchestration.track === 'Automation Mission' ? 'automation_missions' : orchestration.track === 'Creative Mission' ? 'creative_missions' : 'main_quests');
  const subquests = buildKirbySubquests(idea, polish, orchestration, questId);
  return {
    id: questId,
    title: idea.title,
    description: `${polish.spark} ${polish.value}`,
    status: 'backlog',
    type: questType,
    difficulty: 'medium',
    urgency: idea.goal ? 'medium' : 'low',
    risk: 'medium',
    estimatedDuration: '3h',
    reward: { xp: 120, credits: 45, crystals: 2 },
    recommendedAgents,
    subtasks: [
      { title: 'Selphie polish pass', done: true },
      { title: `Kirby routes ${orchestration.primaryBranch}`, done: true },
      ...orchestration.branches.map(branch => ({ title: `${branch.label} child mission complete`, branchId: branch.id, done: false }))
    ],
    comments: [
      { author: 'Selphie', text: polish.hook },
      { author: 'Kirby', text: orchestration.commandNote }
    ],
    ideaFlow: {
      questId,
      submittedAt: new Date().toISOString(),
      idea,
      polish,
      orchestration,
      subquests
    }
  };
}

function renderIdeaFlowPanels() {
  const selphieNode = document.getElementById('selphie-polish-output');
  const kirbyNode = document.getElementById('kirby-orchestration-output');
  const statusNode = document.getElementById('idea-intake-status');
  const flow = GAME_STATE.ideaFlow;

  if (!selphieNode || !kirbyNode || !statusNode) return;

  if (!flow) {
    selphieNode.classList.add('empty');
    kirbyNode.classList.add('empty');
    selphieNode.textContent = 'No polished brief yet.';
    kirbyNode.textContent = 'No orchestration plan yet.';
    statusNode.textContent = 'Selphie is standing by in the Creative Room.';
    return;
  }

  selphieNode.classList.remove('empty');
  kirbyNode.classList.remove('empty');

  selphieNode.innerHTML = `
    <h3>${flow.idea.title}</h3>
    <p><strong>Spark:</strong> ${flow.polish.spark}</p>
    <p><strong>Audience:</strong> ${flow.polish.audience}</p>
    <p><strong>Value:</strong> ${flow.polish.value}</p>
    <ul>${flow.polish.deliverables.map(item => `<li>${item}</li>`).join('')}</ul>
  `;

  kirbyNode.innerHTML = `
    <h3>${flow.orchestration.track}</h3>
    <p>${flow.orchestration.commandNote}</p>
    <div class="branch-pill-row">${flow.orchestration.branches.map(branch => `<span class="branch-pill">P${branch.priority} ${branch.label}</span>`).join('')}</div>
    <p><strong>Squad:</strong> ${flow.orchestration.squad.map(id => AGENT_ROSTER[id]?.name || id).join(', ')}</p>
    <ol>${flow.orchestration.phases.map(item => `<li>${item}</li>`).join('')}</ol>
    ${renderChildMissionCards({ ideaFlow: flow })}
    <div class="branch-route-list">
      ${flow.orchestration.branches.map(branch => `
        <div class="branch-route-card">
          <p><strong>${branch.label}</strong> led by ${AGENT_ROSTER[branch.lead]?.name || branch.lead}</p>
          <p>${branch.summary}</p>
        </div>
      `).join('')}
    </div>
  `;

  kirbyNode.querySelectorAll('.child-mission-card').forEach(button => {
    button.querySelector('[data-open-subquest]')?.addEventListener('click', () => showMissionDetailModal(button.dataset.subquestId));
    button.querySelector('[data-toggle-subquest]')?.addEventListener('click', () => {
      toggleChildMissionExpansion(button.dataset.subquestId);
      renderIdeaFlowPanels();
    });
    button.querySelector('.child-mission-summary')?.addEventListener('click', () => {
      toggleChildMissionExpansion(button.dataset.subquestId);
      renderIdeaFlowPanels();
    });
    button.querySelectorAll('[data-step-toggle]').forEach(input => {
      input.addEventListener('change', event => {
        setChildMissionStep(input.dataset.stepToggle, Number(input.dataset.stepIndex), event.target.checked);
      });
    });
    button.querySelectorAll('[data-agent-toggle]').forEach(agentButton => {
      agentButton.addEventListener('click', event => {
        event.preventDefault();
        toggleChildMissionAgent(agentButton.dataset.agentToggle, agentButton.dataset.agentId);
      });
    });
  });

  statusNode.textContent = `Selphie polished “${flow.idea.title}” and handed it to Kirby for orchestration.`;
}

function handleIdeaIntake(event) {
  event.preventDefault();
  const title = document.getElementById('idea-title-input')?.value.trim();
  const goal = document.getElementById('idea-goal-input')?.value.trim() || '';
  const summary = document.getElementById('idea-summary-input')?.value.trim() || '';
  if (!title || !summary) return;

  const idea = { title, goal, summary };
  const polish = buildSelphiePolish(idea);
  const orchestration = buildKirbyOrchestration(idea, polish);
  const quest = buildIdeaQuest(idea, polish, orchestration);

  quests.unshift(quest);
  GAME_STATE.ideaFlow = { ...quest.ideaFlow };
  questFilter = null;

  saveRuntimeState();
  renderIdeaFlowPanels();
  renderQuestBoard();
  renderActiveMissions();
  renderHqSystems();
  renderAgentStations();
  renderThreatConsole();
  updateAdvisorRecommendation();

  const form = document.getElementById('idea-intake-form');
  form?.reset();

  const msg = document.getElementById('global-status-message');
  if (msg) msg.textContent = `Selphie polished ${title}. Kirby converted it into a production quest.`;

  GAME_STATE.activeAlerts.unshift({
    type: 'success',
    message: `Selphie polished ${title}. Kirby is orchestrating the build.`,
    at: Date.now()
  });
  renderResourceHUD();
  renderLiveAlerts();
  pulseQuestCard(quest.id);
}

function ensureAudioContext() {
  if (!IMMERSION_STATE.uiAudio) return null;
  if (!IMMERSION_STATE.audioContext) {
    IMMERSION_STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (IMMERSION_STATE.audioContext.state === 'suspended') {
    IMMERSION_STATE.audioContext.resume().catch(() => {});
  }
  return IMMERSION_STATE.audioContext;
}

function playUiBlip(type = 'soft') {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  const base = type === 'confirm' ? 520 : type === 'alert' ? 260 : 420;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.15, now + 0.05);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.type = type === 'alert' ? 'square' : 'triangle';
  osc.start(now);
  osc.stop(now + 0.14);
}

function playDeploySweep() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(860, now + 0.9);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(700, now);
  filter.frequency.exponentialRampToValueAtTime(3800, now + 0.9);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

  osc.start(now);
  osc.stop(now + 1.02);
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  const next = document.getElementById(screenId);
  if (next) next.classList.add('active');
  GAME_STATE.currentScreen = screenId;
}

function updateNavState(screenId) {
  document.querySelectorAll('#main-navigation .nav-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.targetScreen === screenId);
  });
}

function animateCounter(key, target, node) {
  const current = hudDisplay[key] ?? 0;
  const delta = target - current;
  if (Math.abs(delta) < 1) {
    hudDisplay[key] = target;
    if (node) node.textContent = Math.round(target);
    return;
  }

  const step = delta / 10;
  hudDisplay[key] = current + step;
  if (node) {
    node.textContent = Math.round(hudDisplay[key]);
    node.classList.add('counter-pop');
    setTimeout(() => node.classList.remove('counter-pop'), 150);
  }
  requestAnimationFrame(() => animateCounter(key, target, node));
}

function renderResourceHUD() {
  const xp = document.getElementById('xp-display');
  const credits = document.getElementById('credits-display');
  const crystals = document.getElementById('crystals-display');
  const alerts = document.getElementById('alerts-summary');

  animateCounter('xp', GAME_STATE.xp, xp);
  animateCounter('credits', GAME_STATE.credits, credits);
  animateCounter('crystals', GAME_STATE.crystals, crystals);

  if (alerts) {
    alerts.textContent = GAME_STATE.activeAlerts.length > 0
      ? `${GAME_STATE.activeAlerts.length} alert${GAME_STATE.activeAlerts.length > 1 ? 's' : ''}`
      : 'No active alerts';
  }
}

function renderLiveAlerts() {
  const list = document.getElementById('live-alerts-list');
  if (!list) return;
  const rows = GAME_STATE.activeAlerts.slice(0, 6);
  list.innerHTML = rows.length
    ? rows.map(a => `<li class="alert-row alert-${a.type || 'info'}">${a.message}</li>`).join('')
    : '<li>All systems stable.</li>';
}

function spawnBaseAmbience() {
  const layer = document.getElementById('ambience-layer');
  if (!layer) return;
  if (!IMMERSION_STATE.ambienceFx) {
    layer.innerHTML = '';
    return;
  }
  if (layer.childElementCount > 0) return;

  for (let i = 0; i < 20; i += 1) {
    const dot = document.createElement('i');
    dot.className = 'ambience-dot';
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    dot.style.animationDelay = `${Math.random() * 3}s`;
    dot.style.animationDuration = `${4 + Math.random() * 5}s`;
    layer.appendChild(dot);
  }
}

function updateDayNightCycle() {
  const overlay = document.getElementById('day-night-cycle');
  if (!overlay) return;
  const now = new Date();
  const minutes = (now.getHours() * 60) + now.getMinutes();
  const dayRatio = Math.abs((minutes - 720) / 720);
  const darkness = Math.min(0.72, dayRatio * 0.72);
  overlay.style.opacity = `${darkness.toFixed(3)}`;
}

function startDayNightCycle() {
  updateDayNightCycle();
  if (IMMERSION_STATE.dayNightTimer) return;
  IMMERSION_STATE.dayNightTimer = setInterval(updateDayNightCycle, 30000);
}

function getHotAgents() {
  const hot = new Set();
  quests
    .filter(q => q.status === 'in_progress' || q.status === 'review')
    .forEach(q => (q.recommendedAgents || []).forEach(id => hot.add(id)));
  return hot;
}

function getAgentMissionState(agentId) {
  const related = quests.filter(q => (q.recommendedAgents || []).includes(agentId));
  if (!related.length) return 'idle';

  const critical = related.some(q =>
    (q.status === 'in_progress' || q.status === 'review') && (q.urgency === 'high' || q.risk === 'high')
  );
  if (critical) return 'critical';
  if (related.some(q => q.status === 'review')) return 'review';
  if (related.some(q => q.status === 'in_progress')) return 'active';
  if (related.some(q => q.status === 'backlog')) return 'standby';
  return 'idle';
}

function getAgentThreatTier(agentId) {
  const activeRelated = quests.filter(q =>
    (q.recommendedAgents || []).includes(agentId)
    && (q.status === 'in_progress' || q.status === 'review')
  );

  if (!activeRelated.length) return 'none';

  const severeSignals = activeRelated.filter(q => q.urgency === 'high' && q.risk === 'high').length;
  const highSignals = activeRelated.filter(q => q.urgency === 'high' || q.risk === 'high').length;

  if (severeSignals >= 2 || highSignals >= 3) return 'systemic';
  if (severeSignals >= 1) return 'severe';
  if (highSignals >= 1) return 'high';
  return 'none';
}

function humanizeAgentState(state) {
  const map = {
    critical: 'Critical',
    review: 'Review',
    active: 'In Mission',
    standby: 'Standby',
    idle: 'Idle'
  };
  return map[state] || 'Idle';
}

function syncAgentStatuses() {
  Object.values(AGENT_ROSTER).forEach(agent => {
    const state = getAgentMissionState(agent.id);
    const threatTier = getAgentThreatTier(agent.id);
    agent.missionState = state;
    agent.threatTier = threatTier;
    agent.status = humanizeAgentState(state);
  });
}

function renderAgentStations() {
  const grid = document.getElementById('agent-stations-grid');
  if (!grid) return;
  grid.innerHTML = '';

  syncAgentStatuses();

  const hotAgents = getHotAgents();
  Object.values(AGENT_ROSTER).forEach(agent => {
    const layout = STATION_LAYOUT[agent.id] || { x: 50, y: 50 };
    const card = document.createElement('button');
    card.className = 'agent-station-icon';
    card.type = 'button';
    card.style.backgroundImage = `url(${agent.avatar})`;
    card.title = `${agent.name} • ${agent.roomTheme} • ${agent.status}`;
    card.dataset.agentId = agent.id;
    card.dataset.threatTier = agent.threatTier || 'none';
    card.classList.add(`station-state-${agent.missionState || 'idle'}`);
    if (agent.threatTier && agent.threatTier !== 'none') card.classList.add(`station-threat-${agent.threatTier}`);
    card.style.left = `${layout.x}%`;
    card.style.top = `${layout.y}%`;
    card.innerHTML = `
      <span class="station-nameplate">${agent.name}</span>
      <span class="station-roleplate">${agent.role}</span>
    `;
    if (hotAgents.has(agent.id)) card.classList.add('is-hot');
    card.addEventListener('click', () => openRoomOverlay(agent.id));
    grid.appendChild(card);
  });

  renderAlertRoutingLayer();
}

function renderAlertRoutingLayer() {
  const svg = document.getElementById('alert-routing-layer');
  const map = document.getElementById('base-map-area');
  if (!svg || !map || !IMMERSION_STATE.ambienceFx) {
    if (svg) svg.innerHTML = '';
    return;
  }

  const kirbyNode = map.querySelector('.agent-station-icon[data-agent-id="kirby"]');
  if (!kirbyNode) {
    svg.innerHTML = '';
    return;
  }

  const criticalNodes = [...map.querySelectorAll('.agent-station-icon.station-state-critical')]
    .filter(node => node.dataset.agentId !== 'kirby');

  if (!criticalNodes.length) {
    svg.innerHTML = '';
    return;
  }

  const mapRect = map.getBoundingClientRect();
  const fromRect = kirbyNode.getBoundingClientRect();
  const startX = (fromRect.left + (fromRect.width / 2)) - mapRect.left;
  const startY = (fromRect.top + (fromRect.height / 2)) - mapRect.top;

  svg.setAttribute('viewBox', `0 0 ${Math.max(1, mapRect.width)} ${Math.max(1, mapRect.height)}`);
  svg.innerHTML = '';

  criticalNodes.forEach(node => {
    const toRect = node.getBoundingClientRect();
    const endX = (toRect.left + (toRect.width / 2)) - mapRect.left;
    const endY = (toRect.top + (toRect.height / 2)) - mapRect.top;

    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 24;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const tier = node.dataset.threatTier || 'high';
    path.setAttribute('class', `alert-route route-tier-${tier}`);
    path.setAttribute('d', `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`);
    svg.appendChild(path);

    const nodeDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nodeDot.setAttribute('class', `alert-route-node route-tier-${tier}`);
    nodeDot.setAttribute('cx', `${endX}`);
    nodeDot.setAttribute('cy', `${endY}`);
    nodeDot.setAttribute('r', '3.4');
    svg.appendChild(nodeDot);
  });
}

function openRoomOverlay(agentId) {
  syncAgentStatuses();
  const agent = AGENT_ROSTER[agentId];
  if (!agent) return;

  const overlay = document.getElementById('room-overlay');
  const title = document.getElementById('room-overlay-title');
  const role = document.getElementById('room-overlay-role');
  const status = document.getElementById('room-overlay-status');
  const tags = document.getElementById('room-overlay-tags');

  if (title) title.textContent = `${agent.roomTheme} • ${agent.name}`;
  if (role) role.textContent = `${agent.role} • Level ${agent.level}`;
  if (status) status.textContent = `Status: ${agent.status} • Threat ${agent.threatTier || 'none'} • Energy ${agent.energy} • Bond ${agent.affinity}`;
  if (tags) tags.innerHTML = agent.specialties.map(tag => `<span>${tag}</span>`).join('');

  if (overlay) {
    overlay.classList.add('show');
    const key = agent.roomTheme.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    overlay.dataset.room = key;
  }

  GAME_STATE.currentRoomAgent = agent.id;
  renderRoomAmbience(agent);
  playUiBlip('confirm');

  const msg = document.getElementById('global-status-message');
  if (msg) msg.textContent = `${agent.name} station opened.`;
}

function closeRoomOverlay() {
  const overlay = document.getElementById('room-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  delete overlay.dataset.room;
  delete GAME_STATE.currentRoomAgent;
  const ambience = document.getElementById('room-overlay-ambience');
  if (ambience) ambience.innerHTML = '';
  playUiBlip('soft');
}

function getRoomParticleTone(roomKey) {
  if (roomKey.includes('mystic') || roomKey.includes('sanctum')) return 'violet';
  if (roomKey.includes('healing') || roomKey.includes('grove')) return 'green';
  if (roomKey.includes('code') || roomKey.includes('launch') || roomKey.includes('security')) return 'blue';
  if (roomKey.includes('music') || roomKey.includes('vocal')) return 'gold';
  return 'default';
}

function renderRoomAmbience(agent) {
  const box = document.getElementById('room-overlay-ambience');
  if (!box) return;
  box.innerHTML = '';
  if (!IMMERSION_STATE.ambienceFx) return;

  const roomKey = agent.roomTheme.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const tone = getRoomParticleTone(roomKey);
  box.dataset.tone = tone;

  const count = 14;
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement('i');
    p.className = 'room-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 2.2}s`;
    p.style.animationDuration = `${2.6 + (Math.random() * 3.6)}s`;
    box.appendChild(p);
  }
}

function chooseQuestType(task) {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  if (task.priority === 'high') return 'urgent_alerts';
  if (text.includes('autom') || text.includes('workflow')) return 'automation_missions';
  if (text.includes('guide') || text.includes('doc')) return 'main_quests';
  if (text.includes('creative') || text.includes('music') || text.includes('content')) return 'creative_missions';
  return 'side_quests';
}

function chooseDifficulty(task) {
  const n = task.subtasks?.length || 0;
  if (task.priority === 'high' || n >= 8) return 'hard';
  if (n >= 4) return 'medium';
  return 'easy';
}

function chooseUrgency(task) {
  if (task.priority === 'high') return 'high';
  if (task.priority === 'medium') return 'medium';
  return 'low';
}

function chooseAgents(task) {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  const picks = [];
  if (text.includes('code') || text.includes('autom')) picks.push('tails', 'mario');
  if (text.includes('doc') || text.includes('guide')) picks.push('professor_oak', 'zelda');
  if (text.includes('social') || text.includes('brand') || text.includes('content')) picks.push('rinoa', 'peach');
  if (text.includes('security') || text.includes('risk')) picks.push('samus', 'link');
  if (picks.length === 0) picks.push('kirby', 'zelda');
  return [...new Set(picks)].slice(0, 3);
}

function hydrateQuests(rawTasks) {
  return rawTasks.map(task => ({
    ...task,
    type: task.type || chooseQuestType(task),
    difficulty: task.difficulty || chooseDifficulty(task),
    urgency: task.urgency || chooseUrgency(task),
    risk: task.risk || (task.priority === 'high' ? 'high' : 'medium'),
    estimatedDuration: task.estimatedDuration || `${Math.max(1, task.subtasks?.length || 1)}h`,
    reward: task.reward || {
      xp: (task.subtasks?.length || 1) * 40,
      credits: task.priority === 'high' ? 40 : 20,
      crystals: task.priority === 'high' ? 2 : 1
    },
    recommendedAgents: task.recommendedAgents || chooseAgents(task)
  }));
}

function renderQuestFilters() {
  const el = document.getElementById('quest-filters');
  if (!el) return;
  el.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `filter-button nav-button ${questFilter ? '' : 'active'}`;
  allBtn.textContent = 'All Quests';
  allBtn.addEventListener('click', () => {
    questFilter = null;
    renderQuestBoard();
  });
  el.appendChild(allBtn);

  QUEST_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-button nav-button ${questFilter === cat.id ? 'active' : ''}`;
    btn.textContent = `${cat.icon} ${cat.name}`;
    btn.addEventListener('click', () => {
      questFilter = cat.id;
      renderQuestBoard();
    });
    el.appendChild(btn);
  });
}

function renderQuestBoard() {
  renderIdeaFlowPanels();
  renderQuestFilters();
  const list = document.getElementById('quest-list');
  if (!list) return;
  list.innerHTML = '';

  const visible = quests.filter(q => q.status !== 'done' && q.status !== 'permanent')
    .filter(q => (questFilter ? q.type === questFilter : true));

  if (visible.length === 0) {
    list.innerHTML = '<div class="hud-panel">No quests in this category.</div>';
    return;
  }

  visible.forEach(quest => {
    syncIdeaQuestProgress(quest);
    const { done, total, percent: progress } = countMissionProgress(quest);

    const card = document.createElement('article');
    card.className = `quest-card hud-panel status-${quest.status}`;
    card.dataset.questId = quest.id;
    card.innerHTML = `
      <div class="quest-card-header">
        <h3>${QUEST_CATEGORIES.find(c => c.id === quest.type)?.icon || '❓'} ${quest.title}</h3>
        <span class="quest-difficulty difficulty-${quest.difficulty}">${quest.difficulty.toUpperCase()}</span>
      </div>
      <div class="quest-card-body">
        <p>Status: <span class="status-text">${quest.status.replace('_', ' ').toUpperCase()}</span></p>
        <p>Urgency: <span class="urgency-${quest.urgency}">${quest.urgency.toUpperCase()}</span></p>
        <p>Risk: <span class="urgency-${quest.risk === 'high' ? 'high' : quest.risk === 'low' ? 'low' : 'medium'}">${quest.risk.toUpperCase()}</span></p>
        <p>ETA: ${quest.estimatedDuration}</p>
        <div class="quest-progress">
          <div class="quest-progress-head"><span>Progress</span><span>${done}/${total || 0}</span></div>
          <div class="quest-progress-bar"><i style="width:${progress}%"></i></div>
        </div>
        ${quest.ideaFlow ? `
          <div class="quest-handoff-strip">
            <span>Selphie polished</span>
            <i></i>
            <span>Kirby orchestrating</span>
          </div>
          <div class="quest-branch-chip-row">
            ${quest.ideaFlow.orchestration.branches.map(branch => `<span class="quest-branch-chip">${branch.label}</span>`).join('')}
          </div>
          ${renderChildMissionCards(quest)}
          <p class="quest-brief-line"><strong>Selphie:</strong> ${quest.ideaFlow.polish.spark}</p>
          <p class="quest-brief-line"><strong>Kirby:</strong> ${quest.ideaFlow.orchestration.commandNote}</p>
        ` : ''}
        <p class="reward-text">Reward: ${quest.reward.xp} XP • ${quest.reward.credits} Credits • ${quest.reward.crystals || 0} Crystals</p>
        <div class="recommended-agents">Recommended: ${quest.recommendedAgents.map(id => `<img src="${AGENT_ROSTER[id]?.avatar}" class="agent-thumbnail" title="${AGENT_ROSTER[id]?.name}">`).join('')}</div>
      </div>
      <button class="view-mission-details nav-button" data-quest-id="${quest.id}">Mission Detail</button>
    `;

    card.querySelector('.view-mission-details')?.addEventListener('click', () => showMissionDetailModal(quest.id));
    card.querySelectorAll('.child-mission-card').forEach(button => {
      button.querySelector('.child-mission-summary')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleChildMissionExpansion(button.dataset.subquestId);
        renderQuestBoard();
      });
      button.querySelector('[data-open-subquest]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showMissionDetailModal(button.dataset.subquestId);
      });
      button.querySelector('[data-toggle-subquest]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleChildMissionExpansion(button.dataset.subquestId);
        renderQuestBoard();
      });
      button.querySelectorAll('[data-step-toggle]').forEach(input => {
        input.addEventListener('change', event => {
          event.stopPropagation();
          setChildMissionStep(input.dataset.stepToggle, Number(input.dataset.stepIndex), event.target.checked);
        });
      });
      button.querySelectorAll('[data-agent-toggle]').forEach(agentButton => {
        agentButton.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          toggleChildMissionAgent(agentButton.dataset.agentToggle, agentButton.dataset.agentId);
        });
      });
    });
    list.appendChild(card);
  });
}

function pulseQuestCard(questId) {
  const card = document.querySelector(`#quest-list .quest-card[data-quest-id="${questId}"]`);
  if (!card) return;
  card.classList.add('focus-pulse');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => card.classList.remove('focus-pulse'), 2200);
}

function focusThreatTarget(agentId, questId) {
  if (!agentId || !questId) return;
  if (AGENT_ROSTER[agentId]) openRoomOverlay(agentId);

  setTimeout(() => {
    closeRoomOverlay();
    switchScreen('quest-board-view');
    updateNavState('quest-board-view');
    renderQuestBoard();
    pulseQuestCard(questId);
    const msg = document.getElementById('global-status-message');
    if (msg) msg.textContent = `Focused mission: ${quests.find(q => q.id === questId)?.title || questId}`;
  }, 520);
}

function resolveThreatNow(agentId, questId) {
  if (!questId) return;
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  syncAgentStatuses();
  if (agentId && AGENT_ROSTER[agentId]) {
    openRoomOverlay(agentId);
    setTimeout(() => closeRoomOverlay(), 420);
  }

  GAME_STATE.selectedQuest = quest;
  GAME_STATE.selectedAgents = bestSquadForQuest(quest);

  switchScreen('quest-board-view');
  updateNavState('quest-board-view');
  renderQuestBoard();
  showMissionDetailModal(quest.id);
  playUiBlip('confirm');

  const msg = document.getElementById('global-status-message');
  if (msg) msg.textContent = `Resolve Now armed for ${quest.title}. Best squad preloaded.`;
}

function renderAgentRoster(focusAgentId = null) {
  const grid = document.getElementById('agent-cards-grid');
  if (!grid) return;
  grid.innerHTML = '';

  syncAgentStatuses();

  const agents = Object.values(AGENT_ROSTER);
  agents.sort((a, b) => (a.id === focusAgentId ? -1 : b.id === focusAgentId ? 1 : a.name.localeCompare(b.name)));

  agents.forEach(agent => {
    const selected = GAME_STATE.selectedAgents.includes(agent.id);
    const card = document.createElement('article');
    card.className = `agent-card hud-panel state-${agent.missionState || 'idle'} ${selected ? 'selected' : ''}`;
    card.dataset.agentId = agent.id;
    card.innerHTML = `
      <div class="agent-head">
        <img src="${agent.avatar}" alt="${agent.name}">
        <div>
          <h3>${agent.name}</h3>
          <p>${agent.role} • Lv ${agent.level} • <span class="agent-state-pill threat-${agent.threatTier || 'none'}">${agent.status}</span></p>
          <p>${agent.roomTheme}</p>
        </div>
      </div>
      <div class="agent-meters">
        <label>Energy <span>${agent.energy}</span></label>
        <div class="meter"><i style="width:${agent.energy}%"></i></div>
        <label>Bond <span>${agent.affinity}</span></label>
        <div class="meter bond"><i style="width:${agent.affinity}%"></i></div>
      </div>
      <div class="agent-tags">${agent.specialties.map(t => `<span>${t}</span>`).join('')}</div>
    `;
    grid.appendChild(card);
  });
}

function renderActiveMissions() {
  const list = document.getElementById('active-missions-list');
  if (!list) return;
  const active = quests.filter(q => q.status === 'in_progress' || q.status === 'review');
  list.innerHTML = active.length
    ? active.map(q => {
      const done = (q.subtasks || []).filter(s => s.done).length;
      const total = (q.subtasks || []).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `<li>${q.title} <span class="mission-inline-progress">(${pct}%)</span></li>`;
    }).join('')
    : '<li>No missions in progress.</li>';
}

function renderHqSystems() {
  const panel = document.getElementById('hq-systems-summary');
  if (!panel) return;

  syncAgentStatuses();

  const agents = Object.values(AGENT_ROSTER);
  const avgEnergy = Math.round(agents.reduce((acc, a) => acc + (a.energy || 0), 0) / Math.max(agents.length, 1));
  const avgBond = Math.round(agents.reduce((acc, a) => acc + (a.affinity || 0), 0) / Math.max(agents.length, 1));
  const activeCount = quests.filter(q => q.status === 'in_progress').length;
  const reviewCount = quests.filter(q => q.status === 'review').length;
  const alertScore = Math.min(100, GAME_STATE.activeAlerts.length * 8);
  const criticalStations = agents.filter(a => a.missionState === 'critical').length;
  const activeStations = agents.filter(a => a.missionState === 'active' || a.missionState === 'review').length;

  panel.innerHTML = `
    <div class="system-line"><span>Power Grid</span><b>${avgEnergy}%</b></div>
    <div class="system-line"><span>Guild Cohesion</span><b>${avgBond}%</b></div>
    <div class="system-line"><span>Live Deployments</span><b>${activeCount}</b></div>
    <div class="system-line"><span>Review Queue</span><b>${reviewCount}</b></div>
    <div class="system-line"><span>Active Stations</span><b>${activeStations}</b></div>
    <div class="system-line ${criticalStations > 0 ? 'warning' : ''}"><span>Critical Stations</span><b>${criticalStations}</b></div>
    <div class="system-line ${alertScore >= 50 ? 'warning' : ''}"><span>Alert Pressure</span><b>${alertScore}%</b></div>
  `;
}

function parseDurationHours(estimatedDuration) {
  const raw = String(estimatedDuration || '').toLowerCase();
  const match = raw.match(/(\d+(?:\.\d+)?)\s*h/);
  const hours = match ? Number(match[1]) : 1;
  return Number.isFinite(hours) ? Math.max(1, hours) : 1;
}

function getQuestStartMs(quest) {
  if (quest.startedAt) {
    const ms = Number(quest.startedAt);
    if (Number.isFinite(ms)) return ms;
  }
  const created = Date.parse(quest.createdAt || '');
  if (Number.isFinite(created)) return created;
  return Date.now() - (30 * 60 * 1000);
}

function getThreatRows() {
  const rows = [];
  const now = Date.now();

  quests
    .filter(q => q.status === 'in_progress' || q.status === 'review')
    .forEach(quest => {
      const involved = quest.recommendedAgents || [];
      const durationMs = parseDurationHours(quest.estimatedDuration) * 60 * 60 * 1000;
      const elapsed = Math.max(0, now - getQuestStartMs(quest));
      const remainingMs = Math.max(0, durationMs - elapsed);
      const riskWeight = quest.risk === 'high' ? 40 : quest.risk === 'medium' ? 20 : 10;
      const urgencyWeight = quest.urgency === 'high' ? 40 : quest.urgency === 'medium' ? 20 : 10;
      const statusWeight = quest.status === 'review' ? 15 : 25;
      const pressure = Math.min(100, riskWeight + urgencyWeight + statusWeight);

      involved.forEach(agentId => {
        rows.push({
          agentId,
          questId: quest.id,
          pressure,
          remainingMs,
          questTitle: quest.title
        });
      });
    });

  const grouped = Object.values(rows.reduce((acc, row) => {
    if (!acc[row.agentId]) {
      acc[row.agentId] = {
        agentId: row.agentId,
        pressure: 0,
        remainingMs: row.remainingMs,
        questId: row.questId,
        questTitle: row.questTitle
      };
    }
    acc[row.agentId].pressure = Math.max(acc[row.agentId].pressure, row.pressure);
    if (row.remainingMs < acc[row.agentId].remainingMs) {
      acc[row.agentId].remainingMs = row.remainingMs;
      acc[row.agentId].questId = row.questId;
      acc[row.agentId].questTitle = row.questTitle;
    }
    return acc;
  }, {}));

  return grouped.sort((a, b) => b.pressure - a.pressure || a.remainingMs - b.remainingMs).slice(0, 3);
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function renderThreatConsole() {
  const box = document.getElementById('threat-console-list');
  if (!box) return;

  const rows = getThreatRows();
  if (!rows.length) {
    box.innerHTML = '<div class="threat-row calm">No active pressure.</div>';
    return;
  }

  box.innerHTML = rows.map((row, idx) => {
    const agent = AGENT_ROSTER[row.agentId];
    const tier = row.pressure >= 90 ? 'systemic' : row.pressure >= 75 ? 'severe' : 'high';
    return `
      <div class="threat-row tier-${tier}" data-agent-id="${row.agentId}" data-quest-id="${row.questId}">
        <div class="threat-head">
          <span class="threat-rank">#${idx + 1}</span>
          <span class="threat-agent">${agent?.name || row.agentId}</span>
          <span class="threat-pressure">${row.pressure}%</span>
        </div>
        <div class="threat-meta">
          <span class="threat-quest">${row.questTitle}</span>
          <span class="threat-time">T-${formatCountdown(row.remainingMs)}</span>
        </div>
        <div class="threat-actions">
          <button type="button" class="threat-resolve-button" data-agent-id="${row.agentId}" data-quest-id="${row.questId}">Resolve Now</button>
        </div>
      </div>
    `;
  }).join('');
}

function startThreatConsoleTicker() {
  if (threatConsoleTimer) return;
  threatConsoleTimer = setInterval(() => {
    if (GAME_STATE.currentScreen !== 'login-screen') renderThreatConsole();
  }, 1000);
}

function updateAdvisorRecommendation() {
  const node = document.getElementById('advisor-recommendation');
  if (!node) return;

  const targetQuest = quests.find(q => q.status === 'in_progress') || quests.find(q => q.status === 'backlog' || q.status === 'review');
  if (!targetQuest) {
    node.textContent = 'No mission available for analysis.';
    return;
  }

  const squad = recommendBestSquad(targetQuest);
  const synergy = calculateSynergy(squad);
  const names = squad.map(id => AGENT_ROSTER[id]?.name || id).join(', ');
  const synergyText = synergy.length ? `Synergy: ${synergy.map(s => s.name).join(' + ')}` : 'No synergy combo yet';
  node.textContent = `${targetQuest.title}: ${names}. ${synergyText}.`;
}

function simulateLiveEvent() {
  if (!quests.length) return;

  const pool = quests.filter(q => q.status === 'in_progress' || q.status === 'review' || q.status === 'backlog');
  if (!pool.length) return;

  const quest = pool[Math.floor(Math.random() * pool.length)];
  const event = LIVE_EVENT_TYPES[Math.floor(Math.random() * LIVE_EVENT_TYPES.length)];

  if (event === 'mission stuck') {
    quest.risk = 'high';
    quest.urgency = 'high';
    if (quest.status === 'in_progress') quest.status = 'review';
  }

  if (event === 'creative breakthrough') {
    quest.reward.xp += 15;
    quest.reward.credits += 5;
  }

  if (event === 'energy low') {
    quest.estimatedDuration = `${Math.max(2, parseInt(quest.estimatedDuration, 10) || 2)}h`;
  }

  if (event === 'trend spike') {
    quest.urgency = 'high';
  }

  GAME_STATE.activeAlerts.unshift({
    type: event.includes('risk') || event.includes('stuck') ? 'danger' : 'warning',
    message: `${quest.title}: ${event}`,
    at: Date.now()
  });

  document.getElementById('live-alerts-panel')?.classList.add('risk-spike');
  setTimeout(() => document.getElementById('live-alerts-panel')?.classList.remove('risk-spike'), 850);

  renderResourceHUD();
  renderLiveAlerts();
  renderActiveMissions();
  renderHqSystems();
  renderAgentStations();
  renderThreatConsole();
  updateAdvisorRecommendation();

  if (GAME_STATE.currentScreen === 'quest-board-view') renderQuestBoard();
}

function startEventSimulation() {
  if (eventSimulationTimer) return;
  eventSimulationTimer = setInterval(simulateLiveEvent, 18000);
}

function scoreAgentForQuest(agent, quest) {
  let score = 0;
  const text = `${quest.title} ${quest.description || ''}`.toLowerCase();
  const spec = agent.specialties.join(' ').toLowerCase();

  if (quest.recommendedAgents.includes(agent.id)) score += 16;
  if (text.includes('risk') || text.includes('security')) {
    if (spec.includes('threat') || spec.includes('research')) score += 10;
  }
  if (text.includes('creative') || text.includes('music') || text.includes('content')) {
    if (spec.includes('concept') || spec.includes('production') || spec.includes('engagement')) score += 10;
  }
  if (text.includes('autom') || text.includes('workflow') || text.includes('code')) {
    if (spec.includes('automation') || spec.includes('coding') || spec.includes('workflow')) score += 10;
  }
  score += Math.floor(agent.energy / 18);
  score += Math.floor(agent.affinity / 24);
  return score;
}

function recommendBestSquad(quest) {
  const agents = Object.values(AGENT_ROSTER)
    .map(agent => ({ agent, score: scoreAgentForQuest(agent, quest) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(x => x.agent.id);

  let best = agents.slice(0, 3);
  let bestScore = -Infinity;

  for (let i = 0; i < agents.length; i += 1) {
    for (let j = i + 1; j < agents.length; j += 1) {
      for (let k = j + 1; k < agents.length; k += 1) {
        const squad = [agents[i], agents[j], agents[k]];
        const synergy = calculateSynergy(squad);
        const base = squad.reduce((acc, id) => acc + scoreAgentForQuest(AGENT_ROSTER[id], quest), 0);
        const score = base + (synergy.length * 25);
        if (score > bestScore) {
          best = squad;
          bestScore = score;
        }
      }
    }
  }

  if (!best.includes('kirby')) best[0] = 'kirby';
  return [...new Set(best)].slice(0, 3);
}

function bestSquadForQuest(quest) {
  return recommendBestSquad(quest);
}

function renderMissionDetailSubquests(container, parentQuest, activeMissionId) {
  container.querySelector('#mission-subquest-section')?.remove();
  const subquests = getQuestSubquests(parentQuest);
  if (!subquests.length) return;

  const block = document.createElement('section');
  block.id = 'mission-subquest-section';
  block.className = 'mission-subquest-section';
  block.innerHTML = `
    <h3>Child Missions</h3>
    <div class="mission-subquest-grid">
      ${subquests.map(subquest => {
        const progress = countMissionProgress(subquest);
        return `
          <button type="button" class="mission-subquest-tile ${subquest.id === activeMissionId ? 'active' : ''}" data-subquest-id="${subquest.id}">
            <span class="mission-subquest-title">${subquest.title}</span>
            <span class="mission-subquest-meta">${subquest.status.replace('_', ' ')} • ${subquest.estimatedDuration}</span>
            <span class="mission-subquest-meta">Lead: ${AGENT_ROSTER[subquest.branchData?.lead]?.name || subquest.branchData?.lead || 'Unknown'}</span>
            <span class="mission-subquest-meta">Assigned: ${getAssignedAgents(subquest).map(id => AGENT_ROSTER[id]?.name || id).join(', ') || 'Unassigned'}</span>
            <span class="mission-subquest-progress"><i style="width:${progress.percent}%"></i></span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  const deployBtn = document.getElementById('deploy-mission-button');
  container.insertBefore(block, deployBtn);

  block.querySelectorAll('.mission-subquest-tile').forEach(button => {
    button.addEventListener('click', () => showMissionDetailModal(button.dataset.subquestId));
  });
}

function renderSquadBuilder(container) {
  const slots = document.createElement('div');
  slots.className = 'squad-slots';
  slots.innerHTML = `
    <h3>Squad Slots (drag agents into slots)</h3>
    <div class="slot-row">
      <div class="squad-slot" data-slot="0"></div>
      <div class="squad-slot" data-slot="1"></div>
      <div class="squad-slot" data-slot="2"></div>
    </div>
  `;

  const fillSlots = () => {
    slots.querySelectorAll('.squad-slot').forEach((slot, i) => {
      const agentId = GAME_STATE.selectedAgents[i];
      if (!agentId) {
        slot.innerHTML = '<span>Empty</span>';
      } else {
        const a = AGENT_ROSTER[agentId];
        slot.innerHTML = `<img src="${a.avatar}" alt="${a.name}"><b>${a.name}</b>`;
      }
    });
    updateSynergyDisplay();
  };

  slots.querySelectorAll('.squad-slot').forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
      e.preventDefault();
      const agentId = e.dataTransfer.getData('text/plain');
      if (!agentId) return;
      const target = Number(slot.dataset.slot);
      GAME_STATE.selectedAgents[target] = agentId;
      GAME_STATE.selectedAgents = GAME_STATE.selectedAgents.filter(Boolean).slice(0, 3);
      fillSlots();
      renderDraggableAgents();
    });
  });

  const agentPool = document.createElement('div');
  agentPool.id = 'deploy-agent-selection';
  agentPool.innerHTML = '<h3>Agent Pool</h3><div class="agent-pool"></div>';

  const renderDraggableAgents = () => {
    const pool = agentPool.querySelector('.agent-pool');
    pool.innerHTML = '';
    Object.values(AGENT_ROSTER).forEach(agent => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `agent-select-button ${GAME_STATE.selectedAgents.includes(agent.id) ? 'selected' : ''}`;
      btn.draggable = true;
      btn.innerHTML = `<img src="${agent.avatar}" alt="${agent.name}"><span>${agent.name}</span>`;

      btn.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', agent.id);
      });

      btn.addEventListener('click', () => {
        const has = GAME_STATE.selectedAgents.includes(agent.id);
        if (has) {
          GAME_STATE.selectedAgents = GAME_STATE.selectedAgents.filter(id => id !== agent.id);
        } else if (GAME_STATE.selectedAgents.length < 3) {
          GAME_STATE.selectedAgents.push(agent.id);
        } else {
          GAME_STATE.selectedAgents[2] = agent.id;
        }
        fillSlots();
        renderDraggableAgents();
      });
      pool.appendChild(btn);
    });
  };

  container.appendChild(slots);

  const actions = document.createElement('div');
  actions.className = 'squad-actions';
  actions.innerHTML = `
    <button type="button" class="preset-button" id="auto-squad-button">Auto-fill Best Squad</button>
    <button type="button" class="preset-button" id="clear-squad-button">Clear Slots</button>
  `;

  actions.querySelector('#auto-squad-button')?.addEventListener('click', () => {
    if (!GAME_STATE.selectedQuest) return;
    GAME_STATE.selectedAgents = bestSquadForQuest(GAME_STATE.selectedQuest);
    fillSlots();
    renderDraggableAgents();
  });

  actions.querySelector('#clear-squad-button')?.addEventListener('click', () => {
    GAME_STATE.selectedAgents = [];
    fillSlots();
    renderDraggableAgents();
  });

  container.appendChild(actions);
  container.appendChild(agentPool);
  fillSlots();
  renderDraggableAgents();
}

function showMissionDetailModal(questId) {
  const { mission, parentQuest, isSubquest } = getMissionById(questId);
  if (!mission || !parentQuest) return;
  syncIdeaQuestProgress(parentQuest);
  GAME_STATE.selectedQuest = mission;
  GAME_STATE.selectedQuestParent = parentQuest;
  GAME_STATE.selectedAgents = getAssignedAgents(mission).length ? [...getAssignedAgents(mission)] : bestSquadForQuest(mission);

  const title = document.getElementById('mission-detail-title');
  const desc = document.getElementById('mission-detail-description');
  if (title) title.textContent = isSubquest ? `${parentQuest.title} • ${mission.title}` : mission.title;
  if (desc) desc.innerHTML = `${mission.description || 'No mission briefing.'}<br><br><strong>Difficulty:</strong> ${mission.difficulty.toUpperCase()}<br><strong>Duration:</strong> ${mission.estimatedDuration}<br><strong>Status:</strong> ${mission.status.replace('_', ' ').toUpperCase()}<br><strong>Assigned Squad:</strong> ${getAssignedAgents(mission).map(id => AGENT_ROSTER[id]?.name || id).join(', ') || 'Unassigned'}${isSubquest ? `<br><strong>Branch Lead:</strong> ${AGENT_ROSTER[mission.branchData?.lead]?.name || mission.branchData?.lead}<br><strong>Support:</strong> ${(mission.branchData?.support || []).map(id => AGENT_ROSTER[id]?.name || id).join(', ')}<br><strong>Parent Quest:</strong> ${parentQuest.title}` : mission.ideaFlow ? `<br><br><strong>Selphie Polish:</strong> ${mission.ideaFlow.polish.value}<br><strong>Kirby Track:</strong> ${mission.ideaFlow.orchestration.track}<br><strong>Primary Branch:</strong> ${mission.ideaFlow.orchestration.primaryBranch}<br><strong>Branch Routes:</strong> ${mission.ideaFlow.orchestration.branches.map(branch => `${branch.label} (${AGENT_ROSTER[branch.lead]?.name || branch.lead})`).join(' • ')}<br><strong>Orchestration Phases:</strong> ${mission.ideaFlow.orchestration.phases.join(' → ')}` : ''}`;

  const modal = document.getElementById('mission-detail-modal');
  const content = modal?.querySelector('.modal-content');
  if (!modal || !content) return;

  content.querySelector('#deploy-agent-selection')?.remove();
  content.querySelector('#synergy-display')?.remove();
  content.querySelector('.squad-slots')?.remove();
  content.querySelector('#mission-subquest-section')?.remove();

  const synergy = document.createElement('div');
  synergy.id = 'synergy-display';

  const deployBtn = document.getElementById('deploy-mission-button');
  renderSquadBuilder(content);
  content.insertBefore(synergy, deployBtn);
  renderMissionDetailSubquests(content, parentQuest, mission.id);

  updateSynergyDisplay();
  modal.classList.add('visible');
}

function updateSynergyDisplay() {
  const node = document.getElementById('synergy-display');
  if (!node) return;
  const active = calculateSynergy(GAME_STATE.selectedAgents);

  node.innerHTML = active.length
    ? `<h3>Synergy Active</h3>${active.map(s => `<p class="synergy-bonus">${s.name} • ${s.bonus}</p>`).join('')}`
    : '<h3>Synergy Active</h3><p>No synergy detected.</p>';
}

function hideMissionDetailModal() {
  document.getElementById('mission-detail-modal')?.classList.remove('visible');
}

function calculateMissionGrade(quest, synergies) {
  let score = 30;
  score += Math.min(30, (GAME_STATE.selectedAgents.length || 0) * 10);
  score += Math.min(30, synergies.length * 15);
  if (quest.difficulty === 'hard') score += 10;
  if (quest.urgency === 'high') score += 5;

  if (score >= 95) return 'Legendary';
  if (score >= 88) return 'SS';
  if (score >= 78) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

function gradeToScore(grade) {
  const map = { D: 30, C: 45, B: 60, A: 75, S: 85, SS: 92, Legendary: 98 };
  return map[grade] || 0;
}

function nextRecommendation(grade, synergyCount) {
  if (grade === 'Legendary' || grade === 'SS') return 'Push a Boss Mission and lock this squad as a preset.';
  if (grade === 'S') return 'Add one affinity match to chase SS.';
  if (synergyCount === 0) return 'Build around one named synergy combo before next deploy.';
  return 'Swap one slot for a higher-energy specialist to raise efficiency.';
}

async function playDeployCinematic(quest, grade) {
  const overlay = document.getElementById('deploy-cinematic');
  if (!overlay) return;
  playDeploySweep();
  const squadNames = GAME_STATE.selectedAgents.map(id => AGENT_ROSTER[id]?.name || id).join(' • ');
  overlay.innerHTML = `
    <div class="cinematic-card">
      <div class="cinematic-phase">Mission Link Established</div>
      <h2>Launching Quest</h2>
      <p>${quest.title}</p>
      <p class="cinematic-squad">Squad: ${squadNames || 'Unassigned'}</p>
      <p>Projected Grade: <strong>${grade}</strong></p>
      <div class="cinematic-scanline"></div>
    </div>
  `;
  overlay.classList.add('show');
  await new Promise(resolve => setTimeout(resolve, 1700));
  overlay.classList.remove('show');
}

async function handleDeployMission() {
  if (!GAME_STATE.selectedQuest) return;

  const q = GAME_STATE.selectedQuest;
  const parentQuest = GAME_STATE.selectedQuestParent || q;
  q.status = 'in_progress';
  if (!q.startedAt) q.startedAt = Date.now();
  GAME_STATE.xp += q.reward.xp;
  GAME_STATE.credits += q.reward.credits;
  GAME_STATE.crystals += q.reward.crystals || 0;

  const activeSynergy = calculateSynergy(GAME_STATE.selectedAgents);
  const grade = calculateMissionGrade(q, activeSynergy);

  await playDeployCinematic(q, grade);

  const efficiency = Math.min(99, Math.max(42, gradeToScore(grade) + (activeSynergy.length * 3)));
  const alertsEncountered = q.urgency === 'high'
    ? ['Urgent task spike', 'Risk alert']
    : activeSynergy.length > 0
      ? ['Combo ready']
      : ['Needs support'];

  GAME_STATE.missionLog.unshift({
    questId: q.id,
    title: q.title,
    agents: [...GAME_STATE.selectedAgents],
    synergy: activeSynergy.map(s => s.name),
    grade,
    efficiency,
    rewards: { ...q.reward },
    alertsEncountered,
    recommendation: nextRecommendation(grade, activeSynergy.length),
    at: new Date().toISOString()
  });

  if (q !== parentQuest) {
    (q.subtasks || []).forEach(step => { step.done = true; });
    q.status = 'done';
    syncIdeaQuestProgress(parentQuest);
  }

  GAME_STATE.activeAlerts.unshift({
    type: 'success',
    message: `${q.title} deployed • Grade ${grade}`,
    at: Date.now()
  });

  saveQuests(quests);
  saveRuntimeState();
  renderResourceHUD();
  renderLiveAlerts();
  renderActiveMissions();
  renderHqSystems();
  renderAgentStations();
  renderThreatConsole();
  updateAdvisorRecommendation();
  hideMissionDetailModal();
  switchScreen('mission-control-home');
  updateNavState('mission-control-home');
  const msg = document.getElementById('global-status-message');
  if (msg) msg.textContent = `Mission complete: ${q.title} • Grade ${grade}`;
}

function renderReports() {
  const view = document.querySelector('#reports-view main');
  if (!view) return;

  if (GAME_STATE.missionLog.length === 0) {
    view.innerHTML = '<p>No mission replays yet. Deploy a quest to generate your first report.</p>';
    return;
  }

  const avgEfficiency = Math.round(
    GAME_STATE.missionLog.reduce((acc, log) => acc + (log.efficiency || 0), 0) / GAME_STATE.missionLog.length
  );
  const topGrade = GAME_STATE.missionLog
    .map(log => gradeToScore(log.grade))
    .reduce((a, b) => Math.max(a, b), 0);

  const topAgents = Object.values(
    GAME_STATE.missionLog.reduce((acc, log) => {
      (log.agents || []).forEach(id => {
        if (!acc[id]) acc[id] = { id, count: 0 };
        acc[id].count += 1;
      });
      return acc;
    }, {})
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  view.innerHTML = `
    <div class="hud-panel report-summary">
      <h2>Replay Command Summary</h2>
      <p>Avg Efficiency: <strong>${avgEfficiency}%</strong></p>
      <p>Best Grade Score: <strong>${topGrade}</strong></p>
      <p>Total Runs: <strong>${GAME_STATE.missionLog.length}</strong></p>
      <p>Most Deployed: <strong>${topAgents.length ? topAgents.map(a => `${AGENT_ROSTER[a.id]?.name || a.id} (${a.count})`).join(', ') : 'No deployments yet'}</strong></p>
    </div>
    <div class="replay-grid">
      ${GAME_STATE.missionLog.map(log => `
        <article class="hud-panel replay-card">
          <h3>${log.title}</h3>
          <p><strong>Grade:</strong> ${log.grade} • <strong>Efficiency:</strong> ${log.efficiency || 0}%</p>
          <p><strong>Rewards:</strong> ${log.rewards?.xp || 0} XP, ${log.rewards?.credits || 0} Credits, ${log.rewards?.crystals || 0} Crystals</p>
          <p><strong>Alerts:</strong> ${(log.alertsEncountered || []).join(', ')}</p>
          <p><strong>Recommendation:</strong> ${log.recommendation || 'No recommendation yet.'}</p>
          <p class="replay-time">${new Date(log.at).toLocaleString()}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderUpgrades() {
  const summary = document.getElementById('upgrades-summary');
  const grid = document.getElementById('upgrades-grid');
  if (!summary || !grid) return;

  summary.innerHTML = `
    <h2>Command Center Progression</h2>
    <p>Credits: <strong>${GAME_STATE.credits}</strong> • Crystals: <strong>${GAME_STATE.crystals}</strong></p>
    <p>Unlocked: <strong>${(GAME_STATE.unlockedUpgrades || []).length}</strong> / ${UPGRADE_CATALOG.length}</p>
  `;

  grid.innerHTML = '';
  UPGRADE_CATALOG.forEach(upg => {
    const unlocked = (GAME_STATE.unlockedUpgrades || []).includes(upg.id);
    const affordable = GAME_STATE.credits >= upg.costCredits && GAME_STATE.crystals >= upg.costCrystals;

    const card = document.createElement('article');
    card.className = `hud-panel upgrade-card ${unlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <h3>${upg.name}</h3>
      <p><strong>Room:</strong> ${upg.room}</p>
      <p><strong>Effect:</strong> ${upg.effect}</p>
      <p><strong>Cost:</strong> ${upg.costCredits} Credits • ${upg.costCrystals} Crystals</p>
      <button class="upgrade-buy" ${unlocked || !affordable ? 'disabled' : ''}>
        ${unlocked ? 'Unlocked' : affordable ? 'Unlock Upgrade' : 'Insufficient Resources'}
      </button>
    `;

    card.querySelector('.upgrade-buy')?.addEventListener('click', () => {
      if (unlocked || !affordable) return;
      GAME_STATE.credits -= upg.costCredits;
      GAME_STATE.crystals -= upg.costCrystals;
      GAME_STATE.unlockedUpgrades.push(upg.id);
      GAME_STATE.activeAlerts.unshift({ type: 'success', message: `Upgrade unlocked: ${upg.name}`, at: Date.now() });
      saveRuntimeState();
      renderResourceHUD();
      renderLiveAlerts();
      renderHqSystems();
      renderUpgrades();
    });

    grid.appendChild(card);
  });
}

function handleNavigation(event) {
  const target = event.currentTarget.dataset.targetScreen;
  if (!target) return;

  switchScreen(target);
  updateNavState(target);

  if (target === 'quest-board-view') renderQuestBoard();
  if (target === 'agent-roster-view') renderAgentRoster();
  if (target === 'reports-view') renderReports();
  if (target === 'upgrades-view') renderUpgrades();
}

function bindEvents() {
  document.getElementById('login-start-button')?.addEventListener('click', () => {
    switchScreen('mission-control-home');
    updateNavState('mission-control-home');
    renderAgentStations();
    renderAgentRoster();
    renderQuestBoard();
    renderResourceHUD();
    renderLiveAlerts();
    renderActiveMissions();
    renderHqSystems();
    renderThreatConsole();
    updateAdvisorRecommendation();
    spawnBaseAmbience();
  });

  document.querySelectorAll('#main-navigation .nav-button').forEach(btn => {
    btn.addEventListener('click', handleNavigation);
  });

  document.querySelectorAll('.back-button').forEach(btn => {
    btn.addEventListener('click', handleNavigation);
  });

  document.querySelector('#mission-detail-modal .close-modal-button')?.addEventListener('click', hideMissionDetailModal);
  document.getElementById('deploy-mission-button')?.addEventListener('click', handleDeployMission);
  document.getElementById('idea-intake-form')?.addEventListener('submit', handleIdeaIntake);

  document.getElementById('room-overlay-close')?.addEventListener('click', closeRoomOverlay);
  document.getElementById('room-overlay')?.addEventListener('click', (event) => {
    if (event.target.id === 'room-overlay') closeRoomOverlay();
  });

  document.getElementById('advisor-refresh')?.addEventListener('click', () => {
    updateAdvisorRecommendation();
    GAME_STATE.activeAlerts.unshift({ type: 'info', message: 'Kirby advisor refreshed squad logic.', at: Date.now() });
    renderResourceHUD();
    renderLiveAlerts();
  });

  document.getElementById('quick-deploy-button')?.addEventListener('click', () => {
    switchScreen('quest-board-view');
    updateNavState('quest-board-view');
    renderQuestBoard();
  });

  document.querySelectorAll('.preset-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const presets = {
        fast: ['sonic', 'tails', 'mario'],
        safe: ['samus', 'link', 'zelda'],
        creative: ['selphie', 'yuna', 'squall'],
        profit: ['tom_nook', 'peach', 'rinoa']
      };
      GAME_STATE.selectedAgents = presets[preset] || [];
      GAME_STATE.activeAlerts.unshift({
        type: 'info',
        message: `Preset armed: ${btn.textContent}`,
        at: Date.now()
      });
      renderResourceHUD();
      renderLiveAlerts();
      renderHqSystems();
      renderThreatConsole();
      updateAdvisorRecommendation();
      const msg = document.getElementById('global-status-message');
      if (msg) msg.textContent = `Kirby suggests ${btn.textContent}. Team ready.`;
    });
  });

  document.getElementById('toggle-ambience')?.addEventListener('change', (event) => {
    IMMERSION_STATE.ambienceFx = event.target.checked;
    document.body.classList.toggle('ambience-off', !IMMERSION_STATE.ambienceFx);
    spawnBaseAmbience();
    renderAlertRoutingLayer();
    const activeAgentId = GAME_STATE.currentRoomAgent;
    if (activeAgentId && AGENT_ROSTER[activeAgentId]) renderRoomAmbience(AGENT_ROSTER[activeAgentId]);
    saveRuntimeState();
  });

  document.getElementById('toggle-audio')?.addEventListener('change', (event) => {
    IMMERSION_STATE.uiAudio = event.target.checked;
    if (IMMERSION_STATE.uiAudio) playUiBlip('soft');
    saveRuntimeState();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.tagName === 'BUTTON') playUiBlip('soft');
  });

  document.getElementById('threat-console-list')?.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const resolveButton = event.target.closest('.threat-resolve-button[data-agent-id][data-quest-id]');
    if (resolveButton) {
      event.preventDefault();
      event.stopPropagation();
      resolveThreatNow(resolveButton.dataset.agentId, resolveButton.dataset.questId);
      return;
    }
    const row = event.target.closest('.threat-row[data-agent-id][data-quest-id]');
    if (!row) return;
    focusThreatTarget(row.dataset.agentId, row.dataset.questId);
  });

  window.addEventListener('resize', () => renderAlertRoutingLayer());
}

async function init() {
  const loaded = await loadQuests();
  quests = hydrateQuests(loaded);

  loadRuntimeState();

  if (!Array.isArray(GAME_STATE.unlockedUpgrades)) GAME_STATE.unlockedUpgrades = [];
  if (!Array.isArray(GAME_STATE.missionLog)) GAME_STATE.missionLog = [];

  const ambienceToggle = document.getElementById('toggle-ambience');
  const audioToggle = document.getElementById('toggle-audio');
  if (ambienceToggle) ambienceToggle.checked = IMMERSION_STATE.ambienceFx;
  if (audioToggle) audioToggle.checked = IMMERSION_STATE.uiAudio;
  document.body.classList.toggle('ambience-off', !IMMERSION_STATE.ambienceFx);

  const badge = document.getElementById('build-version-badge');
  if (badge) {
    const version = window.__MC_VERSION__ || 'dev';
    badge.textContent = `Build ${version}`;
  }

  switchScreen(GAME_STATE.currentScreen);
  bindEvents();
  GAME_STATE.activeAlerts.push({ type: 'info', message: 'Mission Control online. Quest board synchronized.', at: Date.now() });
  renderResourceHUD();
  renderLiveAlerts();
  renderHqSystems();
  renderThreatConsole();
  updateAdvisorRecommendation();
  renderIdeaFlowPanels();
  spawnBaseAmbience();
  startDayNightCycle();
  startEventSimulation();
  startThreatConsoleTicker();
}

init();
