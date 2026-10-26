# V02 — Inside the GPU: depth review

Reviewed: `atlases/V02_Inside_the_GPU.html` (100 figures, 15 parts), against the full outline, the
~20 s transcript, the raw SRT (windows at 0:30, 5:59, 7:40, 15:08), V01's outline (for prerequisites)
and V03/V04's outlines (for terms V02 uses before those atlases define them). Eight figures were
rendered and inspected (24, 36, 38, 41, 44, 57, 79, 98); bar geometry was read from the SVG for
Figs 10, 19, 28, 51, 54, 63, 66, 69, 76, 77, 84, 85, 88, 95. Every number below was recomputed in
Python (scripts: `scratchpad/verify_v02*.py`); spec values that need a source are marked VERIFY.

---

## 1. Snapshot

- **100 figures, 15 parts**: The question (1–13) · Why memory is slow (14–20) · Two design
  philosophies (21–26) · Building one multiprocessor (27–36) · Threads, warps and the chip (37–44) ·
  The two cardinal sins (45–49) · The memory ladder (50–54) · How the chip survives slow memory
  (55–60) · Coalescing (61–66) · The memory wall (67–72) · The ridge (73–77) · The tensor core
  (78–82) · Precision (83–90) · When one chip is not enough (91–97) · Other bets (98–100).
- **Keep these:**
  1. **The divergence build, Figs 45–49.** Branch → two masked passes → the active mask as one bit
     per lane → nesting gives 2, 4, 8 passes → "both sins have the same cause". It goes all the way
     down to bits and powers of two, and Fig 49 turns two named sins into one idea.
  2. **Physical grounding of the hierarchy (Figs 15–18).** Capacitor leakage, 6T against 1T1C,
     destructive reads, the empty fast-and-large corner. Few treatments give "memory is slow" a
     physical cause. It needs moving and two fixes (§2, §5), but the content should stay.
  3. **Little's law with real numbers (Fig 43).** 3.35 TB/s × 400 ns = 1.34 MB in flight, so
     10,152 B per SM. This is the right quantitative idea. Only the claim about *why* 2,048 is
     wrong (§5).
  4. **Coalescing grounded in layout (Figs 64–65)** and the **H200 natural experiment (Fig 71)**.
     Row-major storage and stride make "where the data sits" concrete. The Fig 69 table's ratios
     all check out (125/0.9 = 139, 312/2.0 = 156, 989/3.35 = 295, 2250/8 = 281; growth 18× vs 8.9×).
     Fig 01's die arithmetic checks out too (√814 = 28.5 mm; 80e9/814 = 98 M/mm²).

---

## 2. Coverage against the transcript

### 2a. Stretches covered thinly or skipped

| Video | What is said there | Atlas now |
|---|---|---|
| 0:36–0:43 | "Decode wasn't compute bound. It was memory bound by a factor of almost 300." | Fig 04 gives the 1%/99% split but never the factor 300. No pointer back to V01 Figs 126/129. |
| 2:07–2:17 | "Nvidia's H100 … is built on Hopper, its 2022 architecture" | Architecture names and product names (Hopper/H100/H200, Blackwell/B200/GB200, DGX, NVL72) are never decoded, yet Figs 67–71, 85, 95, 97 use all of them. |
| 3:30–3:51 | "close to a thousand trillion operations a second, comes almost entirely from those four tensor cores" | Fig 28 restates the sentence. Its bars are 26 px and 390 px (≈15×), drawn but unlabelled, and nothing derives 989. |
| 3:51–4:12 | register file "partitioned across every thread" | No arithmetic: 65,536 registers ÷ 2,048 threads = 32 each is absent. |
| 4:12–4:35 | "cooperating threads stage the data they share" | Staging is named, not shown. "Tiling" is used in Fig 31's caption and Fig 98 and never defined. |
| 4:35–4:58 | TMA streams blocks "so threads never spend their own instructions on the transfer" | Fig 35 is three labelled boxes. |
| 5:18–5:38 | "each on its own data" | Fig 38's data row is empty dashed boxes. How a lane knows which data is its own (the thread index) is missing, and so is the word kernel (used from Fig 28 on). |
| 5:49–5:59 | "Fetching and decoding an instruction costs real silicon and energy" | Fetch and decode are never shown. Fig 40 is red-against-gold bars. |
| 8:04–8:45 | per-rung figures, then "roughly a hundredfold drop in bandwidth and a thousandfold jump in latency" | No per-rung bandwidth or latency numbers. Fig 54 is mis-drawn (§5). Nothing totals the chip-wide on-chip memory. |
| 11:43–12:15 | compute climbed faster "largely because each generation added a lower precision math format" | Fig 69 compares 16-bit peaks only, so the mechanism the video names cannot be seen. |
| 12:15–12:56 | H200 upgrade "is a genuine speedup" | Fig 71 gives no number (it is 4.8/3.35 = 1.43×). |
| 14:04–14:48 | MMA "multiplies two small matrices and adds a third, producing a whole tile" | Fig 79 is four empty boxes (A, B, C, D). Matrix × matrix is never worked, and V01 only builds matrix × vector (V01 Fig 85). |
| 15:53–16:13 | "Each halving of the bits roughly doubles the throughput" | Fig 84 gives three conflicting mechanisms (§5). |
| 16:13–16:56 | exponent/mantissa, BF16, "accumulate back in FP32, so errors don't pile up" | No worked decode, no bias, no range/precision numbers, and no demonstration that errors pile up. |
| 17:13–17:37 | "hundreds of gigabytes … split across many GPUs" | No worked model-size example. |
| 17:37–18:02 | "a crossbar called NV switch that lets every GPU reach every other" | Named only. |
| 18:02–18:23 | "InfiniBand at a few hundred gigabits a second, roughly an order of magnitude slower per byte" | Gigabits are never converted to bytes, and per-direction NVLink is never stated. |
| 18:16–18:23 | tensor parallelism "splits each layer's matrix multiply … exchange results at every layer" | Asserted, not shown. |
| 19:05–19:27 | systolic array, "data flows through rhythmically"; "rentable for now only on Google Cloud" | Fig 98 is a static grid with no flow. The presenter's Google Cloud caveat is dropped. |
| 20:08–20:26 | close; the software is next | No closing figure answers Fig 11's three questions. |

### 2b. Stamps that go backwards or sit in the wrong place

Four backward jumps. None is a slip, but each breaks SKILL.md's "follow the video's order" and the
atlas's own footer ("Figures follow the video's order").

| Where | Jump | Diagnosis | Fix |
|---|---|---|---|
| Fig 13 → 14 | 1:16 → **0:20** (Figs 14–20 at 0:20/0:24) | Deliberate thematic block, anchored on "waiting for the model's weights to arrive from memory" (0:27–0:33). But the video's own "The reason is physical" comes at **7:39–7:44**, and "cache" is first said at **4:12**. | Move Fig 14 to 4:12 (before Fig 31). Move Fig 19 (energy) to **0:58**, right after Fig 11, where the video asks "Why does moving a byte across it cost so much more than doing arithmetic on one?". Move Figs 15–18 and 20 to **7:39–7:46**, before Fig 50, and merge Fig 18 with Fig 50 (§5). Minimal alternative: move all of Part 2 to directly after Fig 11 and restamp it 0:58. |
| Fig 35 → 36 | 4:35 → **3:00** | "Assembled" recap stamped at the start of the stretch it sums up. | Restamp 4:35. |
| Fig 40 → 41 | 5:45 → **4:27** | Callback to the schedulers. The video joins schedulers to warps at **6:10**: "The SM's four schedulers work at this same granularity, each issuing one ready warp per cycle". | Restamp 6:10, or fold into proposal 9. |
| Fig 43 → 44 | 6:15 → **2:17** | Recap. Its caption even says "between 2:17 and 6:20". | Restamp 6:20. |

Minor: Fig 81 (14:46) uses the 528 count (15:01) and the caveat (15:10), so restamp it 15:01. Fig 82
(14:46) is the caveat itself, so restamp it 15:10. After the moves, update the part cross-references
in Fig 11 prose, Fig 30 caption ("Part 8"), Fig 51 caption ("Part 2"), Fig 57 caption ("Part 5"),
Fig 72 caption ("Part 14") and Fig 94 caption ("Part 1").

---

## 3. Concept trees

