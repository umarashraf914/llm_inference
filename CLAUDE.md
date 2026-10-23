# LLM Inference — figure atlases

Study notes for a nine-video lecture series, *The Engineering Behind LLM Inference*. Each video gets
one self-contained HTML **figure atlas**: a chronological sequence of hand-drawn SVG figures, stamped
with timestamps, that teaches the video from the ground up so it can be read without the video.

This project moved here from a claude.ai chat project on 2026-10-23. The files were taken unchanged
from the Google Drive folder `Inference_Engineering` (last modified 2026-09-03/04).

## Layout

| Path | What it is |
|---|---|
| `atlases/index.html` | Landing page linking every atlas, with figure counts and durations |
| `atlases/V0N_Title.html` | One atlas per video (the deliverables) |
| `atlases/*_animation.html` | Interactive companions, linked from the index |
| `.claude/skills/srt-figure-atlas/` | The workflow: `SKILL.md`, design reference, drawing library, checker |
| `transcripts/` | Caption files, one per video (not migrated yet — see below) |

| # | Atlas | Figures | Video |
|---|---|---|---|
| V1 | The Memory Wall (+ animation, 20 acts) | 147 | 31:08 |
| V2 | Inside the GPU | 100 | 20:26 |
| V3 | Kernels and Memory (+ FlashAttention animation, 42 steps) | 100 | 49:21 |
| V4 | Quantization | 83 | 20:47 |
| V5 | Parallelism | 25 | 16:45 |
| V6 | Mixture of Experts | 23 | 22:38 |
| V7 | Serving in Production | 26 | 29:59 |
| V8 | Speculative Decoding and Long Context | 32 | 29:58 |
| V9 | The Whole Stack | 15 | 9:02 |

## How to work here

Use the `srt-figure-atlas` skill for anything touching an atlas: building one, adding depth,
answering a timestamp question (`V3 18:42 why?`), or fixing layout. Read its `SKILL.md` first. The
rules that most often matter:

- One file per video, named `V0N_Title.html`. To add depth, edit that file in place, insert figures
  where they belong in the video's order, and renumber. Never create `_v2`, `_final` or addendum files.
- When an atlas's figure count changes, update its row and the totals in `atlases/index.html`.
- Verify every number in Python before it goes into a figure.
- Run the checker on every atlas you touch and fix what it reports before committing.
- Never answer a timestamp question from memory; read the transcript window first.

## Transcripts

The `.srt`/`.vtt` files these atlases were built from were not in the Drive folder, so they are not
here yet. Timestamp questions and new figures need them. Add them to `transcripts/` named to match
the atlas (`V03_Kernels_and_Memory.srt`), then index one with:

```bash
python3 .claude/skills/srt-figure-atlas/scripts/srt_tools.py transcripts/V03_Kernels_and_Memory.srt --window 18:42 --pad 90
```

The per-video Python scripts that generated each atlas were not migrated either; only the HTML
output exists. Edit the HTML directly, using `scripts/atlas.py` helpers to produce any new SVG.

## Running the checker

`check_atlas.py` drives headless Chromium through Python Playwright. In the cloud container the
browser is preinstalled under `/opt/pw-browsers` (build 1194), so pin the matching package rather
than running `playwright install`:

```bash
pip install "playwright==1.56.0"
python3 .claude/skills/srt-figure-atlas/scripts/check_atlas.py atlases/V0*.html
```

At migration it reported six existing faults, all minor:

- V01 fig 14 — one element outside the canvas
- V02 fig 86 — "plus or minus" collides with "roughly how big"
- V03 fig 100 — "graph replay" has 6px of room
- V04 fig 50 — "how many share a scale" has 4px of room
- V08 fig 27 — "rises first when capacity runs o…" has 3px of room
- V09 fig 13 — two prose labels collide
