# V06 Mixture of Experts: depth review

Atlas: `/home/user/llm_inference/atlases/V06_Mixture_of_Experts.html` (23 figures, video 22:38).
Read in full: `V06_outline.md`, `V06_transcript.txt`, the SRT windows around every stamp, and the
V01–V05 outlines for prerequisites. I rendered Figs 05, 08, 09, 11, 13, 14, 18, 20, 21 and 22.
The verification scripts are in
`/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/v06_review_work/scripts/`
(`params.py`, `router.py`, `serving.py`, `training.py`, `more.py`, `sims.py`, `collapse.py`, `grid3.py`).
`check_atlas.py` reports V06 as **clean**. Fig 21 still has a visible layout fault the checker cannot
see (§5).

---

## 1. Snapshot

23 figures in 10 parts: The gap (01–03), Why models grow (04–06), Where the knowledge lives (07–08),
The mechanism (09–11), What sparsity did not touch (12), Inside the router (13), How many experts
(14–15), Routing and its failure mode (16–18), Where the bill arrives (19–21), The number, derived
(22–23). That is 1.0 figure per minute. Five parts have one or two figures each, against roughly 90
seconds of dense video per part.

Keep these:

- **Fig 14 (combinatorics)** has exact numbers (120 → 4,426,165,368, "roughly 37 million times"). Its
  grids are area-true: 16 boxes against 64 boxes of a quarter the area. This is the atlas's best
  figure.
- **Bars drawn to scale in Fig 09 and Fig 11.** Fig 09 uses 700 SVG units per 1.0, so 0.41 → 287,
  0.33 → 231, 0.02 → 14. Fig 11 draws Mixtral's 46.7 against 12.9 at 340 : 94 = 3.62 : 1. Both were
  checked in the SVG source.
- **The causality thread.** Fig 16 rejects expert choice because it needs the future. Fig 18 then
  notes that the controller reads only past batches. Fig 16's caption makes the link explicit ("This
  same constraint reappears immediately").
- **Fig 12's precision about what MoE leaves alone,** and its caption: "the ratio comes from the
  feed-forward network alone". It also fixes the ASR text "multi-head attention" to multi-head
  latent attention. Other good ASR repairs: "Mo Gewa" → Geva, "HPM" → HBM, "Mistral, Mistral's open
  model" → Mixtral.
- Every number the atlas prints recomputes correctly (§5 lists what it leaves out). Figs 19–21 keep
  the presenter's serving-cost framing intact.

---

## 2. Coverage against the transcript

Thin or skipped stretches:

| Video | What is said | Atlas |
|---|---|---|
| 1:10–2:06 | Kaplan's power law: "It falls as a power law in all three. On logarithmic axis, the messy curve becomes a straight line". Chinchilla: "model and its training data should grow together". | Fig 05 draws a kinked polyline, which is neither the curve nor the straight line. There are no ticks and no numbers, and Chinchilla appears only in prose. "Loss" (Fig 04) gets bars with no values. |
| 3:23–4:20 | The FFN as "an enormous soft lookup table. Each key recognizes a pattern … the matching value pushes the model's output toward particular tokens, like Paris". | Fig 07 states this in prose. Nothing shows what an FFN computes, what a key or value is, or how a value "pushes" an output. |
| 4:22–4:36 | "About 2/3 of a transformer's parameters sit in its feedforward layers." | Fig 08 asserts it and never derives it. |
| 5:36–6:09 | N sets total parameters, K sets compute. Mixtral 46.7 B / 12.9 B. | Fig 11 states the numbers but doesn't derive them. |
| 7:38–9:08 | The router: "a small learned linear layer, one matrix, turns that vector into one raw score per expert … softmax … top k … re-normalizes"; "some models, Deep Seek V3 among them, compute their affinity scores with a sigmoid". | One figure (Fig 13) covers 90 s with no numbers. The sigmoid is never built, and "DeepSeek V3 among them" is dropped. |
| 9:11–10:54 | Counting teams: 120 pairs, then about 4.4 billion. | Fig 14 gives the results but not the counting method, and doesn't show why a quarter-width expert costs a quarter. |
| 12:16–13:41 | Token choice against expert choice: "a per batch cap"; "a token nobody picks simply gets skipped"; causality is fatal. | Fig 16 is words only. Capacity and the skipped token are never shown on actual tokens. |
| 14:35–16:23 | Aux loss (Shazeer, Switch, 0.01). The balancing gradient pushes away from popular experts. The bias controller "used only for the top K selection, never in the weighted sum"; "serving traffic never quite matches what training balanced for". | 108 s in one figure (Fig 18): two label boxes over about 1,000 characters of prose. There is no formula and no example, and the last caveat is dropped. |
| 17:34–18:48 | Dispatch and combine. "Before optimization, DeepSeek's training runs showed computation and communication at roughly one-to-one". "It takes thousands of simultaneous requests before all 256 experts have real work … each expert's batch usually stays within 256 tokens, still limited by memory access." | Fig 20 has no byte counts. The concurrency claims are asserted, not derived. The 1:1 ratio loses its "training runs" provenance. |
| 18:51–20:23 | Three tricks: node-limited routing, overlap, redundant experts. | 92 s in one list figure (Fig 21), with labels broken mid-word. No mechanism is drawn. |
| 20:27–21:35 | "We now have every piece needed to derive it … Count what actually fired, and it comes to 37 billion parameters out of 671." | Fig 22 lists four facts and derives nothing. The video does no arithmetic here, so the atlas has to, as Fig 02 promises: "By the end of this document we can derive the split". |
| 21:49–22:00 | Series recap: "We started at the memory wall, went down into the hardware and the kernels, shrank the weights to fewer bits, and split the model across GPUs. This episode made its compute sparse." | Not covered. |

**Stamps.** All stamps are in order. Twelve land on the tail of the *previous* topic, usually about
10 s early. These are from the SRT:

