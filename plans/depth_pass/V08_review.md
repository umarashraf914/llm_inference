# V08 · Speculative Decoding and Long Context: depth review

Atlas: `atlases/V08_Speculative_Decoding_and_Long_Context.html` (32 figures, video 29:58).
Read in full: brief, `SKILL.md`, `design.md`, `V08_outline.md`, `V08_transcript.txt`. I also checked caption
windows with `srt_tools.py --window` and rendered 10 figures (06, 08, 10, 12, 13, 15, 17, 25, 26, 29). Every number
below was recomputed in Python. The scripts are in
`/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/review/verify/`
(`v1_existing.py` … `v8_last.py`). Items that need a primary source are marked **VERIFY**.

---

## 1. Snapshot

**32 figures, 11 parts, 1.07 figures a minute** (V01 has 4.7, V02 4.9, V04 4.0).

| Part | Figs | Video span |
|---|---|---|
| The one direction left | 01 | 0:21–1:20 |
| How speculative decoding works | 02–04 | 1:20–3:19 |
| Why the output does not get worse | 05–07 | 3:19–5:47 |
| Where the speed-up comes from | 08–09 | 5:47–7:24 |
| Removing the drafter | 10–14 | 7:24–12:42 |
| The other thing being read | 15–16 | 12:42–14:46 |
| Attending to fewer tokens | 17–19 | 14:46–17:50 |
| Deleting tokens outright | 20–22 | 17:50–20:21 |
| Keeping tokens out entirely | 23–24 | 20:21–22:12 |
| Measuring it | 25–29 | 22:12–26:38 |
| The workload is changing | 30–32 | 26:38–29:58 |

Every topic in the video is touched at least once, but most get a single figure carrying several claims in prose.
Mechanisms (the acceptance rule, trees, Jacobi iteration, block selection, the cost formula) are mostly
described in words, not drawn or worked.

**What already works, and should be kept:**

1. **Fig 01's split organises the whole document.** "Get more work out of the bytes that already moved" against
   "Move fewer bytes per token" comes back in Fig 32 and in the colour key. Every new figure can be filed under one
   of the two boxes.
2. **Fig 05 builds probability at the floor**: a dart thrown at a bar, and the line "Identical distribution, not
   identical output." Its numbers (cat 0.50, dog 0.30, rest 0.20) are exactly what the three-token worked example
   in §4 needs. With the drafter at (0.2, 0.6, 0.2), the video's own "60% → 30% → 50%" case comes out exactly.
3. **Same-scale bars that carry the presenter's caveats**:
   - Fig 13: EAGLE-3's 6.5× against 1.38×, with the caption "Those last two bars are the same method". The bars are
     to scale: 320 px against 68 px, which is 4.71, the same as 6.5/1.38.
   - Fig 28: 19 against 100, to scale (340 px against 65 px).
   - Fig 29's caption: "vendor best cases … the ratio is the part that holds".
   - Fig 20: "That is not a four-million-token memory."
4. **Fig 25 uses the sorted-population idiom for a percentile**, the one `design.md` recommends. Its data needs
   fixing (§5, P1), but the choice of idiom is right.

---

## 2. Coverage against the transcript

### Stretches covered thinly or skipped

| Range | What the video says there | Atlas |
|---|---|---|
| 0:43–1:06 | "the arithmetic units sit nearly idle during the reads" | Fig 01 says it but gives no number (99.7% idle; V01 Fig 116/126 has the ridge) |
| 1:27–2:31 | Drafter writes its 5 guesses one pass at a time, each fed back in; the target makes "its own distribution over what the next token should be" at every position | Fig 02 states it. Nothing shows the sequential drafting or the distribution at every position |
| 2:51–3:07 | Keep guesses up to the first disagreement, discard the rest | Fig 03 says *what*, never *why*: later guesses were conditioned on the rejected token. No worked example |
| ≈3:50 | "It works through the drafted tokens one at a time." | **Skipped.** The left-to-right accept/reject walk is never shown |
| 3:58–5:01 | min(1, p/q); the residual (p − q)+; "That leftover distribution has weight only where the target wanted a token more than the drafter did … Put them together and the target's distribution is back" | Figs 06–07 state the rule. The adding-back is three boxes with no numbers. **Never worked**, though the video invites it with 60%/30% |
| 6:27–6:43 | Acceptance length; speed-up follows it | Fig 08 gives no α, no expected-value derivation, and is off by one (§5, P9) |
| 6:43–7:13 | Ceiling: verification is free only while compute idles | Fig 09 is two schematic bars. The roofline (V01) is never used to say *how many* positions fit |
| 7:51–9:41 | Medusa: heads, top candidates → tree, ancestors-only mask, Medusa-1 2.2× (frozen backbone) vs Medusa-2 2.3–3.6×, typical acceptance; 9:32 "The heads still guess several positions ahead from a single snapshot of the model state taken before any of these guesses were made." | Fig 12's prose holds six claims. Mask, typical acceptance and "frozen" are only words. **The 9:32 bridge to EAGLE is skipped** |
| 9:41–11:31 (2:01 gap) | EAGLE-1 "internal vector at its second to top layer, it turns that vector into a token afterwards"; vectors smooth; "Eagle one arranges its guesses into a tree the same way Medusa does"; EAGLE-2 dynamic tree +20–40%; EAGLE-3 multi-layer fusion, scaling ceiling removed; 6.5× vs 1.38× | **One figure (13)**: three boxes and three paragraphs. "Second to top layer" and "turns it into a token" are dropped |
| 11:31–12:39 | Lookahead: guess several positions, refine together; why that alone barely helps; "a guess in the wrong position is not the same as a wrong guess"; pool keyed by first token; MT-Bench 1.8× | Fig 14: three boxes. Jacobi iteration and the pool are never drawn. MT-Bench is unnamed (ASR "empty bench") |
| 13:16–13:36 | 320 KB per token; ~40 GB at 128k; four requests > weights; whole cache read every step | Fig 15 covers it, but 320 KB is not derived (V01 Fig 138–140 does derive it) and the per-step time cost is not computed |
| 13:57–14:40 | Ring attention, "which we covered in episode 5" | Fig 16 has it in prose only, with no pointer back to V05 Fig 19–22 |
| 14:46–15:01 | "Most of the attention weight lands on a handful of tokens. computing every pair anyway spends nearly all of the work on pairs that barely matter." | **Not drawn.** It appears only in the part subtitle |
| 15:01–15:54 | "Mistral 7B sets that window at 4,096"; "after 32 layers that reaches about 130,000 tokens **in theory**"; rolling overwrite | Fig 17: Mistral 7B and "in theory" are both dropped; the ring buffer is not drawn |
| 15:58–17:09 | NSA: "three branches at once, each with its own keys and values", coarse block summaries, selection, sliding, gate; DeepSeek Sparse Attention in V3.2-Exp picks single tokens; price cut | Fig 18: one figure, no names, nothing on how much each branch reads |
| 17:11–17:50 | MoBA routes queries to blocks; "the mixture of experts idea from episode 6"; Kimi | Fig 19 covers it. The "learned gate" wording is inaccurate (§5, P4); no names or back-reference |
| 18:04–18:33 | Softmax must sum to one; leftover dumped on the first tokens | Fig 20 states it; no worked softmax |
| 18:58–19:42 | H2O by attention received; SnapKV compresses the prompt; backward-looking failure; "Episode 4 covered that" | Fig 21: prose only, no names, no back-reference |
| 20:44–21:14 | "A 2020 paper introduced this using a dense vector index of Wikipedia with a trained retriever in front of it." | Fig 23 drops the method. "Vector of what it says" and "nearest" are never built |
| 22:17–22:30 | TTFT = queue + prefill, TPOT = decode, "covered … in episode 1" | Only a sentence at the end of Fig 26 |
| 22:50–23:00 | "Sizing the fleet works the same way. A fleet sized for the mean fails at the peaks … So you build against the load at the 99th percentile." | **Skipped**, and conflated with latency in Fig 26's prose (§5, P15) |
| 23:06–23:45 | "Nvidia's own definition" of utilisation; tokens/s, batchfulness, queue wait | Fig 27 drops the attribution; "Queue weight" is likely ASR (§5, P19) |
| 24:23–26:38 (2:05 gap) | Cost formula; NVIDIA Llama 3.3 70B on one H200 at 51 tok/s; Perplexity Llama 2 70B on two H100s, 128 concurrent, 767 tok/s per GPU; "different machines and different prompt lengths"; pay 2–3× vs get >10×; goodput per dollar | **One figure (29)**: sources dropped, heading wrong (§5, P2), formula not built |
| 26:39–28:05 (1:38 gap) | Thinking tokens are decode; RL rollouts; RhymeRL "91% … for a math model. For a code model, it was 84%", >95% at 32k; "Their explanation is the one this series started with" | **One figure (30)**: 84% and the two models are dropped, so "both pass 95%" dangles |
| 28:26–29:19 | Stanford AI Index, GPT-3.5-level MMLU score, $20 → $0.07; 8B model; A100 → Blackwell | Fig 31: nothing named, and the caption contradicts the body (§5, P3) |

### Stamps that do not match the video

| Fig | Stamp | Where the video actually is | Fix |
|---|---|---|---|
| 04 | 2:53 | "It does mean that we have five times the arithmetic" is at **3:09**. At 2:53 the video is still on Fig 03 ("It keeps the guesses it agrees with") | 3:09 |
| 06 | 3:19 | Shares 3:19 with Fig 05. The naive rule starts at **3:35**, and "The rule in the original paper" is at 3:47 | 3:35, or 3:47 once C1 takes over the naive rule |
| 11 | 7:48 | The tree enters at **8:26** ("Medusa takes the top few candidates from each head and combines them into a tree"). Fig 11 currently comes *before* the heads (Fig 12), the reverse of the video's order | 8:26, placed after Fig 12's heads |
| 13 | 9:26 | At 9:26 the video is still on Medusa ("no longer guaranteed to match"). "Eagle is a family" is at **9:41** | 9:41 |
| 25 / 26 | 22:14 | 22:14 is still about retrieval ("meeting anyone's deadline"). Percentiles start at **22:33** ("We watch the tail, the 99th percentile") | 22:33 / 22:36 |
| 30 | 26:24 | 26:24 is goodput, which belongs to Fig 29. "The workload itself is changing" is at **26:39** | 26:39 |
| **32** | **28:02** | **Goes backwards** (Fig 31 is 28:26). The summary list is at 28:05, but Fig 32's prose and caption are the closing at **29:21** ("Every technique in these eight episodes …") and 29:40 (hand-off) | **29:21.** Putting it last looks deliberate, as a closing figure. Only the stamp is wrong |

