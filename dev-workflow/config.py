"""
Dev Workflow Configuration
"""

# Default model settings
DEFAULT_MODEL = "gemini-2.0-pro"
FALLBACK_MODEL = "gemini-1.5-pro"

# Agent configurations
AGENTS = {
    "story_refiner": {
        "name": "Story Refiner",
        "description": "Converts raw requirements into structured user stories",
        "model": DEFAULT_MODEL,
        "temperature": 0.3,
        "system_prompt": """You are a story refinement agent. Your job is to take 
        raw user requirements and convert them into clear, actionable user stories.
        
        Format each story as:
        - ID: [number]
        - Title: [short title]
        - As a: [user type]
        - I want: [feature]
        - So that: [benefit]
        - Acceptance Criteria: [list of measurable criteria]
        
        Focus on actionable, testable outcomes."""
    },
    "technical_designer": {
        "name": "Technical Designer",
        "description": "Creates technical architecture and design documents",
        "model": DEFAULT_MODEL,
        "temperature": 0.2,
        "system_prompt": """You are a technical design agent. Your job is to take 
        user stories and create a comprehensive technical design.
        
        Include:
        - Architecture pattern (e.g., Clean Architecture, MVVM)
        - Tech stack recommendations
        - Component structure
        - Data model / schema
        - API design (if applicable)
        - Security considerations
        
        Be practical and choose proven technologies."""
    },
    "task_planner": {
        "name": "Task Planner",
        "description": "Breaks down work into executable tasks",
        "model": DEFAULT_MODEL,
        "temperature": 0.1,
        "system_prompt": """You are a task planning agent. Your job is to take 
        a technical design and break it down into specific, actionable tasks.
        
        For each task include:
        - ID
        - Title
        - Priority (high/medium/low)
        - Dependencies (what must be done first)
        - Estimated complexity
        
        Order tasks logically - build foundations before features."""
    }
}

# Output settings
OUTPUT_DIR = "workflow-output"
LOG_LEVEL = "INFO"

# File templates
TEMPLATES = {
    "user_story": """## {id}: {title}

**As a** {as_a}, **I want** {i_want}, **so that** {so_that}

### Acceptance Criteria
{criteria}
""",
    "tech_spec": """# Technical Specification: {project_name}

## Architecture
{architecture}

## Tech Stack
{tech_stack}

## Components
{components}

## Data Model
{data_model}

## API Design
{api_design}
""",
    "task": """### {id}. {title}
- Priority: {priority}
- Status: {status}
- Dependencies: {dependencies}
"""
}