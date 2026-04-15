#!/usr/bin/env python
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

WS = Path(r"C:\Users\joshy\.openclaw\workspace")
TASKS_FILE = WS / "data" / "tasks.json"


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def load_data():
    with TASKS_FILE.open('r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    data['lastUpdated'] = now_iso()
    with TASKS_FILE.open('w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def get_task(data, task_id):
    for task in data.get('tasks', []):
        if task.get('id') == task_id:
            return task
    raise SystemExit(f'Task not found: {task_id}')


def ensure_comments(task):
    task.setdefault('comments', [])


def cmd_status(args):
    if len(args) != 2:
        raise SystemExit('Usage: mc-update.py status <task_id> <new_status>')
    task_id, new_status = args
    data = load_data()
    task = get_task(data, task_id)
    old = task.get('status')
    task['status'] = new_status
    save_data(data)
    print(f'✓ {task.get("title")}: {old} -> {new_status}')


def cmd_subtask(args):
    if len(args) != 3 or args[2] != 'done':
        raise SystemExit('Usage: mc-update.py subtask <task_id> <subtask_id> done')
    task_id, subtask_id, _ = args
    data = load_data()
    task = get_task(data, task_id)
    for subtask in task.get('subtasks', []):
        if subtask.get('id') == subtask_id:
            subtask['done'] = True
            save_data(data)
            print(f'✓ Subtask marked done: {subtask.get("title")}')
            return
    raise SystemExit(f'Subtask not found: {subtask_id}')


def cmd_comment(args):
    if len(args) < 2:
        raise SystemExit('Usage: mc-update.py comment <task_id> <comment text>')
    task_id, text = args[0], ' '.join(args[1:])
    data = load_data()
    task = get_task(data, task_id)
    ensure_comments(task)
    task['comments'].append({
        'id': f'c{len(task["comments"]) + 1}',
        'author': 'Yoshi',
        'text': text,
        'createdAt': now_iso()
    })
    save_data(data)
    print(f'✓ Comment added to {task_id}')


def cmd_add_subtask(args):
    if len(args) < 2:
        raise SystemExit('Usage: mc-update.py add-subtask <task_id> <title>')
    task_id, title = args[0], ' '.join(args[1:])
    data = load_data()
    task = get_task(data, task_id)
    subtasks = task.setdefault('subtasks', [])
    subtask_id = f'sub_{len(subtasks) + 1:03d}'
    subtasks.append({'id': subtask_id, 'title': title, 'done': False})
    save_data(data)
    print(f'✓ Added {subtask_id} to {task_id}')


def cmd_start(args):
    if len(args) != 1:
        raise SystemExit('Usage: mc-update.py start <task_id>')
    task_id = args[0]
    data = load_data()
    task = get_task(data, task_id)
    task['processingStartedAt'] = now_iso()
    task['status'] = 'in_progress'
    ensure_comments(task)
    task['comments'].append({
        'id': f'c{len(task["comments"]) + 1}',
        'author': 'Yoshi',
        'text': 'Started working this task.',
        'createdAt': now_iso()
    })
    save_data(data)
    print(f'✓ Started {task_id}')


def cmd_complete(args):
    if len(args) < 2:
        raise SystemExit('Usage: mc-update.py complete <task_id> <summary>')
    task_id, summary = args[0], ' '.join(args[1:])
    data = load_data()
    task = get_task(data, task_id)
    task['status'] = 'review'
    ensure_comments(task)
    task['comments'].append({
        'id': f'c{len(task["comments"]) + 1}',
        'author': 'Yoshi',
        'text': summary,
        'createdAt': now_iso()
    })
    save_data(data)
    print(f'✓ Completed {task_id} -> review')


COMMANDS = {
    'status': cmd_status,
    'subtask': cmd_subtask,
    'comment': cmd_comment,
    'add-subtask': cmd_add_subtask,
    'start': cmd_start,
    'complete': cmd_complete,
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        names = ', '.join(COMMANDS)
        raise SystemExit(f'Usage: mc-update.py <{names}> ...')
    COMMANDS[sys.argv[1]](sys.argv[2:])


if __name__ == '__main__':
    main()
