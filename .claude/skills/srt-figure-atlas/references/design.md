# Design reference

## The anatomy of a figure

Every figure has the same six parts, in the same order. Four are always present, one nearly always,
one is optional.

```
Fig 38 · 0:46                          1  stamp        always
Words in common are not a cache hit    2  title        always
┌──────────────────────────────────┐
│ Four words in common, and not     │  3  heading      when the drawing needs setting up
│ one of them helps                 │
│  ▢ ▢ ▢ ▢ ▢ ▢ ▢                    │  4  drawing      always
│  ▢ ▢ ▢ ▢ ▢ ▢ ▢                    │
│                                   │
│ The very first token differs, so  │  5  body         almost always
│ the match ends at position zero…  │
└──────────────────────────────────┘
If you take one thing from this part…  6  caption      always
```

**1 · Stamp** — `Fig N · timestamp`. The number is for referring to it; the timestamp says where in
the video you are. It marks a position, not the extent of what the figure covers: a figure stamped
0:46 may develop an idea the video only touches there.

**2 · Title** — one line, in the page's own voice. State the claim, not the topic: *Words in common
are not a cache hit*, not *Cache hits*. It has to stand alone, because a reader scanning titles
should get the argument.

**3 · Heading inside the figure** — the sentence that makes the drawing legible, so it needs no
legend. *Four words in common, and not one of them helps.* Omit it when the drawing is
self-explanatory; about six figures in ten have one.

**4 · Drawing** — carries the argument visually. Drawn to scale wherever a quantity is involved, or
labelled schematic when not.

**5 · Body prose** — inside the SVG, beneath the drawing, in short paragraphs of one to three lines
with a blank line between. This is where the teaching happens: the mechanism, the numbers, the
consequence. Typically around 300 characters.

**6 · Caption** — grey, outside the figure. **Not a restatement of the picture.** It carries what to
take away, what the figure disproves, what to watch for next, or an honest caveat about the data.
A reader should be able to read only the captions and come away with the argument.

Good caption: *Both bars to the same scale. The top bar is what one head wants; the bottom is what
it gets.*
Bad caption: *This figure shows the working set compared with SRAM capacity.*

The split between 5 and 6 is the one to get right. Body prose explains; the caption judges.

## Canvas and type

Every figure is `viewBox="0 0 680 H"`. Width is always 680; choose H to fit.

| | |
|---|---|
| left margin for body text | `x=40` |
| container inset | `x=40..640`, label at `x+22, y+26` |
| body line spacing | 20px |
| gap between a figure's last element and the body prose | 28–40px, never under 18 |
| minimum padding inside a container | **20px on every side** |

Text width, to check a label fits before drawing it:

| class | size | ≈ px per character |
|---|---|---|
| `lbl` | 13px | 7 |
| `sub` / `sub2` | 11.5px | 6 |
| `cap` | 12.5px | 6.5 |
| `hd` | 13px | 7 |

A label in a 250px box has 226px usable. 32 characters of `sub` is 192px: fits. 40 is 240: does not.

## Colour

Four ramps, applied as a class on the `<g>`: `m`, `s`, `h`, `u`. Never hard-code a colour.

| class | means |
|---|---|
| `s` | cheap, fast, on-chip, near, what helps |
| `h` | expensive, slow, far, what it costs, what fails |
| `m` | the thing under discussion: arithmetic, the object being computed |
| `u` | neutral structure with no valence |

Assign the semantics per document and state them in the header key. Keep them stable across a
series so the reader learns them once.

## Positioning text

**`cell(label=)` and `box()` centre their labels.** Use them for any text inside a box.

**`txt()` places a BASELINE, not a centre.** It is for free-standing body text. Putting `txt()`
inside a box leaves the label sitting high — the alignment check catches this, but do not create it.

Container labels belong top-left at `y+26`, never centred. That is why the alignment check ignores
boxes taller than 60px.

## Figure idioms

Boxes and arrows are one idiom. They suit sequence and containment and nothing else. Match the
idiom to the idea:

### Nested containers — structure, scope, "what is inside what"
Solid fills, each level a different ramp, label top-left. Works when the nesting is real: a package
holds a die holds a multiprocessor. Do not use it for things that merely sit near each other.

### Floor plan — components that are peers
A container with siblings laid out in a grid. The teaching point is that none of them contains
another. State that in the caption; readers assume nesting otherwise.

### Bars to scale — proportion, cost, waste
Two bars in the same units and the reader sees the argument without reading a number. Draw them to
scale or say "schematic" in the caption. For ratios beyond about 50:1 use a log scale and label it,
or the small bar disappears.

### Number line with ticks — spacing, precision, what a format can represent
A horizontal axis with tick marks at representable values, and a dashed marker at the value in
question. This is how to show that a number falls between ticks. Excellent for floating point,
quantization grids, anything about resolution.

