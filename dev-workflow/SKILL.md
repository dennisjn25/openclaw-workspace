# Dev Workflow Orchestrator Skill

## Overview
This skill enables me to run a multi-agent development workflow directly in an OpenClaw session. I act as the orchestrator, guiding projects through story refinement → technical design → task planning → implementation.

## When to Use
Use this skill when:
- User wants to build a new project (web app, mobile app, API, etc.)
- User has a vague idea and needs it broken down
- User wants a structured development process
- User needs user stories, technical design, and task breakdown

## Workflow Phases

### Phase 1: Requirements Gathering
I ask: "What do you want to build?"
You describe the project in natural language.

### Phase 2: Story Refinement
I convert your requirement into structured user stories with:
- Title
- User role (As a...)
- Feature (I want...)
- Benefit (So that...)
- Acceptance criteria

### Phase 3: Technical Design
I create a tech design document with:
- Architecture pattern
- Tech stack recommendation
- Component structure
- Data model
- API design (if applicable)

### Phase 4: Task Planning
I break the design into actionable tasks with:
- Priority (high/medium/low)
- Dependencies
- Implementation order

### Phase 5: Implementation
I execute tasks using the coding-agent skill or by building directly.

## Usage

### Start a new project:
```
Run the dev workflow for [project name]
```

### Continue an existing project:
```
Continue the workflow
```

### Get status:
```
Show workflow status
```

## Configuration
Edit `dev-workflow/config.py` to customize:
- Default model
- Agent prompts
- Output format

## Output
The workflow generates:
- User stories (markdown)
- Technical design (markdown)
- Task list (markdown)
- Working code

## Notes
- I use google-adk-agents for reference patterns when needed
- I use coding-agent skill for implementation when appropriate
- I can spawn subagents for parallel tasks
- Workflow state persists in memory during the session