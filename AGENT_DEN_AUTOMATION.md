# Agent Den Automation Layer

## Purpose
This document describes the first implementation layer for making Joshy's Agent Den operational.

The goal is to convert the policy and workflow docs into a system that can evaluate whether a discussion should:
- stay in the main chat
- reuse an existing topic
- create a new topic
- close an older topic first, then create a new one

## Files
- `agent_den_policy.json` - high-level machine-readable policy
- `agent_den_runtime.json` - execution-oriented thresholds, weights, signals, and limits
- `mission-control/scripts/agent-den-engine.js` - starter evaluation engine

## Engine Responsibilities
The starter engine currently evaluates:
- topic creation signals
- keep-in-main-chat signals
- weighted decision scoring
- topic limit enforcement
- existing-topic reuse
- close-then-create behavior when topic capacity is full

## Decision Inputs
A request to the engine should include fields like:
- `title`
- `topicType` (`work` or `social`)
- `purpose`
- `signals` (array of normalized decision signals)
- `messageCount`

Current topics should include fields like:
- `id`
- `title`
- `type`
- `purpose`
- `state`

## Supported Actions
The engine can currently return:
- `stay_in_main_chat`
- `reuse_topic`
- `create_topic`
- `close_then_create_topic`

## Example Request
```json
{
  "title": "Mission Control UI blocker",
  "topicType": "work",
  "purpose": "blocker_resolution",
  "signals": [
    "ongoing_discussion",
    "multi_agent_needed",
    "blocker_present",
    "cluttering_main_chat"
  ],
  "messageCount": 6
}
```

## Example Output
```json
{
  "action": "create_topic",
  "reason": "Signals indicate this discussion would benefit from a dedicated topic.",
  "score": 8,
  "openTopics": 2,
  "suggestedTopic": {
    "type": "work",
    "title": "Mission Control UI blocker",
    "purpose": "blocker_resolution",
    "ownerRequired": true
  }
}
```

## What This Enables Next
This starter layer is enough to support the next phase:
1. connect live Telegram/OpenClaw group events to decision requests
2. track active topics as runtime state
3. automatically suggest or create topics
4. automatically recommend closures when topic capacity is full
5. record topic history and collaboration patterns over time

## Recommended Next Build
The next implementation step should be a stateful coordinator, for example:
- `agent-den-coordinator.js`

That coordinator would:
- read live topic state
- call the engine
- maintain topic metadata
- prepare topic creation/closure actions for Telegram or OpenClaw workflows

Right now, the system has a real decision core, but not yet a live event loop.
