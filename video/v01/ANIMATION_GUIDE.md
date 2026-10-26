# Building scenes

You are animating one chapter of a narrated motion-graphic film. The narration and storyboard are
done: `script/<chapter>.json`. The voice is already recorded, and `build/timing.json` says exactly
when every beat (and roughly every word) is spoken. Each scene is its own file,
`scenes/<scene>.js` (e.g. `scenes/ch05_s02.js`), containing one `V.scene(...)` that animates that
scene's storyboard in sync with the voice, at a level of polish you would be proud to put on a
conference keynote screen. Builders shared by several scenes of a chapter (the same weight grid,
the same chip drawing) go in `scenes/<chapter>_common.js`, which is loaded before every scene of that
chapter; define them as plain functions taking `S` (e.g. `function ch01Tiles(S, o) {...}`).

Engine: `video/engine/engine.js` (read it — it is the reference). **The exemplar for the film is
`v01/scenes/ch01_s01.js` (with `v01/scenes/ch01_common.js`): read it before you start.** It shows the
expected density and choreography: a camera pull-back, a lifted tile with `fx.xform`, a grid shrunk
into "a picture of the file" between two panels, flows, a padlock swap, word-synced facts, a
takeaway. Smaller API examples: `video/dev/scenes/ch01_s0*.js`. Run everything from
`/home/user/llm_inference/video`.

## The loop you work in

```bash
python3 tools/build_icons.py                          # after adding icon ids
python3 tools/render.py v01 stills ch05_s02           # end + middle of every beat, and a contact sheet
python3 tools/render.py v01 stills ch05_s02 --at 12.5,14 --debug   # specific times, with a 120px grid
python3 tools/render.py v01 audit ch05                # overlapping / off-screen / tiny text, text on lines
```

Stills land in `v01/build/stills/<scene>/` and `<scene>_sheet.jpg`. **Look at them** (Read the PNG)
— the contact sheet for flow, full-size stills for detail. The audit catches what you might miss;
it must end `AUDIT CLEAN` for your chapter. Beat times are in `v01/build/timing.json`
(`scenes.<id>.beats[].start/end/words`).

## Scene contract

```js
V.scene('ch05_s02', S => {
  const { fx } = S;
  const title = S.heading('Doing the division', { y: 140 });
  S.add(fx.in(title.titleEl), 'b1');                  // at the start of beat b1
  const eq = S.equation(['10¹¹', '÷', '10¹⁵', '=', '10⁻⁴ s'], { x: 960, y: 420, size: 64 });
  S.add(fx.in(eq.parts, { stagger: 0.25 }), 'b1~divide');  // when "divide…" is spoken in b1
});
```

- One file per scene, named and registered with the scene id exactly as in the script.
- Draw everything at build time, hidden or visible, then schedule animation on `S.tl` with
  `S.add(tween, at)`. A scene must be a pure function of time: no `Math.random` (use `S.rand(seed)`),
  no `Date`, no CSS animations or transitions, no `setTimeout`.
- The engine fades the whole scene in (0.35 s) and out (last 0.5 s) and draws the chapter label.
  Do not redo those. Leave the top-left corner (x < 420, y < 110) free.

### Time specs (`at`)

| spec | meaning |
|---|---|
| `'b3'` | start of beat b3 |
| `'b3+0.4'`, `'b3-0.2'` | offset in seconds |
| `'b3>'`, `'b3>-0.5'` | end of beat b3 |
| `'b3@0.5'` | halfway through b3 |
| `'b3~seventy'` | when the word "seventy…" is spoken in b3 (first word with that prefix, ±0.2 s estimate) |
| `'b3~every time'` | the first place the consecutive words "every… time…" are spoken (use a phrase when the first word repeats) |
| `'b3~weight#2'` | the second occurrence of "weight…" in b3 |
| `'end-1.5'`, `4.2` | seconds from scene start |

Land a visual on the word it illustrates; start motion 0.1–0.3 s *before* the word
(`'b3~seventy-0.2'`) so it arrives as it is said. A missing word logs a warning and falls back to
the beat start: check the warnings printed by `stills`.

## API (all coordinates in the 1920×1080 frame; parent defaults to the main layer)

