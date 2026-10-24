---
name: srt-figure-atlas
description: Turn a YouTube transcript (.srt/.vtt) or a lecture-video link into a self-contained HTML figure atlas that teaches the whole video from the ground up, with hand-drawn SVG diagrams stamped with timestamps. Use this whenever the user uploads an SRT or VTT caption file, pastes a transcript, gives a YouTube link and asks to learn or study from it, asks for "figures", "diagrams", "an atlas", "an explainer" or "notes" for a video or lecture, asks to add more figures to or expand an existing atlas, or asks to explain a specific timestamp from a video they are studying. Also use it when they ask to fix layout, spacing, overlap or alignment problems in figures produced this way.
---

# SRT figure atlas

Turns one video transcript into one HTML document: a chronological sequence of SVG figures that
teaches the video's content from first principles, self-contained enough that the reader never needs
to open the video.

**The deliverable is one HTML file per video, named for the video.** Not a summary, not bullet
points, not a slide deck.

## Workflow

1. **Get the transcript.** If given an SRT/VTT, use it. If given only a YouTube link, try to fetch
   captions; if that fails, say exactly what failed and ask for the SRT. Never invent transcript
   content.
2. **Read the whole thing.** Run `scripts/srt_tools.py` to build an indexed copy, then read it in
   merged ~20-second paragraphs, start to finish, before drawing anything. Do not skim.
3. **Verify every number in Python** before it appears in a figure. See "Numbers" below.
4. **Build the atlas** with `scripts/atlas.py` as the drawing library.
5. **Do the ground-floor pass.** Non-negotiable, and it is a separate pass. See below.
6. **Run `scripts/check_atlas.py`** and fix everything it reports. Never ship a file that fails.
7. **Deliver the HTML** and say what is in it. If an index page exists, update its counts.

## What the atlas contains

**Follow the video's order.** Parts and figures appear in the sequence the video covers them.
Timestamps mark position in the video, not the extent of a figure.

**Teach from the ground up.** This is the core of the job. The video assumes things; the atlas does
not. If the video says "the exponent is biased", the atlas explains what a bias is, why an unsigned
field needs one, and why the constant is what it is. Build every concept from a foundation the
reader already has.

**Integrate seamlessly.** Never label added material as an addition. No "additional context", no
"the instructor says", no "the video explains". Write it as one authoritative voice. The reader
should not be able to tell which figures came from the transcript and which filled a gap.

**Prefer more figures.** A concept that needs six figures gets six. Compositional build-ups — parts
introduced separately, then assembled — work especially well. Never trim to hit a count.

**Keep the presenter's own caveats.** If the video flags that a number is vendor-sourced, unmeasured
or uncertain, that flag stays. Those are the most valuable moments in most talks.

**Flag ASR damage.** Auto-generated captions mangle proper nouns. Use correct spellings in figures
and record the corrections in your reply so the user knows searching the raw SRT will fail.

## The ground-floor pass

A first draft that follows a video will inherit everything the video assumes. Presenters talk to an
audience that already has the vocabulary; the atlas has no such audience. So after drafting, **read
your own atlas from the top as somebody who has never met the subject**, and mark every place you
would have had to look something up.

Each mark is a missing figure. Insert it at the point the term first appears, not in an appendix.

What to look for, in order of how often it is missed:

| The atlas uses | It owes the reader |
|---|---|
| a noun from the field: token, weight, kernel, cache, expert | a figure showing what the thing *is* before using it |
| a unit: FLOP, byte, bandwidth, watt | what it measures, and a count against a rate |
| notation: `10^15`, `2^-14`, log axes, subscripts | how to read it, with the small case worked |
| a data structure: vector, matrix, tensor, tree | it drawn, with its dimensions labelled |
| an operation: matrix multiply, softmax, all-reduce | what it does to a small example |
| a phrase like "as we saw" or "you will recall" | the thing itself, because the reader did not see it |

Then ask the harder question: **does the reader know what the subject even is?** A video about
serving language models opens by assuming you know what a model is, what running one means, and
what a token is. None of that is in the transcript, and all of it belongs at the front.