The other stamps fall within about 10 s of the content. The three gaps the coordinator noted are real, and the §4
proposals fill them:

- 24:19 → 26:24: cost and goodput, one figure.
- 9:26 → 11:27: EAGLE, one figure.
- 26:24 → 28:02: reasoning and RL, one figure. After restamping, the stretch from 26:39 to 28:26 still has a single
  figure.

---

## 3. Concept trees

Markers: `[COVERED Fig N]`, `[PARTIAL Fig N — …]`, `[MISSING]`, `[TAUGHT IN V0x Fig …]`, `floor`.
Earlier-atlas references were checked in `V01_outline.md` … `V07_outline.md`.

```
1. Decode reads every weight for every token                       [COVERED Fig 01]
  weights = 70e9 x 2 bytes = 140 GB                                  [TAUGHT IN V01 Fig 73, 105]
    bytes, powers of ten                                             [TAUGHT IN V01 Fig 62, 73]
  bandwidth: 140 GB / 3.35 TB/s = 41.8 ms a token                     [TAUGHT IN V01 Fig 74-77; number MISSING in V08]
  arithmetic intensity 1 FLOP/byte at batch 1                         [TAUGHT IN V01 Fig 116, 120]
  ridge 295 FLOP/byte; compute busy <= 1/295 = 0.34%                  [TAUGHT IN V01 Fig 126; V02 Fig 74-75; MISSING in V08]
  batching amortises one read over N requests                        [TAUGHT IN V07 Fig 02-03; V01 Fig 118]
  one request: nobody to share with                                  [COVERED Fig 01; TAUGHT IN V07 Fig 26]

2. A speculative step: draft cheaply, verify in one pass             [COVERED Fig 02]
  one forward pass reads the weights once, however many positions    [COVERED Fig 02]
  drafter ~100x smaller: 1.4 GB a pass, 7 GB for five                 [COVERED Fig 02]
    drafting is sequential: each guess fed back in                   [PARTIAL Fig 02 — said, not drawn]
  the target outputs a next-token distribution at every position     [PARTIAL Fig 02 — said, not drawn]
    logits -> softmax -> distribution                                [TAUGHT IN V01 Fig 08-09; V07 Fig 19]
    output at position i is the prediction for position i+1          [MISSING]
  causal mask makes parallel checking honest                         [COVERED Fig 03; TAUGHT IN V01 Fig 132, V03 Fig 20]
  keep up to the first disagreement                                  [PARTIAL Fig 03 — what, not why]
    later guesses were conditioned on the rejected token             [MISSING]
  all five accepted -> sixth token free                              [COVERED Fig 03]
  extra positions cost arithmetic, not time                          [PARTIAL Fig 04 — "assumed"; 0.85 ms vs 41.8 ms MISSING]

3. Probability and sampling                                          [COVERED Fig 05]
  shares of one whole                                                floor (fractions, basic probability)
  sampling: dart on the bar                                          [COVERED Fig 05; TAUGHT IN V01 Fig 10]
  "same distribution" = same proportions over many runs              [COVERED Fig 05]
  the sampler reshapes p before the draw (temperature, top-p)        [TAUGHT IN V07 Fig 21; link MISSING in V08]
  greedy decoding = all probability on one token                     [MISSING]

4. The acceptance rule keeps the output exact                        [PARTIAL Fig 06-07 — stated, never worked]
  naive rule (keep confident guesses) = sampling from q              [PARTIAL Fig 06 — asserted, not shown]
  notation: p = target, q = drafter                                  [PARTIAL Fig 06 — "pt / pd" undefined]
  walk the drafts left to right, stop at first rejection             [MISSING]
  accept with min(1, p/q)                                            [PARTIAL Fig 06 — one example, 60%/30%]
    ratio, capped at 1                                               floor
  P(proposed and accepted) = q x min(1, p/q) = min(p, q)             [MISSING]
  acceptance rate alpha = sum of min(p, q) = 0.7 in the example      [MISSING]
  residual max(0, p - q), renormalised; its mass = 1 - alpha         [PARTIAL Fig 06 — said, not computed]
  min(p,q) + (1 - alpha) x residual = p, worked with three tokens    [MISSING — Fig 07 is three boxes]
  correctness needs both halves (acceptance AND residual)            [MISSING — Fig 06 caption says otherwise]
  drafter quality changes alpha only, never the output               [PARTIAL Fig 07 — claim only]
  measured: T5-XXL 2-3x; DeepMind, Chinchilla 70B 2-2.5x             [COVERED Fig 07 — names dropped]

5. Expected tokens per pass and the speed-up                         [PARTIAL Fig 08]
  acceptance rate alpha, per guess                                   [MISSING]
  first k all accepted: alpha^k                                      [MISSING]
    independent events multiply                                      floor (basic probability, powers)
  E[tokens] = 1 + alpha + ... + alpha^gamma                          [MISSING]
    the +1: replacement or bonus token                               [PARTIAL Fig 03, 06 — never added up]
    geometric sum (1 - alpha^(g+1)) / (1 - alpha)                    [MISSING]
      multiply-by-alpha-and-subtract                                 floor (algebra, powers)
  ceiling 1 / (1 - alpha): diminishing returns of longer drafts      [MISSING]
  step cost 1 + gamma c, c = 1.4/140 = 0.01                          [PARTIAL Fig 08 — 147 GB]
  speed-up = E / (1 + gamma c): 3 / 1.05 = 2.86                      [COVERED Fig 08]

6. The ceiling: verification is free only while compute idles        [PARTIAL Fig 09 — schematic]
  roofline, ridge                                                    [TAUGHT IN V01 Fig 119-126; V02 Fig 73-77]
  positions per pass x batch against 295                             [MISSING]
  batch 64 x 6 positions = 384 > 295: 54.4 ms compute vs 41.8 read   [MISSING]
  EAGLE-3 6.5x at batch 1, 1.38x at batch 64                         [COVERED Fig 13]

7. Medusa: heads instead of a drafter                                [PARTIAL Fig 12]
  why a separate drafter hurts (memory, retraining, vocab, drift)    [COVERED Fig 10 — one label truncated]
    shared vocabulary: different tokenisers cut text differently     [PARTIAL Fig 10; tokens TAUGHT IN V01 Fig 06, 87]
  what a decoding head is: hidden vector x matrix -> score per token [TAUGHT IN V01 Fig 99, 103; "hidden state" never named]
  heads 2..5 ahead read one hidden state                             [COVERED Fig 12]
  independent heads -> a chain breaks early                          [COVERED Fig 12]
  top candidates multiply into a tree                                [PARTIAL Fig 11 — what a tree is; growth MISSING]
  ancestors-only tree mask                                           [PARTIAL Fig 12 — one sentence; grid MISSING]
    causal mask as a grid                                            [TAUGHT IN V03 Fig 20]
  why a tree reaches further than a chain                            [MISSING — Fig 11 caption asserts it]
  frozen backbone (2.2x) vs trained together (2.3-3.6x)              [PARTIAL Fig 12 — "frozen" undefined]
    what training changes                                            [TAUGHT IN V06 Fig 04]
  typical acceptance: threshold min(eps, delta e^-H)                 [PARTIAL Fig 12 — words only]
    entropy as spread of a distribution                              [MISSING] (floor: logs)
  exactness given up                                                 [COVERED Fig 12 caption]

8. EAGLE: draft the vector, not the token                            [PARTIAL Fig 13]
  Medusa's snapshot problem (9:32)                                   [MISSING]
  the vector entering the output layer ("second to top layer")       [PARTIAL Fig 13 — "internal vector"]
    residual stream, 8,192 wide                                      [TAUGHT IN V01 Fig 96, 99]
    output layer turns it into a token                               [TAUGHT IN V01 Fig 103]
  drafter feeds its predicted vector back in                         [MISSING]
  vectors drift smoothly, tokens jump                                [PARTIAL Fig 13 — asserted]
  exact (uses the rejection rule)                                    [COVERED Fig 13]
  EAGLE-1 uses Medusa's kind of tree                                 [MISSING]
  EAGLE-2: confidence ~ acceptance; path value = product             [PARTIAL Fig 13 — described]
  EAGLE-3: multi-layer fusion, tokens again, scaling ceiling removed [PARTIAL Fig 13]

9. Lookahead decoding                                                [PARTIAL Fig 14]
  Jacobi iteration: guess all positions, refine all                  [PARTIAL Fig 14 — boxes]
  only the leftmost unsettled position is sure to settle             [PARTIAL Fig 14 — words]
  wrong position != wrong guess                                      [COVERED Fig 14]
  n-gram pool keyed by first token                                   [PARTIAL Fig 14]
  verify fragments in the same pass                                  [PARTIAL Fig 14]
  what a benchmark is (MT-Bench)                                     [MISSING — never defined in V01-V08]

10. The KV cache is the other thing read every step                  [COVERED Fig 15]
  K and V per token, why cache them                                  [TAUGHT IN V01 Fig 131-137; V03 Fig 15]
  320 KB = 2 x 80 x 8 x 128 x 2 bytes                                [TAUGHT IN V01 Fig 138-140; V03 Fig 82, 88]
  128k tokens -> 42.9 GB (40.0 GiB); four exceed the weights         [COVERED Fig 15 — "42 GB", see P17]
  per-step bytes = weights + B x L x 320 KB; time per token rises    [PARTIAL Fig 15 — no curve, no ms]
  FlashAttention cut traffic, not size                               [COVERED Fig 15 caption; TAUGHT IN V03 Fig 26-43]

11. Ring attention: keep everything, spread it                       [COVERED Fig 16]
  sequence parallelism, the ring, overlap                            [TAUGHT IN V05 Fig 19-22]

12. A trained model ignores most tokens                              [MISSING]
  softmax row: weights sum to 1                                      [TAUGHT IN V03 Fig 23; V01 Fig 09]
  most weight on a handful of tokens                                 [MISSING]
  n^2 pairs: 1.7e10 per head per layer at 128k                       [TAUGHT IN V03 Fig 26-27 (shape); number MISSING]

13. Sliding window attention                                         [COVERED Fig 17]
  window W = 4,096 (Mistral 7B)                                      [PARTIAL Fig 17 — model unnamed]
  what a layer computes from the layer below                         [TAUGHT IN V01 Fig 91, 96]
  reach = W x layers = 131,072 "in theory"                           [PARTIAL Fig 17 — bars; caveat dropped]
  rolling buffer: slot = position mod W                              [PARTIAL Fig 17 — prose]
    remainders                                                       floor
  cache capped at 128 KiB x 4,096 = 512 MiB                          [MISSING]

14. Native sparse attention (and DSA)                                [PARTIAL Fig 18]
  three branches, each with its own keys and values                  [PARTIAL Fig 18 — "own K/V" dropped]
  compression: blocks of 32, stride 16, one summary each             [PARTIAL Fig 18]
  selection: 16 blocks of 64 at full detail                          [PARTIAL Fig 18]
  window of 512                                                      [PARTIAL Fig 18]
  keys read per query at 64k: ~5,631 = 8.6%                          [MISSING]
  gate: one weight in (0,1) per branch, weighted sum                 [PARTIAL Fig 18]
    weighted average                                                 [TAUGHT IN V01 Fig 93]
  trained in pretraining, not bolted on                              [COVERED Fig 18]
  DSA (V3.2-Exp): single tokens, top 2,048                           [PARTIAL Fig 18 — unnamed, no k]

15. MoBA: route queries to blocks                                    [PARTIAL Fig 19]
  top-k selection, router                                            [TAUGHT IN V06 Fig 09, 13]
  score = query . mean key of the block                              [MISSING — "learned gate" is inaccurate]
    dot product                                                      [TAUGHT IN V03 Fig 14]
  fall back to full attention                                        [COVERED Fig 19]

16. Attention sinks (StreamingLLM)                                   [COVERED Fig 20]
  softmax has no "none of the above"                                 [PARTIAL Fig 20 — stated, not worked]
  leftover lands on the first tokens                                 [COVERED Fig 20]
  why the sinks must be kept (evicting moves 0.8 of the weight)      [MISSING]
  4M-token stream is not a 4M-token memory                           [COVERED Fig 20]

17. Evicting by attention received (H2O, SnapKV)                     [PARTIAL Fig 21]
  accumulated attention as an importance score                       [PARTIAL Fig 21]
  keep ~20% heavy hitters + recent                                   [COVERED Fig 21]
  SnapKV: compress the prompt's cache before generation              [PARTIAL Fig 21 — unnamed, mechanism missing]
  backward-looking failure                                           [PARTIAL Fig 21 — claim only]
  quantize instead                                                   [COVERED Fig 21; TAUGHT IN V04 Fig 69-72]

18. What sparsity costs in accuracy (The Sparse Frontier)            [PARTIAL Fig 22]
  fraction discarded f <-> compression 1/(1-f): 95% = 20x, 80% = 5x  [MISSING — bars not to scale]
  task dependence; fluent wrong answers                              [COVERED Fig 22]

19. Retrieval-augmented generation                                   [PARTIAL Fig 23-24]
  chunks                                                             [COVERED Fig 23]
  a chunk as a vector of what it says                                [PARTIAL Fig 23 — named only]
    vectors                                                          [TAUGHT IN V01 Fig 84, 86]
  nearest = highest cosine                                           [MISSING]
    dot product; length by Pythagoras                                [TAUGHT IN V03 Fig 14]; floor
  prompt stays ~2,550 tokens (0.84 GB) whatever the corpus           [PARTIAL Fig 23 — claim, no numbers]
  retriever gatekeeps; second system                                 [COVERED Fig 24]
  prefix caching breaks where the chunks start                       [PARTIAL Fig 24 — prose]
    prefix-match rule                                                [TAUGHT IN V01 Fig 44-46; V07 Fig 12-14]

20. Latency metrics and percentiles                                  [PARTIAL Fig 25-26]
  TTFT = queue wait + prefill; TPOT = decode                         [PARTIAL Fig 26; TAUGHT IN V01 Fig 143 (no queue term)]
    queue                                                            [TAUGHT IN V07 Fig 02]
  percentile = position in the sorted list                           [COVERED Fig 25]
  median, mean, p90, p99 of one distribution                         [PARTIAL Fig 26 — numbers inconsistent, P1]
  fleet sizing against p99 load                                      [MISSING — conflated, P15]

21. Utilisation and the metrics worth watching                       [PARTIAL Fig 27]
  NVIDIA's definition (any kernel executing)                         [COVERED Fig 27 — unattributed]
  100% utilisation at 0.34% of peak arithmetic                       [MISSING]
  tokens/s, batch fullness, queue wait                               [COVERED Fig 27 — "Queue weight", P19]
  why queue wait moves first near capacity                           [MISSING]

22. Agents and cache hit rate                                        [COVERED Fig 28]
  agent loop re-reads its whole history (100:1)                      [COVERED Fig 28]
  hit rate = share of input tokens served from cache                 [PARTIAL Fig 28 — undefined]
  cached read 0.1x (writes 1.25x)                                    [TAUGHT IN V07 Fig 14]
  90 x 0.1 + 10 = 19                                                 [COVERED Fig 28]

23. Cost per million tokens                                          [PARTIAL Fig 29]
  $/M = ($/hour) / (tok/s x 3,600) x 1e6                             [MISSING — results only]
  $16.34 vs $1.09, ratio 15.0                                        [COVERED Fig 29]
  who measured what, on which machine                                [MISSING — heading says "same chip", P2]
  batching's price to the user: 12 tok/s per request vs 51           [MISSING]
    latency vs throughput                                            [TAUGHT IN V01 Fig 142]
  pay 2-3x vs get >10x                                               [COVERED Fig 29 prose]
  goodput per dollar                                                 [COVERED Fig 29; TAUGHT IN V01 Fig 145, V07 Fig 16]

24. Reasoning models and RL                                          [PARTIAL Fig 30]
  chain of thought: hidden tokens                                    [COVERED Fig 30]
  10,000 thinking tokens at 51 tok/s = 196 s before the answer       [MISSING]
  RL on an LLM: rollout, score, update                               [PARTIAL Fig 30 — one sentence]
    loss and gradients                                               [TAUGHT IN V06 Fig 04]
  rollouts 91% (math), 84% (code) at 16k; >95% at 32k                [PARTIAL Fig 30 — 84% and models dropped]

25. The price of a fixed capability                                  [COVERED Fig 31]
  benchmark score held fixed (GPT-3.5-level MMLU)                    [PARTIAL Fig 31 — unnamed]
  280x in 23 months = 18.9x a year; bandwidth 1.41x a year           [MISSING] (floor: roots)
  A100 2 TB/s -> Blackwell 8 TB/s                                    [COVERED Fig 31 — unnamed]
```