**Primitives** — `S.rect({x,y,w,h,r,fill,stroke,sw,dash,opacity,filter})`, `S.circle({x,y,r,…})`,
`S.line({x1,y1,x2,y2,stroke,sw,dash})`, `S.path({d,stroke,sw,fill})`, `S.g()`,
`S.text(str | [{t,c,w,f,s}], {x,y,size,weight,color,anchor,family:'sans'|'display'|'mono',ls,maxW,case})`
(vertically centred on y), `S.para(str,{x,y,w,size,lh})` (wrapped), `S.icon(id,{x,y,size,color})`
(centred), `S.measure(str,{size,weight,family,case})`.

**Case.** Write every string as you would say it, in lower case; the engine sets labels in Title Case
('run the whole model' → 'Run the Whole Model'), and keeps capitals, units (ms, GB/s), acronyms and
single-letter quantities as written. Text that is data rather than a label must stay as written:
tokens, example sentences, chat messages, quoted answers, code. Draw it with `case: 'keep'` (and
measure it with the same option); `libToken`, the chat window and mono text already do. A `libToken`
chip that names something ('your question') takes `case: 'label'`. Counters and typing effects are cased
like the text they write into, so a scene never capitalises a string itself. A phrase broken over lines of
the same style is still one phrase: draw `V.caseLines(['nothing else about', 'the architecture'])` with
`case: 'keep'` ('Nothing Else About' / 'the Architecture'), or use `S.para`. A second line in a smaller or
muted style is a caption of its own and starts with a capital.

**Components**
- `S.heading(title,{y,size,sub})` → `.titleEl .subEl` — scene title band (y≈130–160).
- `S.card({x,y,w,h,tone,title,sub,icon,iconSize,layout:'left'|'top'|'center',size,solid})` → `.bg .titleEl .subEl .iconEl` and `.cx .cy .l .r .t .b`.
- `S.pill(text,{x,y,h,tone,size,mono,style:'soft'|'solid'|'outline'|'ghost',anchor,w})` → `.w .l .r .cx`; `S.pills([...],{x,y,gap,align:'middle'|'start',…})` → array (+ `.g .w`). Tokens are pills.
- `S.grid({x,y,rows,cols,cw,ch,gap,tone:(r,c)=>tone,values,fmt,size})` → `{g, cells, at(r,c), w, h}`. Weight tiles, matrices, attention masks, cache blocks.
- `S.bar({x,y,w,h,frac,tone,vertical})` + `fx.grow(bar)`; `S.barChart({x,y,w,labelW,rowH,items:[{label,value,text,tone}],log,min,max})` → `.rows[{label,bar,value}]`. Draw to scale; if schematic, say so on screen.
- `S.counter({x,y,size,value,fmt,prefix,suffix,anchor,color})` + `fx.count(c, from, to, {d, fmt})`. Formats: `S.fmt.int`, `S.fmt.fixed(2)`, `S.fmt.comma(1)`, `S.fmt.pct(1)`, `S.fmt.pow10(1e15)` → `10¹⁵`, `S.fmt.sup('-4')` → `⁻⁴`.
- `S.equation([str | {t,tone,w,family,size}], {x,y,size,gap,anchor})` → `.parts[]` (each with `.l .r .cx .w`). Build term by term.
- `S.arrow({x1,y1,x2,y2,bend,color,sw,head,dash,startGap,endGap})` + `fx.drawArrow(a)`.
- `S.flow({d | path, from, to, speed, every, size, color, tone, shape:'dot'|'chip'})` — particles streaming along a path between two times. Use for rates: bytes over a bus, tokens down a wire. Speed should *mean* something.
- `S.chart({x,y,w,h,xmin,xmax,ymin,ymax,xlog,ylog,xticks,yticks,xfmt,yfmt,xlabel,ylabel})` → `.X(v) .Y(v) .plot(points,{color,sw,dash}) .axes`.
- `S.lanes({x,y,w,lanes:[{label,tone}],t0,t1,laneH,labelW})` → `.X(t) .laneY(i) .seg(i, ta, tb, {label, tone, idle})`. Timelines, TTFT/TPOT, streaming.
- `S.cycle({x,y,r,stations:[{label,icon,tone}],cardW,cardH})` + `fx.orbit(cyc,{from,to,d})`. Loops that really run.
- `S.table({x,y,cols:[{w,align,mono,color}],header,rows,rowH,size})` → `.rowEls[]`.
- `S.gpu({x,y,scale,stacks})` → `.substrate .die .dieRect .stacks[] .buses[] (each .__d for S.flow) .dieLabel .hbmLabel .hbmLabel2`.
- `S.callout(text,{x,y,from:[x,y],tone,anchor})`, `S.bracket({x1,x2,y,label,up})`, `S.halo({x,y,w,h,tone})` (highlight behind a region).
- `S.takeaway(text,{tone})` — **the** way to show a scene's takeaway / "bottom band" line: a pill band at y≈952, identical in every scene. Keep it to one short line; enter with `fx.in(t,{from:'up'})`. Leave y > 900 free for it in scenes that use one.
- `S.stat({x,y,value,fmt,unit,label,tone,size})` → `.num .unitEl .labelEl` — a headline number with unit and label; count it with `fx.count(st.num, from, to, {fmt})`. Note: the unit is placed from the *initial* value's width, so for counters that change width, start from a value of similar width or use `S.counter` + a separate label.
- Layers: `S.layers.back` (behind), `S.main`, `S.layers.front`; `S.hud` is above everything and is *not* moved by the camera.