| Fig | Stamp | Topic actually starts | Fix |
|---|---|---|---|
| 03 | 0:38 | 0:44 "A dense model multiplies every token…" | 0:44 |
| 04 | 0:51 | 1:13–1:19 "measured how a language model's loss" | 1:13 |
| 05 | 0:51 | 1:10 scaling laws; 1:27 "power law" | 1:27 (keeps order after Fig 04) |
| 10 | 4:32 | 4:47 "Where a dense layer runs one feedforward network" | 4:47, and move it before Fig 09 |
| 09 | 4:32 | 5:13 "keeps the K highest scorers" | 5:13 |
| 11 | 5:23 | 5:36 "look at what that structure does to the accounting" | 5:36 |
| 13 | 7:26 | 7:38 "Now, we can open the router itself" | 7:38 |
| 14 | 9:07 | 9:11 "So, how many experts should a layer have" | 9:11 |
| 15 | 10:44 | 10:56 "The DeepSeek MoE paper added a second refinement" | 10:56 |
| 17 | 13:36 | 13:45 "Token choice has a failure mode" | 13:45 |
| 18 | 14:24 | 14:35 "The classic fix introduced by Shazeer" | 14:35 |
| 21 | 18:35 | 18:51 "Left unchecked, those two all-to-alls…" | 18:51 |
| 22 | 20:14 | 20:27 "Recall the number this video opened with" | 20:27 |
| 23 | 21:27 | 21:36 "Just do not read those headline totals as raw capability" | 21:36 |

---

## 3. Concept trees

"floor" means high-school maths. "→ Pn" points to the proposal in §4 that fills the node.