---

## 4. Proposed new figures (video order)

**70 new figures.** Each entry gives the insert point, a title in the atlas's voice, the idiom and drawing, the
nodes it fills, and its numbers with their verification. ★ marks an entry that would teach better as an
interactive widget. Recaps point back with "built in V0N Fig X" in the body, never "as we saw".

### A. The idle arithmetic, quantified (Part 1)

**A1.** After **Fig 01 · 0:24**, stamp **0:43**: *At batch one, the arithmetic units are 99.7% idle*
- Idiom: bars to scale on a log axis.
- Drawing: per token, 0.142 ms of arithmetic against 41.8 ms of weight read. A second pair shows intensity 1
  against the ridge 295. Recap of V01 Fig 116/126 and V02 Fig 75.
- Fills: tree 1 (idle compute, ridge). Fig 04 and the ceiling (D5) both rest on this number.
- Numbers (`v8_last.py`):
  - ridge: 989e12 / 3.35e12 = 295.2
  - arithmetic per token: 2 × 70e9 / 989e12 = 0.142 ms
  - read: 140e9 / 3.35e12 = 41.79 ms, so 23.9 tok/s
  - idle: 1 − 1/295.2 = 99.66%

### B. One speculative step, drawn (Part 2)

**B1.** After **Fig 02 · 1:14**, stamp **1:45**: *Five cheap passes, then one expensive one*
- Idiom: lane chart.
- Drawing: the drafter lane has five 1.4 GB blocks, each feeding its token into the next; the target lane has one
  140 GB block covering six positions. Widths are to scale by bytes (7 against 140). The caption says the drawing
  is by bytes, not time, because small drafters rarely reach full bandwidth.
- Fills: tree 2 (sequential drafting, drafter cost).
- Numbers (`v1_existing.py`): 140/100 = 1.4 GB; × 5 = 7 GB. At full bandwidth that would be 0.418 ms a pass and
  2.09 ms for five (`v3_geometric.py`).

**B2.** After B1, stamp **2:20**: *One pass returns a next-token distribution at every position*
- Idiom: table with a pointer.
- Drawing: the input row ("the cat sat" + d1…d5) above an output row shifted one place left. The prediction that
  judges d3 sits at d2's position, and the output at d5 is the free sixth token. Recaps logits/softmax (V01
  Fig 08–09).
