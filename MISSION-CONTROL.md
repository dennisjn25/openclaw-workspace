# Mission Control

Mission Control is installed in this workspace.

## Files
- `index.html` - dashboard UI
- `data/tasks.json` - task board data
- `data/crons.json` - dashboard cron display data
- `scripts/mc-update.py` - local task update helper for Yoshi/OpenClaw
- `C:\Users\joshy\.clawdbot\mission-control.json` - compatibility config used by the upstream webhook transform
- `C:\Users\joshy\.clawdbot\hooks-transforms\github-mission-control.mjs` - upstream GitHub webhook transform

## Current status
- Dashboard files copied into the workspace
- Task data initialized
- Yoshi-compatible helper script added
- Heartbeat checks can watch for `in_progress` tasks
- GitHub Pages + GitHub webhook automation still need one-time external setup
- Tailscale is not installed on this machine yet, so webhook ingress is not live yet

## Local use
Open `index.html` in a browser or serve the workspace with a static file server.

## Helper examples
```powershell
python scripts/mc-update.py start task_example
python scripts/mc-update.py comment task_example "Researching the best approach"
python scripts/mc-update.py complete task_example "Done. Ready for review."
```

## Next external steps
1. Install and sign in to Tailscale
2. Enable Tailscale Funnel for port `18789`
3. Create or connect a GitHub repo for this workspace
4. Enable GitHub Pages for that repo
5. Add a GitHub webhook pointing at the Funnel URL

Once those are done, moving a task to `In Progress` from the dashboard can wake Yoshi automatically.
