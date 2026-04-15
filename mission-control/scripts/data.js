// mission-control/scripts/data.js

// Agent Roster and Themes
const AGENT_ROSTER = {
    kirby: {
        id: 'kirby', name: 'Kirby', role: 'Orchestrator', level: 5, status: 'Idle',
        specialties: ['Coordination', 'Deployment'], avatar: 'mission-control/assets/agents/kirby.svg',
        roomTheme: 'HQ Desk', synergy: [], energy: 100, affinity: 80
    },
    zelda: {
        id: 'zelda', name: 'Zelda', role: 'Strategist', level: 4, status: 'Idle',
        specialties: ['Planning', 'Roadmaps'], avatar: 'mission-control/assets/agents/zelda.svg',
        roomTheme: 'Strategy Chamber', synergy: [], energy: 95, affinity: 75
    },
    tails: {
        id: 'tails', name: 'Tails', role: 'Engineer', level: 4, status: 'Idle',
        specialties: ['Coding', 'Automation'], avatar: 'mission-control/assets/agents/tails.svg',
        roomTheme: 'Code Lab', synergy: [], energy: 90, affinity: 70
    },
    link: {
        id: 'link', name: 'Link', role: 'Researcher', level: 3, status: 'Idle',
        specialties: ['Intelligence', 'Discovery'], avatar: 'mission-control/assets/agents/link.svg',
        roomTheme: 'Research Den', synergy: [], energy: 88, affinity: 65
    },
    samus: {
        id: 'samus', name: 'Samus', role: 'Security Specialist', level: 5, status: 'Idle',
        specialties: ['Threat Detection', 'QA'], avatar: 'mission-control/assets/agents/samus.svg',
        roomTheme: 'Security Bay', synergy: [], energy: 98, affinity: 78
    },
    professor_oak: {
        id: 'professor_oak', name: 'Professor Oak', role: 'Archivist', level: 3, status: 'Idle',
        specialties: ['Documentation', 'Knowledge Base'], avatar: 'mission-control/assets/agents/professor_oak.svg',
        roomTheme: 'Docs Library', synergy: [], energy: 85, affinity: 60
    },
    tom_nook: {
        id: 'tom_nook', name: 'Tom Nook', role: 'Economist', level: 4, status: 'Idle',
        specialties: ['Pricing', 'Offers'], avatar: 'mission-control/assets/agents/tom_nook.svg',
        roomTheme: 'Commerce Vault', synergy: [], energy: 92, affinity: 72
    },
    peach: {
        id: 'peach', name: 'Peach', role: 'Communicator', level: 3, status: 'Idle',
        specialties: ['Customer Messaging', 'Brand Voice'], avatar: 'mission-control/assets/agents/peach.svg',
        roomTheme: 'Comm Station', synergy: [], energy: 87, affinity: 68
    },
    mario: {
        id: 'mario', name: 'Mario', role: 'Operations', level: 4, status: 'Idle',
        specialties: ['Workflow Automation', 'Recurring Systems'], avatar: 'mission-control/assets/agents/mario.svg',
        roomTheme: 'Ops Garage', synergy: [], energy: 93, affinity: 73
    },
    luigi: {
        id: 'luigi', name: 'Luigi', role: 'Recovery Specialist', level: 3, status: 'Idle',
        specialties: ['Debugging', 'Problem Solving'], avatar: 'mission-control/assets/agents/luigi.svg',
        roomTheme: 'Recovery Garage', synergy: [], energy: 89, affinity: 69
    },
    sonic: {
        id: 'sonic', name: 'Sonic', role: 'Launch Specialist', level: 4, status: 'Idle',
        specialties: ['Speed', 'Campaign Boosts'], avatar: 'mission-control/assets/agents/sonic.svg',
        roomTheme: 'Launch Terminal', synergy: [], energy: 91, affinity: 71
    },
    selphie: {
        id: 'selphie', name: 'Selphie', role: 'Creative Director', level: 4, status: 'Idle',
        specialties: ['Concept Storms', 'Prompt Lab'], avatar: 'mission-control/assets/agents/selphie.svg',
        roomTheme: 'Creative Room', synergy: [], energy: 94, affinity: 74
    },
    squall: {
        id: 'squall', name: 'Squall', role: 'Music Producer', level: 5, status: 'Idle',
        specialties: ['Production', 'Mixing'], avatar: 'mission-control/assets/agents/squall.svg',
        roomTheme: 'Music Studio', synergy: [], energy: 96, affinity: 76
    },
    rinoa: {
        id: 'rinoa', name: 'Rinoa', role: 'Social Manager', level: 4, status: 'Idle',
        specialties: ['Content Creation', 'Engagement'], avatar: 'mission-control/assets/agents/rinoa.svg',
        roomTheme: 'Social Hub', synergy: [], energy: 90, affinity: 70
    },
    edea: {
        id: 'edea', name: 'Edea', role: 'Mystic', level: 5, status: 'Idle',
        specialties: ['Astrology', 'Symbolic Systems'], avatar: 'mission-control/assets/agents/edea.svg',
        roomTheme: 'Mystic Sanctum', synergy: [], energy: 97, affinity: 77
    },
    yuna: {
        id: 'yuna', name: 'Yuna', role: 'Vocalist', level: 3, status: 'Idle',
        specialties: ['Lyric Writing', 'Emotional Delivery'], avatar: 'mission-control/assets/agents/yuna.svg',
        roomTheme: 'Vocal Sanctuary', synergy: [], energy: 86, affinity: 67
    },
    saria: {
        id: 'saria', name: 'Saria', role: 'Healer', level: 4, status: 'Idle',
        specialties: ['Restorative Support', 'Herbal Wisdom'], avatar: 'mission-control/assets/agents/saria.svg',
        roomTheme: 'Healing Grove', synergy: [], energy: 92, affinity: 72
    }
};

