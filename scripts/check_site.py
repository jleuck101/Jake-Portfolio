#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path
from html.parser import HTMLParser

REPO = Path(__file__).resolve().parents[1]

PROJECTS_JSON = REPO / "data" / "projects.json"
TOOLS_JSON = REPO / "data" / "tools.json"

PAGES = [
    REPO / "index.html",
    REPO / "compositing.html",
    REPO / "motion.html",
    REPO / "tools.html",
]

class IdCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "script" and "src" in a:
            self.scripts.append(a["src"])

def die(msg: str, code: int = 1):
    print(f"ERROR: {msg}")
    sys.exit(code)

def warn(msg: str):
    print(f"WARN:  {msg}")

def ok(msg: str):
    print(f"OK:    {msg}")

def load_json(path: Path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        ok(f"Valid JSON: {path.relative_to(REPO)}")
        return data
    except Exception as e:
        die(f"Invalid JSON in {path.relative_to(REPO)}: {e}")

def rel_exists(p: str) -> bool:
    # Accept absolute site-root paths like "/data/projects.json"
    if p.startswith("/"):
        p = p[1:]
    return (REPO / p).exists()

def check_projects():
    if not PROJECTS_JSON.exists():
        die("Missing data/projects.json")
    data = load_json(PROJECTS_JSON)

    projects = data.get("projects", [])
    galleries = data.get("galleries", {})

    if not isinstance(projects, list) or not isinstance(galleries, dict):
        die("projects.json must have { projects: [...], galleries: {...} }")

    ids = []
    by_id = {}
    for p in projects:
        pid = p.get("id")
        if not pid:
            die("A project entry is missing 'id'")
        ids.append(pid)
        if pid in by_id:
            die(f"Duplicate project id: {pid}")
        by_id[pid] = p

        for field in ("href", "thumbnail"):
            if field in p and p[field]:
                if not rel_exists(p[field]):
                    die(f"projects.json: missing file for {pid}.{field}: {p[field]}")

    ok(f"projects.json project count: {len(projects)}")

    # Validate galleries refer to existing ids
    for gid, entries in galleries.items():
        if not isinstance(entries, list):
            die(f"galleries.{gid} must be a list")
        for e in entries:
            if isinstance(e, str):
                pid = e
            elif isinstance(e, dict) and "id" in e:
                pid = e["id"]
            else:
                die(f"galleries.{gid} entry must be string or {{id,...}}; got {e}")
            if pid not in by_id:
                die(f"galleries.{gid} references unknown project id: {pid}")

    ok(f"projects.json galleries count: {len(galleries)}")
    return set(galleries.keys())

def check_tools():
    if not TOOLS_JSON.exists():
        warn("Missing data/tools.json (skipping tools checks)")
        return set()

    data = load_json(TOOLS_JSON)
    tools = data.get("tools")
    if not isinstance(tools, list):
        die("tools.json must have top-level key 'tools' as a list")

    ids = set()
    for t in tools:
        tid = t.get("id")
        if not tid:
            die("A tool entry is missing 'id'")
        if tid in ids:
            die(f"Duplicate tool id: {tid}")
        ids.add(tid)

        # Optional files
        for field in ("previewMp4", "thumbJpg"):
            v = t.get(field)
            if v:
                if not rel_exists(v):
                    die(f"tools.json: missing file for {tid}.{field}: {v}")

    ok(f"tools.json tool count: {len(tools)}")
    return set()

def check_pages(gallery_ids_expected: set):
    all_ids = set()
    for page in PAGES:
        if not page.exists():
            warn(f"Missing page: {page.relative_to(REPO)} (skipping)")
            continue
        parser = IdCollector()
        parser.feed(page.read_text(encoding="utf-8"))
        all_ids |= parser.ids

        # Basic check that required scripts exist
        for src in parser.scripts:
            if src.startswith("http"):
                continue
            if not rel_exists(src):
                die(f"{page.name}: missing script file: {src}")

        ok(f"Parsed page: {page.relative_to(REPO)} (ids={len(parser.ids)})")

    # Ensure any gallery ids in JSON exist in the HTML somewhere
    missing_in_html = sorted([gid for gid in gallery_ids_expected if gid not in all_ids])
    if missing_in_html:
        warn("Some gallery ids exist in data/projects.json but not found in checked HTML pages:")
        for gid in missing_in_html:
            warn(f"  - {gid}")
    else:
        ok("All galleries from projects.json appear in checked HTML pages (by id).")

def main():
    ok(f"Repo: {REPO}")
    gallery_ids = check_projects()
    check_tools()
    check_pages(gallery_ids)
    ok("Site sanity check completed.")

if __name__ == "__main__":
    main()
