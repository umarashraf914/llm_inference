---
name: lecture-film
description: Make or change the narrated motion-graphics film of a lecture in this repository (video/vNN, one per atlas) - its script, narration, GSAP scenes, audit, previews, releases and the 4K render on the user's own computers. Use it for anything touching a film, as when building a new film from an atlas, changing what is on screen at a film timestamp ("V01 23:41 the arrow covers the label"), fixing alignment, spacing, capitalisation, fonts or icons in a scene, re-narrating, releasing a version, or working on the render tools. It holds the rules learned from V01's faults, so that none of them happens again.
---

# Lecture films

A film teaches one lecture's atlas as a narrated motion graphic: chapters that follow the lecture,
a scene per shot (one GSAP timeline, keyed to the recorded narration), drawn in SVG and rendered by
headless Chromium. V01, *The Memory Wall*, is the first: 19 chapters, 156 scenes, 92 minutes.

## Where things are

| Path | What it is |
|---|---|
| `video/engine/` | `stage.html`, `engine.js` (scene API, casing, the audit), `theme.css`, fonts: the core every scene of every film depends on |
| `video/lib/` | shared components (devices, tokens, charts, timelines); `INDEX.md` lists them, `README.md` explains them |
| `video/vNN/script/chNN.json` | each chapter's narration and storyboard, with a Python check for every number |
| `video/vNN/scenes/` | one file per scene; `chNN_common.js` holds a chapter's shared builders |
| `video/vNN/build/` | timing, audio, stills, previews (not in git) |
| `video/vNN/film.json` | title, source lecture and atlas, released versions |
| `video/tools/` | `tts`, `render` (stills, audit, video), `where`, `reel`, `release`, `narration_pack`, `make_4k` |

The guides sit with V01 and hold for every film: `video/v01/SCRIPT_GUIDE.md` for a chapter's script,
`video/v01/ANIMATION_GUIDE.md` for the scene API, art direction and technical rules. `PLAN.md` and
`CHAPTER_NOTES.md` are V01's own; a new film writes its own. Read the animation guide before
touching a scene. Run the tools from `video/`.

## Making a film

1. **Plan** from the atlas (`tools/extract_atlas.py`) and the transcript: chapters in the lecture's
   order, the figures each scene covers, examples kept consistent across chapters.
2. **Script** each chapter by `SCRIPT_GUIDE.md`. Every number on screen or in the narration gets a
   Python check in the script's `checks`. `tools/validate_script.py --all video/vNN` must pass.
3. **Narrate**: `tools/tts.py video/vNN` writes `build/timing.json` and each scene's audio.
4. **Build scenes** by `ANIMATION_GUIDE.md`, starting from the exemplar `v01/scenes/ch01_s01.js` and the
   `lib/` components. `tools/scene_brief.py vNN <scene>` prints a scene's storyboard and word times.
5. **Check every chapter**: stills and contact sheets (`render.py vNN stills chNN`, and look at them),
   then `render.py vNN audit chNN`, which must end `AUDIT CLEAN` with no warnings. Then the by-eye
   checks under "Before a scene is done": the audit cannot see them.
6. **Preview, send, release** as CLAUDE.md's Films section says: 1080p previews for the user, the
   narration exported into git, `tools/release.py`, and a push.

Changing a released film is in CLAUDE.md too. In short: `tools/where.py vNN 23:41` maps the user's
timestamps to scenes and sentences. Fix in scene files or a chapter's `_common.js`; a `lib/` change
re-renders every scene that uses it, and an engine-core change re-renders every scene of every film.
Keep scene lengths, review with `tools/reel.py vNN`, then release a new version (never edit a released one).

## Rules learned from V01

Each was a fault in V01, seen by the user or found in review, and fixed. Where the audit enforces
a rule, its finding is named in brackets; every other rule is checked by eye, in the stills.

### Joining pictures

1. **A line meets each picture at the centre of the whole picture**, not of one part of it. A server
   with its cache stacked on it, a laptop with its base, a card with its badge: one picture, one
   centre. In the user's words: "the whole picture of the server should be considered as a whole
   picture." The fault was in ch04_s06, where the wire met the server chassis below the cache drawn
   on it. It was also in ch04_s01, ch04_s05, ch16_s01, ch02_s06 and ch06_s09.
   - Lay it out as ch04_s06 does: fix one centre line first and work out each whole picture's
     height from its parts. Centre both pictures on that line and run the wire along it.
   - A device's `.port()` is the edge of the device alone. Once parts are added to it (a stack, a
     badge, a plate), the picture needs its own centre.
   - The audit cannot know which parts make one picture: check a `--debug` still (120 px grid)
     wherever a line joins pictures.
2. **A wire always meets something.** If its target appears later, draw the target's place from the
   start. In ch04_s06 the cache's place is a dotted outline until the notes arrive.
