#!/usr/bin/env python3
"""Silent timing for library demo scenes, so they render like film scenes without narration.

  python3 tools/make_demo_timing.py stopwatch tokens ...   # -> libdemo/build/timing.json, scenes demo_<name>
Each demo scene runs 16 s with beats b1..b4 starting at 0.5, 4.5, 8.5 and 12.5 s (no word timings:
use 'b2', 'b2+1.2', 'b2@0.5'). Names already in the file are kept.
"""
import json, sys
from pathlib import Path

VIDEO = Path(__file__).resolve().parents[1]
out = VIDEO / "libdemo" / "build" / "timing.json"
old = json.loads(out.read_text()) if out.exists() else {"order": [], "scenes": {}}
names = [n for n in old["order"]] + [f"demo_{n}" for n in sys.argv[1:] if f"demo_{n}" not in old["order"]]
scenes, t = {}, 0.0
for sid in names:
    beats = [{"id": f"b{i + 1}", "start": 0.5 + 4 * i, "dur": 3.5, "end": 4.0 + 4 * i, "text": "", "words": []} for i in range(4)]
    scenes[sid] = {"id": sid, "kind": "scene", "duration": 16.0, "beats": beats, "globalStart": t,
                   "chapter": {"id": "demo", "number": "00", "title": "Library", "kicker": "lib · " + sid[5:], "enter": True, "exit": False}}
    t += 16.0
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"voice": "none", "speed": 1, "fps_grid": 30, "order": names, "scenes": scenes, "total": t}, indent=1))
print(f"{out}: {', '.join(names)}")
