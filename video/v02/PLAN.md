# V2 motion graphic — Inside the GPU

A narrated motion-graphic film of the V2 atlas: every concept and every number, built from the
ground up, in an order where nothing is used before it is explained. 1920×1080, narrated with
Kokoro TTS (`af_heart`), rendered from HTML/SVG + GSAP scenes.

Source of truth for content: `source/atlas_v02.md` (extracted from `atlases/V02_Inside_the_GPU.html`).

## Chapters

The atlas order is kept except where it leans on an idea before teaching it:
- The cold open (`ch00`) hooks the viewer on the central puzzle: 989 trillion operations a second on the package, yet the chip spends over 99% of its time waiting for numbers to arrive across 5,120 wires.
- The 15 parts of the atlas divide cleanly into 21 numbered chapters (`ch01` to `ch21`), so that each chapter covers 3 to 11 tightly focused figures and runs roughly 2 to 5 minutes.
- Matrix multiplication ("row meets column") is introduced simply in `ch06` (for scratchpad tiling) and then explored in full depth in `ch17` (tensor cores and systolic arrays).

| Chapter | Title | Atlas figs |
|---|---|---|
| ch00 | Cold open: a thousand trillion, waiting | teaser drawn from 1, 4, 10, 20 (no figure owned) |
| ch01 | What a chip physically is | 1–3 |
| ch02 | Two numbers and the words around them | 4–9 |
| ch03 | Almost three hundred | 10–14 |
| ch04 | Two design philosophies | 15–22 |
| ch05 | The arithmetic units | 23–25 |
| ch06 | Registers, scratchpads and tiles | 26–32 |
| ch07 | Schedulers, the copy engine, four quarters | 33–37 |
| ch08 | Warps and kernels | 38–43 |
| ch09 | Filling a multiprocessor | 44–48 |
| ch10 | The first sin: divergence | 49–52 |
| ch11 | Why memory is slow in the first place | 53–56 |
| ch12 | The memory ladder | 57–62 |
| ch13 | How the chip survives slow memory | 63–69 |
| ch14 | Coalescing: the second sin | 70–75 |
| ch15 | The memory wall | 76–83 |
| ch16 | The ridge | 84–87 |
| ch17 | The tensor core | 88–94 |
| ch18 | Precision and the square law | 95–98 |
| ch19 | Inside a floating-point number | 99–107 |
| ch20 | When one chip is not enough | 108–118 |
| ch21 | Other bets, and the three answers | 119–123 |

Every one of figs 1–123 is owned by exactly one chapter.

## Pipeline

```
script/chNN.json      narration beats + storyboard (writers, reviewed)
      │  tools/tts.py
      ▼
build/audio/*.wav     one wav per scene; timing.json with beat start/duration
      │
scenes/chNN.js        GSAP scene code keyed to beat ids (engine/engine.js API)
      │  tools/render.py (headless Chromium, frame-exact seek → ffmpeg)
      ▼
build/segments/*.mp4  one silent clip per scene
      │  tools/assemble.py
      ▼
build/V02_Inside_the_GPU.mp4 + .srt subtitles + chapter markers
```

`build/` is not committed. Everything in it is regenerated from `script/` and `scenes/`.
