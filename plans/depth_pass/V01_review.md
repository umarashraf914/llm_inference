# V01 · The Memory Wall — depth review

Inputs read in full: the outline (147 figures), the transcript (31:08). I checked SRT windows at 0:40–2:00, 2:40–3:30, 7:00–9:00, 15:55–17:05, 20:10–20:50 and 25:25–26:32. I rendered Figs 12, 14, 62, 76, 81, 123, 129 and 134, and read the SVG coordinates of Figs 12, 62, 67, 68, 81, 129 and 134. I recomputed every number below in Python and give the expression. `VERIFY` marks a number that needs an outside source.

---

## 1. Snapshot

**147 figures in 12 parts.** The atlas contains no interactive widget. The 20-act animation "One conversation, end to end" is linked only from `index.html`.

| Part | Figs | Stamps |
|---|---|---|
| 1 Before we start | 1–14 | all 0:00 |
| 2 What inference is | 15–60 | 0:00–1:57, of which **42 are at 0:46** |
| 3 The 30 millisecond puzzle | 61–69 | 2:41–3:29 |
| 4 Two numbers, two different physics | 70–83 | 3:51–6:07 |
| 5 What a transformer actually does | 84–104 | 6:29–9:08 (12 at 7:15) |
| 6 The weights, and what they cost to move | 105–108 | 9:30 |
| 7 Two phases with opposite profiles | 109–118 | 10:39–12:09 |
| 8 Arithmetic intensity and the roofline | 119–127 | 14:04–16:44 |
| 9 Placing the two phases | 128–130 | 17:30–19:26 |
| 10 The KV cache | 131–141 | 21:23–25:13 |
| 11 What the user feels | 142–145 | 26:41–28:11 |
| 12 Where that leaves us | 146–147 | 29:42–30:27 |