// Synergy Definitions (MVP - basic examples)
const SYNERGIES = [
    { name: 'Strategic Build Bonus', agents: ['zelda', 'tails'], bonus: 'Stats +15%', tags: ['Build', 'Strategy'] },
    { name: 'Creative Masterpiece Bonus', agents: ['selphie', 'yuna', 'squall'], bonus: 'Output Quality +20%', tags: ['Creative', 'Music'] },
    { name: 'Launch Magnet Bonus', agents: ['rinoa', 'sonic', 'peach'], bonus: 'Engagement +25%', tags: ['Marketing', 'Launch'] },
    { name: 'Intel Shield Bonus', agents: ['link', 'samus'], bonus: 'Risk Reduction +10%', tags: ['Research', 'Security'] },
    { name: 'Soul Thread Bonus', agents: ['edea', 'saria', 'yuna'], bonus: 'Intuition +15%', tags: ['Mystic', 'Support'] },
    { name: 'Conversion Charm Bonus', agents: ['tom_nook', 'peach', 'rinoa'], bonus: 'Conversion Rate +18%', tags: ['Commerce', 'Messaging'] }
];

// Quest Categories (for filtering and display)
const QUEST_CATEGORIES = [
    { id: 'main_quests', name: 'Main Quests', icon: '⭐' },
    { id: 'side_quests', name: 'Side Quests', icon: '✨' },
    { id: 'urgent_alerts', name: 'Urgent Alerts', icon: '🚨' },
    { id: 'daily_tasks', name: 'Daily Tasks', icon: '🗓️' },
    { id: 'creative_missions', name: 'Creative Missions', icon: '🎨' },
    { id: 'automation_missions', name: 'Automation Missions', icon: '⚙️' },
    { id: 'boss_missions', name: 'Boss Missions', icon: '👹' }
];

// Initial Game State
const GAME_STATE = {
    xp: 0,
    credits: 0,
    crystals: 0,
    activeAlerts: [],
    currentScreen: 'login-screen', // or 'mission-control-home'
    selectedQuest: null,
    selectedAgents: [],
    missionLog: []
};

// Function to load tasks from local JSON (or GitHub API in future)
async function loadQuests() {
    try {
        const response = await fetch('data/tasks.json');
        const data = await response.json();
        // Map old task structure to new quest structure (MVP - basic mapping)
        return data.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status, // backlog, in_progress, review, done, permanent
            type: 'side_quests', // Default, will be derived from tags or specific field
            difficulty: 'easy', // Default
            urgency: 'low', // Default
            recommendedAgents: [], // Will populate based on description/tags
            risk: 'low', // Default
            estimatedDuration: '1h', // Default
            reward: { xp: 50, credits: 10 }, // Default
            subtasks: task.subtasks || [],
            comments: task.comments || []
        }));
    } catch (error) {
        console.error('Failed to load quests:', error);
        return [];
    }
}

// Function to save tasks (for local development)
async function saveQuests(quests) {
    // This would typically involve a git commit via the backend (mc-update.py)
    // For now, it's a client-side placeholder.
    console.log('Saving quests (simulated):', quests);
}

// Function to get agent details by ID
function getAgent(agentId) {
    return AGENT_ROSTER[agentId];
}

// Function to calculate synergy for a given team
function calculateSynergy(agentIds) {
    const activeSynergies = [];
    for (const synergy of SYNERGIES) {
        // Check if all agents required for this synergy are in the team
        const allAgentsPresent = synergy.agents.every(agent => agentIds.includes(agent));
        if (allAgentsPresent) {
            activeSynergies.push(synergy);
        }
    }
    return activeSynergies;
}

// Export data and functions for main.js
export { AGENT_ROSTER, QUEST_CATEGORIES, GAME_STATE, loadQuests, saveQuests, getAgent, calculateSynergy };