### Histogram over a tick line — a distribution against a grid
Bars for where the data lives, ticks for what the format can express. Overlaying the two is the
whole argument about outliers in one picture.

### Timeline / lane chart — time, overlap, stalls, pipelining
One lane per actor, time running left to right, filled blocks for busy and dashed for idle. Shows
latency hiding, pipeline bubbles, producer-consumer overlap. The dashed gaps carry the message.

### Grid or heatmap — position, masking, sparsity
Cells coloured by state. Use for causal masks (the triangle), which multiprocessors are busy, which
channels carry outliers. When most cells are one colour and a few are another, this beats any prose.

### Table with a pointer — lookup, indexing, selection
Rows with index labels, one highlighted, an arrow in from the key and out to the result. Use
whenever the operation is "find the row", not "compute the value".

### Bit layout — number formats
Fields drawn to scale at a fixed pixels-per-bit across every format in the document, so widths are
comparable down the column. Label a field only if it fits; otherwise show the bit count alone.

### Equation, built up — a formula that deserves attention
Each term in its own `eq()` box, with a line of prose between steps explaining what just changed.
Far better than presenting the finished formula and explaining it afterwards.

### Chain of consequences — "each fix creates the next problem"
Left column the problem, right column the fix, arrow between, stacked. Turns a list of techniques
into an argument.

### Small multiples — the same diagram at three settings
Identical layout repeated with one variable changed. The reader compares by position, which is far
easier than comparing across paragraphs.

### Sorted population — defining a position in a distribution
One mark per member, sorted, with positions labelled on the axis below. This is what a percentile
*is*, so drawing it this way needs no annotation and no marker line. Colour the bands if the groups
matter. Far clearer than a dashed line laid over a histogram, which clips the bars it crosses.

### Summary bars — comparing statistics of one distribution
Median, mean, p90, p99 as four bars on a single scale. The reader compares lengths instead of
decoding annotations, and the gap between mean and p99 becomes the argument.

### Interactive widget — anything with a parameter worth turning
A self-contained HTML page with controls: step through an algorithm, drag a batch size along a
roofline, flip bits and watch a float change. Verify the underlying computation in Python first and
say in the page that you did.

## Text and lines

**A label must never have a line running through it.** Two different faults get confused here:

*A line through a box* is a drawing error. An arrow that starts inside the box it points away from,
a grid line crossing a centred label. Reroute the line or move the label; do not paper over it.

*A label over a plot curve* is often unavoidable — the roofline's "memory bound" has to sit in the
memory-bound region, and the curve passes through it. Give the text a halo:

```
<text class="sub2 halo" ...>memory bound</text>
```

`svg text.halo` strokes the glyphs in the page colour beneath the fill, so the curve is cleanly
interrupted around the letters. This is the standard cartographic solution and it reads far better
than nudging the label into empty space.

The `lines` check skips any text carrying `halo`, so use it deliberately rather than to silence a
real error.

## Air under the drawing

Body prose (`cap`) must clear whatever is drawn above it by at least 18px, ideally 30. Anything less
and the paragraph reads as part of the diagram.

Annotations are different. A size under a bar, a unit under a bit field, a name under a shape: those
are `sub2` and belong close to what they label. Choosing the right class is what tells the check
which rule to apply.

**When shifting elements to make room, move whole `<g>` groups.** A box and its label are siblings
in one group; moving one without the other silently breaks the figure, and only the collision check
will notice.

## Room around a label

Measure the string before choosing the box width. The table above gives pixels per character; a
label needs **at least 6px clear on each side, and 12px looks better**.

A label that touches both borders reads as broken even when it technically fits, and text one pixel
wider than its box is worse still because it collides with the rounded corner. If the words will not
fit, shorten them — do not shrink the padding.

When a bar is too narrow to hold its own value, put the value outside to the right rather than
squeezing it in.

## Lines across boxes

A line drawn over a filled box is almost always a mistake: an arrow that starts inside the shape it
is leaving, a dashed marker that hangs below its axis, a connector routed straight through a label.
Reroute it.

Two cases are genuine and get `class="... xok"`, which the `over-box` check skips:

- a grid subdividing a filled block into tiles, where drawing over the fill is the point
- a reference marker that must span several bars to show where a value falls

Both are annotations *about* the boxes rather than accidents on top of them.

## Captions

`figcaption` is where the teaching goes. Do not restate the picture.

Good: *"Both bars to the same scale. The top bar is what one head wants; the bottom is what it gets."*
Bad: *"This figure shows the working set compared with SRAM capacity."*

Say what the reader should take away, what the figure disproves, or what to carry into the next one.

## Verifying before you draw

```bash
python3 - <<'PY'
peak, bw = 989e12, 3.35e12
print(f"ridge = {peak/bw:.0f} ops per byte")
PY
```

Then draw 295. Not the other way round.
