# V09 · The Whole Stack — depth review

Inputs read in full: `V09_outline.md`, `V09_transcript.txt`, the raw SRT (all 232 cues, timed), the atlas
HTML (every SVG element; figures 1, 3, 5, 7, 8 and 13 rendered and viewed), SKILL.md and design.md,
plus the V01–V08 outlines grepped figure by figure for every prerequisite. Checker run on a scratchpad
copy: 1 problem (Fig 13 label collision), as CLAUDE.md records. Every number below was computed in
Python; the scripts are `scratchpad/tools/verify_v09.py` and `scratchpad/tools/verify_examples.py`
(full path `/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/tools/`).

---

## 1. Snapshot

**15 figures in 6 parts**: The request (Fig 1–4), The wall, restated (5), Arrival and prefill (6–7),
The handoff (8–9), Decode (10–13), Closing (14–15). Roughly one figure per 36 seconds of video.

What it already does well, and should keep:

- **Fig 4's memory bar is drawn to scale.** The model's bar is 12 px of a 320 px rack (3.75%) for
  500 GB of 13.4 TB (3.73%). It is the one place where the picture alone makes the video's
  argument: the weights are a sliver and the cache is the tenant.
- **Both of the video's derivations are reproduced and land.** Fig 5: 10^16 / 8×10^12 = 1,250, and
  one byte gives 2 weights × 2 operations = 4. Fig 10: 60 billion operations / 15 GB = 4, against
  1,250. Fig 5's caption keeps the presenter's own caveat about the sparsity mode ("which this
  workload does not use").
- **Fig 12's caption is a model judgement caption**: "The guarantee is narrow: the tool call will
  parse. Whether it is the right call is a different question entirely." Fig 6's "The saving happens
  before any arithmetic is done at all" is another.
- **The voice is clean.** There is no "the video says" or "the instructor", and no ASR-mangled term
  was carried in (the transcript's "Flash attention 4" and "Mercury" are fine; see §5 for the two
  names the atlas *dropped*).

The structural problem is that the atlas is a faithful paraphrase. 12 of 15 drawings are
labelled boxes that restate the prose. The video is a tour of eight earlier episodes, yet no figure
points to where any stage was built, and the three things that need building here (RDMA, constrained
decoding on this request, diffusion models) each get a single figure of labelled boxes (Figs 9, 12, 15).

---

## 2. Coverage against the transcript

### Stretches covered thinly or skipped

| Video | What is said there | In the atlas |
|---|---|---|
| 0:20–0:29 | "the request occupies a slot somewhere in the rack" | "slot" appears in the prose of Fig 1 and Fig 13 but is never shown or defined |
| 0:38–0:46 | "NVIDIA describes the whole rack as a single massive GPU" | Fig 4 drops the attribution ("is described as"), and Fig 3's caption states it as fact ("they behave as a single machine"). The 130 TB/s is never broken down per GPU |
| **1:06–1:38** | The video's own map of the trace: "A gateway picks a machine that already holds part of the prompt. Prefill reads the remaining tokens in one pass… The key value cache crosses the network to a separate pool… decode chooses only from tokens that keep the tool call valid." | **Skipped.** There is no figure between 0:24 and 1:38 |
| 1:44–1:53 | "NVIDIA advertises twice that rate, counting a sparsity mode that skips zeroed weights" | Only in Fig 5's caption. What the mode is never appears |
| 2:18–2:28 | "the same byte has to serve roughly 300 tokens before the chip lets it go… which we covered in detail in episode 1" | One sentence. How one byte serves many tokens is not shown, and V01's 295 is never set beside the 1,250 |
| 2:48–3:25 | Which parts of the prompt are cached; prefill starts at the first unseen token | Prose in Fig 6. The drawing compares two policy boxes; there is no prefix, no lookup and no saving |
| 3:27–3:33 | "The machine that takes the request does nothing but prefill. Decode runs on a different set of GPUs." | Not drawn until Fig 8, and why the two are split is never given |
| 3:35–4:22 | Five mechanisms: FP4 blocks of 16 with scales applied by the multiply instruction; FlashAttention-4; tensor parallelism; hundreds of experts with 8 chosen; the all-to-all | **All in Fig 7**: three labels, half a sentence each for attention and tensor parallelism (FlashAttention-4 unnamed), and six expert boxes with two lit |
| 4:45–4:49 | "The cache has to reach the decode machines before generation can continue." | Not covered: the transfer is never placed on the timeline |
| 4:53–5:16 | Standard attention against latent: 1,100 bytes per layer, 61 layers, 70 KB per token, a few hundred MB | Second half of Fig 8. Its bars are unlabelled and not to scale, and what the "short vector" is never appears |
| 5:18–5:46 | RDMA; storing the cache at 8 or 4 bits | Fig 9 is two labelled boxes. Operating system, network card, copy and direct memory access are never built, and the transfer is never priced |
| 5:52–6:26 | Decode priced; +70 KB per token | Fig 10 has the arithmetic but never says what 312× means in time |
| 6:28–6:50 | "holds many sequences, each with several proposed tokens attached" | Fig 11 is two labelled boxes, with no arithmetic of positions per weight read |
| 6:53–7:14 | Constrained decoding: "After an opening brace, only the field names the format allows are still available" | Fig 12 is three boxes, with no example on this request |
| 7:14–7:42 | Time to first token, time per output token, the slot handed on | Fig 13 has a checker collision, and the transfer gap and the slot hand-over are not drawn |
| 7:50–8:16 | History; "about 2/3 of all AI compute" | Fig 14 is four boxes with no dates drawn, and the forecast caveat is gone |
| 8:18–8:23 | "At the same time, many totally different approaches are being tried." | Dropped |
| 8:23–8:56 | Diffusion LMs; "Mercury… independently measured at 1,100 tokens a second on H100s" | Fig 15 is one box and prose, with Mercury unnamed |

### Stamps that do not match where the video says it

Stamps are in order throughout, with none out of sequence. Five land inside the *previous* topic's
sentence:

| Fig | Stamp | What is being said at that stamp | Topic actually starts | Restamp |
|---|---|---|---|---|
| 3, 4 | 0:24 | "answer, the request occupies a slot" | rack at 0:29 ("headed for a rack of 72"); memory at 0:46 | 0:29 (Fig 4 → 0:46 if it keeps only memory) |
| **8** | **4:06** | "Each layer of the model holds hundreds of separate expert networks" (Fig 7's content) | "Prefill ends with a key value cache" 4:24 | **4:24** |
| 10 | 5:44 | the cache-quantization sentence (Fig 9's content) | "Decode writes the rest of the answer" 5:48 | 5:48 |
| **11** | **6:20** | "adds its own 70 KB to the cache" (Fig 10's content) | "Continuous batching puts this request" 6:28 | **6:28** |
| **15** | **8:13** | "Inference has grown to about 2/3" (Fig 14's content) | "At the same time…" 8:18; "Every technique that fights decode" 8:23 | **8:23** |

Smaller offsets: Fig 6 2:28→2:31 (gateway), Fig 7 3:31→3:35 ("Inside, the uncached tokens…"),
Fig 9 5:20→5:18, Fig 12 6:58→6:53 (its heading's sentence), Fig 13 7:22→7:17, Fig 14 7:47→7:50.
Fig 2 at 0:24 has no counterpart in the video at all; §5 folds it into the route map at 1:10.

---

## 3. Concept trees

```
T1  one request: a prompt in, a tool call out                   [PARTIAL Fig 1 — lists the parts, in the wrong order]
      token — the unit the model reads and writes               [TAUGHT IN V01 Fig 6, 86-87]
      the assembled prompt: shared text first, newest last       [TAUGHT IN V01 Fig 20, 23 — Fig 1 draws the question first]
        system prompt and tool definitions are context text      [TAUGHT IN V01 Fig 21, 24, 27]
      a tool call — text the serving software parses and runs   [MISSING here; TAUGHT IN V01 Fig 24]
        the JSON object: braces, field names, values             [MISSING]
      a slot — a seat in the running batch, cache held for it    [MISSING — used in Fig 1, 13; TAUGHT IN V07 Fig 4-6]
```
```
T2  72 GPUs that NVIDIA calls one GPU                           [PARTIAL Fig 3-4]
      rack, trays, GPUs                                         [PARTIAL Fig 3 — 36 boxes; real: 18 trays x 4 GPUs + 9 switch trays]
        18 x 4 = 72                                             floor
      a link and its bandwidth                                  [TAUGHT IN V01 Fig 74-75; V02 Fig 92-94]
      130 TB/s = 72 GPUs x 1.8 TB/s                             [MISSING; 1.8 TB/s TAUGHT IN V02 Fig 95, V05 Fig 8]
      own memory 8, fabric 1.8, network 0.05 TB/s per GPU       [MISSING]
        ratios                                                  floor
      "single massive GPU" is NVIDIA's description              [PARTIAL Fig 4 — attribution dropped]
      the fast domain against the building network              [TAUGHT IN V02 Fig 96-97; V05 Fig 8]
```
```
T3  what fills the memory                                       [COVERED Fig 4]
      4 bits = half a byte; 1e12 x 0.5 B = 500 GB = 3.7%       [COVERED Fig 4; TAUGHT IN V01 Fig 73, V04 Fig 4]
        percentages                                             floor
      the block scales add half a bit: 4.5 bits a weight        [MISSING; TAUGHT IN V04 Fig 58, 75-76]
      the KV cache: what it holds, why it is reused             [TAUGHT IN V01 Fig 34-35, 135-140]
      12.9 TB / 70 KB = 184 million tokens of conversation      [MISSING]
        division, unit prefixes                                 floor
```
```
T4  the route: gateway, prefill, transfer, decode, pick, user   [MISSING — the video's 1:10-1:38]
      the six stages named in the first episode                 [TAUGHT IN V01 Fig 60]
      which episode built each stage                            [MISSING — Fig 2 names effects, no techniques or episodes]
```
```
T5  1,250 operations per byte                                   [COVERED Fig 5]
      an operation; a count against a rate                      [TAUGHT IN V01 Fig 61, 63]
      10 quadrillion = 10^16                                    [TAUGHT IN V01 Fig 62 — Fig 5 writes "10e15", unexplained]
      the rate depends on number width                          [TAUGHT IN V02 Fig 83-85]
      ridge = peak / bandwidth; units leave ops per byte        [TAUGHT IN V01 Fig 66, 120, 126; V02 Fig 74]
        division                                                floor
      the sparsity mode behind the advertised 2x                [MISSING — caption only]
        2 of every 4                                            floor
    what one byte offers: 4                                     [COVERED Fig 5]
      multiply-accumulate counts as 2                           [TAUGHT IN V01 Fig 111]
      two 4-bit weights per byte                                [TAUGHT IN V01 Fig 116, INT4 row]
    "the same byte has to serve roughly 300 tokens"             [PARTIAL Fig 5 — stated, not shown]
      amortising one read over many tokens                      [TAUGHT IN V01 Fig 117-118; V07 Fig 3]
      the first episode's gap: 295 on H100 at 16 bits          [PARTIAL Fig 5, 10 — "same ratio" asserted, numbers absent]
```
```
T6  routing by what each machine holds                          [PARTIAL Fig 6 — says what, not how]
      a load balancer: rotation, least busy                     [PARTIAL Fig 6 — named only]
      a prefix hit must start at token 0                        [TAUGHT IN V01 Fig 44-46]
        each key and value depends on everything before it      [TAUGHT IN V01 Fig 35-40; V07 Fig 12]
      how the gateway knows who holds what                      [MISSING; TAUGHT IN V07 Fig 13-15 per machine]
      a finished request's cache is kept until evicted          [TAUGHT IN V07 Fig 13, 17]
      how much of prefill is skipped                            [MISSING]
        fraction of the prompt                                  floor
```
```
T7  prefill and decode on separate machines                     [PARTIAL Fig 8 — what moves, not why]
      the two phases on the roofline                            [TAUGHT IN V01 Fig 117, 128-129]
      mixing them stalls decode                                 [TAUGHT IN V07 Fig 8]
      separate pools, separate parallelism                      [TAUGHT IN V07 Fig 10-11]
      prefill emits token 1; token 2 waits for the cache        [PARTIAL Fig 8 — the wait is MISSING]
```
```
T8  weights stay 4 bits until the multiply                      [PARTIAL Fig 7 — three labels]
      FP4 (E2M1): fifteen values from -6 to 6                   [PARTIAL — layout TAUGHT IN V04 Fig 28; values MISSING]
      one scale per block of 16                                 [TAUGHT IN V04 Fig 34, 73-76]
        multiply, then round to the nearest tick                floor
      W4A16: expand to 16 bits, then multiply                   [TAUGHT IN V04 Fig 57]
      the scale applied inside the multiply instruction         [MISSING]
        distributive law: s·a + s·b = s·(a + b)                 floor
      the tensor core's multiply-accumulate                     [TAUGHT IN V02 Fig 78-79]
```
```
T9  FlashAttention-4                                            [PARTIAL Fig 7 — unnamed, half a sentence]
      attention: query, key, value, softmax                     [TAUGHT IN V01 Fig 92-94; V03 Fig 13-25]
      kernel, fusion, tiling, online softmax                    [TAUGHT IN V03 Fig 4, 33-43, 53-59]
      why Blackwell needed version 4                            [TAUGHT IN V03 Fig 77-81]
```
```
T10 each matrix multiply split across GPUs                      [PARTIAL Fig 7 — half a sentence]
      matrix multiply                                           [TAUGHT IN V01 Fig 84-85]
      column then row split; all-reduce adds the partials       [TAUGHT IN V05 Fig 6-7, 9]
        adding partial sums                                     floor
      two blocking exchanges a layer, 61 layers                 [MISSING here; TAUGHT IN V05 Fig 10 at 80 layers]
```
```
T11 hundreds of experts, eight per token                        [PARTIAL Fig 7 — 6 drawn, 2 lit]
      expert, router, top-k                                     [TAUGHT IN V06 Fig 9-13]
      held against active: about 30 of 1,000 billion            [MISSING here; TAUGHT IN V06 Fig 2, 11, 22]
      experts live on different GPUs                            [TAUGHT IN V05 Fig 15; V06 Fig 19]
      the all-to-all: dispatch and combine                      [PARTIAL Fig 7 — words only; TAUGHT IN V05 Fig 7, 16-17; V06 Fig 20-21]
```
```
T12 cache per token = bytes per layer x layers                  [PARTIAL Fig 8]
      standard: 2 x heads x head size x bytes                   [TAUGHT IN V03 Fig 88; V04 Fig 69; V01 Fig 138-140]
      latent: (512 + 64) numbers x 2 bytes = 1,152              [MISSING here; TAUGHT IN V03 Fig 90-92]
      x 61 layers = 70 KB; x a few thousand = a few hundred MB  [COVERED Fig 8]
        multiplication; kilo, mega                              floor
      standard against latent, to scale                         [MISSING — Fig 8's bars are 11:1, unlabelled]
```
```
T13 remote direct memory access                    (new here)   [PARTIAL Fig 9 — two labelled boxes]
      a server's parts: CPU, main memory, GPU memory, card       [MISSING; nearest V01 Fig 16, V02 Fig 21-23]
      the operating system: the program that owns the devices   [MISSING]
      a copy re-reads and re-writes every byte                  [MISSING]
        a count against a rate                                  floor (V01 Fig 63)
      direct memory access: a device moving bytes on its own    [MISSING]
      the ordinary route against card-to-card                   [PARTIAL Fig 9]
      transfer time = size / link rate                          [MISSING; network rate TAUGHT IN V05 Fig 8]
```
```
T14 storing the cache at 8 or 4 bits                            [PARTIAL Fig 9 — one sentence]
      quantization and scales                                   [TAUGHT IN V04 Fig 33-34]
      why the cache is harder than the weights                  [TAUGHT IN V04 Fig 70-71]
      70 → 35 → 17.6 KB a token; the transfer halves            [MISSING]
```
```
T15 decode priced                                               [COVERED Fig 10]
      30 billion active → 15 GB → 60 billion operations         [COVERED Fig 10; rule TAUGHT IN V01 Fig 111-114]
      in time: 125 µs of reading per 0.4 µs of arithmetic, per GB [MISSING]
        99.7% of the arithmetic idle                            floor
      +70 KB a token, so the read grows                         [PARTIAL Fig 10]
        linear growth                                           floor
      cache reads per step once there is a crowd                [MISSING; TAUGHT IN V08 Fig 15, V07 Fig 5]
```
```
T16 more tokens per weight read                                 [PARTIAL Fig 11]
      continuous batching                                       [TAUGHT IN V07 Fig 2-7]
      speculative decoding                                      [TAUGHT IN V08 Fig 2-9]
      positions per read = sequences x (proposals + 1)          [MISSING]
        multiplication                                          floor
      the two compete for the same idle arithmetic              [MISSING here; TAUGHT IN V08 Fig 4, 9, 13]
      in a mixture of experts, each expert gets only its share  [MISSING; TAUGHT IN V06 Fig 20, V07 Fig 11]
```
```
T17 only tokens that keep the tool call valid                   [PARTIAL Fig 12]
      logits, softmax, the sampler                              [TAUGHT IN V01 Fig 8-9; V07 Fig 19-21]
      the tool call's format                                    [MISSING]
      tokens are not characters                                 [MISSING]
      a grammar as a state machine plus a stack                 [TAUGHT IN V07 Fig 22-23]
      the mask: minus infinity → probability 0 → renormalise    [TAUGHT IN V07 Fig 23]
        fractions of a whole                                    floor
      worked on this request                                    [MISSING]
      cost, and what it guarantees                              [TAUGHT IN V07 Fig 24; COVERED Fig 12 caption]
```
```
T18 what the user sees                                          [COVERED Fig 13; TAUGHT IN V01 Fig 143-144]
      each token streamed as it is made                         [TAUGHT IN V01 Fig 57-58]
      where the transfer lands: before token 2                  [MISSING]
      the slot handed to a waiting request                      [PARTIAL Fig 13 — prose; TAUGHT IN V07 Fig 6]
```
```
T19 an old wall, a new stack                                    [PARTIAL Fig 14]
      compute outgrowing bandwidth, named in 1995               [TAUGHT IN V01 Fig 81-82; V02 Fig 67-70]
      the dates on one line: 1995, 2017, 2022-2025              [MISSING]
        a number line                                           floor
      inference about 2/3 of AI compute, a 2026 forecast        [PARTIAL Fig 14 — caveat dropped; TAUGHT IN V01 Fig 18]
```
```
T20 diffusion language models                      (new here)   [PARTIAL Fig 15 — prose only]
      autoregressive: one new position per pass                 [TAUGHT IN V01 Fig 7, 132]
      a masked position: a blank the model is trained to fill   [MISSING]
      passes that commit the most confident fills               [MISSING]
        probability as confidence                               [TAUGHT IN V08 Fig 5]
      guessing ahead without a drafter                          [TAUGHT IN V08 Fig 14, lookahead]
      many positions per weight read changes the arithmetic     [MISSING]
        multiplication, ratios                                  floor
      no causal triangle, so cache reuse and verification change [MISSING; TAUGHT IN V03 Fig 20, V07 Fig 12, V08 Fig 3]
      Mercury: 1,100 tokens/s on H100s, measured independently  [PARTIAL Fig 15 — name dropped]
```

---

## 4. Proposed new figures

32 figures, in video order. Where an entry redraws an existing figure instead of adding one, it is
in §5. "Illustrative" numbers are not from the video; each is computed and must be labelled as
illustrative in its figure. ★ marks an entry that would teach far better as an interactive widget.

### A · The request (0:04–0:24)

**N1 · after Fig 1 · 0:04 — "The tools are text in the prompt; the call they produce is text that software runs"**
- Idiom: a flow, because there is a real loop. The system prompt lists three tool definitions,
  each a name and its arguments (e.g. `run_tests(path)`, `read_file(path)`,
  `edit_file(path, patch)`; illustrative). The model writes
  `{"name": "edit_file", "arguments": {…}}`. The serving software parses it and runs the code, and the
  test output comes back as text in the next turn's prompt.
- Fills: T1 tool call (recap of V01 Fig 24), and sets up N26–N28, where the mask allows only these
  names.
- Numbers: none.

**N2 · 0:24 — "A slot is a seat in the running batch, with cache memory held for it"**
- Idiom: a grid. The decode engine's batch is drawn as 8 seats (schematic), each with a column of
  paged cache blocks beneath it and a queue of waiting requests alongside. This request takes seat
  3. When it finishes (7:34) the seat goes to the head of the queue, and Fig 13 calls back to this
  figure.
- Fills: T1 slot (recap of V07 Fig 4–6, V07 Fig 5 for why the cache caps the seats, V03 Fig 86 for
  paging).
- Numbers: none (schematic, so say so).

### B · The rack, and the route (0:34–1:38)

**N3 · after Fig 4 (Fig 3 redrawn, §5) · 0:34 — "130 terabytes a second is 72 links of 1.8, each under a quarter of a GPU's own memory speed"**
- Idiom: bars to scale on a log axis, per GPU: its own memory 8 TB/s, its NVLink 1.806 TB/s, its
  network link about 0.05 TB/s. A line underneath reads "72 × 1.806 = 130". Body: "single massive
  GPU" is how NVIDIA describes the rack (0:41). Memory on another GPU is 4.4× slower to reach than
  your own, and leaving the rack is 36× slower again. This is why the all-to-all (N16) and the
  handoff (N21) matter.
- Fills: T2 decomposition and vendor framing.
- Numbers: `130e12/72 = 1.806e12`; `8/1.806 = 4.43`; `1.806/0.05 = 36`; `8/0.05 = 160`;
  `72*8 = 576 TB/s` of rack memory bandwidth, against 130 TB/s of fabric (22.6%). The 1.8 TB/s per
  GPU is taught in V02 Fig 95 and V05 Fig 8. The 50 GB/s network figure comes from V05 Fig 8
  (VERIFY for this rack's network cards).

**N4 · 1:10 — "Every stop on this request's route was built in an earlier episode"** ★
- Idiom: a flow, since the stages really are sequential (the video lists them at 1:10–1:35). Six
  stops left to right, mirroring V01 Fig 60's six boxes: gateway → prefill pool → network → decode
  pool → constrained pick → user. Under each stop sits a stack of technique chips, each tagged with
  where it was built:
  - **gateway**: prefix match (V01 Fig 44–46), the shared preamble (V01 Fig 26), radix tree
    (V07 Fig 13), cache-aware routing (V07 Fig 14), orchestrator (V07 Fig 15)
  - **prefill**: NVFP4 (V04 Fig 73–76), tensor-core MMA (V02 Fig 78–79), FlashAttention-4
    (V03 Fig 77–81), tensor parallelism (V05 Fig 9–10), MoE (V06 Fig 9–13, 22), expert parallelism
    and the all-to-all (V05 Fig 15–17, V06 Fig 19–21), chunked prefill (V07 Fig 8–9)
  - **network**: disaggregation (V07 Fig 10–11), latent attention (V03 Fig 90–92, V04 Fig 72), cache
    quantization (V04 Fig 69–71), RDMA (here, N20 and Fig 9)
  - **decode**: paged cache (V03 Fig 83–87), continuous batching (V07 Fig 6–7), speculative decoding
    (V08 Fig 2–9, 11–14), long-context cache (V08 Fig 15–24), flash decoding and graph replay
    (V03 Fig 93–97)
  - **pick**: the sampler (V07 Fig 19–21), constrained decoding (V07 Fig 22–24)
  - **user**: TTFT and TPOT (V01 Fig 143–144), goodput and percentiles (V07 Fig 16, V08 Fig 25–26)
  - underneath everything: the ridge (V01 Fig 126, V02 Fig 74–75)
- Interactive: each chip links to the earlier atlas figure (the atlases need `id` anchors on
  figures). A small "you are here" strip of the same six stops can head Parts 3–6.
- Fills: T4. It replaces Fig 2 (§5).
- Numbers: none.

### C · The wall, restated (1:44–2:28)

**N5 · after Fig 5 · 1:44 — "The advertised rate doubles only for weights pruned to zero, two in every four"**
- Idiom: a grid of 4 × 8 weights in groups of four, with two greyed zeros per group that the
  hardware skips. A bar pair underneath shows 10 against 20 quadrillion. Body: counting the sparse
  rate would put the ridge at 2,500 and the gap at 625. This model's weights are not pruned that
  way, which keeps the presenter's caveat and shows what it means.
- Fills: T5 sparsity mode.
- Numbers: `2e16/8e12 = 2,500`; `2500/4 = 625`. VERIFY that Blackwell's sparsity mode is the 2:4
  structured pattern (NVIDIA; not taught anywhere in the series).

**N6 · 2:18 — "A byte reaches 1,250 only if 312 tokens use it before it is dropped"**
- Idiom: small multiples, an amortisation ladder in the style of V01 Fig 118. One byte holds two
  weights, read once and used by 1 token (4 operations), by 64 (256) and by 312 (1,248), with one dot
  per token and the 1,250 line marked. Body: the 312 can be other requests (batching), or several
  positions of one request (a prompt in prefill, drafted tokens).
- Fills: T5 amortising (recap of V01 Fig 117–118, V07 Fig 3).
- Numbers: `4*1 = 4`, `4*64 = 256`, `4*312 = 1,248`; `1250/4 = 312.5`.

**N7 · 2:25 — "A taller ridge and a richer byte leave the same gap: 295 then, 312 now"** ★
- Idiom: summary bars on a log axis, two pairs. H100 at 16 bits: ridge 295, decode 1. Blackwell
  at 4 bits: ridge 1,250, decode 4. The ridge rose 4.2× and so did the batch needed to reach it
  (74 → 312).
- Interactive variant: both rooflines on one log–log plot (V01 Fig 123's idiom), with a slider for
  "tokens sharing each read" moving the decode point. N24 reuses this widget.
- Fills: T5, the first episode's gap; it backs the "same ratio" claims in Fig 5 and Fig 10.
- Numbers: `989e12/3.35e12 = 295.2`; `1250/295.2 = 4.23`; `295/4 = 73.75` (V01 Fig 116's INT4 row);
  `312.5/73.75 = 4.24`.

### D · Arrival (2:51–3:27)

**N8 · after Fig 6 · 2:51 — "The gateway looks the prompt up in a table of which machine holds which prefix"**
- Idiom: a table with a pointer. Rows are machines A–D and the prefixes each reports holding
  (shared system prompt; this conversation to turn 6; another conversation…). The key is this
  request's tokens from position 0; the arrow goes to B, the longest match, and out to "send here".
  Body: a match must begin at token 0 (V01 Fig 44–46). This is V07 Fig 13's tree kept at fleet scale
  by the orchestration layer (V07 Fig 15).
- Fills: T6, how the gateway knows.
- Numbers: none (schematic). Leave out block hashing: it is implementation-specific and not in the
  video.

**N9 · 3:21 — "Prefill runs only on the part of the prompt no machine has seen"**
- Idiom: bars to scale. A 4,000-token prompt (illustrative) with 3,900 cached tokens shaded (system
  prompt, tools, earlier turns) and 100 new, so the work bar is 2.5% of the prompt. Body: the new
  tokens still attend over all 4,000 (V01 Fig 55). Optional sentence: the previous *answer* was
  written on a decode machine, so its keys and values either come back through a shared cache or are
  recomputed here (VERIFY; e.g. Mooncake-style pooled caches).
- Fills: T6, how much is skipped.
- Numbers: `100/4000 = 2.5%` (illustrative).

**N10 · 3:27 — "Prefill and decode are split because they sit on opposite sides of the ridge"**
- Idiom: summary bars on a log axis. A 4,000-token prefill gives 16,000 operations per byte, 12.8×
  above the 1,250 ridge; decode gives 4, 312× below it. Body: one machine has to compromise between
  the two (V07 Fig 8 and 10), and the transfer in Fig 8 is the price of splitting. With prefix caching
  the uncached tail may be short: 100 tokens gives 400, below the ridge (optional line).
- Fills: T7, why split.
- Numbers: `4*4000 = 16,000`; `16000/1250 = 12.8`; `4*100 = 400`.

### E · One pass, taken apart (3:39–4:14); Fig 7 then becomes the assembly at 4:22

**N11 · 3:39 — "Four bits give fifteen values; one scale per sixteen weights stretches them over the block"**
- Idiom: a number line with ticks at the E2M1 values 0, ±0.5, ±1, ±1.5, ±2, ±3, ±4, ±6. A block of 16
  real weights (largest 0.090) is divided by the scale 0.090/6 = 0.015 and lands among the ticks.
  Three worked weights: 0.012 → 0.80 → 1 → 0.015; −0.031 → −2.07 → −2 → −0.030; 0.071 → 4.73 → 4 →
  0.060, the largest error in the block (0.011) because of the wide gap between 4 and 6. Body:
  16 × 4 bits plus one 8-bit scale = 72 bits, or 4.5 bits a weight (V04 Fig 58).
- Fills: T8, FP4 values and block scale.
- Numbers: all 16 codes decoded in Python (1 sign, 2 exponent, 1 mantissa, bias 1); 15 distinct
  values; `(16*4+8)/16 = 4.5`. Recap of V04 Fig 28, 34, 73–76.

**N12 · 3:44 — "The scale factors out of the block's sum, so the multiply runs on the 4-bit codes"**
- Idiom: an equation built up, term by term: Σ(s_w·q_i)(s_x·r_i) = s_w·s_x·Σ q_i·r_i (the
  distributive law). Worked on four terms: q = (3, −1.5, 0.5, 2), r = (1, 2, −4, 0.5), so Σ q·r = −1;
  multiplied by 0.015 × 0.25 that gives −0.00375, which equals the direct sum. A contrast row shows
  V04 Fig 57's W4A16, which expands to 16 bits and then multiplies. Here there is one scale multiply
  per 16 products, applied to the block's partial sum before it joins the higher-precision total
  (V02 Fig 79).
- Fills: T8, scale inside the instruction, and the distributive law.
- Numbers: verified, `direct = factored = -0.00375`. VERIFY: the 10-quadrillion rate assumes 4-bit
  activations as well (W4A4, V04 Fig 56).

**N13 · 3:53 — "FlashAttention-4 is the same fused kernel, rebuilt around Blackwell's slow exponential"**
- Idiom: a chain of consequences, as a recap of V03. Scores written to HBM → tile them in on-chip
  memory (V03 Fig 37) → scalar work between matmuls (V03 Fig 65–66) → asynchronous hardware
  (V03 Fig 72–73) → tensor cores 2.25× faster with the exponential unit unchanged, so exponentials
  are computed by polynomial on the idle cores (V03 Fig 77–80).
- Fills: T9, and restores the name the video uses.
- Numbers: taught there: 2.25×; 16 against 8,192 operations per cycle; about 71% of peak on B200
  (V03 Fig 77, 79, 81).

**N14 · 3:58 — "Every layer stops twice for the GPUs to add up their partial results"**
- Idiom: a lane chart with 4 GPU lanes. Each computes its column slice, then an all-reduce bar
  where every lane waits; then the row slice, and a second all-reduce. "× 61 layers".
- Fills: T10 (recap of V05 Fig 6–7, 9–10).
- Numbers: `2*61 = 122` exchanges per pass, if attention and the feed-forward block are both split
  this way. VERIFY for this model: its feed-forward blocks are experts, which move by all-to-all
  instead.

**N15 · 4:06 — "Eight of several hundred: a token wakes about two percent of a layer's experts"**
- Idiom: a grid of 384 small cells grouped by GPU, with 8 lit and the shared expert marked
  differently. A side bar shows 30 of 1,000 billion parameters active.
- Fills: T11, held against active (recap of V06 Fig 2, 9–11, 15, 22).
- Numbers: `8/384 = 2.08%`; `30/1000 = 3%`. VERIFY the 384: the video says only "hundreds", and its
  numbers (a trillion total, ~30 B active, 61 layers, 8 routed, latent attention) match Kimi K2's
  published configuration (384 routed + 1 shared). Do not import V05 Fig 15's model: that one routes
  six per token (V05's transcript names DeepSeek V4 Pro).

**N16 · 4:14 — "Eight experts on eight GPUs: every GPU sends to every other, twice a layer"**
- Idiom: an 8 × 8 grid (send matrix), cell (i, j) = tokens GPU i sends to GPU j. Nearly every cell is
  filled and the diagonal stays local. Dispatch, then combine.
- Fills: T11, the all-to-all (recap of V05 Fig 7, 16–17; V06 Fig 20–21), using N3's 1.8 TB/s per GPU.
- Numbers: taught there (over 70% of a MoE layer spent shuffling across nodes, V05 Fig 17).

### F · The handoff (4:45–5:41)

**N17 · after Fig 8 · 4:45 — "Token two waits for the cache to land"**
- Idiom: a lane chart with four lanes: prefill machine, network, decode machine, user. Prefill ends,
  token 1 goes to the user, the cache crosses, and decode's token 2 starts only on arrival. It stays
  schematic here; N21 adds the times. Note that real systems can overlap the transfer with prefill,
  layer by layer (VERIFY before saying so).
- Fills: T7, the wait; and T18.
- Numbers: none here.

**N18 · 5:00 — "The 1,100 bytes are 512 numbers of summary and 64 of position, two bytes each"**
- Idiom: a byte layout to scale. 576 cells (512 + 64) beside the standard cache for the same layer,
  drawn as an area 57× larger (V03 Fig 91's shape, 128 heads × 128 for keys and values = 32,768
  numbers). Across 61 layers: 70 KB per token against 4.0 MB.
- Fills: T12, latent contents and the comparison to scale (recap of V03 Fig 88–92, V04 Fig 72).
- Numbers: `(512+64)*2 = 1,152` ("about 1,100" ✓); `1152*61 = 70,272`; `65536/1152 = 56.9`;
  `65536*61 = 4.00 MB`. VERIFY this model's dimensions. If it has 64 heads (Kimi-shaped), the ratio is
  `32768/1152 = 28.4`.

**N19 · 5:07 — "Seventy kilobytes a token: what one prompt makes, and what 12.9 terabytes holds"**
- Idiom: bars to scale. Prompts of 2,000, 4,000 and 5,000 tokens make 141, 281 and 351 MB. Then
  12.9 TB ÷ 70,272 B = 184 million tokens, about 46,000 conversations of 4,000 tokens, calling back
  to Fig 4's "the conversations are the tenant". It takes over Fig 8's last paragraph.
- Fills: T3 capacity, T12.
- Numbers: `n*70272` → 141 / 211 / 281 / 351 MB for 2k / 3k / 4k / 5k tokens; `12.9e12/70272 =
  183.6 million`; `/4000 = 45,893`. Illustrative: this ignores the split into pools and the
  activations.

**N20 · 5:18 — "A server's parts, and who normally moves bytes from one machine to the next"**
- Idiom: a floor plan of peers: CPU and its main memory, GPUs and their memory, the network card,
  all on one bus, with the operating system as the program that owns these devices and moves data
  when asked. Define direct memory access: a device reading or writing memory itself, without the CPU
  moving each byte.
- Fills: T13, the floor (none of it is taught in V01–V08).
- Numbers: none. Fig 9 then gets redrawn as the two routes (§5).

**N21 · after Fig 9 · 5:41 — "Latent attention and an 8-bit cache turn a third of a second into three milliseconds"**
- Idiom: bars to scale on a log axis, showing the time to send a 4,000-token cache at 50 GB/s:
  standard attention (V03's shape) 16.0 GB → 320 ms; latent at 16 bits 281 MB → 5.6 ms; at 8 bits
  2.8 ms; at 4 bits 1.4 ms. The caption names this as the gap N17 drew.
- Fills: T13 transfer time, T14 (recap of V04 Fig 69–71 for why the cache tolerates less squeezing
  than weights).
- Numbers: `4000*61*65536 = 15.99 GB`, `/50e9 = 320 ms`; `4000*70272 = 281 MB`, `/50e9 = 5.6 ms`;
  `/2 → 2.8 ms`; `/4 → 1.4 ms`. VERIFY the link rate: 50 GB/s is V05 Fig 8's figure, not this rack's
  measured card.

### G · Decode in time (6:12–6:18)

**N22 · after Fig 10 · 6:12 — "Each gigabyte takes 125 microseconds to read and 0.4 to compute"**
- Idiom: a lane chart to scale with a zoom inset. The memory lane is 125 µs per GB against an
  arithmetic sliver of 0.4 µs. For all 15 GB: 1.875 ms against 6 µs, as one GPU would see it. Spread
  over many GPUs both times shrink, but the ratio holds on each one. The arithmetic units sit idle
  99.7% of the time.
- Fills: T15, decode in time.
- Numbers: `1e9/8e12 = 125 µs`; `4e9/1e16 = 0.4 µs`; ratio 312.5; `15e9/8e12 = 1.875 ms`;
  `60e9/1e16 = 6 µs`; `1-4/1250 = 99.68%`.

**N23 · 6:18 — "Seventy kilobytes a token is nothing for one conversation and decisive for a crowd"**
- Idiom: bars to scale against the 15 GB weight read. Cache read per step: one sequence at 4,000
  tokens 0.28 GB (1.9%); one at 100,000 tokens 7.0 GB (47%); 64 sequences at 4,000 tokens 18.0 GB
  (120%).
- Fills: T15 (recap of V08 Fig 15 and V07 Fig 5: caches never amortise).
- Numbers: `4000*70272 = 0.28 GB`; `1e5*70272 = 7.03 GB`; `64*4000*70272 = 17.99 GB`.

### H · More tokens per read (6:45)

**N24 · after Fig 11 · 6:45 — "Positions per weight read are sequences times proposals"** ★
- Idiom: a grid where rows are sequences and columns are 1 + drafts, each cell one position computed
  from the same read. Small multiples: 1 × 1 → 4 operations per byte; 64 × 1 → 256; 64 × 5 → 1,280,
  already past 1,250. At that point the drafts stop riding free (V08 Fig 4, 9; V08 Fig 13's 6.5× at
  batch 1 against 1.38× at batch 64).
- Widget: N7's roofline with two sliders, batch and drafts, plus an acceptance input so tokens kept
  can be shown apart from positions computed (V08 Fig 8).
- Fills: T16.
- Numbers: `4*1*1 = 4`, `4*64*1 = 256`, `4*64*5 = 1,280`, `4*1*5 = 20`.

**N25 · 6:45 — "In a mixture of experts, each expert's read serves only its share of the batch"**
- Idiom: a heatmap of batch tokens × experts, each token lighting 8. The column totals come to about
  B × 8/E, so giving every expert 312 positions takes 10,000 positions per pass at 8 of 256, or
  15,000 at 8 of 384. Body: attention and the shared expert serve the whole batch, as the video says
  at 6:32, but the routed experts do not. That is why decode pools run at 144-way expert parallelism
  (V07 Fig 11; V06 Fig 20's "each expert's batch usually stays within 256 tokens").
- Fills: T16, the MoE share. This is a deepening that keeps the video's sentence true for the
  shared weights.
- Numbers: `312.5*256/8 = 10,000`; `312.5*384/8 = 15,000` (VERIFY 384, as in N15).

### I · Constrained decoding, worked on this request (6:58–7:11)

**N26 · before Fig 12's example · 6:58 — "The tool call is a JSON object, and the model writes it in tokens, not characters"**
- Idiom: the text itself, laid out with its parts labelled
  (`{"name": "edit_file", "arguments": {"path": "tests/test_parser.py", …}}`), and beneath it the
  same text cut into tokens such as `{"`, `name`, `":`, ` "`, `edit`, `_file` (illustrative; the real
  cut depends on the model's tokenizer).
- Fills: T17, format and tokens versus characters (recap of V01 Fig 6, 24).
- Numbers: none.

**N27 · 7:05 — "After the brace, the grammar leaves one field name standing"** ★ (with N28)
- Idiom: a state machine drawn as a table with a pointer. The state is "saw `{`" and points to the
  allowed set: tokens that begin `"name"`, plus whitespace. A vocabulary of about 160,000 shrinks to a
  handful. Probability bars before and after: "name" 0.60 → 0.923, whitespace 0.05 → 0.077,
  "tool" 0.25 and "function" 0.10 removed.
- Widget: step through the whole call token by token, showing the state and the allowed set at each
  step.
- Fills: T17, grammar on this request (recap of V07 Fig 22–23).
- Numbers: `0.60/0.65 = 0.923`, `0.05/0.65 = 0.077` (illustrative probabilities). Vocabulary about
  160 K: VERIFY (Kimi K2's model card).

**N28 · 7:11 — "The mask can delete the model's favourite; what is left is rescaled to sum to one"**
- Idiom: probability bars to scale at the tool-name position. Before: `pytest` 0.40 (not a listed
  tool), `run_tests` 0.30, `edit_file` 0.20, `read_file` 0.05, other 0.05. After masking to the names
  N1's system prompt listed: 0.545, 0.364, 0.091.
- Fills: T17 mask and renormalise (recap of V07 Fig 23–24, V01 Fig 9).
- Numbers: `0.30/0.55 = 0.545`, `0.20/0.55 = 0.364`, `0.05/0.55 = 0.091` (illustrative).

### J · Diffusion (8:32–8:49)

**N29 · after Fig 15 · 8:32 — "A masked position is a blank the model was trained to fill"**
- Idiom: a worked table. A short code line has three blanks; for each blank the model's top guess and
  its confidence are shown. The confident blanks are committed and the rest stay masked. Training is
  hiding random positions and learning to restore them.
- Fills: T20, mask and confidence (recap of V08 Fig 5). Contrast with V08 Fig 14: an autoregressive
  model can guess ahead, but its positions still settle one at a time.
- Numbers: illustrative confidences only.

**N30 · 8:35 — "One position per pass, or many: two ways to write an answer"** ★
- Idiom: small multiples of a grid, 12 positions across and passes down. The autoregressive version
  is a staircase of 12 passes, one new cell each; the diffusion version starts all masked and commits
  3 per pass, finishing in 4.
- Widget: step through the passes.
- Fills: T20 (recap of V01 Fig 7, 132).
- Numbers: `12/3 = 4` passes against 12 (illustrative).

**N31 · 8:37 — "Filling many positions per pass spends idle arithmetic to save weight reads"**
- Idiom: bars to scale for a 256-token answer (illustrative: a block of 256 filled in 32 passes).
  Weight reads: 32 against 256 (8× fewer). Positions computed: 8,192 against 256 (32× more). One pass
  over 256 positions gives 1,024 operations per byte, near the ridge of 1,250, against
  autoregressive decode's 4. It is the same trade speculation makes (V08 Fig 4), and decode had
  99.7% of its arithmetic to spare (N22).
- Fills: T20, why the arithmetic changes.
- Numbers: `256/32 = 8`; `32*256 = 8,192`; `4*256 = 1,024`. Mercury's block and pass counts are not
  public, so label these illustrative.

**N32 · 8:49 — "Without the causal triangle, the cache tricks stop being free"**
- Idiom: a grid of two attention masks, the causal triangle (V03 Fig 20) beside a full square.
  Listed alongside is what leaned on the triangle: reusing keys and values (V01 Fig 35–36), prefix
  caching ("That works because attention is causal", V07 Fig 12), and verifying drafts (V08 Fig 3).
  This is the concrete content of "the stack that serves it will look different".
- Fills: T20, a different problem.
- Numbers: none. VERIFY for Mercury specifically. Published masked-diffusion LMs such as LLaDA attend
  both ways; Inception's report says only "Transformer… trained to predict multiple tokens in
  parallel".

---

## 5. Problems in existing figures

**Fig 1 · draws the prompt in the wrong order.** The question comes first, and the file and the error
are listed as separate blocks. V01 Fig 23 teaches that the prompt is assembled "the most shared text
first… then the conversation, then your newest message", and Fig 6's logic depends on it: "Only the
newest question has never been through the model". *Fix:* draw one strip in token order: system
prompt and tools | conversation so far (including the failing file and the error from earlier turns) |
newest question, shaded "new". Say the widths are schematic, since they currently vary
(130–430 px) with no legend. Drop the second paragraph, which repeats the title. The caption
"Watching them arrive in order is the point of the episode" is about the document. Replace it with a
judgement, e.g. *"Nearly all of this prompt was here a minute ago. Only the last block is new, and
that decides where it goes next."*

**Fig 2 · lists effects without naming a technique or an episode.** It has five bars of arbitrary,
decreasing width (320→220 px, which reads as a ranking), "Five videos" when eight came before, no
episode numbers although the caption says "that video is the one to read first", and colours that
ignore the key ("fewer bits per weight" is `m`, compute and experts). The prose repeats V08 Fig 32
almost word for word, and the caption "Useful orientation before the trace" labels the figure as an
insertion. *Fix:* delete it; N4 does this job with names, episodes and figure numbers.

**Fig 3 · the rack is drawn wrongly, and it repeats Fig 4.** It shows 36 boxes labelled "trays of
GPUs". A GB200 NVL72 has 18 compute trays of 4 GPUs (72) and 9 NVLink switch trays (NVIDIA; see
sources). The caption also turns NVIDIA's description into fact ("wired so tightly they behave as a
single machine"), and its last paragraph duplicates Fig 4's first. *Fix:* draw a tall cabinet with 18
compute trays of 4 GPU squares and a band of 9 switch trays, every GPU wired to every switch. Move the
"one GPU" sentence to N3 with the attribution, and stamp 0:29.

**Fig 4 · loses the attribution and ignores the block scales.** "The whole rack is described as a
single massive GPU" drops the video's "NVIDIA describes" (0:41); restore it. Its 72-box grid repeats
Fig 3, so keep only the memory bars and stamp it 0:46. The 500 GB is "4 bits each", but Fig 7 then
says every block of 16 carries a scale. By V04 Fig 58's formula that is 0.5 + 1/16 = 0.5625 bytes a
weight, so 562.5 GB, 4.2% of the rack: "about 4%", not "under 4%". Keep the video's 500 GB and add one
line. The caption opens "A striking inversion", which is editorial; start it at "Four-bit weights…".

**Fig 5 · the bars mislead, and the notation is not taught.** The arithmetic bar (340 px) and the
memory bar (272 px) are in the ratio 10 : 8 across two different units. A reader sees two nearly
equal quantities, which is the opposite of the 1,250 : 1 point. *Fix:* drop the bars and write the
two rates as numbers. Show the gap as a grid of 1,250 cells (50 × 25) with 4 lit (0.32%), the same
on any scale. Replace "10e15 / 8e12" with 10 × 10^15 ÷ (8 × 10^12) = 1.25 × 10^3 (taught in
V01 Fig 62, 65–66). "Four operations" should read "four operations for each token", or "serve 300
tokens" does not follow. Also say the 10 quadrillion is a 4-bit rate (V02 Fig 84). "Newer hardware,
smaller numbers, same ratio" should carry the numbers (see N7).

**Fig 6 · title is a topic, and the idiom is a box pair.** "Cache-aware routing" should be a claim:
*"The gateway sends the request to whoever already holds its prefix"*. The two-box comparison is the
same idiom as Figs 9 and 11, and it draws neither the prefix nor the lookup. N8 and N9 supply both;
Fig 6 can then shrink to the policy contrast. Stamp 2:31.

**Fig 7 · the expert drawing contradicts its label, and FlashAttention-4 is unnamed.** It draws six
experts with two lit beside "hundreds… eight of them per token". It replaces the video's
"FlashAttention-4" with "the attention kernel written for this hardware". Five mechanisms share one
figure (§2). *Fix:* split it into N11–N16 and keep Fig 7 as the assembly, re-stamped 4:22. Title it
*"Four episodes' machinery runs inside one forward pass"*, with each stage drawn small and linked
back. If it stays a picture of experts, draw "hundreds" honestly (as in N15) or say "schematic: 2
of 6 shown for 8 of hundreds".

**Fig 8 · wrong stamp and bars not to scale.** The stamp 4:06 sits in the expert sentence; prefill
ends at 4:24. Its standard and latent bars are 340 and 30 px (11.3 : 1) with no number on the
standard bar. V03 Fig 91's case is 57 : 1 (65,536 against 1,152 bytes per layer), and a 64-head
model would be 28 : 1, so the 11 : 1 is not to scale for any stated model. The caption restates the
picture ("The prefill and decode split from the serving episode, with multi-head latent attention
deciding…"). *Fix:* keep only the split, add the why (N10 is in front of it), and move the sizes to
N18–N19 drawn to scale. New caption: *"Splitting the phases is only worth it if what crosses is
small. The next three figures are about making it small."*

**Fig 9 · two labelled boxes where a route belongs.** The idiom fights the idea: the point is a
route with fewer stops. *Fix:* small multiples of two routes on the same layout. The ordinary route
is GPU memory → main memory → OS network stack → card → cable → card → OS → main memory → GPU memory,
each arrow a copy handled by a CPU. The RDMA route is GPU memory → card → cable → card → GPU memory,
with the OS setting up permission once, ahead of time. Mark it schematic, since the copy count depends
on the software, and VERIFY that the card reads GPU memory directly. The caption counts "two
independent techniques" while the figure also names a third (the 8/4-bit cache): say three.

**Fig 10 · the caption contradicts Fig 11, and the comparison is overstated.** The caption says
"Every technique in the series has been applied and the ratio is still roughly 300 to 1". Batching and
speculation, the two techniques that change that ratio, come in the next figure. *Fix:*
*"Four-bit weights, latent attention and a rack-scale fabric are all in place, and a lone token still
gets 4 of the 1,250. Only the next figure's two techniques move that."* "This is the same number the
first episode arrived at" should read "nearly the same gap: 295 to 1 on the H100 at 16 bits, 312 to 1
here" (`989e12/3.35e12 = 295.2`). Replace the "60e9 / 15e9" notation. With the block scales, 15 GB is
16.9 GB, 3.6 operations per byte, 352× short; one line in the body keeps the conclusion and the
honesty. Stamp 5:48.

**Fig 11 · "the only two ways" is false, and the caption repeats V08.** "Between them they are the
only two ways to raise tokens per weight read" is contradicted by Fig 15's diffusion models, and
V08's own drafter-free methods (Medusa, lookahead) are variants of the second. *Fix:* "the two
directions: more requests behind a read, more positions per request". The caption "one scales with
the crowd, the other works even when there is no crowd" repeats V08 Fig 9 nearly word for word. Give
it a new job, the tension: *"They compete for the same idle arithmetic: at 64 sequences with 4 drafts
each, the read is already past the ridge"* (N24). Retitle with a claim; stamp 6:28.

**Fig 12 · topic title, and one overclaim.** "Constraining the output" becomes *"The engine deletes
every token that would break the tool call"*. "The last place anything can be enforced before tokens
reach a user or a tool" is too strong: the software that runs the tool can still parse and refuse
the call (V01 Fig 24). Say "the last point inside generation where the output can be steered". The
three-box flow is fine as an opener once N26–N28 carry the example. Stamp 6:53.

**Fig 13 · checker collision, and the timeline hides the transfer.** The checker flags
"gateway, then prefill producing that token" (x 60–318) overlapping "everything decode does fits in
this gap" (x 270). *Fix:* stack the two labels, or shorten the first to "gateway and prefill". The
tokens are evenly spaced right after the pause, but token 2 waits for the cache (4:45; N17), so the
first gap should be visibly longer and labelled as the transfer. Draw the slot hand-over at the end,
with a callback to N2. Say "schematic" in the caption, since the video gives no times. Stamp 7:17.

**Fig 14 · a history drawn as four boxes, without its caveat.** *Fix:* a timeline to scale, 1995 to
2026. Memory wall 1995 (V01 Fig 82); transformer 2017; continuous batching 2022 (V07 Fig 6); paged
attention 2023; prefill/decode split 2023–24; latent attention 2024; microscaled FP4 formats
2023–25 (VERIFY each publication year). The ~30-year span against the ~3-year cluster then becomes a
length. "Inference has grown to about two thirds of all AI compute in that time" is stated as fact.
It is Deloitte's forecast for 2026 (a third in 2023, half in 2025), and V01 Fig 18 keeps that caveat
("The projections are inherently uncertain"), so restore it. The caption "A good closing
perspective" is a reviewer's remark; replace it, e.g. *"The constraint is thirty years old; nearly
every answer to it is younger than three."*

**Fig 15 · wrong stamp, dropped name, overreaching scope.** Stamp 8:13 sits in Fig 14's sentence;
use 8:23. The video names the model ("Mercury, a commercial diffusion model"), and the atlas's "One
commercial diffusion model" makes it unsearchable. Restore *Mercury (Inception Labs)*, independently
measured at 1,109 tokens a second on H100 for Mercury Coder Mini (737 for Small), which is what the
video rounds to 1,100. The heading "Every technique in this series assumes one thing" and the caption
"The whole stack is a response to one property of autoregressive generation" overreach. The video
scopes it to "Every technique that fights decode" (8:23), and quantization, FlashAttention and
parallelism also serve prefill and capacity. Restore the scope, and the dropped lead-in "many totally
different approaches are being tried" (8:18). The caption opens "Worth ending on", which is editorial.
Once N29–N32 carry the mechanism, Fig 15 can be the claim plus the measured datum.

**Voice, collected:** captions that judge the document rather than the subject: Fig 1 ("the point
of the episode"), Fig 2 ("Useful orientation"), Fig 4 ("A striking inversion"), Fig 14 ("A good
closing perspective"), Fig 15 ("Worth ending on"). Titles that are topics, not claims: Figs 2, 4, 6,
7, 8, 9, 10, 11, 12.

**ASR:** nothing mangled was carried in. Two proper names were *dropped*: FlashAttention-4 (3:53,
captioned "Flash attention 4") and Mercury (8:40). Restoring both lets a reader search for them.

---

## 6. Size after the pass

**About 46 figures**: 15 − 1 (Fig 2 folded into N4) + 32 new. Figs 1, 3, 4, 5, 7, 8, 9, 13, 14 and 15
are redrawn in place.

The three highest-value changes:

1. **N4, the route map with source pointers (and Fig 2 removed).** It covers the video's skipped
   1:10–1:38 overview and turns the atlas into what the brief asks for: every stage of the request
   linked to the episode and figure that built it.
2. **Fig 7 split into N11–N16, with Fig 7 as the assembly.** The densest 47 seconds of the video
   (3:35–4:22) carry five mechanisms that currently share three labels and six boxes. Block-scaled
   FP4 inside the multiply (N11–N12) is taught nowhere in the series.
3. **The handoff, built and priced: N18, N20, N21 and Fig 9 redrawn.** It runs from what the 1,100
   bytes are, through what an OS, a network card and direct memory access are, to 320 ms → 5.6 ms →
   2.8 ms. RDMA is new to the series and is currently one box.

The diffusion build (N29–N32) and the worked mask on this request (N26–N28) come next.

---

### Sources checked for VERIFY items
- NVIDIA GB200 NVL72 spec (13.4 TB HBM3e, 576 TB/s, 130 TB/s NVLink, NVFP4 1,440 | 720 PFLOPS, 36 Grace | 72 Blackwell): https://www.nvidia.com/en-us/data-center/gb200-nvl72/
- Rack layout, 18 compute trays + 9 NVLink switch trays: https://naddod.com/blog/nvidia-gb200-interconnect-architecture-analysis-nvlink-infiniband-and-future-trends ; https://docs.nvidia.com/base-command-manager/product-manuals/nvidia-mission-control/nvlinkinfo
- Mercury, 1,109 / 737 tokens/s on H100 per Artificial Analysis: https://arxiv.org/abs/2506.17298
- Inference two thirds of AI compute in 2026 (forecast; a third in 2023, half in 2025): https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/compute-power-ai.html
- Kimi K2 configuration (1T total, 32B active, 61 layers, 64 heads, 384 experts, 8 + 1 shared, MLA, 160K vocabulary): https://build.nvidia.com/moonshotai/kimi-k2-instruct/modelcard
