#!/usr/bin/env python3
"""Recalculate Terracroma plan progress from task checkboxes.

Task line format: - [ ] [TASK:AREA-001] Description
The plan markdown is authoritative. Generated mirrors/dashboard are deterministic.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import re
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple

TASK_RE = re.compile(r"^- \[([ xX])\] \[TASK:([A-Z0-9][A-Z0-9_-]*)\] (.+)$", re.M)
STATUS_RE = re.compile(r"(?m)^\*\*Status:\*\* (Not started|In progress|Done)$")
DEP_RE = re.compile(r"`([^`]+\.md)`")


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as tmp:
        tmp.write(content)
        temp_path = Path(tmp.name)
    temp_path.replace(path)


def read_doc(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_dependencies(content: str) -> List[str]:
    match = re.search(r"(?ms)^## Dependencies\s*\n(.*?)(?=^## |\Z)", content)
    if not match:
        return []
    return DEP_RE.findall(match.group(1))


def parse_doc(path: Path) -> dict:
    content = read_doc(path)
    tasks = [(m.group(2), m.group(1).lower() == "x", m.group(3).strip()) for m in TASK_RE.finditer(content)]
    return {"path": path, "content": content, "tasks": tasks, "deps": parse_dependencies(content)}


def parse_log_ids(log_path: Path) -> set[str]:
    if not log_path.exists():
        return set()
    return set(re.findall(r"\[TASK:([A-Z0-9][A-Z0-9_-]*)\]", log_path.read_text(encoding="utf-8")))


def calculate(root: Path) -> Tuple[dict, List[str]]:
    plan_dir = root / "plan"
    docs = {p.name: parse_doc(p) for p in sorted(plan_dir.glob("*.md"))}
    errors: List[str] = []
    seen: Dict[str, str] = {}
    for name, doc in docs.items():
        for task_id, _, _ in doc["tasks"]:
            if task_id in seen:
                errors.append(f"Duplicate task ID {task_id}: {seen[task_id]} and {name}")
            seen[task_id] = name
        for dep in doc["deps"]:
            if dep not in docs:
                errors.append(f"Missing dependency in {name}: {dep}")
    # Dependency status is evaluated iteratively. A cycle never becomes Done.
    states = {name: "Not started" for name in docs}
    counts = {}
    for name, doc in docs.items():
        total = len(doc["tasks"])
        checked = sum(1 for _, done, _ in doc["tasks"] if done)
        counts[name] = {"total": total, "checked": checked, "unchecked": total - checked}
    changed = True
    for _ in range(len(docs) + 1):
        changed = False
        for name, doc in docs.items():
            total = counts[name]["total"]
            checked = counts[name]["checked"]
            deps_exist = all(dep in docs for dep in doc["deps"])
            deps_done = deps_exist and all(states[dep] == "Done" for dep in doc["deps"])
            if total > 0 and checked == total and deps_done:
                new = "Done"
            elif checked > 0:
                new = "In progress"
            else:
                new = "Not started"
            if new != states[name]:
                states[name] = new
                changed = True
        if not changed:
            break
    # Detect actual dependency cycles. A fully checked file whose prerequisites remain
    # incomplete stays In progress; it is not an updater error and cannot become Done.
    visiting = set()
    visited = set()
    def visit(name, trail):
        if name in visiting:
            cycle = trail[trail.index(name):] + [name]
            errors.append("Dependency cycle: " + " -> ".join(cycle))
            return
        if name in visited:
            return
        visiting.add(name)
        for dep in docs[name]["deps"]:
            if dep in docs:
                visit(dep, trail + [dep])
        visiting.remove(name)
        visited.add(name)
    for name in docs:
        if name not in visited:
            visit(name, [name])
    total_tasks = sum(v["total"] for v in counts.values())
    checked_tasks = sum(v["checked"] for v in counts.values())
    pct = round(100 * checked_tasks / total_tasks, 1) if total_tasks else 0.0
    plan_pct = round(100 * sum(1 for v in states.values() if v == "Done") / len(states), 1) if states else 0.0
    current = None
    for name in docs:
        doc = docs[name]
        if states[name] == "Done":
            continue
        if all(dep in docs and states[dep] == "Done" for dep in doc["deps"]):
            for tid, done, desc in doc["tasks"]:
                if not done:
                    current = {"file": name, "task_id": tid, "description": desc}
                    break
        if current:
            break
    payload = {"docs": docs, "states": states, "counts": counts, "total_tasks": total_tasks,
               "checked_tasks": checked_tasks, "percentage": pct, "plan_percentage": plan_pct,
               "current": current, "errors": errors}
    return payload, errors


def update(root: Path, check: bool = False) -> int:
    root = root.resolve()
    plan_dir = root / "plan"
    progress_dir = root / "progress"
    mirrors_dir = progress_dir / "per-file-status"
    log_path = progress_dir / "completed-log.md"
    state_path = progress_dir / ".progress-state.json"
    payload, errors = calculate(root)
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 2
    log_ids = parse_log_ids(log_path)
    checked_ids = {tid for doc in payload["docs"].values() for tid, done, _ in doc["tasks"] if done}
    new_completed = sorted(checked_ids - log_ids)
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    log_text = log_path.read_text(encoding="utf-8") if log_path.exists() else "# Completed task log\n\nAppend-only event history. Do not delete entries when a checkbox is reopened.\n"
    if new_completed:
        append = "".join(f"- {today} — [TASK:{tid}] marked complete; progress recalculated from plan checkbox.\n" for tid in new_completed)
        log_text = log_text.rstrip() + "\n" + append
    if not log_path.exists():
        atomic_write(log_path, log_text)
    elif new_completed:
        atomic_write(log_path, log_text)

    stale = []
    for name, doc in payload["docs"].items():
        state = payload["states"][name]
        updated = STATUS_RE.sub(f"**Status:** {state}", doc["content"], count=1)
        if updated == doc["content"] and not STATUS_RE.search(doc["content"]):
            errors.append(f"{name} is missing a parseable Status line")
            continue
        if check and updated != doc["content"]:
            stale.append(f"plan/{name} status field is stale")
        elif not check and updated != doc["content"]:
            atomic_write(plan_dir / name, updated)
        total = payload["counts"][name]["total"]
        checked = payload["counts"][name]["checked"]
        deps = doc["deps"]
        dep_lines = ", ".join(f"{dep}: {payload['states'].get(dep, 'MISSING')}" for dep in deps) or "None"
        mirror = (f"# Status mirror: {name}\n\n- Status: **{state}**\n- Tasks: **{checked}/{total}** complete\n- Completion: **{round(100*checked/total,1) if total else 0.0}%** (checkbox-derived; empty task set is 0%)\n- Dependencies: {dep_lines}\n- Generated by: `python scripts/update_progress.py`\n\nThis file is generated. Edit `plan/{name}` instead.\n")
        mpath = mirrors_dir / (Path(name).stem + ".status.md")
        if check:
            if not mpath.exists() or mpath.read_text(encoding="utf-8") != mirror:
                stale.append(f"progress/per-file-status/{mpath.name} is stale")
        else:
            # Ignore generated timestamp differences for normal operation by writing current mirror.
            atomic_write(mpath, mirror)
    if errors:
        for e in errors: print(f"ERROR: {e}", file=sys.stderr)
        return 2
    if payload["current"]:
        cur = payload["current"]
        active = f"`{cur['task_id']}` in `plan/{cur['file']}` — {cur['description']}"
    else:
        active = "No unblocked unchecked task found. Check dependency blockers or all tasks may be complete."
    rows = ["# Progress dashboard", "", f"- **Task completion:** {payload['percentage']}% ({payload['checked_tasks']}/{payload['total_tasks']} checked)", f"- **Plan-file completion:** {payload['plan_percentage']}% ({sum(1 for s in payload['states'].values() if s == 'Done')}/{len(payload['states'])} files Done)", f"- **Current active task:** {active}", f"- **Last updated (UTC):** {dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}", "", "## Per-file progress", "", "| Plan file | Status | Tasks | Completion |", "|---|---|---:|---:|"]
    for name in payload["docs"]:
        c = payload["counts"][name]
        percent = round(100*c['checked']/c['total'],1) if c['total'] else 0.0
        rows.append(f"| [`{name}`](../plan/{name}) | {payload['states'][name]} | {c['checked']}/{c['total']} | {percent}% |")
    rows += ["", "## Blockers and validation", "", "- Dependency files must exist and be Done before a dependent file can be Done.", "- A file with zero tasks is never Done.", "- An unchecked task reopened after completion remains in the append-only history.", "- Rechecking a previously logged task ID does not append a duplicate completion event.", "- If no unblocked task appears, inspect Dependencies sections and task status mirrors.", "", "## Update commands", "", "```bash", "python scripts/install_hooks.py  # one-time local setup", "python scripts/update_progress.py", "python -m unittest discover -s tests -v", "python scripts/update_progress.py --check", "```", ""]
    dashboard = "\n".join(rows)
    dash_path = progress_dir / "PROGRESS-DASHBOARD.md"
    if check:
        if not dash_path.exists(): stale.append("progress/PROGRESS-DASHBOARD.md is missing")
        elif not re.sub(r"- \*\*Last updated \(UTC\):\*\*.*", "- **Last updated (UTC):** NORMALIZED", dash_path.read_text(encoding='utf-8')) == re.sub(r"- \*\*Last updated \(UTC\):\*\*.*", "- **Last updated (UTC):** NORMALIZED", dashboard):
            stale.append("progress/PROGRESS-DASHBOARD.md is stale")
        if stale:
            for s in stale: print(f"STALE: {s}", file=sys.stderr)
            return 1
        print("Progress artifacts are current.")
        return 0
    atomic_write(dash_path, dashboard)
    # Preserve a state snapshot to help humans inspect the current calculation.
    state_obj = {"updated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                 "task_total": payload["total_tasks"], "task_checked": payload["checked_tasks"],
                 "percentage": payload["percentage"], "states": payload["states"],
                 "ever_logged_task_ids": sorted(log_ids | checked_ids)}
    atomic_write(state_path, json.dumps(state_obj, indent=2) + "\n")
    print(f"Updated progress: {payload['percentage']}% ({payload['checked_tasks']}/{payload['total_tasks']} tasks).")
    if payload["current"]: print(f"Next task: {payload['current']['task_id']} in {payload['current']['file']}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Project root")
    parser.add_argument("--check", action="store_true", help="Fail if generated files/status fields are stale")
    args = parser.parse_args()
    return update(args.root, check=args.check)

if __name__ == "__main__":
    raise SystemExit(main())
