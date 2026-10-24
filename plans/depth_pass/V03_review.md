# V03 Kernels and Memory: depth review

Reviewed: `atlases/V03_Kernels_and_Memory.html` (100 figures), against `V03_outline.md`, the 20-second transcript and the raw SRT (cue times quoted below come from the SRT). Read-only. Nothing in the repository was changed.

**How numbers were checked.** Every number below was recomputed in Python. The scripts are in `/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/review/work/` (`verify1.py` to `verify5.py`, `fp8sim.py`). Sourced claims were checked against the papers' own text, fetched to `.../review/dl/`:
- FlashAttention 1 (arXiv 2205.14135): Fig 1, Fig 2, Algorithm 1, Theorem 2.
- FlashAttention 2 (2307.08691): §2.1, §3.1.1, §3.2, §3.3.
- FlashAttention 3 (2407.08608): §3.1 pingpong, §3.3, §4.3.
- FlashAttention 4 (2603.05451): §2, §3.1.1 Table 1, §3.1.3, §3.1.4, Table 3.
- DeepSeek-V2 (2405.04434): §2.1.2 to §2.1.4, deployment paragraph.
- DeepSeek LLM (2401.02954): Table 2.
- vLLM (2309.06180): Fig 2, §6, §7.2.

`VERIFY` marks anything I could not settle.

---

## 1. Snapshot

**100 figures in 15 parts.**

| Part | Figs | | Part | Figs |
|---|---|---|---|---|
| 1 The puzzle | 01-07 (7) | | 9 FlashAttention 2 | 65-70 (6) |
| 2 The two tiers | 08-12 (5) | | 10 Hopper, FA3 | 71-76 (6) |
| 3 Attention, from scratch | 13-27 (15) | | 11 Blackwell, FA4 | 77-81 (5) |
| 4 The naive kernel | 28-33 (6) | | 12 The KV cache | 82-87 (6) |
| 5 Tiling | 34-43 (10) | | 13 Storing fewer numbers | 88-92 (5) |
| 6 A worked prefill | 44-52 (9) | | 14 Decode | 93-97 (5) |
| 7 Online softmax | 53-59 (7) | | 15 What stayed fixed | 98-100 (3) |
| 8 Recomputation | 60-64 (5) | | | |

**The density is lopsided.** Figs 01-62 cover 0:00-15:55, which is 3.9 figures a minute. Figs 63-100 cover 16:00-49:21, which is 1.1 a minute. So FlashAttention 2 to 4, the KV cache, MLA, decode and graphs share 38 figures.

**Many figures repeat a neighbour.** About 17 pairs make the same point (list in §5d), so the atlas has roughly 83 distinct teaching figures. The pattern looks like ground-floor "what X is" figures added next to figures that already said X.

**No interactive widget, and no link to the animation.** The 42-step animation `V03_Kernels_and_Memory_animation.html` is linked only from `index.html`.

**Keep these:**
1. **The worked 200-token prefill (Figs 44-52).** It uses a real model shape (Llama-3-8B) and every number checks: 16 GB of weights, 26 MB of KV, 0.33 GB of naive score traffic = 2.0% of the total, rising to 550 GB = 97.0% at 8,192 tokens, with growth (8192/200)² = 1,678. It turns the video's "on long sequences" into arithmetic.
2. **Honest bars.** Figs 47, 51, 52, 82, 88 and 91 are drawn to scale; I checked their pixel widths against their values.
3. **The online-softmax framing (Figs 53-55, 59).** It poses the dilemma first ("be wrong, or be slow", Fig 54) and states the identity exp(x−m_old)·exp(m_old−m_new) = exp(x−m_new) (Fig 59).
4. **Small definitional figures placed where first needed.** Dot product (Fig 14, 2+0+6+5 = 13 is correct), transpose (Fig 19), accumulator (Fig 38), asynchronous (Fig 72). Fig 92 also explains why MLA stores 512 + 64 numbers.

---

## 2. Coverage against the transcript

### 2a. Stretches covered thinly or skipped

| Video | What is said there | Atlas now |
|---|---|---|
| 0:16-0:42 | "A kernel is one small program… When PyTorch multiplies two matrices, what actually runs on the silicon is a kernel." | Kernel is covered (Figs 04-05). PyTorch is never mentioned, and "thousands of threads" is never counted. |
| 1:02-1:22 | "everything the mathematics leaves open. Which threads load which bytes from which level of memory, in what order, at what precision, and where each result is written" | No figure. This is the video's thesis, and it maps onto every later Part. |
| 1:22-2:47 | Four generations, the function never changes, the fraction of peak climbs to ~¾; the roadmap of levers (smaller cache, packed cache, split decode, launch paid once, fewer bits) | No figure stamped in this window. The climb appears only at 29:47 (Fig 81). There is no roadmap anywhere. |
| 4:11-4:53 | Ridge 295; dense matmul is compute-bound; "Attention over long sequences… sits far down the slanted ceiling" | Fig 11 is a schematic roofline with no axis labels and no points placed. Attention's intensity is never computed. |
| 4:53-5:15 | "its measure is the fraction of peak arithmetic a kernel sustains, the number we will track from here on" | Never defined. The FLOP count of attention never appears. |
| 8:49-9:11 | "the bus saturated and the tensor cores waiting" | The traffic tally exists (Fig 31), but it is never turned into time. |
| 10:34-11:01 | FA1's loop order: "loads one block of K and one block of V… For each block of Q… folds the partial result into the output" | Fig 49 describes this order. Fig 39 draws the opposite order (FA2's). Nothing says they differ. |
| 11:20-11:41 | "identical up to the reordering of floating point sums" | No figure. Fig 59 claims bit-identity instead. |
| 12:45-14:09 | The 1.59 / 3→5 / ×0.135 worked example; the output takes the same factor | Fig 57 has 1.59 but not the scores behind it. The output numbers, the final division and the algebra (distributivity) are missing. |
| 17:40-18:02 | "The output now writes through the whole loop unnormalized. The division… happens once at the end" | One sentence in Fig 66; no algebra and no count. |
| 18:43-19:05 | FA2 "splits the query rows of a single long sequence across many" blocks | Said, but with no count. The loop swap that makes this possible is never mentioned. |
| 19:27-20:09 | Full training run: 225 TFLOP/s per A100 = 72% model FLOPs utilisation; "a training number rather than an inference one" | Missing entirely, including the presenter's caveat. |
| 20:50-21:00 | WGMMA "issued by a warp group, four warps acting as one" | Named in Fig 71; warpgroup never drawn. |
| 22:20-22:52 | Second overlap: tensor cores on one tile's PV while the next tile's exponentials run on the "special function unit or multi-function unit" (ASR "MoFu" = MUFU) | One sentence in Fig 73. The unit is never introduced. |
| 23:01-24:47 | FP8: ~double rate; "a couple hundred distinct values"; one scale; block scales; incoherent processing; 2.6×; 1.5-2× over FA2; 740 TFLOP/s; ~1.2 PFLOP/s | Figs 75-76. FP8's values are never shown, the mechanism is the integer-grid one (§5a), the rotation algebra is missing, and 1.5-2× is missing. |
| **25:57-29:47 (3:50, no figure)** | Conditional rescaling, τ = "eight doublings, a factor of 256" (27:13-27:57); TMEM 256 KB, "TMA… is a copy engine. TMEM is a place to keep data" (27:57-28:17); 2-CTA (28:17-28:38); CuTe DSL, 20-30× faster compiles (28:38-28:59); "gains are real, but regime specific" (28:59-29:44) | Only Fig 79's last sentence mentions rescaling. TMEM, 2-CTA and CuTe DSL are absent. "Below 4,000 tokens, the paper does not claim a consistent lead" is absent. |
| 29:44-30:27 | 1,605 TFLOP/s ≈ 71% of B200; "Every headline number here was measured in BF16" | Fig 81 gives 71% only. The BF16 caveat is missing. |
| 31:09-31:31 | "Suppose the limit is 4,096 tokens and the response stops at 200. The other 3,896 slots sit reserved and empty" | Missing. Figs 83-84 restate each other instead. |
| 33:38-34:20 | Beam search defined; copy only on divergence; 55% shared; 1.3× → 2.3× throughput | Beam search is used undefined (Fig 86). The 1.3-2.3× is missing. |
| 35:04-36:48 | Shazeer: decode "reloading all of those cached keys and values… bandwidth bound"; MQA in Falcon/PaLM; why quality drops; GQA dial; 8 groups; uptraining | Compressed into Figs 88-89. No bandwidth-per-token numbers, and no reason for the quality loss. |
| **36:48-40:41 (3:48, three figures all stamped 36:48)** | Latent; "low-rank joint compression"; 32,768 vs 512+64; "a grouped query model with just 2.25 groups"; "Two matrix multiplies in a row are the same as one multiplied by their product"; RoPE "rotating its query and key vectors by a position dependent angle"; 93.3%, 5.76×; "That last claim is one to read carefully" | Figs 90-92 stay at slogan level. No low-rank, no associativity, no RoPE, no 2.25 groups, and the quality caveat is dropped. |
| **40:41-43:57 (3:21, both figures stamped 40:36)** | Block count collapses at decode; "walks the entire cached sequence alone"; Flash-Decoding; the merge; CodeLlama-34B, 512 to 64k tokens, 8× / 50×; "A large batch already fills the chip" | Figs 93-94 duplicate each other. The merge is never computed. There is no serial-walk picture and no batch condition. |
| 44:18-44:47 | Kernels per layer: QKV, rotary, attention, combine heads, two FFN, add/renorm → "hundreds of kernel launches for every generated token" | Missing. Figs 95-97 repeat one another. |
| 46:04-46:24 | Recap of the levers | Fig 100 lists a different set (§5a). |
| 46:56-47:06 | Blackwell reaches FP4 | Missing from Fig 98. |

### 2b. Stamps that do not match where the video discusses them