A worked example of the size of this gap: an atlas of a memory-wall video went from 44 figures to
60 on this pass alone. The additions were a new opening part — what a model file contains, what one
weight does, what a token is, the generate-one-token-and-repeat loop — plus definitions of an
operation, powers-of-ten notation, count-against-rate, bytes, bandwidth, latency, vectors, matrices
and logarithmic axes, each placed where the video first leans on it.

If the pass adds nothing, you did not do it properly.

## Numbers

Every quantity must be computed and checked before it is drawn.

```bash
python3 - <<'PY'
print(f"{989e12/3.35e12:.0f} ops per byte")   # the ridge
PY
```

Rules:
- If the video states a derived figure, reproduce the derivation and confirm it lands.
- If it does not come out, the video may be wrong, or the ASR garbled a unit. Say which, and use
  the correct value in the figure. (Real example: "90 GB/s" that is actually 90 Gb/s = 11 GB/s.)
- Never write a number you have not verified. Never round in a way that hides a discrepancy.
- Bars, boxes and number lines must be drawn to scale, or say in the caption that they are schematic.

## Figures

Read `references/design.md` before drawing. It has the palette, the CSS classes, the layout
constants and — importantly — a catalogue of figure idioms.

**Do not default to boxes and arrows.** They are one idiom among many and they are overused. Match
the idiom to the idea:

| The idea is about | Reach for |
|---|---|
| structure, containment | nested containers |
| a sequence of stages | a flow, but only if there is genuine flow |
| proportion, cost, waste | bars drawn to scale, or area |
| spread, spacing, precision | number lines with ticks |
| time, overlap, stalls | timelines and lane charts |
| position, masking, sparsity | grids and heatmaps |
| lookup, indexing, selection | a table with a pointer into it |
| a formula | the equation built term by term, each annotated |
| something that changes | an interactive widget with controls |

**Every figure has the same six parts:** stamp, title, an optional heading inside the drawing, the
drawing, body prose beneath it, and a caption outside. `references/design.md` describes what each
one is for. The split that matters most is the last two: **body prose explains, the caption judges.**
A reader should be able to read only the captions and still come away with the argument.

## Two failure modes the checker cannot see

**Redundancy between neighbours.** Before shipping, read the figure titles and captions in order.
If two figures near each other make the same point, or share a caption, that is a design fault
however well each one is drawn. Merge them, or give the second a different job. This happens most
easily when adding a ground-floor figure next to an existing one that already covered the idea.

**An idiom that fights the idea.** A dashed marker laid across a histogram is the usual symptom: the
line clips the bars, the tiny bars at one end read as stray dashes, and the reader has to decode the
picture before they can learn from it. When a figure feels cluttered, the fix is rarely to nudge the
line — it is to pick a different idiom.

Two that reliably replace it:

- to *define* a position in a distribution, draw the sorted population itself, one mark per member,
  and label positions on the axis beneath. No marker line crosses anything.
- to *compare* summaries of a distribution, draw them as separate bars on one scale. Median against
  average against p99 as four bars says more than any annotation on a histogram, because the
  comparison becomes a length the reader can see.

## Naming and versioning

`V01_The_Video_Title.html`. Zero-padded index, video title, underscores, nothing else. No `_v2`, no
`_complete`, no `_final`.

**When asked to add figures or depth to an existing atlas: edit its source and rebuild.** Insert the
new figures at the point in the video's sequence where they belong; the build renumbers every figure
and writes the same filename. The old version stops existing. Never create a companion or addendum
file, and never hand-edit a built atlas.

## Building from source

Each atlas in this repository is built from `figures/V0N/` by `scripts/atlas_build.py`:

| Piece | What it is |
|---|---|
| `shell.html` | head, styles, header and footer, with `<!--ITEMS-->` where the items go |
| `items/<id>.html` | one part heading (`s07`) or figure each. Figures from before the depth pass are `o013` (their old number); new ones are named for the plan entry (`p15`) |
| `order.txt` | the items top to bottom, one id per line |
| `src/<name>.py` | the Python that generated a group of items. Rerun it to regenerate them |

```bash
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py list V06               # numbers, stamps, ids, titles
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py insert V06 o013 p15 p16  # after o013
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py move V06 o009 o010     # o009 to after o010
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py drop V06 o002          # out of the order
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py build V06 [--out F]    # assemble and renumber
python3 .claude/skills/srt-figure-atlas/scripts/atlas_build.py index                  # counts in index.html
```

