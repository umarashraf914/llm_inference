# V1 motion graphic — The Memory Wall

A narrated motion-graphic film of the V1 atlas: every concept and every number, built from the
ground up, in an order where nothing is used before it is explained. 1920×1080, narrated with
Kokoro TTS (`af_heart`), rendered from HTML/SVG + GSAP scenes.

Source of truth for content: `source/atlas_v01.md` (extracted from `atlases/V01_The_Memory_Wall.html`).

## Chapters

The atlas order is kept except where it leans on an idea before teaching it. The prompt-cache
material (atlas Part 2, figs 26, 33–56) needs keys, values and layers, so it moves after the
KV-cache chapter. Fig 55 (what a hit saves) needs TTFT/TPOT, so it moves into chapter 17.

| Chapter | Title | Atlas figs |
|---|---|---|
| ch00 | Cold open: thirty milliseconds | teaser drawn from 11, 64, 67 (no figure owned) |
| ch01 | What a model is | 1–10 |
| ch02 | Thirty milliseconds, from two numbers | 11–15 |
| ch03 | Inside a production request | 16–25, 27 |
| ch04 | Streaming on the wire | 28–32, 57–60 |
| ch05 | The 30 millisecond puzzle | 61–69 |
| ch06 | Two numbers, two different physics | 70–83 |
| ch07 | From text to vectors | 84–90 |
| ch08 | Layers, attention, and the parameter count | 91–104 |
| ch09 | The weights, and what they cost to move | 105–108 |
| ch10 | Two phases with opposite profiles | 109–118 |
| ch11 | Arithmetic intensity and the roofline | 119–127 |
| ch12 | Placing the two phases | 128–130 |
| ch13 | The KV cache | 131–141 |
| ch14 | Why a key depends on its context | 37–43 |
| ch15 | The prefix rule | 33–36, 44–46 |
| ch16 | Warm, cold, and what survives | 26, 47–54, 56 |
| ch17 | What the user feels | 142–145, 55 |
| ch18 | Where that leaves us | 146–147, end card |

Every one of figs 1–147 is owned by exactly one chapter.

## Pipeline

```
script/chNN.json      narration beats + storyboard  (writers, reviewed)
      │  tools/tts.py
      ▼
build/audio/*.wav     one wav per scene; timing.json with beat start/duration
      │
scenes/chNN.js        GSAP scene code keyed to beat ids  (engine/engine.js API)
      │  tools/render.py   (headless Chromium, frame-exact seek → ffmpeg)
      ▼
build/segments/*.mp4  one silent clip per scene
      │  tools/assemble.py
      ▼
build/V01_The_Memory_Wall.mp4   + .srt subtitles + chapter markers
```

`build/` is not committed. Everything in it is regenerated from `script/` and `scenes/`.
