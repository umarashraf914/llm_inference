# Video transcript → figure atlas

**A portable brief.** Paste this into any capable model that can run code and write files. It
contains no tool names and no product-specific assumptions.

---

## What I want

I study lecture videos by transcript. For each video, produce **one self-contained HTML file**
containing a sequence of hand-drawn SVG figures that teach the whole video from the ground up.

Not a summary. Not bullet points. A figure atlas I can read without opening the video.

## Inputs I will give you

- A caption file (`.srt` or `.vtt`), or a pasted transcript with timestamps
- Sometimes a video title and number
- Sometimes a screenshot of a slide, when the words alone are not enough

If I give you only a link and you cannot retrieve captions, say exactly what failed and ask me for
the file. Never invent transcript content.

## Process

**1. Read the entire transcript before drawing anything.** Merge the caption cues into paragraphs of
about twenty seconds and read start to finish. Do not skim, do not sample.

**2. Verify every number in code before it appears in a figure.**
- If the video states a derived figure, reproduce the derivation and confirm it lands.
- If it does not, the video may be wrong or the captions may have garbled a unit. Say which, and
  put the correct value in the figure.
- Never write a number you have not checked.

**3. Build the atlas.**

**4. Do a ground-floor pass.** Re-read your own draft as somebody who has never met the subject.
Every place you would have had to look something up is a missing figure — insert it where the term
first appears. Definitions of units, notation, data structures and operations all belong in the
body, not an appendix. Ask also whether the reader knows what the subject *is*: a video usually
opens assuming that, and it belongs at the front. If this pass adds nothing, you did not do it.

**5. Check the output** for five faults, and fix every one before showing me:
- anything drawn outside its canvas
- text overlapping text, or text clipping the edge of a box
- a child box crowding or crossing its container — leave at least 20px of padding
- a label not vertically centred in its box
- text sitting on top of a line or plot curve. If a label must sit over a curve, stroke it in the
  background colour underneath so the curve is interrupted around the letters.
- a label with less than 6px of clear space inside its own box. Measure the string against the box
  width before drawing; if it will not fit, shorten the words rather than shrinking the padding. A
  value too wide for its bar goes outside the bar.
- body text starting less than 18px below whatever is drawn above it; 30px reads better. Captions
  attached to a shape are a different thing and may sit close, but paragraphs must clear the
  drawing. When shifting things to make room, move a shape and its label together.
- a line drawn across a filled box. Usually the drawing is wrong: an arrow starting inside the shape
  it leaves, a marker hanging past its axis. Reroute it. Only a grid subdividing a block, or a
  reference line that must span several bars, is legitimate.

**6. Deliver the file** and tell me what is in it and what surprised you.

## What the atlas must be

**In the video's order.** Parts and figures follow the sequence the video covers them. Stamp each
figure with the timestamp it sits at, as a navigation aid.

**Built from the ground up.** This is the point of the whole exercise. The video assumes background;
the atlas does not. If it says "the exponent is biased", explain what a bias is, why an unsigned
field needs one, and why the constant is what it is. Add whatever prerequisite figures the reader
needs, wherever they are needed.

**Seamlessly integrated.** Never label added material as an addition. No "additional context", no
"the presenter says", no "note that the video does not cover". One authoritative voice throughout. I
should not be able to tell which figures came from the transcript and which filled a gap.

**Generous with figures.** A concept that needs six figures gets six. Compositional build-ups —
parts introduced one at a time, then assembled into the whole — work especially well. Never trim to
hit a number.

**Faithful about uncertainty.** If the presenter flags a figure as vendor-sourced, unmeasured or
uncertain, keep that flag. Those are often the most valuable moments.

**Honest about caption errors.** Auto-generated captions mangle proper nouns. Use the correct
spellings in the figures and list the corrections in your reply, so I know searching the raw file
will not find them.

## Figures: do not default to boxes and arrows

Boxes and arrows suit sequence and containment. They are overused for everything else. Match the
idiom to the idea:

| The idea is about | Draw |
|---|---|
| structure, containment | nested containers, each level a different fill |
| peers that do not contain each other | a floor plan, and say so in the caption |
| proportion, cost, waste | bars in the same units, drawn to scale |
| spacing, precision, resolution | a number line with ticks at representable values |
| a distribution against a grid | a histogram overlaid on that tick line |
| time, overlap, stalls | lanes running left to right, dashed for idle |
| position, masking, sparsity | a grid coloured by state |
| lookup, indexing, selection | a table of rows with a pointer into one |
| number formats | bit fields to scale, same pixels-per-bit across formats |
| a formula worth attention | the equation built one term at a time |
| "each fix creates the next problem" | a chain: problem, arrow, fix, stacked |
| one variable changed | small multiples, identical layout |
| a parameter worth turning | an interactive widget with controls |

**Watch for two faults no layout check can catch.** First, redundancy: if two figures near each
other make the same point, merge them. Second, an idiom that fights the idea — a dashed marker
across a histogram is the usual symptom. To define a position in a distribution, draw the sorted
population and label positions beneath it; to compare summaries, draw them as bars on one scale.

**Captions carry the teaching.** Not a restatement of the picture — say what to take away, or what
the figure disproves.

## Layout rules

- Fixed canvas width; choose the height to fit.
- At least 20px of padding inside every container, on every side.
- Labels inside boxes: vertically centred. Container labels: top-left.
- Check that a label fits its box before drawing it.
- Four colours maximum, each with a fixed meaning, stated in a key at the top. Keep the meanings
  stable across a series.

## Naming and versioning

`V01_The_Video_Title.html`. Index, title, underscores, nothing else. No `_v2`, no `_final`.

**When I ask for more depth on a topic, edit the existing file.** Insert the new figures at the
point in the video's sequence where they belong, renumber everything, and give me back the same
filename. The old version stops existing. Never create a companion or addendum file.

## Answering questions about a timestamp

I will write things like `V3 18:42 why?`. Retrieve the actual transcript around that point, look
back for anything it depends on, then answer. Never answer from memory of the video. If I send a
screenshot, read it — the slide often carries what the words leave out.

If the answer reveals a gap the atlas should have covered, offer to add the figures to the file.