**Keep these. They are the best of the atlas.**
- **Figs 111–116 derive the operation count from first principles.** The sequence runs: a multiply-accumulate is two operations (111), each weight is touched once per token (112), the rule holds matrix by matrix (113), so a token costs 2N operations (114). Fig 115 then marks the rule's limit with correct attention costs: `4*8192*ctx*80` gives 5.4, 21.5 and 335.5 GFLOP at 2k, 8k and 128k context. Fig 116 lands at 1 operation per byte. This is the spine of the video's argument and it reaches the floor.
- **Fig 101 uses the parameter count as evidence.** 151.0 M of attention plus 704.6 M of feed-forward per layer, times 80, plus 2.10 B, gives 70.55 B. If Q, K and V existed only once for the whole model the total would be 63.93 B. Both numbers reproduce exactly. It is the atlas's best example of verifying instead of asserting.
- **Figs 87–89 treat the embedding as a row lookup and the output projection as a full read** ("Written as a multiply, never done as one"). This pair clarifies something textbooks blur. Its vector width needs fixing (§5.1 #11).
- **Fig 9 works softmax with real arithmetic.** All four shares reproduce: 74.495%, 24.797%, 0.678%, 0.031%. Figs 61–66 build operations, powers of ten, counts against rates and units that cancel. Fig 102 flags its own intuition as unmeasured. Fig 18 keeps "projections are inherently uncertain". The atlas also avoids the captions' mishearings: Wulf (captions say "Wolf"), TPOT ("TPT", "TBot"), goodput ("good put"), byte-hungry ("bite-hungry").

---

## 2. Coverage against the transcript

### 2.1 Stretches covered thinly or skipped

| Range | What is said | In the atlas |
|---|---|---|
| **1:14–1:50** | "comes down to one number, cost per token. The models keep growing… parameter counts in the high hundreds of billions to over a trillion. Open systems like Chimera 2 [= Kimi K2] and DeepSeek V4…", then "a stack of techniques that mostly did not exist 5 years ago" | **Nothing.** No figure falls between 0:46 and 1:57. Cost per token appears only as a label in Fig 18. |
| 2:06 | the route: "the prefill cluster, the key-value cache transfer between machines, the decode cluster, **the multi-token decoding loop**, and back to the user's screen" | Fig 60 has six of the seven stages. The decoding loop and the idea of separate clusters are missing. |
| 3:31 | "derive those 30 milliseconds from just two numbers for any model on any chip" | Promised in Figs 11 and 67, but only the 70B-on-H100 case is ever worked. |
| 4:14–4:36 | compute "tracks transistor density, how many arithmetic units you can fit… has grown exponentially for decades" | One line in Fig 78. "Transistor" is never defined. Exponential growth is never drawn: Fig 81 is a linear schematic. |
| **7:49–8:00** | "compares every query against every key, producing a matrix of similarity scores, then uses those scores to blend the values" | What "compare" means (a dot product) and how scores become weights (softmax) are never shown. Fig 92 restates the sentence. |
| **8:04–8:25** | the feed-forward block: "two large weight matrices with a **non-linear activation** between them" | **One label in Fig 91.** The non-linearity is not explained in any of the nine atlases: V02, V05 and V07 mention "the activation function" or GELU only in passing. |
| 8:27–8:53 | layer output becomes the next layer's input; the vocabulary projection; "one forward pass" | Covered by Figs 96, 103 and 104, but stamped 7:15 and 9:08 (§2.2). |
| **20:22–20:29** | "batching independent requests or generating multiple tokens per forward pass" | One label in Fig 130 ("batching, or several at once"). Fig 116 uses "ridge at batch 295", but **"batch" is never defined in V01.** |
| **23:55–24:16** | "eight key value heads of dimension 128" | Heads, head dimension and GQA are used in Figs 112, 139 and 140 and never built. V03 Fig 13 builds heads two videos later. |
| 25:37–26:04 | five families of techniques that attack the cache, including "amortize the cost across many conversations running at the same time" | Fig 141 lists four. The fifth (batching) is missing. |
| 26:24 | "Half a second if the prompt is short, several seconds if it is long" | Stated in Fig 143 but not derived, though every number needed is already on the page. |
| 28:06 | "They pay for the chip by the hour and sell the tokens" | Not used. Cost per token is never computed. |
| 30:15 | "It is bandwidth divided by bytes per token" | Fig 146 turns this into an equation that fails the atlas's own unit test (§5.1 #1). |

Covered well, so the reported gaps are not real gaps:
- **12:17–13:42** sits under one dense figure, Fig 117. It is fine; restamp Fig 118 to 13:21.
- **19:42–21:23** is covered by Fig 130 and the early Fig 110. The real gap there is the thinness of routes 2 and 3.

### 2.2 Stamps that do not match the content

**The 41 figures stamped 0:46 (Figs 19–59).** At 0:46 the video is saying "Deloitte projects… roughly 2/3 of all AI compute in 2026."

- **The topics are absent from the transcript.** The block covers system prompts, tool definitions, skills, plugins, network round trips, bytes on the wire, cache hits, warm and cold caches, and eviction. Searching the transcript for "system prompt", "tool", "skill", "plugin", "cache hit", "warm" and "evict" finds nothing. "network" occurs only as "feed forward network".
- **The video touches this material in three places only:**
  - one clause at 25:41: "share the cache across requests that have a common prefix";
  - the streaming sentence at 26:30;
  - the append-to-the-cache step at 23:13.
- **The block uses concepts 60–110 figures before they are built.**
  - Keys and values are used at Fig 26 and built at Fig 92.
  - Prefill is used at Fig 22 and built at Fig 109.
  - W_K is used at Fig 37 and built at Fig 97.
  - The residual stream is used at Fig 40 and built at Fig 99.
  - "Cache" is used about 40 times before Fig 135 defines it.
- **It is written as replies to one reader's questions.** Figs 29, 38, 42, 43 and 138 address "you" (§5.3).
- **Its prefix-caching core duplicates V07 Figs 12–14.** V07 Fig 14 repeats V01 Figs 26 (the cached-read discount) and 53 (cache-aware routing).

Where each piece belongs, in video order:

| Figures | New home | Why |
|---|---|---|
| 19 | 0:21 | The scheduler "batches them alongside thousands of others". Fix its last sentence (§5.1 #19). |
| 21 | merge into Fig 108 (10:10) | "The weights do not change between requests" |
| 35 | merge into Fig 133 (22:08) | It *is* the video's "key observation" |
| 29 | beside Fig 136 (23:13) | Appending to the cache |
| 20, 26, 27, 33, 34, 36, 38, 39, 41–45, 47–50, 52–56 | 25:41, condensed | "share the cache across requests that have a common prefix". Figs 38–39 and 41–43 stay because they are the reason the prefix rule exists. Drop 46 and 51 (they repeat 44 and 45). Link the "One conversation" animation from here, since it is this block's interactive form. |
| 37, 40 | merge into Figs 97–99 (9:08) | Both make the "fixed matrix, changing input" point that 97–99 make |
| 28, 30–32, 57–59 | 26:30 | "characters stream in at a steady cadence". Merge 57 into 58. |
| 22–25 | cut, or move to V07 Figs 12–14 (15:14) | Where text is stored, tool descriptions against tool code, skills and plugins serve no claim in this video. |

**Figs 1–14 at 0:00 are deliberate.** This is the ground-floor opening part that SKILL.md describes ("what a model file contains, what one weight does, what a token is, the generate-one-token-and-repeat loop"). Fig 15 is the video's real 0:00. Two exceptions:
- **Figs 12–13** use gigabytes, kilobytes and "memory beside the chip" before bytes (Fig 73) and HBM (Fig 107) exist, and they duplicate Fig 106. Merge them into Fig 106 at 9:49.
- **Fig 14** works out ms per token from TB/s for three chips. That is the video's own answer at 19:42, given before the puzzle is posed at 2:28, in units nobody has met yet. Move it after Fig 130 (§4, route 1).

**The backward stamps are not deliberate.** Each is a ground-floor figure inserted beside a neighbour without being reordered.
- **Fig 68 (2:58) comes after Fig 67 (3:29).** The SRT has "300 more tokens" at 3:01 and "less than 1%" at 3:25. Order them 64 → 68 → 67 → 69, or merge 68 and 69; Fig 69's own caption says "Two ways of saying one thing".
- **Fig 125 (14:04) follows Fig 124 (14:51), and Fig 127 (16:21) follows Fig 126 (16:44).** The SRT names the ridge at 16:21, lists the simplifications at 16:40 and gives the H100 numbers at 17:04. Restamp 125 → 16:21, 127 → 16:40, 126 → 17:04, and order them 124 → 125 → 127 → 126.

**Stamp granularity at 7:15–9:08.** All of Figs 91–102 read 7:15. The SRT places the material as follows: QKV at 7:27, the comparison at 7:49, the feed-forward block at 8:04, layer output at 8:27, the vocabulary projection at 8:30, the forward pass at 8:46, and "parameterized by weight matrices" at 9:08. Changes:
- restamp 92 → 7:27;
- restamp 93–94 → 7:49;
- restamp 96 and 102 → 8:27;
- restamp 103 → 8:30 (it reads 9:08);
- move 97–101 (per-layer matrices and the parameter count) to just after 104 at 9:08.

**Smaller restamps:**

| Fig | Now | Should be |
|---|---|---|
| 86 | 6:29 | 6:42 |
| 87–89 | 6:29 | 6:58 |
| 90 | 6:40 | 7:05 |
| 107 | 9:30 | 9:49 |
| 118 | 12:09 | 13:21 |
| 123 | 14:51 | 15:07 |
| 130 | 19:26 | 19:39 |
| 146 | 29:42 | 29:31 |
| 147 | 30:27 | 30:35 |

---

## 3. Concept trees

`#n` refers to the proposals in §4. V01 is the first atlas, so nothing here can be `TAUGHT IN` an earlier one. Where a later atlas builds a node more fully, the tree says so: V01 still owes a short version at the point it first uses the idea.

```
T1  A trained model is a list of numbers                          [COVERED Fig 1]
  training finds them; inference only reads them                  [COVERED Fig 2, 3]
  a weight scales one input: one multiplication                   [COVERED Fig 4]
  weighted inputs added up = one output (a dot product)           [COVERED Fig 5 — never named]
  the weights never change while serving                          [COVERED Fig 108, 21]
  how one weight fits in 16 bits                                  [PARTIAL Fig 73 — asserted, never shown]
    bits as place values; 8 bits count 0…255                      [MISSING → #6]
      powers of two                                               floor
    16 bits = 65,536 patterns; each weight is rounded to one      [MISSING → #7]
    sign, exponent, mantissa                                      [MISSING here; built in V04 Figs 6–18]
```
```
T2  Tokens and the generation loop
  a token is a piece of text with an ID                           [COVERED Fig 6, 86, 87]
    the vocabulary: a fixed table of ~128,000 pieces              [PARTIAL Fig 8, 87 — size only]
  one full forward pass per generated token                       [COVERED Fig 7, 109]
    a score for every vocabulary entry                            [COVERED Fig 8]
    softmax: e^score, then divide by the total                    [COVERED Fig 9]
      e^x, fractions of a whole                                   floor
    draw one token in proportion                                  [COVERED Fig 10]
      basic probability                                           floor
    stop token or length limit                                    [COVERED Fig 109]
  ms per token and tokens per second are reciprocals              [COVERED Fig 11 — reading-speed claim wrong]
```
```
T3  Model size against the hardware
  frontier models: high hundreds of billions to over 1 T params   [MISSING → #3]
  parameters × bytes per parameter = bytes                        [COVERED Fig 73, 105]
    1 T × 2 bytes = 2 TB                                          [MISSING → #20]
  capacity: does it fit at all?                                   [PARTIAL Fig 80 — defined, never applied]
    140 GB > 80 GB on one H100; 2 TB = 25 H100s                   [MISSING → #20]
    splitting one model across chips                              [MISSING here; built in V05 Figs 1–3]
```
```
T4  The 30 ms puzzle
  0.1 ms of maths inside a 30 ms step                             [COVERED Fig 64, 67–69]
    one operation = one multiply or one add                       [COVERED Fig 61]
    reading 10^15 and 10^11                                       [COVERED Fig 62 — its log-scale claim is false]
      unit prefixes k M G T P and m µ n                           [MISSING → #5]
    count ÷ rate = time; units cancel                             [COVERED Fig 63, 65, 66]
    10^11 per token = 2 × 70 B                                    [COVERED Fig 114 — no pointer from Fig 64]
  the opening "300" is the ridge, 295                             [MISSING → #22]
```
```
T5  Compute throughput, the first number
  operations per second                                           [COVERED Fig 77, 80]
    why a GPU: many simple units on independent work              [COVERED Fig 70]
    peak = units × operations per tick × ticks per second         [MISSING → #8]
      a clock tick, GHz                                           [MISSING here; V02 builds it]
    transistor density → more units in the same area              [PARTIAL Fig 78 — "transistor" undefined]
  "grown exponentially": the same multiplier every year           [MISSING → #10]
    roots and powers (80^(1/10))                                  floor
```
```
T6  Memory bandwidth, the second number
  bytes per second                                                [COVERED Fig 74, 77, 80]
    bit, byte                                                     [COVERED Fig 72, 73]
    giga = 10^9; kilo as 1,000 vs 1,024                           [PARTIAL Fig 73 — GB only; KiB used silently in Fig 139 → #5, #30]
    width × frequency                                             [COVERED Fig 74]
    pins × rate × stacks, with the H100's real numbers            [PARTIAL Fig 78 — never multiplied out → #9]
    rate × time = amount                                          [COVERED Fig 75 — its conclusion misleads]
    latency vs bandwidth; data in flight = bandwidth × latency    [PARTIAL Fig 76 — bandwidth mis-defined]
    a bus: many wires in parallel                                 [PARTIAL Fig 71 — used, never defined]
  why the memory sits off the chip                                [COVERED Fig 79]
  HBM: stacked dies on the same package                           [COVERED Fig 105, 107 — drawn twice; "die" undefined]
  three tiers: disk, HBM, on-chip                                 [COVERED Fig 12, 106 — on-chip size wrong]
```
```
T7  The memory wall
  compute grows faster than bandwidth                             [COVERED Fig 78, 81]
    three physical ceilings on bandwidth                          [COVERED Fig 78]
    80× against 17×, 2012–2022                                    [COVERED Fig 81 — schematic; source VERIFY]
  only the ratio of the two matters                               [COVERED Fig 125]
  named in 1995                                                   [COVERED Fig 82]
  arithmetic is cheap, moving data is expensive                   [COVERED Fig 83]
```
```
T8  Vectors and matrices
  vector, matrix                                                  [COVERED Fig 84]
  matrix × vector = one dot product per row                       [COVERED Fig 85, 112]
  a dot product measures agreement                                [MISSING → #12; V03 Fig 14 builds it later]
  transpose (Kᵀ)                                                  [MISSING — used in Fig 115; V03 Fig 19]
  embedding = copying out one row                                 [COVERED Fig 87, 88]
```
```
T9  A transformer layer
  layer = attention, then feed-forward                            [COVERED Fig 91]
  residual stream: vector + block(vector)                         [PARTIAL Fig 99 — named; the addition never drawn → #19]
    vector addition                                               floor, once shown
  same shape in and out, so layers stack                          [COVERED Fig 96]
  60 to over 100 layers, each with its own weights                [COVERED Fig 98, 100, 102]
  position has to be encoded                                      [COVERED Fig 90]
  normalisation                                                   [MISSING — named once in Fig 115; low priority]
  vocabulary projection; one forward pass                         [COVERED Fig 103, 104]
```
```
T10 Attention
  each position becomes a weighted average of earlier ones        [COVERED Fig 93, 94]
    weighted average                                              [COVERED Fig 93]
    projection: vector × W_Q, W_K, W_V                            [PARTIAL Fig 92 — roles only → #11]
    score = query · key                                           [MISSING → #12, #13]
    every query against every key: an n × n grid                  [PARTIAL Fig 92 names it; Fig 132 the triangle → #13]
    scores → weights by softmax                                   [PARTIAL Fig 94 says "add to 1"; never linked to Fig 9 → #14]
  causal mask                                                     [COVERED Fig 132]
  heads: 64 slices of 128 numbers                                 [MISSING → #28; V03 Fig 13]
    grouped-query: 8 KV heads serve 64 query heads                [MISSING — named in Fig 139 → #29; V03 Figs 88–89]
  attention's own work grows with context                         [COVERED Fig 115]
```
```
T11 The feed-forward network
  two matrices with a non-linearity between them                  [PARTIAL Fig 91 — one label]
    widen 8,192 → 28,672, then narrow back                        [MISSING → #15]
    why a bend is needed: a line of a line is a line              [MISSING → #16; not explained in any atlas]
      linear functions and their graphs                           floor
    ReLU and SiLU                                                 [MISSING → #17]
      e^x                                                         floor
  Llama's gated version has three matrices                        [MISSING → #18; contradicts Figs 104/113]
  it holds 82% of a layer's weights                               [MISSING → #18]
```
```
T12 Prefill and decode
  prefill: the whole prompt at once; decode: one token per pass   [COVERED Fig 109, 110]
    the chain of dependencies                                     [COVERED Fig 110, 132]
  spreading one weight read over many tokens                      [COVERED Fig 117, 118]
  prefill intensity = prompt length; ridge at about 295 tokens    [MISSING → #22, #33]
```
```
T13 Operations per token
  2 × parameters                                                  [COVERED Fig 111–114]
    multiply-accumulate = 2 operations                            [COVERED Fig 111]
    each weight touched once per token                            [COVERED Fig 112]
  what the rule leaves out                                        [COVERED Fig 115]
  operations ÷ bytes = 1 at 16 bits                               [COVERED Fig 116 — mixes storage and arithmetic precision]
```
```
T14 Arithmetic intensity and the roofline
  intensity = operations ÷ bytes                                  [COVERED Fig 120]
  a bottleneck: the slowest stage sets the pace                   [COVERED Fig 119]
  logarithmic axes                                                [COVERED Fig 121 — but Fig 62 uses one first]
  reading a point on a plot                                       [COVERED Fig 122]
    coordinates                                                   floor
  attainable = min(peak, bandwidth × intensity)                   [COVERED Fig 123]
    the lower of two lines                                        [COVERED Fig 124]
    drawn to scale on log–log axes                                [PARTIAL Fig 123, 129 — not to scale → #21]
  ridge = peak ÷ bandwidth = 295                                  [COVERED Fig 126]
  busy fraction at intensity 1 = 1/295 = 0.34%                    [PARTIAL Fig 129 says "under 1%" → #22]
  what the model assumes                                          [COVERED Fig 127]
```
```
T15 The throughput ceiling and the three ways past it
  max tokens/s = bandwidth ÷ bytes per token = 24                 [COVERED Fig 130]
  route 1: more bandwidth (another chip)                          [COVERED Fig 14 — misplaced at 0:00]
  route 2: fewer bytes per weight                                 [PARTIAL Fig 116 → #23]
  route 3a: batching                                              [MISSING — "batch" used undefined in Fig 116 → #1, #24, #25]
    intensity = batch size; each user's speed holds to the ridge  [MISSING → #25]
  route 3b: several tokens per pass                               [MISSING → #26; V08 builds it]
```
```
T16 The KV cache
  decode is sequential because attention is causal                [COVERED Fig 132]
  earlier keys and values never change                            [COVERED Fig 133, 35]
  recomputing them grows quadratically                            [PARTIAL Fig 133; Fig 134 is wrong]
    n(n−1)/2                                                      [COVERED Fig 133]
    in seconds: token 10,000 takes 1.4 s instead of 43 ms         [MISSING → #27]
  a cache trades memory for time                                  [COVERED Fig 135]
  append one entry, read them all                                 [COVERED Fig 136, 137]
  size = 2 × layers × KV heads × head dim × bytes                 [COVERED Fig 139, 140]
    heads, head dimension, GQA                                    [MISSING → #28, #29]
    the "KB" in 320 KB means 1,024 bytes                          [MISSING → #30]
  grows in step with context length                               [COVERED Fig 140]
  shares the memory bus with the weights                          [COVERED Fig 141]
    cost to one conversation (100k tokens: 19.4 tok/s)            [MISSING → #31]
    not shared across a batch                                     [MISSING → #32]
  sharing a common prefix                                         [COVERED Figs 33–56 — stamped 0:46, before keys and values exist]
```
```
T17 What users and operators measure
  latency vs throughput                                           [COVERED Fig 142]
  time to first token comes from prefill                          [COVERED Fig 143]
    "half a second… several seconds" = prompt × 2N ÷ peak         [MISSING → #33]
  time per output token comes from decode                         [COVERED Fig 143]
  streaming: each token is sent as it is made                     [COVERED Figs 57–59 — stamped 0:46]
  throughput; the operator rents the chip by the hour             [PARTIAL Fig 145]
    cost per token = $ per hour ÷ tokens per hour                 [MISSING → #2, #34]
  goodput = throughput within the latency targets                 [COVERED Fig 145]
    a latency target, with numbers                                [MISSING → #35]
```
```
T18 The serving stack
  router, scheduler, memory manager, kernels, orchestration       [COVERED Fig 17]
    server, data centre                                           [COVERED Fig 16]
    the scheduler batches requests                                [MISSING → #1]
    a kernel is one program the GPU runs                          [PARTIAL Fig 17 — "the actual arithmetic"; V03 builds it]
  the seven stages a token passes through                         [PARTIAL Fig 60 — six of seven]
```
```
T19 The closing ratio
  factor of 300 = (bytes ÷ bandwidth) ÷ (ops ÷ peak) = ridge ÷ intensity   [MISSING — Fig 146 states it wrongly → #22]
  ms per token for any model on any chip                          [PARTIAL Fig 14, 130 — one case only → #36]
```

---

## 4. Proposed new figures

There are 36, in video order. Insert positions refer to *current* figure numbers, with the relocations of §2.2 assumed. ★ marks an entry that would teach far better as an interactive widget. #21, #25, #32 and #36 can be one widget with more controls.

### A · 0:21–1:50 — what is being served, and what it costs

**1. A batch is several requests going through the model in one pass**
- **After:** Fig 17, restamped 0:21. The video says "a scheduler batches them alongside thousands of others".
- **Idiom:** nested containers. One "pass through the model" box holding four users' next tokens, beside four separate passes.
- **Fills:** T18 the scheduler batches; T15 route 3a, introduced here.
- **Numbers:** none; the drawing is schematic. #24–25 quantify it.

**2. Cost per token is an hourly price divided by the tokens made in that hour**
- **After:** Fig 18, at 1:14 ("comes down to one number, cost per token").
- **Idiom:** equation built up: $ per GPU-hour ÷ (tokens per second × 3,600).
- **Fills:** T17 cost per token.
- **Numbers:** 3,600 s per hour is floor. The worked case is deferred to #34, because tokens per second only arrives at 19:42.

**3. Frontier models carry up to fourteen times the 70 billion numbers this atlas follows**
- **After:** #2, at 1:18.
- **Idiom:** bars to scale, by parameter count: 70 B against "over a trillion".
- **Fills:** T3 frontier scale.
- **Numbers:** `1e12/70e9 = 14.3`. Name the systems as the video does: **Kimi K2** (the captions say "Chimera 2") and DeepSeek V4. Per-model parameter counts are VERIFY before any per-model bar is drawn.
- **Note:** bytes come later (#20), because bits are only built at 3:51.

**4. Almost every technique in this series is less than five years old** *(optional)*
- **After:** #3, at 1:44 ("techniques that mostly did not exist 5 years ago").
- **Idiom:** timeline. The memory wall (1995), the roofline (2009) and the transformer (2017), then FlashAttention, iteration-level batching, speculative decoding, GQA, PagedAttention and prefill/decode disaggregation clustered in 2022–2024.
- **Fills:** orientation.
- **Numbers:** every date is VERIFY.

### B · 2:41 — reading the numbers

**5. Unit prefixes are powers of ten with names**
- **After:** Fig 62 (2:41).
- **Idiom:** table. k = 10³, M = 10⁶, G = 10⁹, T = 10¹², P = 10¹⁵; m = 10⁻³, µ = 10⁻⁶, n = 10⁻⁹. Each row carries an example from this atlas: 140 GB, 3.35 TB/s, 989 TFLOP/s, 30 ms, and HBM latency measured in ns.
- **Fills:** T4 and T6 prefixes.
- **Why:** GB, TB/s, TFLOP/s, KB and ms are used from Fig 12 on, but the only prefix ever stated is "a gigabyte is a billion bytes" (Fig 73). V02, V05 and V09 use tera and nano without defining them.
- **Also:** move Fig 121 (logarithmic axes) here. Fig 62 already uses a log scale, and #10 and the fixed Figs 12 and 81 will too. Leave a one-line recap at 15:20.

### C · 3:55–4:36 — bits, and the two hardware numbers taken apart

**6. Eight bits count from 0 to 255** ★
- **After:** Fig 73, restamped 3:55.
- **Idiom:** bit layout with place values 128 64 32 16 8 4 2 1. Show 01010101 = 85 and all ones = 255. As a widget, the reader flips bits and watches the number change.
- **Fills:** T1 and T6 binary place value.
- **Numbers:** `2**8 = 256`, `0b01010101 = 85`.
- **Why it matters downstream:** V03 Fig 76 relies on "256 distinct values" before V04 builds integers.

**7. Sixteen bits give 65,536 patterns, so every weight is rounded to the nearest one**
- **After:** #6.
- **Idiom:** number line with ticks near 0.13. The 16-bit grid there is spaced 2⁻¹³ = 0.000122 apart, so 0.13 is stored as 0.1300049.
- **Fills:** T1 16-bit precision. Point to V04 Figs 6–18 for the sign, exponent and mantissa fields.
- **Numbers:** `2**16 = 65536`; `numpy.float16(0.13) = 0.1300048828125`.

**8. 989 trillion = arithmetic units × operations per tick × ticks per second**
- **After:** Fig 78. Its content is the video at 4:14.
- **Idiom:** equation built up: 528 tensor cores × 1,024 operations per tick × 1.83 × 10⁹ ticks per second. Then: transistor density means more units in the same area.
- **Fills:** T5 the compute decomposition; transistor.
- **Numbers:** `132*4*512*2*1.83e9 = 9.894e14`. VERIFY the per-core rate (512 dense 16-bit multiply-adds per tick) and the 1.83 GHz clock against NVIDIA's H100 whitepaper. Point to V02.

**9. 3.35 TB/s is 5,120 wires, each carrying 5.2 billion bits a second**
- **After:** #8, at 4:36.
- **Idiom:** equation built up: 5 stacks × 1,024 wires × 5.23 × 10⁹ bits/s ÷ 8 = 3.35 × 10¹² bytes/s. It puts real numbers into Fig 74's width × frequency and Fig 78's three factors.
- **Fills:** T6 pins × rate × stacks.
- **Numbers:** `3.35e12*8/5120 = 5.23e9`. VERIFY that the H100 has 5 active HBM3 stacks (V02 Fig 7 already gives 1,024 bits per stack).

**10. Eighty-fold in a decade is ×1.55 a year; seventeen-fold is ×1.33**
- **After:** #9, at 4:36 ("has grown exponentially for decades").
- **Idiom:** a small table, plus a log-y plot on which the two series are straight lines of different slope.
- **Fills:** T5 and T7 compound growth.
- **Numbers:** `80**0.1 = 1.550`, `17**0.1 = 1.328`, `(80/17)**0.1 = 1.168`, so the gap widens about 17% a year. On a log axis: `log10(80) = 1.90` and `log10(17) = 1.23` decades.
- **Then:** redraw Fig 81 on these axes (§5.5).

### D · 7:27–7:56 — how attention compares tokens

**11. Projecting means multiplying by a matrix: one vector in, three out**
- **After:** Fig 92, restamped 7:27. Fig 92 gives the three roles; this figure gives the operation.
- **Idiom:** equation built up. A 4-number vector × three 4×2 matrices → q, k and v of 2 numbers each. Then the real widths: 8,192 in; Q 8,192 out; K and V 1,024 each. Why K and V are narrower is answered at #29.
- **Fills:** T10 projection.
- **Numbers:** widths from Fig 101's shapes. Compute the toy values when drawing.

**12. A dot product is large when two vectors point the same way** ★
- **After:** #11, at 7:49.
- **Idiom:** 2-D coordinate plot with arrows. a = (3,1); b = (2,2) gives 8; c = (−2,1) gives −5; d = (1,−3) gives 0, perpendicular. As a widget, the reader drags b and watches a·b change size and sign.
- **Fills:** T8 and T10, the dot product as a similarity measure. Rename Fig 5's operation "a dot product" and point here. V03 Fig 14 builds it again later.
- **Numbers:** `3*2+1*2 = 8`, `3*-2+1*1 = -5`, `3*1+1*-3 = 0`.

**13. A score is the query's dot product with each key, and a prompt makes millions of them**
- **After:** #12, at 7:49.
- **Idiom:** table with a pointer. q = (1,2,0,−1) against k₁ = (1,2,0,−1) → 6, k₂ = (0,1,1,0) → 2, k₃ = (−1,−2,0,1) → −6. Then the n × n grid: a 2,000-token prompt gives 4,000,000 scores per head per layer. Draw the full grid here; Fig 132 keeps the causal triangle.
- **Fills:** T10 score; the n × n grid.
- **Numbers:** dot products by hand, checked in Python; `2000**2 = 4000000`.

**14. Softmax turns each row of scores into weights that add to one**
- **After:** #13, at 7:56. Figs 93–94 then follow as the "blend".
- **Idiom:** Fig 9's machinery reused. Scores (0.5, 2.9, 2.1, 0.5) become weights (0.056, 0.613, 0.276, 0.056), which are exactly the illustrative weights of Fig 94. Mention that the scores are first divided by √128 and point to V03.
- **Fills:** T10 scores → weights.
- **Numbers:** `softmax([0.5,2.9,2.1,0.5]) = [0.056,0.613,0.276,0.056]`, which sums to 1.000.

### E · 8:04–8:27 — the feed-forward block and the residual stream

This is the largest hole: the video names the non-linearity at 8:12 and no atlas in the series explains it.

**15. The feed-forward block widens each vector 3.5 times, then narrows it back**
- **After:** Fig 95, restamped 8:04.
- **Idiom:** bars to scale: 8,192 → 28,672 → 8,192.
- **Fills:** T11 the block's shape.
- **Numbers:** `28672/8192 = 3.5`. The shape comes from the same published 70B configuration that Fig 101 uses.

**16. Without a bend between them, two matrices are just one matrix** ★
- **After:** #15, at 8:12.
- **Idiom:** two line graphs on shared axes. f(x) = 2x followed by g(x) = 3x gives g(f(x)) = 6x, one straight line. Put ReLU between them and g(ReLU(f(x))) is 0 for x < 0 and 6x for x > 0. Give the matrix version in one line: W₂(W₁x) = (W₂W₁)x. As a widget, the reader toggles the bend and drags the slopes.
- **Fills:** T11 why a bend is needed. This rests on linear functions, which are floor.
- **Numbers:** for x = −2…2, the two versions give −12, −6, 0, 6, 12 and 0, 0, 0, 6, 12 (Python).

**17. The bend is one small curve applied to every number separately**
- **After:** #16.
- **Idiom:** function plot of ReLU(x) = max(0, x) and SiLU(x) = x / (1 + e⁻ˣ).
- **Fills:** T11 ReLU and SiLU.
- **Numbers:** SiLU at −2, −1, 0, 1, 2 = −0.238, −0.269, 0, 0.731, 1.762 (Python).

**18. Llama's feed-forward block has three matrices, and one of them is a gate**
- **After:** #17.
- **Idiom:** flow. "Up" and "gate" each map 8,192 → 28,672. SiLU(gate) is multiplied by up, number by number. "Down" maps 28,672 → 8,192.
- **Fills:** T11 the gated version. It resolves the two-or-three contradiction between Figs 104/113 and Figs 100/101.
- **Numbers:** `3*8192*28672 = 704.6M`; `704.6/855.6 = 82.4%` of the layer.

**19. Each block adds its result to the vector it was handed**
- **After:** Fig 96, restamped 8:27.
- **Idiom:** equation built up. (0.4, −1.2, 0.0, 0.9) + (0.1, 0.3, −0.2, 0.0) = (0.5, −0.9, −0.2, 0.9). Show attention's change added first, then the feed-forward block's. Name the running vector "the residual stream" here, before Fig 99 uses the term.
- **Fills:** T9 the residual stream, which rests on vector addition.
- **Numbers:** Python.

### F · 9:30 — the bytes meet the chip's capacity

**20. 140 GB does not fit in one H100's 80 GB**
- **After:** Fig 105 (9:30).
- **Idiom:** bars to scale. 140 GB against one 80 GB H100 and against two (160 GB). Then a trillion-parameter model at 2 bytes each: 2 TB, or 25 H100s just to hold it (this completes #3). Two chips each reading 70 GB would take 20.9 ms per token in the ideal case.
- **Fills:** T3 capacity.
- **Numbers:** `140/80 = 1.75` → 2 chips; `1e12*2/80e9 = 25.0`; `70e9/3.35e12 = 20.9 ms`. Point to V05 Fig 1.
- **Why:** Fig 80 lists 80 GB and says "a chip can fail either one", yet never notices that this chip fails capacity for the very model the atlas follows.

### G · 17:04–19:01 — the roofline to scale, and the 300 explained

**21. Slide a workload along the roofline** ★
- **After:** Fig 126, restamped 17:04.
- **Idiom:** widget on true log–log axes: intensity 0.1–10,000 operations per byte; performance 10¹¹–10¹⁵ operations per second. It shows the two ceilings for a chosen chip and a draggable point with readouts.

| Intensity (ops/byte) | Attainable (ops/s) | Units busy |
|---|---|---|
| 1 | 3.35 T | 0.34% |
| 10 | 33.5 T | |
| 100 | 335 T | 34% |
| 295 | 989 T | 100% |
| 2,000 | 989 T | |

- **Fills:** T14 drawn to scale.
- **Numbers:** `min(989e12, 3.35e12*I)`.

**22. The 300 from the opening and the ridge are the same number**
- **After:** Fig 129, restamped 19:01 ("arithmetic units running at less than 1%").
- **Idiom:** equation built up. Time to read the weights ÷ time to do the maths = (140 GB ÷ 3.35 TB/s) ÷ (140 G ÷ 989 T) = 41.8 ms ÷ 0.142 ms = 295 = ridge ÷ intensity. The busy fraction, 1/295 = 0.34%, is Fig 69's 0.1/30 = 0.33%.
- **Also:** add one sentence to Fig 128 or 129: prefill's intensity *is* its prompt length (P × 2N operations over 2N bytes), so prefill crosses the ridge at about 295 tokens.
- **Fills:** T4 and T19. It replaces Fig 146's equation.
- **Numbers:** `(140e9/3.35e12)/(140e9/989e12) = 295.2`; `100/295.2 = 0.34%`.

### H · 19:39–20:29 — the three ways past the ceiling

Start by relocating Fig 14 to just after Fig 130 (19:39) as **route 1**, "a faster memory": H100 41.8 ms, H200 29.2 ms, B200 17.5 ms (`140e9/bw`). Drop the invented attribution (§5.1 #8). Its caption should say that the video's 30 ms is a round figure for frontier production, while 41.8 ms is the bound for this 70B model in 16-bit on one H100, which in fact needs two (#20).

**23. Halving the bits halves the wait**
- **After:** relocated Fig 14, at 20:15. This is route 2.
- **Idiom:** bars to scale, on an H100. 16-bit: 140 GB → 41.8 ms. 8-bit: 70 GB → 20.9 ms. 4-bit: 35 GB → 10.4 ms.
- **Fills:** T15 route 2. Point to V04.
- **Numbers:** `70e9*b/8/3.35e12` for b = 16, 8, 4.

**24. In a batch, one read of the weights makes one token for every user in it**
- **After:** #23, at 20:22.
- **Idiom:** lane chart with four users. Unbatched: four reads of 140 GB, 167 ms. Batched: one read, 41.8 ms, four tokens.
- **Fills:** T15 route 3a, quantified.
- **Numbers:** `4*41.8 = 167`.

**25. Batching multiplies throughput and leaves each user's speed alone, until the ridge** ★
- **After:** #24, at 20:27.
- **Idiom:** table and bars. As a widget, a batch-size slider on #21.

| Batch | Total tok/s | Per user tok/s | Step |
|---|---|---|---|
| 1 | 24 | 23.9 | 41.8 ms |
| 8 | 191 | 23.9 | 41.8 ms |
| 32 | 766 | 23.9 | 41.8 ms |
| 64 | 1,531 | 23.9 | 41.8 ms |
| 128 | 3,063 | 23.9 | 41.8 ms |
| 295 | 7,059 | 23.9 | 41.8 ms |
| 512 | 7,064 | 13.8 | 72.5 ms (compute-bound) |

- **Fills:** T15 intensity = batch size. This figure absorbs Fig 116's "ridge at batch 590/295/148/74" rows.
- **Numbers:** step time = `max(140e9/3.35e12, B*140e9/989e12)`. Point to V07 Figs 2–3.

**26. Checking several guessed tokens in one pass is the other way to share a read**
- **After:** #25, at 20:29.
- **Idiom:** lane chart, schematic. Four drafted tokens are checked in one pass of the big model; three are accepted, so one weight read yields three tokens. Label it illustrative.
- **Fills:** T15 route 3b. Point to V08.
- **Numbers:** illustrative only.

### I · 22:52 — what the cache saves, in seconds

**27. Without the cache, token 10,000 would take 1.4 seconds instead of 43 milliseconds**
- **After:** Fig 134 (22:52), with Fig 134 itself redrawn (§5.1 #5).
- **Idiom:** bars on a log scale.

| | Without cache | With cache | Ratio |
|---|---|---|---|
| Token 1,000 | 142 ms | 41.9 ms | 3.4× |
| Token 10,000 | 1,416 ms | 42.8 ms | 33× |
| A whole 10,000-token answer | 118 min | 7.0 min | 17× |

- **Caveat:** this assumes the recompute runs at the full 989 TFLOP/s and ignores attention's own work. Both assumptions favour the no-cache case.
- **Fills:** T16 the quadratic cost, in seconds.
- **Numbers:** per step, `max(140e9/3.35e12, t*140e9/989e12)` against `(140e9 + t*327680)/3.35e12`, summed over t.

### J · 24:03–25:22 — heads, the cache formula, and what the cache costs

**28. A head is one 128-wide slice of the vector doing its own attention**
- **After:** just before Fig 138 (24:03).
- **Idiom:** a strip. The 8,192-wide vector cut into 64 slices of 128, each with its own scores (#13) and its own softmax (#14).
- **Fills:** T10 and T16 heads. Point to V03 Fig 13. Also delete "Not once per head" from Fig 112, so the word is not used before this figure.
- **Numbers:** `64*128 = 8192`.

**29. Sixty-four query heads share eight key-value heads**
- **After:** #28.
- **Idiom:** table with pointers. Query heads 1–8 point to KV head 1, and so on to 57–64 → KV head 8. K and V are therefore 8 × 128 = 1,024 wide.
- **Consequences:**
  - attention weights per layer are 151.0 M instead of 268.4 M, which explains Fig 101;
  - the cache per token is 327,680 bytes instead of 2,621,440;
  - at 100,000 tokens the cache is 32.8 GB instead of 262 GB.
- **Fills:** T10 and T16 GQA. Point to V03 Figs 88–89.
- **Numbers:** `4*8192**2 = 268.4M`; `2*8192**2 + 2*8192*1024 = 151.0M`; `2*80*64*128*2 = 2621440`.

**30. "Kilo" means 1,000, except in "320 KB", where it means 1,024**
- **After:** Fig 140 (24:16).
- **Idiom:** table. 4,096 bytes = 4 KiB = 4.096 kB. 327,680 bytes = 320 KiB = 327.68 kB. 1,000 tokens = 327.7 MB = 312.5 MiB. This explains why the video says 320 MB, 3.2 GB and 32 GB while Fig 140 says 0.33, 3.3 and 33 GB.
- **Fills:** T6 and T16.
- **Numbers:** `327680/1024 = 320`; `327.68e6/2**20 = 312.5`.

**31. At 100,000 tokens the cache costs one conversation a fifth of its speed**
- **After:** Fig 141, restamped 24:58.
- **Idiom:** stacked bars: 140 GB of weights plus the cache.

| Context | Bytes per token | Speed |
|---|---|---|
| 0 | 140.0 GB | 23.9 tok/s |
| 10,000 | 143.3 GB | 23.4 tok/s |
| 100,000 | 172.8 GB | 19.4 tok/s |

- **Fills:** T16 the cost to one conversation.
- **Numbers:** `3.35e12/(140e9 + n*327680)`.

**32. In a batch the weights are shared; the caches are not** ★
- **After:** #31, at 25:22.
- **Idiom:** stacked bars per step, every user at 10,000 tokens. As a widget, a context slider on #21.

| Batch | Bytes per step | Total speed | Without caches |
|---|---|---|---|
| 32 | 140 + 104.9 = 244.9 GB | 438 tok/s | 766 tok/s |
| 64 | 349.7 GB | 613 tok/s | 1,531 tok/s |

- **Fills:** T16 not shared across a batch. This is the number behind 23:55: "the same data structure… is also the reason every other optimization in the rest of this series exists."
- **Numbers:** Python, as above.

### K · 26:44–28:47 — the user's pause, the operator's bill, goodput

**33. The pause before the first token is prefill, and its length is arithmetic**
- **After:** Fig 143 (26:44).
- **Idiom:** bars to scale, at full peak.

| Prompt | Prefill time | Bound by |
|---|---|---|
| 200 tokens | 42 ms | memory |
| 2,000 tokens | 283 ms | compute |
| 20,000 tokens | 2.8 s | compute |

- **The crossover is at 295 tokens**, the ridge, because prefill's intensity equals its prompt length. Real systems run below peak, which is why the video says "half a second… several seconds"; the typical utilisation is VERIFY.
- **Fills:** T12 and T17.
- **Numbers:** `max(140e9/3.35e12, P*140e9/989e12)`.

**34. When 64 users share each read, the cost per token falls sixty-four-fold**
- **After:** Fig 144, restamped 28:06.
- **Idiom:** equation built up, then bars on a log scale. At $3 per GPU-hour (VERIFY; V08 Fig 29 uses about $3, within a range of $1.50–8):

| Batch | Tokens/s | Tokens/hour | Cost per million tokens |
|---|---|---|---|
| 1 | 24 | about 86,000 | $34.83 |
| 64 | 1,531 | about 5.5 million | $0.54 |

- **Caveat:** this is the weights-only bound; caches are ignored here (see #32).
- **Fills:** T17 cost per token.
- **Numbers:** `3/(tps*3600)*1e6`.

**35. Goodput keeps only the requests that met their promise** ★
- **After:** Fig 145, restamped 28:47.
- **Idiom:** sorted population. 100 requests, one mark each, sorted by time to first token, with positions labelled on the axis below. An illustrative target, first token within 1 s, splits them 60 / 40. Throughput is 100 × 500 tokens / 60 s = 833 tok/s; goodput is 500 tok/s. As a widget, the reader slides the target and watches goodput change.
- **Fills:** T17 a latency target, with numbers.
- **Numbers:** `100*500/60 = 833`; `60*500/60 = 500`. The population is illustrative and must be labelled so. Point to V08 Fig 25 for percentiles.

### L · 30:15 — the opening promise, kept

**36. Any model, any chip: bytes per token over bandwidth** ★
- **After:** Fig 146, restamped 30:15.
- **Idiom:** widget. Inputs: parameters, bits per weight, context length, batch size, chip. Outputs: ms per token, tokens/s per user and in total, the share of time the arithmetic units are busy, and cost per million tokens. Seed it with these rows:

| Model | Chip | ms per token |
|---|---|---|
| 70B, 16-bit | H100 | 41.8 |
| 70B, 16-bit | H200 | 29.2 |
| 8B, 16-bit | H100 | 4.8 |
| 70B, 4-bit | B200 | 4.4 |

- **Why:** it delivers the promise at 3:31: "derive those 30 milliseconds from just two numbers for any model on any chip".
- **Fills:** T2, T15 and T19.
- **Numbers:** `N*bits/8/bw`.

---

## 5. Problems in existing figures

### 5.1 Factual and numeric errors

1. **Fig 146: "the factor of 300 = bandwidth / bytes per token" fails its own unit test.**
   - (bytes/s) ÷ (bytes/token) = tokens/s: `3.35e12/140e9 = 23.9` tokens per second, not 300.
   - The 300 is (bytes ÷ bandwidth) ÷ (operations ÷ peak): `41.79 ms / 0.1416 ms = 295.2`, which is ridge ÷ intensity.
   - Fig 66 tells the reader to run exactly this check "on every claim in this series, including the ones made here".
   - **Fix:** "factor of 300 = time to move the bytes ÷ time to do the maths = 295 ÷ 1". Keep the video's sentence as the meaning: bandwidth, not arithmetic, sets the time.
2. **Fig 31 caption: "seven orders of magnitude apart".** `70e12/22e3 = 3.2e9`, which is 9.5 orders. **Fix:** "nine orders of magnitude, about three billion to one."
3. **Fig 62: "The bars are drawn on a logarithmic scale" is false.**
   - The bars are 3, 15, 60, 150 and 340 px wide. Each is 5, 4, 2.5 and 2.3 times the one before, which is neither logarithmic nor linear. Log bars step evenly: 68, 136, 204, 272, 340.
   - The caption's "they are four steps apart" is also wrong. One step in this list is ×1,000; 10¹¹ to 10¹⁵ is four *powers of ten* (×10,000).
   - **Fix:** redraw with even steps and correct the caption.
4. **Fig 129 (and Fig 123): the drawing contradicts the text.**
   - Decode sits 198 px left of the ridge for 2.47 decades (×295). Prefill sits 210 px right of it for 0.83 decades (×6.8). That is 80 px per decade on one side and 253 on the other, so prefill *looks* farther from the ridge than decode.
   - Fig 123 says "Both axes are logarithmic".
   - **Fix:** use one scale (at 80 px per decade prefill sits at x ≈ 397), label the ticks, or replace the drawing with #21.
5. **Fig 134: the label, the drawing and the prose disagree.**
   - "Linear: work per token stays flat" labels a rising line, because the line plots cumulative work.
   - The "quadratic" line's segment slopes are 0.07, 0.36, 0.68 and 0.37. It straightens at the end, so it is not quadratic.
   - The two panels have different heights, so they cannot be compared.
   - The prose says "At ten tokens the two are barely different. At ten thousand the second is a thousand times worse". In totals the comparison is 10 against 45 (4.5×) and 10⁴ against 4.9995×10⁷ (5,000×). Per step it is 1 against 9 and 1 against 9,999. Neither reading gives "barely different" and "a thousand times".
   - With the cache, per-step work is not flat either: Figs 131 and 141 say the cache read grows every step.
   - **Fix:** one shared axis, showing per-step projection work with the cache (1 position, flat) against without it (t − 1 positions). Say that attention's read still grows. Then add #27.
6. **Figs 12 and 106: "the chip itself holds a few hundred kilobytes" describes one multiprocessor, not the chip.**
   - V02 Figs 51–52 give the H100 50 MB of L2, plus 256 KB of registers and up to 228 KB of shared memory in each of 132 multiprocessors, about 115 MB in all (`50e6 + 132*(256e3+228e3) = 113.9e6`).
   - Fig 12 also says "Bars are roughly to scale for capacity", but draws 600, 380 and 60 px. That makes memory against chip 6:1; the true ratio is about 1,200:1 (`140e9/113.9e6 = 1,229`).
   - **Fix:** say "about a hundred megabytes, a thousandth of the model", and draw on a log scale or label the bars schematic. The conclusion, that the model cannot sit on the chip, survives.
7. **Fig 11 makes reading-speed claims the transcript does not.**
   - It says "appears to stream out at reading speed, which is exactly the target", and its caption says 30 ms is "roughly the slowest a model can generate while still feeling responsive".
   - `1000/30 = 33` tokens/s. Reading at about 250 words a minute × 1.3 tokens per word is about 5.4 tokens/s, so 30 ms per token is roughly 6× reading speed.
   - **Fix:** drop both claims and say "about 33 tokens a second, several times faster than anyone reads".
8. **Fig 14 invents a source: "which is where the video's round figure of thirty comes from".**
   - The video introduces 30 ms for "a frontier language model serving production traffic". Its own division at 19:42 gives 24 tokens/s, which is 41.8 ms on an H100. The video never mentions an H200.
   - The "41.8 ms per token" label is also clipped (the known checker fault).
   - **Fix:** relocate as in §4 H and rewrite the caption.
9. **Fig 75: "Which is not quite the 140 gigabytes the model needs, and that gap is the whole story of this video".**
   - `3.35e12*0.03 = 100.5 GB`. The gap between 100 and 140 GB says only that this model misses a 30 ms budget on this chip (it needs 41.8 ms). The story is that reading the weights *alone* fills the whole budget.
   - **Fix:** rewrite that sentence to say so.
10. **Fig 76 defines bandwidth as "how many can be travelling at once".**
    - That is the amount of data in flight, which is bandwidth × latency: 3.35 TB/s × about 600 ns ≈ 2 MB (the latency is VERIFY). It contradicts Fig 74's width × frequency.
    - **Fix:** "Bandwidth: how much arrives per second once data is flowing". Turn the last paragraph's "keep enough requests in flight" into that product.
    - V02 Fig 9 has the same wording; fix both.
11. **The atlas uses two model widths.**
    - Figs 87, 89 and 103 use 4,096, the width of an 8B model. Figs 99, 101 and 115 use 8,192, the 70B model followed throughout.
    - For the 70B model, Fig 89's gather is `200*8192*2 = 3.28 MB` (not 1.6 MB). Its output projection is `128256*8192*2 = 2.10 GB` and 2.10 GFLOP (not 1.05).
    - Fig 115's "about 1.5% of the parameters" holds only at 8,192: `1.05e9/70.55e9 = 1.49%`.
    - **Fix:** use 8,192 throughout.
12. **The atlas says both two and three feed-forward matrices per layer.**
    - Fig 100 says "three more per layer… another 240", and Fig 101 uses 704.6 M = `3*8192*28672`. Both describe Llama's gated design.
    - Figs 104 and 113 draw "feed-forward, first / second", the two matrices the video describes. With two the count would be 469.8 M per layer and Fig 101's total would not land.
    - **Fix:** add #18 and draw three matrices in Figs 104 and 113.
13. **Fig 116's ridge-at-batch rows assume 16-bit arithmetic for every storage format.**
    - FP32 weights would not compute at 989 TFLOP/s.
    - 8-bit arithmetic on an H100 peaks near twice the 16-bit rate (1,979 TOPS dense, VERIFY), which would put an INT8 ridge near 591, not 148.
    - "batch" is used here undefined.
    - **Fix:** add "weights stored in fewer bits, arithmetic still done in 16-bit", and move the batch rows to #25.
14. **Fig 117: "every byte pulled is used in roughly 2,000 multiply-accumulates"** (the video's wording at 12:17).
    - A 2-byte weight used for 2,000 tokens does 2,000 multiply-accumulates, which is 4,000 operations. Per byte that is 1,000 multiply-accumulates, or 2,000 operations. Fig 128's 2,000 is operations per byte.
    - **Fix:** "every weight is used in about 2,000 multiply-accumulates: 2,000 operations per byte."
15. **Fig 88: "128,000 multiplications, 127,999 of them by zero".** That count is for each output number. The whole one-hot × table product is `128000*8192` ≈ 1.05 billion multiplications. **Fix the wording.**
16. **Fig 9: "a score of 8.2 against 7.1 is a gap of one".** The gap is 1.1, and `exp(1.1) = 3.00` is exactly the 74.5 : 24.8 ratio. **Fix:** "a gap of 1.1 becomes three to one."
17. **Fig 66: "Try it the other way round and you get operations squared per second".** Dividing the other way gives 1/seconds; operations² per second is what *multiplying* gives. **Fix the wording.**
18. **Figs 44, 47, 48–53, 56 and 137 use three prompt sizes for one conversation.**
    - 911 tokens (Fig 44, Fig 47's warm case), 1,032 (Fig 47's cold case, Fig 56's "206 times", Fig 137) and 777/788 (Figs 48–53).
    - Fig 47 says the cold case holds "0 of 1,032", while Fig 53 says that a day later 770 tokens still hit.
    - **Fix:** use one scenario. The animation's 786 → 906 → 1,024 → 1,032 sequence is where these numbers came from.
19. **Fig 19: "which is why the measurements at the end of this video are about the worst case rather than the average".** The video's closing metrics are time to first token, time per output token, throughput and goodput; it never mentions worst cases. **Fix:** "…why the last measurement counts only tokens delivered within their latency target."
20. **Fig 70 blames the wrong weakness for slow decode.** It says a GPU is "a poor choice for anything with a chain of dependencies, which is exactly the weakness that shows up in decode". Decode is slow because every step re-reads every weight for one token, which would leave any processor waiting on memory. **Fix:** "…decode, a chain of one token after another, cannot use most of those workers."
21. **Fig 41: "the difference grows with depth as the mixing compounds" is not a general property.**
    - A 4-layer toy run (random weights, layer norm, causal attention, ReLU feed-forward) gave differences of 0, 1.76, 3.89 and 2.41 at layers 1–4. Layer 1 being exactly zero holds; steady growth does not.
    - **Fix:** "and differs at every layer above", and drop "built and run for this figure".
22. **Fig 81: "Schematic curves, real endpoints" — the endpoints are not drawn to scale.**
    - The lines end 16× and 7.25× above their starts, not 80× and 17×.
    - The source of 80 and 17 is not given (VERIFY).
    - **Fix:** use #10's log-y axes with both endpoints to scale.
23. **Fig 67 is titled "drawn to scale" but is not.** It draws the arithmetic share as 4 of 558 px (0.72%); the true 0.33% is 1.9 px. Fig 68 gets the same ratio right (1.3 of 390 px).
24. Minor:
    - **Fig 139: "Nothing cuts the number of layers"** is too strong; cross-layer KV sharing does (VERIFY). Soften to "the techniques in this series leave the layer count alone".
    - **Fig 95: "the earliest tokens fall out"** describes something that does not happen automatically: serving systems reject or truncate an over-long context.

### 5.2 Names misheard by the captions

None is carried into the atlas. When the 1:28 passage is added (#3), record that **"Chimera 2" is the captions' rendering of Kimi K2**, so searching the raw SRT will fail. The captions' "TPT" (27:05) and "TBot" (29:53) are TPOT, which the atlas already uses.

### 5.3 Voice violations

- **Attributions to the video:**
  - Fig 69: "The video says under one percent."
  - Fig 14: "the video's round figure"; "Later in this video…"; the caption "Two figures in this video that look inconsistent are reconciled here".
- **Leftovers from a question-and-answer chat**, addressed to one reader:
  - Fig 28: "neither of the two possibilities you might imagine".
  - Fig 29 caption: "Your instinct was right".
  - Fig 38: the title "At layer 1 you are right" and "your reasoning is exactly right".
  - Figs 37, 40 and 42 captions: "objection".
  - Fig 41: "built and run for this figure".
  - Fig 42: "The property you spotted".
  - Fig 43 caption: "Your observation is correct".
  - Fig 97 caption: "the reading the previous figures could easily leave you with".
  - Fig 98 caption: points to "the earlier figures", 55 figures back.
  - Fig 138: "You have seen this formula already. The question you just asked… what you asked about". The formula first appears in Fig 140, *after* this figure.
  - Fig 30: "from Seoul" personalises it.
- **References to things not yet built:** Fig 35's caption says "Causality again, doing a third job. It forced decode to be sequential, it halved the score matrix". At Fig 35 none of this has happened: sequential decode is Fig 110/132, and halving the score matrix is taught in V03.
- **Lower priority:** "this video" is used as a self-reference 16 times (Figs 11, 15, 19, 20, 60, 64, 67, 70, 71, 75, 83, 104, 105, 139, 142, 145). Prefer "this atlas", "this part" or "later in the series". Pointers to "a later video" (Figs 73, 92, 108, 130, 147) are acceptable as series navigation.

### 5.4 Repetition, and captions that restate

- **Neighbours that repeat each other:**
  - Fig 6 and Fig 86: the same token facts and the same 500 words → 600–800 tokens.
  - Figs 12–13 and Fig 106: three tiers, load once.
  - The lower half of Fig 105 and Fig 107: HBM drawn twice.
  - Fig 103 and Fig 104: Fig 104's prose repeats the vocabulary projection.
  - Fig 104 and Fig 113: the same six-matrix drawing.
  - Figs 37–40, 97–99 and 138: a fixed W_K meeting a changing input, three times.
  - Fig 44 and Fig 46: the prefix rule twice.
  - Fig 45 and Fig 51: the same "Tell me the capital of France please" rows.
  - Fig 57 and Fig 58: the non-streaming paragraph almost word for word.
  - Fig 65 and Fig 66: unit cancellation twice.
  - Figs 67, 68 and 69: one ratio three times.
  - Fig 20 and Fig 32: the whole conversation is re-sent.
- **Captions that restate the picture:**
  - Fig 69: "Two ways of saying one thing"
  - Fig 81: restates 4.7×
  - Fig 123: "Two ceilings and one rule"
  - Fig 139: "The 320 kilobytes decomposed"
- **Across atlases:** Fig 74 ≈ V02 Fig 7 and Fig 76 ≈ V02 Fig 9, nearly word for word. V02 should recap briefly and point back.

### 5.5 Idioms that fight their idea

| Fig | Problem | Use instead |
|---|---|---|
| 134 | Two separate, unlabelled plots for a comparison | One shared axis, or a slider |
| 123, 129 | Schematic roofline that claims log axes | To-scale log–log axes with ticks (#21) |
| 62 | Bars claimed logarithmic | Even steps of one per ×1,000 |
| 81 | Exponential growth drawn as kinked lines on linear axes | Log-y axis, so the divergence is two straight lines of different slope |
| 76 | Six parallel lanes show width, which is Fig 74 again | A timeline: a long pipe and a short pipe with the same bytes per second and different arrival times |
| 92 | Three labelled boxes for "projects into three vectors" | Draw the operation (#11) |
| 12 | Claims to-scale bars | Log scale, or label schematic |

### 5.6 One-line fixes inside existing figures

| Fig | Add or change |
|---|---|
| 5 | Name the operation "a dot product" |
| 18 | Restore the sources: "Deloitte projects", "OpenAI's API alone" |
| 17, 130 | A kernel is one program the GPU runs (V03 builds it) |
| 60 | Add the "multi-token decoding loop" and the prefill and decode *clusters* |
| 71 | A bus is many wires in parallel |
| 64 | Point forward to Fig 114 for where 10¹¹ comes from |
| 105, 107 | A die is one cut piece of silicon |
| 115 | Write "Q Kᵀ" in words |
| 128 | Show the derivation: `2*70.55e9*2000 = 282 T` plus 5.2 T of causal attention ≈ 287 T, "about 290 trillion"; bytes 141.1 GB of weights + 0.66 GB of cache writes + activations ≈ 146 GB |
| 141 | Add the fifth family: spreading the cost across many conversations (batching) |

---

## 6. Size after the pass

**About 168 figures, against 147 today.**
- **Additions:** 36 new figures (#4 optional). Eight are marked ★, and #21, #25, #32 and #36 can share one widget.
- **Removals:** 15.
  - Figs 12 + 13 merged into 106: −2
  - 21 merged into 108: −1
  - 22–25 moved to V07 or cut: −4
  - 35 merged into 133: −1
  - 37 and 40 merged into 97–99: −2
  - 46 and 51 dropped: −2
  - 57 merged into 58: −1
  - 65 + 66 merged: −1
  - 68 + 69 merged: −1
- **Redrawn, not removed:** Fig 113, so its drawing stops repeating Fig 104's.
- **Total:** 147 + 36 − 15 = 168 (167 without the optional #4; about 172 if Figs 22–25 stay). The row in `index.html` then becomes about 168, and the series total goes from 551 to about 572.

**The three highest-value changes**

1. **Move the 41 figures stamped 0:46 into the video's order.** Their homes are 22:08, 23:13, 25:41 and 26:30; cut the tools/skills/plugins tangent. Today a reader meets cache hits, keys, values and prefill 60–110 figures before any of them exists, in a stretch where the video is quoting Deloitte.
2. **Build the attention and feed-forward floor the video leans on at 7:27–8:27 and 24:03.** That means the dot product as similarity, scores turned into weights by softmax, the non-linearity (explained in no atlas of the series), the gated feed-forward block, residual addition, heads and GQA (#11–19, #28–29). Later atlases assume exactly these V01 foundations.
3. **Make the arithmetic close.**
   - Replace Fig 146's equation with #22: the 300 *is* the ridge.
   - Define batching and quantify it (#24–25, #32).
   - Turn the roofline into the to-scale "any model, any chip" widget (#21 + #36).
   - Fix the drawings of Figs 62, 129 and 134, which contradict their own numbers.
