# V07 · Serving in Production: depth review

Read-only review of `/home/user/llm_inference/atlases/V07_Serving_in_Production.html` against the
outline, the ~20 s transcript and the raw SRT. Every number below was recomputed in Python. The scripts
are in `/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/v07work/`
(`verify_existing.py`, `verify_new.py`, `verify_new2.py`, `verify_new3.py`, `verify_new4.py`).
Model and hardware constants used throughout: H100 SXM at 989 TFLOP/s dense BF16, 1,979 FP8 and
3.35 TB/s HBM (the series' own values, V01 Fig 126); Llama 3 8B with 32 layers, 8 KV heads, head dim
128 and 8.03 B parameters (16.06 GB in FP16); Llama 3 70B at 140 GB, as in V01.

---

## 1. Snapshot

- **26 figures, 11 parts, 29:59 of video: 0.87 figures per minute.** The parts are The question,
  Batching, Continuous batching, Chunked prefill, Disaggregation, Prefix caching, Engines and
  orchestrators, Goodput and refusing work, The sampler, Constrained decoding, and The chain of repairs.
- **Most figures are prose cards.** Six figures are two boxes over a block of prose (Figs 5, 7, 8, 11,
  17, 26). Only three draw any quantity to scale (Figs 4, 6, 14). None works an example through a
  mechanism: no page-table lookup, no temperature arithmetic, no tree with tokens on it, no lane chart.
- **The video's proper nouns have all been removed.** Orca, FasterTransformer, GPT-3, vLLM,
  Sarathi-Serve, DistServe, Splitwise, OPT-66B, DeepSeek, Mooncake, Dynamo, llm-d, SGLang,
  TensorRT-LLM, TGI, Holtzman, Outlines and XGrammar each appear 0 times (grep). The other atlases
  name their systems: FlashAttention appears 22 times in V03, DeepSeek 5 times in V06, Medusa and
  EAGLE in V08.

What it already does well, and should keep:

1. **One question carries the whole document.** Fig 1 asks "how many tokens does the system get out of
   each full read of the weights?", and Figs 25–26 close on it. Fig 25 uses the problem → fix chain
   idiom exactly as design.md intends, and Fig 26's limit case hands off cleanly to V08 Fig 1.
2. **Fig 4's static-batch bars are drawn to scale, with correct arithmetic.** 8/512 × 420 px = 6.56 px
   as drawn. 512 − 8 = 504, 512 − 60 = 452, and (8+24+60+512)/(4·512) = 604/2048 = 29.5%, which
   matches "under a third".
3. **Fig 10 catches the presenter's unit error.** The raw caption says "roughly 90 GB per second of
   network" (13:29). The atlas says ~11 GB/s, about 90 gigabits: 1.13 GB × 10/s = 11.3 GB/s, and
   × 8 = 90.4 Gb/s. Keep this correction.
4. **The causality and "nothing to share" threads tie back to earlier videos.** Fig 7 closes on
   attention having no weights, so splitting it costs nothing. Fig 12's caption reads causality as the
   permission for reuse, linking to V01 Figs 35 and 110. Fig 24's "exact and narrow" guarantee panel
   keeps the presenter's caveat that output which parses is not therefore true.

---

## 2. Coverage against the transcript

| Video range | What is said there | Atlas coverage |
|---|---|---|
| 0:00–0:38 | The bridge from V06: "eight out of 256 … only works when enough requests are flowing through the machine at the same moment". Then the definition of a serving system: "takes a fixed set of GPUs … serves as many users as it can without missing anyone's latency target". | **Skipped.** Fig 1 opens on the worst case. |
| 2:48–3:09 | "That N, though, is not a number anyone sets. It is however many requests happen to be generating tokens at that particular step." | Skipped. |
| 4:34–6:40 (2:06 under one figure) | Caches are never shared; attention reads each one separately; "the arithmetic units sit nearly idle"; weights fixed + small activations + the leftover HBM holds KV, which sets the maximum batch; "only a few tens of concurrent requests"; "paged attention from episode 3"; pre-allocation for the longest output; "only 20 to 38%"; non-contiguous fixed-size blocks "the way an operating system pages memory". | **Thin.** Fig 5 is two boxes plus four paragraphs. It has no capacity arithmetic, no pointer back to V03 and no paging mechanism. |
| 6:40–8:43 (2:03 under one figure) | Orca (OSDI 2022) changes what the scheduler hands over; iteration-level scheduling; "Take the same four requests…"; Orca vs FasterTransformer on GPT-3 175B at a median 190 ms; "vLLM, measured against Orca a year later, reported two to four times". | Fig 6 states it, but the comparison on "the same four requests" is prose and never drawn. **The vLLM 2–4× sentence is dropped.** |
| 8:28–8:50 | "the tensors flowing through attention have different shapes … no guarantee the next iteration can be merged into one batched operation". | Heading only (Fig 7). |
| 10:11–10:54 | The prefill joins and "becomes a bulk job"; up to 28×; "in vLLM, it produced generation stalls lasting several seconds". | Fig 8 states it. Its drawing is not to scale. |
| 10:57–12:18 | Sarathi (MSR India and Georgia Tech) and Sarathi-Serve; the token budget; the chunk-size trade; Mistral-7B on 1 A100, Yi-34B on 2, Falcon-180B with pipeline parallelism; uniform iterations mean fewer bubbles. | Fig 9: one schematic and a words-only trade. Models and hardware are dropped. |
| 13:02–13:43 | DistServe prices the handoff: OPT-66B, 512 tokens, 1.13 GB, 10 req/s. | Prose only (Fig 10). |
| 14:26–15:08 | DeepSeek EP32 and EP144; "MoonCake, the platform behind Kimi, built its whole architecture around the KV cache"; Dynamo, llm-d, SGLang on 96 H100s, 52.3K/22.3K tok/s per node, $0.20 per million. | One long paragraph (Fig 11). **Mooncake dropped.** |
| 16:19–17:15 | SGLang's RadixAttention; radix tree compression; branching at the first difference; LRU leaf eviction with reference counts; shared blocks and copy-on-write. | Fig 13 draws boxes with no tokens. All the mechanics are in prose. |
| 18:21–18:56 | vLLM (PyTorch Foundation), SGLang, TensorRT-LLM, "Hugging Face's text generation inference"; Dynamo, llm-d. | Anonymised. TGI dropped. |
| 20:58–22:37 (1:39 under one figure) | The virtual token counter "from a 2024 fairness paper … input and output tokens"; goodput goes to zero at full utilisation; "Mooncake serving Kimi does this with a prediction-based early rejection policy"; "Dynamo's planner". | **Thin.** Fig 18 is three boxes and ten lines of prose. No mechanism is worked. |
| 23:01–23:41 | Holtzman 2020; "maximization based decoding, greedy or beam search"; "beam search on GPT-2 repeats the same university name". | Fig 20 has neither beam search nor the example. |
| 24:01–25:05 | Temperature, top-k, top-p and min-p. | One words-only figure (Fig 21). Not a single number. |
| 27:57 | "The serving layer is the last place anything can be enforced before tokens reach a user or a tool." | Dropped. |

**Stamps that do not match the video** (checked against the raw SRT):

- **Fig 01** is stamped 0:24. The worst case starts at 0:39 ("The place to start is the worst case,
  one GPU serving one request").
- **Fig 08** is stamped 9:56. "There is one kind of work in that batch" is at 10:11.
- **Fig 09** is stamped 10:44. "Sarathi, a 2023 paper" is at 10:57.
- **Fig 13** is stamped 16:02. "SGLang's radix attention" is at 16:19.
- **Fig 18** is stamped 20:58. Fairness starts at 21:10.
- **Fig 20** is stamped 22:37, the same as Fig 19. "The obvious approach is to take the highest scoring
  token … It does not work" is at 23:01.
- **Fig 22 is out of order.** It is stamped 25:28 and sits before the masking figure. In the video,
  masking comes at 25:44–26:03 and "What decides which tokens would break the format is an automaton"
  at 26:05. The finite state machine is at 26:12 and the pushdown automaton at 26:31. Move Fig 22 after
  Fig 23 and restamp it 26:12.
- **Fig 14 reverses the video's order.** Its prose prices the cache first and then routes. The video
  routes first (17:15) and prices second (17:33).

---

## 3. Concept trees

Floor = high-school maths. `[TAUGHT IN …]` is used only where that outline actually builds the idea.

```
1. tokens per weight read: the episode's metric                    [COVERED Fig 1, 25, 26]
  one decode step reads every weight once                           [PARTIAL Fig 1: no numbers]
    bytes in a model: 70e9 × 2 B = 140 GB                           [TAUGHT IN V01 Fig 73]
    time = bytes ÷ bandwidth: 140 GB ÷ 3.35 TB/s = 41.8 ms          [TAUGHT IN V01 Fig 130]
      a count against a rate                                       [TAUGHT IN V01 Fig 63; V02 Fig 5]
        division                                                   floor
  2 operations per weight per token                                 [TAUGHT IN V01 Fig 111–114]
    matrix-vector product                                          [TAUGHT IN V01 Fig 84–85]
  arithmetic intensity ≈ 1 at batch 1                               [PARTIAL Fig 1: named, no value]
    roofline, ridge 989 ÷ 3.35 = 295                                [TAUGHT IN V01 Fig 119–126; V02 Fig 73–76]
      logarithmic axes                                             [TAUGHT IN V01 Fig 121]
  amortising a fixed cost                                           [TAUGHT IN V01 Fig 117–118]
    fractions                                                      floor

2. a serving system: fixed GPUs, many users, no missed target      [MISSING]
  production traffic, many concurrent requests                      [TAUGHT IN V01 Fig 19–20]
  router, scheduler, memory manager, kernels                        [TAUGHT IN V01 Fig 17]
  the two latency targets, TTFT and TPOT                            [MISSING here; TAUGHT IN V01 Fig 143–144]
  why the crowd is needed: MoE fires 8 of 256 experts               [MISSING]
    tokens per expert = batch × 8 ÷ 256                             [MISSING]
      fractions                                                    floor
    mixture of experts, top-k routing                               [TAUGHT IN V06 Fig 2, 9, 22]

3. batching: one weight read serves N requests                     [COVERED Fig 2, 3]
  queue against batch                                               [COVERED Fig 2]
  a matrix times N vectors reads the matrix once                    [PARTIAL Fig 3: asserted, not shown]
    vectors stacked as rows of a matrix                             [MISSING]
    intensity from shapes                                           [TAUGHT IN V02 Fig 76]
  intensity at batch N = 2PN ÷ 2P = N                               [PARTIAL Fig 3: bars drawn equal]
    cancelling a common factor                                      floor
  the batch that reaches the ridge, ≈ 295                           [MISSING]
  throughput at batch N, same step time (1,531 tok/s at 64)          [MISSING]
  N is whoever is generating at that step                           [MISSING]

4. static (request-level) batching                                  [COVERED Fig 4]
  the end-of-sequence (stop) token                                  [TAUGHT IN V01 Fig 29]
  seat occupancy: 604 ÷ 2048 = 29.5%                                [COVERED Fig 4: bar has no track]
    area of a step chart                                            floor
  tokens per read fall 4 → 3 → 2 → 1 (mean 1.18)                    [PARTIAL Fig 4: prose]
  finished requests held until the batch drains                     [COVERED Fig 4]

5. attention does not amortise                                      [COVERED Fig 5]
  what K and V are, and why they are kept                           [TAUGHT IN V01 Fig 34–35, 135–137; V03 Fig 15–18]
  bytes/token = 2 × layers × KV heads × head dim × bytes             [TAUGHT IN V01 Fig 138–140; V03 Fig 82, 88]
    worked for Llama 3 8B: 131,072 B                                [MISSING]
  one query per cache, so attention intensity is fixed (4 with GQA)  [MISSING]
    grouped-query attention                                         [TAUGHT IN V03 Fig 88–89]
  total intensity with caches plateaus (63.8 at 2K context)          [MISSING]
    a ratio approaching a limit                                     floor

6. memory caps the batch                                            [PARTIAL Fig 5: no numbers]
  HBM = weights + working space + KV pool                            [PARTIAL Fig 5; TAUGHT IN V01 Fig 141, V03 Fig 82]
  requests that fit = pool ÷ (context × bytes/token)                 [MISSING]
    worked: 59.94 GB ÷ 1.074 GB = 55 at 8K                           [MISSING]
  room (55) runs out before arithmetic (295)                         [PARTIAL Fig 5: asserted]

7. paged KV memory                                                  [PARTIAL Fig 5: one sentence]
  contiguous reservation for the longest answer                     [TAUGHT IN V03 Fig 83–84]
    internal waste (reserved, unused), worked                       [TAUGHT IN V03 Fig 83, no numbers; MISSING worked]
    external waste (gaps)                                           [TAUGHT IN V03 Fig 83]
    20–38% held real tokens                                         [COVERED Fig 5; TAUGHT IN V03 Fig 84]
  block table: logical block → physical block                        [TAUGHT IN V03 Fig 85–86: idea only, unlabelled blocks]
    address = block × size + offset, by division with remainder      [MISSING everywhere in the series]
      integer division and remainder                                floor
    blocks allocated on demand                                      [MISSING]
    waste at most one partial block, worked                          [TAUGHT IN V03 Fig 86 as a statement; MISSING worked]
  more sequences fit (2.5–4.7×); vLLM 2–4× over Orca                 [MISSING]

8. iteration-level scheduling (continuous batching)                 [COVERED Fig 6]
  what the scheduler hands the engine                               [PARTIAL Fig 6: open chain, no loop]
  one iteration = one token per active request                      [COVERED Fig 6]
  join and leave at step boundaries, on the same four requests       [PARTIAL Fig 6: prose only]
    occupancy 95.0% vs 29.5%; 3.80 vs 1.18 tokens per read           [MISSING]
  6.81 vs 0.185 req/s at a median 190 ms/token                       [COVERED Fig 6: names removed]
    median, percentiles, the tail                                   [MISSING; first built in V08 Fig 25]
      sorting, counting positions                                   floor
    comparing throughput at equal latency                           [TAUGHT IN V01 Fig 142: the trade-off]

9. selective batching                                               [COVERED Fig 7]
  ragged shapes block one batched attention                          [PARTIAL Fig 7: heading]
    a batched op needs a rectangle; padding wastes 50%              [MISSING]
  per-token operations                                              [PARTIAL Fig 7: named only]
    linear layer: each row independent                              [MISSING]
    layer norm: each vector by its own mean and spread              [MISSING]
      mean, square root                                             floor
    activation function, element by element                         [MISSING]
      e^x                                                           floor
  four requests, seven tokens, one matrix                           [PARTIAL Fig 7: prose]
  attention split per request (block structure)                     [MISSING]
    causal mask                                                     [TAUGHT IN V03 Fig 20]
  attention has no weights, so nothing to share                     [COVERED Fig 7]

10. chunked prefill                                                 [COVERED Fig 8, 9]
  prefill against decode work per iteration                          [COVERED Fig 8; TAUGHT IN V01 Fig 109–110, 117]
  step time = max(bytes ÷ bandwidth, ops ÷ peak)                     [MISSING]
    roofline read as a time                                         [TAUGHT IN V01 Fig 123]
    flat until ~295 tokens                                          [MISSING]
  the stall: 4.79 ms → 66.5 ms (≥ 13.9×; reported 28×)               [PARTIAL Fig 8: states 28×]
  token budget: decodes first, a chunk fills the rest               [PARTIAL Fig 9: schematic]
    chunks = ceil(prompt ÷ chunk) = 5                                [MISSING]
  prefill rides free under the weight read, up to the ridge          [MISSING]
  chunk-size trade, both sides; KV re-reads                          [PARTIAL Fig 9: words]
  fewer pipeline bubbles                                            [PARTIAL Fig 9: one clause; TAUGHT IN V05 Fig 12–14]

11. prefill/decode disaggregation                                   [COVERED Fig 10, 11]
  opposite sides of the ridge                                        [COVERED Fig 10; TAUGHT IN V01 Fig 129, V02 Fig 76, V04 Fig 53–54]
  size of the KV handoff                                             [PARTIAL Fig 10: stated]
    OPT-66B: 2 × 64 × 9,216 × 2 B × 512 = 1.21 GB                    [MISSING]
    GQA makes it 7.2× smaller                                        [MISSING; GQA TAUGHT IN V03 Fig 88–89]
  link rates are in bits (× 8)                                       [MISSING; bits and bytes TAUGHT IN V01 Fig 72–73]
    NVLink 900 GB/s, network ~50 GB/s                                [TAUGHT IN V02 Fig 92–95; V05 Fig 8]
  handoff time per request                                           [MISSING]
  attainment: "over 90% inside both budgets"                         [MISSING]
  7.4× / 12.6× / 1.4× / 2.35×                                       [COVERED Fig 11: bars not to scale]
  EP32 prefill, EP144 decode                                         [COVERED Fig 11: prose]
    expert parallelism                                              [TAUGHT IN V05 Fig 15–16; V06 Fig 19–21]
    tokens per expert = combined batch ÷ 32                          [MISSING]
  a KV-centric architecture (Mooncake)                               [MISSING]
  $ per million tokens = $/GPU-hour ÷ M tokens per GPU-hour          [MISSING]

12. prefix caching                                                  [COVERED Fig 12]
  overlap is the normal case                                        [COVERED Fig 12]
    what an agent loop is (Figs 12, 14, 24 lean on it)              [MISSING in V01–V06]
  causality makes K and V reusable                                  [COVERED Fig 12; TAUGHT IN V01 Fig 35–36]
  a hit is a prefix match                                           [TAUGHT IN V01 Fig 44–46]
  the saving, worked (105,000 → 7,000 prefill tokens)                [MISSING]
  saves prefill (TTFT) only                                         [TAUGHT IN V01 Fig 55]

13. radix tree of prefixes                                          [PARTIAL Fig 13: boxes without tokens]
  tree: root, node, edge, leaf, path                                [MISSING]
  trie: one token per edge                                          [MISSING]
  radix: chains merged (15 nodes → 5 edges)                          [PARTIAL Fig 13: prose]
  lookup, insert, edge split                                        [MISSING]
  LRU leaf eviction with reference counts                           [PARTIAL Fig 13: prose; LRU TAUGHT IN V01 Fig 54]
  shared blocks and copy-on-write                                   [PARTIAL Fig 13: prose; TAUGHT IN V03 Fig 87]
    which block is copied: 40 = 2 × 16 + 8                           [MISSING]
    fork and copy-on-write in an operating system                   [MISSING]

14. cache-aware routing                                             [PARTIAL Fig 14: prose; TAUGHT IN V01 Fig 53]
  replicas                                                          [TAUGHT IN V05 Fig 18]
  hit chance across 4 replicas: 25% by load, ~100% by prefix         [MISSING]

15. prompt-cache pricing                                            [COVERED Fig 14]
  read 0.10×, write 1.25× for 5 minutes (one provider)               [COVERED Fig 14: provider unnamed, reads as universal]
  break-even over n uses (n > 1.28)                                  [PARTIAL Fig 14: n = 2 only]
    linear functions                                                floor
  agent loop: 90.5% of input cached, 4.77× cheaper                  [MISSING]
    the sum 1 + 2 + … + n                                           floor

16. engine against orchestrator                                     [COVERED Fig 15: anonymised]
  kernel                                                            [TAUGHT IN V03 Fig 4–5]
  scheduler, cache and kernels in one engine                        [COVERED Fig 15; TAUGHT IN V01 Fig 17]
  the named systems on each layer                                   [MISSING: removed]
  what "Kubernetes-native" means                                    [MISSING]

17. goodput per GPU                                                 [COVERED Fig 16]
  throughput against goodput                                        [TAUGHT IN V01 Fig 145]
  attainment = share meeting BOTH targets                            [PARTIAL Fig 16: stated]
    AND of two conditions, worked on 10 requests                     [MISSING]
    percentages                                                     floor
  per-GPU goodput read off an attainment-vs-rate curve               [MISSING]
  utilisation is busy time, not useful work                          [PARTIAL Fig 16; defined only later, V08 Fig 27]
  cost per query = $/GPU-hour ÷ queries per GPU-hour                 [MISSING]

18. preemption: swap or recompute                                   [COVERED Fig 17]
  caches grow by a block every 16 tokens per request                 [PARTIAL Fig 17: stated]
  whole-sequence eviction                                           [COVERED Fig 17]
  swap: bytes over the CPU–GPU bus                                   [PARTIAL Fig 17: no numbers]
    PCIe Gen5 x16 = 63.0 GB/s per direction                          [MISSING]
    what a bus is                                                   [TAUGHT IN V02 Fig 8]
  recompute as one prefill: 295× faster than token by token          [MISSING]
  the verdict depends on bus against spare compute                   [PARTIAL Fig 17: stated]

19. refusing work                                                   [PARTIAL Fig 18: three boxes]
  counting requests against counting tokens (B gets 83–98%)          [MISSING]
  virtual token counter: serve the lowest counter                    [MISSING]
  overload: everyone shares, everyone misses, goodput 0              [MISSING]
    a rate divided among a count                                    floor
  admission control: predict and reject early                        [PARTIAL Fig 18]
  autoscaling: the prefill:decode split follows the traffic mix      [MISSING]

20. logits → softmax → one token                                    [COVERED Fig 19, 20]
  logits                                                            [TAUGHT IN V01 Fig 8]
  softmax                                                           [TAUGHT IN V01 Fig 9; V03 Fig 22–25]
  drawing in proportion                                             [TAUGHT IN V01 Fig 10]
  greedy decoding                                                   [PARTIAL Fig 20]
  beam search: keep the B best partial sequences                     [MISSING]
    a sequence's probability is a product                           [MISSING]
      multiplying probabilities                                     floor
  degeneration, the GPT-2 example                                   [PARTIAL Fig 20: no example]
  tail mass adds up: 1 − 0.9^100                                    [MISSING]
    complements, powers                                             floor

21. temperature                                                     [PARTIAL Fig 21: says what, not how]
  divide logits by T, worked at T = 0.5, 1, 2                        [MISSING]
  why: probability ratio = e^(gap ÷ T)                               [MISSING]
    e^x, exponent rules                                             floor
  top-k: rank, keep k, renormalise                                   [PARTIAL Fig 21; same operation TAUGHT IN V06 Fig 9]
  top-p: sort, running total, cut at P                               [PARTIAL Fig 21]
    running totals                                                  floor
    confident 2 tokens against unsure 5                             [MISSING]
  min-p: threshold = fraction × top probability                      [PARTIAL Fig 21]
  renormalise and draw                                              [COVERED Fig 21]

22. constrained decoding by masking                                 [COVERED Fig 23]
  why asking in the prompt is no guarantee: (1 − p)^n                [PARTIAL Fig 23: asserted]
  minus infinity → probability exactly 0                             [PARTIAL Fig 23: stated]
    e^x → 0 as x → −∞                                               floor
  a token can span several characters                               [MISSING]
    what a token is                                                 [TAUGHT IN V01 Fig 6]
  finite state machine: states, labelled edges, reject               [PARTIAL Fig 22: drawn as a linear flow]
  why it cannot count: d + 1 states for depth d                      [PARTIAL Fig 22: asserted]
  stack: push and pop, traced                                       [PARTIAL Fig 22: described]
  pushdown automaton = state machine + stack                        [COVERED Fig 22, 23]
  a mask can steer: remove the top token (dog → 97.2%)               [PARTIAL Fig 24: asserted]

23. making the mask cheap                                           [COVERED Fig 24]
  naive: test every vocabulary token, every step                     [COVERED Fig 24]
  index: state → allowed set, built once                             [PARTIAL Fig 24: words]
  split the vocabulary: precheck most, stack-check the rest          [PARTIAL Fig 24]
  build the mask on the CPU during the GPU pass                      [PARTIAL Fig 24]
    asynchronous work; the CPU beside the GPU                       [TAUGHT IN V03 Fig 72, 95]
```

---

## 4. Proposed new figures

There are 70, in video order. "Insert after" refers to the current numbering. Inside a group, "after Pn"
means directly after the previous proposal. [WIDGET] marks entries that would teach far better as
interactive widgets. Five matter most:

- the scheduler step-through (P16)
- the step-time and chunk-size slider (P22–P26)
- the page-table lookup (P13)
- the context-length slider (P9)
- a sampler playground (P58–P62)

All five rest on arithmetic verified below.

### A · Why serving needs a crowd (0:00–1:03)

**P1** · insert before Fig 01 · **0:00** · *Eight experts out of 256 need a crowd to stay busy*
- Grid: 256 cells, 8 lit for one token. Beside it, a table: a batch of 32 tokens gives 1 token per
  expert, 64 gives 2, and 9,440 gives 295.
- Fills: Tree 2, the MoE crowd and tokens per expert. Recaps V06 Figs 2, 9 and 22.
- Numbers: `256/8 = 32`; `32*8/256 = 1.0`; `64*8/256 = 2.0`; `295*32 = 9440`; `9440*8/256 = 295.0`.

**P2** · after P1 · **0:22** · *A serving system makes two promises to every user*
- Timeline of one request: arrive, wait in the queue, prefill, first token (TTFT bracket), then evenly
  spaced tokens (TPOT bracket). Above it, nested containers (cluster ⊃ node ⊃ GPU) with many request
  arrows coming in.
- Fills: Tree 2, the serving system and its two targets. Recaps V01 Figs 17, 19 and 143–144.
- Numbers: none new. Any target values drawn must be labelled illustrative.

**P3** · after Fig 01 (restamped 0:39) · **0:59** · *Decode at batch one sits 295 times left of the ridge*
- Roofline recap on log axes, with a point at intensity 1 against the ridge at 295. Inset bars to
  scale: 41.8 ms of memory time against 0.142 ms of arithmetic for one 70B step.
- Fills: Tree 1, intensity and ridge. Recaps V01 Figs 123–130.
- Numbers: `989e12/3.35e12 = 295.2`; `140e9/3.35e12 = 41.8 ms`; `140e9/989e12 = 0.142 ms`; ratio 295.

### B · Batching, built up (1:44–2:48)

**P4** · after Fig 03 (1:38) · **2:06** · *A matrix times three vectors still reads the matrix once*
- Grid: a 4×4 weight grid, with one input column on the left and three on the right. Counters beneath
  each: weights read 16 / 16, multiply-adds 16 / 48, intensity 1 / 3 ops per byte (FP16).
- Fills: Tree 3, vectors stacked as rows.
- Numbers: `4*4 = 16`; `3*16 = 48`; FLOPs `32` vs `96`; bytes `16*2 = 32`; `32/32 = 1`, `96/32 = 3`.

**P5** · after P4 · **2:27** · *Intensity rises one-for-one with the batch*
- Equation built up: ops = 2·P·N, bytes = 2·P, so intensity = N. Then a table for 70B. The step stays
  at 41.8 ms, so N = 1, 8 and 64 give 23.9, 191 and 1,531 tokens/s.
- Fills: Tree 3, intensity at N and throughput at N.
- Numbers: `3.35e12/140e9 = 23.93`; `×8 = 191.4`; `×64 = 1531.4`.

**P6** · after P5 · **2:38** · *Batch 295 is where decode reaches the ridge* [WIDGET: batch slider]
- Roofline with a draggable point. Attainable = min(989, 3.35·N) TFLOP/s: 3.35, 26.8, 214.4 and 988
  at N = 1, 8, 64 and 295. The caption warns that this counts weights only and that P9 changes it.
- Fills: Tree 3, the batch that reaches the ridge.
- Numbers: `min(989, 3.35*N)` gives 3.35, 26.8, 214.4, 988.25.

### C · The ceiling: caches, capacity, paging (4:34–6:21)

This group replaces most of Fig 5's prose.

**P7** · after Fig 05 (4:36) · **4:54** · *One token of context costs 128 KiB on Llama 3 8B*
- Equation built up (recap): 2 × 32 × 8 × 128 × 2 = 131,072 B. × 2,048 tokens = 268 MB per request;
  × 8,192 = 1.07 GB.
- The capacity story uses 8B because "the card" means one 80 GB GPU, and 70B in FP16 does not fit on
  one. State in a sentence that this is V01's formula.
- Fills: Tree 5, bytes per token worked. Recaps V01 Figs 138–140.
- Numbers: `2*32*8*128*2 = 131072`; `2048*131072 = 268,435,456`; `8192*131072 = 1,073,741,824`.

**P8** · after P7 · **4:58** · *Each cache is read by exactly one request*
- Containers: one weight block with arrows to four request rows (shared), against four separate cache
  blocks with one arrow each.
- Beneath: each K or V element meets 4 query heads × 2 ops, over 2 bytes. That is 4 ops/byte whatever
  N is.
- Fills: Tree 5, attention intensity is fixed. GQA recaps V03 Figs 88–89.
- Numbers: `(4*32*128*L*32)/(L*131072) = 4.0` (L cancels); 32 query heads ÷ 8 KV heads = 4.

**P9** · after P8 · **5:16** · *Once the caches count, batching stops paying at about 64* [WIDGET: context slider]
- Line plot on a log x-axis. Weights only: intensity = N, a straight line. With 2,048-token caches:
  1.0, 7.5, 22.2, 33.0, 43.5, 51.7 and 60.3 at N = 1, 8, 32, 64, 128, 256 and 1,024, approaching 63.8.
  The ridge at 295 is dashed, far above.
- Fills: Tree 5, the intensity plateau. This is where "attention stays on the memory bound floor no
  matter how large the batch grows" becomes a number.
- Numbers: `N*(2*8.03e9+1.07e9)/(16.06e9+N*268.4e6)` gives the listed values; the limit is
  `(2*8.03e9+1.074e9)/268.4e6 = 63.8`.

**P10** · after P9 · **5:27** · *What fills an 80 GB card*
- Stacked bar to scale: weights 16.06 GB, working space 4 GB (an assumption, labelled), KV pool
  59.94 GB.
- Small multiples divide the pool into requests: 223 at 2,048 tokens, 55 at 8,192, and 14 at 32,768.
- Fills: Tree 6, the HBM budget and requests that fit.
- Numbers: `80-16.06-4 = 59.94`; `59.94e9/268.4e6 = 223.3`; `/1.074e9 = 55.8`; `/4.295e9 = 14.0`.

**P11** · after P10 · **5:43** · *Out of room at 55, out of arithmetic at 295*
- Two bars on one scale: the memory-limited batch at 8K context against the batch the ridge needs.
- Fills: Tree 6, "You run out of room before you run out of arithmetic".
- Numbers: 55 (from 55.8) and 295 (from 295.2).

**P12** · after P11 · **5:52** · *Reserving for the longest answer wastes seven-tenths of the memory*
- Memory strip (recap of V03 Figs 83–84): four contiguous 2,048-slot reservations holding 400, 700,
  250 and 1,100 tokens. A free gap is too small for a fifth request.
- Fills: Tree 7, internal and external waste worked.
- Numbers: `2450/8192 = 29.9%` used. This sits inside the reported "20 to 38%" band.

**P13** · after P12 · **6:13** · *A token's address is one division* [WIDGET: type a token index]
- Table with pointer. With 16-token blocks, token 37 → 37 ÷ 16 = 2 remainder 5. The block table
  [7, 1, 3] gives physical block 3, and the slot is 3 × 16 + 5 = 53.
- Note that one block = 16 × 131,072 B = 2 MiB across 32 layers (64 KiB per layer).
- Fills: Tree 7, the address by division with remainder. No atlas in the series works a lookup with
  numbers; V03 Fig 86's blocks carry no labels.
- Numbers: `divmod(37,16) = (2,5)`; `[7,1,3][2] = 3`; `3*16+5 = 53`; `16*2*8*128*2 = 65,536`.

**P14** · after P13 · **6:16** · *Blocks arrive one at a time, so at most fifteen slots sit empty*
- A grid timeline of a sequence filling 16-slot blocks taken from a free list. Then a table: 37 tokens
  use 3 blocks with 11 empty (22.9%); 1,000 use 63 with 8 empty (0.8%); 2,001 use 126 with 15 empty
  (0.7%).
- Fills: Tree 7, allocation on demand and the waste bound.
- Numbers: `ceil(37/16) = 3`, `11/48 = 22.9%`; `ceil(1000/16) = 63`; `ceil(2001/16) = 126`, `15/2016 = 0.7%`.

**P15** · after P14 · **6:21** · *The same memory holds two and a half to nearly five times the sequences*
- Bars to scale for the share of KV memory holding real tokens: 20.4% and 38.2% before, about 96%
  after. The room multipliers are 2.51× and 4.71×.
- The caption restores the dropped 8:08 line: "vLLM, measured against Orca a year later, reported two
  to four times."
- Fills: Tree 7, more sequences fit.
- Numbers: `0.96/0.382 = 2.51`; `0.96/0.204 = 4.71`. **VERIFY** 20.4–38.2% and "under 4% waste"
  (Kwon et al., SOSP 2023).

### D · Continuous batching (6:42–8:08)

**P16** · after Fig 06 (6:40) · **7:25** · *The same four requests, one step at a time* [WIDGET: play and step]
- Lane chart: four seats × 512 steps, in two panels on one time axis.
  - Static: seats busy until steps 8, 24, 60 and 512, dashed idle after.
  - Continuous: seven waiting requests needing 100, 300, 200, 450, 150, 80 and 260 steps are admitted
    at steps 8, 24, 60, 108, 260, 324 and 404. One seat idles after step 410, once the queue is empty.
  - A strip under each panel shows tokens per weight read.
- Fills: Tree 8, joining and leaving on the four requests the video names ("Take the same four
  requests").
- Numbers (Python simulation): static `604/2048 = 29.5%`, mean `604/512 = 1.18` per read; continuous
  `1946/2048 = 95.0%`, mean `1946/512 = 3.80`; ratio `1946/604 = 3.22`.

**P17** · after P16 · **7:50** · *A median is the middle of a sorted line*
- Sorted population: ten requests at 260, 280, 300, 320, 350, 380, 390, 410, 450 and 900 ms. The median
  is (350 + 380)/2 = 365, p90 is the 9th value, 450, and the tail is the last few.
- The first use is "a median latency of 190 milliseconds" at 7:58, and "tail latency" follows at 11:58.
  V08 Fig 25 builds this later, so move that construction here and let V08 recap it.
- Fills: Tree 8, median and percentiles.
- Numbers: `(350+380)/2 = 365.0`; nearest-rank p90 = 450.

### E · Selective batching (8:28–10:10)

**P18** · after P17 (before Fig 07) · **8:30** · *Different histories make different shapes*
- Grid: four key caches of lengths 5, 3, 9 and 1 as ragged rows, then padded into a 4 × 9 rectangle.
- Fills: Tree 9, ragged shapes. This is the floor under "no guarantee the next iteration can be merged".
- Numbers: `5+3+9+1 = 18`; `4*9 = 36`; `1-18/36 = 50%` padding.

**P19** · after Fig 07 (8:43) · **8:52** · *A linear layer treats every row on its own*
- Equation built up. Rows a = [1, 0], b = [2, 1] and c = [0, 3] times W = [[1, 2], [−1, 1]] give
  [1, 2], [1, 5] and [−3, 3], whether computed one at a time or stacked.
- Fills: Tree 9, the linear layer.
- Numbers: verified in Python.

**P20** · after P19 · **8:55** · *Normalising and activating also look at one token at a time*
- Number lines. Layer norm (before its learned scale): [2, 4, 6, 8] has mean 5 and standard deviation
  2.236, giving [−1.342, −0.447, 0.447, 1.342]. Llama's RMS norm divides by 5.477 instead, giving
  [0.365, 0.730, 1.095, 1.461]. SiLU, element by element: −1 → −0.269, 0.5 → 0.311, 2 → 1.762.
- Fills: Tree 9, layer norm and the activation function.
- Numbers: mean 5.0, variance 5.0, sd 2.236; rms `sqrt(30) = 5.477`; `x/(1+e^-x)` values as listed.

**P21** · after P20 · **9:10** · *Seven tokens from four requests run as one matrix, then split for attention*
- Grid. Seven rows (two decodes of 1 token, prompts of 2 and 3) are stacked into one [7 × d] block
  for the projections.
- A second grid shows the 7 attention rows. Each row is lit only over its own request's cache and
  causal prefix, giving a block structure with the rest blank.
- Fills: Tree 9, flattening and per-request attention. The causal mask recaps V03 Fig 20.
- Numbers: `1+1+2+3 = 7`. **VERIFY** the split against Orca's (Yu et al., OSDI 2022) Figure 4.

### F · Chunked prefill (10:11–12:18)

**P22** · after Fig 08 (restamped 10:11) · **10:30** · *A step costs the longer of two times* [WIDGET, shared with P25–P26]
- Line plot of step time against tokens in the step, for Llama 3 8B on H100 at peak. It is flat at
  4.79 ms (the weight read) up to 295 tokens, then rises: 8.31 ms at 512, 33.3 at 2,048, 66.5 at 4,096.
- Fills: Tree 10, step time = max(...) and flat up to the ridge.
- Numbers: `16.06e9/3.35e12 = 4.79 ms`; `2*8.03e9*n/989e12` gives 8.31, 33.26, 66.51 ms.

**P23** · after P22 · **10:40** · *One prompt joins, and everyone's next token waits at least fourteen times longer*
- Lane chart: three users' tokens tick every 4.79 ms. A 4,096-token prefill joins one iteration and
  leaves a 66.5 ms gap for everyone.
- The caption explains that at-peak arithmetic gives a lower bound, and that the video reports "as much
  as 28 times".
- Fills: Tree 10, the stall.
- Numbers: `66.51/4.79 = 13.9`.

**P24** · after Fig 09 (restamped 10:57) · **11:10** · *A 512-token budget: decodes first, then a 480-token slice*
- Bars to scale, one per iteration: [32 decode | 480 prompt] four times, then [32 | 80]. A 2,000-token
  prompt takes 5 iterations.
- Fills: Tree 10, the budget arithmetic.
- Numbers: `512-32 = 480`; `ceil(2000/480) = 5`; `2000-4*480 = 80`. **VERIFY** that 512 and 2,048 are
  budgets Sarathi-Serve uses.

**P25** · after P24 · **11:20** · *Prompt tokens ride free until the step reaches the ridge*
- P22's curve with marked points:
  - 32 decodes alone take 4.79 ms.
  - 32 decodes plus 263 prompt tokens (295 in all) still take 4.79 ms.
  - A 512-token budget takes 8.31 ms (1.7×).
  - A 2,048-token budget takes 33.3 ms (6.9×).
- Fills: Tree 10, piggybacking. This is why the budget "bounds the cost of an iteration".
- Numbers: `295-32 = 263`; `8.31/4.79 = 1.7`; `33.26/4.79 = 6.9`.

**P26** · after P25 · **11:40** · *Chunk size, priced both ways* [WIDGET: chunk-size slider]
- Two lane charts.
  - Budget 512: decodes slow to 8.31 ms a token for 5 iterations, and the prompt's own first token
    comes after ≈ 41.6 ms of chunks.
  - Budget 2,048: a single 33.3 ms hiccup, and the prompt is done in one iteration.
- Footnote: the five chunks reread the earlier chunks' caches, 0 + 480 + 960 + 1,440 + 1,920 = 4,800
  entries = 629 MB.
- Fills: Tree 10, the trade worked, including the re-reads.
- Numbers: `5*8.31 = 41.6 ms`; `4800*131072 = 629 MB`.

**P27** · after P26 · **12:15** · *Even steps shrink the pipeline bubble*
- Lane chart (recap of V05 Figs 12–13): 4 stages and 8 micro-batches with the same total work, 20.
  Uneven sizes [7,1,1,1,7,1,1,1] take 41 time units with 51.2% idle; even sizes (8 × 2.5) take 27.5
  with 27.3% idle.
- Fills: Tree 10, "iterations of uniform size leave fewer pipeline bubbles".
- Numbers: pipeline simulation in Python. The even case equals V05's formula: `3/11 = 27.3%`.

### G · Disaggregation (12:23–15:08)

**P28** · after Fig 10 (12:23) · **12:42** · *Prefill and decode sit on opposite sides of the same ridge*
- Roofline recap. Prefill sits at 1,024–2,000 ops/byte. Decode sits at 1 at batch 1, and at 33 at
  batch 64 with 2K caches (from P9).
- Fills: Tree 11, opposite workloads. Recaps V01 Fig 129 and V02 Fig 76.
- Numbers: V02's 1,024 and V01's 2,000; 33.0 is recomputed.

**P29** · after P28 · **13:18** · *Where 1.13 GB comes from*
- Equation built up. OPT-66B: 2 × 64 layers × 9,216 (72 heads × 128) × 2 B = 2,359,296 B per token.
  × 512 = 1,207,959,552 B, which is 1.208 GB or 1.125 GiB (the paper's "1.13 GB").
- Against Llama 3 70B with GQA: 327,680 B per token, so 168 MB, 7.2× smaller.
- Fills: Tree 11, the handoff size. GQA recaps V03 Figs 88–89.
- Numbers: as above. **VERIFY** OPT-66B's shape (64 layers, d_model 9,216, 72 heads).

**P30** · after P29 · **13:27** · *Networks count bits: 11.3 GB/s is 90 Gb/s*
- Equation and bars. 1.13 GB × 10/s = 11.3 GB/s, and × 8 = 90.4 Gb/s. A 400 Gb/s port carries
  50 GB/s, so this traffic needs 23% of one port; NVLink carries 900 GB/s.
- Fills: Tree 11, link rates in bits. Recaps V01 Figs 72–73 and V05 Fig 8.
- Numbers: `11.3*8 = 90.4`; `400/8 = 50`; `11.3/50 = 22.6%`.

**P31** · after P30 · **13:33** · *One request's handoff, timed*
- Bars to scale: OPT-66B's 512-token cache takes 24.2 ms over 50 GB/s and 1.34 ms over NVLink.
  Llama 3 70B's takes 3.4 ms over 50 GB/s.
- Fills: Tree 11, the handoff time.
- Numbers: `1.208e9/50e9 = 24.2 ms`; `/900e9 = 1.34 ms`; `167.8e6/50e9 = 3.4 ms`.

**P32** · after P31, before Fig 11 (restamp Fig 11 to 13:52) · **13:47** · *Inside both budgets means both at once*
- Table: 10 requests with TTFT and TPOT, against targets of 500 ms and 50 ms (illustrative), with a
  tick per column. Request 4 fails on TTFT (900 ms), so attainment is 9 of 10 = 90%.
- Fills: Trees 11 and 17, attainment as an AND of two conditions.
- Numbers: verified, 9/10.

**P33** · after Fig 11 · **14:30** · *A decode pool of 144 GPUs gives every expert a real batch*
- Bars and a table. One GPU's batch of 64 gives 64 × 8/256 = 2 tokens per expert. 144 GPUs × 64 =
  9,216 tokens give 288 per expert, near the 295-token ridge.
- Each decode GPU holds (256 + 32 redundant) ÷ 144 = 2 experts; each prefill GPU holds 288 ÷ 32 = 9.
- One line reconciles this with V06 Fig 19, whose decode unit is 320 GPUs (see §5).
- Fills: Tree 11, tokens per expert. Recaps V05 Figs 15–16 and V06 Figs 19–21.
- Numbers: `9216*8/256 = 288.0`; `288/144 = 2.0`; `288/32 = 9`; ridge in FP8 tokens
  `1979e12/3.35e12/2 = 295.4`. **VERIFY** EP32/EP144 and the 32 redundant experts (DeepSeek's 2025
  inference-system overview). The per-GPU batch of 64 is illustrative.

**P34** · after P33 · **14:50** · *A KV cache that outlives the GPU that made it*
- Nested containers: HBM ⊂ node DRAM ⊂ SSD, pooled across the cluster. A prefix is cached once and
  served to any prefill node.
- Fills: Tree 11, the KV-centric design. The video's sentence is "MoonCake, the platform behind Kimi,
  built its whole architecture around the KV cache."
- Numbers: none. **VERIFY** Mooncake's design (Qin et al., 2024).

**P35** · after P34 · **15:05** · *Twenty cents per million tokens is one division*
- Equation built up: 22,300 output tok/s per node ÷ 8 = 2,787.5 per GPU. × 3,600 = 10.04 M per
  GPU-hour, and $2 per GPU-hour ÷ 10.04 = $0.199 per million.
- Fills: Tree 11, cost per million tokens.
- Numbers: verified. **VERIFY** the $2/GPU-hour assumption in the SGLang (LMSYS, May 2025) write-up.

### H · Prefix caching and the radix tree (15:14–18:00)

**P36** · after Fig 12 (15:14) · **15:45** · *An agent is a model in a loop that keeps resending everything*
- A genuine loop: context → model → tool call (structured text) → tool runs → result appended →
  model again. The context grows on every lap.
- Fills: Tree 12, the agent loop. Agents and tool calls are used in Figs 12, 14, 23 and 24 but never
  built anywhere in V01–V06; V01 Fig 27 only lists "tool definitions" in a preamble.
- Numbers: none.

**P37** · after P36 · **15:58** · *Recap: a hit runs from the front and stops at the first difference*
- Two token rows (cached and arriving), with the match bar ending at the first mismatch.
- Fills: Tree 12, the prefix match. Recaps V01 Figs 44–46.
- Numbers: reuses V01's 906 of 911.

**P38** · after P37 · **16:05** · *Fifty requests behind one system prompt: fifteen times less prefill*
- Bars to scale: 50 × (2,000 + 100) = 105,000 prefill tokens without the cache against 2,000 + 50 × 100
  = 7,000 with it. Decode is unchanged (recap of V01 Fig 55).
- Fills: Tree 12, the saving.
- Numbers: `105000/7000 = 15.0`. Inputs are illustrative; the 2,000-token prompt matches V01 Fig 27.

**P39** · after P38 (before Fig 13) · **16:19** · *What a tree is*
- A labelled tree: root, internal nodes, edges, leaves, and one root-to-leaf path highlighted.
- Fills: Tree 13, tree basics.
- Numbers: none.

**P40** · after P39 · **16:22** · *A prefix tree stores each shared beginning once*
- A tree with one token per edge for three prompts: "You are helpful . What is 2+2 ?", "… What is the
  capital of France ?" and "… Translate cat". 25 tokens are sent and 15 nodes stored.
- Fills: Tree 13, the trie.
- Numbers: verified, 25 and 15.

**P41** · after P40 · **16:25** · *A radix tree merges every chain into one edge*
- Small multiples, before and after. The 15 single-token nodes become 5 edges:
  [You are helpful .] → { [What is] → { [2+2 ?], [the capital of France ?] }, [Translate cat] }.
- Fills: Tree 13, radix compression. Then redraw Fig 13 (restamped 16:30) with these tokens.
- Numbers: 5 edges, verified.

**P42** · after Fig 13 · **16:33** · *A new prompt walks the tree until it disagrees*
- Tree with pointer.
  - "You are helpful . What is 3+3 ?" hits 6 tokens, needs 2 prefilled, and gets a new leaf.
  - "You are kind ." disagrees inside the first edge. That edge splits into
    [You are] → {[helpful .], [kind .]}, with 2 tokens hit.
- Fills: Tree 13, lookup, insert and split.
- Numbers: Python walk: 6 of 8 and 2 of 4.

**P43** · after P42 · **16:40** · *Evict the stalest leaf, never one in use* [WIDGET: step-through]
- A tree carrying a last-used time and a reference count on each node, through three eviction rounds.
  The least recently used leaf with count 0 goes first, its parent becomes a leaf, and the trunk (count
  above 0) survives.
- Fills: Tree 13, LRU with reference counts. LRU recaps V01 Fig 54.
- Numbers: toy timestamps only.

**P44** · after P43 · **16:58** · *Two block tables, one physical copy, until they disagree*
- Table with pointers. With 16-token blocks and a 40-token shared prefix, blocks 0 and 1 are shared
  (reference count 2). Block 2 holds 8 tokens and is copied at the divergence, and each sequence writes
  token 40 into its own copy.
- A second panel shows the operating-system version: a forked process shares pages read-only until one
  side writes.
- Fills: Tree 13, copy-on-write and fork. Recaps V03 Fig 87.
- Numbers: `divmod(40,16) = (2,8)`.

**P45** · after P44 · **17:18** · *Routing for hits fights routing for load*
- Floor plan of four replicas. Least-busy routing sends the next turn to any of the 4, a 25% chance its
  prefix is there. Cache-aware routing sends it to the holder even when that replica is busier.
- Fills: Tree 14. Recaps V05 Fig 18 and V01 Fig 53.
- Numbers: `1/4 = 25%`.

**P46** · after Fig 14 (restamped 17:33) · **17:45** · *A cached prefix pays for itself on its second use*
- Bars to scale for n = 1 to 5 uses: fresh costs 1.00 to 5.00 against cached 1.25, 1.35, 1.45, 1.55
  and 1.65. Break-even is just past 1.28 uses.
- Name the 1.25× write premium as Anthropic's; the 0.10× read is "Anthropic and OpenAI both" in the
  video.
- Fills: Tree 15, break-even.
- Numbers: `1.25+0.10*(n-1)`; `(1.25-0.10)/0.90 = 1.278`.

**P47** · after P46 · **17:55** · *An agent's bill is almost all prefix* [WIDGET: steps and tokens per step]
- A staircase of stacked bars over 20 steps with 1,000 new tokens each. 210,000 tokens are sent, of
  which 190,000 (90.5%) are a cached prefix.
- The cost is 210,000 units fresh against 25,000 (writes at 1.25) + 19,000 (reads at 0.10) = 44,000,
  4.77× cheaper.
- Fills: Tree 15, the agent loop. Assumes each step writes only its new tokens.
- Numbers: `sum(k*1000 for k in 1..20) = 210000`; `44000`; `4.77`.

### I · Goodput (19:15–20:05)

**P48** · after Fig 16 (19:20) · **19:36** · *Per-GPU goodput is read where attainment crosses 90%* [WIDGET]
- Line chart, schematic and labelled. Attainment against rates of 1 to 5 req/s: 100, 99, 95, 88 and
  60%. The curve crosses 90% between 3 and 4 req/s, so 3 req/s on 2 GPUs = 1.5 per GPU.
- Fills: Tree 17, the attainment curve.
- Numbers: `3/2 = 1.5`; the curve is illustrative.

### J · Preemption (20:09–21:08)

**P49** · after Fig 17 (20:08) · **20:15** · *A batch that fit a minute ago*
- Small multiples of a shrinking free-block bar. 50 running requests each need a new block every 16
  steps, 3.1 blocks per step, so 30 free blocks last 9.6 steps.
- Fills: Tree 18, caches grow.
- Numbers: `50/16 = 3.125`; `30/3.125 = 9.6`.

**P50** · after P49 · **20:40** · *Swap or recompute, priced in milliseconds*
- Bars on a log axis, labelled, for a 2,500-token Llama 3 8B request (328 MB of cache):
  - swap out: 5.2 ms over PCIe Gen5 x16, or 10.4 ms on Gen4, and the same again to swap back in
  - recompute as one prefill: at least 40.6 ms at peak
  - recompute token by token: 12.0 s, 295 times longer (the ridge again)
- The caption: on these numbers swapping wins; a slower bus, a busier GPU or a cache-heavy model moves
  the line. This is the video's "Which one wins depends on the machine."
- Fills: Tree 18, PCIe and recompute-as-prefill.
- Numbers: `2500*131072 = 327.7 MB`; `32e9*16*(128/130)/8 = 63.0 GB/s`, so 5.2 ms; Gen4 31.5 GB/s, so
  10.4 ms; `2*8.03e9*2500/989e12 = 40.6 ms`; `2500*16.06e9/3.35e12 = 12.0 s`; ratio 295.

### K · Refusing work (21:10–22:30)

**P51** · after Fig 18 (restamped 21:10) · **21:15** · *Counting requests hands the machine to the heaviest tenant*
- Bars to scale. Alternate 12 requests between tenant A (100 tokens each) and B (500 each): A gets 600
  tokens and B gets 3,000, 83.3%. If B's requests are 5,000 tokens, B gets 98.0%.
- Fills: Tree 19, requests against tokens.
- Numbers: `3000/3600 = 83.3%`; `50000/51000 = 98.0%`.

**P52** · after P51 · **21:25** · *The virtual token counter serves whoever has had least* [WIDGET: step-through]
- Table with pointer: 12 decisions, two counters, pick the lower (A on a tie). A is served 10 requests
  (1,000 tokens) and B 2 (1,000 tokens).
- Fills: Tree 19, the VTC.
- Numbers: Python simulation. **VERIFY** the input/output weighting in Sheng et al., OSDI 2024.

**P53** · after P52 · **21:38** · *Admit thirty and all thirty are late; admit twenty and all twenty are on time*
- Small multiples of bars. Capacity is 1,000 tok/s, and a 20 ms TPOT target needs 50 tok/s per request,
  so 20 fit. Admit 30 and each gets 33.3 tok/s = 30 ms per token: all late, goodput zero, utilisation
  100%.
- Define utilisation here as busy time, not useful work. Name Mooncake's "prediction-based early
  rejection policy".
- Fills: Trees 19 and 17, overload, admission and utilisation.
- Numbers: `1/0.020 = 50`; `1000/50 = 20`; `1000/30 = 33.3`, so 30 ms.

**P54** · after P53 · **22:05** · *The right split follows the traffic*
- Stacked bars to scale at 10 req/s.
  - Long prompts (2,000 in, 200 out) need 3.06 prefill and 0.72 decode GPUs, 81% prefill.
  - Short prompts (200 in, 2,000 out) need 0.31 and 7.17, 4% prefill.
- Per-GPU rates are borrowed from the 96-GPU run (6,538 input and 2,788 output tok/s per GPU) and
  labelled illustrative.
- Fills: Tree 19, autoscaling.
- Numbers: `10*2000/6537.5 = 3.06`, `10*200/2787.5 = 0.72`; and so on.

### L · The sampler (22:37–25:05)

**P55** · after Fig 20 (restamped 23:01) · **23:07** · *Greedy and beam search both chase the most probable text*
- A two-step probability tree. Step one: A 0.5, B 0.4, C 0.1. After A: x 0.4, y 0.3, z 0.3. After B:
  x 0.9, y 0.1.
- Greedy picks A then x, for 0.20. Beam search of width 2 keeps A and B and finds B then x, for 0.36.
- Fills: Tree 20, beam search and the product of probabilities.
- Numbers: verified, 0.20 against 0.36.

**P56** · after P55 · **23:20** · *Degeneration: the most probable text repeats itself*
- A text sample with the repeated spans highlighted: the GPT-2 beam-search continuation that repeats a
  university name, beside a human continuation.
- Fills: Tree 20, degeneration.
- Numbers: none. **VERIFY** and quote the exact example (Holtzman et al., ICLR 2020, Figure 1).

**P57** · after P56 · **23:45** · *A thin tail adds up*
- Bars and equation. 1,000 tail tokens at 0.01% each make 10% of the mass at every step. Over 100
  tokens the chance of at least one tail draw is 1 − 0.9^100 = 99.997%, with 10 expected. With a 1%
  tail it is 63.4%.
- Fills: Tree 20, tail mass.
- Numbers: `1-0.9**100 = 0.99997`; `1-0.99**100 = 0.634`. The masses are illustrative.

**P58** · after Fig 21 (24:01) · **24:05** · *Halving the temperature turns 74% into 90%* [WIDGET: the sampler playground starts here]
- Small multiples on V01's own four logits (cat, dog, the, banana = 8.2, 7.1, 3.5, 0.4), bars to scale:

  | T | logits ÷ T | cat | dog | the | banana |
  |---|---|---|---|---|---|
  | 0.5 | 16.4, 14.2, 7.0, 0.8 | 90.0% | 10.0% | 0.01% | 0.00% |
  | 1 | 8.2, 7.1, 3.5, 0.4 | 74.5% | 24.8% | 0.68% | 0.03% |
  | 2 | 4.1, 3.55, 1.75, 0.2 | 59.1% | 34.1% | 5.6% | 1.2% |

- Fills: Tree 21, temperature worked. Recaps V01 Fig 9.
- Numbers: softmax of each row, verified.

**P59** · after P58 · **24:12** · *Dividing by T multiplies every gap's exponent*
- Equation built up: p_cat / p_dog = e^((8.2 − 7.1)/T). That is e^2.2 = 9.03 at T = 0.5, e^1.1 = 3.00
  at T = 1, and e^0.55 = 1.73 at T = 2. As T → 0 the ratio explodes (greedy); as T → ∞ it tends to 1.
- Fills: Tree 21, why it works.
- Numbers: verified.

**P60** · after P59 · **24:26** · *Top-k keeps the k best and ignores how sure the model is*
- Bars. On the confident list, k = 2 gives cat 75.0% and dog 25.0% after rescaling. On the unsure list
  (P61), k = 2 keeps 2 of 5 near-equal candidates.
- It is the same rank, cut and rescale as the MoE router (V06 Figs 9 and 13).
- Fills: Tree 21, top-k.
- Numbers: `0.7449/(0.7449+0.2480) = 75.0%`.

**P61** · after P60 · **24:35** · *Top-p keeps two tokens when the model is sure and five when it is not*
- Sorted bars with a running-total bar, for two lists.
  - Confident: 74.5%, then 99.3%, so 2 tokens pass 0.9.
  - Unsure logits 3.0, 2.9, 2.8, 2.7, 2.6, 0.0 give 23.9, 21.6, 19.6, 17.7, 16.0 and 1.2%. The running
    total first passes 0.9 at 5 tokens (98.8%).
- Fills: Tree 21, top-p and the running total.
- Numbers: verified.

**P62** · after P61 · **24:48** · *Min-p sets its cut as a fraction of the leader*
- The same two lists with a threshold at 0.1 × the top probability: 7.45% keeps cat and dog; 2.39%
  keeps 5.
- Fills: Tree 21, min-p.
- Numbers: `0.1*74.49 = 7.45%`; `0.1*23.9 = 2.39%`.

### M · Constrained decoding (25:05–27:57)

**P63** · after Fig 23 (25:28) · **25:37** · *Asking nicely is a bet placed on every token*
- Bars to scale. If each token had a 0.1% chance of breaking the format, a 200-token output would be
  valid 81.9% of the time, 500 tokens 60.6%, and 2,000 tokens 13.5%.
- Fills: Tree 22, (1 − p)^n.
- Numbers: `0.999**200 = 0.819`; `**500 = 0.606`; `**2000 = 0.135`. The rate is illustrative.

**P64** · after P63 · **25:50** · *Minus infinity becomes exactly zero, and the rest renormalise*
- Bars. Logits (8.2, −∞, 3.5, 0.4), and e^−∞ = 0, give cat 99.06%, dog 0, the 0.90% and banana 0.04%.
- Fills: Tree 22, −∞ → 0.
- Numbers: verified.

**P65** · after P64 · **26:05** · *The mask is over tokens, and a token can be several characters*
- Table: candidate tokens such as `{"`, `":`, `"},`, `1` and `name` are fed character by character
  through the automaton, each marked ✓ or ✗ in the state "just after {".
- Fills: Tree 22, tokens span characters. Recaps V01 Fig 6.
- Numbers: none. Label the strings illustrative unless they come from a real tokenizer.
- Fig 22 follows here, redrawn and restamped 26:12 (see §5).

**P66** · after Fig 22 · **26:31** · *A machine that tracks depth needs a state for every depth*
- A chain of states 0, 1, 2, 3 … with "[" moving right and "]" moving left. d + 1 states handle depth d
  and fail at d + 1, and JSON sets no limit.
- Fills: Tree 22, why a state machine cannot count.
- Numbers: none beyond d + 1.

**P67** · after P66 · **26:35** · *A stack remembers how deep you are*
- Small multiples of the stack after each bracket of `[[1],[2,[3]]]`: depth 1, 2, 1, 2, 3, 2, 1, 0.
  Empty at the end means accepted.
- Fills: Tree 22, the stack trace.
- Numbers: verified in Python.

**P68** · after Fig 24 (26:43) · **26:55** · *The index turns 128,256 checks into one lookup*
- Table with pointer: one row per automaton state, each holding its allowed-token list. Building it once
  costs 50 states × 128,256 = 6.4 M checks (the state count is illustrative). Each step then fetches
  one row.
- Fills: Tree 23, the index.
- Numbers: `50*128256 = 6,412,800`. **VERIFY** the vocabulary size 128,256 (Llama 3; V01 says "128,000").

**P69** · after P68 · **27:15** · *The mask is built while the GPU is still working*
- Lane chart: a GPU lane with a forward pass of 4.79 ms (8B) or 41.8 ms (70B), and a CPU lane where
  the mask takes at most 40 µs inside it, 0.84% or 0.10% of the step.
- Fills: Tree 23, the overlap. Recaps V03 Figs 72 and 95.
- Numbers: `40e-6/4.79e-3 = 0.84%`; `40e-6/41.8e-3 = 0.10%`.

**P70** · after P69 · **27:38** · *A mask can push the model off its favourite path*
- Bars. If the format forbids "cat", its 74.5% is redistributed: dog 97.22%, the 2.66%, banana 0.12%.
  The output parses, but it is not what the model wanted.
- Fills: Tree 22, steering.
- Numbers: `softmax(7.1, 3.5, 0.4)`, verified.

---

## 5. Problems in existing figures

### Factual and numeric

1. **Fig 4 caption: "two thirds of the capacity" is too low.** The waste is
   `1 − 604/2048 = 70.5%`, more than two thirds. "On a realistic mix of lengths" is an unverified
   editorial claim. *Fix:* "More than two thirds of the capacity, on this mix."
   - The "Work delivered" bar is 88 px with no track, so "under a third" cannot be seen
     (`88/300 = 0.293`). Draw the 300 px track.
   - Redraw the four bars as a four-lane chart with a "tokens per read" strip (4 → 3 → 2 → 1, mean
     1.18) so it pairs with P16.
2. **Fig 6: "a factor of 36.9" does not follow from the drawn rates.** `6.81/0.185 = 36.81`. The 36.9
   is the paper's figure, presumably from unrounded rates. *Fix:* "36.9 times, as reported", and
   **VERIFY** against Orca.
   - The caption's "now universally called continuous batching" overstates the video's "It is now
     usually called continuous batching." *Fix:* "usually".
3. **Fig 3's caption points at the wrong figures.** It says the property (weights shared by every
   request) "is what the next two figures are about". Fig 4 is about a batch draining; only Fig 5 takes
   up the property. *Fix:* "…which is what Fig 5 is about", or rephrase to survive renumbering.
4. **Fig 11's caption points at the wrong paragraph.** "Note the second paragraph: the two pools can run
   different parallelism strategies." The second paragraph is Splitwise's cost result. The parallelism
   point is the third ("Production pushed it further…"). *Fix:* rewrite the caption as a judgement and
   drop the paragraph pointer.
5. **Fig 14's caption overclaims.** "A tenfold discount on cached reads is a direct measurement of how
   much of prefill was redundant." A price is a business decision, not a measurement.
   *Fix:* "The discount is the provider's own estimate of what a hit saves."
   - The prose presents the 1.25× five-minute write premium as universal. The transcript attributes it
     to one provider ("Anthropic charges a premium to write the cache"). Name it.
6. **Fig 5's caption, "the batch cannot grow past a few tens", only holds at long context.** On one
   H100 with Llama 3 8B it is 223 requests at 2K and 55 at 8K (P10). *Fix:* add "at long contexts".
7. **Fig 11 and V06 Fig 19 give different decode deployments.** Fig 11's decode pool is "144-way". V06
   Fig 19 says DeepSeek V3's decode deployment is 320 GPUs. Both appear to come from DeepSeek documents
   of different dates (the V3 report against the 2025 inference-system overview). *Fix:* one sentence
   in Fig 11 or P33 naming both. **VERIFY**.
8. **Fig 19's caption, "The last few microseconds of a forward pass", is an unverified number.** The
   video only says "nearly free". *Fix:* "Nearly free next to the forward pass…"
9. **Fig 9's caption replaces a name with an unverifiable superlative.** "Enabled by default in the most
   widely used engine" stands for the transcript's "vLLM now enables chunked prefill by default."
   *Fix:* "vLLM now enables it by default."
10. **Fig 10's "about 1.13 GB" is binary gigabytes.** `2*64*9216*2*512 = 1.208e9 B = 1.125 GiB`. This
    is harmless; P29 shows it.

### Names removed, and the ASR corrections needed to restore them

11. **Every system, paper and model name in the video is anonymised.** Restore them with correct
    spellings:
    - Orca (OSDI 2022), FasterTransformer, GPT-3 175B (Fig 6)
    - vLLM (Figs 6, 8, 9, 17)
    - Sarathi and Sarathi-Serve, Mistral-7B on 1 A100, Yi-34B on 2 A100s, Falcon-180B (Fig 9)
    - DistServe, Splitwise, OPT-66B (Figs 10–11)
    - DeepSeek, Mooncake (Kimi), NVIDIA Dynamo, llm-d, SGLang on 96 H100s (Fig 11)
    - SGLang's RadixAttention (Fig 13)
    - Anthropic and OpenAI (Fig 14)
    - vLLM, SGLang, TensorRT-LLM, Hugging Face TGI, Dynamo, llm-d (Fig 15), with a one-line gloss of
      Kubernetes
    - Holtzman et al. 2020, GPT-2 (Fig 20)
    - Outlines and XGrammar (Figs 23–24)

    ASR forms in the raw SRT, so searching it will fail:

    | In the SRT | Correct |
    |---|---|
    | "VLLM" | vLLM |
    | "Sarathi serve" | Sarathi-Serve |
    | "E34B" (12:07) | Yi-34B |
    | "disserve", "DisServe" | DistServe |
    | "SplitWise" | Splitwise |
    | "MoonCake" | Mooncake |
    | "LLMD" | llm-d |
    | "S G Lang", "SG Lang" | SGLang |
    | "radix attention" | RadixAttention |
    | "X grammar" | XGrammar |
    | "outlines" | Outlines |
    | "Deep Seek" | DeepSeek |
    | "Constraint decoding" | constrained decoding |
    | "good put" | goodput |
    | "pre-filled pool" | prefill pool |
    | "both build a cached prompt read" | bill |
    | "some past P" (top-p) | "whose probabilities add up to at least P" |
    | "90 GB per second" | 90 Gb/s (Fig 10 already right) |

### Voice

12. **"Episode" and "video" creep into prose.** Fig 2's prose says "the single most important idea in
    this video", while Fig 1's caption says "the whole document". The Fig 1 title and Fig 26 caption
    say "this episode". *Fix:* "this document" throughout.
    - Fig 2's caption calls queue and batch "Two words that sound similar"; they do not. *Fix:* "Two
      words often used as if they meant the same thing."

### Neighbours that repeat each other; captions that point at prose

13. **Figs 19 and 20 (both stamped 22:37) overlap.**
    - Fig 19's caption and Fig 20's prose both say "where every user-facing quality knob lives".
    - Fig 19's "Picking the highest … bland … Picking at random … nonsense" pre-empts Fig 20's lower
      panel.
    - "Not one weight has changed" appears three times: Fig 19 prose, Fig 21 prose and Fig 21 caption.

    *Fix:* merge Fig 19 with Fig 20's top flow into one recap of V01 Figs 8–9, using V01's numbers
    (8.2, 7.1, 3.5, 0.4 → 74.5, 24.8, 0.68, 0.03%). Fig 20 keeps "Neither extreme works", restamped
    23:01. State the "no weights change" point once.
14. **Fig 23's lower panel duplicates Fig 22.** Both contrast the state machine with the pushdown
    automaton, and both say it "cannot remember how many brackets are still open". *Fix:* drop Fig 23's
    lower panel and let the redrawn Fig 22, P66 and P67 carry it.
15. **Fig 24's caption, "the last paragraph is why…", points at prose instead of judging.** *Fix:*
    rewrite it, and add the dropped 27:57 line: "The serving layer is the last place anything can be
    enforced before tokens reach a user or a tool."

### Idioms that fight their idea

16. **Fig 3: the two bars are the same length (300 px).** One is labelled "almost flat" and the other
    "grows with N", so the picture contradicts the words. *Fix:* small multiples at N = 1, 8 and 64,
    with the bytes bar constant and the operations bar growing ×N; or fold it into P4–P5.
17. **Fig 1: boxes and arrows carry a cost argument.** *Fix:* bars to scale, 41.8 ms of memory time
    against 0.142 ms of arithmetic. Restamp to 0:39.
18. **Fig 6: the drawing is an open three-box chain**, scheduler → "one token for each request" →
    "engine returns, batch rebuilt", for what is a loop. *Fix:* draw the loop, add an
    end-of-sequence-token exit (recap of V01 Fig 29), and gloss OSDI and FasterTransformer.
19. **Fig 7: two boxes, with the seven-row argument only in prose.** *Fix:* draw the layer as a stack
    (norm, QKV projection, attention, output projection, norm, MLP), with attention marked as the only
    cross-token step; P21 then carries the seven-row grid.
20. **Fig 8: not to scale.** The decode box is 90 px and the prefill 420 px, for 1 token against
    thousands. *Fix:* label it schematic or use time bars (4.79 against 66.5 ms, P22). Restore "in
    vLLM" for the multi-second stalls, and restamp to 10:11.
21. **Fig 9: the budget is schematic, with no numbers.** Six 16 px cells against a 380 px chunk.
    *Fix:* label it 512 = 32 + 480 (P24), and restamp to 10:57.
22. **Fig 11: 7.4× and 12.6× are drawn as equal 340 px bars, for two different kinds of gain** (more
    rate, and a tighter target). *Fix:* separate baseline/after pairs, or a table. Show Splitwise as
    throughput per dollar: `1.4/0.8 = 1.75×` against 2.35×.
23. **Fig 13: the tree is semantically wrong and its drawing is off.**
    - "turn 3" and "turn 4" hang as siblings under "conversation A". In a chat, turn 4's prompt
      contains turn 3, so turn 4 is a child of turn 3. Siblings are alternative continuations (two
      different follow-ups, or a regenerated answer).
    - The connector to "turn 4" ends at x = 260 while that box's centre is 290.
    - No token appears on any edge.

    *Fix:* redraw with P40–P41's tokens and restamp to 16:19.
24. **Fig 16: the "only the ones in time" bar is 190/340 = 56% of throughput, with no basis.** *Fix:*
    label it schematic or tie it to P32's 9 of 10. Add the cost-per-query line:
    `$2 / (1.5 req/s × 3600) = $0.00037`.
25. **Fig 17: two boxes.** Keep it as the header for P49–P50 and restore "vLLM evicts…".
    **Fig 18: three boxes and ten lines.** Cut the prose to a one-line introduction for P51–P54,
    restamp to 21:10, and restore the VTC (2024 fairness paper), Mooncake's early rejection and
    Dynamo's planner.
26. **Fig 19: bar length is the wrong idiom for logits**, which can be negative. The drawn widths
    (320, 180, 70, 8) also contradict V01's values for the same four tokens; to scale they would be 320,
    277, 137 and 16. *Fix:* use V01 Fig 9's table form, as in item 13.
27. **Fig 21: words only.** "Keep the smallest set past a probability mass" inherits the ASR "some past
    P". *Fix:* "keep the fewest top tokens whose probabilities add up to at least P", with the numbers
    moving to P58–P62.
28. **Fig 22: a linear flow, out of order.** It is drawn as start → saw a brace → reading a key → done,
    with no labelled transitions, no branching and no reject state. That is a flow, not a state
    machine, and it is out of video order.
    - *Fix:* redraw a small machine for `[0-9]{4}-[0-9]{2}`, with digit and dash edges and a reject
      sink, and trace "2025-1x" being refused at "x".
    - Move it after Fig 23 and P63–P65, and restamp to 26:12.
29. **Fig 26: no numbers.** *Fix:* add 41.8 ms → 23.9 tok/s for one user on 70B, against 1,531 tok/s
    from the same reads at batch 64 (recap of V01 Fig 130).
30. **Fig 12: glosses missing.** Add one-line glosses for "few-shot examples" and "retrieved document",
    and point to P36 for agents.

---

## 6. Size after the pass

**About 95 figures.** That is 26 existing, plus 70 new, minus 1 for merging Figs 19 and 20: 3.2 per
minute against 0.87 now. Five widgets add depth without adding to the count: the scheduler step-through,
the chunk-size and step-time slider, the page-table lookup, the context-length slider, and the sampler
playground. Afterwards, update V07's row in `atlases/index.html` (26 → 95) and the totals.

The three highest-value changes:

1. **Rebuild 4:34–6:40, the cache ceiling and paging (P7–P15).** This turns "a few tens" and "near zero
   waste" into arithmetic: 128 KiB per token, 55 requests that fit against the 295 the ridge needs, an
   intensity plateau near 64, and token 37 → slot 53. No atlas in the series works a page-table lookup
   with numbers yet.
2. **Draw scheduling as time (P16, P22–P27).** Lane charts on one step-time model show static against
   continuous (29.5% → 95.0% occupancy, 3.22×), the stall of at least 13.9× when a prompt joins,
   prefill riding free up to the ridge, and the chunk-size trade priced both ways.
3. **Make the sampler and constrained decoding arithmetic (P55–P70).** Temperature works on V01's own
   logits (74.5% → 90.0% at T = 0.5). Top-p keeps 2 tokens when the model is sure and 5 when it is not;
   −∞ becomes exactly 0; the stack traces depth 1, 2, 1, 2, 3, 2, 1, 0. Separately, restoring every
   name the video gives (item 11) is cheap and matters a great deal for a reader who wants to look any
   of it up.