```
1. "Decode is memory bound by a factor of almost 300" (0:36)          [PARTIAL Fig 04 — 1%/99%, no 300]
  operation, FLOP; count against rate                                  [TAUGHT IN V01 Fig 61, 63-66] (re-taught in Fig 05)
    division; units cancel                                             floor
  byte; 2 bytes per weight                                             [TAUGHT IN V01 Fig 72-73]
  time = bytes / bandwidth = 41.8 ms; time = ops / rate = 0.142 ms     [TAUGHT IN V01 Fig 14, 64-65]
  the same 295 as ridge / intensity 1                                  [TAUGHT IN V01 Fig 116, 126, 129] — no pointer here → [MISSING] (prop. 1)

2. What a chip is                                                      [COVERED Fig 01-02]
  die area, transistor count, density                                  [COVERED Fig 01]
    area, division, scientific notation                                floor
  transistor as a switch                                               [COVERED Fig 02]
  switches → arithmetic ("a circuit that adds")                        [PARTIAL Fig 02 — asserted] (AND gate per bit: prop. 27)

3. Time and rate at chip scale
  clock tick                                                           [COVERED Fig 03]
    period = 1 / frequency; H100 ≈ 1.83 GHz → 0.55 ns                  [PARTIAL Fig 03 — "under a nanosecond", no H100 clock]
    "hundreds of cycles" ↔ ns (400 ns ≈ 730 ticks)                     [MISSING] (fix Fig 10)
  ns / ms scales                                                       [COVERED Fig 10 — ratio prose wrong]
  throughput                                                           [COVERED Fig 06; TAUGHT IN V01 Fig 142]
  latency vs bandwidth                                                 [TAUGHT IN V01 Fig 76] (Fig 09 repeats it nearly verbatim)

4. The bet: same few operations over billions of numbers                [COVERED Fig 12]
  independent vs dependent work                                        [COVERED Fig 13; TAUGHT IN V01 Fig 70, 110]
  matrix × vector as many multiply-adds                                [TAUGHT IN V01 Fig 85]
  matrix × matrix (every row meets every column)                       [PARTIAL Fig 77 — one sentence] (prop. 23)
  >90% of transformer arithmetic is matmul                             [COVERED Fig 80-81]

5. CPU vs GPU silicon trade
  CPU spends silicon on anticipation                                   [PARTIAL Fig 21-22 — named, schematic]
    branch prediction: guess, run ahead, discard if wrong              [MISSING] (prop. 3)
    prefetching: spot the address pattern, fetch early                 [MISSING] (prop. 3)
    "a few tens of fast threads"                                       [COVERED Fig 22]
  GPU: 132 units × 2,048 threads = 270,336                             [COVERED Fig 23-24, 44]
    "not one of them is fast on its own"                               [PARTIAL Fig 23, 25 — no rate] (prop. 13)
      4 schedulers × 32 lanes shared by 2,048 threads → 1 per 16 ticks  fractions, floor
    slow threads win on one op over a billion elements                 [PARTIAL Fig 25 — "orders of magnitude", unquantified]
    where the bet loses: chains                                        [COVERED Fig 26 — misapplied to decode, §5]
  names: architecture vs product vs box                                [MISSING] (prop. 4)

6. The streaming multiprocessor
  one design stamped 132 times                                         [COVERED Fig 24]
  CUDA core: one multiply-add per tick                                 [COVERED Fig 27]; MAC = 2 ops [TAUGHT IN V01 Fig 111]
  four schedulers pick a ready warp                                    [COVERED Fig 33-34]
    each picks among its own 16 warps, not 64                          [PARTIAL Fig 34 — says 64]
  four quarters: scheduler + 32 lanes + 1 tensor core + 64 KB regs     [PARTIAL Fig 36 (six peers), Fig 41] (prop. 9)
  TMA: told a tile shape, generates the addresses itself               [PARTIAL Fig 35 — what, not how] (prop. 8)

7. Peak throughput, 989 TFLOP/s
  "almost entirely from the tensor cores"                              [PARTIAL Fig 28 — bars unlabelled]
  rate = units × work per tick × ticks per second                      [MISSING] (prop. 5)
    132 × 4 × 1,024 × 1.83e9 = 989.4e12                                multiplication, floor
    132 × 128 × 2 × 1.98e9 = 66.9e12 (CUDA cores)                      multiplication, floor
  per SM per tick 4,096 vs 256 → 16×                                   [MISSING] (prop. 5)
  dense vs "with sparsity" (1,979)                                     [MISSING] (prop. 5)
  peak vs sustained, 50-80%                                            [COVERED Fig 81-82]

8. Registers
  register: the only memory the arithmetic touches                     [COVERED Fig 29]
  256 KB, single tick                                                  [COVERED Fig 30]
    = 65,536 registers of 4 bytes                                      [MISSING] (prop. 6); bytes [TAUGHT IN V01 Fig 73]
    32 per thread at 2,048 threads; 64 → 1,024 threads; 128 → 512      [MISSING] (prop. 6)
  free switching because slices stay put                               [COVERED Fig 58-59 (twice)]

9. On-chip SRAM: cache vs shared memory
  cache: small fast copy, pays only on reuse                           [COVERED Fig 14]; general idea [TAUGHT IN V01 Fig 135]
    the hardware decides what is kept                                  [PARTIAL Fig 32]
  shared memory: scratchpad the program fills                          [COVERED Fig 31-32]
    staging a tile: fetch once, many threads read                      [MISSING] (prop. 7)
      saving = tile width                                              ratio, floor
    "tiling" (used in Figs 31, 98)                                     [MISSING; V03 builds it later]
  scope: who can see a level                                           [COVERED Fig 52-53]
    thread block = the scope of shared memory                          [MISSING — used in Figs 53, 60; V03 Fig 04 later] (prop. 11)

10. Warps and SIMT
  warp = 32 threads, the unit scheduled                                [COVERED Fig 37]
  kernel: one program, written for one thread, launched over many      [MISSING — used from Fig 28; V01 Fig 17 names it; V03 Fig 04 defines it] (prop. 10)
    thread index → element (i = block × size + thread)                 [MISSING] (prop. 10)
      linear function                                                  floor
    grid → block → warp → thread                                       [MISSING block level; Fig 44 skips it] (prop. 11)
  one instruction, 32 lanes, own data                                  [COVERED Fig 38-39 — data row empty]
    instruction = a number; fetch, decode, issue                       [MISSING] (prop. 12)
    overhead 1 per op vs 1 per 32 ops                                  [COVERED Fig 40]
  why 32 = 128 lanes / 4 schedulers                                    [COVERED Fig 41 — H100-only, overclaimed §5]
  64 warps × 32 = 2,048; occupancy = resident / 64                     [PARTIAL Fig 42 — occupancy misdefined]

11. Warp divergence                                                    [COVERED Fig 45-49]
  branch                                                               [COVERED Fig 45]
  two passes, lanes masked                                             [COVERED Fig 46]
  active mask, one bit per lane                                        [COVERED Fig 48]; bits [TAUGHT IN V01 Fig 72]
  nesting: 2, 4, 8 passes                                              [COVERED Fig 47-48 (twice)]; powers of two floor

12. Why memory is slow (physics)
  capacitor holds charge and leaks                                     [COVERED Fig 15 — refresh rate wrong]
  SRAM 6T vs DRAM 1T1C, density vs speed                               [COVERED Fig 16]
  destructive read and restore                                         [COVERED Fig 17]
  refresh: every row every 32-64 ms                                    [PARTIAL Fig 15-16 — "thousands of times a second"]
  where a GPU load's hundreds of ns go                                 [PARTIAL Fig 20 — attributed to the cell, §5]
  energy: DRAM read ≈ 711× an FP add                                   [COVERED Fig 19 — label, source]
  nothing is both fast and large → a ladder                            [COVERED Fig 18, 50 (duplicated)]
  memory is a separate chip; HBM stacked beside                        [TAUGHT IN V01 Fig 79, 105, 107]

13. The memory ladder
  four rungs                                                           [COVERED Fig 51-52]
    capacity on a log axis                                             [COVERED Fig 51 — mixes per-SM and chip-wide]; log axes [TAUGHT IN V01 Fig 121]
    chip-wide total ≈ 119 MB vs a 140 GB model                         [MISSING] (prop. 16)
    latency per rung in ticks                                          [PARTIAL Fig 51 — words, partly understated] (prop. 15)
    bandwidth per rung (shared ≈ 31 TB/s vs HBM 3.35)                  [MISSING] (prop. 15)
  "100× less bandwidth, 1000× more latency"                            [PARTIAL Fig 54 — mis-drawn]
  L2: shared, last level on the die                                    [COVERED Fig 52-53]
    holds 1/2,800 of a 70B model's weights, so no help to decode       [MISSING] (prop. 16)
  HBM 3.35 TB/s = 5 stacks × 1,024 wires × 5.23 Gb/s                   [MISSING] (prop. 2); width × rate [TAUGHT IN V01 Fig 74]

14. Latency hiding
  a stall is hundreds of ticks                                         [COVERED Fig 56]
  hide the wait, do not avoid it                                       [COVERED Fig 55 — last line misapplied, §5]
  warps take turns                                                     [COVERED Fig 57]
    warps needed per scheduler = (work + wait) / work                  [MISSING] (prop. 17, widget)
  switching is free                                                    [COVERED Fig 58-59]
  bytes in flight = bandwidth × latency                                [PARTIAL Fig 43 — formula; causal overclaim]
    rate × time = amount                                               [TAUGHT IN V01 Fig 75]
    everyday version (drivers on the road)                             [MISSING] (prop. 14)
  occupancy limits: registers, shared memory, 64 warps, blocks         [PARTIAL Fig 60 — stated] (props. 6, 18)

15. Coalescing
  memory moves in fixed pieces                                         [COVERED Fig 61-62 — wrong granularity]
    a 128-byte line is four 32-byte sectors                            [MISSING / stated wrongly] (prop. 19)
  32 lanes × 4 bytes = 128 bytes                                       [COVERED Fig 63]
  share of fetched bytes used                                          [PARTIAL Fig 63 — 3% should be 12.5%]
  row-major storage                                                    [COVERED Fig 64]
    address = (row × width + col) × 4                                  [MISSING] (fix Fig 64)
  stride                                                               [COVERED Fig 65 — max-waste stride wrong]
    stride → sectors touched 4, 8, 16, 32                              [MISSING] (prop. 20, widget)
  why neighbouring lanes ask for neighbouring addresses                [MISSING] (prop. 10)

16. The memory wall across generations
  a generation                                                         [COVERED Fig 67]
  compute outgrows bandwidth                                           [COVERED Fig 68; TAUGHT IN V01 Fig 78, 81-82]
  V100→B200 table, 16-bit ridge 139→281                                [COVERED Fig 69 — precision unlabelled]
    newest-format ridge 139→1,125                                      [MISSING] (prop. 21)
  why bandwidth lags: wires                                            [COVERED Fig 70; TAUGHT IN V01 Fig 78]
  H200 natural experiment                                              [PARTIAL Fig 71 — no number] (prop. 22)

17. Roofline and intensity                                             [TAUGHT IN V01 Fig 119-129]; re-taught Fig 73-77
  attainable = min(peak, bandwidth × intensity)                        [COVERED Fig 73-74]
  ridge 989 / 3.35 = 295                                               [COVERED Fig 75 = V01 Fig 126]
  intensity from shapes                                                [COVERED Fig 76-77 — precisions differ, unstated]
    why matrix × matrix reuses each weight                             [PARTIAL Fig 76-77 — asserted] (props. 23, 25)
    prefill 1,024 here vs ~2,000 in V01                                [unreconciled, §5]

18. The tensor core
  scalar vs tile                                                       [COVERED Fig 78]
  matrix × matrix: each output = row · column                          [MISSING] (prop. 23); dot product [TAUGHT IN V01 Fig 05, 85]
  D = A×B + C on a 4×4 tile: 64 multiply-adds                          [PARTIAL Fig 79 — empty boxes] (prop. 24)
    accumulate = running total                                         [TAUGHT IN V01 Fig 111]
  reuse grows with tile size (each number serves n multiply-adds)      [MISSING] (prop. 25)
  why one operation gets its own hardware                              [COVERED Fig 80-81]
  528 tensor cores; peak vs sustained                                  [COVERED Fig 81-82]

19. Lower precision pays twice
  fewer bytes per number                                               [COVERED Fig 83; TAUGHT IN V01 Fig 116]
  more operations per second                                           [PARTIAL Fig 84 — three conflicting stories]
    binary integers by place value                                     [MISSING in V01 and V02] (prop. 26)
      powers of two                                                    floor
    binary long multiplication: n × n partial-product bits             [MISSING] (prop. 27)
    area ∝ width²; significand 24² vs 8² = 9×                          [PARTIAL Fig 84 — asserted] (prop. 28)
    why throughput doubles (not ×4) per halving                        [MISSING] (prop. 28)
  FP16 → FP8 → FP4 ladder                                              [COVERED Fig 85 — same-chip vs cross-generation unclear]
  9× headline vs 2-4× real                                             [COVERED Fig 90]

20. Floating point
  sign, exponent, fraction                                             [COVERED Fig 86]
    scientific notation                                                floor
    exponent field is an unsigned binary integer                       [MISSING] (prop. 26)
    bias: subtract 127                                                 [MISSING — formula omits it; V04 builds it later] (prop. 29)
    implied 1 and binary fraction (1 + 73/128)                         [MISSING] (prop. 29)
    worked decode: π in BF16 = 3.140625                                [MISSING] (prop. 29)
  range vs precision                                                   [COVERED Fig 87 — no numbers]
    largest value and gap after 1, FP16 vs BF16                        [MISSING] (prop. 30)
  BF16 vs FP32 layout                                                  [COVERED Fig 88]
  accumulate in FP32                                                   [PARTIAL Fig 89 — asserted]
    rounding once the gap exceeds the addend (256 + 1 = 256)           [MISSING] (prop. 31)

21. The capacity wall
  hundreds of GB of weights vs 80/141 GB                               [COVERED Fig 91]
    parameters × bytes per parameter                                   [TAUGHT IN V01 Fig 73, 105]
    worked: 405B → 810 GB → 11 H100s; a box of 8 holds 640 GB          [MISSING] (prop. 32)
  capacity ≠ bandwidth                                                 [COVERED Fig 91; TAUGHT IN V01 Fig 80]

22. Interconnect
  a link is a bundle of wires                                          [COVERED Fig 92]
  scale-up vs scale-out                                                [COVERED Fig 93]
    why a switch: n(n-1)/2 links otherwise                             [MISSING] (prop. 33)
  bits vs bytes (Gb/s ÷ 8)                                             [MISSING] (prop. 34)
  each level is width × rate (5,120 × 5.2; 36 × 100; 4 × 100)          [PARTIAL Fig 70, 94 — width only, "tenfold" wrong] (prop. 34)
  NVLink 600/900/1,800 GB/s                                            [COVERED Fig 95 — "order of magnitude behind HBM" wrong]
  tensor parallelism: split a sum, add the halves every layer          [PARTIAL Fig 96 — asserted] (prop. 35)
    a sum split into parts                                             floor
  growing the fast domain, 8 → 72                                      [COVERED Fig 97]

23. Other bets
  systolic array: data pulses through a grid of multiply-adders        [PARTIAL Fig 98 — static grid] (prop. 36, widget)
    each loaded value reused by n cells                                (prop. 25)
  MI300X 192 GB vs 80 GB                                               [COVERED Fig 100]
  the software ecosystem                                               [COVERED Fig 99-100]
```