| Fig | Stamp | Where the video says it (SRT cue) | Fix |
|---|---|---|---|
| 04, 05 | 0:00 | "A kernel is one small program" 0:16, hand-off 0:21 | 0:16 and 0:21, and move them before Fig 02 |
| 06 | 0:12 | Boundary round trip: "writes it out in full because the next kernel needs it as input" 8:29 | Merge into Fig 30 (they show the same three kernels) |
| 07 | 9:25 (filed in Part 1) | "IO awareness" 9:59 | Move after Fig 32, stamp 9:59 |
| 10 | 3:49 | Working set is implied at 10:24 ("couple hundred kilobytes") | Merge into Fig 42 |
| 13 | 5:12 | "per head" 5:55; heads explained 7:28 | 5:55 |
| 20 | 5:34 | The causal mask is not in this video; it is V01 Fig 132's figure | Keep as a recap, but say so |
| 32 | 9:25 | "wall clock time is set by the bytes moved" 9:44 | 9:44 |
| 39 | 11:01 | Draws FA2's Q-outside order; FA2's split is described at 18:49 | Move to FA2 (proposal #18) |
| 43 | 11:20 | 11:20 is "still exact attention"; M/d² is never said | 11:01 |
| 59 | 13:40 | "the correction was exact at every step" 14:09 | 14:09 |
| 77, 78 | 24:57 | 2.25× at 25:08; "asymmetric" at 25:45 | 25:08 |
| 79 / 80 | 25:57 | 16 vs 8,192 at 26:15-26:32; polynomial 26:48 | 26:15 / 26:48 |
| 82 | 30:07 | "the KV cache from the first video" 30:39; formula 34:42; 320 KB 34:54 | 30:39 |
| 87 | 32:13 | Sharing / beam search 33:38-33:52 | 33:38 |
| 89 | 34:30 | MQA 35:24; GQA 36:09 | 35:24 |
| 90 / 91 / 92 | 36:48 | Latent 37:09; numbers 37:29-38:12; rotary 39:42 | 37:09 / 37:29 / 39:42 |
| 93 / 94 | 40:36 | Flash-Decoding 42:07; merge 42:51 | 42:07, after merging the pair |
| 95 / 96 / 97 | 43:57 | Kernels per token 44:18; overhead 45:03; CUDA graphs 45:25 | 44:18 / 45:03 / 45:25 |
| 98 | 46:12 | Width lever 46:24 | 46:24 |

### 2c. Out-of-order runs, and whether they look deliberate

1. **Figs 02-03 (0:42), then Figs 04-05 (0:00), Fig 06 (0:12), Fig 07 (9:25), Fig 08 (2:47).**
   - The hook-first opening (the 7.6× before the kernel) is deliberate.
   - Fig 07 is a misfiled ground-floor insert; its own stamp says 9:25.
   - Both break "follow the video's order". Fix: Fig 01, 04, 05, [#1], 02, 03, 08… with Fig 07 moved to 9:59.
2. **Fig 39 (11:01), then Figs 40-42 (10:50).** A slip. Fig 39 leaves this spot anyway (§5a item 3).
3. **Fig 43 (11:20), then the worked prefill Figs 44-52 (10:50).** Deliberate: an inserted worked example re-anchored at the tiling stamp. Fix: stamp Fig 43 at 11:01 and the worked prefill at 11:10 ("The full n by n matrix is built tile by tile on chip and never reaches HBM at all"). The new exactness figure (#12) then takes 11:20, and the run is monotonic.

---

## 3. Concept trees

Markers: `[COVERED Fig n]`, `[PARTIAL Fig n — …]`, `[MISSING]`, `[TAUGHT IN Vxx Fig n]`, `floor`.

```
1 Kernel: one GPU program the CPU launches as a grid of thread blocks            [COVERED Fig 04-05]
  instruction, thread, clock cycle                                               [TAUGHT IN V02 Fig 03]
  warp: 32 threads in lockstep                                                   [TAUGHT IN V02 Fig 37-39]
  streaming multiprocessor, 132 on an H100                                       [TAUGHT IN V02 Fig 24, 36, 44]
  thread block: warps on one SM, sharing its SRAM, run to completion             [COVERED Fig 04]
  grid size decides how much of the chip is busy                                 [COVERED Fig 04, 67]
    a real count (4096x4096 matmul -> 1,024 blocks)                              [MISSING]
  a PyTorch line becomes one launch (0:37)                                       [MISSING]
  launch is asynchronous: the CPU queues work and moves on                       [PARTIAL Fig 05 — said; the queue is never drawn]
  boundary: on-chip state vanishes, so data round-trips through HBM              [COVERED Fig 05, 06, 30]
  what the maths leaves open: threads, bytes, level, order, precision, writes    [MISSING]

2 The two tiers
  byte, bandwidth, latency                                                       [TAUGHT IN V01 Fig 72-76; V02 Fig 07-10]
  HBM 80 GB at 3.35 TB/s                                                         [TAUGHT IN V01 Fig 107; COVERED Fig 08]
  shared memory up to 228 KB per SM, ~10x HBM bandwidth                          [TAUGHT IN V02 Fig 31-32; COVERED Fig 08]
  capacity ratio 30.8 MB : 80 GB = 1 : 2,596                                     [PARTIAL Fig 09 — "drawn honestly", but drawn at 1:100]
  registers 256 KB per SM (where S tiles and accumulators actually live)         [TAUGHT IN V02 Fig 29-30; MISSING here]
  L2, 50 MB shared by all SMs (catches repeated K, V reads)                      [TAUGHT IN V02 Fig 51-52; MISSING here]
  working set                                                                    [COVERED Fig 10, 42 — Fig 10 comes 6 minutes before tiling]

3 Intensity and the roofline, applied to attention
  operation, FLOP vs FLOP/s, multiply-add = 2                                    [TAUGHT IN V01 Fig 61, 111; V02 Fig 05]
  intensity = operations / bytes                                                 [TAUGHT IN V01 Fig 120; COVERED Fig 11]
  log axes; attainable = min(peak, bandwidth x intensity)                        [TAUGHT IN V01 Fig 121-124; V02 Fig 73-74]
  ridge 295 = 989 / 3.35                                                         [TAUGHT IN V01 Fig 126; PARTIAL Fig 11 — "just under 300", axes unlabelled]
  dense matmul is compute-bound                                                  [TAUGHT IN V02 Fig 77]
  naive attention's passes at 63, ~1, 63 FLOP/B; whole kernel 32 FLOP/B          [MISSING]
  time = max(bytes/bandwidth, FLOPs/peak): 162 us vs 17 us                       [MISSING]
  bytes are a scheduling choice, so intensity is a lever                         [COVERED Fig 11, 12 (duplicates)]

4 Fraction of peak, "the number we will track from here on"
  peak vs sustained                                                              [TAUGHT IN V02 Fig 81-82]
  attention FLOPs = 4·n²·d per head                                              [MISSING]
  fraction = achieved FLOP/s / peak FLOP/s                                       [PARTIAL Fig 63, 81 — values only]
  each chip's ceiling: A100 312, H100 989, B200 2,250 TFLOP/s                    [TAUGHT IN V02 Fig 69; not referenced]
  model FLOPs utilisation of a training run, 225/312 = 72%                       [MISSING]
  the track 25-40 -> 50-73 -> 35 (FA2 on H100) -> 75 -> 71%                      [PARTIAL Fig 81 — the 35% dip is absent; ranges drawn as points]

5 Attention: what the kernel computes
  vector, matrix                                                                 [TAUGHT IN V01 Fig 84]
  dot product; matmul = many dot products                                        [TAUGHT IN V01 Fig 85; COVERED Fig 14]
  Q, K, V                                                                        [TAUGHT IN V01 Fig 92; PARTIAL Fig 15-16 — Fig 16 is wrong, §5a]
  transpose                                                                      [COVERED Fig 19]
  S = QKᵀ, n x n                                                                 [COVERED Fig 21, 27]
    scores divided by √d before softmax                                          [MISSING]
  weighted average of values                                                     [TAUGHT IN V01 Fig 93-94; COVERED Fig 21]
  head                                                                           [COVERED Fig 13]
  causal mask                                                                    [TAUGHT IN V01 Fig 132; restated Fig 20]
  quadratic growth                                                               [TAUGHT IN V01 Fig 134; COVERED Fig 26-27]

6 Softmax and the subtracted maximum
  e^x: positive, and it widens gaps                                              [TAUGHT IN V01 Fig 09; COVERED Fig 22]
  divide by the row total                                                        [TAUGHT IN V01 Fig 09; COVERED Fig 23, 25]
  rows are independent                                                           [COVERED Fig 23]
  float fields, range vs precision                                               [TAUGHT IN V02 Fig 86-88]
    FP16 max 65,504 = (2−2⁻¹⁰)·2¹⁵; FP32 max 3.4e38                              [MISSING — Fig 24 gives the value only]
  overflow threshold ln 65,504 = 11.09                                           [COVERED Fig 24]
  subtracting m changes nothing: e^(x−m) = e^x·e^(−m), and e^(−m) cancels        [PARTIAL Fig 25 — stated; no worked row]
    exponent law; same factor top and bottom                                     floor

7 The naive kernel and the cure's name
  a pass over the data                                                           [COVERED Fig 28]
  three kernels, two n x n matrices parked in HBM                                [COVERED Fig 30, 06 (duplicate)]
  tally 4.2 MB vs 537 MB                                                         [COVERED Fig 29, 31 (duplicate)]
  what it costs in time                                                          [MISSING]
  fusion; IO = HBM<->SRAM; IO-awareness                                          [COVERED Fig 33, 07 (misfiled), 32]
  step-through of the three passes                                               [exists: animation steps 1-18, not linked]

8 Tiling
  tile                                                                           [COVERED Fig 34]
  a block of C = sum of block products                                           [PARTIAL Fig 35-36 — said twice, never computed]
  accumulator                                                                    [COVERED Fig 38]
  SRAM as a window; streaming                                                    [COVERED Fig 40-41 (duplicates)]
  working set fits (113 KB at block 128, d 64)                                   [COVERED Fig 42, 47, 48]
  loop order: FA1 K,V outside (O round-trips) vs FA2 Q outside                   [MISSING — Fig 39 vs Fig 49 conflict silently]
  each Q block re-reads K and V: bytes ∝ n/B_r, intensity ≈ B_r                  [MISSING]
    L2 keeps most repeats off HBM                                                [MISSING (VERIFY hit rate)]
  how much is saved                                                              [PARTIAL Fig 43 — a scaling law presented as a count; Fig 03 contradicts it]
    measured: 40.3 -> 4.4 GB (9.2x) and 41.7 -> 7.3 ms (5.7x)                    [MISSING]
  causal tiles skipped (6 of 16 at 200 tokens)                                   [PARTIAL Fig 20 — said; Fig 49 draws all 16]
  step-through                                                                   [exists: animation flash steps, not linked]

9 "Exact": same function, different order of additions
  output equals the three-pass version                                           [COVERED Fig 37, 59]
  float addition depends on order: (2048+1)+1 ≠ 2048+(1+1) in FP16               [MISSING]
  so "identical up to the reordering of floating point sums"                     [MISSING — Fig 59 claims bit-identity]

10 Online softmax
  obstacle: row max and row sum are needed before any weight is final           [COVERED Fig 53-54 (duplicates)]
  running max m and running sum l, two per row                                  [COVERED Fig 55-56]
  correction e^(m_old − m_new)                                                  [COVERED Fig 55, 57]
    e^(x−a)·e^(a−b) = e^(x−b)                                                   [COVERED Fig 59]
      exponent law                                                              floor
    one multiplication repairs the whole sum: c·(a+b+…) = ca+cb+…               [PARTIAL Fig 57-58 — words only, twice]
      distributive law                                                          floor
  the worked row: 1.59 from its scores, x0.135, new terms, equals direct        [PARTIAL Fig 57 — no scores; Fig 59's 28.0124 has no inputs]
  output takes the same factor                                                  [COVERED Fig 55, 57-58]
  final division O/l                                                            [PARTIAL — missing from Fig 55's four lines]
  push a row through tiles yourself                                             [MISSING (widget)]

11 Recomputation (training)
  forward and backward                                                          [COVERED Fig 60]
  store vs rebuild from m and l                                                 [COVERED Fig 61-62 (duplicates)]
  its price: 66.6 -> 75.2 GFLOPs (+13%) and still 5.7x faster                   [MISSING]

12 FA2's three waits
  tensor cores vs CUDA cores, 312 vs 19.5 = 16x                                 [TAUGHT IN V02 Fig 27-28, 78; COVERED Fig 65-66 (duplicates)]
    which unit runs exp (MUFU), which runs max/rescale/divide (CUDA cores)      [PARTIAL Fig 65 — puts exp on CUDA cores]
  keep O unnormalised, divide once                                              [PARTIAL Fig 66 — named only]
  blocks = batch x heads = 32 vs 108 A100 SMs                                   [COVERED Fig 67-68 (duplicates, uses H100's 132)]
    one block per query block -> 2,048 blocks                                   [PARTIAL — no count, loop swap unmentioned]
    occupancy                                                                   [TAUGHT IN V02 Fig 60]
  split-K vs split-Q across warps                                               [COVERED Fig 69-70]
    synchronisation barrier                                                     [MISSING]
  50-73%; 225 TFLOP/s = 72% MFU, "a training number"                            [PARTIAL — MFU and caveat missing]

13 Asynchrony and warp specialisation (Hopper, FA3)
  FA2 on H100 = 35%                                                             [COVERED Fig 71]
  synchronous vs asynchronous                                                   [COVERED Fig 72]
  latency hiding                                                                [TAUGHT IN V02 Fig 55-57]
  TMA                                                                           [TAUGHT IN V02 Fig 35; COVERED Fig 71]
  warpgroup = 4 warps; WGMMA                                                    [PARTIAL Fig 71 — named]
  producer/consumer warps with a buffer                                         [COVERED Fig 73-74 (duplicates)]
  MUFU, a third unit; exp overlapped with matmuls (pingpong)                    [PARTIAL Fig 73 — one sentence]

14 FP8 in FA3
  float fields                                                                  [TAUGHT IN V02 Fig 86-88]
  E4M3 / E5M2 layouts                                                           [COVERED Fig 75]
  their values: 253 / 247, max 448 / 57,344, spacing grows with size            [MISSING]
  FP8 at 2x FP16 rate                                                           [TAUGHT IN V02 Fig 83-85]
  quantise = scale, then round to nearest representable                         [PARTIAL Fig 76]
  one scale per tensor vs per block                                             [PARTIAL Fig 76]
    outliers crush an integer grid; an FP8 grid much less                       [MISSING — Fig 76 tells the integer story]
  rotation preserves dot products                                               [PARTIAL Fig 76 caption — asserted]
    turning an arrow by an angle keeps lengths and angles                       [MISSING] (trig is above the floor)
    (QM)(KM)ᵀ = QMMᵀKᵀ = QKᵀ                                                    [MISSING]
      transpose of a product                                                    [PARTIAL Fig 19]
  Hadamard spreading, and why it cuts error                                     [MISSING]
  2.6x error, 1.5-2.0x over FA2, 740 TFLOP/s = 75%, ~1.2 PFLOP/s                [PARTIAL Fig 76 — 1.5-2.0x missing]

15 Asymmetric scaling and FA4's exponential
  B200 matmul 2.25x H100; MUFU and shared memory unchanged                      [COVERED Fig 77-78 (duplicates)]
  per SM per clock: 8,192 FLOPs vs 16 exponentials                              [COVERED Fig 79 — bar not to scale]
  per score 4d FLOPs vs 1 exp: at d=128, exp time = matmul time on B200         [MISSING]
  polynomial = multiplies and adds                                              [COVERED Fig 80]
  e^x = 2^(x·log2 e) = 2^⌊·⌋ · 2^frac                                           [MISSING]
    2^integer is just the exponent field                                        [MISSING, builds on V02 Fig 86]
    2^frac by a cubic: error 8.7e-5, BF16 step 3.9e-3                           [MISSING]
  only 10-25% of exponentials take the polynomial path                          [MISSING]

16 FA4's conditional rescale
  a rescale costs a vector multiply                                             [PARTIAL Fig 79]
  τ = 8 doublings: rescale only if the max rises by more than 2⁸ = 256x         [MISSING]
    doublings, log2                                                             floor
  why skipping is exact: O and l carry the same stale offset                    [MISSING]
  why it cannot overflow: FP32 accumulators, terms ≤ 256                        [MISSING]
  "~10x fewer" is from a talk; the paper says "significantly"                   [PARTIAL Fig 79 — attribution dropped]

17 FA4's backward pass, tooling, results
  backward is shared-memory bound: 3,328 vs 2,560 cycles per tile               [MISSING]
  TMEM, 256 KB per SM beside the tensor cores                                   [MISSING]
  2-CTA: two blocks share one multiply, each stages half of B                   [MISSING]
  CuTe DSL; compiles 20-30x faster                                              [MISSING]
  >= 4,000 tokens: 1.1-1.3x cuDNN 9.13, 2.1-2.7x Triton                         [COVERED Fig 81]
    cuDNN, Triton                                                               [MISSING]
    no consistent lead below 4,000                                              [MISSING]
  1,605 TFLOP/s ≈ 71%; plateau near ¾; BF16 throughout                          [PARTIAL Fig 81 — fraction only]

18 KV cache size and the heads that set it
  KV cache; formula; 320 KiB/token for Llama 3 70B                              [TAUGHT IN V01 Fig 135-140; restated Fig 82, 88]
  decode rereads the whole cache per token                                      [TAUGHT IN V01 Fig 141; PARTIAL Fig 82]
    2.68 GB -> 0.80 ms per token at 8k; 21.5 GB -> 6.4 ms with 64 KV heads      [MISSING]
  MQA                                                                           [COVERED Fig 89]
    why quality drops (64 questions, one description)                           [PARTIAL Fig 89]
  GQA as a dial; 8 groups                                                       [PARTIAL Fig 89]
  uptraining at 5%                                                              [COVERED Fig 89]

19 Fragmentation and paging
  contiguous worst-case reservation                                             [COVERED Fig 83-84 (duplicates)]
    4,096 reserved, 200 used -> 3,896 empty (95%)                               [MISSING]
  internal and external fragmentation; 20.4-38.2% used                          [COVERED Fig 83]
  virtual memory                                                                [COVERED Fig 85]
    lookup: token 37 -> block 2, offset 5                                       [MISSING]
      division with remainder                                                   floor
  block table; waste ≤ one partial block; 2-4x throughput                       [COVERED Fig 86]
    reclaimed memory becomes batch: 31-58 requests -> 152 in 40 GB              [MISSING]
      amortising a fixed cost over more work                                    [TAUGHT IN V01 Fig 117-118]
  sharing; copy on divergence                                                   [COVERED Fig 87]
    beam search                                                                 [MISSING]
    55% memory saved; 1.3x -> 2.3x throughput                                   [PARTIAL Fig 86 — 55% read as throughput]

20 Multi-head latent attention
  compress, rebuild                                                             [COVERED Fig 90]
  low rank: a big matrix as thin x wide                                         [MISSING]
  32,768 -> 576 = 57x                                                           [COVERED Fig 91]
    = GQA with 2.25 groups                                                      [MISSING]
  arithmetic is spare at decode                                                 [PARTIAL Fig 90]
    decode intensity ≈ 1 FLOP/B                                                 [TAUGHT IN V02 Fig 76]
  absorption: two multiplies in a row = one                                     [PARTIAL Fig 91-92 — asserted]
    associativity (AB)C = A(BC)                                                 [MISSING]
    result: folded decode attention at 242 FLOP/B vs MHA's 1                    [MISSING]
  rotary position embedding                                                     [MISSING]
    position must be encoded                                                    [TAUGHT IN V01 Fig 90]
    rotation by position; dot product depends only on the gap                   [MISSING]
  why RoPE blocks the fold; the 64-wide channel                                 [COVERED Fig 92 (no algebra)]
  93.3% and 5.76x, and what else contributed                                    [PARTIAL Fig 91 — attributed to MLA alone; caveat dropped]

21 Decode and Flash-Decoding
  prefill vs decode                                                             [TAUGHT IN V01 Fig 109-110]
  block count: prefill 2,048 vs decode 32                                       [PARTIAL Fig 94 — decode only]
  one SM walks the whole cache alone                                            [MISSING]
  split the cache; each chunk keeps m, l, partial O                             [COVERED Fig 93-94 (duplicates)]
  the merge, computed                                                           [PARTIAL — described twice, never computed]
  8x / 50x on CodeLlama-34B, 512 -> 64k tokens                                  [PARTIAL Fig 94 — no model or range]
  helps only at long context and small batch                                    [MISSING]

22 Launch overhead and CUDA graphs
  a launch costs a few us of CPU                                                [COVERED Fig 95-96]
  ~10 kernels per layer x 32 layers ≈ 320 per token                             [MISSING]
  the GPU idles only when a kernel is shorter than its launch                   [PARTIAL Fig 95-96 — one lane]
  20-30% at batch 1                                                             [COVERED Fig 95-96]
  capture once, replay; fixed addresses vs paging; prefill gains little         [COVERED Fig 96-97 (duplicates)]

23 Precision, and what stayed fixed
  fewer bits = fewer bytes and more ops per cycle                               [TAUGHT IN V02 Fig 83-85; COVERED Fig 98]
  FP8 on Hopper, FP4 on Blackwell                                               [PARTIAL Fig 98 — no FP4]
  accuracy fails first                                                          [COVERED Fig 98]
  same function, up to rounding                                                 [PARTIAL Fig 99-100 — they claim bit-exactness]
  exceptions: GQA and MLA change the model; FP8 and the polynomial change numerics   [PARTIAL — Fig 99 right, Fig 100 contradicts]
```

---

## 4. Proposed new figures

The list is in video order. "Insert after" uses **current** figure numbers. It assumes the moves in §2 and the merges in §5d. **R** marks an entry that replaces or moves an existing figure rather than adding one. **WIDGET** marks entries that would teach better interactively.

**Animation pointers.** Add a link card at each of these points:
- After the naive-kernel tally (Fig 31): animation `vanilla` steps 1-18.
- After #10: `flash` steps 1-21, one Q block through two K/V blocks.
- At #14: `flash` steps 34-35, where the maximum moves.
- At #17: `flash` step 20/40, "the only division in the whole algorithm".

The animation uses FA2's loop order and counts the K/V re-reads honestly (48 numbers, K and V read twice). That agrees with #11 and disagrees with Fig 03's 4 MB.

### Opening: what a kernel is, and what is being tracked (0:16-2:47)

**1. Insert after Fig 05 (0:21).**
- **Title:** One line of PyTorch is one kernel launch
- **Idiom:** table with a pointer. `C = A @ B` (4096 x 4096) points to one launch, a grid of 32 x 32 = 1,024 blocks of 256 threads = 262,144 threads. `softmax(S)` points to a second launch.
- **Fills:** 1 (PyTorch, a real grid count).
- **Numbers:** `(4096//128)**2 = 1024`; `1024*256 = 262144`. The 128-tile and 256-thread choices are illustrative; say so.

**2. Insert after Fig 03 (0:42), stamp 1:02.**
- **Title:** The mathematics fixes the answer; the kernel decides five things
- **Idiom:** table. Each decision points to the Part where it is exercised:
  - which threads → split-Q (FA2)
  - which bytes, and from which level → tiling
  - in what order → loop order, online softmax
  - at what precision → FP8 (FA3), BF16 (FA4)
  - where results are written → the O accumulator, S never written
- **Fills:** 1 (the video's thesis). No numbers.

**3. Insert after #2, stamp 1:44.**
- **Title:** Fraction of peak is operations done per second over operations possible
- **Idiom:** equation built up.
  - Attention FLOPs per head = 4·n²·d (two matmuls x 2 per multiply-add, V01 Fig 111).
  - Worked: 32 heads, n = 8,192, d = 128 gives 1.10 TFLOP. At FA3's 740 TFLOP/s that takes 1.49 ms; 740/989 = 74.8%.
  - A preview strip of the track: 25-40 → 50-73 → 35 → 75 → 71%.
- **Fills:** 4.
- **Numbers:** `32*4*8192**2*128 = 1.0995e12`; `/740e12 = 1.486 ms`; `740/989 = 0.748`.

**4. Insert after #3, stamp 2:26.**
- **Title:** Six levers, one target: fewer bytes, or cheaper ones
- **Idiom:** table mapping the video's own list (2:26, repeated at 46:04) to Parts:
  - kernel intermediates (FA1-4)
  - cache size (GQA, MLA)
  - cache layout (paging)
  - parallel cache reads (Flash-Decoding)
  - launch cost (CUDA graphs)
  - number width (quantization, the next atlas)
- **Fills:** navigation. No numbers.

### The roofline, applied (4:19)

**5. Insert after Fig 11 (merged with 12), stamp 4:19. WIDGET (sliders for n, d, block height).**
- **Title:** The naive passes sit far left of the ridge; the fused kernel can sit far right
- **Idiom:** log-log roofline (V01 Fig 121-126) with labelled points for one head (n = 8,192, d = 64, FP16):
  - QKᵀ pass: 63 FLOP/B
  - softmax pass: ~1.25 FLOP/B (assuming ~5 operations per score)
  - PV pass: 63 FLOP/B
  - whole naive kernel: 31.8 FLOP/B
  - fused kernel with every byte moved once: 4,096 FLOP/B
  - fused kernel if each 128-row Q block re-read K and V from HBM: 126 FLOP/B (links to #11)
  - ridge: 295
- **Fills:** 3.
- **Numbers (verify1.py):**
  - `2n²d/(2·n·d·2+2n²) = 63.0`
  - `4n²d/541.07e6 = 31.75`
  - `4n²d/4.194e6 = 4096`
  - `989/3.35 = 295.2`

### Softmax, numerically (6:41-7:03)

**6. Insert after Fig 24 (6:20), stamp 6:41.**
- **Title:** FP16 runs out at 65,504, FP32 at 3.4 x 10³⁸
- **Idiom:** bit layout, at the same pixels-per-bit as Fig 75. FP16 is 1/5/10 bits, with largest value (2−2⁻¹⁰)·2¹⁵ = 65,504, so e^x overflows above ln 65,504 = 11.09. FP32 overflows above ln(3.4e38) = 88.7, which is why kernels hold scores and exponentials in FP32 (FA3 §4.3: "intermediate results (softmax) are kept in FP32").
- **Fills:** 6 (FP16 maximum derived).
- **Numbers:** `(2-2**-10)*2**15 = 65504`; `ln = 11.0899`; `ln(3.4028e38) = 88.72`.

**7. Insert after Fig 25 (6:20), stamp 7:03.**
- **Title:** Subtracting the maximum, on one row of scores
- **Idiom:** equation built up.
  - Row [8, 10, 12]: e¹² = 162,755, which is infinity in FP16.
  - After subtracting 12: e^(x−12) = [0.0183, 0.1353, 1], summing to 1.1537, giving weights [0.0159, 0.1173, 0.8668], identical to the float64 direct result.
  - One algebra line: e^(x−m) = e^x · e^(−m), and the e^(−m) cancels top and bottom.
- **Fills:** 6 (cancellation, worked). This is the floor under online softmax.
- **Numbers:** verify5.py.

### The naive kernel in time (9:04)

**8. Insert after Fig 31 (8:56), stamp 9:04.**
- **Title:** 541 MB at 3.35 TB/s takes 162 µs; the arithmetic needs 17
- **Idiom:** bars to scale, in microseconds. Naive: memory 161.5 µs vs compute 17.4 µs. Fused at the 4.2 MB minimum: memory 1.25 µs vs 17.4 µs.
- **Fills:** 3, 7 ("memory-bound" as a computation).
- **Numbers:** `541.07e6/3.35e12 = 161.5 µs`; `17.18e9/989e12 = 17.4 µs`; `4.194e6/3.35e12 = 1.25 µs`.

### Tiling, done honestly (10:40-11:20): one build-up

**9. Insert after Fig 36 (merged with 35), stamp 10:40.**
- **Title:** One block of a product, computed from two strips
- **Idiom:** equation with small grids. A = [[1,2,0,1],[0,1,3,2],[2,0,1,1],[1,1,0,2]], B = [[1,0,2,1],[0,1,1,0],[1,2,0,1],[2,1,1,0]]. Then C₁₁ = A₁₁B₁₁ + A₁₂B₂₁ = [[1,2],[0,1]] + [[2,1],[7,8]] = [[3,3],[7,9]], which is the top-left of the full product.
- **Fills:** 8 (block decomposition, how).
- **Numbers:** verify5.py, `array_equal → True`.

**10. Insert after Fig 38 (10:50), stamp 10:56. R: Fig 39 leaves this spot (see #18).**
- **Title:** In the first version, the output makes a round trip for every block of K and V
- **Idiom:** loop diagram with bars to scale. Outer loop over K,V blocks, inner loop over Q blocks. Qᵢ, Oᵢ, mᵢ, lᵢ are loaded from HBM and written back on every inner step (FA1 Algorithm 1 lines 5-13; the video's order at 10:52).
- **Traffic** at n = 8,192, d = 64, blocks of 128, O stored at 2 bytes:
  - K and V read once: 2.1 MB
  - Q read 64 times plus O read and written 64 times: ≈ 203 MB
  - compare naive 541 MB and the 4.2 MB minimum
- **Fills:** 8 (loop order). It also explains Fig 49.
- **Numbers:** verify1.py, `2nd·2 + 64·3nd·2 = 203.4 MB`.

**11. Insert after #10, stamp 11:01.**
- **Title:** Every block of queries reads all of K and V, so intensity is about the block height
- **Idiom:** equation built up, then bars.
  - Bytes ≈ (n/B_r)·2·n·d·2; FLOPs = 4n²d; so FLOPs per byte ≈ B_r.
  - At B_r = 128 that is 136 MB and 126 FLOP/B, below the ridge, *if* every repeat came from HBM.
  - The repeats mostly hit the 50 MB L2 (V02 Fig 51-52), because one head's K and V are only 2.1 MB here (VERIFY hit rate with a profiler).
  - This is what reconciles Fig 03 (4 MB) with Fig 43 (24x).
- **Fills:** 8 (re-reads, L2, block size).
- **Numbers:** verify1.py, `FA2 B_r=128: 136.3 MB, intensity 126`; `2*8192*64*2 = 2.1 MB`.

**12. Insert after Fig 52 (worked prefill, restamped 11:10), stamp 11:20.**
- **Title:** Exact, up to the order of additions
- **Idiom:** number line with ticks. FP16 near 2,048, ticks every 2: (2,048+1)+1 = 2,048, but 2,048+(1+1) = 2,050. Then a two-row table: streaming vs direct softmax-weighted sums in FP32 differ in 158 of 200 random 4,096-score rows, by at most 9.4 x 10⁻⁶ relative.
- **Fills:** 9.
- **Numbers:** verify5.py (`np.float16`); verify2.py (`158 of 200, 9.42e-06`).

### Online softmax to the floor (12:45-13:47): one build-up on a single row reused later

**13. Insert after Fig 56 (12:11), stamp 12:45.**
- **Title:** The 1.59, built from three scores
- **Idiom:** ledger table. Tile 1 has scores 3, 2, 1.5. Then e^(x−3) = 1, 0.3679, 0.2231, so l = 1.591 (the video's 1.59). With values 10, 20, 30, the running output is O = 24.05. (The scores are chosen so the row reproduces 1.59.)
- **Fills:** 10 (worked row).
- **Numbers:** verify2.py.

**14. R: replaces Fig 58's drawing, stamp 13:05.**
- **Title:** Multiply the sum, and every term inside it moves
- **Idiom:** equation built up. 1.591 x e⁻² = (e⁰ + e⁻¹ + e^−1.5)·e⁻² = e⁻² + e⁻³ + e^−3.5 = 0.1353 + 0.0498 + 0.0302 = 0.2153. Two floor facts, each labelled: adding exponents, and the distributive law.
- **Fills:** 10 (distributivity, exponent law).
- **Numbers:** verify2.py, `l1*c = 0.2153 = sum e^(x-5)`.

**15. Insert after #14, stamp 13:47.**
- **Title:** The output takes the same factor, and one division at the end gives the answer
- **Idiom:** the ledger continued. Tile 2 has scores 5, 4, 1 and values 40, 50, 60.
  - Output: O = 24.05·0.1353 + (40 + 50·0.3679 + 60·0.0183) = 3.255 + 59.49 = 62.75.
  - Sum: l = 0.2153 + 1.386 = 1.6015.
  - Answer: 62.75/1.6015 = 39.18, the same as computing all six at once.
- **Fills:** 10 (output rescale, final division, exactness).
- **Numbers:** verify2.py, `out 39.18035943419077 vs direct …078`.

**16. WIDGET, after #15, stamp 12:45.**
- **Title:** Push one row through the tiles
- **What it does:** editable scores (including a 1,000), values and tile width; shows m, l, O and the correction at each step, plus the direct answer and the difference. A toggle applies FA4's "skip unless the max rises by more than 8 doublings" (#27). Verify in Python first and say so on the page.
- **Fills:** 10, 16.
- **Numbers:** as #13-15, #27.

### FlashAttention 2 (17:49-19:58)

**17. Insert after Fig 66 (merged with 65), stamp 17:49.**
- **Title:** Divide once, at the end
- **Idiom:** side-by-side update rules.
  - FA1: Oᵢ ← diag(l_new)⁻¹(diag(l)·e^(m−m_new)·Oᵢ + e^(S−m_new)V), one normalisation per K,V block (FA1 Algorithm 1 line 12).
  - FA2: Õ ← e^(m−m_new)·Õ + e^(S−m_new)V, and O = Õ/l once (FA2 §3.1.1).
  - On the #13-15 row: normalised running output 15.12 vs unnormalised 24.05 after tile 1; both end at 39.18.
  - Count: 64 normalisations per row at n = 8,192 with blocks of 128, against 1.
- **Fills:** 12.
- **Numbers:** `24.05/1.591 = 15.12`; `8192/128 = 64`.

**18. R: Fig 39 moved here and extended, after Fig 68 (merged with 67), stamp 18:49.**
- **Title:** Swapping the loops keeps the output on chip and gives every query block its own thread block
- **Idiom:** Fig 39's SRAM drawing as FA2's arrangement, beside an SM grid like Fig 94's. FA1: batch 2 x 16 heads = 32 blocks on 108 A100 SMs. FA2 at n = 8,192, B_r = 128: 32 x 64 = 2,048 blocks. FA2 §3.2: "swapping the order of the loop (outer loop over row blocks and inner loop over column blocks…)".
- **Fills:** 8, 12.
- **Numbers:** `2*16*64 = 2048`; 108 SMs (FA2 §2.1).

**18a. Insert after Fig 70 (merged with 69), before #19, stamp 19:15.**
- **Title:** A barrier makes every warp wait for the slowest
- **Idiom:** lane chart. Split-K: warps w1-w4 finish their partial sums at different times, a vertical barrier line holds all of them until the last arrives, then a shared-memory exchange follows. Split-Q: each warp runs straight through to its own output rows. Durations schematic.
- **Fills:** 12 (synchronisation barrier; not taught in V01 or V02). It is what "before anything could finish" (19:05) means.
- **Numbers:** none.

**19. Insert after #18a, stamp 19:58.**
- **Title:** Seventy-two percent of a whole training run
- **Idiom:** one bar to scale against the 312 TFLOP/s ceiling: 225/312 = 72.1%. Define model FLOPs utilisation. Keep the presenter's caveat: "a training number rather than an inference one".
- **Fills:** 4, 12.
- **Numbers:** `225/312 = 0.7212` (FA2 abstract).

### Hopper and FP8 (20:50-24:07)

**20. Insert after Fig 71 (20:28), stamp 20:50.**
- **Title:** A warpgroup is four warps issuing one matrix multiply
- **Idiom:** nested containers: thread → warp (32) → warpgroup (4 warps, 128 threads) → thread block → cluster (pairs used in FA4) → grid (hierarchy as in FA4 §2). WGMMA is issued by a warpgroup and returns at once.
- **Fills:** 13.
- **Numbers:** `4*32 = 128`.

**21. Insert after Fig 74 (merged with 73), stamp 22:20.**
- **Title:** Three units busy at once
- **Idiom:** three-lane timeline. The TMA loads tile j+2. The tensor cores run PV of tile j, then QKᵀ of tile j+1. The MUFU computes the exponentials of tile j+1. Two warpgroups alternate ("pingpong", FA3 §3.1). Durations schematic; say so.
- **Fills:** 13 (MUFU introduced; ASR "MoFu" becomes MUFU).
- **Numbers:** none beyond the video.

**22. Insert after Fig 75 (22:52), stamp 23:12.**
- **Title:** E4M3 holds 253 values, packed tight near zero and sparse near 448
- **Idiom:** number line on a log axis (V01 Fig 121): 7 subnormals from 2⁻⁹, then 8 values per doubling from 2⁻⁶ up to 448 (7 in the last doubling, whose top code is NaN). E5M2 beneath: 247 values up to 57,344.
- **Fills:** 14.
- **Numbers:** verify3.py (126 positive E4M3 values, 2·126+1 = 253; E5M2 123 → 247).

**23. Insert after #22, stamp 23:29.**
- **Title:** One scale per tensor crushes an integer grid; an FP8 grid survives it
- **Idiom:** small multiples, histogram over a tick line (design.md), on two grids. An outlier 100x the typical value sets the scale on each.
  - INT8: typical values land on 1 positive level.
  - E4M3: typical values keep 72 of its 126 positive codes, each with up to 6.25% rounding error.
- **Fills:** 14 (quantise, scale, why the outlier story differs).
- **Numbers:** verify3.py (`72 of 126`; INT8 `int(127/100) = 1`; `2**-4 = 0.0625`).

**24. Insert after #23, stamp 24:07.**
- **Title:** A rotation turns arrows without changing the angle between them
- **Idiom:** two arrows on a plane. Turn q = (3,4) and k = (1,2) by 30°: the dot product is 11 before and after, and the lengths stay 5. Then the algebra (QM)(KM)ᵀ = Q·M·Mᵀ·Kᵀ = QKᵀ, because MMᵀ = I (FA3 §3.3). Cos and sin are built as the coordinates of a turned point, since trigonometry is above the floor.
- **Fills:** 14.
- **Numbers:** verify3.py. V04 Figs 66-68 draw the same idea; reuse their style.

**25. Insert after #24, stamp 24:07.**
- **Title:** Spreading an outlier channel across all 128 lets rounding errors cancel
- **Idiom:** small multiples.
  - Hadamard on 4 numbers: (10,0,0,0) → (5,5,5,5) and (10,1,−1,1) → (5.5,3.5,5.5,5.5). At d = 128 a spike s becomes ±s/11.3.
  - Bars of the 128 products inside one score. Before rotation, two tall bars dominate and their FP8 errors don't average. After, 128 comparable bars.
  - Simulation with two channels 20x larger, per-tensor E4M3, d = 128: score error 3.7% → 0.56% (6.6x). With scattered outliers, rotation does nothing for the scores (also 3.7%).
  - The paper's end-to-end figure is 2.6x (its own test).
- **Fills:** 14.
- **Numbers:** verify3.py, fp8sim.py (`channel: 0.0372 → 0.0056`; `fa3-test: 0.0375 → 0.0374`).

### FA4: the 25:57-29:47 gap

**26. R: replaces Fig 79's bars, stamp 26:21.**
- **Title:** On a 128-wide tile, the exponentials now take as long as both matrix multiplies
- **Idiom:** small multiples, bars to scale in cycles per SM.
  - H100: matmul 4·128³/4,096 = 2,048, exponentials 128²/16 = 1,024. Exponentials take half the matmul time (FA3: "exponential can take 50% of the cycle compared to matmul").
  - B200: matmul 1,024, exponentials 1,024 (a tie), shared memory 768 (FA4 Table 1). Do not reuse 768 for the H100: its 64-wide MMA tiles read operands differently (VERIFY).
  - This is what the video's 512 means: 8,192/16 = 512 = 4d at d = 128.
- **Fills:** 15.
- **Numbers:** verify4.py.

**27. R: rebuilds Fig 80, stamp 26:48.**
- **Title:** e to any power is a power of two times a short polynomial
- **Idiom:** equation built up.
  - Worked: e^1.7 = 2^2.4526 = 2² x 2^0.4526 = 4 x 1.3685 = 5.4739.
  - 2² is written straight into the exponent field (V02 Fig 86).
  - 2^0.4526 comes from 1 + 0.6951f + 0.2276f² + 0.0771f³. Max relative error is 8.7 x 10⁻⁵, about 45x below BF16's own rounding step of 2⁻⁸.
  - Only 10-25% of each row's exponentials take this path; the rest stay on MUFU (FA4 §3.1.3, Cody-Waite).
- **Fills:** 15.
- **Numbers:** verify3.py (least-squares cubic; the paper's minimax cubic gives 8.77e-5); `2**-8/8.66e-5 = 45`.

**28. Insert after #27, stamp 27:23. Also a toggle in WIDGET #16.**
- **Title:** Skipping the rescale gives the same answer
- **Idiom:** small multiples: the #13-15 ledger beside a stale-max ledger.
  - The max rises 3 → 5, which is 2 nats = 2.89 doublings, under τ = 8 (2⁸ = 256). So FA4 keeps m = 3.
  - Tile-2 terms become e², e¹, e⁻² = 7.39, 2.72, 0.135, all ≤ 256.
  - l = 11.83 and O = 463.6, so O/l = 39.18, identical.
  - Overflow is impossible: FP32 accumulators reach 3.4 x 10³⁸.
  - Keep the presenter's attribution: the paper says "significantly", and "around 10 times fewer rescales" comes from Tri Dao's Hot Chips talk.
- **Fills:** 16.
- **Numbers:** verify2.py (`stale-max out 39.18…, diff 0.0`); `2/ln 2 = 2.885`.

**29. Insert after #28, stamp 28:06.**
- **Title:** The copy engine moves data; tensor memory keeps it
- **Idiom:** Blackwell SM floor plan, extending V02 Fig 36: registers, shared memory, TMEM 256 KB wired to the tensor cores (the MMA writes its result there asynchronously instead of into registers), and the TMA.
- **Fills:** 17.
- **Numbers:** TMEM 256 KB (FA4 §2; video 28:11). B200 register-file and shared-memory sizes: VERIFY (H100: 256 KB and 228 KB, V02 Fig 30-31).

**30. Insert after #29, stamp 28:28.**
- **Title:** Two thread blocks, one multiply, half the staging
- **Idiom:** small multiples.
  - 1-CTA: each SM stages all of operand B.
  - 2-CTA: each stages half, and the hardware reads both halves (FA4 §2).
  - Backward cycle bars per 128³ tile (FA4 Table 3): matmul 2,560; shared memory 3,328 (1-CTA, 30% over) → 2,688 (2-CTA, 5% over); the dQ term 1,024 → 512.
  - Note: the video's "roughly halve" matches the halved terms; the paper's total falls 19%. VERIFY what the video's figure refers to.
- **Fills:** 17.
- **Numbers:** `3328/2560 = 1.30`; `2688/2560 = 1.05`; `2688/3328−1 = −0.192`.

**31. Insert after #30, stamp 28:52.**
- **Title:** The compiler's speed sets the pace of every experiment
- **Idiom:** lane chart (schematic) of an edit → compile → run → measure loop, with compile time 25x shorter, so many more iterations fit in an afternoon. CuTe DSL (ASR "QDSL") is NVIDIA's Python-embedded kernel language, against C++ templates.
- **Fills:** 17.
- **Numbers:** 20-30x (video; FA4 abstract). Iteration times schematic.

### KV cache and paging (31:16-33:52)

**32. R: replaces Fig 84 (a duplicate of 83), stamp 31:16.**
- **Title:** A reservation sized for the longest answer is 95% empty when the answer is short
- **Idiom:** a 4,096-cell bar to scale with 200 cells filled: 3,896 empty = 95.1%. Beside it, the measured systems: 20.4-38.2% used.
- **Fills:** 19.
- **Numbers:** `3896/4096 = 0.951`.

**33. Insert after Fig 86 (32:13), stamp 32:36.**
- **Title:** Finding token 37 takes one division and one lookup
- **Idiom:** table with a pointer. With 16-token blocks, 37 ÷ 16 = block 2, remainder 5. Table[2] = physical block 9, so the slot is 9·16+5 = 149. The waste bound: 200 tokens use 13 blocks with 8 empty slots (3.8%).
- **Fills:** 19.
- **Numbers:** verify4.py, verify5.py.

**33a. Insert after #33, before Fig 87, stamp 33:17.**
- **Title:** Wasted cache is lost batch: the same 40 GB holds 31-58 requests, or 152
- **Idiom:** bars to scale, requests that fit. 2,000-token requests at 128 KiB per token (the Llama-3-8B shape of Fig 51) take 262 MB each. An illustrative 40 GB cache budget fits 152 when every slot holds a token, 58 at 38.2% use, and 31 at 20.4%. That is 2.6-4.9x more requests, against the measured 2-4x throughput (throughput grows more slowly than batch; V01 Fig 118 for amortising).
- **Fills:** 19 (reclaimed memory becomes throughput, 33:17).
- **Numbers:** `128*1024*2000 = 262.1 MB`; `40e9/262.1e6 = 152.6`; `x0.382 = 58.3`; `x0.204 = 31.1`. The 40 GB budget is illustrative; say so.

**34. Insert after Fig 87 (restamped 33:38), stamp 33:52.**
- **Title:** Beam search keeps several answers alive, and their shared beginning is stored once
- **Idiom:** tree of candidates (width 3) over a shared prefix. Block tables point into it; a block is copied on first write; reference counts free blocks.
- **Results** (vLLM §6, OPT-13B, Alpaca): 37.6-55.2% memory saved by sharing on beam search; throughput 1.3x on basic sampling rising to 2.3x at beam width 6 (vs Orca Oracle).
- **Fills:** 19.
- **Numbers:** quoted from the paper text.

### Fewer KV heads, and MLA (35:08-40:25)

**35. Insert after Fig 88 (34:30), stamp 35:08.**
- **Title:** Every new token rereads the whole cache, so head count is a bandwidth bill
- **Idiom:** bars to scale per generated token, one 8,192-token sequence on Llama 3 70B (formula from V01 Fig 138-141). GQA-8: 2.68 GB, 0.80 ms at 3.35 TB/s. 64 KV heads: 21.5 GB, 6.4 ms.
- **Fills:** 18 (Shazeer's argument, in numbers).
- **Numbers:** `2*80*8*128*2*8192 = 2.684e9 → 0.801 ms`; `x8 → 6.41 ms`.

**36. Insert after Fig 90 (restamped 37:09), stamp 37:29.**
- **Title:** A big matrix that is really two thin ones
- **Idiom:** grids. A rank-1 4x4 = column (1,2,3,4) x row (2,0,1,3): 16 numbers from 8. Then MLA: a 512-number latent per token times one fixed 16,384 x 512 up-projection yields the 16,384 key numbers (128 heads x 128). Store 512, not 16,384.
- **Fills:** 20 (low rank).
- **Numbers:** verify5.py (`rank 1`, `16 vs 8`).

**37. Insert after Fig 91 (restamped 37:29), stamp 38:54.**
- **Title:** Two multiplies in a row are one multiply
- **Idiom:** equation with small integer matrices. q·k with k = W_UK·c equals x·((W_Qᵀ·W_UK)·c): −12 = −12. So W_UK folds into the query side once, ahead of time, and W_UV into the output side (DeepSeek-V2 §2.1.2).
- **Fills:** 20 (associativity).
- **Numbers:** verify3.py.

**37a. Insert after #37, stamp 39:16.**
- **Title:** After folding, every cached byte feeds all 128 heads
- **Idiom:** points on a log intensity axis with the 295 ridge marked. Decode attention: MHA 1 FLOP/B, GQA with 64 query heads per 8 KV heads 8 FLOP/B, folded MLA 242 FLOP/B.
- **Derivation:** per cached token per layer, each of 128 heads does a 576-long score dot product and a 512-long output accumulation in latent space. That is 1,088 multiply-adds = 2,176 FLOPs per head, so 278,528 FLOPs on 1,152 cached bytes (BF16). This turns "decode leaves the tensor cores mostly idle anyway. MLA spends that idle arithmetic" (38:34) into a number.
- **Fills:** 20.
- **Numbers:** `2*(576+512)*128 = 278528`; `/1152 = 241.8`; MHA `2*(128+128)/(2*128*2) = 1.0`. Assumes the folded form (DeepSeek-V2 §2.1.2) and batch 1, and ignores softmax and the per-head output projection.

**38. Insert after #37a, stamp 39:42.**
- **Title:** Rotary position turns each query and key by an angle set by its position
- **Idiom:** arrows on a plane, then an equation.
  - Rotate q by m·ω and k by n·ω (ω = 0.5 rad per position here). The dot product is −1.2169 for positions (2,5), (10,13) and (0,3): only the gap matters.
  - Why it blocks the fold: Wᵀ_Q·R_(n−m)·W_UK changes for every pair of positions, so no single merged matrix exists (DeepSeek-V2 §2.1.3).
  - Fig 92 then explains the 64.
- **Fills:** 20.
- **Numbers:** verify3.py.

**39. Insert after Fig 92 (restamped 39:42), stamp 40:25.**
- **Title:** The 93.3 percent has three sources
- **Idiom:** bars to scale, bytes per token.
  - DeepSeek 67B (8 KV heads, 95 layers, 16-bit): 194,560 numbers = 389 KB.
  - DeepSeek-V2 MLA (576 x 60 layers) at 16-bit: 69 KB, i.e. −82.2%.
  - With the ~6-bit cache V2 actually deployed: 25.9 KB, i.e. −93.3%.
  - The 5.76x was also measured with FP8 weights.
  - Keep "That last claim is one to read carefully" (40:38).
- **Fills:** 20.
- **Numbers:** verify4.py, `1−34560*6/(194560*16) = 0.9334`; DeepSeek LLM Table 2 (95 layers, 8 KV heads); DeepSeek-V2 deployment paragraph.

### Decode (41:45-42:51)

**40. Insert after Fig 94 (merged with 93; 42:07), stamp 41:45.**
- **Title:** Without splitting, one multiprocessor walks the whole cache alone
- **Idiom:** lane chart (schematic durations, verified counts).
  - Unsplit: 32 busy SMs each walk 64 tiles of an 8,192-token cache while 100 idle.
  - Split into 16 chunks of 512: 512 blocks ≈ 3.9 waves over 132 SMs, 4 tiles each.
  - The condition (43:54): at batch 8, 8 x 32 = 256 blocks already exceed 132 SMs, so splitting adds little.
- **Fills:** 21.
- **Numbers:** `8192/128 = 64`; `16*32/132 = 3.88`; `8*32 = 256`.

**41. Insert after #40, stamp 42:51.**
- **Title:** Merging two chunks is the online-softmax correction, applied once
- **Idiom:** equation, reusing the #13-15 row split in two.
  - Chunk A: m = 3, l = 1.591, answer 15.12. Chunk B: m = 5, l = 1.386, answer 42.92.
  - Weights: 1.591·e⁻² = 0.2153 and 1.386, which become shares of 0.134 and 0.866.
  - 0.134·15.12 + 0.866·42.92 = 39.18, the full-row answer.
- **Fills:** 21.
- **Numbers:** verify2.py.

### Launches (44:28-45:03)

**42. Insert after Fig 95 (merged with 96-97; 44:18), stamp 44:28.**
- **Title:** One token takes hundreds of launches
- **Idiom:** table of the video's per-layer list: QKV, rotary, attention, combine heads, two FFN, and a few add/norm steps, about 10 per layer. x 32 layers ≈ 320 launches. At 3-5 µs each that is 1.0-1.6 ms of CPU time per token. Mark the counts and times illustrative ("a few microseconds", "a few more").
- **Fills:** 22.
- **Numbers:** `10*32 = 320`; `320*3e-3 to 320*5e-3 ms`.

**43. Insert after #42, stamp 45:03. WIDGET (slider: kernel duration vs launch cost).**
- **Title:** The GPU starves only when its kernels are shorter than their launches
- **Idiom:** two-lane timeline, CPU queuing and GPU executing. Long kernels: the queue never empties. Few-µs kernels: gaps of (launch − kernel) per kernel. Idle share = max(0, L−K)/L. Schematic, against the video's 20-30%.
- **Fills:** 22.
- **Numbers:** formula only.

**Totals.** 46 entries (#1-43 plus 18a, 33a, 37a). That is 41 net-new figures plus 5 rebuilds or moves: #14 (Fig 58), #18 (Fig 39 moved), #26 (Fig 79), #27 (Fig 80), #32 (Fig 84). One entry is a widget (#16); #5 and #43 would also teach better as widgets.

---

## 5. Problems in existing figures

### 5a. Factual and numeric errors

1. **Fig 27: "S is 128 times larger than all three combined".**
   - Wrong. 8,192²/(8,192·64) = 128 is S against *one* of Q, K, V; against all three it is n/(3d) = 42.7.
   - Fix the sentence.

2. **Fig 03: "Why a 135-fold saving gives 7.6 times".** Three problems:
   - The atlas's own numbers give 541.07/4.19 = 129, not 135 (540/4 is a rounding artefact).
   - 4.2 MB is the minimum possible traffic, not what the tiled kernel moves (see #10-11).
   - 7.6x was measured on GPT-2 (FA1 Fig 1), not on this 8,192-token head. The same paper measured, for GPT-2 medium (seq 1,024, d 64, 16 heads, batch 64, A100, fwd+bwd): HBM traffic 40.3 → 4.4 GB (9.2x), runtime 41.7 → 7.3 ms (5.7x), FLOPs 66.6 → 75.2 G (+13%).
   - Fix: rebuild with those three bar pairs as "A 9-fold cut in traffic gave a 5.7-fold speed-up". Keep the caption's (correct) lesson, and drop "the video's next question".

3. **Fig 39 vs Fig 49: two loop orders, unremarked.**
   - Fig 39 says the output "is written to HBM exactly once when the inner loop ends". That is true only for FA2's order (Q outside).
   - Fig 49 describes FA1's order (K,V outside), where Oᵢ is read and written every inner step (FA1 Algorithm 1 lines 8, 12, 13).
   - Fix: #10 at 10:56, and Fig 39 moved to FA2 as #18.

4. **Fig 43: "roughly 24 times less traffic, which is what a direct byte count gives".**
   - No direct count gives 24x. For Fig 42's own setting, a count gives 136 MB (FA2 order) or 203 MB (FA1 order) without cache reuse.
   - Θ(N²d²/M) is a scaling law with constants dropped, and the paper writes M as "around 100KB".
   - "naive ~ 4n²" is labelled bytes but counts elements (8n² bytes in FP16).
   - Fix: present M/d² as how the saving *scales*, and cite the measured 9.2x.

5. **Fig 16 (and Fig 15 caption): Q, K, V "were never sitting in memory waiting to be fetched".**
   - Wrong for the attention kernel. The projection is a separate kernel ("One makes the queries, keys, and values… One runs the attention itself", 44:28). Its output is written to HBM and read by attention; that read is the 4 MB in Figs 29/31, and K, V are the KV cache in Fig 18.
   - Fix: "computed from the weights by the kernel before, then read by the attention kernel".

6. **Fig 59: "Identical to the last digit that floating point can express", with the number 28.012368407149 and no inputs.**
   - The video says "identical up to the reordering of floating point sums". In FP32, 158 of 200 random rows differ (max 9.4e-6 relative).
   - Fix: say "up to rounding in the last bits", show #13-15's row, and add #12.

7. **Fig 99 / Fig 100: exactness.**
   - Fig 99: "not one of them changes a single arithmetic result" overclaims (float reordering; FA4's polynomial matches hardware "within 1 BF16 ULP", FA4 §3.1.3).
   - Fig 100 lists "fewer KV heads" inside "The function never changed… none of them changes the arithmetic". That contradicts Fig 99 and the video: "Grouping and latent compression were the exception. They shrank the cache by changing the model itself" (48:56).
   - Fig 100 says "same operations", which is false for recomputation (+13% FLOPs) and the polynomial.
   - Its list (tiling, recomputation, warp specialisation, paging, fewer KV heads, splitting, graph replay) differs from the video's recap (tiling, online softmax, asynchrony, polynomial, paging, splitting, graph replay; exceptions GQA and MLA).
   - Fix: a two-column table, "same function up to rounding" vs "different model or different numbers (GQA, MQA, MLA, FP8)".

8. **Fig 48: "take the largest that still fits. Take 64."**
   - Block 128 needs 193 KiB < 228 KiB, so the stated rule picks 128.
   - Fix: pick 128 (2x2 tiles), or give the reason for 64 (room for a second block or double-buffering; VERIFY which is intended).

9. **Fig 49: all 16 tiles drawn.**
   - With the causal mask, only 10 of 16 are computed (6 lie above the diagonal), and the last block holds 8 tokens (200 = 3·64 + 8).
   - Fix: grey out 6 tiles and narrow the last row and column.

10. **Fig 20: "At 8,192 tokens exactly half".**
    - The masked share is n(n−1)/2 / n² = 49.99%; the drawn 6x6 masks 42%.
    - Fix: "just under half". Mark it a recap of V01 Fig 132.

11. **Fig 65: "Exponentials, maximums and divisions run on the ordinary units".**
    - Exponentials run on the multi-function unit (FA3 §3.1: "the exponential is performed by a separate hardware unit (the multi-function unit)"). The atlas's own Figs 73 and 79 say so.
    - Fix: "maximums, rescales and divisions on the CUDA cores; exponentials on the even scarcer MUFU".

12. **Fig 69 caption: "none of them changed a single arithmetic operation".**
    - Fix one *removes* operations (FA2 §3.1.1: "two minor tweaks to reduce non-matmul FLOPs"), contradicting Fig 66.
    - Fix: "none changed the result".

13. **Figs 67/68: "132 multiprocessors… a hundred sit idle" in an A100 context** (Fig 66 says A100).
    - The A100 has 108 SMs (FA2 §2.1), so 76 sit idle.
    - Fix: use 108, or say "on an H100". The video says "over a hundred".

14. **Fig 76: "if the extremes are a hundred times the typical value, almost everything lands on the first tick or two".**
    - That is the integer-grid behaviour (1 positive INT8 level). E4M3 keeps 72 of 126 positive codes for the typical range.
    - No ticks are drawn, though the argument depends on them.
    - The FP8 damage is different: with channel-aligned outliers, a few large products dominate each score, and their ~4% rounding errors don't average. Rotation cut score error 6.6x in fp8sim.py.
    - Fix: #22-25, and keep Fig 76 for results. Add the missing "1.5-2.0x over FlashAttention-2" (24:32).
    - Fig 75's "256 distinct values" should be "256 bit patterns, 253 values".

15. **Fig 79: 16 vs 8,192 drawn as 6 px vs 340 px** (57:1 for a 512:1 ratio; the true small bar is 0.66 px), and not labelled schematic.
    - "on a wide enough tile the special-function unit cannot keep up" misstates the mechanism. Tile width is irrelevant; head dimension sets it (#26).

16. **Fig 09: "The two tiers, drawn honestly" / caption "Drawn to scale".**
    - Drawn 3 px vs 300 px (1:100); the truth is 1:2,596.
    - Fix: areas (a 300 px square vs a 5.9 px square).
    - Figs 08/09 also say "roughly 30 MB" vs "about 31 MB"; 132 x 228 KiB = 30.8 MB.

17. **Fig 31: the Total bar (540 MB, 340 px) is not on the components' scale** (268 MB = 321.6 px implies 648 px).
    - Fix: scale everything to the total (components 168.7 px).

18. **Fig 91: "The cache shrinks 93.3 percent and maximum generation throughput rises 5.76 times".**
    - Correctly quoted, but not MLA alone (#39). MLA's own cut vs DeepSeek 67B is 82.2%, and 93.3% includes the ~6-bit cache. The 5.76x also includes FP8 weights.
    - The quality claim and its caveat (40:20-40:41) are dropped.
    - Add "the footprint of grouped-query attention with 2.25 groups" (576/256).

19. **Fig 86: "worth up to 55 percent on beam search".**
    - That is memory saved, not throughput.
    - Add the throughput 1.3x → 2.3x (34:17).

20. **Fig 81.**
    - Ranges are drawn at their top ends (FA1 at 40, FA2 at 73).
    - The FA2-on-H100 dip (35%) is missing.
    - The ceilings (312 / 989 / 2,250, V02 Fig 69) are missing.
    - 1,605 TFLOP/s is missing (video; the FA4 abstract says 1,613).
    - "the vendor's own library" = cuDNN 9.13, and Triton, are undefined.
    - Two caveats are missing (§5f).
    - Fix: range bars and a ceiling column.

21. **Fig 21: S = QKᵀ without the 1/√d.** Real attention divides scores by √d (8 at d = 64, 11.3 at d = 128). Add one line.

22. **Fig 24: "attention scores routinely exceed that".** Unsupported (VERIFY); the video says only that the exponential "overflows… well before the score itself looks large". Soften to "can exceed".

23. **Fig 46 / Fig 44 caption: 8 KV heads and K, V 1,024 wide**, ten minutes before grouped-query attention is explained.
    - Fix: add a pointer ("8 KV heads shared by 32 query heads, Part 13; V01 Fig 139").

24. **Fig 95: "The measured share, twenty to thirty percent".** The video says "can reach 20 to 30%"; drop "measured".

25. **Fig 63: label "Traffic saved" next to "7.6x faster"** conflates traffic and speed.

### 5b. ASR-mangled names

None were carried into the atlas, mainly because it omits nearly every proper noun: no Tri Dao, Milakov and Gimelshein, vLLM, DeepSeek, Shazeer, MUFU, TMEM, CuTe DSL, cuDNN, CodeLlama.

When adding them, note that searching the SRT for the correct form will fail. Corrections:

| SRT has | Correct |
|---|---|
| "QDSL" | CuTe DSL |
| "MoFu" | MUFU |
| "WGMM A" | WGMMA |
| "Gimel'shein" | Gimelshein |
| "TriDao" | Tri Dao |
| "VLLM" | vLLM |
| "Palm" | PaLM |
| "Llama 370B" | Llama 3 70B |
| "Deep Seek" | DeepSeek |
| "Three weights" | Three waits (19:27) |
| "a block swaps" | a block's warps (19:05) |
| "a cache backed into memory" | packed (2:26) |
| "over Flash Attention, too" | FlashAttention-2 (24:27, also 43:54) |
| "fit their whole" | fit there whole (10:12) |
| "the extra is largely vanish" | the extra largely vanishes (38:34) |

### 5c. Voice violations and chat residue

**Chat residue** (answering a questioner who is not in the document). Rewrite each as a plain statement:
- Fig 16 caption: "This is the correction that unlocks the rest"
- Fig 17 caption: "does not give you twenty of anything"
- Fig 29 caption: "You are right that Q, K and V come from HBM… what you were worried about"
- Fig 40: "This is the direct answer to your question"
- Fig 47: "This is exactly the situation you described"
- Fig 39 caption: "the direct answer to where…" (milder)

**"The video" in the figure text:**
- Fig 03: "the video's next question"
- Fig 07: "the rest of the video"
- Fig 12: "in this video"
- Fig 42: "the video quotes at 3:07"
- Fig 49: "The video's loop order at 10:52"
- Fig 51: "the precondition the video keeps stating"; caption "a V1 memory-wall problem, not a V3 attention problem"
- Fig 52: "the reason the whole video exists"
- Fig 64: "the rest of the video"
- Fig 95: "in this video"
- Fig 99: heading and caption "this video"
- Fig 100: "the entire video"

### 5d. Neighbours that repeat each other (merge; 17 figures removed)

Merge each group into one figure:
- 11 + 12: both captions say "The single most important idea…".
- 15 + 16.
- 29 into 31: the same tally.
- 06 into 30: the same three kernels.
- 35 + 36: "Every large matmul… is tiled".
- 40 + 41: "window, not a destination", "seven eighths have not moved".
- 10 into 42. The sentence "Choosing the block size is exactly the act of making this list fit" appears in Figs 10, 42 and 48.
- 08 + 09.
- 53 + 54.
- 61 + 62: "never spend HBM traffic on anything you can rebuild". Add the +13% FLOPs here.
- 63 + 64: "solving the stated bottleneck reveals the next one".
- 65 + 66: both captions open "Not a memory problem at all".
- 67 + 68.
- 73 + 74: "a scheduling idea… systems programming". Put the general pattern first.
- 77 + 78: "Upper bar the previous generation, lower bar the new one".
- 93 + 94: both "reused at a different level… exact".
- 95 + 96 + 97 → 2: both 95 and 96 claim to be "the only figure" about the CPU; 96 and 97 repeat the fixed-address sentence.

Fix these but keep both figures:
- 57 vs 58: "They all subtracted the same wrong number…" twice. Fixed by #14.
- 83 vs 84: replaced by #32.
- 85 vs 86 captions: both "…was most of the work". Rewrite one caption.

### 5e. Idioms that fight their idea

- **Fig 100:** a staircase of shrinking bars implies a ranking that does not exist. Use a two-column table.
- **Fig 76:** a histogram with no tick line, so the "first tick or two" has nothing to land on. Use the histogram-over-tick-line idiom (#23).
- **Fig 79, Fig 09:** bars not to scale at 512:1 and 2,600:1. Use area or a labelled log axis.
- **Fig 03:** a speed-up bar (7.6x) stacked on the same axis as two MB bars.
- **Fig 11:** a roofline with unlabelled linear axes and no points. Label it log-log and place the kernels (#5).
- **Fig 57:** a column of boxes and arrows carrying arithmetic. A ledger table carries numbers better (#13-15).
- **Fig 96:** a single lane cannot show why the GPU idles. Use two lanes (#43).

### 5f. Presenter caveats dropped

- "So the headline figure here is a training number rather than an inference one" (19:48).
- "The paper describes the saved work as significant. In his Hot Chips talk, Tri Dao puts it at around 10 times" (27:35).
- "The gains are real, but regime specific… Below 4,000 tokens, the paper does not claim a consistent lead" (29:13, 29:41).
- "Every headline number here was measured in BF16" (30:23).
- "That last claim is one to read carefully since it comes from their own comparisons inside their own training recipe" (40:38).

---

## 6. Size after the pass

**Estimate: about 124 figures.** That is 100 + 41 net-new − 17 merged; #16 is counted, and #5 and #43 could become widgets in place. Density becomes about 4.1/min for 0:00-16:00 (66 figures) and 1.7/min for 16:00-49:21 (58, up from 38). The first half stays denser because it carries the ground floor for the whole video. Update `atlases/index.html`, both the row and the totals.

**Three highest-value changes:**

1. **Make the tiling story true and consistent.**
   - Add #10, #11 and #18, rebuild Fig 03 with the measured 40.3 → 4.4 GB and 41.7 → 7.3 ms, and fix Fig 43.
   - The atlas currently contradicts itself (135x vs 24x) and the paper, and mixes two loop orders without saying so. This is the central claim of the video.

2. **Carry one six-score row from 12:45 to 42:51.**
   - Entries #13-15 reproduce the video's 1.59 and 0.135 and reach the floor (exponent law, distributive law, final division).
   - The same row then returns as FA2's single division (#17), FA4's skipped rescale (#28) and Flash-Decoding's merge (#41), with the WIDGET (#16) on top.
   - One worked example ties four Parts together and replaces Fig 59's unexplained 28.0124.

3. **Fill the three empty stretches with arithmetic, not slogans.**
   - FA4, 25:57-29:47: #26-31, the per-tile cycle table, range reduction, τ, TMEM, 2-CTA.
   - MLA, 36:48-40:41: #36-39, low rank, associativity, RoPE, and the true sources of the 93.3%.
   - Decode, 40:41-43:57: #40-41, the serial walk and the merge computed.
