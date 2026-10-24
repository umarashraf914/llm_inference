# Building the depth pass for one atlas

You are building the approved depth pass for one atlas, or for one stretch of a long one. The owner
approved every proposal in the atlas's review. Your job is to carry them out to the standard below,
and to fix the problems the review lists.

## The standard

Each atlas keeps its video's order and topics. Every concept the video uses is broken into smaller
concepts, recursively, until the reader is standing on high-school maths: what the thing is, how it
is actually computed, and what it means. Worked examples with small real numbers beat descriptions.
A figure that names a mechanism without working it is the failure this pass exists to fix.

The floor is arithmetic, fractions, ratios, percentages, powers and roots, scientific notation,
logarithms, linear functions and graphs, coordinates, e^x, averages, basic probability and basic
geometry. Anything above it is built before it is used, or recapped with a pointer to the figure
that builds it.

## Read first, in full

1. `.claude/skills/srt-figure-atlas/SKILL.md`, including "Building from source".
2. `.claude/skills/srt-figure-atlas/references/design.md`: figure anatomy, layout constants, idioms.
3. `plans/depth_pass/README.md`, then your atlas's review, `plans/depth_pass/V0N_review.md`. All six
   sections: §4 is what to build, §5 and §2 are what to fix, §3 shows why each figure exists.
4. Your transcript, start to finish, as merged paragraphs:
   `python3 .claude/skills/srt-figure-atlas/scripts/srt_tools.py transcripts/V0N_*.srt --read 0 99999`
5. The current atlas: `python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py list V0N`,
   and the item files of the figures around each place you will insert.
6. The worked example, `figures/V06/src/router.py`: a build-up of five figures and an inline widget.
   Copy its approach: one Python file per build-up, numbers computed, claims asserted.

## What you may touch

- Only `figures/V0N/` for your atlas: new and changed `items/`, `src/`, and `order.txt` through the
  `insert`, `move` and `drop` commands (they lock the file; never edit `order.txt` by hand while
  another builder may share your atlas).
- Your own scratch folder for previews, screenshots and throwaway scripts.

Never edit `atlases/*.html` (I build those), another atlas's folder, the shared scripts in
`.claude/skills/srt-figure-atlas/`, or anything under `video/`. Never run git commands that change
anything, and never `check_atlas.py --fix`. If a shared script has a bug or lacks something you
need, put a helper in your own `src/` and say so in your report.

## Making a figure

- **Numbers.** Compute every number in your `src/` script; never type one in. The review's numbers
  are a plan, not a source: recompute them. A number that rests on a spec sheet or paper (`VERIFY`
  in the review) needs a source you have read; if you cannot confirm it, leave it out and say so.
  Assert every claim the prose makes (`assert top == [0, 2]`), so the figure cannot drift from the
  maths.
- **Stamps.** `stamp(srt, phrase)` with the words the video uses at that point. Stamps must not go
  backwards; the checker reports it.
- **Anatomy.** Stamp, title stated as a claim, a heading in the drawing when it needs setting up
  (`hd`), the drawing, body prose under it (`prose()`), and a caption that judges rather than
  restates. Body prose explains; the caption says what to take away.
- **Classes.** `cap` for free-standing row labels, `sub2` for values and annotations, `sub`/`lbl`
  only inside a coloured box (`cell(label=)`, `box()`). Colours follow the key in your atlas's
  `shell.html` header; never hard-code a colour.
- **Scale.** Bars and lengths drawn to scale, or the caption says schematic. Past about 50:1, use a
  log scale and say so.
- **Idioms.** Match the idiom to the idea (design.md). Boxes and arrows only for real sequence or
  containment. Tables of numbers, number lines, grids, timelines and equations built term by term
  carry most of this material.
- **Pointers.** `{{fig:v01-o085}}` in SVG prose, `{{ref:v01-o085}}` in a caption for a link. Point
  only at a figure whose item you have read and that really teaches the thing. If the right figure
  will only exist after another builder finishes, write a self-contained recap and leave
  `<!-- link: what it should point to -->` in the item for the final pass.
- **Voice.** One authoritative voice. Never "the video", "the presenter" or "as we saw". Keep the
  presenter's caveats ("in theory", "vendor figures", "measured in training runs"). Spell names
  correctly; the review lists the caption mishearings.

## Widgets

Where the review marks one, follow `p18()` in `figures/V06/src/router.py`:

- `<figure class='widget'>` containing `<div class='wg'>`, rows of controls in `<div class='ctl'>`,
  one SVG in the atlas's style, then the caption.
- An inline `<script>` that finds its figure with `document.currentScript.closest('figure')`, so
  several widgets can share a page. Radio-button names start with the figure's id.
- No libraries, no network. Draw the initial state in Python, so the page reads correctly before any
  interaction and the checker sees it.
- Include a Reset button.
- Reimplement the maths in JavaScript, then drive the page with Playwright over many settings and
  compare every displayed number with Python. Round the same way in both: JavaScript's `toFixed`
  rounds exact halves away from zero, and Python's format does not. The example's `f()` shows how.
- Say in the widget's prose that its arithmetic was checked.

## Changing what exists

- Fix the existing figures the review lists by editing their item files, or by regenerating them
  from a `src/` script.
- Restamp by editing the stamp in the item.
- Move with `move`.
- Merge neighbours that repeat each other by rewriting one item and `drop`ping the other.
- Do not cut material the owner asked for. If the review proposes a cut, keep the content but put it
  where it belongs, unless it truly duplicates a neighbour.
- New part headings are items too (`<div class='sec'><div class='l'>Part 7</div><h2>…</h2><p>…</p></div>`).
  Renumber the "Part N" labels if you add parts.

## The gate, after every build-up

1. `python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py build V0N --out <scratch>/V0N.html`
2. `python3 .claude/skills/srt-figure-atlas/scripts/check_atlas.py <scratch>/V0N.html`. It must be
   clean apart from problems that belong to a stretch another builder owns.
3. `python3 .claude/skills/srt-figure-atlas/scripts/shot.py <scratch>/V0N.html <scratch>/png <ids…>`.
   Open every new or changed figure and look at it. Check every widget, and a sample of the rest,
   with `--dark` too.

   The checker cannot see:
   - a label that reads two ways (two numbers that look like "2⁴")
   - a colour that means the wrong thing
   - a drawing that does not carry the argument
   - a caption that repeats the figure beside it

Keep `order.txt` pointing only at items that exist, so the atlas builds after every step. If you
run short of room, finish the build-up you are in cleanly. Then report exactly which proposals are
done and which remain, so a second builder can continue.

## At the end

- Read your stretch from the top as somebody who has never met the subject. Anything you would have
  had to look up is a missing figure: add it.
- Your final message is at most 300 words:
  - what you built (new figures, widgets, fixed, restamped, merged, moved)
  - anything you skipped, and why
  - review numbers that turned out wrong
  - `<!-- link -->` placeholders left for the final pass
  - problems you saw in the shared scripts
