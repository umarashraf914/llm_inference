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
| `.claude/skills/srt-figure-atlas/` | The atlas workflow: `SKILL.md`, design reference, drawing library, checker |
| `.claude/skills/lecture-film/` | The film workflow and the rules learned from V01's faults (`SKILL.md`) |
| `transcripts/` | Caption files, one per video (see below) |
| `plans/depth_pass/` | The plan for deepening every atlas to high-school maths: one review per atlas, and a README |
| `video/` | The motion-graphics films: `vNN/` per film (script, scenes, `narration/`, `film.json`), the engine, and `tools/` |
| `make_film.bat`, `make_film.command` | Double-click launchers that render a finished film in 4K on the user's own computers |
| `rendered/` | The finished 4K films, on the computers that rendered them (ignored by git) |

| # | Atlas | Figures | Video |
|---|---|---|---|
| V1 | The Memory Wall (+ animation, 20 acts) | 179 | 31:08 |
| V2 | Inside the GPU | 123 | 20:26 |
| V3 | Kernels and Memory (+ FlashAttention animation, 42 steps) | 129 | 49:21 |
| V4 | Quantization | 118 | 20:47 |
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
- Do the work yourself, in the session: no sub-agents or multi-agent workflows. They used up the
  user's usage limit while V01 was made, and the user has asked for this twice.

## Films

Use the `lecture-film` skill for anything touching a film, and read its `SKILL.md` first: it holds the rules
learned from V01 (lines meet whole pictures at their centres, every frame composed like a slide from the centre
out, labels in Title Case, room around every label) and the checks that enforce them. The scene guide is `video/v01/ANIMATION_GUIDE.md`, for every film.

Each film is `video/vNN/`, built in a cloud session (narration with `video/tools/tts.py`, scenes, 1080p previews)
and rendered in 4K on the user's own computers (a Mac and a Windows workstation) by `video/tools/make_4k.py`, which
the launchers at the repository root run after a `git pull`. The user picks a film and a version from its menu.
Each computer checks its own GPU and encoder on its first run and keeps the result in `video/.venv`. The finished
film is saved in the repository folder, in `rendered/` (for example `rendered/V01_The_Memory_Wall_4K_version4.mp4`),
not in Downloads: the user asked for that. Rendered video never goes into git (`rendered/` and `build/` are ignored).
The launchers run `git pull` and then go on reading themselves, and Windows reads a running `.bat` by byte offset:
change the launchers' text before the `git pull` line only at the same length, byte for byte.

Films keep every version. `video/vNN/film.json` holds the title, the source (lecture, length, YouTube id, atlas,
transcript) and the versions, each a commit: make_4k renders a version from the repository as it was at that
commit (`git archive` into `video/.versions/`), with today's tools, so work on another film or on the shared engine
and library never changes a released version. Never edit a released version; release a new one. Keep the contract
between the tools and an old snapshot working: `engine/stage.html?film=&scene=`, `window.__chapterLoaded`,
`V.load(id, entry, opts)`, `V.seek(t)`, `V.audit()`, `timing.json`, `narration/`.

Rendering is incremental: each computer keeps the scenes it has rendered under a fingerprint of everything their
frames depend on (`video/tools/scenekeys.py`) and renders a new version's scenes only where the fingerprint changed.
So when changing a released film:

- map the user's timestamps to scenes and sentences: `python3 video/tools/where.py vNN 23:41 45:10 ...`;
- make fixes in the scene files or the chapter's `_common.js` where possible: a change to a `lib/` file re-renders
  every scene that uses it, and a change to the engine core (`engine/stage.html`, `engine.js`, `theme.css`, the
  fonts, GSAP) re-renders every scene of every film, on every computer;
- re-narrate only what changed (tts.py caches by sentence) and keep scene lengths where possible: a longer scene
  moves every later one, and those stay reusable only while the total shift is 10 s or less;
- review with `python3 video/tools/reel.py vNN`, which renders at 1080p, with narration, only the scenes that differ
  from the latest version, each after a slate with its place in the film, and send the reel to the user;
- if capture or encoding ever changes how a segment looks, bump `FORMAT` in `scenekeys.py`.

To release a film (first version, or a new one after changes):

- export its narration into git: `python3 video/tools/narration_pack.py export video/vNN` (Opus per scene and
  `timing.json`, about 50 MB a film; re-export whenever the narration changes);
- commit everything the film renders from, then `python3 video/tools/release.py vNN "what this version is"`, which
  checks the film is complete and committed and adds the version (that commit) to `film.json`;
- commit `film.json` and push.

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

At migration it reported six faults, all minor. The depth pass cleared them, and every atlas
passes as of 2026-10-24. Keep it that way: a fault is fixed before the commit, not listed here.
