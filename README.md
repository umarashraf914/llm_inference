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

`video/` holds the motion-graphics films as code (a GSAP scene per shot, rendered by headless Chromium). Each
film has its own folder, `video/v01/` for lecture 1 and so on, so making one film never touches another, and
each keeps every version it has been released in: `video/vNN/film.json` lists them with their dates and notes,
beside the lecture, atlas and transcript the film was made from. A version renders from exactly the files it
was released with, the shared engine included, so later work can never change it; changing a film means
releasing a new version, and the old ones stay renderable.

**To render**, double-click `make_film.bat` (Windows) or `make_film.command` (Mac) at the top of the repository.
It updates from GitHub and asks which film and which version (press Enter for the newest film's latest
version), then renders it into Downloads as, for example, `V01_The_Memory_Wall_4K_version1.mp4`. From a
terminal: `python video/tools/make_4k.py` for the same questions, `make_4k.py v01` for V01's latest version,
`make_4k.py v01 --version 1` for a particular one, `make_4k.py --list` to see them all.

**Changing a film** costs only what changed. Note the moments you want different, with the film's timestamps
("23:41: the arrow covers the label"), as many as you like, and send the list. Each timestamp maps to its scene
and sentence; once the changes are made you get a short changes reel to approve, holding only the changed scenes,
each after a slate with its place in the film. Then the next version is released. On your computer the next render
reuses every scene it rendered before that has not changed and renders only the changed ones, and the narration,
subtitles and chapters are rebuilt to match in a couple of minutes. (Each computer keeps its rendered scenes for
this, about 2 to 3 GB a film, and deletes those unused for 90 days.)

**Each computer sets itself up** on its first run, and remembers what it found:

- a private Python environment in `video/.venv` with Playwright's Chromium, numpy and a bundled ffmpeg;
- a check, a few minutes long, of the graphics card and hardware video encoder (NVIDIA NVENC on Windows, Apple
  VideoToolbox on a Mac). They draw and encode test frames alongside the software path, and are used only if
  they match its look and are faster. Several ways of drawing on the card are tried, each with a time limit, and
  the report says how far each got. `--check` redoes the check and stops; `--recheck` redoes it and renders;
  `--cpu` renders in software for one run;
- as many scenes at once as its processor and memory allow, keeping memory in use (other programs included)
  under 80%, so the computer stays usable for other work while it renders (on Windows its processes also opt out
  of the power saving that moves background work onto a hybrid processor's power-saving cores).

**Narration** travels with the repository: `video/vNN/narration/` holds the film's timing and each scene's
audio (Opus, about 50 MB a film), and a run decodes it again whenever `git pull` brings a change. A narration
pack zip (`V01_narration_pack.zip`) in Downloads still works when there is none.

The result, `Downloads/V01_The_Memory_Wall_4K.mp4` for V01 (about 2 GB), has two audio tracks (with and
without the ambient music), soft English subtitles and chapter markers. A run prints a running estimate; stop
it at any time and run it again to carry on. Keep about 10 GB free. `--only ch18` renders one chapter as a
quick test; `--help` lists the other options.
