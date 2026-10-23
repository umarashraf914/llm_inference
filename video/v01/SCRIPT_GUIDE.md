# Writing a chapter script

You are writing the narration and storyboard for one chapter of a narrated motion-graphic film that
teaches the V1 atlas, *The Memory Wall*, from the ground up. The film is the atlas brought to life:
every concept, every number and every caveat in your figures must be in it, explained so a
newcomer follows without pausing. Read `PLAN.md` for where your chapter sits.

The narration is spoken by a TTS voice. The visuals are animated SVG scenes that other people will
build from your storyboard, so the storyboard must be concrete enough to implement without guessing.

## Output

Write `video/v01/script/<chapter>.json`, valid JSON, exactly this shape:

```json
{
  "chapter": "ch05",
  "title": "The 30 millisecond puzzle",
  "kicker": "05 · The 30 millisecond puzzle",
  "figs": [61, 62, 63, 64, 65, 66, 67, 68, 69],
  "scenes": [
    {
      "id": "ch05_s01",
      "name": "what counts as one operation",
      "figs": [61],
      "visual": "Whole-scene storyboard: layout, what persists, the idea the motion makes visible.",
      "beats": [
        {
          "id": "b1",
          "say": "Spoken narration for this beat.",
          "show": "What is on screen during this beat and how it moves, tied to spoken words."
        }
      ]
    }
  ],
  "checks": [
    {"claim": "140 GB / 4.8 TB/s = 29.2 ms", "python": "140e9/4.8e12*1e3", "result": "29.1667"}
  ]
}
```

- Scene ids are `<chapter>_s01`, `_s02`, … Beat ids restart at `b1` in every scene.
- A scene is one continuous shot (no cut inside it). Start a new scene when the composition
  changes completely. Typical scene: 3–8 beats, 30–120 seconds.
- A beat is one idea: 1–3 sentences, roughly 12–45 words. Beats are the sync points the animation
  is keyed to, so put a beat boundary wherever the picture should change.
- `figs` on the chapter must list every figure you own; each scene lists the figures it covers.
  Every owned figure must appear in at least one scene.
- `checks`: every number that appears in narration or on screen and is derived (a division, a
  product, a percentage, a conversion) gets a check you actually ran with `python3 -c`. Copy the
  printed result. Numbers quoted straight from the atlas as givens (70 billion, 3.35 TB/s) need no
  check, but anything computed from them does.

## Narration (`say`)

- **Teach from the ground up.** The listener is intelligent and has never met the subject. If a
  sentence leans on a term not yet explained in the film, explain it there, briefly, in the flow.
  Chapters before yours have taught their own figures (see `PLAN.md`); you may rely on those and
  only those. If you need something from a later chapter, give the minimum plain-language version
  and say it will come back later.
- **Cover everything in your figures.** Every claim, every number, every worked example, every
  caveat ("illustrative", "schematic", "typical rather than measured", "vendor figure",
  "intuition, not measurement"). The figure captions carry the takeaway — make sure each one
  lands, usually as the last line of a scene. Where the atlas gives a worked example (softmax on
  four scores, 5 + 6 + 6 = 17, 2 × 80 × 8 × 128 × 2), walk it number by number. You may add
  explanation or examples where a newcomer would stumble; do not drop anything.
- **One voice.** Never say "this figure", "the atlas", "the video says", "the presenter", "in this
  document". Speak directly: "Here is…", "Watch what happens…", "Notice…". Earlier chapters can be
  referred to as "earlier" or "a few minutes ago".
- **Spoken, not written.** Short sentences. Concrete before abstract. No parentheses, no lists read
  aloud, no "e.g.". Vary rhythm. A little warmth and the occasional rhetorical question are good;
  hype is not.
- **TTS-ready text.** The voice reads exactly what you write, so spell out anything a speech engine
  might mangle:
  - units: "terabytes per second" not "TB/s", "milliseconds" not "ms", "gigabytes" not "GB"
  - powers: "ten to the fifteen", "ten to the minus four"
  - chips: "H one hundred", "H two hundred", "B two hundred"; "Llama three seventy B"
  - acronyms said as letters with spaces: "G P U", "H B M", "K V cache", "T T F T", "F P sixteen",
    "INT eight" → "eight-bit integers"; FLOP → "flop", FLOPS → "flops"
  - symbols: "W K" or "the key matrix" for W_K; "times", "divided by", "equals", "percent"
  - decimals and big numbers as words if ambiguous: "three point three five", "seventy billion",
    "a hundred and forty gigabytes", "one thousand and thirty-two tokens"
  - avoid em dashes for pauses; use commas and full stops.
- Pace: about 150 words per minute. Do not pad, and do not rush a hard idea. A dense figure may
  need three beats; a light one may share a beat.

## Storyboard (`visual`, `show`)

Write it for an animator who has not read the atlas. Be concrete.

- Name every on-screen element, roughly where it sits (left third, centre, top band), and its exact
  text. On-screen text is short: labels, numbers, a key phrase. Never put a narration sentence on
  screen. At most ~8 words per line, at most ~5 text items visible at once besides numbers.
- Say how it moves and what triggers it, by spoken word: "on 'seventy billion', the counter runs
  from 40 to 70,000,000,000", "as she says 'append', the token slides into the row".
- Use colour by meaning, consistently across the whole film:
  - **amber** = arithmetic, compute, operations (the cheap thing)
  - **coral** = bytes, memory traffic, data movement (the expensive thing)
  - **teal** = what helps, a fix, a saving, a cache hit
  - **blue** = structure, containers, tokens, neutral data
  - white/grey for plain text.
- Match the visual idiom to the idea (do not default to boxes and arrows):
  | idea | idiom |
  |---|---|
  | structure, containment | nested panels |
  | proportion, cost, waste | bars drawn to scale (say if schematic) |
  | huge ranges (10^3 … 10^15, 1 … 2,000) | log-scale bars or axis, explained first |
  | time, overlap, waiting | timelines / lanes left to right |
  | position, masking, prefix | rows of token pills, grids coloured by state |
  | lookup | a table with a pointer sliding to one row |
  | a formula | built term by term, each term labelled as it lands |
  | a rate | something flowing along a pipe, with a counter |
  | a count growing | counter + growing stack |
  | repetition / loop | the loop drawn as a cycle that actually runs |
- Available building blocks (the animator has these ready): cards with an icon and label, token
  pills, weight tiles and matrix grids, bars and counters, arrows that draw on, particles flowing
  along a path, number lines and log axes, an XY chart with a roofline, an equation that builds term
  by term, a GPU package illustration (compute die + HBM stacks + bus), server / data-centre /
  laptop / globe / user icons, timelines and lanes, a camera that can pan and zoom within a scene.
  Icons come from open-source sets (Phosphor, Lucide, Tabler, Fluent Emoji Flat): name the
  object you want ("a laptop icon", "a stopwatch"), not a file.
- Motion should explain, not decorate: build-ups that assemble a whole from parts, counters that
  run to the spoken number, flows whose speed shows a rate, before/after states that morph.
- Keep continuity inside a scene: elements introduced early stay where they are and are reused,
  dimmed, or moved, rather than everything clearing every beat.

## Numbers

Run every derived number in Python before writing it. If the atlas and your arithmetic disagree,
use the correct value and say so in a `checks` entry. Keep the atlas's own caveats about which
numbers are illustrative. Do not round in a way that hides a discrepancy.
