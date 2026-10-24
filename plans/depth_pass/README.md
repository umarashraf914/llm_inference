# Depth pass: plan for all nine atlases

Reviewed 2026-10-24. One reviewer per atlas read the whole atlas against its whole transcript and
wrote the file for that atlas here. No atlas has been changed by this plan yet.

## The standard

Each atlas keeps its video's order and topics. Every concept the video uses is broken into smaller
concepts, and those into smaller ones, until the reader is standing on high-school maths: what the
thing is, how it is actually computed, and what it means. There is no limit on figures, and an
interactive widget goes wherever a parameter is worth turning.

The floor is arithmetic, fractions, ratios, percentages, powers and roots, scientific notation,
logarithms, linear functions and their graphs, coordinates, e^x, averages, basic probability and
basic geometry. Anything above it is built before it is used, or recapped with a link to the atlas
that builds it.

## Where each atlas stands

| Atlas | Video | Figures now | Per minute | New figures | Merged or cut | After the pass | Widgets |
|---|---|---|---|---|---|---|---|
| V1 The Memory Wall | 31:08 | 147 | 4.7 | 36 | 15 | about 168 | 8 (four share one roofline) |
| V2 Inside the GPU | 20:26 | 100 | 4.9 | 37 | 13 | about 124 | 5 |
| V3 Kernels and Memory | 49:21 | 100 | 2.0 | 41, plus 5 rebuilt | 17 | about 124 | 1, plus 2 candidates |
| V4 Quantization | 20:47 | 83 | 4.0 | 38 | 3 | about 118 | 6 |
| V5 Parallelism | 16:45 | 25 | 1.5 | 42 | 0 | about 67 | 6 |
| V6 Mixture of Experts | 22:38 | 23 | 1.0 | 48 | 0 | about 71 | 5 |
| V7 Serving in Production | 29:59 | 26 | 0.9 | 70 | 1 | about 95 | 5 |
| V8 Speculative Decoding and Long Context | 29:58 | 32 | 1.1 | 70 | 0 | about 102 | 4 |
| V9 The Whole Stack | 9:02 | 15 | 1.7 | 32 | 1 | about 46 | 4 |
| **Series** | **3:50:04** | **551** | | **414** | | **about 915** | **about 45** |

## What the reviews found across the series

**1. Two tiers.** V1, V2 and V4 had a deep pass, at four to five figures a minute, and so did V3 up
to 16:00 (3.9). V3 after 16:00 (1.1 a minute) and all of V5–V9 (0.9–1.7) did not. Even with its
review's additions, V3's second half would sit at 1.7 a minute, the thinnest stretch left in the
series, so expect to add more there when building it.

**2. The thin atlases name mechanisms instead of working them.** V6 Fig 13, *How the router
chooses*, is four boxes and three paragraphs. Its review replaces it with one token carried through
four real dot products, a softmax, top-2 and the blend, plus a slider widget (V6 P15–P20). V7
Fig 7, *Selective batching*, is two labelled boxes. Changing that pattern matters more than the
figure count.

**3. Foundations used before they are built, or never built.** Each belongs in the earliest atlas
that uses it, with later atlases recapping and linking:

- what the feed-forward block computes, and why it needs a non-linearity (built nowhere; used in
  V1, V5 and V6)
- how attention compares tokens: the dot product, softmax over scores, heads and grouped-query
  attention (V1 uses them in Figs 112, 139 and 140; V3 builds them two videos later)
- matrix × matrix, as opposed to matrix × vector (V2)
- binary place value, binary fractions, two's complement, and a floating-point number decoded by
  hand (V1, V2, V4)
- bits against bytes in network rates, unit prefixes, KB against KiB (V1, V2)
- what a batch is (V1)
- median and percentiles (V7 uses them; only V8 builds them)
- loss, slope and gradient at the level of a parabola (V4's GPTQ, V6's load balancing)

**4. About a hundred errors.** The reviewers recomputed every numeric one in Python. The
consequential ones:

- V4 Fig 02 says decode does 2 operations per byte and sits 150× below the ridge. It is 1 and about
  295×, as V1 Fig 116 and V4's own Fig 55 say, and the video does not claim otherwise.
- V1 Fig 146 calls "bandwidth ÷ bytes per token" the factor of 300. That division gives 23.9 tokens a
  second; 300 is the ridge divided by the intensity.
- V1 Fig 31 calls 22 KB of network traffic against 70 TB of memory traffic "seven orders of
  magnitude". It is 9.5.
- V1 Figs 12 and 106 give the chip "a few hundred kilobytes" of fast memory. An H100 has about
  115 MB.
