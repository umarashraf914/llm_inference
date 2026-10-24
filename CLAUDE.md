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
| `atlases/V0N_Title.html` | One atlas per video (the deliverables), built from `figures/V0N/` |
| `figures/V0N/` | Each atlas's source: one file per figure and part heading, their order, and the Python that drew the new ones |
| `atlases/*_animation.html` | Interactive companions, linked from the index |
| `.claude/skills/srt-figure-atlas/` | The workflow: `SKILL.md`, design reference, drawing library, checker |
| `transcripts/` | Caption files, one per video (see below) |
| `plans/depth_pass/` | The plan for deepening every atlas to high-school maths: one review per atlas, and a README |

| # | Atlas | Figures | Video |
|---|---|---|---|
| V1 | The Memory Wall (+ animation, 20 acts) | 179 | 31:08 |
| V2 | Inside the GPU | 123 | 20:26 |
| V3 | Kernels and Memory (+ FlashAttention animation, 42 steps) | 129 | 49:21 |
| V4 | Quantization | 83 | 20:47 |
| V5 | Parallelism | 68 | 16:45 |
| V6 | Mixture of Experts | 70 | 22:38 |
| V7 | Serving in Production | 101 | 29:59 |
| V8 | Speculative Decoding and Long Context | 101 | 29:58 |
| V9 | The Whole Stack | 50 | 9:02 |

## How to work here

Use the `srt-figure-atlas` skill for anything touching an atlas: building one, adding depth,
answering a timestamp question (`V3 18:42 why?`), or fixing layout. Read its `SKILL.md` first. The
rules that most often matter:

- One file per video, named `V0N_Title.html`, built from `figures/V0N/` with
  `scripts/atlas_build.py` (see the skill's "Building from source"). To add depth, add items there,
  insert them where they belong in the video's order, and rebuild; the build renumbers. Never
  hand-edit a built atlas, and never create `_v2`, `_final` or addendum files.
- When an atlas's figure count changes, update its row and the totals in `atlases/index.html`.
- Figures that predate the depth pass (`oNNN` items) exist only as HTML; the scripts that drew them
  were not migrated, so edit those items directly. Newer figures are drawn by the scripts in
  `figures/V0N/src/`: change the script and rerun it, or the next run undoes the edit.
- Verify every number in Python before it goes into a figure.
- Run the checker on every atlas you touch and fix what it reports before committing.
- Never answer a timestamp question from memory; read the transcript window first.
- Before deepening an atlas, read `plans/depth_pass/README.md` and that atlas's review. Recompute
  every number the review gives; it is a plan, not a source.

## Transcripts

`transcripts/` holds the captions the atlases were built from, one `.srt` per video, named to match
the atlas (`V03_Kernels_and_Memory.srt`). They are YouTube's auto-generated English captions for the
playlist [The Engineering behind LLM Inference From First Principles](https://www.youtube.com/playlist?list=PLqO45Dg1pMhlDBZTMqVL2GU-14xYip2y2)
(channel PY). The originals were downloaded through downsub.com and were not in the Drive folder;
these copies were fetched again on 2026-10-24 with yt-dlp (track `en-orig`, saved exactly as YouTube
serves it). Each file's last cue ends exactly at the video length in the table above (the atlases
measured length that way), and figure stamps checked against the text agree.

| # | YouTube ID |
|---|---|
| V1 | `ENkuf_2zbkc` |
| V2 | `cbEhkd4ZeKs` |
| V3 | `30IRJQ49M2g` |
| V4 | `1JWnEze9V5g` |
| V5 | `Kjq2vCIH3S8` |
| V6 | `gskjdulkP00` |
| V7 | `9gmHwe5-j0E` |
| V8 | `jLDyJqAOrmQ` |
| V9 | `3OmPtWuT9VA` |

Because they come from speech recognition, the captions carry `[music]` marks mid-sentence and the
odd misheard word (V1 5:57 has "bite-hungry" for "byte-hungry"), so search for a nearby phrase if a
term does not hit.

Read the window around a timestamp with:

```bash
python3 .claude/skills/srt-figure-atlas/scripts/srt_tools.py transcripts/V03_Kernels_and_Memory.srt --window 18:42 --pad 90
```

To fetch a video's captions again (YouTube must be under the environment's allowed domains; from a
cloud container the default yt-dlp clients hit YouTube's bot check, while `ios` and `web_embedded`
got through, with a pause between videos to avoid HTTP 429):

```bash
pip install "yt-dlp[default]"
yt-dlp --js-runtimes node --extractor-args "youtube:player_client=ios,web_embedded;player_skip=webpage" \
  --skip-download --write-auto-subs --sub-langs en-orig --sub-format srt -o "%(id)s" \
  "https://www.youtube.com/watch?v=30IRJQ49M2g"
```

## Running the checker

`check_atlas.py` drives headless Chromium through Python Playwright. The cloud container preinstalls
the browser under `/opt/pw-browsers`, so install the Python Playwright release that expects that
build rather than running `playwright install`. The build is in the folder name: 1243 on 2026-10-24,
which Playwright 1.63.0 expects (at migration it was 1194, for 1.56.0). If the pin is wrong, the
launch error names the build it looked for.

```bash
ls /opt/pw-browsers                # chromium_headless_shell-1243
pip install "playwright==1.63.0"
python3 .claude/skills/srt-figure-atlas/scripts/check_atlas.py atlases/V0*.html
```

At migration it reported six faults, all minor. Five went with the depth pass; this one remains
until V4 is rebuilt:

- V04 fig 50 — "how many share a scale" has 4px of room