```
1. total vs active parameters: 671 B held, 37 B run             [COVERED Fig 01, 02, 11]
  what "run" means: the token's vector is multiplied by it     [MISSING → P1]
    matrix × vector, every weight used once per token          [TAUGHT IN V01 Fig 84–85, 111–112]
      multiply and add                                         floor
  memory = parameters × bytes                                  [TAUGHT IN V01 Fig 105]
  operations = 2 × parameters run                              [TAUGHT IN V01 Fig 113–114]
  both costs for 671 / 37 (671 GB; 74 vs 1,342 GFLOP)          [MISSING → P2]
  671 / 37 ≈ 18                                                [COVERED Fig 02]  floor (ratio)

2. scaling laws: loss falls predictably with size             [PARTIAL Fig 05 — prose; drawing neither curve nor line]
  loss: how wrong the next-token guess was                     [PARTIAL Fig 04 — bars without values]
    probability of the right token                             [TAUGHT IN V01 Fig 08–09]
    penalty −ln p                                              [MISSING → Fig 04 fix]  floor (logarithms)
  power law L = (N_c / N)^α                                    [MISSING → P4]
    powers                                                     floor
    straight line on log–log axes, slope −α                    [MISSING → P4]
      logarithmic axis                                         [TAUGHT IN V01 Fig 121]
  training compute ≈ 6 × N × D                                 [MISSING → P5]
    2 ops per parameter per token, forward                     [TAUGHT IN V01 Fig 111–114]
    backward pass                                              [TAUGHT IN V03 Fig 60 — named only]
  Chinchilla: grow model and data together, ~20 tokens/param   [PARTIAL Fig 05 — prose → P5]

3. gradient: which way to nudge one weight                     [PARTIAL Fig 04 — one sentence]
  training loop: guess, compare, nudge                         [TAUGHT IN V01 Fig 03]
  slope of a curve at a point                                  [MISSING → P3]
    slope of a line                                            floor
  step = − rate × slope                                        [MISSING → P3]  floor
  two terms pulling on one weight                              [MISSING → P29]

4. the memory wall at decode                                   [COVERED Fig 06]
  HBM, bus, bandwidth                                          [TAUGHT IN V01 Fig 74–76, 105–107]
  time per token = bytes / bandwidth                           [TAUGHT IN V01 Fig 130]
  arithmetic under 1% of the step                              [COVERED Fig 06; TAUGHT IN V01 Fig 64–69, 129]
    671 GB: 200 ms reading vs 1.4 ms arithmetic                [MISSING → Fig 06 fix]
  an MoE token reads only what fires: 37 GB, 11 ms             [MISSING → P13]

5. a transformer layer = attention + FFN                       [COVERED Fig 07; TAUGHT IN V01 Fig 91]
  attention mixes positions (weighted average)                 [TAUGHT IN V01 Fig 92–94]
  FFN treats each position alone                               [TAUGHT IN V01 Fig 91]
  residual stream between blocks                               [TAUGHT IN V01 Fig 99]
  layer norm (named in Fig 10's caption)                       [MISSING in V01–V06 → drop or gloss]

6. the FFN holds facts ("capital of France is" → Paris)        [PARTIAL Fig 07 — asserted]
  what an FFN computes: widen, ReLU, narrow                    [MISSING → P6]
    matrix multiply                                            [TAUGHT IN V01 Fig 85]
    ReLU = max(0, x)                                           floor
    gated variant with a third matrix (SwiGLU)                 [MISSING → P6 note; V01 Fig 100 counts 3]
  key = a row of the first matrix; match = dot product         [MISSING → P7]
    dot product                                                [TAUGHT IN V03 Fig 14]
  value = a column of the second; output = weighted sum        [MISSING → P7]
    weighted average                                           [TAUGHT IN V01 Fig 93]
  soft lookup vs hard lookup                                   [MISSING → P7]
    hard lookup: an embedding row                              [TAUGHT IN V01 Fig 87]
  "pushes the output toward Paris"                             [MISSING → P8]
    residual add; vocabulary scores; softmax                   [TAUGHT IN V01 Fig 99, 103, 08–09]
  these keys/values are weights, not the KV cache              [MISSING → P7 caption]

7. about 2/3 of the parameters sit in the FFN                  [PARTIAL Fig 08 — asserted]
  parameters in a matrix = rows × columns                      [TAUGHT IN V01 Fig 84, 112]
  attention Q, K, V, O = 4d²                                   [MISSING → P9]
  FFN d×4d + 4d×d = 8d²                                        [MISSING → P9]
  8 / 12 = 2/3                                                 floor
  GQA shrinks K and V → 82% in the 70B layer                   [MISSING → P10; GQA TAUGHT IN V03 Fig 88–89]
  DeepSeek V3 MoE layer: 98% FFN                               [MISSING → P10]

8. the MoE layer: N expert FFNs and a router                   [COVERED Fig 10]
  router a.k.a. gate                                           [PARTIAL Fig 10, 13 — synonym missing]
  output = Σ gate × expert(x) over the top K                   [PARTIAL Fig 10 — words → P17]
  each MoE layer has its own router and its own experts        [MISSING → P33, P44]
  only the FFN is replicated: "8×7B" is not 56 B               [MISSING → P12]

9. the router: linear → softmax → top-K → renormalise          [PARTIAL Fig 13 — no numbers]
  hidden vector                                                [TAUGHT IN V01 Fig 99]
  linear layer = one matrix multiply → N scores                [MISSING → P15]
    one dot product per expert                                 [TAUGHT IN V03 Fig 14]
  softmax                                                      [TAUGHT IN V01 Fig 09; V03 Fig 22–25] → recap P16
    e^x; divide by the sum; subtract the max                   floor / [TAUGHT IN V03 Fig 24–25]
  top-K                                                        [COVERED Fig 09]
  renormalise the survivors                                    [PARTIAL Fig 09 — values not shown] → P17
  blend outputs with the same numbers                          [PARTIAL Fig 10, 13 — words] → P17
  router cost "rounds to zero"                                 [PARTIAL Fig 13 — asserted] → P19
  sigmoid scoring (DeepSeek V3)                                [PARTIAL Fig 13 — one line, model dropped] → P20
    σ(z) = 1 / (1 + e^−z)                                      floor (e^x, fractions)

10. two dials: N sets memory, K sets compute                   [COVERED Fig 11]
  expert size ∝ its width                                      [MISSING → P22]
  Mixtral 46.7 B / 12.9 B from its shapes                      [PARTIAL Fig 11 — stated] → P11
  time per token tracks what fires                             [PARTIAL Fig 11 caption] → P13

11. attention and the KV cache stay dense                      [COVERED Fig 12]
  KV cache size formula                                        [TAUGHT IN V01 Fig 138–140; V05 Fig 05]
  MLA shrinks it 57×                                           [TAUGHT IN V03 Fig 91–92]
  DeepSeek V3: 68.6 KiB/token, 9 GB at 128k, any expert count  [MISSING → P14]
  attention = 11.4 B of the 37.5 B a token runs                [MISSING → P45]

12. many small experts beat a few large ones                   [COVERED Fig 14]
  counting teams                                               [PARTIAL Fig 14 — results only] → P21
    pairs n(n−1)/2 by listing                                  floor
    C(n,k) as a product over a product                         [MISSING → P21]
  a quarter width = a quarter of the weights and work          [PARTIAL Fig 14 — asserted] → P22
  DeepSeek V3: 9 × 2,048 = 18,432 = one dense FFN              [MISSING → P22]

13. the shared expert                                          [COVERED Fig 15]
  its cost: 1 of 9 experts run, 0.38% of memory                [MISSING → P23]
  who uses one (DeepSeek V3, Llama 4 Maverick, Kimi K2; not Qwen3) [PARTIAL Fig 15 — "Chimera 2" ASR] → fix, P47

14. token choice vs expert choice                              [PARTIAL Fig 16 — words]
  token choice: each row's top K, uneven loads                 [MISSING → P24]
  capacity = tokens × K / N                                    [MISSING → P24]  floor
  expert choice: a token can get 0 experts or 3                [MISSING → P24]
  causality: ranking a column needs future rows                [PARTIAL Fig 16] → P25
    one token at a time; attention looks back only             [TAUGHT IN V01 Fig 07, 110; V03 Fig 20]

15. routing collapse                                           [COVERED Fig 17]
  gradient updates                                             [PARTIAL Fig 04] → P3
  positive feedback compounds                                  [MISSING → P26 widget]  floor
  straggler: layer time = the busiest GPU                      [PARTIAL Fig 17 — named] → P27
    maximum vs average                                         floor

16. auxiliary loss (Shazeer 2017; Switch, α = 0.01)            [PARTIAL Fig 18 — words]
  f_i = share of tokens, P_i = mean probability                [MISSING → P28]  floor
  N·Σ f_i P_i: 1 balanced, N collapsed                         [MISSING → P28]
  adding a weighted second term to a loss                      [MISSING → P28]  floor
  push on P_i ∝ f_i, deserved or not                           [PARTIAL Fig 18] → P29

17. bias controller (aux-loss-free, Wang et al. 2024)          [PARTIAL Fig 18 — words]
  bias changes selection, never the weights                    [PARTIAL Fig 18] → P30
  fixed-step update per batch                                  [PARTIAL Fig 18] → P31 widget
    counting, comparing to the mean                            floor
  reads only past batches                                      [COVERED Fig 18]
  a batch can balance while a sequence does not                [PARTIAL Fig 18 — one sentence] → P32

18. the memory bill and expert placement                       [COVERED Fig 19]
  FP8 = 1 byte                                                 [TAUGHT IN V03 Fig 75; V04 Fig 32] — Fig 19 omits "1 byte each"
  node, cluster                                                [TAUGHT IN V05 Fig 02]
  expert vs tensor parallelism                                 [TAUGHT IN V05 Fig 09, 15]
  per GPU: one expert of every layer = 2.55 GB                 [MISSING → P33]

19. the communication bill                                     [COVERED Fig 20; TAUGHT IN V05 Fig 07, 16–17]
  bytes per token per layer: 56 KiB out, 112 KiB back          [MISSING → P34]
  critical path                                                [PARTIAL V05 Fig 10 — used, never defined] → P35
  time per output token                                        [TAUGHT IN V01 Fig 143]
  1:1 compute to communication, a training measurement         [PARTIAL Fig 20 — provenance lost]

20. "only pays off in a crowd"                                 [PARTIAL Fig 20, 23 — asserted]
  each expert's batch: tokens grouped by expert                [MISSING → P36]
  experts woken by B tokens: 256(1 − (248/256)^B)              [MISSING → P37]  floor (basic probability)
  tokens per expert = B·K/N; intensity = 2 × tokens            [MISSING → P38]
    arithmetic intensity, the ridge                            [TAUGHT IN V01 Fig 120–126; V04 Fig 55]
  batch one: 37.5 GB read, 671 GB held                         [PARTIAL Fig 20] → P39
    amortisation                                               [TAUGHT IN V01 Fig 118]

21. taming the all-to-alls                                     [PARTIAL Fig 21 — a line each, broken labels]
  node-limited routing                                         → P40
    fast inside a node, slow between nodes                     [TAUGHT IN V05 Fig 08; V02 Fig 93–94]
  overlap with two microbatches                                → P41
    microbatches; asynchronous work                            [TAUGHT IN V05 Fig 12–13; V03 Fig 72]
  redundant experts                                            → P42 (uses P27)

22. 671 / 37, derived                                          [PARTIAL Fig 22 — no arithmetic]
  one expert = 3 × 7,168 × 2,048                               [MISSING → P43]
  MLA 187.1 M per layer; 3 dense + 58 MoE layers               [MISSING → P44]
  embedding + output head                                      [TAUGHT IN V01 Fig 87–89] → P44
  671.0 B and 37.55 B                                          [MISSING → P44–P45]

23. reading a headline number                                  [COVERED Fig 23]
  memory = total × bytes; ops = 2 × active                     [TAUGHT IN V01 Fig 105, 113]
  five models side by side                                     [MISSING → P47]
  "early figures" for V4 Pro's 1.6 T                           [PARTIAL Fig 22 — caveat dropped]

24. the series so far (21:49)                                  [MISSING → P48]
```

