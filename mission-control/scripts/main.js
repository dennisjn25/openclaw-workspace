// mission-control/scripts/main.js
import { AGENT_ROSTER, QUEST_CATEGORIES, GAME_STATE, loadQuests, saveQuests, calculateSynergy } from './data.js';

let quests = [];
let questFilter = null;
const hudDisplay = { xp: 0, credits: 0, crystals: 0 };

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
const STATE_STORAGE_KEY = 'mission-control-v1-state';
const IMMERSION_STATE = {
  ambienceFx: true,
  uiAudio: true,
  audioContext: null,
  dayNightTimer: null
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
      }
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
  } catch (error) {
    console.warn('State load skipped:', error);
  }
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
    agent.missionState = state;
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
    const card = document.createElement('button');
    card.className = 'agent-station-icon';
    card.type = 'button';
    card.style.backgroundImage = `url(${agent.avatar})`;
    card.title = `${agent.name} • ${agent.roomTheme} • ${agent.status}`;
    card.dataset.agentId = agent.id;
    card.classList.add(`station-state-${agent.missionState || 'idle'}`);
    if (hotAgents.has(agent.id)) card.classList.add('is-hot');
    card.addEventListener('click', () => openRoomOverlay(agent.id));
    grid.appendChild(card);
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
  if (status) status.textContent = `Status: ${agent.status} • Energy ${agent.energy} • Bond ${agent.affinity}`;
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
    const done = (quest.subtasks || []).filter(s => s.done).length;
    const total = (quest.subtasks || []).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    const card = document.createElement('article');
    card.className = `quest-card hud-panel status-${quest.status}`;
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
        <p class="reward-text">Reward: ${quest.reward.xp} XP • ${quest.reward.credits} Credits • ${quest.reward.crystals || 0} Crystals</p>
        <div class="recommended-agents">Recommended: ${quest.recommendedAgents.map(id => `<img src="${AGENT_ROSTER[id]?.avatar}" class="agent-thumbnail" title="${AGENT_ROSTER[id]?.name}">`).join('')}</div>
      </div>
      <button class="view-mission-details nav-button" data-quest-id="${quest.id}">Mission Detail</button>
    `;

    card.querySelector('.view-mission-details')?.addEventListener('click', () => showMissionDetailModal(quest.id));
    list.appendChild(card);
  });
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
    card.innerHTML = `
      <div class="agent-head">
        <img src="${agent.avatar}" alt="${agent.name}">
        <div>
          <h3>${agent.name}</h3>
          <p>${agent.role} • Lv ${agent.level} • <span class="agent-state-pill">${agent.status}</span></p>
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
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;
  GAME_STATE.selectedQuest = quest;
  GAME_STATE.selectedAgents = bestSquadForQuest(quest);

  const title = document.getElementById('mission-detail-title');
  const desc = document.getElementById('mission-detail-description');
  if (title) title.textContent = quest.title;
  if (desc) desc.innerHTML = `${quest.description || 'No mission briefing.'}<br><br><strong>Difficulty:</strong> ${quest.difficulty.toUpperCase()}<br><strong>Duration:</strong> ${quest.estimatedDuration}`;

  const modal = document.getElementById('mission-detail-modal');
  const content = modal?.querySelector('.modal-content');
  if (!modal || !content) return;

  content.querySelector('#deploy-agent-selection')?.remove();
  content.querySelector('#synergy-display')?.remove();
  content.querySelector('.squad-slots')?.remove();

  const synergy = document.createElement('div');
  synergy.id = 'synergy-display';

  const deployBtn = document.getElementById('deploy-mission-button');
  renderSquadBuilder(content);
  content.insertBefore(synergy, deployBtn);

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
  q.status = 'in_progress';
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
      updateAdvisorRecommendation();
      const msg = document.getElementById('global-status-message');
      if (msg) msg.textContent = `Kirby suggests ${btn.textContent}. Team ready.`;
    });
  });

  document.getElementById('toggle-ambience')?.addEventListener('change', (event) => {
    IMMERSION_STATE.ambienceFx = event.target.checked;
    document.body.classList.toggle('ambience-off', !IMMERSION_STATE.ambienceFx);
    spawnBaseAmbience();
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

  switchScreen(GAME_STATE.currentScreen);
  bindEvents();
  GAME_STATE.activeAlerts.push({ type: 'info', message: 'Mission Control online. Quest board synchronized.', at: Date.now() });
  renderResourceHUD();
  renderLiveAlerts();
  renderHqSystems();
  updateAdvisorRecommendation();
  spawnBaseAmbience();
  startDayNightCycle();
  startEventSimulation();
}

init();