---

## 4. Proposed new figures (37, in video order)

Python expressions were run in `scratchpad/verify_v02.py`, `_b.py` and `_c.py`, and all results are
quoted below. **W** marks entries that would teach far better as an interactive widget.

### A. The opening recap (one figure)

**1.** Insert after **Fig 04 (0:00)**, stamp 0:36
- **Title:** *Almost three hundred, counted two ways*
- **Idiom:** bars to scale on a log axis, then the equation built up. Bars: reading 140 GB at
  3.35 TB/s takes 41.8 ms, against 0.142 ms of arithmetic (140 GFLOP at 989 TFLOP/s). Second row:
  the same 295 as ridge ÷ intensity (295 needed, 1 delivered). Written as a recap of V01
  Figs 14, 116, 126, 129, in the page's own voice.
- **Fills:** tree 1, "the factor of almost 300".
- **Numbers:** `140e9/3.35e12` = 41.8 ms; `140e9/989e12` = 0.142 ms; ratio 295.2; `989/3.35` = 295.2 ✓.

### B. Bandwidth made concrete (one figure; merge Figs 07 and 08 first, see §5)

**2.** Insert after the merged **Fig 07/08 (0:10)**
- **Title:** *3.35 TB/s is 5,120 wires, each carrying 5.2 billion bits a second*
- **Idiom:** equation built term by term over a sketch of five stacks around the die:
  5 stacks × 1,024 wires = 5,120 → × 5.23 Gb/s = 26.8 Tb/s → ÷ 8 = 3.35 TB/s.
- **Fills:** tree 13, the HBM bandwidth node. The same equation is reused in proposals 22 and 34.
- **Numbers:** `3.35e12*8/5120` = 5.23e9 per wire; `5120*5.23e9/8` = 3.347e12 ✓. VERIFY: 5 active
  HBM3 stacks of 16 GB on the H100 SXM5 (5 × 16 = 80 ✓), and 1,024 bits per stack (HBM3).

