# Shared film components

Every file listed in `manifest.json` is loaded before each scene (after `engine.js`, before the
chapter's `<chapter>_common.js`), so these functions are always available as globals. Use them for
any element they cover: the same thing must look the same in every chapter.

Conventions shared by all of them:

- `libX(S, o = {}, parent)` builds into `parent` (default `S.main`) and returns the root `<g>` with
  named handles and geometry.
- Helpers **return** tweens or timelines; place them with `S.add(tween, at)`. They never add to the
  timeline themselves.
- Helpers keep a plan (like `fx.xform`): the first time a property is driven, its build-time value
  becomes the start. Call each element's helpers **in time order**.
- Everything is deterministic under seeking (no `Math.random`, no `Date`; seeded variety via `S.rand`).
- Colour follows the film's meaning: amber compute, coral bytes, teal helps, blue structure,
  violet negatives/secondary.
- The full doc comment (every option and default, usage example) sits above each function in its file.
  Demo scenes showing every component in its main states: `video/libdemo/scenes/demo_<family>.js`
  (render with `python3 tools/render.py libdemo stills demo_<family>`).

Do not edit these files from a scene task. If a component lacks an option you need, build the
variant inside your scene file and say so in your notes.

## Index

- **tokens** (`lib/tokens.js`): `libTokenize`, `libToken`, `libTokenStrip`, `libChatWindow`, `libBubble`, `libPromptStack`
- **hardware** (`lib/hardware.js`): `libChip`, `libChipGrid`, `libSpecSheet`, `libServer`, `libRack`, `libDataCentre`, `libDevice`
- **time** (`lib/time.js`): `libStopwatch`, `libTimeAxis`, `libTimeline`
- **memory** (`lib/memory.js`): `libMemBlock`, `libMemoryBar`, `libKVCache`, `libByteStream`
- **model** (`lib/model.js`): `libNum`, `libVector`, `libMatVec`, `libLayerStack`, `libAttention`, `libAttentionGrid`
- **charts** (`lib/charts.js`): `libRoofline`, `libScaleCompare`, `libGrowthCurve`

## tokens — `lib/tokens.js`

### `libTokenize`

```
libTokenize(text, o = {splits: {}}) -> string[]
```

Splits text into plausible LLM tokens: each word with its leading space is one token, punctuation is its own token, and words named in splits break into pieces with their capitalisation kept (e.g. {wavelengths: ['wave','lengths']}). Joining the result gives back the original text. Feeds strips and the chat window. The split is illustrative, so scenes should label it that way.

### `libToken`

```
libToken(S, o = {text:'', x, y, anchor:'middle'|'start', size:30, h, w, minW, padX, r, state:'token', mono, weight:600, id, idPos:'below'|'above'|'inline', idPrefix:'ID ', idSize, idColor, idHidden, icon, iconColor, frame, frameTone, hidden, decorative}, parent) -> <g>
```

One token chip: a rounded blue pill with an opaque base, in a colour state. States: token, new (white outline and glow), cached (teal), prefill (amber), recompute (amber outline), changed (violet), bytes, dim, ghost, slot, solid, stop, plain (for an ellipsis), plus {tone, style} or {color}. Optional token ID below, above or inline ('fox | ID 4271', which can start hidden and widen in), an icon before the text (puzzle-piece skills), and a thin packet frame (tokens on the wire). Handles: .body .skin .label .iconEl .idEl .idG .frameEl, plus geometry .x .y .w .h .l .r .t .b .cx .cy .rad.

**Helpers:** .pop .in .out .flyIn([x,y]) .moveTo([x,y]) .moveBy(dx,dy) .travel(pathD|<path>, {appear}) .setState(state) .swap(text,{state}) .pulse .glow({tone,hold}) .unglow .glowId .showId .stripe(tones) .badge(text) .textOff .textOn. Every helper returns a tween or timeline.

### `libTokenStrip`

```
libTokenStrip(S, o = {x, y, tokens:[str|{t,id,state,w,icon}], size:30, h, gap:10, padX, w, minW, maxW, lineGap, align:'start'|'middle', vertical, state, shades, mono, weight, ids, idPos, idSize, slots:0, slotW, joined, hidden, window:{n|w,label,size,tone,dashed,pad}, decorative}, parent) -> <g>
```

A row of token chips, the film's basic picture of text. One layout engine wraps chips inside maxW, centres lines, or stacks them as a column, so every structural change glides into place. Handles: .content .tokens[] .slots[] .items[] .bar .windowEl .windowLabel .lineH and the initial geometry. It also covers a sentence bar cut into tokens, dashed slots that appends fill, per-user shades of blue, IDs or position numbers, and a context-window outline.

**Helpers:** .append(t,{from|via,state}) (the row makes room just before the chip lands) .stream(list,{every}) .push(t,{keep,fallen}) (sliding window: chips that fall out drop below and grey) .fallenRow() .reveal(range|'slots') .setState(range,state,{stagger}) .highlight(n,{label,tone}) .cut() .split(i,pieces) .reorder(order) (the jumping chip hops over) .relayout({maxW,vertical,align,x,y,gap,lineGap}) .swap(i,text,{state}) .textOff/.textOn(range) .showIds .badges(range,labels) .stripe(i,tones) .pulse .glow .drop .lift .shift(n) .showWindow .solidWindow .bracket(a,b,{label,up}) (returns a bracket with .drawOn()), plus geometry .at(i) .span(a,b) .next(t)

### `libChatWindow`

```
libChatWindow(S, o = {x:300, y:130, w:1320, h:620, title:'Assistant', titleBar:true, question:'', answer:str|tokens[], splits, size:32, qSize, lineH, weight:450, relax:0.3, caret:true, composer:false, placeholder:'Message', avatar:true, tone:'struct', qy, qRight, ax, ay, aw, iconX, maxLines}, parent) -> <g>
```

A clean chat-app panel: a title bar with window dots, the user's question in a right-aligned bubble with an avatar, and the assistant's answer beside a sparkle icon. The answer streams token by token: each token flashes as a blue pill and relaxes into text. A caret that never blinks unless asked sits after the newest token at that token's live pill offset, so it stays right whatever order the helpers are called in. Long answers scroll and fade at the top of the answer area. An optional composer has a send button. Handles: .frame .titleBar .bubbleG .bubble .questionEl .avatar .sparkle .caret .composer .sendBtn .tokens[] .lines .maxLines .ax .ay .aw .lineH and the frame geometry.

**Helpers:** .drawOn .typeQuestion .send .stream({from,to|count,every,times,relax}) (tween.times[]) .pillify(a,b) (spread per line, fitted to the room left, warns on overflow) .unpillify(a,b) .glow(a,b) .dimTokens/.undimTokens(a,b) .ghosts(a,b) (never-computed tokens as dashed outlines; the caret fades) .bracket(a,b,{label}) (returns a bracket with .drawOn()) .blink({n,period}) .showCaret .hideCaret, plus geometry .span(a,b) and .find(text,nth) -> index

### `libBubble`

```
libBubble(S, o = {text:'', x:960, y:540, anchor:'middle'|'start'|'end', size:30, weight:500, tone:'neutral', side:'right'|'left'|'none', maxW, padX, lh:1.3, avatar:false|true|iconId, avatarSize, hidden}, parent) -> <g>
```

A standalone speech bubble, one outline with a tail flick at a bottom corner: a user's question beside an avatar (grey, tail right) or a reply (blue or teal, tail left). It wraps onto several lines within maxW. Used for users' questions travelling to the chip, a weather bubble, and short replies. Handles: .bg .lines[] .avatar and geometry including .tailX/.tailY.

**Helpers:** .pop() (from the tail) .type({d}) (deterministic typewriter) .shrink() (back into the tail, then fades) .glow({hold})

### `libPromptStack`

```
libPromptStack(S, o = {x:160, y:600, h:56, scale|w, segments:[{label,tokens,tone,state,icon,value,w}], gap:4, r:10, size:26, labels:'auto'|'inside'|'outside'|'none', values:true, rows:{x,y,gap:22}, total, totalPrefix, totalSuffix, totalSize, capacity, capacityLabel}, parent) -> <g>
```

The assembled prompt drawn to token scale (px per token, or fit to a width). Segments such as the provider's system prompt, tool definitions, custom instructions, a skill, the conversation and the new question are laid end to end with carved gaps. Each label goes inside if it fits, otherwise above with a short leader, fanned left and right and tiered so labels and leaders never cross. Token counts sit underneath in tiers. Segments can start as rows (label on the left, value on the right) and slide into one stacked bar, with an optional counting total and a dashed context-window outline at the same scale. Schematic widths are supported. Handles: .segs[] (.g .body .barG .inG .label .value .badge .tick .rowLabel .rowValue), .X(tokens) .scale .total .totalEl .frame .frameLabel and the bar geometry.

**Helpers:** .grow(range,{stagger}) .toStack() .count({from}) .land(i,[x,y]) .append(seg) .paint(range,state) .highlight(tokens,{label}) (its label clears outside labels) .notch(tokens,{label}) .showLabels(range) .showFrame()

#### Builder's notes (tokens)

Files: /home/user/llm_inference/video/lib/tokens.js (1,668 lines, six global functions plus one private helper object, __TOK) and /home/user/llm_inference/video/libdemo/scenes/demo_tokens.js (16 s demo). Stills and contact sheet are in /home/user/llm_inference/video/libdemo/build/stills/.

I continued from the earlier attempt's tokens.js but rebuilt most of it. The render exposed real defects: the prompt stack's rows layout drew values in the wrong place, its total counter showed from t=0 and its fills were nearly invisible; hidden strips left their slots visible; the chat caret ignored the pill spread; drawOn and typeQuestion fought over the question bubble; and there was no shared layout model, so reorder, reflow and sliding windows weren't possible.

The strip now has a single layout engine, and every structural change tweens from a planned offset to a new target. The surveyed film uses were added: ride a path to the end of the row (ch01_s05, ch08_s12); inline-ID reveal (ch07_s04); badges and stripes (ch07_s07, ch08_s04/05); shades of blue (ch03_s02, ch12_s04); a sliding context window (ch08_s05); reorder (ch03_s07); reflow to a grid or column (ch03_s09, ch08_s04); letters fading out (ch01_s04); relabel t2→XX (ch14_s03); stop and plain states; packet frames (ch04_s01); ghosted never-computed tokens (ch04_s01); speech bubbles (ch09_s03, ch17_s03); and a prompt-stack notch (ch15_s06).

Problems found and fixed during verification:
- **CSS opacity override:** GSAP's autoAlpha writes style opacity, and CSS style opacity overrides the SVG opacity attribute. So anything faded both by an fx/drawOn tween and by an attribute-driven stream (the chat sparkle) needs two nested groups. The engine works as designed; this is a pitfall worth adding to the guide.
- **One-sided fromTo:** properties set only in a fromTo's from-vars make the state depend on how a frame was reached. Every animated property is now in both from and to.
- **Backward render order:** GSAP renders a timeline's children in reverse order when seeking backward, so the caret is re-placed by proxies on both sides of the spread tweens.
- **Pop scale:** pops now start at 60% scale with the alpha eased in, so a popping label is never both visible and under the 20 px audit floor.
- **Landing collision:** an appended chip now has room made just before it lands, not after.
- **Badge overlap:** badges moved clear of short labels.

Caveats for scene builders:
- Call a component's helpers in time order; this is documented at the top of the file.
- `fx.draw` on a dashed path removes the dash.
- Draw a path that a chip rides in S.layers.back, and mark it data-audit="ignore" if a label rides over it.

Other files touched: running tools/build_icons.py (the documented workflow) re-bundled engine/icons.generated.js with the icon ids this library uses (ph:sparkle-fill, ph:user-circle-duotone, ph:puzzle-piece-duotone, ph:globe-duotone). No engine, tool, v01 or other lib file was edited. The demo was briefly swapped for a stress-test scene and then restored.

*Used in:* ch00_s01, ch00_s02, ch00_s03, ch01_s01, ch01_s02, ch01_s04, ch01_s05, ch01_s06, ch01_s08, ch02_s01, ch02_s03, ch02_s04, ch02_s06, ch03_s01, ch03_s02, ch03_s04, ch03_s06, ch03_s07, ch03_s08, ch03_s09, ch03_s10, ch04_s01, ch04_s03, ch04_s05, ch04_s06, ch04_s07, ch05_s01, ch05_s03, ch05_s04, ch06_s01, ch06_s06, ch06_s12, ch07_s03, ch07_s04, ch07_s07, ch08_s01, ch08_s03, ch08_s04, ch08_s05, ch08_s06, ch08_s07, ch08_s12, ch09_s03, ch10_s01, ch10_s02, ch10_s05, ch11_s01, ch11_s02, ch12_s01, ch12_s03, ch12_s04, ch13_s01, ch13_s02, ch13_s03, ch13_s06, ch14_s01, ch14_s02, ch14_s03, ch14_s04, ch14_s05, ch14_s06, ch15_s01, ch15_s02, ch15_s03, ch15_s04, ch15_s05, ch15_s06, ch16_s01, ch16_s02, ch16_s03, ch16_s04, ch16_s05, ch16_s06, ch16_s07, ch16_s09, ch16_s10, ch17_s01, ch17_s02, ch17_s03, ch17_s04, ch17_s05, ch18_s02, ch18_s03, ch18_s04

## hardware — `lib/hardware.js`

### `libChip`

```
libChip(S, o = {}, parent) — o: {x = 960, y = 540 (centre), size = 120, tone = 'compute', style = 'solid' | 'outline', state = 'on' | 'idle' | 'busy', hbm = 0 (1–3 = GPU package icon), cores = auto, label = null, labelPos = 'below' | 'above' | 'right' | 'inside', labelSize = auto (≥ 24), labelTone = 'ink', sub = null, labelGap = 12, seed = 7}
```

Compact stylised accelerator chip, crisp from a 20 px icon to a 300 px hero: gold pins, warm package, silicon die with a core grid (a cross channel on large dies), pin-1 dot, sheen, shadow. With hbm it becomes a small GPU package icon (amber die on a blue slab, flanked by coral HBM stacks): the icon-scale partner of S.gpu, without buses or labels. Returns root with .art .body .die .cores[] .stacks[] .labelEl .subEl .halo and anchors .cx .cy .w .h .l .r .t .b .size.

**Helpers:** .drawOn({d = 1.1}); .setState(name, {d = 0.8, spread = 0.6}), .wake(o), .sleep(o), .busy(o) (cores change state in a seeded ripple); .compute({d = 2, rate = 2.2, seed}) (seeded sparks, an independent layer); .flash({d = 0.5, to = 0.6}); .pulse({d = 0.6, scale = 1.07, tone}) (bloom, glowing outline, small swell); .rename(text, {d}); .port(side, gap) → {x, y}; .bus(i) → path d for S.flow

### `libChipGrid`

```
libChipGrid(S, o = {}, parent) — o: {x = 960, y = 540 (centre), rows = 2, cols = 8, size = 40, gap = size × 0.5, chip = {} (libChip options), labels = null, seed = 3}
```

Rows × cols of full libChips, evenly spaced from an exact extent: the dense 'thousands of chips' block, rows of chips to compare, a server's GPUs. Returns root with .chips[], .at(r, c) and anchors.

**Helpers:** .reveal({d = 0.5, stagger = 0.03, from = 'center' | 'start' | 'end' | 'random'}); .setState(name, {d = 0.6, stagger = 0.04, from}) (ripple across the grid); .compute({d = 2, rate = 1.6}) (each chip with its own seed)

### `libSpecSheet`

```
libSpecSheet(S, o = {}, parent) — o: {layout = 'sheet' | 'row', x = 640, y = 260 (top-left), w = 640 ('row': 420), h = auto, title, kicker = null, icon = 'chip' | 'doc' | icon id | null, fold = false, rows = [{label, value, unit, tone = 'struct', tag, tagTone} | null], start = 'shown' | 'placeholder' | 'empty', phLen = 'varied' | fraction, rowStyle = 'split' | 'inline', valueStyle = 'text' | 'pill', size = 28, valueSize = 30, titleSize = 40 ('row': 36), rowH = 2.3 × size, pad = 36, tone = 'neutral', note, seed = 5}
```

Chip specification card. 'sheet': a header (chip icon or printed-page document icon, the chip's name, a kicker such as 'SPEC SHEET', optional folded corner) over rows of tone accent bar, name, value and tag. Values are split automatically into a mono number and a sans unit. Rows can start as grey placeholder lines that brighten and resolve (the cold-open sheet), or empty (the H100 sheet). 'row': a compact one-line chip card, e.g. [chip] H100 · 3.35 TB/s, with muted note lines (the ch02_s05 chip column, the ch17_s04 strip). Returns root with .face .bg .titleEl .kickerEl .iconEl .noteEl and .rows[] (each with g, a holder free to S.xset / fx.xform, e.g. to lift a row out; plus body, content, ph, band, accent, labelEl, valueEl, valueG, tagEl, tagG and anchors).

**Helpers:** .reveal(i | [..] | 'all', {d = 0.55, stagger = 0.12}); .brighten(i | [..], {d = 0.4}); .focus(i | null, {dim = 0.3, d = 0.5}) (highlight one row with a tone band, dim the rest; null clears); .dimRows(sel, to = 0.3, {d}); .glow(sel, {part = 'row' | 'value' | 'tag', d = 0.8, tone, stagger}); .setValue(i, text, {d = 0.45}); .count(i, from, to, {d = 1.2, fmt, ease}); .flip({title, values: {i: text}, notes}, {d = 0.9}) (card flips over and comes back as another chip)

### `libServer`

```
libServer(S, o = {}, parent) — o: {x = 960, y = 540 (centre), w = 420, h = w × 0.235, detail = auto ('full' | 'lite' | 'min'), tone = 'neutral', on = true, badge = null ({icon, tone} disc or {text, icon, tone} pill), spinner = false, spinnerTone = 'struct', gpus = 0, gpuHbm = 1, label, sub, labelSize = 30, labelGap = 16, seed = 9}
```

Rack-mount server seen from the front: steel chassis, rack ears with screws, drive bays with lights and handles, perforated vents, a teal power light that glows steady, an amber activity light. Optional badge, role tint, a spinner on a round port for 'generating', and a drawer that slides out below the chassis with one or two rows of GPU package icons that draw in one by one (ch03_s01). Detail scales with size, from a 420 px hero to a 100 px icon. Returns root with .chassis .gpus[] .tray .fans[] .badgeEl .labelEl .subEl .leds[] .powerLed .actLed and anchors.

**Helpers:** .open({d = 0.7, stagger = 0.22, draw = true}); .close({d = 0.5}); .power(on, {d = 0.4}); .activity({d = 2, rate = 3, seed}) (seeded amber blinking, an independent layer); .glow({tone = 'helps', d = 0.5}) / .unglow({d}); .spin({d = 2, turns}) / .tick({d = 0.6}) / .halt({d}); .port(side, gap)

### `libRack`

```
libRack(S, o = {}, parent) — o: {x = 960, y = 540 (centre), w = 220, units = 8, tone = 'neutral', hero = null (index of a unit drawn as a full libServer), heroTone, badge = null, label, sub, labelSize = 28, on = true, seed = 4}
```

Rack cabinet seen from the front: frame with a vented cap, a tone strip, rails with mounting holes, feet, and a column of server units with bays, vents, power and activity lights. Tint by role (amber prefill machines, coral decode machines) for ch17_s04; badge for ch13_s05 ('KV cache'). Returns root with .units[] (each with .cx .cy .w .h .led .act), .hero, .badgeEl, .labelEl, .unitW, .unitH and anchors.

**Helpers:** .fill({d = 0.35, stagger = 0.07, from = 'bottom'}); .blink({d = 2, rate = 2.5, seed}) (includes the hero); .power(on, {d}); .highlight(i, {tone = 'helps', d = 0.4}) / .unhighlight({d}); .port(side, gap)

### `libDataCentre`

```
libDataCentre(S, o = {}, parent) — o: {x = 960, y = 540 (centre of the racks), rows = 1, racks = 8, units = 8, rackW = 120, gapX, gapY, building = rows > 1, label = 'data centre', labelSize ≈ 3% of building width (≥ 28), fans = racks ÷ 2, tone, hero = {row, rack, unit}, heroOpts = {} (libServer options), heroAt = {x, y, w} (place the hall around the scene's server), detail = auto, blinkers = 40, seed = 2}
```

Production scale: an aisle of racks (with a floor line) or a hall of rows inside a building with an interior gradient, parapet, rooftop fan units and a label. Drawn as a few batched paths, so hundreds of racks stay cheap and crisp under a camera pull-back. One unit can be a real libServer; with heroAt the whole hall is placed so that unit is the scene's own server, for ch03_s01's pull-back from one server to one unit in a rack to the whole building. A one-rack building gives the 'data-centre outline holding a server rack' (ch04_s01) and building icons (ch03_s03). Returns root with .hero, .racksG, .buildingG, .floor, .fans[], .actLeds[], .building, .labelEl, .rackBox(r, k), .unitBox(r, k, u) (targets for fx.cam), .racksBox and anchors that include the label.

**Helpers:** .blink({d = 2, rate = 2, seed}) (seeded activity lights across the hall); .spinFans({d = 2, turns, ease}); .highlightRack(row, rack, {tone = 'helps', d = 0.4}); .rackBox(r, k) / .unitBox(r, k, u) geometry

### `libDevice`

```
libDevice(S, o = {}, parent) — o: {kind = 'laptop' | 'phone', x = 960, y = 540 (centre), w = 320 laptop / 150 phone ('icon': 140 / 90), style = 'drawn' | 'icon', screen = 'chat' | 'blank', on = true, chip = false (laptop), badge = null, label, sub, labelSize = 30, labelGap = 16}
```

The user's end of a request. Laptop drawn three-quarter front: a lid with a lit screen, glass reflection and camera dot; a keyboard deck in perspective with a touchpad and front lip; optionally a small amber libChip on the deck ('one small chip, inside'). Phone: body, side buttons, camera island, home bar. Screens show a tiny decorative chat by default; .screen is a clipped group for your own content. style 'icon' uses fluent:laptop / fluent:mobile-phone (off-palette, tiny uses only). Returns root with .screen .glass .lid .deck .chip .badgeEl .labelEl .subEl and anchors.

**Helpers:** .close({d = 0.7}) / .open({d = 0.7}) (laptop lid folds down onto the deck, screen dark, then reopens); .sleep({d = 0.4}) / .wake({d = 0.4}); .ping({tone = 'struct', d = 0.6}); .port(side, gap) → {x, y} for 'left' | 'right' | 'top' | 'bottom' | 'screen'

#### Builder's notes (hardware)

Files: /home/user/llm_inference/video/lib/hardware.js and /home/user/llm_inference/video/libdemo/scenes/demo_hardware.js. hardware.js was a stub when I started, so this is a fresh build. Demo: b1 chips at every size (draw-on, idle → on → sparks, pulse, package icons, outline, a 36-chip grid rippling awake); b2 the cold-open sheet (placeholders brighten and resolve), the H100 printed sheet (rows land, focus on bandwidth, value glow, flip to H200) and three chip cards (dim, count); b3 laptop with chip pulse and lid close/reopen, a token over the network, a server whose drawer opens onto 4 GPUs with activity and spinner, badged small servers (one glowing teal) and tinted prefill/decode racks; b4 camera pull-back from one server to a 3 × 8 data-centre hall (fans, blinking, rack highlight, label landing once the camera settles). Extra variants (label inside the die, Fluent icon style, one-rack building, aisle without a building, heroAt placement, screen starting off) were checked in a temporary scene and are not in the final demo. Design decisions: (1) libChip is the small/medium chip and, with hbm, the small GPU package icon in S.gpu's colours; S.gpu stays the hero package with buses for S.flow. (2) The hand-drawn laptop and phone are the default because the Fluent emoji are off-palette (bright cyan screen, coloured app grid); style 'icon' is documented for tiny uses only. (3) Values split automatically into a mono number and a sans unit, because mono units looked gappy ('8  TB/s'). (4) Engine observation, not a bug that blocked me: GSAP renders a timeline's children in reverse order on backward seeks, so two proxy tweens writing the same state that overlap in time give direction-dependent frames. hardware.js handles this with channels (a later state helper takes over once it starts) and independent layers for effects. Other lib authors may hit the same issue; fx.xform on one element with overlapping calls is exposed in the same way. (5) For pull-backs, libDataCentre's label is sized for the zoomed-out view, so hide it until the camera settles (documented). Running render.py regenerates engine/icons.generated.js as part of the normal workflow; the new icon ids are ph:file-text-duotone, fluent:laptop and fluent:mobile-phone, plus the demo's ph:user-duotone, ph:globe-duotone and ph:globe-hemisphere-west-duotone. The demo also uses libToken from tokens.js for the travelling question pill.

*Used in:* ch00_s02, ch00_s03, ch01_s01, ch02_s01, ch02_s02, ch02_s04, ch02_s05, ch03_s01, ch03_s02, ch03_s03, ch03_s04, ch03_s07, ch03_s08, ch04_s01, ch04_s03, ch04_s05, ch04_s06, ch04_s07, ch05_s03, ch05_s04, ch05_s06, ch05_s07, ch06_s01, ch06_s03, ch06_s06, ch06_s08, ch09_s01, ch09_s02, ch09_s03, ch10_s01, ch10_s03, ch10_s06, ch11_s01, ch11_s02, ch11_s07, ch11_s08, ch12_s01, ch13_s02, ch13_s05, ch13_s11, ch15_s02, ch16_s08, ch17_s04, ch17_s05, ch18_s01, ch18_s02, ch18_s03, ch18_s04

## time — `lib/time.js`

### `libStopwatch`

```
libStopwatch(S, o = {}, parent) -> <g>   o: {x=960, y=480 (dial centre), size=240 (dial diameter; readable 120-400, icon at 48-100 with readout 'none'), tone='neutral' (hand + elapsed ring: bytes/compute/helps), span=60 (ms per turn; 60000 for seconds-scale), value=0, text=null ('?'), unit='ms'|'s'|'auto', decimals=0, approx=false, fmt, readout='below'|'right'|'inside'|'none', readoutSize, readoutW, texts=[], max=span, label='', labelSize=26, marks=[{ms,tone}], ring=true, buttons=true}
```

Analogue-plus-digital stopwatch: dark case with crown and pusher, 60 minute ticks (major every 5), a tapered sweeping hand, an elapsed ring behind it, and a mono digital readout in a plate that fits what it shows (digits get the width of the largest value counted to, so it never jitters; words get their own width and a swap glides between). Returns root with .body .face .hand .ring .readout .plate .labelEl .crown .marks[] .crossEl and geometry .cx .cy .rad .l .r .t .b .w .h.

**Helpers:** .run(fromMs, toMs, {d=1.5, ease='none', press=true}) hand sweeps, readout counts, crown clicks at start/stop, crossfades from words to digits; .set(ms, {d=0.4}) glide or snap; .reset({d}); .laps(n, lapMs, {every=0.6}) a steady beat counting 0->lapMs and resetting each time; .flicker(d, {seed, rate=20}) seeded random readout, whirling hand; .show(text, {d=0.4}) flip readout to words ('?', 'tens of ms', '= 0.03 s'); .flash({tone='bytes'}) readout and rim glow once; .cross({tone='muted', dim=0.5}) strike drawn across, watch dims; .mark(i, {tone}) recolour a target mark; .press(); .in({d=0.6}) scale-fade in about the dial centre. All return tweens/timelines; state is planned, so call in time order.

### `libTimeAxis`

```
libTimeAxis(S, o = {}, parent) -> <g>   o: {x=260, y=700 (axis line), w=1400, t0=0, t1=30, unit='ms'|'s'|'year'|word|'', log=false, ticks=auto|step|[values]|false, minor=auto|0, labels=true|'ends'|false, unitOn='last', fmt, startLabel, endLabel, side='below'|'above', size=24, line=true, tone='faint', arrow=false, caption, clip=true, rows=1, barH=48, rowGap=16, gap=16}
```

Horizontal time ruler in ms or s (linear or log decades; plain years). Mono tick labels that thin themselves (a regular pattern through 0, words at the ends kept), the last number centred on its tick with the unit hanging right. Carries to-scale labelled spans (full bars down to 1 px slivers), markers, dimension brackets, chip streams and arbitrary pins. Everything on it follows a rescale, and anything outside the window fades at the ends. Returns root with .X(t) .T(x) .rowTop(i) .rowY(i) .line .scale .labelY .under and .x .y .w .l .r. Labels can safely take fx.swap / fx.in.

**Helpers:** .span(ta, tb, {tone, style='solid'|'soft'|'outline'|'ghost', row, y, h, label (with '{v}' counting the length), labelPos='auto'|'inside'|'tip'|'right'|'left'|'above'|'below' (leader for slivers), square='left'|'right'|'both', minW=1, decimals, fmt}) -> span with .grow({d, from='left'|'right'|'center'}) (a counting label rides outside the end while the bar is narrow, then moves inside), .to(ta, tb, {d}) (widen a sliver, trim a bar), .recolor(tone); .grow(span, o); .marker(t, {label, tone, style='line'|'ghost', y1, y2, dot}) with .draw() and .moveTo(t) (playheads); .bracket(ta, tb, {label, side, style='dim'|'bracket', y}) dimension line with the label in a gap, with .draw() (opens from centre) and .to(ta, tb); .pin(t) group riding time t, with .moveTo; .stream({from, every, count | times[], y, h, w, text(s), state}) -> {chips, times, play({d | slow}), at(k)}; .rescale(t0, t1, {d=1.2, ticks, startLabel, endLabel}) zoom or slide the window with old/new ticks crossfading; .draw({d=1}) line draws on, ticks appear as it passes.

### `libTimeline`

```
libTimeline(S, o = {}, parent) -> <g>   o: {x=160, y=360, w=1600, labelW=220, laneH=64, gap=22, size=26, lanes=[{label, tone, icon, iconTone, ghost, hidden}], t0=0, t1=400, unit='ms', log, clip, axis={libTimeAxis options}|false, axisGap=22, chipH, iconSize}
```

Lanes on one shared time axis, for made vs seen, cold vs warm, TTFT/TPOT, three users' streams, ideal vs real. It reuses S.lanes for the label column and tracks (same look as any S.lanes) and extends it with icons, ghost and hidden lanes, and a libTimeAxis ruler underneath. Lane items all map through that axis, so they follow rescales. Returns root with .axis .X(t) .laneY(i) .laneCY(i) .laneH .lanes[{g,label,track,icon}] .x0 .b .axisY.

**Helpers:** .span(i, ta, tb, so) axis span filling lane i; .token(i, t, {text, state, h, w}) token chip (libToken) at time t, with .drop()/.pop(); .stream(i, {from, every, count | times[]}) -> {chips, times, play({d | slow}), at(k)}; .arrow(i, ta, j, tb, {tone, label}) chip-to-chip arrow between lanes with .draw(); .bracket(i, ta, tb, {label, side='above'|'below', tone, style}) between-chip brackets (below the last lane, it goes under the ruler labels); .marker(t, {label, tone, style, lanes}) vertical line across lanes to the axis; .band(ta, tb, {tone, label, lanes}) translucent block across lanes with .moveTo() and .grow() (stalls, sweeping highlights); .pin(i, t); .showLane(i); .rescale(t0, t1, o); .draw({d}) lanes slide in, then the ruler draws.

#### Builder's notes (time)

The earlier attempt had left only stub files (a one-line header in lib/time.js and a 'hello' demo), so the family was built from scratch.

Files: /home/user/llm_inference/video/lib/time.js (the three components plus a private _libTime helper object; no global name collisions with the other lib files) and /home/user/llm_inference/video/libdemo/scenes/demo_time.js. The demo covers:
- b1 stopwatches at 360/220/130/100 px: run, flash, flicker then laps, words then run with target marks, crossed out.
- b2 the film's 30 ms bar: 5 px sliver with an 'above' label and leader, a dimension line, then the trim to 0.14 / 29.2 ms. Also two to-scale rows with a counting '{v}' label and a 'token done' marker.
- b3 33 chips streaming onto a 0–1 s ruler that rescales to 16 s (the chips merge into a dense band), and a log axis from 0.1 ms to 100 s with three markers.
- b4 made/seen lanes with icons, streams, arrows timed to the 65 ms trip, a '30 ms' bracket, a trip bracket, a moving 'in flight' band, and a hidden ghost lane shown late.

A separate scratch run (since removed, demo restored) checked the other options:
- 'inside' readout at 400 px, a 120 px watch, seconds unit with ≈
- a years axis ('22 years')
- an extend-left rescale with 'request arrives'
- a ghost playhead moveTo
- fx.swap on a marker label
- an irregular times[] stream
- a lane with axis:false

All rendered correctly and the audit was clean.

Design decisions scene builders should know:
1. Every helper keeps a plan, like fx.xform: the first time a property is driven, its build-time value becomes the start, so grow(), draw() and play() hide things until they play. Call each element's helpers in time order.
2. Returned roots carry no layout transforms or opacity, so fx.in/out/dim and fx.swap on .labelEl are safe.
3. Spans are drawn as paths, so the audit's crosses-shape-edge check does not apply to text inside them.
4. Stopwatch hands are filled paths, so the audit's text-on-line check never sees them; with readout 'inside' the hand visibly crosses the digits near 6 o'clock, which the doc notes.
5. Default stopwatch span is 60 ms per turn, so 30 ms points straight down; use span 60000 with unit 's' for seconds-scale runs.
6. Lane chips use libToken (tokens.js loads first per the manifest) and fall back to a plain chip if it is absent.
7. S.lanes is reused unchanged: libTimeline regroups its label and track per lane to add icons, ghost and hidden lanes.

No engine bugs blocked the work. I did not edit engine.js, stage.html, the tools, other lib files or any v01 file. Other agents are modifying sibling lib and demo files concurrently, as git status shows; I touched only time.js and demo_time.js.

Contact sheet: /home/user/llm_inference/video/libdemo/build/stills/demo_time_sheet.jpg; stills: /home/user/llm_inference/video/libdemo/build/stills/demo_time/.

*Used in:* ch00_s01, ch00_s02, ch00_s03, ch01_s01, ch02_s01, ch02_s02, ch02_s03, ch03_s01, ch03_s06, ch04_s01, ch04_s03, ch04_s07, ch05_s01, ch05_s03, ch05_s04, ch05_s06, ch05_s07, ch06_s01, ch06_s06, ch06_s07, ch06_s09, ch06_s12, ch09_s01, ch11_s02, ch11_s08, ch12_s02, ch12_s03, ch15_s01, ch16_s07, ch17_s01, ch17_s02, ch17_s03, ch17_s04, ch17_s05, ch18_s01, ch18_s02, ch18_s04

## memory — `lib/memory.js`

### `libMemBlock`

```
libMemBlock(S, o = {x=760, y=480, w=400, h=110, r, gb=140, label='140 GB', fmt, sub, tone='bytes', style='solid'|'card'|'outline'|'stack', layers=6, size=34, family, shadow=true}, parent) → <g> (.bg .labelEl .subEl, anchors .x .y .w .h .l .r .t .b .cx .cy)
```

A block of bytes: the film's coral '140 GB' (weights as an amount), a memory card, a dashed 'needed' ghost, or an HBM stack (die layers, label below). It can be resized to scale with an amount. Amount labels use a mono number with a sans unit; names like 'memory' are sans. Covers ch02_s02/s03, ch03_s06, ch06_s03/s05, ch09_s01, ch10_s07/s08, ch12_s04 (140→70→35 GB) and ch13_s11. It is also the default source block of libByteStream.

**Helpers:** .resize(gb, {d=0.9, ease, axis:'x'|'y', anchor:'left'|'center'|'right'|'top'|'bottom', label: v=>text}) resizes the block to scale and counts its label; the text steps outside when the block is too small. .flash({tone='compute', d=0.5, to=0.5}) gives a brief glow. Both return tweens.

### `libMemoryBar`

```
libMemoryBar(S, o = {x=260, y=420, w=1200, h=64, capacity=80, scale, vertical=false, title, titleSize=30, capLabel, rim=true, segments:[{id, gb=0, name=id, tone='bytes', style='solid'|'soft'|'outline', dec}], free=true, overLabel='over', size=28, unit='GB'}, parent) → <g> (.track .rim .titleEl .capEl .segs{id} .freeEl .overEl .pos(gb) .point(gb) .scale .L .capacity .total())
```

A chip's memory capacity drawn to scale, horizontal or vertical (a bucket or container). Segments are laid end to end (weights 140 GB coral, KV cache soft), the free remainder is labelled, the rim marks capacity, and anything past the rim is a hatched dashed overhang ('+29 GB over') while the rim turns coral. Labels sit inside a segment when they fit and step outside otherwise, never colliding. Numbers adapt (140 / 3.3 / 0.33 GB) unless a segment's dec fixes them. Pass a shared scale to compare bars (H200 141 GB vs H100 80 GB).

**Helpers:** .in({d=0.9}) fades the bar in and sweeps the segments up from zero. .grow(id, gb, {d=1, ease}) grows or shrinks one segment; later segments ride along and labels count. .overflow({d=0.9}) flashes the overhang, pulses its label and the rim. .marker(gb, {label, tone='ink', side, size}) returns a static dashed line plus label ('140 GB needed'). .span(a, b, {label, tone='bytes', side}) returns a static hatched region ('≈ 40 GB short'). The first three return tweens or timelines; enter marker and span with fx.in.

### `libKVCache`

```
libKVCache(S, o = {x=400, y=400, layout='row'|'stack'|'grid', slots=12 (stack 8), filled=0, layers=6, perRow, cw, ch, gap, gapY, r, tone='bytes', shade=0, letters (auto), empty=true, frame=true, frameTone='neutral', pad=16, label='KV cache', labelSize=30, sub, legend=false, tokens:[...], layerLabels=true}, parent) → <g> (.cells, .cell(t,l), .pick(sel,layers), .slotCenter(i,l), .slotBox(i), .frameEl .labelEl .subEl .legendEl .tokenEls .halo .area .frame .count(), panel anchors; each cell has .slotEl .slab .base(.k .v) .kl .vl .cx .cy)
```

The key/value cache. Each token is a split K|V slab: K solid, V darker with a bright edge, 24 px letters when the slab is big enough. Layouts: a row (with perRow it becomes a pool of fixed-size blocks, as in ch16_s07); a stack growing bottom-up (ch04_s05, ch13_s04, ch18_s02); or a tokens × layers grid with layer 1 at the bottom (ch14_s06, ch13_s07/s08, an 80-layer ladder). Empty slots show as dashed outlines. State changes cross-fade whole faces while the single letter pair tweens colour, so the audit stays clean during transitions. Stale slabs go grey with a crack and a dashed edge; other users' blocks are neutral grey; teal means reused or 'yours'.

**Helpers:** All return timelines; sel = index | [i,…] | {from,to} | 'all'. .append(n=1, {d=0.45, stagger=0.12, from='down'|…|[x,y], tone, layerStagger}) fills the next n slots (grid: a token's column, layer 1 up); from [x,y] flies slabs out of a chip. .fill(sel, {…, layers}) refills evicted slots, recomputes invalid ones (the crack lifts), or adds other users' blocks with tone 'neutral'. .read({d=0.6, sel, layers, stagger, to}) makes every full slab flash at once. .reuse(n, {d=0.8, label, tint=true, rings=false}) sweeps a teal band over the first n slots and turns their slabs teal; n=0 sweeps it away; the timeline's .label is the label. .tint(sel, tone|null, {d, stagger, layers}) cross-fades slabs to another tone (teal, grey 'old t2') or back. .mark(sel, {tone='helps'|null}) outlines slots ('yours'). .invalidate(sel, {stagger=0.3, d=0.35, layers}) cracks slabs and greys them. .evict(sel='all', {stagger=0.06, d=0.4, drop=18, grey=false}) drops slabs out, with grey=true greying them first (LRU), and resets tints, cracks and rings. .clear(o) = evict('all').

### `libByteStream`

```
libByteStream(S, o = {x1=560, y1=540, x2=1360, y2=y1, width=56, tone='bytes', wall, lanes, source={libMemBlock opts; default style 'stack' 200×200 'memory' / '140 GB'}|false, sink={title='chip', w=190, h=190, size=30}|false, rate='3.35 TB/s'|null, rateSub, rateSize=36, rateSide='above'|'below'|'right'|'left', label, labelSize=28, meter=false|true|{x,y,label='bytes moved',unit='GB',size=44}}, parent) → <g> (.pipe .body .walls .source .sink(.glow .labelEl) .rateEl .rateSubEl .labelEl .meter(.num .labelEl) .start .end .mid .d .len .width)
```

Bytes moving: a thick, tube-shaded coral conduit in any straight direction, from a memory block to an amber chip die (both optional), with a mono rate label (plus an optional muted word kept as a centred pair), a side label, and an optional 'bytes moved' meter. Widths run from a narrow laptop pipe (≈12) to wide HBM (56–72+). Tone 'struct' gives a blue token wire, 'compute' an amber pipe. A pipe can pour into a vertical libMemoryBar bucket (ch06_s07). Packets show only inside the conduit, emerging from memory and sinking into the chip, and their labels fade before touching a block.

**Helpers:** .flow(from, to, {density='trickle'|'steady'|'dense' | every, speed=520, size, lanes, shape='chip', opacity, tone}) streams particles. It wraps S.flow and, like S.flow, takes time specs and schedules itself (the one documented exception); it returns the flow groups. .pass({amount=140, unit='GB', label, d=1.2, ease, count=false, countFrom=0, flash=true, slices=0, length}) returns a timeline: a '140 GB' packet (or a sliced ribbon) crosses, the chip flashes amber, and the meter counts countFrom → countFrom+amount; .packet is the packet group. .flash({d=0.45, to}) flashes the chip amber. .setRate(text, {d=0.4}) swaps the rate text, seek-safe. .countRate(to, {from=0, d=1.2, dec, unit, ease}) counts the rate label up (e.g. '≈ 96 GB/s', '3.35 TB/s'), seek-safe.

#### Builder's notes (memory)

I continued from the earlier attempt's substantial lib/memory.js (978 lines, no demo yet). I kept its API shape, which already matched the film survey, and rewrote most internals; the file is now 1217 lines. The demo shows four pages over the 16 s: bars to scale with overflow, overhang and block resize; KV row/stack/grid/pool appending; reuse, invalidate and evict with grid layers and pool LRU; and streams with a counting rate, passes with a meter, a pipe pouring into a bucket with marker and span, and a narrow laptop pipe.

Bugs fixed from the earlier attempt:
1. kv.prefix() never existed at runtime. Element.prefix is a read-only DOM accessor, so the assignment was silently dropped. It is renamed .reuse().
2. cell.slot was also a DOM property (Element.slot, a string), so GSAP received "[object SVGRectElement]" as a selector. Renamed .slotEl.
3. The "teal prefix" only ringed coral slabs. The storyboards (ch14_s06, ch15_s01) want the slabs themselves to turn teal, so reuse now tints them under a teal band.
4. Colour swaps on visible slabs were instant. They now cross-fade, with one letter pair tweening colour so the audit never sees duplicate letters.
5. Label decimals followed the target value, so 0.33 GB showed as "0 GB". They now follow the current value.
6. Empty-slot dashes showed through the K|V gap.
7. Packets and fly-in slabs crossed block edges.
8. Rate and meter text was not seek-safe.

Engine issue (no change to engine.js; worked around): fx.swap captures the "before" text at build time. A second swap on the same element therefore restores the build-time text when sought backwards. fx.count has the same flaw when one counter is counted twice: reversing the later count leaves its from-value instead of the earlier result. The library uses its own seek-safe count and swap internally, and the demo uses a local seek-safe word swap. Scene authors should use setRate/countRate and pass({count}) rather than fx.swap/fx.count on these elements.

Advice for other lib authors: never name a handle on a returned DOM group after an Element property (prefix, slot, append, title, style, id, dataset, role). Libraries load as non-strict scripts, so assignments to read-only accessors fail silently.

Other modified files under video/lib and video/libdemo (charts, hardware, tokens, time, model, icons) belong to parallel agents; I touched only lib/memory.js and libdemo/scenes/demo_memory.js.

*Used in:* ch02_s02, ch02_s03, ch02_s04, ch03_s06, ch04_s04, ch04_s05, ch04_s06, ch04_s07, ch05_s03, ch06_s02, ch06_s03, ch06_s04, ch06_s05, ch06_s07, ch06_s08, ch07_s06, ch08_s03, ch08_s07, ch08_s08, ch09_s01, ch09_s02, ch09_s03, ch10_s01, ch10_s06, ch10_s07, ch10_s08, ch11_s01, ch11_s02, ch11_s08, ch12_s01, ch12_s03, ch12_s04, ch13_s03, ch13_s04, ch13_s05, ch13_s07, ch13_s08, ch13_s10, ch13_s11, ch14_s05, ch14_s06, ch15_s01, ch15_s02, ch15_s03, ch16_s01, ch16_s07, ch16_s08, ch17_s04, ch17_s05, ch18_s02

## model — `lib/model.js`

### `libNum`

```
libNum(v, o = {}) -> string   o: dp, comma, fmt
```

Formats a number the way the film prints it: typographic minus (−0.7), no leading plus, no float noise (0.2 + −0.3 prints −0.1). Strings keep their digits ('0.0', '1.0'), with a leading '-' turned into '−'. All the components use it.

### `libVector`

```
libVector(S, o = {}, parent = S.main) -> <g>   o: x 960, y 540, anchor 'middle'|'start', values [] (number | string | null = empty dashed slot | '…' = ellipsis), n, dir 'row'|'col', style 'numbers'|'heat'|'blank', length (true length, e.g. 8192 → auto ellipsis before the last `tail` values), indices, cw, ch 60, gap, r, size 28, dp/fmt/comma, tone (string | (k, v) => tone), negTone 'violet', textColor, gain, seed, label + labelPos/labelSize/labelColor, lengthLabel (true = '8,192 numbers') + lengthPos, index (true | 'ends' | [k…]) + idxFmt, hidden
```

A vector: a row or column of number cells (blue cells, white mono numbers, violet text for negatives, typographic minus). Long vectors are truncated with an ellipsis and can carry index labels and a length bracket ('8,192 numbers'). Two-ellipsis layouts such as the one-hot vector are supported. Style 'heat' is the compact picture of a token's vector: shaded cells with no digits, blue for positive and violet for negative. Returns .cells[] (each with .v .k .i, .label and geometry), .ells[], .labelEl, .lengthEl, .idxEls[] and the box geometry.

**Helpers:** .pop({stagger, d, scale, from}) · .in({d, from, dist}) · .set(range, value|values, {d, stagger, tone}) (fills empty slots) · .flash(range, {tone 'compute', d, stagger, hold}) · .sweep({stagger}) · .paint(range, tone, {d, stagger}) · .reshade(values|{seed, gain}, {d, stagger}) (heat 'richer' cross-fade) · .cellAt(k) · .pos(i) · .clone(overrides)

### `libMatVec`

```
libMatVec(S, o = {}, parent = S.main) -> <g>   o: x, y (matrix top-left), W [[…]], rows/cols, input [...], inputAt 'top'|'left'|'none', outputAt 'right'|'none', output (values), showOut true|false|[i…], cw 104, ch 60, gap 10, r, size 26, dp/fmt, tone, products true, laneGap 66, inGap, outGap, labels {W, input, output}, wLabelBelow, labelSize, counters (true | [{label, kind:'mul'|'add'|'mac'|'ops'}]), counterAt, counterSize
```

Matrix × vector, the film's one heavy operation. Weight tiles, the input vector (along the top edge, or as a left column whose copy swings up into the top lane), and an output column of empty slots. A detailed row pass works like this: an amber frame marks the row; for each pair, a blue drop falls from x_j and the tile flashes amber; the product chip pops on the tile and drops into a lane under the matrix, with '+' signs between chips. The chips are then lifted, carried and dropped one by one into an amber running-total box, which steps through the partial sums (0, 0.2, −0.1, −0.1, 0.8, 0.5). The total flies up into the output cell, and the multiplication and addition counters tick. Fast passes flash each row's tiles left to right and hop the result into the output; parallel rows run together. inputAt/outputAt 'none' make it the film's plain weight grid.

**Helpers:** .in({d, stagger}) · .layInput({d, stagger}) · .focus(i, {dim, d}) / .unfocus() · .multiply(i, {speed, stagger, products}) · .accumulate(i, {speed, stagger}) · .emit(i, {speed, keepAcc}) · .row(i, {speed}) · .pulse(rows, {speed, parallel, stagger, drops, mark (e.g. '1'), dimAfter}) · .run({speed, detail, fast, rows, d}) (the 'run at a chosen speed' helper; d fits it to a duration) · .flashAll({stagger, d, tone}) · .flashCells(which, o) · .paint(which, tone, o) (which: 'all' | {row} | {col} | [[r, c]…]; 'neutral' = faint grey decimals) · handles .at(r, c), .cells, .rowsG, .input, .ghost, .lane, .output, .acc, .frame, .counterEls, .colCx(j), .rowCy(i)

### `libLayerStack`

```
libLayerStack(S, o = {}, parent = S.main) -> <g>   o: x, y (centre x and base y; with dir 'right', the left end and centre y), n 80, shown, hidden, view 'perspective'|'flat', dir 'up'|'right', w 380, h 560, maxPitch 72, thick, skew, depth, tone 'struct', texture, seed, numbers ([1, 40, 80] | 'ends'), numSide, label (true = '80 layers') + labelPos, detail {x, y, w, h}, slots ['attention', 'feed-forward'], slotSubs, detailTitle
```

The stack of N transformer layers. In perspective it is a tower of thin plates with a lid; each layer has its own seeded weight-grid texture and the top layers are slightly lighter for depth. Flat, it is a ladder, or with dir 'right' a segmented bar of 80 segments (ch14_s06). It can grow (4 slabs fast-forwarding to 80 and re-spacing to fit, with a counter), run a wave of light up the layers, carry a token up through them (each layer flashes amber as the token passes, in a tight band), and recolour layers (for example coral from bottom to top). It can highlight one layer with a white outline while the others darken through opaque veils, so the stack never turns see-through. It can also open a layer: the layers above lift away in an exploded view revealing that layer's textured top, and leader lines run to an inset 'layer 40' with the 'attention' slot under the 'feed-forward' slot.

**Helpers:** .build({d}) · .grow(to, {d, counter}) · .pass({tone, d, from, to, counter}) · .climb(el|null, {d, from, to, tone, flash, counter, x, enter, exit}) (null = a default heat-vector token; the timeline carries .el) · .paint(range, tone, {d, stagger}) · .highlight(L, {dim, d}) / .unhighlight() · .open(L, {d, title, dim, lift}) / .close() (handles .detail.attn/.ffn/.panel) · .shimmer({d, seed}) · .bracket({from, to, side, label, tone}) -> <g> · geometry .slabY(L), .slabX(L), .top(), .geom(), .slabs[], .numEls, .labelEl, .front

### `libAttention`

```
libAttention(S, o = {}, parent = S.main) -> <g>   o: x, y, tokens [...], query (default last), weights [...], dir 'row'|'col', causal true, self false, maskGap 56, maskLabel 'mask', size 30, gap, w, state, arcMax 230, arcScale, tone 'compute', valueTone 'struct', wfmt 'pct'|'dec'|fn, labels true, labelSize 26, bars false (barMax 110, barW, barScale), queryLabel, qkv false
```

Attention drawn on the tokens themselves, as libToken chips in a row (arcs above, labels below) or a column (arcs on the left, bars to the right, as in ch08_s04). The query's amber arcs leave the asking chip at spread-out points so they never cross, and run back to each key. The arcs thicken and brighten with the weights, which show as labels ('62%' or '.62') and optional to-scale amber bars. Blue value drops, each sized by its weight, run back along the arcs into the query, which pulses and can switch to a libToken state. Causal mode leaves room for a dashed mask wall: later tokens dim, no arc crosses the wall, and .probe draws a grey arc that stops dead at it. Optional Q/K/V badges and a self arc.

**Helpers:** .in({stagger, d}) · .ask({d, stagger}) · .weigh(weights?, {d}) (call again to re-weigh) · .blend({d, into, weights}) · .mask({d}) · .probe(j, {d}) · .pulse(i, {scale, d}) · .clear({d}) · handles .tokens[], .arcs[], .selfArc, .labels[], .bars[], .badges[], .wall, .wallLabel, .queryLabelEl, .arcTop

### `libAttentionGrid`

```
libAttentionGrid(S, o = {}, parent = S.main) -> <g>   o: x, y, anchor, tokens (or n → 'token 1'…), colLabels, cw 88, ch 64, gap 6, size 26, scores n×n, lit 'size'|'fill', showScores, rowTitle ('asks', with a magnifier icon), colTitle ('is asked', with a key icon), icons, maskLabel 'masked', maskStyle 'hatch'|'dim', seed, hidden
```

The attention score grid: a row per token asking and a column per token asked. Scores light as amber squares sized by the score (crisp, never muddy), row by row. The causal mask hatches out the upper-right triangle one diagonal band at a time, with a 'masked' plate. Alternatively, the lit triangle can build row by row in blue: prefill in one shot, decode adding a row at a time.

**Helpers:** .in({d}) · .fill({stagger, d, causal, tone}) · .lightRow(r, {upto, tone, stagger}) · .lightCausal({tone, stagger}) · .mask({d}) · .focusRow(r, {tone}) / .unfocus() · .unlight({d}) · handles .cells[r][c], .cellAt(r, c), .rowLabels, .colLabels, .maskBands, .maskLabel

#### Builder's notes (model)

Files: /home/user/llm_inference/video/lib/model.js (about 1,920 lines; it had been only a stub, so it was built from scratch) and /home/user/llm_inference/video/libdemo/scenes/demo_model.js. The demo covers: b1, vectors (8 numbers, a truncated 8,192-number vector with ends indexed, a heat strip that reshades, slots filling); b2, the ch07_s02 numbers (in 0.4, −1.2, 0.0, 0.9, 0.3 times row 1 0.5, 0.25, −0.7, 1.0, −1.0 gives products 0.2, −0.3, 0, 0.9, −0.3 and running totals 0, 0.2, −0.1, −0.1, 0.8, 0.5), then rows 2–4 in parallel with the counters reaching 20/20; b3, 4 slabs growing to 80, a token climbing, layer 40 opened; b4, causal arcs for 'it' (5/62/28/5%), the blend, the mask with a probe, and the score grid with mask. I also rendered two throwaway variant scenes (scratchpad only; the demo was restored) to check flat ladders, the 80-segment bar, top-input matrices with MAC/ops counters, '1' marks and dimming, a plain grey-decimal matrix, a one-hot vector, column attention, Q/K/V badges and the decode triangle.

Points for scene authors (all in the doc comments):
- Pass strings ('1.0', '0.0') to keep trailing digits.
- Call one component's helpers in time order.
- Don't overlap .grow and .open on the same stack.
- Leave about depth + 30 px above a perspective stack for .open's lift.
- Use products: false for matrices that only .pulse, which tightens the layout.
- On libAttention chips, pulse with at.pulse(i), not GSAP scale.

Things in flight (copies, chips, the climbing token) carry data-audit="ignore" only while they move, through a seek-safe toggle; so do masked cells once the mask is on. Pops and pulses scale about known centres through the transform attribute, with factors that compose, rather than GSAP's bbox-based transformOrigin.

Possible engine issue, not edited: a GSAP fromTo on autoAlpha, nested in timelines, can keep its end state (hidden) when the playhead jumps over it and later seeks back before it. Plain opacity reverts correctly. I reproduced this with a label crossfade and worked around it in the library with explicit progress-driven fades (M.fade). The engine's own fx.in/fx.out use autoAlpha and may show the same edge case when scrubbing; the forward-only video render is unaffected.

No commit made. git shows lib/model.js modified; demo_model.js shows no diff, so its current content matches the copy committed earlier in aacad5d.

*Used in:* ch01_s03, ch03_s10, ch06_s01, ch07_s01, ch07_s02, ch07_s03, ch07_s05, ch07_s06, ch07_s07, ch08_s01, ch08_s03, ch08_s04, ch08_s05, ch08_s06, ch08_s07, ch08_s08, ch08_s09, ch08_s11, ch08_s12, ch10_s01, ch10_s03, ch10_s04, ch10_s05, ch10_s07, ch12_s01, ch13_s02, ch13_s03, ch13_s06, ch13_s07, ch14_s01, ch14_s02, ch14_s03, ch14_s04, ch14_s05, ch14_s06, ch15_s03, ch17_s02

## charts — `lib/charts.js`

### `libRoofline`

```
libRoofline(S, o = {x=260,y=110,w=1100,h=790, xmin=10^-0.24,xmax=10^4.16,ymin=1,ymax=10^3.16, peak=989, bw=3.35, xticks,yticks,xfmt,yfmt, minor=true, grid=true, xtitle='operations per byte (log)', ytitle='trillion operations per second (log)', titleTones, titleSize=26, tickSize=24, sw=5, show={roof:true,ceilings:false,regions:false,ridge:false,peakTag:false,slopeLabel:false}, regionLabels=['memory bound','compute bound'], regionSize=30, ridgeLabel='the ridge', ridgeLabelAt=[18,104], ridgeTag=sig(peak/bw), peakTag=['peak arithmetic','989 trillion/s'], slopeLabel='bandwidth × intensity'}, parent = S.main) → <g>
```

Log-log roofline built on S.chart (xlog/ylog), with its own 24 px ticks, minor ticks and gridlines. It draws the coral bandwidth slope and the amber compute ceiling, split at the ridge so the non-roof parts can be drawn, dashed or dimmed separately. It also holds the ridge marker with its dashed drop and white '295' axis tag, gradient region tints with 'memory bound' / 'compute bound' labels, the peak tag and a slope-parallel label. Defaults reproduce the ch11/ch12 storyboard pixel geometry exactly (250 px per decade; X(1)=320, Y(1)=900; ridge 295 at (938,151); decode (1, 3.35) at (320,769); prefill ≈2,000 at (1145,151)); I verified these in Python. Any box or domain works: toy chips at 280 px per decade, or a small inset roofline. Handles: .axes .xticks[] .yticks[] .xtitle .ytitle .flatL .flatR .slopeL .slopeR .slopeHead .roof .glow .tints .regionLabels .ridgeEl(.dot .ring .drop .label .tag .tagBg) .peakTagEl .slopeLabelEl .marks; mappings X(I) Y(P) I(x) P(y) attain(I) roofY(I); .ridgeI .ridgeX .ridgeY .decX .decY.

**Helpers:** Drawing: .in({d}), .drawAxes({d}), .drawFlat({d}) (full width), .drawSlope({d, to:'ridge'|'top'}), .drawRoof({d}), .extendSlope({d}) (dashed, out of the clipped top, with an arrowhead). Emphasis: .traceRoof({d, dim}) (a white tracer runs along the lower line, the roof glows and the non-roof parts dim), .glowRoof({d, hold}), .ghostSlope({factor|dy, d, hold}) (a parallel lift that settles back). Regions and ridge: .showRegions({which, labels}), .tint(which, k), .showRidge({label, tag}) (colliding tick labels step aside), .ridgeTagTo(text) (e.g. '?' → '295', the pill resizes), .tagPeak(), .tagSlope(). Point and probe handles: .point(I, {label, tone:'auto' (coral → amber as it rounds the corner, halo too), labelSide, readout, unit, r, P}) → handle with .in({from:'drop'|'pop'}) (drop plus ripple), .moveTo(I2, {d}) (slides along the roof with the readout counting 3.35 → 33.5 → 989; a label crossing the ridge's dashed drop fades the drop under it), .guide('x'|'y', {tag}), .out(). .probe(I) → handle with .in() (dashed riser; meets both ceilings with value tags, or an arrow plus tag when off the chart) and .settle() (white dot on the lower ceiling, its tag pulses, the other dims). Annotations: .bracket(I1, I2, {y, label, style:'bracket'|'arrow'}), .span(I, P1, P2, {label}) (vertical × 2 between two roofs), .addRoof({peak, bw, sw, opacity}) (.draw()), .scatter({n, seed}) (real workloads on or under the roof, S.rand), .arrowAlong(I1, I2, {tone:'helps'}) (.draw()). Annotations have .in()/.out().

### `libScaleCompare`

```
libScaleCompare(S, o = {x=210, y=420, w=1500, max=largest, items=[{value, label, text, tone='struct', style='solid'|'outline'|'grey'|'ghost', track, px, off, fmt}], layout='rows'|'inline', h=56, gap=76, labelPos='above'|'left', labelW=320, size=28, textSize=28, hairline=1.5, edge=1990}, parent = S.main) → <g>
```

Two or more quantities drawn to one true scale when they differ enormously; the tiny one is never inflated. Sub-pixel bars render at a 1.5 px hairline and are flagged .hair; pass hairline: 0 for 'too small to draw'. Two layouts: 'rows' (140 GB vs 0.12 GB; 1,032 vs 1; 777 vs 108) and 'inline', where items[0] is the whole and parts sit from its left end (30 ms with its 0.1 ms sliver). Optional full-scale track (a 200,000-token window), a forced schematic length (px), and a bar that runs off the frame with an edge tag (off: '≈ 3,200 km →'). Annotations re-place on every render, so they follow .grow and .toLog. Handles: .rows[] {g, value, len, hair, x, y, cy, r, solid, outline, grey, base, trackEl, labelEl, textEl, offEl}, .X(v), .L(v), .whole, .tiles, .tileCounter.

**Helpers:** Bars: .in({d, stagger, from:'left'|'center'}); .grow(i, v, {d, text}) (to-scale resize; inline parts ride along; text counts with item.fmt; e.g. 5 → 7 px sliver, 1710 → 1668 trim); .restyle(i, style) (outline → grey fill); .toLog({min}) / .toLinear() (min 1 makes lengths count zeros). Annotations (with .in()/.out(), live): .tag(i, text, {side:'end'|'above'|'below'|'inside'|'center'}), .pointer(i, text, {tone, at}) (short arrow onto the sliver; swap its label with fx.swap), .dimension(i, label) (dimension line, label in a gap, draws outward), .bracket(v1, v2, {row, side, label}). Magnifier: .magnify({i, shape:'circle'|'inset', x, y, r, ring, zoom, at, window:[v0,v1], w, h, pad, barH, ruler:'1 ms', tag:'×20', content(g, M)}) → closed lens with .open() / .close(). The round lens has a ring, leader and a disc that grows out of the ring via S.xset/fx.xform. The inset has a window outline, two guide lines and a panel that grows out of the window. Contents are clipped and audit-exempt, and .M maps frame → lens so a scene can draw its own picture (e.g. the chip's working areas). Tiles: .tile({i, into, n, d, ease, counter:{x, y, size, anchor, suffix}}) → timeline: n copies stamp end to end, accelerating, with faint seams and a counter 1 → n; inline they start after the original.

### `libGrowthCurve`

```
libGrowthCurve(S, o = {x=1000, y=260, w=720, h=500, xmin=0|1, xmax=10, ymin=0|1, ymax='auto', xlog=false, ylog=false, cross=10, series=[{id:'linear', f:n=>n, tone:'helps', label:'Linear'}, {id:'quadratic', f:n=>n*n/cross, tone:'compute', label:'Quadratic'}] (each {id, f, tone, label, sw=5, dash, from, to=∞, auto=true, labelSize=30, labelPos='end'|'above'|'below'}), xticks/yticks='auto'|[v|{v,label}]|false, xfmt=num, yfmt=compact, tickSize=24, minPx=[110,54], xlabel, ylabel, ylabelGap=126, title, tag, grid=true, overTop=-40, strip=false|{h=76, label}}, parent = S.main) → <g>
```

Function curves on axes that rescale live, defaulting to the film's schematic linear (teal) vs quadratic (amber, n²/10) pair, which meet at 10 and are ×1,000 apart at 10,000. Any f works: a log-y ×80 vs ×17 decade (fixed year ticks print as '2012'), or falling cache-survival curves. The whole chart is a pure function of a planned state (domain, reveal, extension, overshoot), so seeking is exact. Ticks are live nice ticks (nested 1-5-10 steps; labels never closer than minPx, others fade). Curves are clipped exactly with bisected crossings. Labels ride the tip, de-collide, and flip above-left when they would leave the safe area or while overshooting. Handles: .axes .title .tagEl .xlabelEl .ylabelEl .stripLabel .curves{id} .labels{id}(.text) .series{id}; X(v), Y(v) at the current domain.

**Helpers:** Curves and domain: .drawAxes({d}); .draw(id, {d, to}) (progressive draw, hidden until it plays; once drawn to its end a curve stays whole through rescales); .rescale({xmax, ymax:'auto', xmin, ymin, d}) (geometric for big ratios; ticks slide and fade); .extend(id, x2) (dashed continuation past `to`); .overshoot(id) (the curve runs on, off the top of the frame). Annotations (with .in()/.out(), following the domain): .mark(x, {ids, label, side:'left'|'right'|'above', guide}) (dots, dashed guide, e.g. 'about equal'); .gap(x, idA, idB, {label, sub, side, dx, dy}) (double-headed arrow, e.g. '80 ÷ 17 ≈ 4.7×'); .tag(id, text) (line under the series label, e.g. '× 1,000'); .steps(id, {n}) (per-step f(k) − f(k−1) bars in the strip, growing with the draw and fading when squeezed).

#### Builder's notes (charts)

The charts library is finished and the demo audits clean (the last line it prints is AUDIT CLEAN). The earlier attempt had left only a one-line stub in charts.js and no demo scene, so both are new work.

Files:
- /home/user/llm_inference/video/lib/charts.js (1,656 lines): the three components plus a private helper object, _libChart (number formats, a seek-safe value tween, draw/grow helpers, live-tick generators). Every function has a doc comment covering options and defaults, return value, helpers and an example.
- /home/user/llm_inference/video/libdemo/scenes/demo_charts.js
- Stills: /home/user/llm_inference/video/libdemo/build/stills/demo_charts/ and the sheet /home/user/llm_inference/video/libdemo/build/stills/demo_charts_sheet.jpg

What the demo shows, over its 16 s:
- **Roofline (b1–b2):**
  - the axes, then the two ceilings, then the ridge with its '295' tag, then the regions
  - decode and prefill drop onto the roof, and a '× 2,000' bracket appears
  - decode slides up the slope and round the corner, turning from coral to amber, its readout counting 3.35 → 989
  - a probe at 50 settles on 168
- **Scale compare (b3):** 140 GB vs 0.12 GB as rows with a round lens, and 30 ms vs 0.1 ms inline with a dimension line, a pointer and 300 tiled copies plus a counter.
- **Growth curve (b4):** linear vs quadratic with the per-token strip, 'about equal' at 10, then a rescale to 10,000 with '× 1,000' and '× 1,000,000' tags.

I also ran two temporary test scenes (since replaced by the real demo) to check the helpers the demo doesn't show, in their storyboard contexts:
- **Roofline helpers:** the roof trace, glow, ghost slope, dashed slope extension, peak and slope tags, ridge tag '?' → '10' and deeper tint.
- **Two-roof and compact roofline cases:** the toy-chip chart with a second roof, the vertical '× 2' span and the '× 4.7' arrow, scatter, the arrow along the roof, axis guides, an off-chart probe, and the compact H100 inset.
- **Scale compare:** the inset magnifier with its '1 ms' ruler, drawing the bar from the centre, the grey fill and centred label, the ch18 trim with its dimension line following, the full-scale track, and the log morph.
- **Growth curve:** log-y with year ticks, extensions and a gap arrow, and the overshoot off the frame.

Choices a scene author should know:
- **Roofline defaults match the storyboard pixels.** Pass your own box and domain for the toy chips or a small inset roofline. For small charts, allow at least about 120 px per decade.
- **Things that start hidden:**
  - Roofline: everything except the axes and the roof itself (`show` changes this).
  - Every magnifier starts closed.
  - The tiles appear only when `.tile()` plays.
- **Visible as built otherwise:** like `fx.in`, a component's entrance helper hides its target until the helper plays.
- **Probes and region labels can collide.** A probe crosses whatever sits above the axis at its intensity, so fade region labels it would cross. The ch11_s05 probes at 10 and 1,000 would cross the default region labels, but in that storyboard those labels appear later, so it works as written.
- **Two audit exemptions:**
  - The slope's parallel label is rotated, and the audit only sees its axis-aligned box, so it is marked `data-audit="ignore"`.
  - Lens and inset contents are clipped pictures; the audit can't see clips, so they are exempt too.
- **Not built in:**
  - ch11_s04's plain-number ticks (0–6) morphing into log ticks: draw the plain axes with `S.chart` and crossfade to `R.drawAxes`.
  - ch11_s04's small step arrows ('× 10 across, × 10 up'): draw them in the scene.

Engine issues (no change made to engine.js):
1. `S.chart` draws its tick labels at 22 px, under the 24 px floor, so the roofline draws its own.
2. `fx.draw` puts `autoAlpha: 1` in its starting state, so a stroke with round caps shows as a dot at its start point before it draws. My library uses its own draw helper that stays hidden until it plays, but scenes using `fx.draw` on round-capped strokes will show this dot.
3. The audit cannot see clip paths. Content that is clipped out of view still counts as on-screen, so the library hides such content until it plays.

The file lib/manifest.json already lists charts.js, so it loads before every scene.

*Used in:* ch00_s02, ch02_s02, ch03_s09, ch03_s10, ch04_s04, ch05_s02, ch05_s06, ch06_s11, ch09_s02, ch11_s01, ch11_s03, ch11_s04, ch11_s05, ch11_s06, ch11_s07, ch11_s08, ch12_s01, ch12_s02, ch13_s03, ch13_s06, ch16_s07, ch16_s09, ch17_s02, ch17_s03, ch18_s01
