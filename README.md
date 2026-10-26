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

## The films, in 4K on any of your computers

`video/` holds the motion-graphics films as code (a GSAP scene per shot, rendered by headless Chromium);
`video/v01/` is *The Memory Wall*, and each later film gets its own `video/vNN/`. Any computer with Python and
this repository renders them at 3840x2160 and saves one file to its Downloads folder. Nothing is uploaded.

**To render**, double-click `make_film.bat` (Windows) or `make_film.command` (Mac) at the top of the
repository. It updates from GitHub, then renders the newest finished film, asking which one if several are
ready. From a terminal it is `python video/tools/make_4k.py [v01]` (Windows: `py video\tools\make_4k.py`).

**Each computer sets itself up** on its first run, and remembers what it found:

- a private Python environment in `video/.venv` with Playwright's Chromium, numpy and a bundled ffmpeg;
- a one-minute check of the graphics card and hardware video encoder (NVIDIA NVENC on Windows, Apple
  VideoToolbox on a Mac). They draw and encode test frames alongside the software path, and are used only if
  they match its look and are faster. `--recheck` redoes the check; `--cpu` renders in software for one run;
- as many scenes at once as its cores and memory allow.

**Narration** travels with the repository: `video/vNN/narration/` holds the film's timing and each scene's
audio (Opus, about 50 MB a film), and a run decodes it again whenever `git pull` brings a change. A narration
pack zip (`V01_narration_pack.zip`) in Downloads still works when there is none.

The result, `Downloads/V01_The_Memory_Wall_4K.mp4` for V01 (about 2 GB), has two audio tracks (with and
without the ambient music), soft English subtitles and chapter markers. A run prints a running estimate; stop
it at any time and run it again to carry on. Keep about 10 GB free. `--only ch18` renders one chapter as a
quick test; `--help` lists the other options.