3. **Arrows that fan out leave one point and run straight**, level where they can. Each lands on
   something drawn, never in empty space, and a badge sits on its arrow with its label beside it.
   When a loop ends, its arrows, badges and labels dim together. The user called ch04_s05 (a token
   going three places) "not aligned, arrows are weird"; it was redrawn this way.
4. **An icon is a picture too.** Lines meet its middle, and labels keep clear of it [text-on-icon].
   Real-world objects use `fluent:*` icons and UI symbols `ph:*-duotone`. Find ids with
   `tools/build_icons.py --search <word>`, then run it bare to bundle them.

### Type

5. **Poppins, labels in Title Case, set by the engine.** This is the user's choice, made after trying
   faces on real frames. Write every string in lower case, as it is said; a scene never capitalises
   text itself.
6. **Data stays as written**: draw tokens, example sentences, chat messages, quoted answers and code
   with `case: 'keep'`. `libToken`, the chat window and mono text already do; a `libToken` chip that
   names something takes `case: 'label'`. Measure with the same options you draw with.
7. **A phrase split over lines is one phrase**: `V.caseLines(['nothing else about', 'the architecture'])`
   drawn with `case: 'keep'`, or `S.para`. A smaller or muted second line is a caption of its own.
8. **One-letter subscripts are real subscripts**: `V.subs('W_K', size)` as `S.text` segments.
9. **After any change of face or case, audit every scene again and look again.** The switch to
   Poppins pushed thirty-odd labels into a neighbour, an edge or off screen.

### Room around labels

10. **Size every box from `S.measure` of its label**, with the same size, weight, family and case,
    and room to spare inside: aim for 12 px (the audit flags under 3 px [text-tight]). Never guess a
    width.
11. **A label is never on an icon, a line or a box's edge** [text-on-icon, text-on-line,
    crosses-shape-edge].
12. **A label never touches a neighbour.** Two labels on one line never meet end to end
    [text-touch]. A label never sits flush against the box or disc beside it [text-touches-box].
    Before a release, sweep for near misses with `render.py vNN audit all --touch-gap 8` and look at
    each finding: widen the gap wherever a viewer would see two things nearly touching; a single
    sample in mid-motion usually is not one.
13. **Make room for the largest value a counter reaches**, not its first. In ch17_s05, 22,000
    tokens/s came within a few pixels of the card beside it. A label inside a growing bar waits
    until the bar can hold it.

### Saying the right thing

14. **A label belongs to the picture it is on.** The stopwatch on ch12_s02's H100 chart showed the
    H200's 30 ms; it now reads "one token".
15. **Every number on screen comes from the script's checks.** Check any new one in Python before it
    is drawn.

### Working

16. **The audit reads text; only eyes see alignment, arrows and the story.** For every scene: the
    contact sheet for the story, full-size stills for detail, a `--debug` still wherever lines join
    pictures.
17. **A fault seen once is a pattern until shown otherwise.** The user's note named one laptop and
    one server ("this is a general pattern in our video"); the same fault was in five more scenes.
    Fix it film-wide, and fix the shared builder when that is the cause.
18. **Turn a repeated fault into a check.** The audit's text checks (text-on-icon, text-tight,
    text-touch, text-touches-box) were added while fixing V01, so those faults cannot come back
    unseen. An audit change is an `engine.js` change, which re-renders every scene of every film:
    batch it with other engine work.
19. **Do the work yourself, in the session.** No sub-agents or multi-agent workflows: while V01 was
    made they used up the user's usage limit again and again ("I just want my video"), and the user
    has asked twice to work without them.

## Before a scene is done

1. Every beat's `show` is realised, in sync with its words, and every number is right.
2. The contact sheet reads as a story.
3. In the stills, nothing overlaps, clips or is tiny. Lines meet whole pictures at their centres,
   arrows run straight and land on something, and spacing is even.
4. `render.py vNN audit chNN` ends `AUDIT CLEAN`, and `stills` printed no warnings.

## The user's computers

The user renders in 4K at work and at home by double-clicking `make_film.bat` (a Windows
workstation: Intel i7, RTX 5000 Ada, 64 GB) or `make_film.command` (a Mac mini M1, 16 GB). Both run
`tools/make_4k.py` after a `git pull`. Rendered video never goes into git.

- Each computer checks its graphics card and video encoder once against software drawing and keeps
  the result. `make_film --check` redoes the check and reports; on the Windows machine the card
  draws and NVENC encodes.
- Scenes at once: three quarters of the CPU threads, fewer if memory in use would pass 80%.
- The progress line shows frames per second over the whole run and over the last minute. Each
  finished scene shows a frame's time split into seek, draw and encoder: ask for those lines when
  speed is the question.
- Rendering keeps every scene it has drawn under a fingerprint of what its frames depend on
  (`tools/scenekeys.py`), so a new version redraws only the scenes that changed. The tools are not
  part of the fingerprint; the engine core is, so engine changes cost a full re-render.