- Fills: tree 2 (output at every position; the shift by one).
- Numbers: none.

**B3.** After **Fig 03 · 2:29**, stamp **2:51**: *Everything after the first disagreement was built on a wrong token*
- Idiom: a grid row of cells: accepted, rejected, discarded.
- Drawing (worked, greedy):
  - drafts: "on the mat and then"
  - target's picks: "on the mat . The"
  - 3 accepted; "and" rejected and replaced by "."; "then" discarded, because it and the target's prediction
    beside it both assumed "and"
  - 4 tokens from one pass
- Fills: tree 2 (why discard; the +1).
- Numbers: 3 + 1 = 4.

### C. The acceptance rule, worked with three tokens (Part 3): one build-up

Running example: the target p = (cat 0.5, dog 0.3, rest 0.2), which is Fig 05's bar, and the drafter
q = (0.2, 0.6, 0.2). "Dog" is then exactly the video's "drafter 60%, target 30%, accept 50%"
(`v2_specsampling.py`). Use p and q throughout, and retire "pt / pd".

**C1.** After **Fig 05 · 3:19**, stamp **3:38**: *Keeping the drafter's confident guesses writes "dog" twice as often as the target would*
- Idiom: two stacked 100% bars, p over q, plus a tally of 1,000 runs.
- Drawing: the naive rule outputs q, so dog appears 600 times against the 300 the target would write.
- Fills: tree 4 (naive rule = sampling from q).
- Numbers: 1000 × 0.6 = 600 against 1000 × 0.3 = 300.

**C2.** After **Fig 06** (restamped 3:47), stamp **3:50**: *Five guesses, checked left to right, stopping at the first rejection*
- Idiom: lane with a die at each guess.
- Drawing: the video's "It works through the drafted tokens one at a time":
  - guess 1: p/q = 1.4, accepted outright
  - guess 2: p/q = 0.8, draw u = 0.35 < 0.8, accepted
  - guess 3: p/q = 0.5, draw u = 0.62 > 0.5, rejected; a replacement is drawn; guesses 4–5 are discarded
  - result: 2 + 1 = 3 tokens from this pass
  - an inset shows the all-accepted case drawing a sixth token from the target
- Fills: tree 4 (the walk).
- Numbers: illustrative ratios; the comparisons are checked in `v8_last.py`.

**C3.** After C2, stamp **4:00**: *The chance of keeping a guess is p over q, capped at one*
- Idiom: equation built up, then a three-row table.
- Drawing: the ratio p/q, then min(1, ·):

  | token | p/q | min(1, p/q) |
  |---|---|---|
  | cat | 2.5 | 1 |
  | dog | 0.5 | 0.5 |
  | rest | 1 | 1 |

- Fills: tree 4 (min(1, p/q), notation).
- Numbers: 0.5/0.2 = 2.5; 0.3/0.6 = 0.5; 0.2/0.2 = 1.

**C4.** After C3, stamp **4:19**: *Proposed and kept: the smaller of p and q*
- Idiom: bars to scale.
- Drawing: each token's q bar with its kept part shaded, q × min(1, p/q) = min(p, q) = (0.2, 0.3, 0.2). The total
  kept is α = 0.7. The rejected 0.3 comes entirely from dog.
- Fills: tree 4 (min(p, q), acceptance rate).
- Numbers: Σ min(p, q) = 0.7. A Monte Carlo run of 1e6 draws gives an acceptance of 0.6999.

**C5.** After C4, stamp **4:33**: *The replacement is drawn only from what the drafter left short*
- Idiom: bars to scale.
- Drawing: max(0, p − q) = (0.3, 0, 0). Its total, 0.3, equals the rejected mass 1 − α, which is no accident.
  Renormalised, it is (1, 0, 0): a rejection always yields "cat". This is the video's "weight only where the target
  wanted a token more than the drafter did".
- Fills: tree 4 (residual).
- Numbers: Σ max(0, p − q) = 0.3 = 1 − 0.7.

**C6.** After C5, replacing **Fig 07**'s box drawing, stamp **4:50**: *0.2 kept plus 0.3 replaced is cat's 0.5: the target, rebuilt*
- Idiom: stacked bars that add up to p.
- Drawing:
  - cat = 0.2 (kept) + 0.3 × 1 (replaced) = 0.5
  - dog = 0.3 + 0 = 0.3
  - rest = 0.2 + 0 = 0.2
  - an inset shows the counterfactual: with the acceptance test alone, resampling a rejection from p gives
    (0.35, 0.39, 0.26). Both halves of the rule are needed.
  - point to V03 Fig 99 ("Exactness is what makes these safe to deploy")
- Fills: tree 4 (sum = p; both halves needed).
- Numbers: Monte Carlo output 0.5004 / 0.2997 / 0.2000; counterfactual (0.35, 0.39, 0.26) (`v7_misc.py`).

**C7.** After C6, stamp **4:58**: *At temperature zero the rule becomes Fig 03's exact-match check*
- Idiom: equation plus a small table.
- Drawing: p is all on one token, so min(1, p/q) is 1 for that token and 0 for any other, and the replacement is
  the target's top choice. A second line says p and q are the distributions *after* the sampler's reshaping (built
  in V07 Fig 21).
- Fills: tree 3 (greedy as one-hot) and tree 4 (links Fig 03 to Fig 06).
- Numbers: min(1, 1/0.2) = 1; min(1, 0/0.6) = 0.

**C8 ★.** After C7, stamp **5:01**: *Drag the drafter; the output does not move*
- Idiom: interactive widget.
- Drawing: sliders for q (and optionally p) over three tokens. Live bars show min(p, q), the residual and α. A
  "sample 10,000" button draws the histogram, which always lands on p.
- Fills: tree 4 (exact for any q).
- Numbers: the logic is checked by the Monte Carlo in `v2_specsampling.py`.

**C9.** After C8, stamp **5:08**, before Fig 07, which keeps only the papers' measurements and is restamped 5:23:
*A bad drafter is slower, never wrong*
- Idiom: small multiples.
- Drawing: three drafters with q = (0.45, 0.35, 0.2), (0.2, 0.6, 0.2) and (0.05, 0.9, 0.05). Their α is 0.95, 0.70
  and 0.40. The output bar is the same p in all three.
- Fills: tree 4 (quality changes α only).
- Numbers: `v2_specsampling.py`.

### D. From acceptance rate to speed-up (Part 4): one build-up

**D1.** After **Fig 08 · 5:47**, stamp **6:27**: *The k-th guess counts only if all k before it survive*
- Idiom: bars to scale.
- Drawing: α^k for k = 1…5: 0.7, 0.49, 0.343, 0.240, 0.168.
- The caption keeps the assumption visible: every guess is accepted independently at the same rate. That is the
  idealisation behind the 2022 paper's formula (**VERIFY** wording).
- Fills: tree 5 (α^k).
- Numbers: `v3_geometric.py`.

**D2.** After D1, stamp **6:29**: *Tokens per pass: 1 + 0.7 + 0.49 + 0.34 + 0.24 + 0.17 = 2.94*
- Idiom: equation built term by term.
- Drawing: the leading 1 is the replacement or bonus token the target always adds. With α = 0.7 the sum is 2.94,
  essentially Fig 08's three tokens: α = 0.709 gives exactly 3. Divided by the 1.05 step cost, that is 2.80×, and
  Fig 08's 2.86× follows.
- Fills: tree 5 (expected tokens, the +1). Fixes P9.
- Numbers: Σ = 2.941; Monte Carlo 2.938; 2.941/1.05 = 2.80; 3/1.05 = 2.857; α solving E = 3 is 0.709
  (`v3_geometric.py`).

**D3.** After D2, stamp **6:31**: *Summing the series without adding it up: multiply by α and subtract*
- Idiom: equation built up.
- Drawing: S = 1 + α + … + α⁵; αS = α + … + α⁶; S − αS = 1 − α⁶; so S = (1 − α⁶)/(1 − α) = 0.882351/0.3 = 2.941.
- Fills: tree 5 (geometric sum, at the floor).
- Numbers: S − αS = 0.882351 = 1 − 0.7⁶ (`v3_geometric.py`).

**D4 ★.** After D3, stamp **6:35**: *Longer drafts stop paying: the sum can never pass 1/(1−α)*
- Idiom: small multiples of E against draft length γ, with a widget.
- Drawing:
  - ceilings for α = 0.6, 0.7, 0.8, 0.9: 2.5, 3.33, 5 and 10
  - E at γ = 5: 2.38, 2.94, 3.69 and 4.69
  - speed-up E/(1 + γc): at c = 0.01 (bytes), α = 0.7 peaks at γ = 9 (2.97×); at c = 0.05 it peaks at γ = 6 (2.35×)
  - widget: sliders for α, γ and c