**fx** (each returns a tween/timeline for `S.add`)
`in(els,{from:'up'|'down'|'left'|'right'|'fade'|'scale',d,dist,stagger})`, `out(els,{to,d})`,
`pop(els)`, `draw(paths)`, `drawArrow(a)`, `count(counter,from,to)`, `grow(bar)`, `type(text)`,
`pulse(els)`, `dim(els,{to})`, `undim(els)`, `move(els,{x,y,scale,d})` (offset from where it was drawn),
`recolor(els,{fill,stroke})`, `swap(text,newText)`, `strike(text)`, `orbit(cycle)`,
`cam({x,y,scale,d})` (centre the view on a point at a zoom; return with `cam({})`; it is built on
`xform`, so add camera moves in time order within the scene).

Raw GSAP is fine for anything else (`gsap.fromTo(...)`, `gsap.timeline()`), added with `S.add`.

**Moving and scaling a group: `S.xset` + `fx.xform`.** GSAP's own `scale`/`svgOrigin` on a nested
`<g>` can produce runaway matrices (a 3× tile ending up thousands of pixels off-screen). For any
group you scale, or move more than once, use the engine's explicit transform instead:

```js
S.xset(big, { x: 300, y: 200, s: 0.12 });                       // initial state (translate, then scale)
S.add(fx.xform(big, { x: 960, y: 450, s: 3 }, { d: 1.1 }), 'b2~parameter');   // animate to a new state
S.add(fx.xform(grid, { y: 70, s: 0.36, ox: 960, oy: 470 }), 'b3~Training');    // scale about (ox, oy)
S.add(fx.xform(grid, { x: 540 }), 'b4~Inference');              // later calls continue from the last state
```

The state is `{x, y, s, ox, oy}`: translate by (x, y), then scale by `s` about the point (ox, oy).
Each `fx.xform` continues from the element's last planned state, so chain them in time order. Do
not mix `fx.xform` with `fx.move`, `fx.pop` or a GSAP `x/y/scale` tween on the **same** element:
wrap the element in a `S.g()` holder and xform the holder instead (ch01_s01 does this with
`gridHolder`). A grid shrunk below readable size is a picture, not text: mark its holder
`data-audit="ignore"`.

## Art direction

**The look.** Dark, deep navy stage with a soft moving light (already there). Crisp, generous
typography (Poppins, labels in Title Case; JetBrains Mono for numbers). Opaque cards with a tinted
gradient and soft shadow.
Colour only where it means something. Calm, confident motion. Think Apple keynote meets
3Blue1Brown: every frame is clean enough to pause on.

**Colour = meaning, everywhere:** amber `compute` = arithmetic / operations (the cheap thing);
coral `bytes` = memory traffic / data movement (the expensive thing); teal `helps` = a fix, a saving,
a cache hit; blue `struct` = structure, containers, tokens, neutral data; violet only as a
secondary contrast (negative values, a second series). Text is `ink` (white) or `muted` (grey).

**Composition.**
- Use the frame. The main object of a scene should span roughly 50–80% of the width. Nothing
  important smaller than it needs to be; no postage-stamp diagrams in a sea of navy.
- One focal point at a time. When the narration moves on, dim (`fx.dim`, 0.2–0.35) what is no longer
  the subject instead of deleting it, so the viewer keeps context; bring it back if it returns.
- Keep a consistent layout inside a scene: elements stay where they were introduced; move them only
  with purpose (a move should mean something: carried, appended, compared).
