# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

---

## Available Agents & Skills

Before starting any task, scan this list to determine the best approach.

### OpenClaw Skills (Available via Skill System)
- **coding-agent** - Code development, debugging, project scaffolding
- **gemini** - Image generation
- **sag** - Voice/TTS (ElevenLabs)
- **node-connect** - Node.js API connections
- **weather** - Weather information
- **healthcheck** - System health monitoring

### Multi-Agent Dev Workflow
- **dev-workflow/** - Multi-agent development workflow system
  - Run with: `python dev-workflow/orchestrator.py <project_name> <requirement>`
  - Outputs: user stories, technical design, task list
  - See `dev-workflow/SKILL.md` for session integration

### Google ADK Agents (Reference)
Located in `GOOGLE_ADK_AGENTS.md`. Use these for:
- **Research tasks** → deep-search, academic-research
- **Data analysis** → data-science, google-trends-agent
- **Financial tasks** → financial-advisor, currency-agent
- **Web development** → marketing-agency, blog-writer
- **Security tasks** → cyber-guardian-agent, ai-security-agent
- **Workflow automation** → hierarchical-workflow-automation

---

## Wake Word Configuration

### OpenAI Whisper API Setup
- **Provider**: OpenAI
- **Wake Phrase**: "Hi Yoshi"

---

## Notes
- Always check `GOOGLE_ADK_AGENTS.md` before building agentic workflows
- Always check available skills when a task involves external APIs, code, or specific domains
- Use dev-workflow for structured project development