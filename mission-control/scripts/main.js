// mission-control/scripts/main.js
import { AGENT_ROSTER, QUEST_CATEGORIES, GAME_STATE, loadQuests, saveQuests, calculateSynergy } from './data.js';

let quests = [];
let questFilter = null;

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

function renderResourceHUD() {
  const xp = document.getElementById('xp-display');
  const credits = document.getElementById('credits-display');
  const crystals = document.getElementById('crystals-display');
  const alerts = document.getElementById('alerts-summary');
  if (xp) xp.textContent = GAME_STATE.xp;
  if (credits) credits.textContent = GAME_STATE.credits;
  if (crystals) crystals.textContent = GAME_STATE.crystals;

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

function renderAgentStations() {
  const grid = document.getElementById('agent-stations-grid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(AGENT_ROSTER).forEach(agent => {
    const card = document.createElement('button');
    card.className = 'agent-station-icon';
    card.type = 'button';
    card.style.backgroundImage = `url(${agent.avatar})`;
    card.title = `${agent.name} • ${agent.roomTheme}`;
    card.dataset.agentId = agent.id;
    card.addEventListener('click', () => {
      const msg = document.getElementById('global-status-message');
      if (msg) msg.textContent = `${agent.name} online in ${agent.roomTheme}`;
      switchScreen('agent-roster-view');
      renderAgentRoster(agent.id);
    });
    grid.appendChild(card);
  });
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

  const agents = Object.values(AGENT_ROSTER);
  agents.sort((a, b) => (a.id === focusAgentId ? -1 : b.id === focusAgentId ? 1 : a.name.localeCompare(b.name)));

  agents.forEach(agent => {
    const selected = GAME_STATE.selectedAgents.includes(agent.id);
    const card = document.createElement('article');
    card.className = `agent-card hud-panel ${selected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="agent-head">
        <img src="${agent.avatar}" alt="${agent.name}">
        <div>
          <h3>${agent.name}</h3>
          <p>${agent.role} • Lv ${agent.level}</p>
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
    ? active.map(q => `<li>${q.title}</li>`).join('')
    : '<li>No missions in progress.</li>';
}

function bestSquadForQuest(quest) {
  const picks = quest.recommendedAgents.slice();
  if (!picks.includes('kirby')) picks.unshift('kirby');
  return [...new Set(picks)].slice(0, 3);
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

  const pickWrap = document.createElement('div');
  pickWrap.id = 'deploy-agent-selection';
  pickWrap.innerHTML = '<h3>Deploy Team</h3>';

  Object.values(AGENT_ROSTER).forEach(agent => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `agent-select-button ${GAME_STATE.selectedAgents.includes(agent.id) ? 'selected' : ''}`;
    btn.innerHTML = `<img src="${agent.avatar}" alt="${agent.name}"><span>${agent.name}</span>`;
    btn.addEventListener('click', () => {
      const has = GAME_STATE.selectedAgents.includes(agent.id);
      GAME_STATE.selectedAgents = has
        ? GAME_STATE.selectedAgents.filter(id => id !== agent.id)
        : [...GAME_STATE.selectedAgents, agent.id];
      btn.classList.toggle('selected', !has);
      updateSynergyDisplay();
    });
    pickWrap.appendChild(btn);
  });

  const synergy = document.createElement('div');
  synergy.id = 'synergy-display';

  const deployBtn = document.getElementById('deploy-mission-button');
  content.insertBefore(pickWrap, deployBtn);
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

function handleDeployMission() {
  if (!GAME_STATE.selectedQuest) return;

  const q = GAME_STATE.selectedQuest;
  q.status = 'in_progress';
  GAME_STATE.xp += q.reward.xp;
  GAME_STATE.credits += q.reward.credits;
  GAME_STATE.crystals += q.reward.crystals || 0;

  const activeSynergy = calculateSynergy(GAME_STATE.selectedAgents);
  const grade = activeSynergy.length > 0 ? 'S' : 'A';

  GAME_STATE.missionLog.unshift({
    questId: q.id,
    title: q.title,
    agents: [...GAME_STATE.selectedAgents],
    synergy: activeSynergy.map(s => s.name),
    grade,
    at: new Date().toISOString()
  });

  GAME_STATE.activeAlerts.unshift({
    type: 'success',
    message: `${q.title} deployed • Grade forecast ${grade}`,
    at: Date.now()
  });

  saveQuests(quests);
  renderResourceHUD();
  renderLiveAlerts();
  renderActiveMissions();
  hideMissionDetailModal();
  switchScreen('mission-control-home');
  updateNavState('mission-control-home');
}

function renderReports() {
  const view = document.querySelector('#reports-view main');
  if (!view) return;

  if (GAME_STATE.missionLog.length === 0) {
    view.innerHTML = '<p>No mission replays yet. Deploy a quest to generate your first report.</p>';
    return;
  }

  view.innerHTML = `
    <div class="hud-panel">
      <h2>Replay Log</h2>
      <ul class="replay-list">
        ${GAME_STATE.missionLog.map(log => `<li><strong>${log.title}</strong> • Grade ${log.grade} • ${new Date(log.at).toLocaleString()}</li>`).join('')}
      </ul>
    </div>
  `;
}

function handleNavigation(event) {
  const target = event.currentTarget.dataset.targetScreen;
  if (!target) return;

  switchScreen(target);
  updateNavState(target);

  if (target === 'quest-board-view') renderQuestBoard();
  if (target === 'agent-roster-view') renderAgentRoster();
  if (target === 'reports-view') renderReports();
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
  });

  document.querySelectorAll('#main-navigation .nav-button').forEach(btn => {
    btn.addEventListener('click', handleNavigation);
  });

  document.querySelectorAll('.back-button').forEach(btn => {
    btn.addEventListener('click', handleNavigation);
  });

  document.querySelector('#mission-detail-modal .close-modal-button')?.addEventListener('click', hideMissionDetailModal);
  document.getElementById('deploy-mission-button')?.addEventListener('click', handleDeployMission);

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
      const msg = document.getElementById('global-status-message');
      if (msg) msg.textContent = `Kirby suggests ${btn.textContent}. Team ready.`;
    });
  });
}

async function init() {
  const loaded = await loadQuests();
  quests = hydrateQuests(loaded);

  switchScreen(GAME_STATE.currentScreen);
  bindEvents();
  GAME_STATE.activeAlerts.push({ type: 'info', message: 'Mission Control online. Quest board synchronized.', at: Date.now() });
  renderResourceHUD();
  renderLiveAlerts();
}

init();