# V05 Parallelism: depth review

Read in full: the outline (25 figures), the 20-second transcript, every SRT cue (420 cues, used for the
stamp table) and the V01–V04 outlines, searched for prerequisites. I rendered Figs 7, 10, 11, 13, 20 and 22.
The verification scripts are in
`/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/review/verify/`
(`v1.py` … `v7.py`). Every number below was printed by one of them. Where a figure depends on a spec
or a source that Python cannot check, it is marked VERIFY.

Model shape used for the worked numbers is the same one V01 already uses (V01 Fig 101, 140): Llama 3 70B,
80 layers, hidden 8,192, feed-forward 28,672, 64 query heads, 8 KV heads, head dim 128, 16-bit.

---

## 1. Snapshot

- **25 figures in 9 parts** for a 16:45 video, which is 1.5 per minute (V01 4.7, V02 4.9, V04 4.0).
  Parts: Why one chip is not enough (5), The vocabulary of exchange (3), Tensor (2), Pipeline (4),
  Expert (3), Data (1), Sequence (2), Why the collectives are affordable (2), Putting them together (3).
- **Keep these:**
  1. **Fig 1 is drawn to scale and makes the right distinction.** The bars are 340 px for 1.6 TB,
     40.8 px for 192 GB and 17 px for 80 GB (`340*192/1600`, `340*80/1600`). The caption separates this
     capacity wall from V01's speed wall.
  2. **The video's sorting question carries the whole atlas.** "What does it have to send, and how
     often" is set up in Fig 4 and closed by Fig 23's two-column map ("Placement is entirely determined
     by how much a strategy has to say and how often"). That is a real argument, not a list.
  3. **Fig 12's lane chart is a correct forward-only fill/drain schedule.** It has 12 idle cells of 28,
     which is 3/7 = 42.9%, and every percentage in Fig 13 (43, 27, 16, 9) reproduces from
     (p−1)/(m+p−1).
  4. **The presenter's framing and caveats are kept.** Fig 18 keeps the training-versus-inference
     contrast ("a training intuition that does not transfer"), Fig 17 keeps "across nodes", Fig 24 keeps
     "that counted as a strong result", and Fig 20 keeps "part of the machinery". No ASR damage reached
     the page: there is no "all two walls", "DPP" or "llama for scout". The names were left out instead
     (see §5).

---

## 2. Coverage against the transcript

### Thin or skipped stretches

| Range | What is said there | What the atlas has |
|---|---|---|
| 0:42–1:26 | "B cannot start until A's output crosses a wire, and while that transfer is in flight, B sits idle." | Fig 4 draws two boxes. The idle time, which is a fact about time, appears only in prose. |
| 1:37–2:28 | "a 128,000 token context already costs around 40 GB… a million token sequence overflows a GPU on its own" | Fig 5 gives the formula but never evaluates it. The 1M-token claim is never shown. |
| 2:34–3:28 | Five collectives, one sentence each. "The heaviest pattern is the all to all." | Fig 7 has names and one-line glosses. No collective is worked on data. All-reduce is drawn as a central hub. Nothing explains why all-to-all is "heaviest". |
| 3:34–4:33 | NVLink 900 GB/s and 1.8 TB/s, network "about 50 GB per second, 18 to 36 times slower" | Fig 8 covers it. Bits against bytes, one direction against two, and the time one message takes are all absent. |
| **4:36–5:37** | Megatron-LM. The FFN "expands its input through matrix A, applies a non-linearity, GELU, then contracts through matrix B". A by columns, B by rows, heads. | **One figure (Fig 9) for the video's central mechanism.** No matrix is drawn, no number is multiplied, GELU is undefined and Megatron-LM is unnamed. This is the thinnest stretch for its importance. |
| 5:38–6:13 | "160 blocking exchanges per token, far too heavy to cross between servers"; "an eighth of the weights" | Fig 10 counts to 160 and stops. Nothing is priced. The two all-reduces are drawn in the wrong order. |
| 6:35–7:13 | "A pipeline stage speaks once, at its own boundary, to one neighbor… Traffic that thin is easy to hide." | Fig 11's two "bars" are near-equal labelled boxes (300 px against 220 px). |
| 8:06–8:22 | "several short non-contiguous chunks of layers… at the price of more messages between stages" | One sentence in Fig 13's prose, under a 7:34 stamp. |
| 8:41–9:16 | Decode moves "one tiny step at a time… fill the pipe with other people's tokens", plus separate pools | Fig 14 is two text boxes and prose, with no lane chart. |
| 9:18–9:52 | "the feed forward block, the biggest block of weights"; "384 routed experts… just six" | Fig 15 never defines the router and draws 2 of 6 experts lit. |
| 9:54–10:35 | "every GPU sending tokens to every other GPU at once… the router redraws the map for every batch" | Fig 16 shows one token's flow. The all-to-all itself, a table of who sends what to whom, is never drawn. |
| 10:59 | "DeepSeek built DPP [DeepEP], an all-to-all library" | Fig 17 drops the name. |
| 11:56–12:12 | "So, the strategies nest…" | Moved into Fig 23 (14:56). That is acceptable because the video repeats the idea there. |
| 12:13–12:43 | "Each GPU holds one chunk of the token sequence… Every query must compare against every key and value" | Fig 19 is two text boxes: "splits the model" and "splits the sequence". |
| 12:44–13:33 | Ring attention mechanics; "as long as the math on one block outlasts the transfer of the next"; DeepSeek V4, Llama 4 Scout | Fig 20 draws a ring of six GPUs with no state, no merge rule and no timing arithmetic, and drops the names. |
| **13:35–14:54** | Ring all-reduce: slices, a reduce-scatter lap, an all-gather lap, "One slice per step for roughly two laps", "twice the message size whether the ring holds eight GPUs or 16,000", "no algorithm can move less" | Figs 21–22. There is no step-by-step and no derivation. Fig 21's "one full lap" contradicts Fig 22's two laps, and the 1.75× and 2.00× bars are drawn identical. |
| 15:44–16:01 | "When Nvidia trained a model of about 8 billion parameters across 512 GPUs…" | Fig 24 covers it but names no source (Megatron-LM, 2019). |

Well covered: 0:00–0:42 (Fig 1), 2:30 (Fig 6), 11:07–11:56 (Fig 18), 14:56–15:44 (Fig 23) and
16:15–16:45 (Fig 25).

### Stamps that do not match the speech

No stamp is out of order. Ten stamps land 7 to 17 seconds early, usually on the last sentence of the
previous topic.

| Fig | Stamp | Where the video discusses it (SRT cue) | Use |
|---|---|---|---|
| 2 | 0:24 | "split across many GPUs" 0:34. The word "node" itself is at 3:34. | 0:34 |
| 3 | 0:24 | "The model has to be split across many GPUs" 0:34 | 0:34 |
| 4 | 0:24 | "On a single GPU, there is nothing to coordinate" 0:42; "B cannot start…" 1:03 | 0:42 |
| 5 | 1:26 | "Two memory pressures force the split" 1:29 | 1:29 |
| 7 | 2:30 | "The workhorse is the all reduce" 2:44 | 2:44 |
| 8 | 3:19 | "The hardware these patterns run on is not uniform" 3:30 | 3:30 |
| 10 | 5:23 | "So, the price is two all reduces per layer" 5:38 | 5:38 |
| 12 | 7:01 | "Spanning nodes cheaply has a cost" 7:15 | 7:15 (7:35 if N21 takes 7:15) |
| 13 | 7:34 | "Four stages fed four micro batches idle near 43%" 7:57 | 7:57 |
| 14 | 8:14 | "The bubble is not the same size for every job" 8:22 | 8:22 |
| 15 | 9:03 | "A mixture of experts layer takes the feed forward block" 9:18 | 9:18 (9:33 if N25 takes 9:18) |
| 17 | 10:20 | "What surprised me in the measurements" 10:37 | 10:37 |
| 19 | 12:01 | "Every strategy so far has split the model" 12:13 | 12:13 |
| 20 | 12:38 | "a 2023 technique called ring attention" 12:44 | 12:44 |
| 22 | 13:40 | "The ring cuts the message into one slice per GPU" 13:56; the count is at 14:23 | 14:23 once rewritten (see §5) |
| 25 | 16:08 | "And one question is still open" 16:15 | 16:15 |