- Title band at the top (y 120–170) only when it helps; many scenes are better without one.
- Safe area: keep all text inside x 96–1824, y 110–1000.
- Minimum text sizes: 26 px for labels, 30–40 for content, 48–72 for key numbers and titles.
  The audit flags anything under 20 px; treat 24 as a floor for anything a viewer must read.
- At most ~5 text items on screen besides numbers. On-screen text is labels and numbers, never a
  sentence of narration.

**Motion.**
- Entrances: `fx.in` (slide 30–40 px + fade, power3.out, 0.6–0.8 s), staggered 0.05–0.15 s for
  groups. `fx.pop` for small discrete things (tokens, dots). Draw lines and arrows on (`fx.draw`).
- Exits: quick (0.3–0.45 s), or dim instead.
- Numbers that the narration derives should **count** to their value as it is said.
- Build-ups: introduce parts one at a time, then assemble. Equations land term by term.
- Something should be moving or developing in every beat — but motion must explain: flows show
  rates, counters show growth, moves show cause. No decorative wiggles or spinning.
- A camera move (`fx.cam`) is a good way to go from overview to detail inside one shot; keep it slow
  (1.2–1.8 s, power2.inOut).
- Never let two things fight for attention in the same half-second.

**Icons.** `fluent:*` (full colour) for real-world objects: laptop, office-building, globe, books,
stopwatch, money-bag, gear, light-bulb. `ph:*-duotone` for symbols in UI style: cpu, database,
memory, hard-drives, lightning, timer, arrows, check-circle, x-circle. Find ids with
`python3 tools/build_icons.py --search <word>`, then run `build_icons.py` (no args) to bundle.

## Technical rules (these bite)

- `fx.in`/`fx.pop` use `fromTo` with `autoAlpha` and reset x/y to 0, so anything with an entrance
  is hidden until it enters. Do not call `fx.in` on an element after `fx.move` has shifted it (it
  would snap back); use `gsap.to` from then on.
- Use `fromTo` (not `from`) for anything that animates the same property more than once.
- Text that changes value: `fx.count` (numbers) or `fx.swap` (words). Do not set `textContent`
  outside the timeline.
- Text must not straddle the edge of a filled shape and must not sit on a line or curve: the audit
  checks both. Put labels inside a card, or clearly outside it with ≥ 12 px clearance; route lines
  around labels. Mark deliberate exceptions with `el.setAttribute('data-audit','ignore')`.
- `S.text(..., {maxW})` shrinks text to fit and warns: if it shrinks more than ~15%, make the box
  bigger or the words shorter.
- Many particles cost render time: keep `S.flow` to ≤ 8 simultaneous paths and `every ≥ 0.06`.
- Filters (`url(#shadow)`, `url(#glow-<tone>)`) are fine on a few elements, not on hundreds.
- Do not fill large areas with an SVG `<pattern>` under a zoomed camera: Chromium drops pattern fills
  at deep zoom-out. Draw repeated tiles as one `<path>` (ch01_s01's field: 20,000 tiles, one path).
- Do not animate `S.camera` or any scaled group with raw GSAP `x/y/scale`: use `fx.cam` / `fx.xform`.
- GSAP's `autoAlpha` writes the CSS `opacity` style, which overrides the SVG `opacity` attribute. If
  an element is faded both by an fx tween and by something that sets the attribute, nest it in two
  groups and fade one each.
- In a `fromTo`, put every animated property in both the from-vars and the to-vars; a property set
  only in from-vars makes a frame depend on whether it was reached by playing or by seeking.
- The shared components in `lib/` (see `lib/README.md`) follow these rules already; prefer them.
- The scene's duration is fixed by the narration. Plan the visual rhythm to the beats; the final
  ~0.5 s is the automatic fade out.

## Quality bar (check before you finish)

1. Every beat's storyboard (`show`) is realised, in sync with its words. Every number in the
   narration that the storyboard puts on screen is on screen and correct.
2. Contact sheet reads as a story: you can follow the argument from the stills alone.
3. Full-size stills: nothing overlaps, nothing clips, nothing is tiny, alignment is clean,
   spacing is even, colour means what it should.
4. `python3 tools/render.py v01 audit <chapter>` → `AUDIT CLEAN`, and no warnings from `stills`.
5. It looks designed, not assembled: consistent margins, a clear focal point, deliberate motion.