### C. The CPU's anticipation, and the names (two figures)

**3.** Insert after **Fig 21 (1:39)**, stamp 1:45
- **Title:** *A CPU runs ahead on a guess, and throws the work away when it guessed wrong*
- **Idiom:** two small lane charts. (a) Branch prediction: instructions 1–4, a branch at 4, the core
  guesses "if" and executes 5–8 early. A second row shows the guess failing: 5–8 dashed (thrown away)
  and a restart down "else". (b) Prefetch: requests to addresses 100, 104, 108; the hardware spots
  the +4 pattern and fetches 112 and 116 before they are asked for, so those loads arrive waiting.
- **Fills:** tree 5, branch prediction and prefetching, i.e. "guessing what the thread will do next,
  and lining up the data before the thread asks for it" (1:45–2:07).
- **Numbers:** schematic. Do not quote a misprediction penalty without a source (VERIFY if added).

**4.** Insert after **Fig 23 (2:07)**
- **Title:** *Hopper is the design, H100 is the chip, NVL72 is the rack*
- **Idiom:** table with a pointer. Rows: Volta 2017 → V100; Ampere 2020 → A100; Hopper 2022 → H100,
  H200; Blackwell 2024 → B200, GB200. Box rows: DGX = 8 GPUs in one NVLink domain; NVL72 = 72 in one
  rack. The pointer marks "H100, used throughout".
- **Fills:** tree 5, the names (nouns used in Figs 67–71, 85, 95, 97).
- **Numbers:** years as the video states them (2:07, 11:54, 15:53–16:13); 8 and 72 from 18:37–18:44.
  VERIFY the H200's year if it is shown.

### D. The multiprocessor down to the floor (five figures; one build-up)

**5.** Insert after **Fig 28 (3:34)**
- **Title:** *989 trillion is 132 × 4 × 1,024 × 1.83 billion*
- **Idiom:** equation built term by term, then the two Fig 28 bars, now labelled. Steps: 132 SMs × 4
  tensor cores = 528 → × 1,024 operations per tick (512 multiply-adds) → × 1.83 billion ticks a
  second = 989.4 trillion. CUDA cores: 132 × 128 × 2 × 1.98 GHz = 66.9 trillion. Per SM per tick:
  4,096 against 256, so 16×. Body: the "1,979 with sparsity" headline is the same hardware counting
  skipped zeros.
- **Fills:** tree 7, every MISSING node.
- **Numbers:** `132*4*1024*1.83e9` = 989.4e12 ✓; `128*132*2*1.98e9` = 66.9e12 ✓; `4096/256` = 16 ✓;
  `989.4/66.9` = 14.8 ✓; `989.4*2` = 1,978.8 ✓. VERIFY in the NVIDIA H100 whitepaper: 1,024 dense
  BF16 FLOP per tensor core per clock, and that the 989.4 figure assumes a 1.83 GHz boost while the
  67 TFLOP/s FP32 figure uses 1.98 GHz.

**6.** Insert after **Fig 30 (3:56)**
- **Title:** *256 KB is 65,536 registers, and 2,048 threads get 32 each*
- **Idiom:** small multiples of one bar of 65,536 slots, cut into per-thread slices: 32 / 64 / 128 /
  255 registers per thread gives 2,048 / 1,024 / 512 / 256 threads (100 / 50 / 25 / 12.5%).
- **Fills:** tree 8 (count, slice, the occupancy trade). Sets up proposal 18.
- **Numbers:** `256*1024/4` = 65,536; `/2048` = 32; with 8-register allocation rounding 255 → 256
  threads (Python ✓). VERIFY the 255-register cap and the allocation granularity (CUDA Programming
  Guide, compute capability 9.0).

**7.** Insert after **Fig 32 (4:12)**
- **Title:** *Staging a tile: fetch each number once and let four threads read it*
- **Idiom:** a small grid plus two bars to scale. One 4×4 output block of a matrix multiply. Unstaged,
  each of the 16 threads reads its own row of A and column of B from HBM: 128 reads. Staged, the
  block loads the 16 A and 16 B numbers into shared memory once: 32 reads, 4× fewer. The saving is
  the tile width. This defines *tiling* before Fig 31's caption and Fig 98 lean on it (V03 develops
  it in full).
- **Fills:** tree 9, staging and tiling.
- **Numbers:** `16*8` = 128; `2*16` = 32; `128/32` = 4 ✓.

**8.** Insert after **Fig 35 (4:35)**
- **Title:** *The copy engine is told a shape, not 512 addresses*
- **Idiom:** table with a pointer. A descriptor (start address, 64 rows, 64 columns, row stride)
  points to the 64 row addresses the engine generates itself, one 128-byte line per row. Contrast:
  without it, 128 threads each issue 4 sixteen-byte loads and 4 stores.
- **Fills:** tree 6, how the TMA works.
- **Numbers:** `64*64*2` = 8,192 B; `/128` = 64 lines; `/16` = 512 loads; `/128` = 4 per thread ✓.
  VERIFY the descriptor fields (CUDA driver API, tensor-map encoding).

**9.** Replaces **Fig 36** (restamp 4:35) and absorbs **Fig 41**
- **Title:** *One multiprocessor is four identical quarters*
- **Idiom:** floor plan. Four processing blocks, each holding a scheduler, 32 FP32 lanes, 1 tensor
  core and a 64 KB (16,384-register) slice; the shared 256 KB L1/shared memory and the TMA span the
  bottom. Body: 128 / 4 = 32, so on the H100 one quarter retires one warp per tick. On the A100 a
  quarter has 16 FP32 lanes and the same warp takes two ticks: the warp is older than the match.
- **Fills:** tree 6 (four quarters) and tree 10 (why 32).
- **Numbers:** `128/4` = 32; `256/4` = 64 KB; `64*1024/4` = 16,384; `6912/108` = 64 FP32 per A100
  SM → 16 per quarter ✓. VERIFY against the A100 and H100 SM diagrams in NVIDIA's whitepapers.

### E. SIMT down to the floor (five figures; one build-up)

**10.** Insert after **Fig 37 (5:09)**, stamp 5:18
- **Title:** *A kernel is written for one thread; each thread finds its data from its own number*
- **Idiom:** table with a pointer. The code `c[i] = a[i] + b[i]` with `i = block × 256 + thread`.
  Three example threads: (block 0, thread 0) → i = 0; (block 3, thread 5) → i = 773 → byte 3,092 of
  `a`; warp 2 of block 0 → i = 64…95, so its lanes hit consecutive addresses. This sets up proposals
  19–20.
- **Fills:** tree 10 (kernel, thread index) and tree 15 (why neighbouring lanes ask for neighbouring
  addresses).
- **Numbers:** `3*256+5` = 773; `*4` = 3,092; `2*32` = 64…95 ✓.

**11.** Insert after **10**
- **Title:** *A launch is a grid of blocks, and a block is the unit that shares memory*
- **Idiom:** nested containers: launch → grid of blocks → block (up to 1,024 threads = 32 warps),
  placed whole on one SM; two full-size blocks fill an SM's 2,048; shared memory belongs to one block.
- **Fills:** tree 9 and tree 10, the thread block (used undefined in Figs 53 and 60). Fig 44 then
  adds the block level.
- **Numbers:** `1024/32` = 32 warps; `2048/1024` = 2 ✓. VERIFY the 1,024-thread cap (CUDA Programming
  Guide).

**12.** Insert after **Fig 39 (5:49)** and absorb **Fig 40**
- **Title:** *An instruction is itself a number, and decoding it is the costly part*
- **Idiom:** bit layout of an instruction word (operation | destination | source 1 | source 2 |
  flags) → three stages, fetch / decode / issue → bars: a scalar core pays fetch and decode 32 times
  for 32 adds, a warp pays once.