- V3 gives FlashAttention's traffic saving as 135× (Fig 03), 129× by its own numbers, and 24×
  (Fig 43). The paper measured 9.2× less traffic and 5.7× less time.
- V2's coalescing figures (61, 63, 65) assume 128-byte fetches. Modern GPUs fetch 32-byte sectors,
  so a scattered warp moves 8× the bytes it needs, not 32×.
- V5 Fig 13's caption reverses its own numbers. Going from 4 to 8 microbatches takes the idle share
  from 43% to 27%; going from 16 to 32 nearly halves it.
- V8 Figs 25 and 26 contradict each other on mean and p99 slowdown.
- V9 Fig 3 draws 36 compute trays. An NVL72 rack has 18, plus 9 switch trays.

The V1 errors above also sit in the V1 film's source (`video/v01/source/atlas_v01.md`), in chapters
2, 4, 9 and 18.

**5. Stamps.** V5–V9 stamps often land 10–40 s early, on the tail of the previous topic. V1, V2, V3
and V8 have runs that go backwards. Some are deliberate recaps; the rest are mistakes. Each review
lists corrected stamps.

**6. Voice and leftovers.** "The video" appears in the atlas's own voice in V1, V3 (11 figures), V4
and V6. Some figures in V1 and V3 answer a chat question that is not in the document. V7 drops every
name the video gives (Orca, vLLM, Sarathi-Serve, DistServe, SGLang and the rest); V5, V6, V8 and V9
drop several, along with caveats the presenter attached ("in theory", "early figures", "measured in
training runs"). The reviews list the caption mishearings to correct when the names come back: V6
"Chimera 2" is Kimi K2, V7 "E34B" is Yi-34B and "disserve" is DistServe, V8 "queue weight" is queue
wait.

**7. Repetition and scale.** About 17 V3 figures repeat a neighbour, and V2, V4 and V7 have a few.
Bars that look to scale but are not: V1 Fig 62, V2 Fig 54, V3 Figs 09 and 79, V4 Figs 43, 73 and 77,
V5 Fig 13, V8 Fig 22, V9 Fig 8.

**8. What the checker cannot see.** V6 Fig 21 cuts words in half across two labels ("computes whil"
over "e the other is in flight") and passes. The checker also cannot tell whether bars match their
numbers, or whether a figure contradicts another atlas.

## Decisions for the owner

1. **V1 Figs 19–59.** Forty-one figures stamped 0:46 cover what a request contains, tools and
   skills, streaming, and the prompt cache. The video does not discuss them there, and the cache
   figures use keys, values and prefill long before the atlas builds them. The V1 film has already
   solved this (`video/v01/PLAN.md`): the cache material (Figs 26, 33–56) moves after the KV-cache
   chapter, and Fig 55 moves to the part about what the user feels. Recommended: reorder the atlas
   the same way and keep all of it. The V1 review suggests cutting tools and skills; the film uses
   them.
2. **Prerequisites taught in an earlier atlas.** Recommended: a short recap figure with a link to
   the atlas and figure that builds it, rather than teaching it again. That needs stable figure ids,
   because renumbering breaks references like "V1 Fig 84".
3. **Order of work.** Recommended: V1 to V9 in series order, so each foundation exists before later
   atlases link to it. The alternative, thinnest first (V7, V8), shows the biggest change soonest.
4. **Widgets.** Recommended: inline, at the figure they belong to. The two existing animations stay
   as separate companions.

## How the work proceeds

1. **Tools.**
   - An atlas editor in `.claude/skills/srt-figure-atlas/scripts/` to insert, replace, move and delete
     figures by number, renumber and restamp, and give every figure a stable id for links.
   - Two checker additions: words split across labels, and stamps that go backwards.
2. **Fix the errors in all nine atlases.** It is a small job, and it stops wrong numbers spreading
   into new figures and into the film.
3. **Deepen one atlas at a time from its review.**
   - Read the transcript in full.
   - Build each proposal with `scripts/atlas.py`, recomputing every number in Python. The review's
     numbers are a starting point, not a source.
   - Build the widgets.
   - Re-read the atlas from the top as a newcomer.
   - Run the checker and update `atlases/index.html`.
   - Open one pull request per atlas.

## Files

- `V01_review.md` … `V09_review.md`, one per atlas, each with six sections:
  - a snapshot
  - coverage against the transcript
  - concept trees down to the floor, every node marked covered, partial, missing or taught in an
    earlier atlas
  - proposed figures in video order, with insertion points
  - problems in existing figures
  - a size estimate
- `BRIEF.md` — the brief the reviews were written to.

Paths under `/tmp/` in the reviews point to scratch scripts from the review session, which were not
kept.
