# Agent Den Integration Architecture

## What is implemented now
The Agent Den system now has three connected layers beyond the original policy documents.

### 1. Stateful coordinator
File:
- `mission-control/scripts/agent-den-coordinator.js`

Responsibilities:
- keeps runtime topic state
- tracks open, dormant, and closed topics
- records coordinator events
- uses the decision engine to choose topic actions
- creates topics from live discussion requests
- closes stale topics when capacity must be reclaimed

### 2. Event wiring scaffold
Files:
- `mission-control/scripts/agent-den-event-adapter.js`
- `agent_den_events.example.json`

Responsibilities:
- loads runtime and team memory JSON
- accepts normalized event payloads from Telegram/OpenClaw
- turns live message batches into coordinator requests
- returns structured decisions that can later drive real topic actions

This is the bridge between chat events and Agent Den behavior.

### 3. Team memory layer
File:
- `agent_den_memory.json`

Responsibilities:
- stores working-style hints for agents
- stores collaboration edges between agents
- stores relationship notes and project learnings
- gives the coordinator a base layer for learning which agents work well together

The current coordinator already reads this memory and uses collaboration edges to attach memory affinity context to suggested topics.

## Current flow
1. Telegram/OpenClaw messages are normalized into event payloads.
2. The event adapter feeds those payloads into the coordinator.
3. The coordinator asks the decision engine what should happen.
4. The coordinator updates topic state and emits structured outcomes.
5. A future action layer can use those outcomes to create or close actual Telegram topics.

## Current outcome types
- stay in main chat
- reuse topic
- create topic
- close stale topic, then create topic

## What is still missing
The system now has policy, workflow rules, runtime thresholds, memory, coordinator state, and event wiring.

The remaining missing piece is the final action layer:
- actually call Telegram/OpenClaw APIs to create topics
- actually close/archive existing topics
- persist live topic IDs from Telegram
- continuously update memory based on collaboration outcomes

## Recommended next build
Build a live action executor, for example:
- `agent-den-action-executor.js`

That executor should:
- receive coordinator outcomes
- map them to Telegram topic actions
- persist topic IDs and lifecycle updates
- write collaboration results back into `agent_den_memory.json`

## Summary
Agent Den has now moved from concept to architecture.

It already knows:
- what kind of culture you want
- when a conversation needs its own room
- how many rooms can stay open
- who should be involved
- how topics progress through their lifecycle
- how collaboration history should begin informing future coordination

What it does not yet do is press the final button on Telegram itself.
