# The Engineering Behind LLM Inference — figure atlases

Nine self-contained HTML figure atlases (939 figures, 50 of them interactive widgets) and two
interactive animations that teach a lecture series on LLM inference from the ground up, down to
high-school maths: the memory wall, GPU internals, kernels, quantization, parallelism, mixture of
experts, production serving, speculative decoding and long context, and the whole stack.

Open [`atlases/index.html`](atlases/index.html) in a browser to start. Every file works offline.

The atlases are produced with the `srt-figure-atlas` workflow in
[`.claude/skills/srt-figure-atlas/`](.claude/skills/srt-figure-atlas/SKILL.md). A tool-neutral
version of the same brief, usable with any model, is in
[`references/portable_spec.md`](.claude/skills/srt-figure-atlas/references/portable_spec.md).

## The Memory Wall as a film, in 4K on your own computer

`video/` holds the motion-graphics film of video 1 as code (a GSAP scene per shot, rendered by headless
Chromium). One command renders it at 3840x2160 on your machine and saves a single file to your Downloads
folder. Nothing is uploaded anywhere.

1. Install [Python 3.9+](https://www.python.org/downloads/) and git, and clone this repository.
2. Optional, recommended: put `V01_narration_pack.zip` (the film's exact narration) in your Downloads
   folder. Without it the narration is synthesised locally, after a 350 MB voice-model download.
3. Run, from the folder you cloned into:

   ```
   python video/tools/make_4k.py          # Windows: py video\tools\make_4k.py
   ```

The result is `Downloads/V01_The_Memory_Wall_4K.mp4`, about 2 GB. It has two audio tracks (with and
without the ambient music), soft English subtitles and chapter markers. The first run sets up a private
environment in `video/.venv` (Playwright's Chromium, numpy, a bundled ffmpeg), so no other installs are
needed. Rendering takes hours (about 166,000 frames) and prints a running estimate. Stop it at any time
and run the same command again to carry on. Keep about 10 GB free. `--only ch18` renders one chapter as
a quick test; `--help` lists the other options.
