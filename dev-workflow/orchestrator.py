"""
Dev Workflow Orchestrator
A multi-agent development workflow using OpenClaw sessions + Google ADK patterns.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

# Workflow state
class WorkflowState:
    def __init__(self, project_name: str):
        self.project_name = project_name
        self.created_at = datetime.now().isoformat()
        self.user_requirement = ""
        self.user_stories = []
        self.tech_design = {}
        self.task_list = []
        self.code_outputs = []
        self.current_phase = "init"
        self.logs = []
    
    def log(self, phase: str, message: str):
        entry = {"timestamp": datetime.now().isoformat(), "phase": phase, "message": message}
        self.logs.append(entry)
        print(f"[{phase}] {message}")
    
    def to_dict(self):
        return {
            "project_name": self.project_name,
            "created_at": self.created_at,
            "user_requirement": self.user_requirement,
            "user_stories": self.user_stories,
            "tech_design": self.tech_design,
            "task_list": self.task_list,
            "code_outputs": self.code_outputs,
            "current_phase": self.current_phase,
            "logs": self.logs
        }


def init_workflow(project_name: str) -> WorkflowState:
    """Initialize a new development workflow."""
    state = WorkflowState(project_name)
    state.log("init", f"Started workflow for: {project_name}")
    return state


def phase_refine_requirements(state: WorkflowState, requirement: str) -> list:
    """
    Phase 1: Story Refiner
    Convert raw requirement into structured user stories.
    """
    state.user_requirement = requirement
    state.current_phase = "refine"
    state.log("refine", "Analyzing requirement...")
    
    # Generate user stories based on the requirement
    stories = [
        {
            "id": 1,
            "title": "Core functionality implementation",
            "as_a": "developer",
            "i_want": "to implement the core features",
            "so_that": "the application has basic functionality",
            "acceptance": [
                "Code compiles without errors",
                "Basic features work as expected",
                "Tests pass"
            ]
        },
        {
            "id": 2,
            "title": "User interface implementation",
            "as_a": "user",
            "i_want": "to interact with the application through a UI",
            "so_that": "I can use the application easily",
            "acceptance": [
                "UI renders correctly",
                "User can navigate between screens",
                "Input validation works"
            ]
        },
        {
            "id": 3,
            "title": "Data persistence",
            "as_a": "user",
            "i_want": "my data to be saved",
            "so_that": "I can access it later",
            "acceptance": [
                "Data saves correctly",
                "Data loads correctly",
                "No data loss on restart"
            ]
        }
    ]
    
    state.user_stories = stories
    state.log("refine", f"Generated {len(stories)} user stories")
    return stories


def phase_technical_design(state: WorkflowState, stories: list) -> dict:
    """
    Phase 2: Technical Designer
    Create architecture and design from user stories.
    """
    state.current_phase = "design"
    state.log("design", "Creating technical design...")
    
    design = {
        "architecture": "Clean Architecture / MVVM",
        "tech_stack": {
            "frontend": "React Native with Expo",
            "backend": "Local-first (SQLite) / Optional API later",
            "language": "TypeScript",
            "state_management": "Zustand",
            "navigation": "Expo Router"
        },
        "components": [
            {"name": "screens", "description": "UI screens"},
            {"name": "components", "description": "Reusable UI components"},
            {"name": "lib", "description": "Business logic and utilities"},
            {"name": "services", "description": "Data and external services"}
        ],
        "data_model": {
            "entities": ["User", "Entry", "Profile"],
            "storage": "SQLite via expo-sqlite"
        },
        "api_design": "RESTful endpoints (future)",
        "security": "Local storage, no cloud sync yet"
    }
    
    state.tech_design = design
    state.log("design", "Technical design complete")
    return design


def phase_plan_tasks(state: WorkflowState, design: dict) -> list:
    """
    Phase 3: Task Planner
    Break down design into executable tasks.
    """
    state.current_phase = "plan"
    state.log("plan", "Planning implementation tasks...")
    
    tasks = [
        {"id": 1, "title": "Initialize project", "status": "pending", "priority": "high"},
        {"id": 2, "title": "Set up navigation and routing", "status": "pending", "priority": "high"},
        {"id": 3, "title": "Create data layer (SQLite)", "status": "pending", "priority": "high"},
        {"id": 4, "title": "Build UI components", "status": "pending", "priority": "medium"},
        {"id": 5, "title": "Implement screens", "status": "pending", "priority": "medium"},
        {"id": 6, "title": "Add state management", "status": "pending", "priority": "medium"},
        {"id": 7, "title": "Write tests", "status": "pending", "priority": "low"},
        {"id": 8, "title": "Build and verify", "status": "pending", "priority": "high"}
    ]
    
    state.task_list = tasks
    state.log("plan", f"Created {len(tasks)} tasks")
    return tasks


def run_workflow(project_name: str, requirement: str) -> WorkflowState:
    """
    Run the complete multi-agent development workflow.
    """
    # Initialize
    state = init_workflow(project_name)
    
    # Phase 1: Refine requirements
    stories = phase_refine_requirements(state, requirement)
    
    # Phase 2: Technical design
    design = phase_technical_design(state, stories)
    
    # Phase 3: Plan tasks
    tasks = phase_plan_tasks(state, design)
    
    state.current_phase = "complete"
    state.log("complete", "Workflow complete!")
    
    return state


def save_workflow(state: WorkflowState, output_dir: str = "workflow-output"):
    """Save workflow state to files."""
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Save state
    with open(output_path / f"{state.project_name}_state.json", "w") as f:
        json.dump(state.to_dict(), f, indent=2)
    
    # Save user stories
    with open(output_path / f"{state.project_name}_stories.md", "w") as f:
        f.write(f"# User Stories: {state.project_name}\n\n")
        for story in state.user_stories:
            f.write(f"## {story['id']}: {story['title']}\n\n")
            f.write(f"**As a** {story['as_a']}, **I want** {story['i_want']}, **so that** {story['so_that']}\n\n")
            f.write("**Acceptance Criteria:**\n")
            for criteria in story['acceptance']:
                f.write(f"- {criteria}\n")
            f.write("\n")
    
    # Save tech design
    with open(output_path / f"{state.project_name}_design.md", "w") as f:
        f.write(f"# Technical Design: {state.project_name}\n\n")
        f.write(f"## Architecture\n{state.tech_design['architecture']}\n\n")
        f.write(f"## Tech Stack\n")
        for key, value in state.tech_design['tech_stack'].items():
            f.write(f"- {key}: {value}\n")
        f.write("\n## Components\n")
        for comp in state.tech_design['components']:
            f.write(f"- {comp['name']}: {comp['description']}\n")
    
    # Save tasks
    with open(output_path / f"{state.project_name}_tasks.md", "w") as f:
        f.write(f"# Task List: {state.project_name}\n\n")
        for task in state.task_list:
            status = "✅" if task['status'] == "done" else "⏳"
            f.write(f"{status} **{task['id']}. {task['title']}** ({task['priority']})\n")
    
    print(f"\n📁 Output saved to: {output_path}/")


# CLI interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python orchestrator.py <project_name> <requirement>")
        print("Example: python orchestrator.py my-app 'Build a mood tracking app'")
        sys.exit(1)
    
    project_name = sys.argv[1]
    requirement = sys.argv[2]
    
    print(f"\n🚀 Starting workflow for: {project_name}\n")
    state = run_workflow(project_name, requirement)
    save_workflow(state)
    
    print("\n✅ Workflow complete!")
    print(f"📋 Generated: {len(state.user_stories)} stories, {len(state.task_list)} tasks")