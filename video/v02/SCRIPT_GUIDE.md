# Writing a chapter script for V02

You are writing the narration and storyboard for one chapter of a narrated motion-graphic film that
teaches the V2 atlas, *Inside the GPU*, from the ground up. The film is the atlas brought to life:
every concept, every number and every caveat in your figures must be in it, explained so a
newcomer follows without pausing. Read `PLAN.md` and `CHAPTER_NOTES.md` for where your chapter sits.

The narration is spoken by a TTS voice (Kokoro `af_heart`). The visuals are animated SVG scenes that
will be built from your storyboard, so the storyboard must be concrete enough to implement without guessing.

## Output

Write `video/v02/script/<chapter>.json`, valid JSON, exactly this shape:

```json
{
  "chapter": "ch05",
  "title": "The arithmetic units",
  "kicker": "05 · The arithmetic units",
  "figs": [23, 24, 25],
  "scenes": [
    {
      "id": "ch05_s01",
      "name": "scalar cores and tensor cores",
      "figs": [23],
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
    {"claim": "132 * 4 * 1024 * 1.83e9 = 989.4 TFLOP/s", "python": "132 * 4 * 1024 * 1.83e9 / 1e12", "result": "989.42976"}
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
  printed result. Numbers quoted straight from the atlas as givens (132 multiprocessors, 3.35 TB/s)
  need no check, but anything computed from them does.

## Narration (`say`)

- **Teach from the ground up.** The listener is intelligent and has never met the subject. If a
  sentence leans on a term not yet explained in the film, explain it there, briefly, in the flow.
  Chapters before yours have taught their own figures (see `PLAN.md`); you may rely on those and
  only those.
- **Cover everything in your figures.** Every claim, every number, every worked example, every
  caveat ("illustrative", "schematic", "typical rather than measured", "vendor figure").
  Walk worked examples step by step.
- **One voice.** Never say "this figure", "the atlas", "the video says", "the presenter", "in this
  document". Speak directly: "Here is…", "Watch what happens…", "Notice…".
- **Spoken, not written.** Short sentences. Concrete before abstract. No parentheses, no lists read
  aloud, no "e.g.". Vary rhythm.
- **TTS-ready text.** The voice reads exactly what you write, so spell out anything a speech engine
  might mangle:
  - units: "terabytes per second" not "TB/s", "nanoseconds" not "ns", "gigabytes" not "GB"
  - powers: "ten to the fifteen", "two to the minus seven"
  - chips: "H one hundred", "H two hundred", "B two hundred", "V one hundred", "A one hundred"
  - acronyms said as letters with spaces: "G P U", "C P U", "H B M", "D RAM", "S RAM", "S I M T", "T M A"
  - symbols: "times", "divided by", "equals", "percent"
  - avoid em dashes for pauses; use commas and full stops.

## Storyboard (`visual`, `show`)

Write it for an animator who has not read the atlas. Be concrete:
- Name every on-screen element, roughly where it sits (left third, centre, top band), and its exact text.
- Say how it moves and what triggers it, by spoken word: "on 'nine hundred and eighty-nine', the counter runs...".
- Use colour by meaning:
  - **amber** = arithmetic, compute, operations
  - **coral** = bytes, memory traffic, data movement, DRAM
  - **teal** = what helps, a fix, a saving, latency hiding, staged tiles
  - **blue** = structure, containers, threads, warps, multiprocessors
  - white/grey for plain text.
- Match visual idiom to idea: cards, token pills, grids, bar charts, counters, equations, arrows, flows.
- End each scene with a takeaway pill band (`S.takeaway`) where appropriate.
