# Dev Workflow Multi-Agent System

A multi-agent development workflow based on Google ADK SDLC agents + custom tooling.

## Architecture

```
User Request
     │
     ▼
┌─────────────────┐
│  Orchestrator   │ ← Coordinates all agents
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    ▼         ▼         ▼          ▼
┌────────┐┌────────┐┌────────┐┌──────────┐
│ Story  ││Design  ││ Task   ││ Code     │
│Refiner ││er      ││Planner ││ Agent    │
└────────┘└────────┘└────────┘└──────────┘
    │         │         │         │
    └─────────┴────┬────┴─────────┘
                   ▼
            ┌──────────┐
            │  Output  │
            │ (files,  │
            │ code,    │
            │ docs)    │
            └──────────┘
```

## Agents

### 1. Story Refiner (sdlc-user-story-refiner)
- **Role**: Takes raw user requirements and converts them into clear user stories
- **Input**: "I want an app that does X"
- **Output**: Structured user stories with acceptance criteria

### 2. Technical Designer (sdlc-technical-designer)
- **Role**: Creates technical architecture and design documents
- **Input**: User stories + constraints
- **Output**: Tech stack, API design, database schema, component structure

### 3. Task Planner (sdlc-task-planner)
- **Role**: Breaks down work into executable tasks with dependencies
- **Input**: Design documents
- **Output**: Ordered task list, file structure, implementation steps

### 4. Code Agent (coding-agent skill)
- **Role**: Actual implementation
- **Input**: Tasks + design specs
- **Output**: Working code, tests, configuration

### 5. Bug Assistant (software-bug-assistant)
- **Role**: Debugging and issue resolution (on-demand)
- **Input**: Error logs, bug reports
- **Output**: Root cause analysis, fixes

## Usage

### Quick Start
```bash
# Start the orchestrator
python workflow/run.py --prompt "Build a React Native mood tracking app"
```

### Step by Step
```bash
# 1. Refine requirements
python agents/story-refiner/run.py --input "requirements.md"

# 2. Generate design
python agents/technical-designer/run.py --input "stories.md"

# 3. Plan tasks
python agents/task-planner/run.py --input "design.md"

# 4. Execute
python agents/code-agent/run.py --tasks "tasks.md"
```

## Project Structure

```
dev-workflow/
├── README.md
├── workflow/
│   ├── __init__.py
│   ├── orchestrator.py      # Main coordination
│   └── config.py            # Agent configs
├── agents/
│   ├── story-refiner/       # User story generation
│   ├── technical-designer/  # Architecture & design
│   ├── task-planner/        # Task decomposition
│   └── bug-assistant/       # Debugging
├── templates/
│   ├── user-story.md
│   ├── tech-spec.md
│   └── task-list.md
└── logs/
    └── .gitkeep
```

## Configuration

Edit `workflow/config.py` to customize:
- Default model (gemini-2.0-pro, etc.)
- Agent personalities
- Output formats
- Timeout values

## Environment Variables

```bash
export GOOGLE_API_KEY=your_key
export OPENAI_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key
```

## Example Workflow

1. **User**: "Build a chatbot that can search the web"
2. **Story Refiner** → 5 user stories with acceptance criteria
3. **Technical Designer** → Tech stack (Python/ADK), API design, web search integration
4. **Task Planner** → 12 tasks: setup, web search tool, chat UI, tests, deployment
5. **Code Agent** → Implements each task

---

*Powered by Google ADK + OpenClaw Skills*