---

## 4. Proposed new figures (video order)

All arithmetic below was run in Python (scripts named in the header). **VERIFY** marks a published
input that needs checking against its source. The model dimensions are marked VERIFY too, but the
arithmetic built on them lands exactly on the published totals (671.0 B, 46.70 B), which checks them.

### Part 1 · The gap

**P1** · after Fig 01 (0:00) · *A weight runs when the token's vector is multiplied by it*
- Grid. A 4-entry token vector beside two 4×4 weight grids. The first is lit: every cell takes part in
  one multiply-add, so 16 multiply-adds make 32 operations. The second is dim: 0 operations, but its
  16 weights still occupy memory.
- Fills: tree 1, "what run means". Recap of V01 Fig 85, 112.
- Numbers: 16 cells → 32 ops (V01's 2 × cells rule).

**P2** · after Fig 02 · *Held parameters cost memory; run parameters cost arithmetic*
- Bars to scale, two pairs. Memory: 671 GB held against 37 GB touched (FP8, 1 byte each).
  Arithmetic: 74 GFLOP per token against the 1,342 GFLOP a dense 671 B model would need.
- Fills: tree 1, both costs. Recap of V01 Fig 105, 113.
- Numbers: `2*37e9 = 7.4e10`, `2*671e9 = 1.342e12`, `671/37 = 18.1`.

### Part 2 · Why models grow (one build-up: P3–P5)

**P3** · after Fig 04 (restamped 1:13) · *A gradient is a slope: which way to nudge one weight, and how hard*
- A curve on axes. The toy loss (w − 3)² with tangents at w = 1 (slope −4), w = 2 (slope −2) and
  w = 3 (slope 0). A step w ← w − 0.1 × slope moves w = 1 to 1.4. **Widget candidate:** drag w and
  watch the tangent and the step.
- Fills: tree 3 (slope, step). Needed by Figs 17–18.
- Numbers: `training.py`.

**P4** · after Fig 05 (restamped 1:27) · *A power law is a straight line on log–log axes*
- Small multiples: the same law on linear axes (a curve) and on log–log axes (a straight line with
  slope −0.076). Ticks at N = 10⁹ … 10¹². This replaces Fig 05's kinked line.
- Fills: tree 2 (power law, log–log). Recap of V01 Fig 121.
- Numbers: with L = (8.8×10¹³ / N)^0.076, L(10⁹) = 2.38, L(10¹⁰) = 1.99, L(10¹¹) = 1.67,
  L(10¹²) = 1.40. Ten times the parameters multiplies loss by 0.84 (−16%); doubling gives −5.1%.
  **VERIFY** α_N = 0.076 and N_c = 8.8×10¹³ (Kaplan et al. 2020, eq. 1.1).

**P5** · after P4 · *Chinchilla: a quarter of the parameters, 4.7 times the data, the same budget*
- Bars to scale. Gopher: 280 B parameters, 300 B tokens, 5.0×10²³ FLOP. Chinchilla: 70 B parameters,
  1.4 T tokens, 5.9×10²³ FLOP. Tokens per parameter: 1.1 against 20.
- Fills: tree 2 (training compute 6ND; Chinchilla).
- Numbers: `6*280e9*300e9 = 5.04e23`, `6*70e9*1.4e12 = 5.88e23`, `1.4e12/300e9 = 4.67`. **VERIFY**
  token counts (Hoffmann et al. 2022) and the 6ND convention (2 forward + 4 backward per parameter
  per token).

### Part 3 · Where the knowledge lives (build-up A: P6–P8, the FFN as a memory; build-up B: P9–P10, the 2/3)

**P6** · after Fig 07 (3:23) · *Inside the feed-forward block: widen, keep the positives, narrow*
- Equation built up, toy d = 2 with 4 hidden units. x = [1, 2]. W_up x = [3, −1, 0, −1.5].
  ReLU gives [3, 0, 0, 0]. W_down then gives y = 3 × [0.6, 0.2] = [1.8, 0.6]. One prose line notes
  that modern FFNs add a third "gate" matrix (SwiGLU), which is why V01 Fig 100 counts three.
- Fills: tree 6 (what an FFN computes; ReLU).
- Numbers: `more.py`.

**P7** · after P6 · *Each row of the first matrix is a key; each column of the second is a value*
- Table with a pointer. The four keys and their match scores (dot products 3, −1, 0, −1.5). Only
  key 1 fires, and the arrow runs out to value column 1. Beside it, a hard lookup (V01 Fig 87: one
  row by index) against this soft one (every row, weighted by its match). Caption: these keys and
  values are fixed weights, nothing to do with the KV cache of Fig 12.
- Fills: tree 6 (key, value, soft vs hard, disambiguation).
- Numbers: as in P6.

**P8** · after P7 · *The value tips the next-token scores from London to Paris*
- Small multiples: next-token scores before and after the FFN adds y to the residual
  ([1, 2] → [2.8, 2.6]). Output rows are Paris [1, 0.3], London [0.2, 1], "the" [0.1, −0.2]. Scores go
  from 1.60 / 2.20 / −0.30 (softmax 0.34 / 0.61 / 0.05) to 3.58 / 3.16 / −0.24 (0.60 / 0.39 / 0.01).
  Label the numbers illustrative.
- Fills: tree 6, "pushes the output toward Paris". Recap of V01 Fig 99, 103, 09.
- Numbers: `more.py`.

**P9** · after Fig 08 (4:22) · *Where two thirds comes from: 4d² against 8d²*
- Equation built up. Q, K, V and O are each d × d, so attention is 4d². The FFN is d × 4d plus
  4d × d, so 8d². The FFN share is 8/12 = 2/3. At d = 4,096 that is 67.1 M against 134.2 M per layer.
  SwiGLU's three matrices of width 8d/3 also come to 8d².
- Fills: tree 7.
- Numbers: `params.py`.

**P10** · after P9 · *Modern layers lean further: 82% in the 70B model, 98% in an MoE layer*
- Three bars to scale. Classic layer: 67%. The V01 70 B layer: 704.6 M of 855.6 M = 82.4%, because
  GQA shrinks K and V (V03 Fig 88–89). DeepSeek V3 MoE layer as held: 11.32 B against 187.1 M of
  attention = 98.4%.
- Fills: tree 7.
- Numbers: `params.py` (V01 Fig 101 shapes; DeepSeek V3 config, **VERIFY**).

### Part 4 · The mechanism

Move Fig 10 (4:47) before Fig 09 (5:13); see §5. Then:

**P11** · after Fig 11 (5:36) · *Mixtral's 46.7 billion, counted from its shapes*
- Table built term by term. Attention per layer is 41.94 M (Q, O 4,096²; K, V 4,096 × 1,024). One
  expert is 3 × 4,096 × 14,336 = 176.2 M, and eight make 1.409 B. The router is 32,768. Over 32
  layers, plus 131 M of embedding and 131 M of output head, that is **46.70 B**. With two experts
  running it is **12.88 B**.
- Fills: tree 10.
- Numbers: `params.py`. **VERIFY** dims against Mixtral's config (they reproduce the published
  totals).