Every figure gets a permanent id (`v06-p15`) that survives renumbering. Point to another figure
with `{{fig:v01-o085}}` (becomes "V1 Fig 85", for SVG text) or `{{ref:v01-o085}}` (the same as a
link, for captions). Only point at a figure after reading it.

In `scripts/atlas.py`, `item()` writes a figure, `prose()` wraps body text at the standard measure
(never inside a hyphenated word, between a number and its unit, or inside a short sum, and with
each pointer measured at its printed length), and `stamp(srt, phrase)` finds where a phrase is
spoken, so stamps come from the transcript rather than memory. Label classes follow the series: `cap` for free-standing row labels, `sub2` for values
and annotations, `sub`/`lbl` only inside a coloured box. `figures/V06/src/router.py` is a worked
example of a build-up and an inline widget: numbers computed in code, every claim asserted, the
widget's initial state drawn in Python and its JavaScript checked against Python in a browser.

## Quality gate

`scripts/check_atlas.py` runs four checks. All must pass:

| Check | Catches |
|---|---|
| bounds | anything drawn outside its canvas |
| collisions | text overlapping text, or text clipping a box edge |
| padding | a child box crowding or crossing its container |
| alignment | a label not vertically centred in its box |
| lines | text sitting on top of a visible line or plot curve |
| cramped | a label with under 6px of room inside its own box |
| over-box | a line drawn across a filled box |
| crowding | body prose starting less than 18px under the drawing above it |
| split-word | a word cut in two across neighbouring labels |
| order | a stamp earlier than the figure before it (mark a deliberate recap `<figure class='recap'>`) |
| numbering, ids | figure numbers that do not run 1, 2, 3; an id used twice |

**Text must never sit on a line.** If a label genuinely belongs over a plot curve, give it
`class="... halo"` — the CSS strokes it in the page colour underneath, so the curve is knocked out
around the letters.

**A label needs room.** Measure the string before choosing the box: at least 6px clear on each side,
and 12px reads better. A label that fills its box edge to edge looks broken even though nothing
technically overflows, and a 1px spill at a rounded corner is worse. Shorten the words or widen the
box; never let it ride the border.

**The drawing needs air beneath it.** Body prose must start at least 18px below whatever is drawn
above it, and 30px reads better. Text that begins a few pixels under a row of boxes looks like it
has fallen into the diagram.

Two different things get confused here, and the class decides which. A caption *attached* to a shape
— a size under a bar, a unit under a bit field — belongs in `sub2` and may sit close. Body prose
belongs in `cap` and must clear the drawing. The `crowding` check looks only at `cap`, so if it
flags a short annotation, the fix is to retag it, not to move it.

**Lines must not run across filled boxes.** Usually this means the drawing is wrong — an arrow
leaving from inside the shape it points away from, a marker hanging past the axis it belongs to.
Reroute it. Two cases are legitimate and get `class="... xok"`: a grid subdividing a filled block,
and a reference line that has to span several bars to show where a value falls. Use `xok`
deliberately; it is not a way to silence a real fault.

```bash
python3 scripts/check_atlas.py path/to/*.html          # report
python3 scripts/check_atlas.py --fix path/to/*.html    # auto-fix padding, then re-report
```

Three things the checker deliberately allows, so do not "fix" them:
- a filled bar sitting exactly on its dashed track (they share edges on purpose)
- dashed annotation outlines hugging their contents (they mark boundaries, not containers)
- a line passing behind an opaque box (paint order hides it)

Nested containers need care: growing an inner box can push it through its parent. The auto-fix does
not understand nesting, so verify nested figures by eye.

## Answering questions about a timestamp

The user will write things like `V3 18:42 why?`. Retrieve the actual transcript around it:

```bash
python3 scripts/srt_tools.py V03_Title.srt --window 18:42 --pad 90
```

Read the window, look back for anything it depends on, then answer. Never answer a timestamp
question from memory of the video. If a screenshot is provided, read it — the slide often carries
what the words leave out.

If the answer reveals a gap the atlas should have covered, offer to add the figures to the file.

## Reference files

- `references/design.md` — palette, CSS, layout constants, figure idioms, worked examples
- `references/portable_spec.md` — the same brief written for any model, no Claude-specific tooling