Fig 13 also carries the interleaving trick, which is spoken at 8:06–8:20, under its 7:34 stamp. N23 moves it to 8:09.

---

## 3. Concept trees

```
1. The model must be split: the weights exceed any chip            [COVERED Fig 1]
  size = parameter count x bytes per parameter                      [TAUGHT IN V01 Fig 73, 105; V04 Fig 4]
    FP8 = one byte per parameter                                    [TAUGHT IN V04 Fig 28, 32]
    TB and GB, powers of ten                                        [TAUGHT IN V01 Fig 62]
  GPU memory capacity: 80 GB, 192 GB                                [TAUGHT IN V01 Fig 105-107; V02 Fig 91]
  capacity wall is not the bandwidth wall                           [TAUGHT IN V02 Fig 91] [COVERED Fig 1 caption]
  quantization cannot close it: 1 bit gives 200 GB                  [PARTIAL Fig 1 - in prose, not drawn]
  not even a full 8-GPU node holds it: 1,536 GB < 1,600 GB          [MISSING]
    how many GPUs: 1.6 TB / 192 GB, so at least 9                   [MISSING]

2. The second pressure: the KV cache                                [COVERED Fig 5]
  what K and V are, and why they are kept                           [TAUGHT IN V01 Fig 92, 135-137; V03 Fig 15]
  per-token size 2 x L x KV heads x d x bytes = 327,680 B           [TAUGHT IN V01 Fig 138-140] [PARTIAL Fig 5 - formula, not evaluated]
  x 128,000 tokens = 41.9 GB (x 131,072 = 40.0 GiB), "around 40"   [PARTIAL Fig 5 - stated, not derived]
  x 1M tokens = 328 GB, more than one GPU                           [MISSING - asserted only]
  equals the 140 GB of weights at about 427k tokens                 [MISSING]
  static pressure against dynamic pressure                          [COVERED Fig 5 caption]

3. The hardware is not uniform: fast inside a box, slow between     [COVERED Fig 2, 8]
  a link is wires x frequency                                       [TAUGHT IN V02 Fig 92, 94]
  scale-up (NVLink, NVSwitch) against scale-out (InfiniBand, Ethernet) [TAUGHT IN V02 Fig 93]
  NVLink generations; a 72-GPU domain                               [TAUGHT IN V02 Fig 95, 97]
  bits against bytes: 400 Gb/s = 50 GB/s                            [MISSING] (bytes TAUGHT IN V01 Fig 73)
  one direction against both directions added                       [MISSING - changes 18-36x to 9-18x]
  message time = fixed latency + size / bandwidth                   [MISSING]
    count against rate                                              [TAUGHT IN V01 Fig 63, 75]
    latency is not bandwidth                                        [TAUGHT IN V01 Fig 76; V02 Fig 9]
  "heavy constant traffic stays in, thin occasional traffic crosses" [COVERED Fig 8 - never quantified]

4. Splitting turns compute into compute plus communication          [COVERED Fig 3, 4]
  dependency: B waits for A's output                                [TAUGHT IN V02 Fig 13] [PARTIAL Fig 4 - boxes, not time]
  idle while a message is in flight                                 [PARTIAL Fig 4 - prose]
  the two questions: what is sent, how often                        [COVERED Fig 4]
    why "how often" costs: a fixed toll per exchange                [MISSING]
  hiding a wait by overlapping it                                   [TAUGHT IN V02 Fig 55; V03 Fig 72]
  shard: the piece each GPU holds                                   [MISSING - "shard" used in Fig 16, 23, never defined]

5. Collectives                                                      [COVERED Fig 6 - the word]
  all-reduce: everyone contributes, everyone gets the sum           [PARTIAL Fig 7 - drawn as a central hub, no data]
    reduce = combine position by position by adding                 floor
  reduce-scatter: sum, each keeps one slice                         [PARTIAL Fig 7 - one line]
  all-gather: every piece copied everywhere                         [PARTIAL Fig 7 - one line]
  reduce-scatter then all-gather = all-reduce                       [PARTIAL Fig 22 - asserted]
  all-to-all: chunks transposed between GPUs                        [PARTIAL Fig 7 - one line]
    why "heaviest": N-1 partners each, N(N-1) conversations, uneven [MISSING]
  point-to-point                                                    [COVERED Fig 7]
  bytes each pattern costs one GPU                                  [MISSING]

6. Tensor parallelism: split each weight matrix                     [PARTIAL Fig 9 - names the split, no worked example]
  vector times matrix                                               [TAUGHT IN V01 Fig 84-85, 112]
    dot product                                                     [TAUGHT IN V03 Fig 14]
    a matmul decomposes into a sum of block products                [TAUGHT IN V03 Fig 35]
    the vector's side decides "rows" or "columns"                   [MISSING - V01 Fig 112 uses rows = outputs]
  feed-forward block: widen, bend, narrow                           [MISSING] (V01 Fig 91 names it; Fig 100-101 count it)
    GELU: its shape; acts on each number alone                      [MISSING]
      why a bend at all: without one, two matrices collapse to one  [MISSING]
      e^x and the normal curve's share (inside GELU)                floor
    the 70B's three-matrix block (gate, up, down) splits alike      [MISSING - V01 Fig 100 says three, V05 says A and B]
  split by output columns: each GPU finishes its own outputs        [MISSING]
  split by input rows: partial sums that must be added              [MISSING]
  why A takes the column split: GELU(a+b) != GELU(a)+GELU(b)        [MISSING]
  one all-reduce per block, and why all-reduce (next layer needs it all) [PARTIAL Fig 9]
    residual stream                                                 [TAUGHT IN V01 Fig 99]
  attention split by heads                                          [PARTIAL Fig 9 - one sentence]
    what a head is                                                  [TAUGHT IN V03 Fig 13]
    64 query / 8 KV heads gives 8 + 1 per GPU                       [TAUGHT IN V03 Fig 88-89 (GQA)] [MISSING here]
    W_O split by rows: the second all-reduce                        [MISSING]
    the KV cache splits with the heads (40 KB per token per GPU)    [MISSING]
  Megatron-LM named                                                 [MISSING]

7. Tensor parallelism's price and reward                            [COVERED Fig 10 - count only]
  two blocking all-reduces per layer, 160 per token                 [COVERED Fig 10] (drawn in reverse order)
  critical path: the next layer waits                               [PARTIAL Fig 10 - no timeline]
  message = tokens x 8,192 x 2 B (16 KB per token)                  [MISSING]
  per GPU per token: 160 x 1.75 x 16 KB = 4.6 MB                    [MISSING]
  priced, 4,096-token prefill: 42 ms NVLink, 376 ms network, 73 ms arithmetic [MISSING]
  decode is toll-bound: 160 fixed costs per token                   [MISSING - VERIFY latency]
  reward: an eighth of the weights, 5.2 ms against 41.8 ms          [PARTIAL Fig 10 - asserted]
    time per token = bytes / bandwidth                              [TAUGHT IN V01 Fig 14]

8. Pipeline parallelism                                             [COVERED Fig 11]
  what crosses a stage boundary: one 16 KB vector per token         [MISSING]
  per GPU per token: 16 KB against tensor parallelism's 4.6 MB (280x) [MISSING - Fig 11 draws ~1.4x]
  each stage holds a quarter of the layers (35 GB)                  [MISSING]
  the handoff hides behind the next microbatch                      [PARTIAL Fig 11 - prose] [TAUGHT IN V02 Fig 55]
  the bubble: fill and drain                                        [COVERED Fig 12]
    one batch, four stages: 75% idle                                [MISSING]
  microbatches                                                      [COVERED Fig 12]
  (p-1)/(m+p-1), derived by counting cells                          [PARTIAL Fig 12 - stated]
  diminishing returns                                               [PARTIAL Fig 13 - bars mis-scaled, caption wrong]
  interleaved chunks: 43% to 27% for 7 messages instead of 3        [PARTIAL Fig 13 - one sentence]

9. Pipelines in serving: prefill against decode                     [COVERED Fig 14]
  prefill has many tokens to slice                                  [TAUGHT IN V01 Fig 109-110]
  decode: each token waits for the last, so 1 of 4 stages is busy   [PARTIAL Fig 14 - prose]
    the sequential dependency                                       [TAUGHT IN V01 Fig 110, 132]
  continuous batching supplies other requests                       [PARTIAL Fig 14 - one line] (in depth later: V07 Fig 6)
  disaggregation: separate prefill and decode pools                 [PARTIAL Fig 14 - one line] (V07 Fig 10)

10. Expert parallelism                                              [COVERED Fig 15]
  the FFN is 82% of a layer's weights                               [TAUGHT IN V01 Fig 101] [MISSING here]
  an MoE layer: many FFNs, a few used per token                     [COVERED Fig 15]
    router: score every expert, keep the top six                    [MISSING] (in depth later: V06 Fig 9, 13)
    6 of 384 = 1.6%, to scale                                       [MISSING - Fig 15 lights 2 of 6]
  placement: expected local experts = 6 / EP                        [MISSING]
  one token's trip: dispatch, compute, combine                      [COVERED Fig 16]
  the all-to-all as a traffic table that changes per batch          [PARTIAL Fig 16]
  the shuffle dominates: 70% of the layer, 40% end to end           [COVERED Fig 17]
  spilling past the node: (k-1)/k of the traffic crosses            [MISSING]
  DeepEP named                                                      [MISSING]

11. Data parallelism                                                [COVERED Fig 18]
  throughput is not latency                                         [TAUGHT IN V01 Fig 142]
  why training replicas all-reduce their gradients                  [PARTIAL Fig 18 - asserted]
    a gradient is the nudge for each weight                         [PARTIAL V01 Fig 3; V03 Fig 60]
    averaging keeps the copies identical                            [MISSING]
    size: 140 GB per step; each GPU sends 245-280 GB                [MISSING]
  inference has no gradients, so zero bytes                         [COVERED Fig 18]

12. Sequence (context) parallelism and ring attention               [COVERED Fig 19]
  each GPU's share: 1M tokens over 8 GPUs = 41 GB each              [MISSING]
  tensor and pipeline splits also divide the cache, by fixed factors [MISSING - Fig 19 caption implies not]
  why attention resists: the query x key grid, 75% of it remote     [PARTIAL Fig 19 - one sentence]
    attention = weighted average over all keys                      [TAUGHT IN V01 Fig 93-94; V03 Fig 21]
  ring attention: rotate KV blocks for N steps                      [PARTIAL Fig 20 - no state]
  partial results merge exactly                                     [MISSING here] [TAUGHT IN V03 Fig 55-59, 93]
  overlap: compute grows as c^2, transfer as c; c* = 2,473 tokens   [PARTIAL Fig 20 - stated, not quantified]
    asynchronous transfer                                           [TAUGHT IN V03 Fig 72]
  why decode cannot hide the ring (one query)                       [MISSING - VERIFY practice]
  context bounded by the ring's combined memory                     [COVERED Fig 20]
  Ring Attention (2023), DeepSeek V4, Llama 4 Scout named           [MISSING]

13. The ring all-reduce                                             [PARTIAL Fig 21, 22]
  the obvious ways cost (N-1)S, or 2(N-1)S on one collector link    [MISSING - Fig 21 caption hints]
  cut the message into N slices                                     [PARTIAL Fig 22 - one sentence]
  reduce-scatter, step by step (N-1 steps)                          [MISSING]
  all-gather, step by step (N-1 steps)                              [MISSING]
  count: 2(N-1) slices of S/N = 2(N-1)/N x S                        [PARTIAL Fig 22 - results without derivation, bars equal]
  floor: (N-1)/N out plus (N-1)/N in, hence bandwidth-optimal       [PARTIAL Fig 22 - "twice is the floor", loosely]
  the step count 2(N-1) still grows                                 [MISSING]

14. Composition and placement                                       [COVERED Fig 23]
  GPU count = TP x PP x DP                                          [MISSING]
  one illustrative replica: 32 GPUs, 50 GB of weights each          [MISSING]
  what each split divides (weights, cache, time, traffic)           [PARTIAL Fig 10 caption - overclaims]
  scaling efficiency = achieved / ideal                             [COVERED Fig 24]
    75% of 512 = 384 GPUs' worth; 128 lost                          [MISSING]
    source: Megatron-LM 2019, 8.3B, 512 V100s                       [MISSING - VERIFY]

15. The hand-off: sparsity left unexplained                         [COVERED Fig 25]
  6/384 = 1.6% of routed experts against "3% of weights"            [MISSING - VERIFY active parameters]
```