**P12** · after P11 · *Why "8×7B" comes to 46.7 billion, not 56*
- Bars to scale. 8 × Mistral 7B (7.24 B) = 57.9 B, against 46.7 B. The 11.2 B gap is seven extra
  copies of attention and embeddings that MoE never makes.
- Fills: tree 8 (only the FFN is replicated; makes Fig 10's caption concrete).
- Numbers: `7*(1.342+0.262) = 11.23`.

**P13** · after P12 · *Reading time tracks what a token touches*
- Bars to scale. A dense 671 B model at FP8 reads 671 GB per token, 200 ms at 3.35 TB/s. The MoE
  reads about 37 GB, 11 ms. Label it one-chip-equivalent and schematic, since real deployments split
  both.
- Fills: tree 4/10 (time tracks K). Recap of V01 Fig 130.
- Numbers: `671e9/3.35e12 = 200 ms`, `37e9/3.35e12 = 11.0 ms`.

### Part 5 · What sparsity did not touch

**P14** · after Fig 12 (6:13) · *A request's cache is set by attention alone*
- Bars. DeepSeek V3's MLA cache is 576 numbers × 61 layers × 2 bytes = 68.6 KiB per token, so 9.0 GB
  for a 128k-token request, the same with 8 experts or 256. Full multi-head would be 4.0 MB per token
  (57×).
- Fills: tree 11. Recap of V01 Fig 138–140, V03 Fig 91–92.
- Numbers: `serving.py`. **VERIFY** 16-bit cache storage.

### Part 6 · Inside the router (build-up: P15–P20)

**P15** · after Fig 13 (7:38) · *The router's scores are four dot products*
- Equation built up. x = [1.0, −0.5, 2.0, 0.5]. Router rows (one learned direction per expert):
  E1 [0.5, 0, 1, −0.5], E2 [−1, 0.5, 0, 1], E3 [0, −1, 0.5, 0.5], E4 [1, 1, −0.5, 0].
  Scores z = [2.25, −0.75, 1.75, −0.5], each written out as its four products.
- Fills: tree 9 (linear layer = one matrix multiply). Recap of V03 Fig 14, V01 Fig 99.
- Numbers: `router.py`.

**P16** · after P15 · *Softmax turns the four scores into shares*
- Bars to scale. Subtract the max (2.25) to get [0, −3, −0.5, −2.75]. Exponentiate to
  [1, 0.050, 0.607, 0.064]; the sum is 1.720. The shares are [0.581, 0.029, 0.353, 0.037].
- Fills: tree 9. Short recap of V01 Fig 09, V03 Fig 24–25.

**P17** · after P16 · *Keep two, renormalise, blend*
- Equation built up. E1 + E3 hold 0.934 of the share, which renormalises to gates 0.623 / 0.377. With
  toy outputs E1(x) = [0.8, −0.2] and E3(x) = [0.1, 0.6], the blend is [0.536, 0.102].
- Fills: tree 8/9 (renormalise, weighted sum).

**P18 [WIDGET]** · after P17 · *Move the token and watch the router change its mind*
- Four sliders for x. Live scores, softmax bars, the top-2 highlight, gates and blended output, plus a
  softmax/sigmoid toggle. Defaults reproduce P15–P17.
- Fills: tree 9 as a whole. This teaches far better than any static figure.

**P19** · after P18 · *The router costs under half a percent of the expert work*
- Bars on a log scale. The router is 256 × 7,168 = 1.84 M weights, 3.67 MFLOP per token per layer.
  The nine experts that run cost 793 MFLOP, so the router is 0.46% of it. It is 0.016% of the
  layer's stored weights.
- Fills: tree 9, "rounds to zero".
- Numbers: `more.py`.

**P20** · after P19 · *A sigmoid scores each expert on its own*
- Curve plus bars. σ(z) = 1/(1 + e^−z) applied to the same scores gives [0.905, 0.321, 0.852, 0.378].
  They sum to 2.455, so there is no shared budget. The top two are the same (E1, E3), but normalising
  gives gates 0.515 / 0.485 against softmax's 0.623 / 0.377. DeepSeek V3 scores this way.
- Fills: tree 9, sigmoid.
- Numbers: `router.py`.

### Part 7 · How many experts

**P21** · after Fig 14 (9:28) · *Counting teams: four experts make six pairs, sixteen make 120*
- Grid. List all six pairs of {A, B, C, D}. Then shade the 120 cells above the diagonal of a 16 × 16
  grid, each pair once. Then the product rule: C(64,8) = (64·63·…·57)/(8·7·…·1) = 4,426,165,368.
  DeepSeek V3's C(256,8) is 4.1×10¹⁴.
- Fills: tree 12, counting.
- Numbers: `router.py` (math.comb).

**P22** · after P21 (9:50) · *Slicing changes the number of teams, not the bill*
- Bars to scale. One full expert is 3 × 4,096 × 14,336 = 176.2 M; a quarter is 44.0 M. Two full
  experts and eight quarters are both 352.3 M. Second row: DeepSeek V3's dense FFN width 18,432 equals
  9 × 2,048, so a token's 8 routed + 1 shared experts are exactly one dense FFN of work, out of 257
  held.
- Fills: tree 10/12.
- Numbers: `router.py`.

### Part 8 · The shared expert

**P23** · after Fig 15 (10:56) · *The shared expert costs a ninth of the expert work and 0.4% of the memory*
- Bars. Shared experts total 58 × 44.04 M = 2.55 B. That is 6.8% of the 37.5 B active and 0.38% of
  the 671 B held, and one of the nine experts each token runs.
- Fills: tree 13.
- Numbers: `more.py`.

### Part 9 · Routing and collapse

**P24** · after Fig 16 (12:16) · *Token choice and expert choice on the same eight tokens*
- Small multiples of one 8 × 4 score grid (rows t1–t8, each summing to 1):
  t1 [.45 .30 .05 .20], t2 [.42 .05 .30 .23], t3 [.38 .17 .05 .40], t4 [.50 .25 .15 .10],
  t5 [.35 .18 .27 .20], t6 [.30 .10 .35 .25], t7 [.05 .40 .30 .25], t8 [.10 .27 .28 .35].
  Token choice (each row's top 2) gives loads E1 6, E2 3, E3 5, E4 2 against a fair share of
  8 × 2 / 4 = 4. Expert choice (each column's top 4) leaves **t5 picked by no expert** and gives
  **t7 and t8 three experts each**.
- Fills: tree 14 (capacity, both rules, the skipped token).
- Numbers: `grid3.py` (asserts no ties at any boundary).

**P25** · after P24 · *To rank its column, an expert needs tokens that do not exist yet*
- The same grid at decode time. Only rows t1–t3 exist; t4–t8 are greyed as future, so E1 cannot know
  whether t1 makes its top 4.
- Fills: tree 14, causality. Short recap of V03 Fig 20, V01 Fig 110.

**P26 [WIDGET]** · after Fig 17 (13:45) · *Rich get richer, simulated*
- Toy model: 8 experts with a softmax router over their "skill", and skill grows with traffic. With
  no balancing, the top expert's share goes 0.13 → 0.26 (step 100) → 0.97 (step 150). With a
  balancing push it stays at 0.125. A slider sets the balancing strength. Label it a toy.
- Fills: tree 15.
- Numbers: `collapse.py`.

**P27** · after P26 · *A layer waits for its busiest GPU*
- Bars for 8 GPUs with loads [40, 20, 18, 16, 14, 12, 10, 6]. The mean is 17 and the max 40, so the
  layer runs at 42.5% of what an even spread would allow.
- Fills: tree 15, straggler (the reason Fig 17 says "every other GPU waits"). Reused by P42.
- Numbers: `serving.py`.

### Part 10 · Enforcing balance (build-up: P28–P32; Fig 18 becomes the overview)

**P28** · after Fig 18 (14:35) · *The auxiliary loss, built term by term*
- Equation built up. f_i is the share of tokens sent to expert i, P_i its mean router probability,
  and the term is N·Σ f_i·P_i × α. Worked for 4 experts: balanced gives 1.00 → 0.010. Skewed
  (f = .7/.1/.1/.1, P = .6/.15/.15/.1) gives 1.84 → 0.018. Collapsed gives 4.00 → 0.040.
- Fills: tree 16.
- Numbers: `training.py`. **VERIFY** the formula against the Switch Transformer paper (Fedus et al.,
  eq. 4).

**P29** · after P28 · *The balancing push lands hardest on the popular expert, deserved or not*
- Bars. The push on each P_i is proportional to N·f_i = 2.8 / 0.4 / 0.4 / 0.4. The expert with 70% of
  the traffic is pushed seven times harder than each of the others, including on tokens it was right
  for. This is the video's "pushes the router away from that expert anyway".
- Fills: tree 3/16.
- Numbers: `training.py`.

**P30** · after P29 · *A bias that changes who is chosen, never how much they count*
- Table. Scores s = [.80, .75, .70, .30] and bias b = [−.10, 0, +.20, 0] give s+b = [.70, .75, .90,
  .30]. The top 2 by s are E1, E2; by s+b they are E3, E2. Gates come from s: E2 0.517, E3 0.483.
- Fills: tree 17.
- Numbers: `sims.py`.

**P31 [WIDGET]** · after P30 · *The controller, batch by batch*
- Toy: 8 experts with skewed affinities, top 2, 512 tokens per batch, a fixed step, each batch
  reading the previous batch's counts. Max/mean load goes 2.84 → 1.92 (batch 10) → 1.09 (batch 25),
  then hovers about 1.1. A slider sets the step. DeepSeek V3's step was 0.001 (**VERIFY**, V3 report).
- Fills: tree 17.
- Numbers: `sims.py`.

**P32** · after P31 · *A batch can look balanced while each sequence is not*
- Grid of 4 sequences × 8 experts. Each sequence sends its tokens to one pair of experts, and the four
  pairs differ. Column totals are equal while every row is concentrated. Optionally note DeepSeek V3's
  small sequence-wise balance term (α = 0.0001, **VERIFY**).
- Fills: tree 17.

### Part 11 · Where the bill arrives

**P33** · after Fig 19 (16:37) · *One expert per GPU means one expert from every layer*
- Nested containers. GPU k holds expert k of each of the 58 MoE layers (each layer has its own 256,
  so 58 × 256 = 14,848 routed experts in all). That is 58 × 44.04 M = 2.55 B weights = 2.55 GB at
  FP8, about 3% of an 80 GB card, leaving the rest for attention weights and KV cache.
- Fills: tree 8/18.
- Numbers: `params.py`. **VERIFY** decode layout (V3 report §3.4: EP320, one expert per GPU).

**P34** · after Fig 20 (17:34) · *What one token sends in one layer: 168 KiB*
- Bars to scale. Dispatch is 8 × 7,168 × 1 B = 56 KiB (FP8). Combine is 8 × 7,168 × 2 B = 112 KiB
  (BF16). Over 58 layers that is 9.98 MB per token.
- Fills: tree 19.
- Numbers: `serving.py`. **VERIFY** FP8 dispatch and BF16 combine (V3 report).

**P35** · after P34 · *The critical path: steps a token can neither skip nor reorder*
- Lane chart of one MoE layer at decode: attention → router → dispatch → experts → combine → next
  layer, with communication equal to compute. That is the 1:1 "DeepSeek's training runs showed …
  before optimization", so half the layer is waiting.
- Fills: tree 19 (critical path, never defined in the series). Recap of V01 Fig 143.

**P36** · after P35 (18:21) · *Grouping tokens by expert turns one batch into many small ones*
- Table with pointers. P24's token-choice picks regrouped by expert: E1 gets 6 tokens, E2 3, E3 5,
  E4 2, each a small matrix multiply whose weight read is shared by its rows.
- Fills: tree 20, "each expert's batch". Recap of V04 Fig 55.

**P37** · after P36 · *How many experts a batch wakes up*
- Curve: expected experts touched = 256 × (1 − (248/256)^B). B = 1 → 8, 8 → 57, 32 → 163,
  64 → 222, 128 → 252. State the uniform-routing assumption.
- Fills: tree 20 (basic probability).
- Numbers: `serving.py`.

**P38** · after P37 · *An expert waits on memory until it holds about 295 tokens*
- Roofline point. Tokens per expert = 8B/256 = B/32. FP8 weights give intensity = 2 × tokens FLOP
  per byte. The ridge is 1,979 TFLOP/s ÷ 3.35 TB/s = 591, so 295 tokens per expert, about 9,400
  tokens per step. DeepSeek's "usually within 256 tokens" gives intensity 512 < 591, still memory
  bound, exactly as the video says.
- Fills: tree 20. Recap of V01 Fig 120–126, V04 Fig 55.
- Numbers: `serving.py`. **VERIFY** H800 FP8 dense peak and HBM bandwidth.

**P39 [WIDGET candidate]** · after P38 · *Batch one: 671 GB held, 37.5 GB read, eight experts busy*
- Small multiples for B = 1, 64 and 8,192. Experts touched: 8 / 222 / 256. Weights read per step:
  37.5 / 585 / 671 GB. Per token: 37.5 / 9.1 / 0.08 GB. With a batch slider, P37–P39 become one
  widget.
- Fills: tree 20 ("worst of both sides", amortisation, V01 Fig 118).
- Numbers: `more.py`.

**P40** · after Fig 21 (18:51) · *Node-limited routing, worked*
- Grid of 8 groups × 32 experts. Each group's score is the sum of its two best affinities. Keep the
  best 4 groups, then the best 8 experts inside them. Effective links are NVLink 160 GB/s against
  InfiniBand 50 GB/s (3.2×). Cross-node dispatch is at most 4 × 7,168 B = 28 KiB per token per layer
  instead of up to 56 KiB.
- Fills: tree 21. Recap of V05 Fig 08.
- Numbers: `serving.py`. **VERIFY** the group-scoring rule (n_group 8, topk_group 4) and the link
  rates (V3 report). Also check the group-to-node mapping: one group per node is the 8-node training
  layout.

**P41** · after P40 · *Two microbatches hide each other's waiting*
- Lane chart with a compute lane and a network lane. Sequential (A compute, A send, B compute,
  B send) takes 4 units per layer. Staggered, it takes 2 in steady state: 2× at a 1:1 ratio, with
  every byte still sent.
- Fills: tree 21. Recap of V05 Fig 12–13, V03 Fig 72.

**P42** · after P41 · *A duplicate halves the hottest queue*
- P27's bars again. The 40-token GPU's expert is copied to a spare GPU (20 + 20), the max falls from
  40 to 20, and the layer runs 2× faster. DeepSeek V3's prefill carries 32 such copies.
- Fills: tree 21.

### Part 12 · The number, derived (build-up: P43–P46)

**P43** · after Fig 22 (20:27) · *One DeepSeek V3 expert is three 7,168 × 2,048 matrices*
- Equation: 3 × 7,168 × 2,048 = 44,040,192.
- Fills: tree 22. **VERIFY** dims (DeepSeek-V3 `config.json`).

**P44** · after P43 · *671 billion, counted*
- Table, then a stacked bar:

  | Part | Count |
  |---|---|
  | MLA attention | 187.1 M × 61 = 11.41 B |
  | Dense FFN | 396.4 M × 3 = 1.19 B |
  | Routed experts | 44.04 M × 256 × 58 = 653.91 B |
  | Shared experts | 44.04 M × 58 = 2.55 B |
  | Routers | 0.11 B |
  | Embedding + output head | 2 × 129,280 × 7,168 = 1.85 B |
  | **Total** | **671.0 B** |

- Fills: tree 22.
- Numbers: `params.py` (the 14 B multi-token-prediction module is excluded, as in the 671 B figure,
  **VERIFY**).

**P45** · after P44 · *37 billion, counted*
- The same table with 8 routed experts per layer: 20.43 B. Total active **37.55 B** (36.6 B if the
  input-embedding lookup is left out, V01 Fig 87). Attention is 11.41 B of it, 30%. Routed experts
  are 97.5% of what is held, and 3.1% of them run. Draw the stacked bar beside the 671 bar to scale.
- Fills: tree 11/22.
- Numbers: `params.py`.

**P46 [WIDGET]** · after P45 · *The MoE calculator*
- Inputs: N, K, shared, expert width, layers, d_model. Outputs: total, active, FP8 GB, FLOPs per
  token, teams C(N,K). Presets for Mixtral and DeepSeek V3 reproduce P11 and P44–P45.

### Part 13 · Reading the headline

**P47** · after Fig 23 (21:36) · *Five headline numbers, read the same way*
- Table:

  | Model | Total | Active | Active share | FP8 memory | Per token |
  |---|---|---|---|---|---|
  | DeepSeek V3 | 671 B | 37 B | 5.5% | 671 GB | 74 GFLOP |
  | Mixtral | 46.7 B | 12.9 B | 27.6% | 46.7 GB | 25.8 GFLOP |
  | Qwen3-235B | 235 B | 22 B | 9.4% | 235 GB | 44 GFLOP |
  | Llama 4 Maverick | 400 B | 17 B | 4.3% | 400 GB | 34 GFLOP |
  | Kimi K2 | 1,040 B | 32 B | 3.1% | 1,040 GB | 64 GFLOP |
  | DeepSeek V4 Pro (early figures) | 1.6 T | tens of billions | | | |

  For DeepSeek V4 Pro, V05 says six of 384 experts per token.
- Fills: tree 23. Recap of V01 Fig 105, 113.
- Numbers: arithmetic in `more.py`. **VERIFY** each model card.

**P48** · after P47 (21:49) · *Six videos, one stack*
- Chain of consequences: V01 memory wall → V02 hardware → V03 kernels → V04 fewer bits → V05 split
  across GPUs → V06 sparse compute → the open assumption, a crowd of users (V07).
- Fills: tree 24 (video 21:49–22:00).

---

## 5. Problems in existing figures

**Errors and dropped caveats**

1. **Fig 22: the derivation is missing.** The title is "Deriving the split" and the caption says
   "Every term in the derivation has been established. Nothing here is a rule of thumb." The figure
   computes nothing; it is four labelled boxes. Fig 02 promises "By the end of this document we can
   derive the split." Fix: P43–P45. Keep Fig 22 as the setup and change its caption to point at the
   count.
2. **Fig 15: "Chimera 2" is ASR for Kimi K2,** Moonshot AI's trillion-parameter model ("Chimera 2,
   the trillion parameter model", 11:59). Correct it. Also restore "Qwen 3, at 235 billion
   parameters".
3. **Fig 20 drops a provenance caveat.** "roughly one to one, before optimisation" was measured in
   "DeepSeek's training runs" (17:58). Under the decode heading it reads as a serving measurement.
   Restore the source.
4. **Fig 22 drops an attribution and a caveat.** "1.6 trillion total" is "the early DeepSeek V4 Pro
   figures" (21:27). Restore both.
5. **Fig 13 drops "DeepSeek V3 among them"** from the sigmoid sentence, although DeepSeek V3 is the
   atlas's own running model. It also leaves "affinity" undefined, and the synonym "gate" (4:52) is
   missing.
6. **Fig 18 drops "serving traffic never quite matches what training balanced for"** (16:15).
   Attributions the video gives and the atlas omits: Shazeer (aux loss), Wang et al. 2024 (bias
   controller), Zhou et al. 2022 for expert choice (ASR "Zhu", 12:42), and the DeepSeekMoE paper for
   fine-grained and shared experts (Fig 14, 15).
7. **Fig 21 caption, a precision point.** "the traffic is hidden, not reduced" holds for overlap and
   redundancy. Node-limited routing does cut cross-node (InfiniBand) copies, from up to 8 to at most
   4 per token per layer, moving them onto NVLink. Suggested wording: "moved and hidden, never
   removed".
8. **No numeric errors found.** I recomputed 671 − 37 = 634; 671/37 = 18.1; the six shares in Fig 09
   sum to 1.00 and the top two to 0.74; C(16,2) = 120; C(64,8) = 4,426,165,368; the ratio is
   36,884,711; 671 GB > 640 GB; 256 + 64 = 320; 256 − 8 = 248. Mixtral (46.70 / 12.88 B) and DeepSeek
   V3 (671.0 / 37.55 B) both reproduce from shapes.

**Layout the checker misses**

9. **Fig 21 breaks words mid-word.** The text reads "run two microbatches staggered, so one computes
   whil | e the other is in flight" and "duplicate the hottest experts on spare GPUs and spli | t
   their queues". The remainder sits under the box as separate `sub2` text, and "cap each token at 4
   nodes" hangs outside its box too. The checker passes all of it. Fix: two-line boxes or shorter
   labels ("two staggered microbatches: one computes, one sends"; "copy the hottest experts to spare
   GPUs"). P40–P42 then carry the mechanism.

**Ground floor owed inside existing figures**

10. **Fig 04 (loss).** Bars of 40 / 150 / 230 px have no values and no stated scale. Use
    −ln p for p = 0.9 / 0.3 / 0.02, giving 0.11 / 1.20 / 3.91, drawn to scale. The three case labels
    are set in the body-prose `cap` class; retag them.
11. **Fig 05.** The drawing is a kinked three-segment line. It is neither the curved linear-axis plot
    nor the straight log–log line the prose describes, it has no ticks, and it isn't marked
    schematic. Replace it with P4.
12. **Fig 06.** Add the numbers behind "under 1%" for this model: 671 GB ÷ 3.35 TB/s = 200 ms of
    reading against 1.342 TFLOP ÷ 989 TFLOP/s = 1.4 ms of arithmetic (0.67%).
13. **Fig 09.** Show the renormalised gates: 0.41/0.74 = 0.554 and 0.33/0.74 = 0.446. It also sits
    before Fig 10 but already talks about experts and blending outputs. Swap the two (Fig 10 4:47,
    Fig 09 5:13).
14. **Fig 10 caption mentions "the layer norms",** which nothing in V01–V06 defines (grep finds no
    match). Drop it or gloss it in a clause.
15. **Fig 07: "key" and "value" collide** with attention's keys and values and with the KV cache in
    Fig 12. Disambiguate (P7 caption).
16. **Fig 19: "671B parameters at FP8" needs "1 byte each"** (said at 16:38) for the reader to get
    671 GB.
17. **Fig 14: "V4 Pro" arrives unintroduced.** Write "DeepSeek V4 Pro, the 1.6-trillion-parameter
    model of V05".
18. **Fig 16's title, "one of them impossible", overstates.** Expert choice is unusable for
    token-by-token decoding, not impossible. Suggest "Two ways to route, and why decoding can use
    only one".

**Voice**

19. Fig 01's caption has "The distinction the whole video turns on". Fig 04 has "Nothing in this
    video computes one". Reword both without "video", e.g. "the whole subject turns on" and "Nothing
    here computes one". Fig 23's "next episode" matches series practice (V05 Fig 25 does the same),
    so leave it.

**Redundancy and idiom**

20. **Fig 01 body, Fig 02 caption and Fig 03 body all say the same thing.** Each states that a dense
    model's two quantities are one number ("the gap is zero" / "these are the same number"), and
    Fig 11's caption repeats Fig 03's caption. Give Fig 03 a new job: preview the two dials, with
    dense as the case N = K = 1.
21. **Fig 18 is prose carrying a drawing that carries nothing.** It has two label boxes and about
    1,000 characters of body, around three times the design norm. Keep it as the two-column overview
    and move the teaching into P28–P32.
22. **Fig 20 and Fig 21 are boxes-and-arrows lists for ideas that need other idioms.** Byte counts
    need bars (P34), the critical path needs a lane chart (P35), overlap needs a timeline (P41),
    node limits need a grid (P40), and redundancy needs bars (P42).
23. **Labels set in the body-prose `cap` class.** Fig 02 ("Parameters held"), Fig 09 ("expert 1…6"),
    Fig 11 ("Eight experts, top two"), Fig 19 ("671B parameters at FP8") and Fig 20 ("Compute",
    "Waiting on the network") use `cap` for labels. Retag them `lbl`/`sub` so the crowding check
    applies the right rule.

---

## 6. Size after the pass

**About 71 figures:** 23 existing plus 48 proposed, including 5 widgets (P18, P26, P31, P39, P46).
That is about 3.1 per minute. The `atlases/index.html` row and totals for V06 change accordingly.

The three highest-value changes:

1. **Make "The number, derived" real (P43–P45, with P11–P12 for Mixtral).** Count 671.0 B and 37.55 B
   from DeepSeek V3's shapes, and 46.70 / 12.88 B from Mixtral's. Show that attention is 30% of what
   a token runs. This fixes the atlas's one false caption and pays off Fig 02's promise.
2. **Take the router to the floor (P15–P20, widget P18).** One 4-expert token goes from hidden vector
   through dot products, softmax, top-2, renormalisation and the blend, then the same scores through
   the sigmoid that DeepSeek V3 uses.
3. **Build the FFN and the 2/3 (P6–P10).** Show what an FFN computes, the key–value reading with a
   worked "Paris" example, 4d² against 8d², and why modern layers sit at 82–98%.

The next tier: load balancing at the floor (P24, P28–P31) and the arithmetic behind "only pays off
in a crowd" (P36–P39).
