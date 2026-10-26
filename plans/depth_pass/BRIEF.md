# Depth review of one figure atlas — brief

You are reviewing ONE existing HTML "figure atlas" from a nine-video lecture series,
*The Engineering Behind LLM Inference* (YouTube playlist by the channel "PY"). Each atlas is a
chronological sequence of hand-drawn SVG figures, each stamped `Fig N · M:SS`, that teaches one video
from the ground up so it can be read without watching it.

This is a READ-ONLY review. Do not edit, create or delete anything in the repository
(`/home/user/llm_inference`). Do not run git commands that change anything. The only file you write
is your review, at the path given in your prompt.

## What the owner wants (the standard you are reviewing against)

The owner's words, lightly edited: the video's creator is an excellent teacher but explains each
concept at a high level. Every concept can be broken down into smaller concepts, and those into
smaller ones, down a tree, until it reaches **high-school mathematics**: how each thing is actually
done and what it means. The atlas should keep the video's order and topics, but for every topic the
video discusses, decompose it recursively until the reader is standing on high-school maths. There
is **no limit on the number of figures**. HTML is the canvas: anything is allowed, including
interactive widgets.

**Where the floor is.** Treat these as known: arithmetic, fractions, ratios, percentages, powers and
roots, scientific notation, logarithms, linear functions and their graphs, coordinates, the
exponential e^x, averages, basic probability, basic geometry and area. Everything above that must be
built in the atlas before it is used: binary and bytes, vectors and matrices, matrix multiply,
softmax, floating-point formats, a cache, bandwidth, latency, a kernel, a GPU's structure,
percentiles, and so on. Building it can be a short recap figure that points back to an earlier atlas
if the concept is taught fully there.

## Read first

1. `/home/user/llm_inference/.claude/skills/srt-figure-atlas/SKILL.md` — the workflow and rules
   (ground-floor pass, seamless single voice, numbers verified in Python, never label additions).
2. `/home/user/llm_inference/.claude/skills/srt-figure-atlas/references/design.md` — figure anatomy
   (stamp, title, heading, drawing, body prose, caption), the figure idioms catalogue.
3. Your atlas's outline (every part, figure title, label, body prose and caption, in order), and
   its transcript as ~20-second paragraphs. Paths are in your prompt. Read BOTH completely, start to
   finish. Do not skim. The transcript is YouTube auto-generated captions: expect `[music]` marks
   and occasional misheard words.
4. Look at the atlas HTML itself only when the outline is not enough (e.g. to see how a drawing
   works). Optional: render up to 10 figures you need to see, with Python Playwright (installed,
   `from playwright.sync_api import sync_playwright`; `p.chromium.launch()` works) and view the PNGs.

The other atlases' outlines are in the same folder as yours (`V01_outline.md` … `V09_outline.md`).
Use them (grep) to tell whether a prerequisite is already taught in an EARLIER video's atlas, and
where. The series is meant to be read in order.

## What to produce

Write your review to the path in your prompt, in this structure. Be concrete: figure numbers,
timestamps, quotes. No padding, no generic advice.

### 1. Snapshot
Figure count, parts, and 2–4 specific things this atlas already does well (so they are kept).

### 2. Coverage against the transcript
Stretches of the video (timestamp ranges) that the atlas covers thinly or skips, each with a
one-line summary of what is said there. Also note any figure whose stamp does not match where the
video discusses it, and any out-of-order stamps.

### 3. Concept trees
For each major concept the video relies on (expect roughly 8–25), its decomposition from the
video's level down to the high-school floor, as an indented tree. Mark every node:
`[COVERED Fig 12, 14]`, `[PARTIAL Fig 30 — says what, not how]`, `[MISSING]`, or
`[TAUGHT IN V02 Fig 41-44]` (for prerequisites a previous atlas builds). Example shape:

```
softmax — turns scores into probabilities                [PARTIAL Fig 40]
  e^x — why exponentiate, what it does to gaps            [MISSING]
    powers and growth                                     floor
  normalising — divide by the sum so the parts total 1     [COVERED Fig 41]
    fractions of a whole                                  floor
  numerical safety — subtract the max first               [MISSING]
```

### 4. Proposed new figures
The core of the review. A numbered list in VIDEO ORDER. Each entry:
- insert after: `Fig N` (and its stamp)
- title, written as a claim in the atlas's own voice (see design.md)
- idiom (from design.md's catalogue) and what the drawing shows, concretely
- which tree node(s) it fills
- numbers it needs, each with how you verified it (run Python; show the expression) or `VERIFY`
  if it needs a source
Mark entries that would teach far better as an interactive widget. Group consecutive entries that
form one build-up. Propose as many as the standard demands; do not trim to a count, and do not pad.

### 5. Problems in existing figures
Each with figure number and a proposed fix:
- factual or numeric errors (recompute in Python; show the expression and result)
- ASR-mangled names or terms carried into the atlas
- voice violations ("the video says", "the instructor", labelled additions)
- neighbouring figures that repeat each other; captions that restate the picture
- idioms that fight their idea; figures that would be clearer as a different idiom

### 6. Size after the pass
Your estimate of the figure count after this deepening, and the three highest-value changes.

## Rules
- Never invent what the video says. Quote the transcript when you cite it.
- Verify every number you assert in Python before writing it. If you cannot verify, say so.
- Prefer depth that serves the video's argument over tangents. Every new figure must earn its place
  on the path from the video's claim down to the floor.
- Your final message (the one returned to the coordinator) is a summary of at most 300 words:
  number of proposed figures, the five biggest gaps, any errors found, and the review file path.