---

## 4. Proposed new figures

There are 42 new figures, listed in video order and grouped into build-ups. "Insert after" uses the
current figure numbers. Where an existing figure has to move or be rewritten for a build-up to read
correctly, the entry says so, and §5 has the details. A companion page
(`atlases/V05_Parallelism_animation.html`, following the V01 and V03 pattern) should hold the six
entries marked **[WIDGET]**. The static figure stays in the atlas either way.

### A. The capacity wall, counted (Part 1)

**1. N1**
- **Insert after:** Fig 02 (restamp both to 0:34)
- **Title:** *Not even a full eight-GPU node can hold the weights*
- **Idiom:** bars to scale on one GB axis: weights 1,600; an 8×B200 node 1,536; an 8×H100 node 640;
  one B200 192. Beneath them, a row of nine B200 tiles with the ninth outside the node's outline.
- **Fills:** tree 1, "not even a full node" and "how many GPUs".
- **Numbers:** `1.6e12/192e9` = 8.33, so `ceil` gives 9; `8*192` = 1,536 < 1,600;
  `1.6e12/80e9` = 20; `8*80` = 640 (v1.py). VERIFY: DGX B200 lists 1,440 GB (180 GB per GPU usable),
  which falls even further short.
- **Body:** this is why the slow network between boxes cannot be avoided, before any cache is counted.
  It sets up Fig 8.

**2. N2**
- **Insert after:** Fig 05 (2:10)
- **Title:** *A million tokens of cache is bigger than the chip*
- **Idiom:** the equation built up, `2 × 80 × 8 × 128 × 2 = 327,680 B per token` (a recap of V01 Fig
  140). Then bars on one GB axis: 128k tokens 41.9; 427k tokens 140 (equal to the 16-bit weights);
  1M tokens 327.7; the B200 192.