- Fills: tree 5 (diminishing returns, optimal draft length, the drafter's cost).
- Numbers: `v3_geometric.py`.

**D5.** After **Fig 09** (restamped 6:44), stamp **6:48**: *On the roofline, five extra positions are invisible at batch one and decisive at batch sixty-four*
- Idiom: log-log roofline (recap of V01 Fig 123–126).
- Drawing: four points at 1, 6, 64 and 384 positions per pass against the ridge at 295. Arithmetic time for each:
  0.14, 0.85, 9.06 and 54.4 ms, against the 41.8 ms weight read. Only 384 crosses the ridge.
- The caption says the drawing counts weights only (cache reads ignored), so it explains the direction of EAGLE-3's
  6.5× to 1.38× drop, not its size.
- Fills: tree 6. It also gives Fig 09 a job distinct from Fig 04 (P21).
- Numbers: 2 × 70e9 × positions / 989e12 (`v3_geometric.py`).

### E. Medusa, drawn (Part 5)

**E1.** After **Fig 10 · 7:24**, stamp **7:33**: *Two tokenisers cut the same word differently, so there is no q to divide by*
- Idiom: two token strips over the same text (tokens built in V01 Fig 06, 87).
- Drawing: one tokeniser splits a word into 3 pieces, the other into 2. Positions stop lining up, and the drafter
  has no probability for the target's token. Body: drift lowers α, and α falling from 0.8 to 0.6 cuts tokens per
  pass from 3.69 to 2.38 (−35%).
- Fills: tree 7 (shared vocabulary, drift).
- Numbers: `v8_last.py`.

**E2.** After E1, before Fig 12 (restamped 7:51), stamp **7:56**: *A decoding head is one matrix from the hidden state to a score per token*
- Idiom: matrix shapes drawn to proportion. This is a recap of V01 Fig 99/103 and names "hidden state" (V01 calls
  it the residual stream).
- Drawing: 8,192 numbers in, about 128,000 scores out, so 8,192 × 128,000 ≈ 1.05 billion weights. Medusa bolts on
  four more heads that read the same vector (whether each has its own output matrix: **VERIFY**).
- Fills: tree 7 (what a head is).
- Numbers: 8192 × 128000 = 1,048,576,000 (`v8_last.py`).

(Fig 12 keeps only the heads. **Move Fig 11 here, restamped 8:26.**)

**E3.** After Fig 11, stamp **8:29**: *Top candidates from each head multiply into a tree*
- Idiom: tree diagram plus a small count table.
- Drawing: the top 2 from each of 4 heads gives 2 + 4 + 8 + 16 = 30 nodes and 16 paths; the top 3 gives 120 nodes
  and 81 paths. That growth is why Medusa keeps only the likeliest branches.
- Fills: tree 7 (tree construction).
- Numbers: `v4_trees.py`.

**E4.** After E3, stamp **8:33**: *Flattened into one sequence, the tree needs a mask that shows each token only its ancestors*
- Idiom: grid.
- Drawing: a 5×5 mask over the/cat/dog/sat/ran (Fig 11's own tree), with rows
  - the 10000
  - cat 11000
  - dog 10100
  - sat 11010
  - ran 10101

  cat never sees dog. Contrast with the causal triangle (V03 Fig 20).
- Fills: tree 7 (tree mask).
- Numbers: the mask was generated in `v4_trees.py`.

**E5.** After E4, stamp **8:36**: *Spent as a tree, fourteen positions reach further than a chain of fourteen*
- Idiom: bars to scale, labelled illustrative.
- Drawing: with assumed hit rates (top-1 right 60%, top-2 right a further 20%), a chain of 14 expects 1.50 accepted
  tokens, against 1.95 for a binary tree of depth 3 (14 nodes). A chain of 3 expects 1.18. This replaces Fig 11's
  unsupported caption (P10).
- Fills: tree 7 (why a tree).
- Numbers: chain 0.6(1 − 0.6¹⁴)/0.4 = 1.499; tree 0.8 + 0.64 + 0.512 = 1.952; Monte Carlo 1.948 (`v4_trees.py`).

**E6.** After E5, stamp **8:47**: *Frozen backbone or trained together: 2.2× against 2.3–3.6×*
- Idiom: bars to scale.
- Drawing: defines "frozen": only the heads' weights change in training (training built in V06 Fig 04). Medusa-2
  also adjusts the model itself.
- Fills: tree 7 (frozen versus fine-tuned).
- Numbers: from the transcript (8:47–8:58).

**E7.** After E6, stamp **9:05**: *Typical acceptance lowers the bar where the target is unsure*
- Idiom: two distributions, each with its threshold line.
- Drawing: entropy built from logs as "how spread out", H = −Σ p ln p.
  - peaked (0.9, 0.05, 0.05): H = 0.394, threshold min(0.09, 0.3e^−H) = 0.09
  - twenty-way flat: H = 3.00, threshold 0.015
  - the bar starts to fall only when H > 1.20 nats
  - there is no replacement step, so the output is no longer p
  - body: "quality held on benchmarks" is a different claim from "distribution identical"
- Fills: tree 7 (typical acceptance, entropy).
- Numbers: `v4_trees.py`. The formula is confirmed by arXiv 2606.30265's description of Medusa. The constants
  ε = 0.09 and δ = 0.3 are the repository defaults as I recall them: **VERIFY**.

### F. EAGLE, split out of Fig 13 (Part 5)

**F1.** After **Fig 12 / E7**, stamp **9:32**: *Medusa's heads all guess from one snapshot*
- Idiom: two-lane timeline.
- Drawing: Medusa's heads read only the hidden state at t, so the head for t+3 never sees what was guessed for t+1
  and t+2. An autoregressive drafter feeds each guess back in. This is the video's 9:32 sentence, currently
  dropped.
- Fills: tree 8 (snapshot problem).
- Numbers: none.

**F2.** After F1, Fig 13 restamped **9:41**, its EAGLE-1 box becoming this figure: *EAGLE drafts the vector the output layer reads, and lets the target's own output layer turn it into a token*
- Idiom: nested containers.
- Drawing: the target's layer stack. The vector entering its output layer (the "second to top layer" feature) is
  highlighted. A one-layer drafter takes that vector plus the next token and predicts the next vector; the target's
  output layer (V01 Fig 103) turns it into a token, and the step repeats. Body: EAGLE-1 then builds the same kind
  of tree as Medusa (10:15).
- Fills: tree 8.
- Numbers: none. Drafter architecture: **VERIFY**.

**F3.** After F2, stamp **9:57**: *Vectors drift; tokens jump*
- Idiom: schematic, labelled so.
- Drawing: consecutive feature vectors as a smooth path in a 2-D projection, against token row numbers jumping
  across a 128,000-row table.
- Fills: tree 8 (why features are easier to predict).
- Numbers: none.

**F4.** After F3, stamp **10:20**: *EAGLE-2 spends its branches where the drafter is confident*
- Idiom: small multiples of trees.
- Drawing: a fixed tree, against dynamic trees in an easy context (deep and narrow, path value 0.9³ = 0.729) and a
  hard one (shallow and wide, 0.4 × 0.3 = 0.12). Path value is the product of confidences, and the best-valued
  nodes are expanded. +20–40% over EAGLE-1.
- Fills: tree 8 (dynamic tree).
- Numbers: `v4_trees.py`. The selection rule is **VERIFY** (EAGLE-2 paper).

**F5.** After F4, stamp **10:43**: *EAGLE-3 reads three depths of the target and drafts tokens again*
- Idiom: nested containers plus a schematic scaling curve.
- Drawing: low, middle and high layer taps fused into the drafter, which predicts tokens directly. Speed-up against
  training data: EAGLE-1's curve flattens and EAGLE-3's keeps rising ("removed a ceiling").
- Fills: tree 8.
- Numbers: none drawn. Layer choice: **VERIFY**.

(Fig 13's two bars stay as the EAGLE closer, restamped 11:04.)

### G. Lookahead, split out of Fig 14 (Part 5)

**G1 ★.** After **Fig 14** (restamped 11:31, trimmed to its claim), stamp **11:35**: *Jacobi iteration: guess every position, then refine them all at once*
- Idiom: grid of iterations × positions, best as a stepper widget.
- Drawing: target "the cat sat on the mat". Each round, a position is correct once everything to its left is
  correct, so the settled frontier advances one place a round: 6 rounds for 6 tokens.
- Fills: tree 9 (Jacobi).
- Numbers: simulated in `v4_trees.py` (settled prefix 1, 2, 3, 4, 5, 6).

**G2.** After G1, stamp **11:49**: *A right fragment in the wrong place is still a right fragment*
- Idiom: the same grid.
- Drawing: "on the mat" appears at the wrong offset in round 2 and is overwritten in round 3, which is the
  video's "guesses that do land correctly get overwritten".
- Fills: tree 9.
- Numbers: none.

**G3.** After G2, stamp **12:10**: *The pool: fragments filed under their first token*
- Idiom: table with a pointer.
- Drawing: key "the" → {"the mat .", "the cat sat"}. The model emits "the", the matching fragments are pulled, and
  they are checked in a second branch of the same pass.
- Fills: tree 9 (n-gram pool, same-pass verification).
- Numbers: none.

**G4.** After G3, stamp **12:34**: *A benchmark is a fixed exam, and a speed-up is measured on its prompts*
- Idiom: small table.
- Drawing: MT-Bench's multi-turn questions and how they are scored (**VERIFY**: 80 questions, judged by a strong
  model). Speed-ups depend on which prompts are fed in, because predictable text accepts more guesses. "Benchmark"
  is never defined in V01–V07, yet V08 uses it in Figs 14, 18, 22 and 31.
- Fills: tree 9 (benchmark).
- Numbers: **VERIFY**.

### H. The cache, quantified (Part 6)

**H1.** After **Fig 15 · 12:42**, stamp **13:10**: *320 KB a token: two vectors, 80 layers, 8 KV heads, 128 numbers, 2 bytes*
- Idiom: equation recap (built in V01 Fig 138–140, V03 Fig 88).
- Drawing: then 128k tokens gives 131,072 × 327,680 = 42.95 GB = 40.0 GiB, which is the video's "roughly 40". State
  which unit the atlas uses (P17).
- Fills: tree 10.
- Numbers: `v1_existing.py`.

**H2.** After H1, stamp **13:36**: *Each decode step reads the weights plus the whole cache, so time per token rises with context*
- Idiom: line chart.
- Drawing: bytes per step against context length for batch 1 and batch 4, with the weights as a flat 140 GB line.
  - the cache equals the weights at 427k tokens (B = 1) and 107k (B = 4)
  - at 128k: 54.6 ms a step for B = 1 and 93.1 ms for B = 4, against 41.8 ms for the weights alone
- Fills: tree 10 (per-step read).
- Numbers: 140e9 / (B × 327,680); (140e9 + B·L·327,680) / 3.35e12 (`v5_longctx.py`).

**H3.** After H2, stamp **13:44**: *FlashAttention removed the score matrix's trips to memory; the cache still grows*
- Idiom: two-row recap of V03, with traffic bars before and after FlashAttention taken from V03 Fig 03/43.
- Drawing: the cache-size bar is unchanged between the two rows.
- Fills: tree 10. Gives Fig 15's caption a referent.
- Numbers: reuse V03's verified figures.

**H4.** After **Fig 16 · 14:00**, stamp **14:07**: *Ring attention: the cache spread across devices, the blocks passed round*
- Idiom: ring diagram (recap of V05 Fig 20–22).
- Drawing: four GPUs, each holding a query slice. Key-value blocks move one hop a step, and after 3 hops every query
  has met every block. The rule: compute on one block must outlast moving the next.
- Fills: tree 11.
- Numbers: none.

### I. Why attending to fewer works (Part 7)

**I1.** Before **Fig 17**, stamp **14:51**: *One query's attention: four tokens carry 82% of the weight*
- Idiom: sorted bars of one softmax row over 32 tokens (illustrative scores 4, 3.5, 3.2, 3, rest 0), with the
  cumulative share drawn.
- Drawing: top-4 hold 0.825; each of the other 28 holds 0.006.
- Fills: tree 12.
- Numbers: `v5_longctx.py`.

**I2.** After I1, stamp **14:54**: *Every pair at 128k: 17 billion scores per head per layer*
- Idiom: the n² grid at small scale (V03 Fig 26–27), with nearly every cell pale.
- Drawing: 131,072² = 1.72e10; the causal half is 8.59e9.
- Fills: tree 12.
- Numbers: `v5_longctx.py`.

**I3 ★.** After **Fig 17** (restamped 15:01), stamp **15:22**: *Each layer reaches one window further back*
- Idiom: grid of layer × position, showing the reach as a cone.
- Drawing: with W = 4, the reach is 4, 8 and 12 after 1, 2 and 3 layers. Then the real case, 4,096 × 32 = 131,072,
  "in theory". Optional widget: sliders for W and layers.
- Fills: tree 13.
- Numbers: `v5_longctx.py`.

**I4.** After I3, stamp **15:44**: *A rolling buffer: token i goes to slot i mod 4,096, and the cache stops at 512 MiB*
- Idiom: ring buffer with 8 slots.
- Drawing: positions 9–12 land in slots 1–4. Then Mistral 7B: 32 × 8 × 128 × 2 × 2 = 131,072 B = 128 KiB a token;
  × 4,096 = 512 MiB per sequence at any length.
- Fills: tree 13 (rolling buffer, cap).
- Numbers: `v5_longctx.py`. Mistral 7B config: **VERIFY**.

**J1.** After **Fig 18** (restamped 15:58), stamp **16:06**: *Three branches read three different sets of keys*
- Idiom: bars to scale on one 65,536-token strip.
- Drawing: compressed summaries (blocks of 32, stride 16) give 4,095 keys; 16 selected blocks of 64 give 1,024; the
  window gives 512. Total 5,631 = 8.6% of the context.
- Fills: tree 14.
- Numbers: (65,536 − 32)/16 + 1 = 4,095 (`v5_longctx.py`). Hyperparameters l = 32, d = 16, l′ = 64, n = 16,
  w = 512 confirmed from search excerpts of arXiv 2502.11089. Re-check against the PDF, including whether n
  includes the forced initial and local blocks.

**J2.** After J1, stamp **16:12**: *The coarse scores choose which blocks to read in full*
- Idiom: table with a pointer.
- Drawing: block-summary scores, the top-n blocks selected, then read at full detail.
- Fills: tree 14 (selection).
- Numbers: none. That the selection reuses the compression branch's scores is **VERIFY**.

**J3.** After J2, stamp **16:30**: *One weight per branch, then a weighted sum*
- Idiom: equation built up (weighted average built in V01 Fig 93).
- Drawing: o = g₁·o_cmp + g₂·o_slc + g₃·o_win, each g between 0 and 1. Body: why the sliding branch exists ("Local
  patterns are the easiest thing to learn").
- Fills: tree 14 (gate).
- Numbers: illustrative g. The gate's form (small layer + sigmoid) is **VERIFY**.

**J4.** After J3, stamp **16:55**: *DeepSeek's later version picks single tokens: 2,048 a query*
- Idiom: two grids, whole 64-token blocks against scattered single cells.
- Drawing: 2,048 of 131,072 = 1.56%.
- Fills: tree 14 (DSA).
- Numbers: `v7_misc.py`. Top-k = 2,048 comes from secondary sources (vLLM blog, a config walkthrough); confirm with
  DeepSeek's V3.2-Exp report.

**J5.** After **Fig 19** (restamped 17:11), stamp **17:20**: *MoBA scores each block by the query's dot product with the block's average key*
- Idiom: table with a pointer (dot product built in V03 Fig 14; top-k in V06 Fig 09, 13).
- Drawing: 8 blocks with their mean keys (2-D), the scores, and the top 3 kept.
- Fills: tree 15. Fixes P4.
- Numbers: illustrative, computed when drawn. Mean pooling and top-k are confirmed (MoBA repo/paper via search).
  Whether the query's own block is always included is **VERIFY**.

### K. Deleting tokens (Part 8)

**K1.** Fig 20 split, taking its first half at **18:04** (Fig 20 restamped 18:33): *Softmax has no "none of the above"*
- Idiom: worked softmax.
- Drawing: five uniformly poor scores (−3, −2.8, −3.1, −2.9, −3.0) still get weights 0.19, 0.23, 0.17, 0.21 and
  0.19, summing to 1 (softmax built in V01 Fig 09).
- Fills: tree 16.
- Numbers: `v5_longctx.py`.

**K2.** After K1, stamp **18:28**: *A sink soaks up the leftover, and evicting it hands the rest five times their weight*
- Idiom: two bar rows.
- Drawing: with a sink scored 1 and five tokens scored −2, the sink takes 0.80 and each token 0.04. With the sink
  evicted, each token takes 0.20. This is why the sinks are kept.
- Fills: tree 16 (sinks necessary).
- Numbers: `v5_longctx.py`.

**K3.** After **Fig 21** (restamped 18:58), stamp **19:05**: *Heavy hitters: rank tokens by the attention they have received*
- Idiom: sorted table plus a recent window.
- Drawing: 10 tokens' accumulated attention; keep the top 2 (20%), which hold 53% of it, plus the recent tokens.
- Fills: tree 17.
- Numbers: illustrative (`v5_longctx.py`).

**K4.** After K3, stamp **19:16**: *SnapKV lets the end of the prompt vote on what to keep*
- Idiom: grid.
- Drawing: the last few prompt tokens score every earlier position; the top-scored are kept before generation
  starts.
- Fills: tree 17 (SnapKV).
- Numbers: none. Mechanism: **VERIFY**.

**K5.** After K4, stamp **19:25**: *Attention received so far says nothing about attention needed later*
- Idiom: timeline, labelled illustrative.
- Drawing: a token draws little attention for 1,000 steps and is evicted; at step 1,200 the question needs it.
- Fills: tree 17 (backward-looking failure).
- Numbers: none.

**K6.** After K5, stamp **19:36**: *Quantizing keeps every token, each one smaller* (recap of V04 Fig 69–72)
- Idiom: bars.
- Drawing: 327,680 B a token at 16 bits against 81,920 B at 4 bits (before scales). Contrast eviction, which keeps
  20% of tokens at full size.
- Fills: tree 17.
- Numbers: `v5_longctx.py`.

### L. Retrieval, built (Part 9)

**L1.** After **Fig 23** (restamped 20:23), stamp **20:38**: *A chunk's vector: numbers placed so that similar meanings land close together*
- Idiom: schematic 2-D points (vectors built in V01 Fig 84, 86).
- Drawing: chunk dots and a question star.
- Fills: tree 19.
- Numbers: none.

**L2.** After L1, stamp **20:47**: *Nearest means the highest cosine*
- Idiom: worked table.
- Drawing: q = (0.8, 0.6) against A = (0.9, 0.4), B = (0.1, 1.0) and C = (−0.7, 0.7). The cosines are 0.975, 0.677
  and −0.141, so A and B go in the prompt. Cosine = dot ÷ (|x||y|), with lengths by Pythagoras.
- Fills: tree 19.
- Numbers: `v5_longctx.py`.

**L3.** After L2, stamp **20:55**: *The corpus can be any size; the prompt stays a few thousand tokens*
- Idiom: log bars.
- Drawing: a 1e9-token corpus would need 328 TB of cache in context, against 5 chunks × 500 + 50 = 2,550 tokens
  using 0.84 GB.
- Fills: tree 19.
- Numbers: `v5_longctx.py`.

**L4.** After **Fig 24** (21:23), stamp **21:49**: *With retrieval, the shared prefix ends where the chunks begin*
- Idiom: two token strips (prefix rule built in V01 Fig 44–46, V07 Fig 12).
- Drawing: [system 500][chunks 2,500][question 50] twice, with different chunks. The shared prefix is 500/3,050 =
  16%.
- Fills: tree 19.
- Numbers: `v5_longctx.py`.

### M. Measuring it (Part 10)

**M1.** Before **Fig 25** (restamped 22:33), stamp **22:21**: *Where TTFT and TPOT sit on one request's timeline*
- Idiom: lane chart (recap of V01 Fig 143).
- Drawing: arrival → queue wait → prefill → first token (TTFT) → decode steps (TPOT). The queue term is new
  relative to V01.
- Fills: tree 20.
- Numbers: none.

**M2.** After **Fig 26** (22:36), stamp **22:50**: *Size the fleet for the busiest minutes, not the average minute*
- Idiom: sorted population of the 1,440 minutes of a day's load (the same idiom as Fig 25).
- Drawing: load swinging ±60% around 100 has a mean of 100 and a p99 of 160. A fleet sized at the mean is short 50%
  of the minutes, and those minutes carry 69% of the requests.
- Fills: tree 20 (fleet sizing). Fixes P15.
- Numbers: 0.5 + 0.6/π = 0.691 (`v6_measure.py`).

**M3.** After **Fig 27** (23:04), stamp **23:14**: *Utilisation 100%, arithmetic 0.3%*
- Idiom: two-lane timeline.
- Drawing: kernels back-to-back in one sample period (NVIDIA's definition, reads 100%) above tensor-core busy time,
  which is at most 1/295 at batch 1.
- Fills: tree 21.
- Numbers: 100/295.2 = 0.34% (`v6_measure.py`).

**M4.** After M3, stamp **23:41**: *Queue wait climbs long before throughput stops rising*
- Idiom: curve, shown as a simulation rather than derived, since queueing theory is above the floor.
- Drawing: mean wait of 1, 4, 9 and 19 service times at 50, 80, 90 and 95% load. Defines "queue wait" (P19).
- Fills: tree 21.
- Numbers: ρ/(1 − ρ). A 200k-arrival simulation gives 1.0, 3.8, 8.4 and 17.0; it converges slowly near saturation
  (`v6_measure.py`).

**M5.** After M4, stamp **23:49**, before Fig 28: *Hit rate, measured on an agent's growing prompt*
- Idiom: stacked bars, one per step.
- Drawing: each step's prompt is the previous prompt (cached, shaded) plus the new tail. The hit rate is
  cached ÷ total input. The caption notes V07 Fig 14's cache-write price: written misses turn 19 into 21.5.
- Fills: tree 22.
- Numbers: 90 × 0.1 + 10 × 1.25 = 21.5 (`v6_measure.py`).

**M6.** Before **Fig 29** (Fig 29 restamped 24:42 and trimmed to the two measured cases), stamp **24:23**: *Cost per million tokens is an hourly price over an hourly output*
- Idiom: equation built with units.
- Drawing: $/M = ($/h) ÷ (tok/s × 3,600) × 10⁶. Worked: 3/(51 × 3,600) × 10⁶ = $16.34; 3/(767 × 3,600) × 10⁶ = $1.09.
- Fills: tree 23.
- Numbers: `v1_existing.py`, `v6_measure.py`.

**M7.** After Fig 29, stamp **25:24**: *Cheaper per token, slower per user*
- Idiom: bars.
- Drawing: in Perplexity's run, 767 × 2 GPUs ÷ 128 requests = 12.0 tok/s per request (83 ms a token), against
  51 tok/s (19.6 ms) alone. Ties to TPOT and V01 Fig 142. Keeps the caveat that the two runs used different
  machines and prompt lengths.
- Fills: tree 23 (batching's price to the user).
- Numbers: `v6_measure.py`.

**M8.** After M7, stamp **26:08**: *What you pay varies two or three times; what you get varies fifteen*
- Idiom: log bars.
- Drawing: the provider price range $1.5–$8 (5.3× at the extremes, 2–3× among comparable providers) against the
  15× output range.
- Fills: tree 23.
- Numbers: 8/1.5 = 5.33; 767/51 = 15.04.

**M9.** After M8, stamp **26:24**: *Late tokens are paid for and cannot be sold*
- Idiom: sorted population of tokens against a deadline (goodput built in V01 Fig 145, V07 Fig 16).
- Drawing: 10% late raises the cost per good token × 1.11.
- Fills: tree 23.
- Numbers: 1/0.9 = 1.111.

### N. The workload is changing (Part 11)

**N1.** After **Fig 30** (restamped 26:39, first half only), stamp **26:51**: *Ten thousand thinking tokens is three minutes of decode before the first word*
- Idiom: bars (time).
- Drawing: 300, 10,000 and 30,000 thinking tokens at 51 tok/s take 6 s, 196 s and 588 s.
- Fills: tree 24.
- Numbers: `v6_measure.py`.

**N2.** After N1, stamp **27:11**: *Reinforcement learning on a language model: write attempts, score them, nudge the weights*
- Idiom: cycle (a genuine loop) (gradients built in V06 Fig 04).
- Drawing: rollout (inference, decode-bound) → reward → update (training) → repeat.
- Fills: tree 24.
- Numbers: none.

**N3.** After N2, replacing Fig 30's second half, stamp **27:33**: *Where an RL step's time goes*
- Idiom: stacked bars to scale.
- Drawing: math model at 16k: rollout 91% / rest 9%; code model at 16k: 84% / 16%; both over 95% at 32k. Source:
  RhymeRL. Body: "Their explanation is the one this series started with" (memory bandwidth).
- Fills: tree 24. Fixes P8.
- Numbers: confirmed against RhymeRL (arXiv 2508.18588) via search excerpts.

**N4.** After **Fig 31** (28:26), stamp **28:50**: *280 times in 23 months is 19 times a year; bandwidth grew 1.4 times a year*
- Idiom: log bars of per-year factors (roots are at the floor).
- Drawing: price 280^(12/23) = 18.9× a year against bandwidth 4^(1/4) = 1.41× a year. Over the same 23 months
  bandwidth gave about 1.94×, 12% of the improvement in log terms. Replaces Fig 31's caption claim with numbers
  (P3).
- Fills: tree 25.
- Numbers: `v6_measure.py`.

(**Fig 32** restamped **29:21**, kept last.)

---

## 5. Problems in existing figures

### Factual or numeric errors

**P1. Figs 25 and 26 do not describe the same distribution, and Fig 25's prose contradicts its own bars.**

Computed from the 100 bar heights in the HTML (`v1_existing.py`, `v6_measure.py`):
- median 14.16 px; mean 32.21 px, so **mean/median = 2.28**
- **p90 = 6.0×**, **p99 = 10.0×**, max 10.6×
- only 64 bars are within 1.5× of the median, so the climb starts around bar 60

Fig 26 claims mean 1.4×, p90 6× and p99 20× of "The same distribution". Fig 25's prose says "Ninety of the hundred
sit almost flat". Neither can hold:
- If ninety sit flat, p90 is about 1×, not 6×.
- With a flat body, p90 = 6× and p99 = 20× force the mean to at least (89 + 9·6 + 2·20)/100 = **1.83×**.
- Even with the 49 fastest requests at zero, the mean is at least 1.34×.
- No affine rescaling of Fig 25's heights reproduces Fig 26.

Fix: draw both figures from one array in Python and print the four statistics from it. Two options:
- **(A)** Keep Fig 25's bars. Relabel Fig 26 to 1×, 2.3×, 6.0× and 10.0×, and rewrite the prose to "About sixty sit
  almost flat; the climb starts around the sixtieth".
- **(B)** Regenerate: 90 flat values (0.85–1.15) plus 10 climbing geometrically to 20. That gives mean 1.72×,
  p90 1.22× and p99 16×. A nice lesson follows: the average lands *above* nine requests in ten and is still nine
  times below p99.

**P2. Fig 29's heading is false: "Cost per million tokens, on the same chip at the same hourly rate".**

The transcript (24:42–25:24) gives two different runs:
- NVIDIA ran Llama 3.3 70B on *one H200* at 51 tok/s.
- Perplexity ran Llama 2 70B on *two H100s* with 128 concurrent requests, at 767 tok/s per GPU.

The video's own caveat is "different machines and different prompt lengths". Fix the heading to "…at the same
hourly rate and model size", and name both runs in the body. The caption's "different machines" then stops
contradicting the heading.

**P3. Fig 31's caption, "Almost none of it came from the chips", contradicts its body and the video.**

The body says "The hardware did not stand still either", as does the transcript (29:01). Replace it with the
quantified version from N4: bandwidth explains about 12% of the 280× in log terms over the window, and the rest
came from smaller models on a better stack.

**P4. Fig 19 says "a learned gate". MoBA's gate has no parameters of its own.**

It ranks blocks by the query's dot product with each block's mean key and keeps the top k. The video's word
"learned" (17:14) is loose: what is learned is the queries and keys, trained with the gate in place. Reword as in
J5. Source: MoBA repo/paper, via search.

**P5. Fig 10 has a truncated label: "the two must share one vocabulary, because verification compares probabili".**

The cut is in the source string, not the layout: the box is 560 px and the full 80-character sentence needs about
480 px. Restore "probabilities". The checker cannot catch this.

**P6. Fig 17 drops the presenter's caveat and the model's name.**

The video says "about 130,000 tokens **in theory**" (15:36) and "**Mistral 7B** sets that window" (15:06). Restore
both. The prose also mixes "4,000" and "4,096" within one paragraph; use 4,096.

**P7. Fig 22's bars are neither to scale nor labelled schematic.**

They are 280 px and 90 px for 95% against 80%. To scale by percentage they would be 280:236; by compression ratio
(20× against 5×) 280:70. Redraw as compression ratio to scale (1/(1 − 0.95) = 20; 1/(1 − 0.80) = 5), or as two
marks on a 0–100% line.

**P8. Fig 30 says "both pass 95%" without saying both of what.**

The figure never introduces the math and code models, and it drops the 84% code-model figure ("Rollouts took 91%
… for a math model. For a code model, it was 84%", 27:33). Fixed by N3.

**P9. Fig 08 is off by one.**

It defines acceptance length as "the average number of drafted tokens that survive" yet produces three tokens per
step. Tokens per pass = surviving drafts + 1, the replacement or bonus. Say so (D2). This matches how EAGLE-style
papers report the average acceptance length τ.

**P10. Fig 11's caption claim "and far more of them survive" is unsupported and misleading.**

At most one root-to-leaf path of a tree survives. What rises is the expected accepted depth: 1.95 against 1.50 for
14 positions under the illustrative rates in E5. Replace the caption with that comparison.

**P11. Fig 06's caption, "Everything about correctness rests on the second line", is wrong.**

Correctness needs both the p/q acceptance *and* the leftover-only replacement. With acceptance alone:
- resampling a rejection from p gives (0.35, 0.39, 0.26)
- dropping rejections gives (0.29, 0.43, 0.29)

Both differ from p = (0.5, 0.3, 0.2) (`v7_misc.py`). Fix: "Correctness needs both halves: the p-over-q test and a
replacement drawn only from what the drafter left short."

**P12. Fig 18's caption overclaims: "The price cut is the clearest evidence it works."**

A price cut shows the saving reached the bill; the evidence on quality is the benchmark parity in the body. Fix:
"The price cut shows the saving reached the bill on day one; the benchmark parity is the evidence that quality did
not pay for it."

### ASR damage and dropped names

**P19. Likely ASR damage carried into Fig 27, and names the atlas drops.**

- **"Queue weight"** (Fig 27) is almost certainly **"queue wait"**: the caption reads "Q weight climbs before
  anything else when capacity runs short", 23:41. It is the queue term of TTFT, which Fig 26 itself calls "waiting
  in the queue". **VERIFY** against the audio.
- **"Batchfulness"** may be **"batch fullness"**: **VERIFY**.

Names the atlas drops, so a reader searching the raw SRT for them will fail (ASR form → correct):
- "empty bench" → **MT-Bench**
- "deep mind", "chinchilla" → **DeepMind, Chinchilla**
- **Mistral 7B**
- "Deepseek" → **DeepSeek** NSA / **DeepSeek Sparse Attention, V3.2-Exp**
- "MOA roots", "MOBA", "Kimy" → **MoBA routes**, **Moonshot**, **Kimi**
- "Streaming LLM", "sync tokens" → **StreamingLLM**, **sink tokens**
- **H2O**
- "Snap KV" → **SnapKV**
- **The Sparse Frontier**
- **retrieval-augmented generation**
- "Manis team" → **Manus**
- **NVIDIA**
- **Perplexity**
- "Llama 3.370B", "Llama 270B" → **Llama 3.3 70B**, **Llama 2 70B**
- **H200**
- **RhymeRL** ("Rhyme RL" is correct ASR: the system is RhymeRL, arXiv 2508.18588)
- **Stanford AI Index**
- **GPT-3.5-level MMLU score**
- "2 tab a second", "A100", "Blackwell" → **2 TB/s, A100, Blackwell**
- "Eagle" → the paper styles it **EAGLE**

The atlas already handles three ASR errors correctly: "$19 per million" means **$1** ($3/2.76M = $1.09), "shot"
means "short", and "cash" means "cache".

**P20. Missing back-references.**

The video points back explicitly at:
- 14:04: "which we covered in episode 5"
- 17:27: "from episode 6"
- 19:42: "Episode 4 covered that"
- 21:49: "discussed in episode 7"
- 22:21: "covered both of them in episode 1"
- 24:09: "In episode 7, we priced a cached read"

The atlas drops all six. Add "(built in V05 Fig 20)"-style pointers in Figs 16, 19, 21, 24, 26 and 28 and in the
recap figures.

### Voice

No violations in the figures: no "the video says", no labelled additions. Fig 32's "we have met them" is the
atlas's own voice and is fine.

### Neighbours that repeat each other; captions that restate

**P21. Repetition between neighbours.**

- **Fig 04 and Fig 09** make the same point with the same two-bar schematic. Fig 04's caption ("holds precisely when
  the machine is underloaded") already states Fig 09's conclusion. Give Fig 04 the measured 0.85 ms against
  41.8 ms, and make Fig 09 the roofline (D5).
- **Fig 06 and Fig 07** are both box pairs about the same rule. Rebuild them as the C build-up; Fig 07 keeps only the
  papers' measurements (5:23–5:47).
- **Fig 11 and Fig 12**: Fig 12's "verifying the whole tree in one forward pass" repeats Fig 11. Resolved once
  Fig 11 moves after the heads and Fig 12 is split.
- **V08 Fig 01 and V07 Fig 26** have nearly identical titles and content ("Where the batching argument ran/runs
  out"). Retitle V08 Fig 01 with its own claim, e.g. "Two ways left: more tokens per read, or fewer bytes per
  token".

### Idioms that fight their idea

**P22.**

- **Figs 06 and 07**: boxes for a probability argument. Use stacked bars (C3–C6).
- **Fig 13**: three boxes and three paragraphs for three mechanisms. Split into F1–F5.
- **Fig 14**: three boxes for an iterative algorithm. Use an iterations × positions grid (G1–G3).
- **Fig 16**: two boxes. Use a table of technique × {keeps every token? reads less each step? stores less? exact?}:
  ring, window, NSA/DSA, MoBA, sinks, H2O/SnapKV, quantized cache, retrieval. It becomes the map for Parts 7–9.
- **Fig 27**: boxes. Use a timeline (M3).
- **Fig 15**: the "320 KB" box sits in a column of to-scale bars without being to scale (it would be 0.0014 px).
  Make it a label.
- **Fig 31**: a 286:1 ratio drawn linearly (the $0.07 bar is 4 px; to scale it would be 1.19 px). `design.md` asks
  for a log axis beyond about 50:1.

### Minor

- **P15. Fig 26** says "A service sized for the average … misses its promise for every request in the fourth".
  This blends latency percentiles with the video's fleet-sizing point, which is about *load*, and "every request in
  the fourth [bar]" is muddled, since a bar is one statistic. Move fleet sizing to M2.
- **P17. Fig 15's "42 GB"** is 128,000 × 327,680 B = 41.9 GB. The video's "roughly 40" is 40.0 GiB at 131,072
  tokens (42.95 GB). Both are fine; say which.
- **P23. Colour key.** V08 repurposes the colours: teal (`s`) means "moving fewer bytes" and amber (`m`) "getting
  more from the bytes". In V01, V06, V07 and V09, teal means "what helps". Consider keeping `s` as "what helps" and
  marking the two families with labels.
- **P24. Fig 09's caption**, "This is why production systems run both", is not in the transcript and is unsourced.
  Soften it.
- **P25. Fig 12's prose** holds six separate claims in one figure. It is fixed by E2–E7.

---

## 6. Size after the pass

**About 102 figures**: the 32 existing (restamped, several trimmed or split) plus 70 new. That is 3.4 a minute.
The density sits below V01 (4.7) on purpose: tokens, bandwidth, the roofline, softmax, the KV cache, ring attention,
top-k and prefix caching are already built in V01–V07, so V08 needs short recaps with pointers, not rebuilds. Four
proposals (C8, D4, G1, I3) are widgets; C8 and D4 matter most.

**The three highest-value changes:**

1. **Build the exactness and speed-up argument at the floor (C1–C9, D1–D5).** The current Figs 06–08 are box pairs
   that state a rule. With Fig 05's own cat/dog/rest numbers and a drafter of (0.2, 0.6, 0.2):
   - the rule gives α = 0.7
   - kept + replaced = (0.5, 0.3, 0.2) exactly
   - 1 + 0.7 + … + 0.7⁵ = 2.94 tokens a pass, which is the video's "three tokens"
   - 2.94/1.05 = 2.8×

   This is the video's central claim. Every number in the chain is verified and simulated.
2. **Fix the measurement figures (P1, P2, P3, P15, M2, M6–M9).** Figs 25/26 are mutually inconsistent, Fig 29's
   heading is false, Fig 31's caption contradicts its body, and fleet sizing is missing. Split Fig 29 into the
   formula, the two named runs, the per-user price of batching and goodput.
3. **Draw the mechanisms that are only described (E3–E7, F1–F5, G1–G3, J1–J5).** These are the tree mask,
   typical acceptance, EAGLE's feature drafting and dynamic tree, Jacobi iteration and the n-gram pool, NSA's read
   budget (8.6% of keys at 64k) and MoBA's dot-product gate. Together they fill the two-minute gaps at 9:26 and
   11:27 and remove the over-stuffed prose of Figs 12–14 and 18.

---

## 7. Verification log and sources

Scripts, all in
`/tmp/claude-0/-home-user-llm-inference/2bdbd8e1-ff2f-51ec-90f1-8e7fc460e0a5/scratchpad/review/verify/`:

| Script | Checks |
|---|---|
| `v1_existing.py` | Existing figures' arithmetic; the Fig 22 and Fig 31 bar scales; the Fig 26 lower bound |
| `v2_specsampling.py` | Three-token rule, α, residual; 1e6-draw Monte Carlo; drafter quality |
| `v3_geometric.py` | Geometric series, optimum γ, Monte Carlo of tokens per step; roofline times |
| `v4_trees.py` | Chain vs tree; Medusa tree sizes; tree mask; typical-acceptance thresholds; Jacobi toy |
| `v5_longctx.py` | Per-step bytes, crossover lengths, attention pairs, softmax concentration, Mistral cap, NSA budget, sinks, H2O, retrieval |
| `v6_measure.py` | Corrected percentile data, fleet sizing, queue wait, cost and per-user speed, reasoning time, per-year rates |
| `v7_misc.py` | Counterfactual rules; DSA share; Fig 10 label width |
| `v8_last.py` | A1, E2, drift, H1 |

Fig 25 statistics come from the 100 `<rect>` heights in the HTML. Renders are in `…/scratchpad/review/png/`.

Sources consulted, by web search (direct fetch of arxiv.org was blocked in this environment):

- [RhymeRL: History Rhymes, arXiv 2508.18588](https://arxiv.org/pdf/2508.18588): 91% math / 84% code at 16k; >95% at 32k
- [Native Sparse Attention, arXiv 2502.11089](https://arxiv.org/html/2502.11089): l = 32, d = 16, l′ = 64, n = 16, w = 512
- [vLLM blog on DeepSeek-V3.2-Exp](https://vllm.ai/blog/deepseek-v3-2) and [a config walkthrough](https://erogol.substack.com/p/model-check-deepseek-v32-exp-fine): top-2,048 tokens
- [MoBA, arXiv 2502.13189](https://arxiv.org/html/2502.13189v1) and [MoonshotAI/MoBA](https://github.com/moonshotai/MoBA): mean-pooled block keys, parameter-less top-k gate
- [When Is a Draft Accepted?, arXiv 2606.30265](https://arxiv.org/pdf/2606.30265): Medusa's threshold min(ε₀, δ₀e^−H)