- **Fills:** tree 10, fetch and decode ("Fetching and decoding an instruction costs real silicon and
  energy", 5:49).
- **Numbers:** a share of 1/32 per operation (trivial). VERIFY the 128-bit instruction width
  (Volta and later) if it is quoted.

**13.** Insert after **Fig 42 (6:15)**
- **Title:** *With 64 warps resident, each thread moves once every sixteen ticks*
- **Idiom:** lane chart. The SM's issue slots are full on every tick, while one thread's own
  instructions appear only every 16th tick. Body: 4 schedulers × 32 lanes = 128 thread-instructions
  per tick, shared by 2,048 threads, which is about 114 million a second per thread against
  30.9 trillion chip-wide. This is "not one of them is fast on its own" (2:27) in numbers.
- **Fills:** tree 5, "not fast on its own".
- **Numbers:** `2048/(4*32)` = 16; `1.83e9/16` = 114e6; `132*128*1.83e9` = 30.9e12 ✓ (clock VERIFY,
  as in 5).

**14.** Insert before **Fig 43 (6:15)**
- **Title:** *To keep a pipe full, count what must be on the road*
- **Idiom:** timeline of overlapping trips. A pizza shop sending out 12 pizzas an hour on 30-minute
  round trips has 6 drivers out at once. Then the memory version: HBM hands over 3,350 bytes every
  nanosecond, each request takes about 400 ns, so 1.34 MB must be in flight.
- **Fills:** tree 14, Little's law at the floor (rate × time, V01 Fig 75).
- **Numbers:** `12*0.5` = 6; `3.35e12/1e9` = 3,350 B/ns; `*400` = 1.34e6 ✓. The 400 ns is the atlas's
  own assumption ("hundreds of cycles" in the video): VERIFY.

### F. The ladder in numbers (two figures)

**15.** Insert after **Fig 51 (7:46)**
- **Title:** *Every rung, with its numbers*
- **Idiom:** table with summary bars on log axes. Rows: registers, L1/shared, L2, HBM. Columns:
  capacity per SM and chip-wide (256 KB / 34.6 MB; 256 KB / 34.6 MB; 50 MB; 80 GB), latency in ticks,
  bandwidth (shared memory: 128 B per tick per SM → ~31 TB/s chip-wide, 9× HBM's 3.35).
- **Fills:** tree 13, per-rung latency and bandwidth, the support for the 100× and 1000× claims.
- **Numbers:** `132*256*1024` = 34.6e6 ✓; `128*132*1.83e9` = 30.9e12 ✓; `30.9/3.35` = 9.2 ✓. VERIFY:
  32 banks × 4 B per tick, and per-rung latencies. Published Hopper microbenchmarks (e.g. Luo et al.
  2024, *Benchmarking and Dissecting the Nvidia Hopper GPU Architecture*) put L1/shared around 30
  ticks, L2 hits in the low hundreds and HBM at several hundred. Use measured values, not these
  recollections.

**16.** Insert after **Fig 53 (8:21)**
- **Title:** *All the fast memory on the chip holds less than a thousandth of the model*
- **Idiom:** area to scale. A 600 px square for a 140 GB model and a 17.5 px square for the 119 MB of
  registers + L1/shared + L2. Body: L2's 50 MB is 1/2,800 of a 70B model's weights. With every weight
  read once per token (Fig 14's last line), L2 has nothing worth keeping during decode. It also
  reconciles V01 Figs 12 and 106 ("the chip holds a few hundred kilobytes"), which is true per SM,
  not per chip.
- **Fills:** tree 13 (chip-wide total; L2 vs decode).
- **Numbers:** `2*34.6+50` = 119.2 MB; `119.2e6/140e9` = 0.085%; `140e9/50e6` = 2,800;
  `600*sqrt(119.2e6/140e9)` = 17.5 px ✓.

### G. Latency hiding and occupancy with the dials exposed (two widgets)

**17. W** Insert after **Fig 57 (9:30)**
- **Title:** *How many warps it takes to hide a wait*
- **Idiom:** widget with sliders for warps per scheduler (1–16), latency in ticks, and instructions
  between loads; an animated lane chart; readout `util = min(1, W·c/(c+L))`. Presets at L = 600:
  c = 40 needs 16 warps and full occupancy gives 100%; c = 20 needs 31, so full occupancy gives only
  52%; c = 10 gives 26%. Lesson: occupancy cannot hide latency when there is too little work per load,
  which is Fig 60's claim made visible. Note that warps are per scheduler (16), not 64 (see §5 on
  Fig 34).
- **Fills:** tree 14, warps needed.
- **Numbers:** Python table ✓ (W = 16, c = 20: 52%; c = 40: 100%). L = 600 is illustrative (VERIFY
  the real latency).

**18. W** Insert after **Fig 60 (9:51)**
- **Title:** *Whichever runs out first sets the occupancy*
- **Idiom:** widget. Inputs: threads per block, registers per thread, shared memory per block. Four
  limit bars (registers, shared memory, 64 warps, 32 blocks); the shortest wins. Presets: 128
  threads / 64 registers / 48 KB → 16 warps, 25%, shared memory binds; 256 / 128 / 0 → 16 warps,
  25%, registers bind; 256 / 32 / 0 → 64 warps, 100%.
- **Fills:** tree 14 (occupancy limits) and tree 8.
- **Numbers:** Python ✓. VERIFY the 256-register-per-warp allocation unit and the 32-block cap for
  compute capability 9.0 (CUDA occupancy calculator).

### H. Coalescing corrected and made interactive (two figures)

**19.** Replaces **Figs 61–62 (10:28)**
- **Title:** *Memory arrives in 32-byte sectors, four to a 128-byte line*
- **Idiom:** bit-layout strip: one 128-byte line split into four 32-byte sectors, with 32 lanes ×
  4 bytes mapped on (8 lanes per sector). Scattered case: 32 lanes in 32 different sectors means
  1,024 bytes moved for 128 used (12.5%), 8× the bytes. Counted in lines it is 32 requests instead
  of 1, which is the video's "up to 32 transactions" (10:51).
- **Fills:** tree 15, sector granularity.
- **Numbers:** `32*4` = 128; `32*32` = 1,024; `128/1024` = 12.5%; `1024/128` = 8 ✓. VERIFY: CUDA C++
  Best Practices Guide, "Coalesced Access to Global Memory" (compute capability 6.0+: a warp's
  accesses coalesce into 32-byte transactions).

**20. W** Insert after **Fig 65 (10:56)**
- **Title:** *Turn the stride and watch the bytes go to waste*
- **Idiom:** widget. A warp of 32 lanes over a strip of memory; sliders for stride (1–64 elements)
  and element size (2/4/8 B); readouts for sectors touched, lines touched, bytes moved and % used.
- **Fills:** tree 15, stride against sectors.
- **Numbers:** for 4-byte elements: stride 1 → 4 sectors (100%), 2 → 8 (50%), 4 → 16 (25%),
  8 and above → 32 (12.5%); lines 1/2/4/8/16/32 (Python ✓).

### I. The memory wall's mechanism (two figures)

**21.** Insert after **Fig 69 (12:00)**
- **Title:** *At each generation's newest format, the ridge climbs eightfold*
- **Idiom:** summary bars on a log axis, two per generation: the ridge at 16-bit (139, 156, 295, 281)
  and the ridge at the newest format (V100 FP16 139; A100 INT8 312; H100 FP8 591; B200 FP4 1,125).
  This makes visible the video's "largely because each generation added a lower precision math
  format".
- **Fills:** tree 16, new formats driving compute.
- **Numbers:** `125/0.9` = 139; `624/2.0` = 312; `1979/3.35` = 591; `9000/8` = 1,125; `1125/139` =
  8.1 ✓. VERIFY the dense peaks: A100 INT8 624 TOPS, H100 FP8 1,979 TFLOP/s, B200 FP4 9 PFLOP/s.

**22.** Insert after **Fig 71 (12:13)**
- **Title:** *The H200's extra 43% is one more stack and faster wires*
- **Idiom:** small multiples. H100: 5 × 1,024 × 5.23 Gb/s = 3.35 TB/s. H200: 6 × 1,024 × 6.25 Gb/s =
  4.8 TB/s. Then decode ceilings for a 70 GB model (70B at 8 bits): 47.9 → 68.6 tokens/s. The ridge
  falls from 295 to 206.
- **Fills:** tree 16, the H200 number.
- **Numbers:** `4.8e12*8/6144` = 6.25e9; `4.8/3.35` = 1.433; `3.35e12/70e9` = 47.9;
  `4.8e12/70e9` = 68.6; `989/4.8` = 206 ✓. VERIFY 6 HBM3e stacks on the H200.

### J. The tensor core from the floor (three figures; one build-up)

**23.** Insert before **Fig 78 (14:04)**
- **Title:** *Multiplying two matrices is every row meeting every column*
- **Idiom:** equation built up on a grid: [[1,2],[3,4]] × [[5,6],[7,8]] = [[19,22],[43,50]], with
  each output's row and column highlighted (19 = 1×5 + 2×7). 8 multiply-adds, each input used twice;
  in general n³ multiply-adds from 2n² numbers. Matrix × vector (V01 Fig 85) is the one-column case.
- **Fills:** tree 18 and tree 4 (matrix × matrix); tree 17 (why prefill reuses weights).
- **Numbers:** Python product ✓.

**24.** Insert after **Fig 79 (14:16)**
- **Title:** *Inside one tensor-core step: a 4×4 tile, 64 multiply-adds, every number used four times*
- **Idiom:** grid/heatmap of A, B, C and D with one cell traced:
  d₂₃ = a₂₁b₁₃ + a₂₂b₂₃ + a₂₃b₃₃ + a₂₄b₄₃ + c₂₃. Count: 64 multiply-adds from 32 inputs. Body: one
  H100 tensor core does 512 multiply-adds a tick, so a warp's 16×8×16 instruction (2,048 multiply-adds)
  keeps it busy for 4 ticks.
- **Fills:** tree 18, the MMA mechanism (Fig 79 is now four empty boxes).
- **Numbers:** `4**3` = 64; `2*16` = 32; `16*8*16` = 2,048; `2048/512` = 4 ✓. VERIFY 512 dense FP16
  FMA per tensor core per clock (H100 whitepaper) and the mma m16n8k16 shape (PTX ISA).

**25.** Insert after **24**
- **Title:** *Bigger tiles feed themselves: each number fetched serves n multiply-adds*
- **Idiom:** bars to scale on a log axis. Tile 2 → each number used in 2 multiply-adds; 4 → 4;
  16 → 16; 128 → 128 (multiply-adds per number fetched = n/2). One sentence ties this to prefill's
  intensity (Fig 76) and to the systolic array (Fig 98).
- **Fills:** tree 18 (reuse) and tree 17.
- **Numbers:** `n**3/(2*n**2)` = 1, 2, 8 for n = 2, 4, 16 ✓.

### K. Precision from the floor (six figures; one build-up)

**26.** Insert after **Fig 83 (15:35)**
- **Title:** *Eight bits make a number by place value: 128, 64, 32 … 1*
- **Idiom:** bit layout with place values: 00001011 = 11; 10000000 = 128; 11111111 = 255.
- **Fills:** trees 19 and 20, binary integers (V01 builds bits and bytes, Figs 72–73, but never place
  value; V04 comes later).
- **Numbers:** trivial ✓.

**27.** Insert after **26**
- **Title:** *Multiplying in binary is long multiplication, and it costs width × width*
- **Idiom:** equation built up in long-multiplication layout: 1011 × 1101 = 11 × 13 = 143 = 10001111,
  with four shifted partial products. Each partial-product bit is one AND (1 only when both bits are
  1), so 4×4 needs 16; 8-bit needs 64, 16-bit 256, 32-bit 1,024.
- **Fills:** tree 19, the width² node (and tree 2, switches to arithmetic).
- **Numbers:** Python ✓ (partial products 00001011, 00000000, 00101100, 01011000; sum 143).

**28.** Insert after **Fig 84 (15:55)**
- **Title:** *The multiplier only multiplies the significand, and BF16's is a ninth the size of FP32's*
- **Idiom:** area to scale: squares of side 24 (FP32, 576), 11 (FP16, 121), 8 (BF16, 64), 4 (FP8
  E4M3, 16). Body resolves Fig 84: the area saving alone would allow more than double the multipliers, but
  delivered throughput doubles per halving (989 → 1,979 on the H100) because the same operand path
  carries twice as many half-width numbers per tick.
- **Fills:** tree 19, area and "why 2×".
- **Numbers:** `24**2` = 576; `8**2` = 64; `576/64` = 9; `576/121` = 4.76; `1979/989.4` = 2.0 ✓.
  VERIFY: the operand-delivery reason is a design rationale, not a published spec. Word it as reasoned.

**29.** Insert after **Fig 86 (16:16)**
- **Title:** *π in BF16: 0 | 10000000 | 1001001 is 3.140625*
- **Idiom:** bit layout, then the equation built term by term: exponent field 128 − bias 127 = 1;
  fraction 1001001 = 73 → 1 + 73/128 = 1.5703125; × 2¹ = 3.140625, 0.031% below π.
- **Fills:** tree 20 (bias, implied 1, a worked decode).
- **Numbers:** top 16 bits of float32 π = 0x4049 → (0, 128, 73) → 3.140625 (Python `struct` ✓);
  error 0.031% ✓.

**30.** Insert after **Fig 87 (16:16)**
- **Title:** *BF16 reaches 5 × 10³³ times further than FP16, in steps 8 times coarser*
- **Idiom:** two number lines. (a) Log-scale range bars: FP16 from 6.1×10⁻⁵ to 65,504; BF16 from
  1.2×10⁻³⁸ to 3.4×10³⁸. (b) A linear zoom from 1 to 1.03 with ticks: FP16 every 0.00098, BF16 every
  0.0078.
- **Fills:** tree 20, range and precision in numbers.
- **Numbers:** 65,504; `2**-14` = 6.1e-5; `(2-2**-7)*2**127` = 3.39e38; `2**-126` = 1.18e-38;
  `2**-10`, `2**-7`; ratios 5.17e33 and 8 ✓.

**31. (W optional)** Insert after **Fig 89 (16:44)**
- **Title:** *Add 1 a thousand times in BF16 and the total stops at 256*
- **Idiom:** line plot of the running total against the number of additions: BF16 flattens at 256,
  FP16 at 2,048, FP32 stays exact. Reason: at 256 the gap between BF16 numbers is 2, so 256 + 1 rounds
  back to 256. As a widget: choose the format and the addend.
- **Fills:** tree 20, rounding in accumulation, the "how" behind "errors don't pile up".
- **Numbers:** emulated round-to-nearest-even: BF16 sum = 256.0, FP16 = 2048.0, FP32 2²⁴ + 1 =
  16,777,216; gap `256*2**-7` = 2 ✓.

### L. Many chips (four figures)

**32.** Insert after **Fig 91 (17:13)**
- **Title:** *A 405-billion-parameter model at 16 bits needs eleven H100s before it does anything*
- **Idiom:** bars to scale: 810 GB of weights against 80 GB per H100, 640 GB per 8-GPU box, and an
  NVL72. At FP8 the 405 GB fits in one box.
- **Fills:** tree 21, a worked capacity example.
- **Numbers:** `405*2` = 810; `ceil(810/80)` = 11; `8*80` = 640 < 810; 405 ≤ 640 ✓. VERIFY the NVL72
  total HBM (NVIDIA quotes roughly 13.5 TB).

**33.** Insert after **Fig 93 (17:37)**
- **Title:** *Wiring every pair stops scaling; a switch gives each GPU one connection*
- **Idiom:** small multiples: fully meshed 4 GPUs (6 links), 8 (28), 72 (2,556), against a star
  through a switch.
- **Fills:** tree 22, the crossbar.
- **Numbers:** `n*(n-1)/2` = 6, 28, 2,556 ✓.

**34.** Insert after **Fig 94 (17:40)**
- **Title:** *Three links, each wires × rate, in the same units*
- **Idiom:** small multiples of one equation, then bars on a log scale. HBM: 5,120 wires × 5.23 Gb/s
  = 3,350 GB/s. NVLink: 36 lanes each way × 100 Gb/s = 450 GB/s each way (900 both ways). InfiniBand
  NDR: 4 lanes × 100 Gb/s = 400 Gb/s ÷ 8 = 50 GB/s. Steps of 7.4× then 9×, per direction. Teaches
  "divide gigabits by 8" in passing.
- **Fills:** tree 22, bits vs bytes and width × rate at each level. This replaces the wrong "tenfold
  at each step" (§5).
- **Numbers:** `5120*5.23/8` = 3,347; `18*2*100/8` = 450; `4*100/8` = 50; `3350/450` = 7.44;
  `450/50` = 9 ✓. VERIFY lane counts and rates (NVLink 4: 18 links × 2 lanes × 100 Gb/s per
  direction; NDR: 4 × 100 Gb/s).

**35.** Insert before **Fig 96 (18:16)**
- **Title:** *Split a sum across two GPUs, and the halves must meet before the next layer*
- **Idiom:** equation built up: an 8-term dot product, 4 terms on GPU A and 4 on GPU B; two partial
  sums cross the link and are added. Two such meetings per layer (attention, feed-forward) × 80
  layers = 160 per token.
- **Fills:** tree 22, the tensor-parallel mechanism (V05 develops it).
- **Numbers:** `80*2` = 160 ✓. VERIFY two all-reduces per layer in Megatron-style tensor parallelism.

### M. Other bets and the close (two figures)

**36. W** Insert after **Fig 98 (19:14)**
- **Title:** *A systolic array, beat by beat*
- **Idiom:** step-through widget. A 3×3 array computes a 3×3 product: rows of A enter from the left
  and columns of B from the top, each skewed by one beat. Each cell multiplies, adds to its running
  total and passes values right and down; the product finishes in 7 beats and every loaded value is
  used by 3 cells. At real scale a 128×128 array does 16,384 multiply-adds per beat. Restore the
  dropped caveat: "rentable for now only on Google Cloud" (19:27–19:48).
- **Fills:** tree 23, the systolic mechanism.
- **Numbers:** `3*3-2` = 7 beats; 27 multiply-adds; `128**2` = 16,384 ✓ (VERIFY the TPU MXU size).

**37.** Insert after **Fig 100**, stamp 20:08
- **Title:** *The three questions, answered*
- **Idiom:** chain of consequences, mirroring Fig 11. Q1: why so different → one bet → many slow
  threads (Figs 21–26). Q2: why a byte costs more → cell physics + the ladder (Parts 2 and 7). Q3:
  fighting back → hide latency, coalesce, tensor cores, lower precision, larger fast domains.
- **Fills:** the close (20:08–20:26).
- **Numbers:** none.

---

## 5. Problems in existing figures

### 5a. Factual and numeric errors

1. **Figs 61, 63, 65, 66: the transaction granularity is wrong for the H100.** Fig 61: "one
   transaction always moves 128 bytes … thirty-two times the traffic". Fig 63: "3% used, 32x the
   transactions … thirty-two times the memory traffic". On compute capability 6.0+, a warp's accesses
   coalesce into 32-byte sectors (VERIFY: CUDA C++ Best Practices Guide). Scattered 4-byte loads
   therefore move `32*32` = 1,024 B for 128 used: **12.5%, 8× the bytes**. The atlas's 3.1% and 32×
   assume 128-byte fetches (`32*128` = 4,096 B). Counted in lines, 32 requests against 1 still holds.
   Fig 65's "at a stride of thirty-two or more … the waste reaches its maximum": the byte waste peaks
   at stride **8** for 4-byte elements. Fig 66's teal sliver is 11 of 50 px (22%), neither figure.
   **Fix:** proposal 19 replaces 61–62; correct 63's numbers; fix 65's last paragraph; draw 66's
   sliver at 1/8.
2. **Fig 54 is not drawn to the stated ratios.** The latency bars are 4 px and 400 px, i.e. 100:1,
   yet are labelled "HBM, roughly 1000x more", and the caption says "Bars drawn to the stated ratios".
   A 1000:1 pair needs a log axis (design.md: ratios over ~50:1). **Fix:** both pairs on one labelled
   log axis (2 and 3 decades).
3. **Fig 95: "roughly an order of magnitude behind HBM bandwidth on the same chip".** `3.35/0.9` =
   3.7× (A100 `2.0/0.6` = 3.3×, Blackwell `8/1.8` = 4.4×). Even against NVLink's one-way 450 GB/s
   it is 7.4×. Figs 92 ("a factor of ten at each step") and 94 ("the roughly tenfold drop at each
   level") make the same overstatement. The 900 GB/s figure is both directions added, and that is
   never said. **Fix:** state per-direction figures; the honest steps are 7.4× and 9× (proposal 34).
4. **Fig 26 and Fig 55 misexplain why decode is slow.** Fig 26: "A chain runs at the speed of one
   lane … Producing one token after another is a chain". Caption: "decode is sequential". Fig 55: "A
   cook with one order can do nothing but wait, which is precisely the situation a single decode
   request puts the chip in." But each decode step is itself a full pass with millions of independent
   multiply-adds (one 4096×4096 matrix × vector is `4096*4096` = 16,777,216). The lanes are busy and
   latency hiding works. Decode is slow because each fetched weight is used once (intensity 1,
   V01 Figs 116 and 129): it is bandwidth-bound, not lane-speed- or latency-bound. **Fix:** "tokens
   form a chain, but each link is wide; what starves the chip is reuse, not parallelism" (Fig 26),
   and drop or reword Fig 55's last sentence.
5. **Fig 43 (with Figs 42 and 57): the causal claim about 2,048.** "The occupancy figure is not a
   round number chosen for convenience. It is roughly the amount of concurrency required to keep HBM
   saturated." 2,048 = 2¹¹, and 2,048 threads per SM has been the cap on NVIDIA's data-centre parts since
   Kepler (2012), across very different bandwidth × latency products (VERIFY). And by the figure's own numbers,
   `8192/10152` = 0.81: one 4-byte load per thread falls 19% short. Real kernels issue 16-byte loads
   (`2048*16/10152` = 3.2× enough). **Fix:** keep the Little's-law arithmetic as a check ("roughly
   enough, comfortably so with 16-byte loads"), not as the reason for 2,048. Fix the captions of
   Figs 42 and 57 to match.
6. **Fig 41: "The warp size is not arbitrary. It is the width of the hardware that executes it."**
   True on the H100 (`128/4` = 32). But the A100 has `6912/108` = 64 FP32 lanes per SM, 16 per
   scheduler, so a warp takes two ticks, and warps have been 32 wide since 2006. **Fix:** "On the H100
   the two numbers match", folded into proposal 9.
7. **Figs 15 and 16: "refreshed thousands of times a second".** Each DRAM row is refreshed once per
   64 ms window (32 ms for HBM, or DDR when hot): `1/0.064` = 15.6 and `1/0.032` = 31 times a second.
   Refresh *commands* go out every 7.8 µs (`1/7.8e-6` = 128,205 a second), each covering a slice of
   rows. VERIFY the JEDEC tREFW/tREFI values. **Fix:** "every cell is rewritten every 32–64 ms".
8. **Fig 20: "the wait is dominated by the physics of getting at the charge".** On a GPU, the DRAM
   array's own timing (row open + column read, a few tens of ns, VERIFY) is a minority of a several-
   hundred-ns load. Most of it is L1/L2 lookups, the on-chip network and memory-controller queues.
   The conclusion (a wider bus does not cut latency) survives. **Fix:** reword the cause, with
   measured numbers if added. Related: Fig 17's "those three costs are the memory wall in physical
   form" conflicts with Fig 70 and V01 Fig 78, which place the bandwidth wall in wire counts.
9. **Fig 10:** "Three scales, each about a thousand times the one before". 1 ns → ~300 ns is ~300×;
   `30e-3/300e-9` = 100,000×. The "logarithmic" bars do not share a scale: the 30 ms bar implies
   44.7 px per decade, which puts 300 ns at 117 px, but it is drawn at 90. **Fix:** correct the prose,
   redraw on one log scale, and add a "1 tick ≈ 0.55 ns" row.
10. **Fig 69:** the "Peak compute" column is dense 16-bit but unlabelled, and the caption ("It has
    been climbing for a decade") contradicts the table: B200's 281 < H100's 295. **Fix:** label it
    "dense FP16/BF16", reword the caption, and add proposal 21.
11. **Fig 85:** "FP8, 2022, Hopper, 2x throughput"; "FP4, 2024, Blackwell, 4x". These read as
    cross-generation gains, but V100 FP16 → B200 FP4 dense is `9000/125` = 72× (VERIFY peaks). The 2×
    is same-chip (`1979/989.4` = 2.0). **Fix:** "relative to 16-bit on the same chip".
12. **Fig 84 tells three stories:** the drawing shows 1 → 2 → 4 multipliers (linear in width); the
    prose says area grows with width², buying "considerably more than twice the units"; the last line
    says throughput doubles. **Fix:** proposals 27–28; redraw the boxes to area scale (one 32-bit
    multiplier ≈ 4 sixteen-bit ≈ 16 eight-bit).
13. **Fig 51:** "SRAM: shared memory + L1 / up to 228 KB per SM": the combined SRAM is 256 KB
    (Fig 31; video 4:07). The ratio "registers to HBM … 320,000 to one" (`80e9/256e3` = 312,500)
    compares a per-SM rung with a chip-wide one; chip-wide registers are 34.6 MB (`80e9/34.6e6` ≈
    2,300). Latency words ("SRAM a few nanoseconds", "L2 tens of nanoseconds") are probably
    understated (VERIFY, proposal 15). **Fix:** label scope, use 256 KB, use measured latencies.
14. **Fig 59:** "256 kilobytes per multiprocessor, larger than the cache next to it". The SRAM beside
    it is also 256 KB (video 3:51–4:12). **Fix:** "as large as".
15. **Fig 34:** "64 groups, all resident … which one can run now?". Each of the four schedulers picks
    among its own 16 warps; warps are bound to one quarter (VERIFY, NVIDIA SM diagrams). **Fix:** "16
    per scheduler, 64 per multiprocessor".
16. **Fig 42:** "2,048 threads, which is the multiprocessor's occupancy". Occupancy is a fraction
    (resident warps ÷ 64), and Fig 60 uses it that way. **Fix** the wording.
17. **Fig 19:** the label "read 8 KB of SRAM" misreads the source. The ratios `3.7/0.9` = 4.1,
    `5/0.9` = 5.6 and `640/0.9` = 711 match Horowitz (ISSCC 2014) as tabulated by Han et al. (2016):
    a 32-bit read from a small SRAM cache, against a 32-bit DRAM read. **Fix:** "32-bit read, small
    (8 KB) SRAM", and cite the source in the caption. The bars are linear with a ~6 px floor
    (6.5 / 8 / 9 / 340 px); say so.
18. **Figs 76–77 and V01:** Fig 76 is 16-bit (prefill 1,024 ops/B, decode 1); Fig 77 is FP32 without
    saying so (`1/12` = 0.083; 1024³ matmul `2*1024**3/(3*1024**2*4)` = 171). At BF16 that matmul is
    341, right of the 295 ridge, but as drawn it reads as left of it. V01 Figs 128/129 give prefill
    ≈ 2,000 ops/B. Fig 76's 1,024 counts activations in and out; weights only gives `2*M*K*N/(2*K*N)`
    = M = 2,048. **Fix:** one precision throughout, plus one sentence reconciling with V01. Fig 76's
    ridge marker sits at 82.6 px, so prefill should be 3.47× that, but it is drawn at 2.91×
    (`240/82.6`). Use a log axis.
19. **Figs 92 and 93 disagree on "three bandwidths".** Fig 92: memory, neighbouring chip, network.
    Fig 93's caption: "distinct from HBM bandwidth and from memory capacity" (capacity is not a
    bandwidth). The two passages repeat each other almost word for word. **Fix:** keep Fig 92's
    three, and give Fig 93 a new caption.
20. **Fig 86:** "The exponent slides the decimal point" (binary point), and the formula omits the
    bias. **Fix:** `(−1)^s × 2^(e−127) × 1.f`, plus proposal 29.
21. **Undefined and overloaded words.** "Block" means a thread block in Figs 53 and 60 but a memory
    block in Figs 35 and 61–66. "Kernel" (Figs 28, 47, 60, 73–74, 81–82) and "tiling" (Figs 31, 98)
    are used before they are defined. **Fix:** "cache line/sector" for memory; proposals 7, 10, 11.
22. **Part 4 header** says "Five components"; Fig 36 says "Six components side by side".
23. **Dropped presenter caveat:** "rentable for now only on Google Cloud" (19:27–19:48) is absent from
    Fig 98.

### 5b. ASR-mangled terms

None carried into the atlas; it already corrects them. These corrections should be recorded so that
searching the SRT works:

- 13:16 "That **rich** point" → ridge point
- 15:31 "a second **level** though" → lever
- 16:13 "Each **having** of the bits" → halving
- 15:14 "the **core's** perfectly fed" → cores are
- 4:35 "**It's** only job" → its

### 5c. Voice violations

- Fig 99 caption: "It is the note the video closes on." → "It is the note to close on", or cut it.
- Fig 44 caption: "Every number quoted between 2:17 and 6:20 …" → "Every number in Parts 3–5 …".
- Fig 100 caption: "A good note to close on." is meta and collides with Fig 99's. Give it a
  judgement instead, e.g. "Specifications decide what is possible; the ecosystem decides what gets
  used."

### 5d. Neighbours that repeat each other (and repeats of V01)

- **Fig 05 ≈ V01 Fig 63** (count vs rate, including the "does not survive … units" test).
  **Figs 07 ≈ 08 ≈ V01 Fig 74** (width × frequency, twice in a row). **Fig 09 ≈ V01 Fig 76 nearly
  verbatim** (same title, both headings, "These are independent. A wide, slow pipe …"). **Fix:**
  merge 05 and 09 into one recap pointing back to V01; merge 07 and 08; give the freed slot to
  proposal 2.
- **Figs 15 / 16 / 17** repeat refresh (15 and 16) and destructive read (16 and 17); Fig 16's and
  Fig 18's captions are near-identical ("Every level of the memory ladder … is a consequence…" /
  "Every level of every memory hierarchy … exists because…"). **Fix:** make it two figures: the two
  cells, then the read-and-refresh cycle.
- **Fig 18 ≈ Fig 50** (no technology is fast and large). Merge them once Part 2 moves to 7:44.
- **Figs 39 / 40** captions: "frees the silicon that becomes arithmetic" / "frees the silicon … to
  become more arithmetic". Fold 40 into proposal 12.
- **Figs 46 / 47 / 48:** "halves throughput" three times, nesting 2/4/8 twice; 47's caption ("nothing
  is stalled …") ≈ 48's ("Divergence is not a stall …"). Merge 47 and 48.
- **Fig 52 caption = Fig 53 prose verbatim** ("Speed is not the only axis …").
- **Fig 58 ≈ Fig 59** (save/restore against registers staying put; also Fig 30's prose). Merge.
- **Figs 61 / 62 / 63:** one point (block granularity) three times; Fig 66 redraws 63. See
  proposal 19.
- **Figs 74–75 ≈ V01 Figs 123, 126** (Fig 75 is V01 Fig 126's 989/3.35 = 295 again). Merge into one
  recap.
- **Fig 80 ≈ Fig 81** (same matmul-vs-rest drawing, same ">90%"); Fig 81's caption ≈ Fig 82's prose
  ("the entire subject of the kernels video"). Merge 80 and 81.
- **Figs 83 / 84 / 85** each restate "halving the bits halves the bytes"; **Fig 87's last sentence ≈
  Fig 88's body** (range over precision, BF16 keeps the exponent).
- **Fig 70 ≈ Fig 94** (wire geometry); proposal 34 gives Fig 94 numbers, so it stops repeating 70.

### 5e. Idioms that fight their idea

- **Fig 79:** four empty tiles. The point is what happens inside them (proposal 24).
- **Fig 98:** a static grid for an idea about motion. It needs a step-through (proposal 36).
- **Fig 38:** the "own data" row is empty. Put a[k], b[k] and the instruction text on it.
- **Figs 54, 76, 77:** ratios of 100–2,000:1 on linear bars with pixel floors. Use labelled log axes.
- **Figs 22 / 23:** schematic area splits not labelled schematic. Fig 23's caption "identical silicon
  budget" (a CPU core against one SM) is not literally true.
- **Fig 36:** six peers hides the real four-quarter structure (proposal 9).
- **Fig 44:** the hierarchy skips the thread block, which is the level shared memory (Fig 53) and
  occupancy (Fig 60) hang on.
- **Fig 64:** add the address formula `(row × width + col) × 4` and the column step (`4096*4` =
  16,384 bytes for a 4,096-wide FP32 matrix). Layout then becomes a linear function the reader can
  evaluate.

---

## 6. Size after the pass

**Estimate: about 124 figures.** That is 100 + 37 new − 13 merged or replaced: 05+09, 07+08,
15/16/17 → 2, 18+50, 40 into 12, 36 and 41 into 9, 47+48, 58+59, 61+62 into 19, 74+75, 80+81. Five
of the new entries are widgets (17, 18, 20, 36, optionally 31). Update `atlases/index.html` when the
count changes.

**Three highest-value changes:**

1. **Build the tensor core and the 989 TFLOP/s from the floor** (proposals 5, 23–25, plus 9).
   Matrix × matrix worked small, a 4×4 MMA tile with its reuse count, and 132 × 4 × 1,024 × 1.83 GHz
   = 989.4T. This is the video's central hardware claim (3:30, 14:04–15:10), and the atlas now only
   restates it.
2. **Fix the factual cluster around memory traffic and links:** coalescing granularity (12.5% and 8×,
   not 3% and 32×, plus the stride widget, proposals 19–20), Fig 54's mis-drawn 1000×, NVLink's
   "order of magnitude behind HBM" (3.7×), and decode framed as "one lane" or "one order"
   (Figs 26 and 55). Each currently teaches something false.
3. **Take precision to the floor:** place value → binary long multiplication → significand area →
   π in BF16 → range and precision number lines → the 256 accumulation stall (proposals 26–31).
   This resolves Fig 84's contradiction, and it is the first place in the series where a
   floating-point number is actually decoded.

Also restore video order: move Part 2 to 0:58, 4:12 and 7:39–7:46, and restamp Figs 36, 41, 44, 81
and 82 (§2b).