- **Fills:** tree 2, the 128k, 1M and "equals the weights" nodes.
- **Numbers:** `327680*128000` = 41.94 GB; `327680*131072` = 42.95 GB = 40.0 GiB (the video's "around
  40"); `327680*1e6` = 327.7 GB; `140e9/327680` = 427,246 tokens; `192e9/327680` = 585,938 (v1.py).

### B. The five patterns, worked (Part 2, one build-up on the same data)

All four figures use one dataset. GPU k holds `[1,2,3,4] × 10^(k−1)`: G1 `[1 2 3 4]`, G2
`[10 20 30 40]`, G3 `[100 …]`, G4 `[1000 …]`. Each GPU's numbers sit in their own decimal place, so every
digit of a sum shows whose contribution has arrived. The same data returns in Part 8.

**3. N3**
- **Insert after:** Fig 07 (2:44)
- **Title:** *An all-reduce leaves every GPU holding the same sum*
- **Idiom:** small multiples. A 4×4 grid (rows are GPUs, columns are positions) before, and the same
  grid after, with every row `1111 2222 3333 4444`.
- **Body:** "reduce" means combine position by position by adding. Everyone needs the result because
  the next step starts from the whole vector on every GPU.
- **Fills:** tree 5, all-reduce. It also replaces Fig 7's hub drawing (§5).
- **Numbers:** column sums 1111, 2222, 3333, 4444 (v6.py).

**4. N4**
- **Insert after:** N3 (2:52)
- **Title:** *Reduce-scatter and all-gather are its two halves*
- **Idiom:** small multiples, three grids: the start; after reduce-scatter (diagonal only, G1 holds
  1111 in slot 1, G2 2222 in slot 2, and so on); after all-gather (every row full). The arrows read
  "add, keep one slice" and "copy every slice everywhere".
- **Fills:** tree 5, reduce-scatter, all-gather, and "RS then AG = AR".
- **Numbers:** as N3.

**5. N5**
- **Insert after:** N4 (3:09)
- **Title:** *An all-to-all is a transpose; a point-to-point is one arrow*
- **Idiom:** a grid before and after. Rows are the sending GPU and columns the destination. G1 holds
  `a1 a2 a3 a4`, G2 holds `b1…b4`, and so on. Afterwards G1 holds `a1 b1 c1 d1`: the grid transposed.
  A side panel shows a single arrow G2 → G3.
- **Fills:** tree 5, all-to-all and point-to-point.
- **Numbers:** none.

**6. N6**
- **Insert after:** N5 (3:17)
- **Title:** *What each pattern asks of one GPU*
- **Idiom:** a table with bars, for N = 8:

  | Pattern | Sent per GPU | Partners |
  |---|---|---|
  | all-reduce | 2(N−1)/N·S = 1.75 S | 2 neighbours |
  | reduce-scatter, all-gather | 0.875 S each | 2 neighbours |
  | all-to-all | (N−1)/N of its buffer | 7 partners at once, 56 conversations |
  | point-to-point | one message | 1 partner |

- **Body:** the all-to-all is "heaviest" even though its bytes per GPU are not the largest. Every pair
  talks at once (56 conversations at N = 8, 4,032 at 64), the chunk sizes are uneven and, in MoE,
  redrawn every batch. It cannot be arranged as neighbour traffic on a ring. The ring costs are
  derived in Part 8; say so.
- **Fills:** tree 5, bytes per pattern and "why heaviest".
- **Numbers:** `2*7/8` = 1.75; `7/8` = 0.875; `8*7` = 56; `64*63` = 4,032 (v4.py, v5.py).

### C. The links in numbers (Part 2)

**7. N7**
- **Insert after:** Fig 08 (3:55)
- **Title:** *Gigabits are not gigabytes, and two directions are not one*
- **Idiom:** the equation built up, then bars to scale per direction. `400 Gb/s ÷ 8 = 50 GB/s` for one
  network port. NVLink on H100 is 900 GB/s = 450 + 450; on B200 1.8 TB/s = 900 + 900. Bars: 450 against
  50, and 900 against 50.
- **Fills:** tree 3, bits against bytes, and direction.
- **Numbers:** `400/8` = 50; `900/50` = 18 and `1800/50` = 36 (the video's ratios); `450/50` = 9 and
  `900/50` = 18 like for like (v1.py, v7.py). VERIFY: NVIDIA quotes 900 GB/s and 1.8 TB/s as
  *bidirectional* (NVLink 4: 18 links × 25 GB/s each way; NVLink 5: 18 × 50); a 400 Gb/s NDR or
  ConnectX-7 port is 400 Gb/s *each way*.
- **Caption:** keep the presenter's 18–36×, which is how the specs are usually quoted, and say plainly
  that like for like it is 9–18×. That is still a cliff.

**8. N8**
- **Insert after:** N7 (4:21)
- **Title:** *Every exchange pays a fixed toll before the first byte moves*
- **Idiom:** log-log line plot of time against message size, one curve for NVLink and one for the
  network, each `t = α + S/B`. Each curve has a flat floor for small messages and a rising line for big
  ones. Mark 16 KB (one decode token's tensor-parallel message, N16) and 64 MB (a 4,096-token prefill
  message).
- **Body:** a small message is almost all toll, which is why "how often" matters as much as "how much".
- **Fills:** tree 3, message time; tree 4, why "how often" costs.
- **Numbers:** `16384/450e9` = 0.036 µs; `16384/50e9` = 0.33 µs; `67.1e6/450e9` = 149 µs;
  `67.1e6/50e9` = 1,342 µs (v1.py). VERIFY α, the NCCL small-message latency on NVLink and on
  InfiniBand. Draw the curves schematic until it is measured or sourced.

### D. Tensor parallelism from the floor (Part 3)

**Ordering change for this group:** insert N9–N13 *before* Fig 09, and move Fig 09 after N13 as the
assembled picture, restamped 5:20 (just before "One all reduce sums the partials into the true
result", 5:23). Parts first, then assembly.

**9. N9**
- **Insert before:** Fig 09 (4:36)
- **Title:** *A feed-forward block widens, bends, then narrows*
- **Idiom:** shapes drawn to scale. Open on Megatron-LM's recipe: split every weight matrix. Then the
  video's two-matrix block: a token vector 8,192 wide → A (8,192 × 32,768) → a 32,768-wide hidden
  vector → GELU → B (32,768 × 8,192) → 8,192 wide. Bar widths in proportion (4×).
- **Fills:** tree 6, the feed-forward block. Recap V01 Fig 91: the FFN treats each token alone.
- **Numbers:** `4*8192` = 32,768; `2*8192*32768` = 536.9 M parameters per layer (v7.py). VERIFY: the
  4× expansion of Megatron-LM's and GPT's MLP. Say that the 70B from V01 uses a three-matrix version
  (N14).

**10. N10**
- **Insert after:** N9 (4:58)
- **Title:** *GELU bends each number on its own*
- **Idiom:** a function graph on a coordinate grid, x from −3 to 3, with a faint y = x guide. Dots at −2,
  −1, 0, 1 and 2, each labelled with its value. A second panel, *without the bend, two matrices are only
  one*: in one dimension, y = 3x then z = 2y gives z = 6x, still a straight line. Without a bend, A and
  B would collapse into one matrix.
- **Fills:** tree 6, GELU and why a bend at all.
- **Numbers:** `x*0.5*(1+erf(x/sqrt(2)))` gives −0.0455, −0.1587, 0, 0.8413, 1.9545 at −2, −1, 0, 1, 2
  (v2.py). Φ, the share of a normal curve below x, is basic probability.
- **Body:** whoever holds a number can bend it, so nothing has to be sent.

**11. N11**
- **Insert after:** N10 (5:05)
- **Title:** *Split by output columns, each GPU finishes its own numbers*
- **Idiom:** the equation built up on a tiny grid: `x = [1 2]` times `A = [[1,0,2,1],[0,1,1,3]]` gives
  `[1 2 4 7]`. Columns 1–2 are tinted for GPU 1 and 3–4 for GPU 2. Each output is a dot product of the
  whole x with one column (V03 Fig 14). GPU 1 gets `[1 2]` and GPU 2 gets `[4 7]` with no exchange.
  Both hold a copy of x.
- **Body note on convention:** the token is written on the left, so each column of A makes one output.
  V01 Fig 112 put the vector on the right, where the same split is by rows. What matters is splitting
  by outputs.
- **Fills:** tree 6, column split and the convention node.
- **Numbers:** `[1·1+2·0, 1·0+2·1, 1·2+2·1, 1·1+2·3]` = `[1, 2, 4, 7]` (v2.py).

**12. N12**
- **Insert after:** N11 (5:15)
- **Title:** *Split by input rows, each GPU holds part of every number*
- **Idiom:** the same grid continued. `h = [1 2 | 4 7]`, which is exactly what N11 left on each GPU.
  `B = [[1,0],[0,1],[1,1],[2,−1]]`, rows 1–2 on GPU 1 and rows 3–4 on GPU 2. GPU 1 computes `[1, 2]`
  and GPU 2 computes `[18, −3]`: "the right shape, but only part of the value". Then
  `[1,2] + [18,−3] = [19,−1]`, the true hB, with one all-reduce. Point back to V03 Fig 35: each block of
  the result is a sum of block products.
- **Body:** the GELU between A and B changes the numbers but not who holds them, so it is left out of
  this arithmetic. Say so.
- **Fills:** tree 6, row split and partial sums.
- **Numbers:** hB = `[19, −1]`; partials `[1, 2]` and `[18, −3]` (v2.py).

**13. N13**
- **Insert after:** N12 (5:15)
- **Title:** *The bend decides the order: columns first, rows second*
- **Idiom:** a chain of consequences in two columns.
  - **Rows first:** A split by rows leaves GPU 1 with partial `[1,0,2,1]` and GPU 2 with `[0,2,2,6]`.
    Bending each and adding gives `[0.84, 1.95, 3.91, 6.84]`, but the bend of the sum is
    `[0.84, 1.95, 4.00, 7.00]`. So an all-reduce is needed before GELU: two exchanges per block.
  - **Columns first:** the bend is local, then B is split by rows: one exchange per block.

  A boxed counterexample: GELU(3) + GELU(−2) = 2.95, while GELU(3 − 2) = GELU(1) = 0.84.
- **Fills:** tree 6, "why A takes the column split".
- **Numbers:** row-split check (v2.py and inline): `GELU(p1)+GELU(p2)` = `[0.8413, 1.9545, 3.909, 6.8413]`;
  `GELU(sum)` = `[0.8413, 1.9545, 3.9999, 7.0]`; `gelu(3)+gelu(-2)` = 2.9505.
- **Next:** Fig 09 goes here as the assembly (5:20).

**14. N14**
- **Insert after:** Fig 09, moved (5:20)
- **Title:** *The 70B's three-matrix block splits the same way*
- **Idiom:** nested containers per GPU. Gate and up, each 8,192 × 28,672, are split by columns: 3,584
  per GPU. SiLU(gate) × up is number by number, so local. Down, 28,672 × 8,192, is split by rows,
  giving a partial result and one all-reduce.
- **Caption:** reconciles V01 Fig 100's "three feed-forward matrices per layer" with the video's A and B.
- **Fills:** tree 6, the three-matrix block.
- **Numbers:** `28672/8` = 3,584; `3*8192*28672` = 704,643,072 (V01 Fig 101's 704.6 M); `/8` = 88.1 M
  parameters = 176 MB in 16-bit per GPU per layer (v1.py). VERIFY: the SiLU-gated FFN in the Llama 3
  config.

**15. N15**
- **Insert after:** N14 (5:27)
- **Title:** *Attention splits by heads, and the cache splits with them*
- **Idiom:** a floor plan of eight GPU boxes, each holding 8 query heads and 1 KV head (V03 Fig 13,
  88–89). W_Q, W_K and W_V are split by columns (whole heads); W_O is split by rows, giving the second
  all-reduce. A small bar compares the KV cache per token per GPU, 40,960 B, with 327,680 B unsplit.
- **Body caveat:** with more GPUs than KV heads, the KV heads must be copied. That is one reason
  eight is the natural group size here.
- **Fills:** tree 6, heads, W_O rows, and the cache splitting.
- **Numbers:** `64/8` = 8; `8/8` = 1; `327680/8` = 40,960 (v1.py).

**16. N16**
- **Insert after:** Fig 10 (5:45)
- **Title:** *Each all-reduce carries every token's whole vector*
- **Idiom:** the equation built up, `message = tokens × 8,192 × 2 B`, with log-scale bars: 1 token
  16 KB (decode, batch 1); 64 tokens 1.0 MB; 4,096 tokens 67.1 MB (prefill). Second line: over one
  pass, each GPU sends 160 × 1.75 × 16,384 B = 4.6 MB per token.
- **Body:** why an all-reduce and not a sum on one GPU: the next layer's column split needs the whole
  vector on every GPU (the residual stream, V01 Fig 99).
- **Fills:** tree 7, message size and per-GPU traffic; tree 6, why all-reduce.
- **Numbers:** `8192*2` = 16,384; `*64` = 1,048,576; `*4096` = 67,108,864; `2*7/8*16384` = 28,672;
  `*160` = 4,587,520 (v2.py).

**17. N17** [WIDGET: prompt length and link bandwidth sliders]
- **Insert after:** N16 (5:50)
- **Title:** *Across the network, the exchanges would outlast the arithmetic five times over*
- **Idiom:** bars to scale in ms, for one 4,096-token prefill of the 70B on 8 GPUs: arithmetic 73 ms
  (ideal, 989 TFLOPS each); 160 all-reduces on NVLink 42 ms; on the network 376 ms. A schematic decode
  panel: 160 fixed tolls against a 5.2 ms token.
- **Body:** on NVLink the exchanges can partly overlap the arithmetic. Across the network nothing can
  hide 376 ms.
- **Fills:** tree 7, "priced" and "decode is toll-bound".
- **Numbers:** `2*70.6e9*4096/(8*989e12)` = 73.1 ms; `1.75*67.1e6/450e9` = 0.261 ms, `×160` = 41.8 ms;
  `1.75*67.1e6/50e9` = 2.349 ms, `×160` = 375.8 ms; `375.8/73.1` = 5.1 (v2.py, v7.py). VERIFY: 450 GB/s
  per direction (N7), and 989 TFLOPS dense BF16 for the H100, the value V01 and V02 already use.

**18. N18**
- **Insert after:** N17 (6:05)
- **Title:** *An eighth of the weights is an eighth of the reading*
- **Idiom:** bars to scale in ms per decode token: one GPU (if the model fit) 41.8; TP = 8, 5.2 per
  GPU; a schematic sliver for the 160 exchanges.
- **Fills:** tree 7, the reward. Recap V01 Fig 14: time per token = bytes / bandwidth.
- **Numbers:** `140e9/3.35e12` = 41.8 ms; `140e9/8/3.35e12` = 5.2 ms (`70.6e9*2/8` = 17.65 GB gives
  5.27 ms) (v2.py).

### E. Pipeline parallelism (Part 4)

**19. N19**
- **Insert after:** Fig 11 (6:43)
- **Title:** *A pipeline handoff is sixteen kilobytes per token*
- **Idiom:** log-scale bars of bytes sent per GPU per token (70B, decode): TP = 8, 4,587,520 B; PP = 4,
  16,384 B; a ratio of 280×. Counts: 160 blocking exchanges against one handoff per stage. Each stage
  holds 20 layers, 35 GB. One handoff takes 0.33 µs over the network.
- **Fills:** tree 8, what crosses, the 280×, and the stage share. This supplies the numbers Fig 11's
  bars should have (§5).
- **Numbers:** `4587520/16384` = 280; `16384/50e9` = 0.33 µs; `140/4` = 35 GB (v2.py, v7.py).

**20. N20**
- **Insert after:** N19 (6:52)
- **Title:** *The handoff hides behind the next microbatch*
- **Idiom:** a lane chart with three lanes: stage-1 compute (mb1, mb2, mb3), a link lane (mb1's
  activations travelling under mb2's compute), and stage 2. Recap V02 Fig 55 (the cook) and V03 Fig 72.
- **Fills:** tree 8, "hides behind".
- **Numbers:** 32 decode tokens: the stage reads 35 GB in `35e9/3.35e12` = 10.4 ms; the handoff is
  `32*16384/50e9` = 10.5 µs, about 1,000× shorter (v7.py).

**21. N21**
- **Insert before:** Fig 12 (7:15). Fig 12 moves to 7:35, "The fix is microbatches".
- **Title:** *One batch through four stages leaves three quarters idle*
- **Idiom:** a lane chart of 4 stages × 4 slots, one filled cell per stage on the diagonal, 12 dashed.
  Then Fig 12 shows m = 4; number its cells 1–4.
- **Fills:** tree 8, the single-batch bubble.
- **Numbers:** `(4−1)/(1+4−1)` = 75% (v3.py).

**22. N22** [WIDGET: p, m and v sliders; the chart redraws and the idle % updates. Verified against `simulate()` in v3.py]
- **Insert after:** Fig 12 (7:46)
- **Title:** *The bubble formula is a count of empty cells*
- **Idiom:** Fig 12's chart with the idle cells numbered. Total slots m + p − 1 = 7; each stage busy
  m = 4; p − 1 = 3 idle per stage; 12 of 28 empty = 3/7. In general, (p−1)/(m+p−1).
- **Fills:** tree 8, formula derivation.
- **Numbers:** `4*7` = 28; `4*3` = 12; `12/28` = 0.4286 (v3.py).

**23. N23**
- **Insert after:** Fig 13 (8:09)
- **Title:** *Two short chunks per GPU shrink the bubble from 43% to 27%*
- **Idiom:** small multiples, two lane charts at p = 4, m = 4. One block per GPU: 7 slots, 43% idle.
  Two chunks per GPU: 11 half-slots, 27% idle. Arrows count the messages: 3 against 7 per microbatch.
- **Fills:** tree 8, interleaving.
- **Numbers:** simulated forward-only schedule (v3.py): makespan 11 chunk-units, 8 busy per GPU, idle
  3/11 = 27.3%, which matches (p−1)/(v·m+p−1); messages p·v − 1 = 7.

**24. N24**
- **Insert after:** Fig 14 (8:41)
- **Title:** *In decode, one request keeps one stage busy in four*
- **Idiom:** small-multiple lane charts. (a) One request: t1 passes stages 1→4, and only then can t2
  enter stage 1, so each stage is busy one slot in four. (b) Four requests staggered: every stage busy
  in every slot.
- **Caption:** continuous batching (V07 Fig 6) supplies the other requests; disaggregation (V07 Fig 10)
  gives each phase its own pool.
- **Fills:** tree 9, decode.
- **Numbers:** `1/4` = 25%; with p requests in flight, 100% in steady state (v3.py).

### F. Expert parallelism (Part 5)

**25. N25**
- **Insert before:** Fig 15 (9:18). Fig 15 moves to 9:33.
- **Title:** *The feed-forward block is over four fifths of a layer*
- **Idiom:** bars to scale for one 70B layer: attention 151.0 M, feed-forward 704.6 M (82%), a recap of
  V01 Fig 101. "A mixture of experts replaces exactly the bigger bar."
- **Fills:** tree 10, the FFN share.
- **Numbers:** `704643072/(704643072+150994944)` = 0.8235 (v1.py).

**26. N26**
- **Insert after:** Fig 15 (9:33)
- **Title:** *Six of 384, and how the six are chosen*
- **Idiom:** a 16 × 24 grid of 384 cells with 6 lit (sparsity, to scale). Beside it, a table with a
  pointer for the router: the token vector goes through one small matrix multiply, giving 384 scores;
  keep the six largest; their scores weight the six outputs. Forward pointer to V06 Fig 9 and 13.
- **Fills:** tree 10, router and the to-scale ratio.
- **Numbers:** `6/384` = 1.5625%; `16*24` = 384 (v7.py).

**27. N27**
- **Insert after:** Fig 16 (10:02, "A couple might live on this chip")
- **Title:** *Most of a token's six experts live on other GPUs*
- **Idiom:** bars of expected local experts out of six, assuming uniform routing: EP 2 → 3.0;
  4 → 1.5; 8 → 0.75; 16 → 0.38; 64 → 0.09. Also the share that leaves the GPU, 1 − 1/EP.
- **Caption:** real routers are skewed; see V06 Fig 17–18. The video's "a couple" corresponds to a
  small expert-parallel group.
- **Fills:** tree 10, placement.
- **Numbers:** `6/EP`; `1-1/EP` (v4.py); P(all six local at EP = 8) = `comb(48,6)/comb(384,6)` = 2.9e−6.

**28. N28** [WIDGET: a "new batch" button redraws the table and flags the heaviest column]
- **Insert after:** N27 (10:13)
- **Title:** *The all-to-all is a traffic table that changes every batch*
- **Idiom:** small multiples, two 4 × 4 count heatmaps. Rows are the sending GPU and columns the
  receiving GPU; 4 GPUs, 8 experts (2 each), 16 tokens per GPU, top-2.

  | | Batch 1 | Batch 2 |
  |---|---|---|
  | Rows | `[14 6 4 8 / 7 9 9 7 / 10 5 9 8 / 7 7 8 10]` | `[9 11 5 7 / 9 10 7 6 / 8 5 14 5 / 8 8 7 9]` |
  | Expert load (column sums) | 38 27 30 33 | 34 34 33 27 |

  Combine is the same table transposed.
- **Fills:** tree 10, the traffic table.
- **Numbers:** seeded simulation, `random.seed(7)`, `random.sample(range(8),2)` per token (v4.py).
  Off-diagonal share 67% in both draws (75% expected).

**29. N29**
- **Insert after:** Fig 17 (10:42)
- **Title:** *Spread the experts over k nodes and (k−1)/k of the traffic crosses the slow wire*
- **Idiom:** bars: k = 1, 0%; 2, 50%; 4, 75%; 8, 87.5%. Each crossing runs at about 50 GB/s instead of
  about 450 GB/s each way (N7). This is the arithmetic behind 15:22, "suffer wherever they spill past
  it".
- **Fills:** tree 10, spilling.
- **Numbers:** `(k-1)/k` (v4.py). Assumes uniform routing; node-limited routing (V06 Fig 21) exists to
  cut this.

### G. Data parallelism (Part 6)

**30. N30**
- **Insert after:** Fig 18 (11:19)
- **Title:** *Training copies must agree on every nudge; serving copies have none*
- **Idiom:** a two-column chain.
  - **Training:** replica 1 sees batch A and computes nudges ΔA; replica 2 sees B and computes ΔB. If
    each applied its own, the copies would drift apart. So average (ΔA+ΔB)/2 and apply it everywhere.
    That is an all-reduce of one number per weight at every step, 140 GB, and each GPU sends 245 GB
    (N = 8) up to 280 GB (large N) to do it.
  - **Serving:** no nudges, so 0 bytes.
- **Fills:** tree 11, gradients, averaging and size. Builds on V01 Fig 3's "nudge every weight".
- **Numbers:** `70e9*2` = 140 GB; `2*7/8*140` = 245; `2*15999/16000*140` = 280.0 (v4.py).

### H. Sequence parallelism and ring attention (Part 7)

**31. N31**
- **Insert after:** Fig 19 (12:21)
- **Title:** *Eight GPUs turn a 328 GB cache into 41 GB each*
- **Idiom:** a bar of 1,000,000 tokens cut into eight segments of 125,000, each labelled with its
  41 GB of cache, against the whole 328 GB on one GPU.
- **Body:** tensor parallelism also divides the cache, by KV heads (at most 8 here), and the pipeline
  divides it by layers. Only splitting the sequence keeps dividing as the context grows.
- **Fills:** tree 12, the share and the fixed-factor node.
- **Numbers:** `1e6/8` = 125,000; `327680*125000` = 40.96 GB; `327680*1e6` = 327.7 GB (v4.py).

**32. N32**
- **Insert after:** N31 (12:34)
- **Title:** *Three quarters of the score grid needs someone else's keys*
- **Idiom:** a grid of queries (rows) by keys (columns) in 4 × 4 blocks. GPU k owns query row-block k
  and key/value column-block k. The diagonal is local (teal); the other 12 blocks are remote (red).
  Recap: each query's output is a weighted average over every key (V01 Fig 93–94, V03 Fig 21).
- **Caption caveat:** under the causal mask (V01 Fig 132) the 6 blocks above the diagonal are empty,
  which loads the GPUs unevenly.
- **Fills:** tree 12, why attention resists.
- **Numbers:** 16 blocks, 4 local, 12 remote = 75%, 6 empty when causal (v7.py).

**33. N33** [WIDGET: step through; N32's grid fills block by block]
- **Insert after:** Fig 20 (12:49)
- **Title:** *After four steps, every GPU has met every block*
- **Idiom:** a table with a pointer. Rows are steps 1–4 and columns GPUs 1–4; each cell is the KV
  block held (GPU g holds block (g − t + 1) mod 4 at step t). The matching cell of N32's grid lights as
  each step is computed.
- **Fills:** tree 12, the rotation.
- **Numbers:** 4 steps of compute, 3 transfers.

**34. N34**
- **Insert after:** N33 (12:58)
- **Title:** *Partial answers from different blocks merge exactly*
- **Idiom:** the equation built up, a recap of V03 Fig 55–59 and 93. One query. Block 1 has scores
  [1, 3] and values [10, 20]: max 3, partial 18.81. Block 2 has scores [5, 2] and values [30, 40]:
  max 5, partial 30.47. Rescale block 1 by e^(3−5) = 0.135 and combine: 28.9847, identical to one
  softmax over all four scores.
- **Fills:** tree 12, the merge.
- **Numbers:** v5.py: merged O/L = 28.984746; direct = 28.984746.

**35. N35** [WIDGET: block-size and bandwidth sliders]
- **Insert after:** N34 (13:06)
- **Title:** *Work grows with the square of the block, transfer only with its length*
- **Idiom:** a log-log plot per step per layer. Compute time grows as c² (c queries × c keys × 32,768
  FLOPs) and transfer time as c (c × 4,096 B). The lines cross at c\*: 2,473 tokens over 50 GB/s, 275
  over NVLink (each way). Mark c = 125,000: 518 ms of compute against 10 ms of transfer (51×).
- **Caption:** in decode there is one query, so compute is 8 FLOPs per byte moved and the transfer
  would take 2,473× the compute. That makes the ring a prefill tool. VERIFY the practice: decode passes
  the query instead ("pass-Q").
- **Fills:** tree 12, overlap and decode.
- **Numbers:** `64*128*2*2` = 32,768 FLOPs per query–key pair per layer; `2*8*128*2` = 4,096 B per
  token per layer; `989e12*4096/(32768*50e9)` = 2,472.5; at 450e9, 274.7; `125000**2*32768/989e12` =
  517.7 ms; `125000*4096/50e9` = 10.24 ms; decode ratio 2,472.5 (v4.py, inline). VERIFY 989 TFLOPS
  and 450 GB/s.

### I. The ring all-reduce, step by step (Part 8)

Fig 21 is rewritten to carry the "obvious ways" (§5), and Fig 22 is rewritten as the count. New
figures:

**36. N36**
- **Insert after:** Fig 21, rewritten (13:56)
- **Title:** *Cut every message into one slice per GPU*
- **Idiom:** the 4 × 4 provenance grid from N3: G1 `[1 2 3 4]` … G4 `[1000 …]`, columns as slices.
  Mark the targets: G1 will finish slice 1 = 1111, and so on. Overview strip, taken from Fig 22's top
  panel: reduce-scatter, then all-gather.
- **Fills:** tree 13, slicing.
- **Numbers:** v6.py.

**37. N37** [WIDGET: one stepper for N37 and N38; digits fill in]
- **Insert after:** N36 (14:03)
- **Title:** *Reduce-scatter: each slice makes one lap, collecting*
- **Idiom:** small multiples, three steps (N − 1). Each step shows the grid with that step's four sent
  cells highlighted and arrows to the right-hand neighbour.
  - Step 1: G1→G2 slice 4 (4); G2→G3 slice 1 (10); G3→G4 slice 2 (200); G4→G1 slice 3 (3000).
  - Step 2: 3003, 44, 110, 2200.
  - Step 3: 2202, 3033, 444, 1110.
  - End: G1 holds 1111 in slice 1, G2 2222, G3 3333, G4 4444.
- **Fills:** tree 13, reduce-scatter.
- **Numbers:** v6.py simulation log.

**38. N38**
- **Insert after:** N37 (14:16)
- **Title:** *All-gather: the finished slices make one more lap*
- **Idiom:** small multiples, three steps. Step 1 sends 1111, 2222, 3333 and 4444 to the right; steps 2
  and 3 forward them. At the end every row reads 1111 2222 3333 4444. Nothing is added, only copied.
- **Fills:** tree 13, all-gather.
- **Numbers:** v6.py.

**39. N39** (optional)
- **Insert after:** Fig 22, rewritten (14:29, "A bigger ring means more steps")
- **Title:** *The bytes stay flat; the number of steps does not*
- **Idiom:** paired bars for N = 8 and N = 16,000. Bytes per GPU: 1.75 S against 2.00 S. Steps on a log
  scale: 14 against 31,998. Each step pays N8's toll; at 5 µs a step (VERIFY), 16,000 GPUs spend 0.16 s
  on tolls alone. That is why very large groups combine rings with trees or hierarchies (VERIFY: NCCL's
  tree algorithms).
- **Fills:** tree 13, step count.
- **Numbers:** `2*(N-1)` = 14 and 31,998; `31998*5e-6` = 0.16 s (v5.py).

**40. N40**
- **Insert after:** N39 (14:43)
- **Title:** *No algorithm can send less*
- **Idiom:** the equation in two terms. In the first half, each GPU must get its contributions to the
  N−1 slices it does not finish out to the GPUs that do: at least (N−1)/N·S out. In the second half,
  each must receive the N−1 finished slices it lacks: at least (N−1)/N·S in. As much is sent as
  received, so the total is 2(N−1)/N·S. The ring meets both bounds exactly; that is what
  "bandwidth-optimal" means.
- **Fills:** tree 13, the floor.
- **Numbers:** VERIFY the formal bound (Patarasuk & Yuan, 2009, "Bandwidth optimal all-reduce
  algorithms for clusters of workstations").

### J. Putting them together (Part 9)

**41. N41**
- **Insert after:** Fig 23 (15:00)
- **Title:** *One replica, drawn: the strategies nest*
- **Idiom:** nested containers. A data-parallel copy (one of 4) contains 4 pipeline stages, one per
  node, each holding a tensor-parallel group of 8 GPUs. That is 8 × 4 = 32 GPUs per copy and 128 in all.
  Weights per GPU are 1.6 TB / 32 = 50 GB, which leaves 142 GB of a 192 GB B200 for cache.
- **Caption:** labelled illustrative, because the video gives no layout. In MoE layers expert
  parallelism takes the place of one of these cuts.
- **Fills:** tree 14, GPU count and the replica.
- **Numbers:** `8*4` = 32; `*4` = 128; `1600/32` = 50; `192-50` = 142 (v5.py).

**42. N42**
- **Insert after:** N41 (15:37)
- **Title:** *What each split divides, and what it leaves alone*
- **Idiom:** a table read as a heatmap. Rows are the five strategies; columns are weights per GPU,
  cache per GPU, time per decode token, long-prompt prefill time, and traffic.

  | Split | Weights | Cache | Decode token | Long prefill | Traffic |
  |---|---|---|---|---|---|
  | Tensor | ÷8 | ÷8 (up to KV heads) | ≈÷8 less the exchanges | ÷8 | two all-reduces per layer |
  | Pipeline | ÷p | ÷p | ×1 | ×1 | one handoff per stage |
  | Expert | expert weights ÷EP | ×1 | ≈×1 | ×1 | two all-to-alls per layer |
  | Data | ×1 | ×1 | ×1 | ×1, throughput ×copies | none |
  | Sequence | ×1 | ÷N | ×1 | ÷N | a hidden ring |

  Mark it "approximate".
- **Fills:** tree 14, "what each split divides". It corrects Fig 10's "only strategy" (§5).
- **Numbers:** none new.

---

## 5. Problems in existing figures

### Factual and numeric errors

1. **Fig 13 caption is wrong on both counts.** It says "going from 4 to 8 halves the bubble, going
   from 16 to 32 barely moves it". In fact 4 → 8 is 42.9% → 27.3% (×0.636), and 16 → 32 is 15.8% → 8.6%
   (×0.543), which nearly halves it (v3.py). **Fix:** "Each doubling removes fewer points, 16, then 11,
   then 7, but never reaches zero."
2. **Fig 13 bars are drawn at twice their value.** The fills are 6 px per percent (258, 162, 96, 54) on
   a dashed 300 px track that reads as 100%. The track is really 50%, so 43% fills 86% of it.
   **Fix:** 3 px per % on the 300 px track, giving 128.6, 81.8, 47.4 and 25.7 px (v3.py, v7.py), or
   label the track end "50%".
3. **Fig 22 has equal bars and a self-contradiction.** "Ring of 8: about 1.75x" and "Ring of 16,000:
   about 2.00x" are both 300 px wide; to scale they are 262.5 and 300. The prose then says "twice the
   message size is the floor", which would put the 1.75× ring below the floor.
   **Fix:** the floor is 2(N−1)/N·S, which approaches 2. Rewrite Fig 22 as the count: the equation
   built term by term plus the 2(N−1)/N curve (§4, Group I). Move its top panel (reduce-scatter →
   all-gather) into N36.
4. **Fig 21 contradicts Fig 22.** It says "After one full lap every GPU has seen every other GPU's
   contribution, and each has added them up". That describes passing whole vectors round the ring,
   which costs each GPU (N−1)·S. That is the cost that *grows* with N, which is exactly what the video
   says the ring avoids (13:49: "You would expect each GPU's cost to grow… It does not."). Fig 22 then
   says the ring takes two laps. Fig 21 also re-defines all-reduce in Fig 7's words.
   **Fix:** rewrite Fig 21 as *The obvious ways to sum across GPUs grow with the group*, small
   multiples for N = 8:
   - everyone to everyone: 7 S per GPU;
   - one collector: 14 S on its link, the other links idle (keep the current caption's point);
   - whole vectors round a ring: 7 S.

   Delete the "one full lap" sentence (numbers from v5.py).
5. **Fig 11's caption asks for a comparison the bars do not show.** "Compare the two bars. The
   difference in communication volume is the entire reason…", but the bars are 300 and 220 px (1.36:1).
   Per GPU per token the true ratio is 4,587,520 B against 16,384 B, which is 280:1 (v2.py).
   **Fix:** log-scale bars with the numbers (N19), or counts (160 against 1).
6. **Fig 10 draws a layer backwards.** "all-reduce after the FFN" sits left of "all-reduce after
   attention", but a layer runs attention first. The exchanges are also coloured `m` (compute) although
   the header key assigns `h` to communication. **Fix:** see Idioms, below.
7. **Fig 10 overclaims.** It says "This is the only strategy here that does that", and the caption says
   "Everything else on this list buys capacity or throughput instead". The transcript says "This is the
   strategy that makes a single token faster" (6:11). Sequence parallelism also cuts a long prompt's
   prefill, since each GPU computes 1/N of the queries. **Fix:** match the transcript and let N42 carry
   the precise comparison.
8. **Fig 1 claims more than the video.** It says "the biggest chip available"; the transcript says "a
   high-end Nvidia B200". Larger-HBM parts exist (VERIFY: B300 and MI355X at 288 GB, still 5.6× too
   small: `1600/288`). **Fix:** say "a high-end B200", and draw the 200 GB one-bit bar beside the 192 GB
   bar so "still overflows" is visible.
9. **Fig 8's 18–36× mixes directions.** It compares NVLink's two-way totals with the network's one-way
   50 GB/s; per direction the ratio is 9–18× (N7; VERIFY datasheets). The 360 px NVLink bar also
   encodes only H100's 900 although the label names both chips. **Fix:** keep the presenter's ratio and
   add the per-direction line; label the bar "H100".
10. **Fig 19's caption is too absolute.** "It is the only strategy here aimed at the cache rather than
    at the weights." Tensor parallelism divides the cache by heads (40 KB per GPU against 320 KB, N15)
    and the pipeline divides it by layers. **Fix:** "the only split that keeps dividing the cache as the
    context grows".
11. **Fig 17 drops the presenter's hedge.** The video says the all-to-alls "can eat over 70%"; the atlas
    writes "over 70% shuffling". **Fix:** keep "can". The source is unnamed in the video (VERIFY).
12. **Fig 9's convention conflicts with V01, and the FFN is unreconciled.** "A by columns" assumes the
    token is on the left; V01 Fig 112 taught rows = outputs. The video's two-matrix FFN also sits
    unreconciled against V01 Fig 100's three FFN matrices. **Fix:** N11's convention note, and N14.
13. **Fig 2 is loose about the wiring.** "wired together directly on the board" is really through
    NVSwitch chips on the baseboard (V02 Fig 93). Minor.
14. **Fig 24 names no source.** **Fix:** name Megatron-LM (Shoeybi et al., 2019): 8.3 B parameters, 512
    V100s, 15.1 PFLOPS against a 39 TFLOPS single-GPU baseline,
    `15.1e15/(512*39e12)` = 75.6% (VERIFY). Add "384 GPUs' worth of work, 128 lost"
    (`0.75*512` = 384). Keep "training, on 2019 hardware" visible.
15. **Fig 15 draws the wrong ratio.** It lights 2 of 6 experts (33%) for a 6/384 = 1.6% fact, without
    saying it is schematic. **Fix:** the N26 grid.

### ASR-mangled names (the atlas avoided the errors by omitting the names; put the correct ones in)

Searching the raw SRT for the correct spellings will fail.

| SRT says (time) | Correct | Where to name it |
|---|---|---|
| "DPP" (10:59) | DeepEP | Fig 17 |
| "DeepSeek before" (13:29) | DeepSeek V4 (VERIFY its 1M window) | Fig 20 |
| "Meta's llama for scout" (13:31) | Meta's Llama 4 Scout, 10M window | Fig 20 |
| "split all two walls" (15:22) | "'s all-to-alls stay" | Fig 23 already right |
| "a combined back" (10:27) | "a combine back" | Fig 16 already right |
| "until they they" (5:43) | "until they finish" | Fig 10 already right |
| "fires and all reduce" (13:35) | "fires an all-reduce" | none needed |
| "Deep Seek V4 Pro" (16:04) | DeepSeek V4 Pro | Fig 1, which omits the model name |

Also missing although spoken correctly: **Megatron-LM** (4:36, 5:55) in Fig 9, and **Ring Attention**
(Liu, Zaharia & Abbeel, 2023) in Fig 20.

### Voice

- No "the video says", no "the instructor" and no labelled additions.
- "in this video" (Figs 2, 3, 7, 25) and "later in the video" (Fig 8 caption) follow V01's usage.
  Optionally write "below" in Fig 8's caption.
- Fig 20's heading "Ring attention" repeats its title. Give it a job, for example "Six GPUs, six blocks,
  six steps".

### Neighbours that repeat each other

- **Fig 2 / Fig 8:** both deliver "the cliff at the edge of the box" (Fig 2: "falls off a cliff"; Fig 8:
  "the cliff is waiting"), and V02 Fig 93 already taught scale-up against scale-out. **Fix:** Fig 2
  only defines node and cluster physically and hands over to N1; Fig 8 keeps the cliff.
- **Fig 3 / Fig 4:** both say that splitting means waiting for messages, with near-identical captions
  ("prices that conversation" / "the whole framework"). **Fix:** give Fig 3 a new job, *Four ways to
  cut a model, and one way to copy it*: a stack of 80 layers with cut lines for layers (pipeline),
  inside each matrix (tensor), between experts (expert) and along the token sequence (sequence), plus
  whole copies (data). Define **shard** there; it is used undefined in Figs 16 and 23.
- **Fig 7 / Fig 21:** both define all-reduce in the same words. Fixed by Fig 21's rewrite.
- **Fig 12:** its prose describes one batch ("While stage one works on the first batch…") while the
  drawing already shows four microbatches. Fixed by N21, plus numbering Fig 12's cells.

### Idioms that fight the idea

- **Fig 4:** boxes for an idea about time. Use a lane chart: A busy then idle, the wire busy, B idle
  then busy.
- **Fig 7:** draws all-reduce as parts → "the sum" → totals, a central hub. That plants the
  central-collector picture that Fig 21's caption rejects ("A central collector would leave every other
  wire idle"). Use N3's before/after grid; keep the five-name menu.
- **Fig 10:** use a lane chart of one layer. Attention compute, then an all-reduce with every lane
  hatched as waiting, then FFN compute, then an all-reduce, then the next layer. That draws "the next
  layer cannot start until they finish" instead of stating it.
- **Fig 19:** two text boxes. Use N31's cut sequence bar.
- **Fig 20:** a ring with no state. Pair it with N33's step table.
- **Fig 23:** its right column mixes places ("inside a node", "crosses between boxes") with a purpose
  (Sequence: "long context"). Make it a place: "wherever compute can hide the ring".
- **Colour key:** communication is drawn as `m` (Fig 10), `s` (Fig 7's "the sum", Fig 9's "one
  all-reduce", Fig 22's all-gather) and `h` (all-to-all), although the key says `h` = "communication and
  what it costs". Pick one rule and apply it.

---

## 6. Size after the pass

- **About 67 figures:** the current 25 plus 42 new (66 without the optional N39). That is about 4.0 per
  minute, in line with V04 (4.0) and approaching V01 and V02. Figs 3, 21 and 22 are rewritten and
  Figs 9, 12 and 15 move.
- **A companion page** `V05_Parallelism_animation.html`, with acts for the pipeline scheduler
  (N21–N23), the ring all-reduce stepper (N37–N38), the ring-attention stepper (N33), the all-to-all
  reroute (N28) and the bandwidth and block-size sliders (N17, N35). The index row goes from 25 to
  about 67 figures, plus the companion link.

**The three highest-value changes**

1. **Work tensor parallelism down to a 2×4 matrix (N9–N15).** The video's central mechanism currently
   gets one figure with no matrix in it. The new figures cover the FFN's shape, what GELU is, a column
   split and a row split on real numbers with the partial sums visible, why the bend forces
   columns-first (GELU(3) + GELU(−2) ≠ GELU(1)), and the 70B's actual shapes and heads. This also
   reconciles V01's three FFN matrices with the video's A and B.
2. **Do the ring all-reduce step by step (N36–N40, Fig 21 and 22 rewritten, widget).** Provenance
   digits (1111, 2222…) let a reader watch reduce-scatter and all-gather happen. The count derives
   2(N−1)/N instead of quoting it, and the floor argument is made explicit. This removes the current
   one-lap/two-lap contradiction and the identical 1.75× and 2.00× bars.
3. **Price the traffic (N7, N8, N16–N19, N29, N35).** These replace "heavy", "thin" and "hidden" with
   numbers:
   - bits against bytes and one direction against two;
   - the fixed toll per exchange;
   - 16 KB against 4.6 MB per token (280×);
   - 42 ms on NVLink against 376 ms on the network against 73 ms of arithmetic for a 4k prefill;
   - (k−1)/k of all-to-all traffic crossing nodes;
   - the ring-attention crossover at about 2,500 tokens.

   In passing they correct Fig 11's and Fig 13's mis-scaled bars and Fig 13's wrong caption.
