# Film bible: shared numbers, conventions and per-chapter notes

Read this together with `SCRIPT_GUIDE.md` and `PLAN.md`. These notes keep nineteen chapters,
written in parallel, consistent with each other.

## The running example (use these everywhere)

| Quantity | Value | Say it as |
|---|---|---|
| model | a 70-billion-parameter model, shaped like Llama 3 70B | "a seventy-billion-parameter model" |
| weights in 16-bit | 70e9 × 2 bytes = 140 GB | "a hundred and forty gigabytes" |
| layers | 80 | |
| residual width (d_model) | 8,192 | "eight thousand one hundred and ninety-two numbers wide" |
| query heads / KV heads / head dim | 64 / 8 / 128 | |
| feed-forward width | 28,672 | |
| vocabulary | 128,256, rounded to "about 128,000" | |
| H100 | 3.35 TB/s HBM bandwidth, 989 TFLOP/s dense 16-bit, 80 GB, 700 W | |
| H200 | 4.8 TB/s | |
| B200 | 8 TB/s | |
| ridge on H100 | 989 / 3.35 = 295 ops per byte | |
| decode ceiling on H100 | 3.35e12 / 140e9 = 23.9, "about 24 tokens a second" | |
| the "30 ms" | 140 GB / 4.8 TB/s = 29.2 ms on an H200 | |
| KV cache per token | 2 × 80 × 8 × 128 × 2 = 327,680 bytes, "about 320 kilobytes" (4,096 bytes per layer) | |
| storage on the chip itself (H100) | a few hundred KB per working area (SM: 256 KB registers + 256 KB L1/shared); 132 × 512 KB + 50 MB L2 = 0.12 GB in all, 1/1,150 of the model | "a few hundred kilobytes in each small working area, about a tenth of a gigabyte in all, about a thousandth of the model". Never "a few hundred kilobytes" for the whole chip (fig 12/106 correction, ch02) |
| disk vs memory beside the chip | 140 GB at ≈ 7 GB/s ≈ 20 s; 20 s ÷ 41.8 ms ≈ 479× | "about twenty seconds", "roughly five hundred times faster" (ch02, ch09) |

**Embedding table, corrected.** Atlas figs 87–89 and 103 draw a 4,096-wide table (that is an
8B model's width) while figs 99–101 use 8,192. The film uses the 70B shape throughout: one row is
8,192 numbers; the whole table is 128,256 × 8,192 × 2 bytes = 2.10 GB; a 200-token prompt gathers
200 rows = 3.28 MB, 0.16% of the rows. Record this correction in `checks`.

**Bytes on the wire, corrected.** Fig 31 says 22 KB against 70 TB is "seven orders of magnitude".
70e12 / 22e3 = 3.2 × 10^9, about nine and a half orders of magnitude. Use the correct figure.

## The two prompt-cache examples (ch03, ch04, ch13, ch15, ch16, ch17 must agree)

**Example A — the weather conversation.** A conversation whose prompt is 1,032 tokens, about 4 KB
of text (fig 28). Its follow-up a minute later: 1,027 of 1,032 tokens already have keys and values
on the machine, so only 5 new tokens are prefilled, a 99.5% hit. A day later nothing is held:
1,032 tokens prefilled, 1032 / 5 = 206 times the work. (Atlas figs 44 and 47 say "906 of 911";
the film uses 1,027 of 1,032 so the warm and cold cases describe the same conversation. Record it.)

**Example B — the capital-of-France cases.** A 770-token shared preamble (system prompt + tool
definitions) and a 7-token question, "What is the capital of France?".
- time t: 777 tokens, hit 0, prefill 777 (on a busy machine the 770 are probably warm already)
- case A, continue the chat a minute later: hit 784, prefill 4 (answer 1 is 7 tokens)
- case B, "…of Japan?": hit 775, prefill 2
- case C, "Tell me the capital of France please": hit 770, prefill 7
- a day later, case A again: hit 770, prefill 18 (7 + 7 + 4)
- your own 7 words: A 7/7, B 5/7, C 0/7; against the whole prompt every case is ≥ 99.1%

**Illustrative preamble (fig 27).** Provider prompt 2,000 + your custom instructions 300 + tool
definitions 450 + one loaded skill 2,000 = 4,750 tokens. Flag it as illustrative. It is a different,
larger example than Example B's 770; do not mix them.

## Terms and where they are first taught

Rely only on what an earlier chapter has taught. If you need a later idea, give a one-line
plain-language version and say it comes back later.

| Term | Taught in |
|---|---|
| weight / parameter, token, logits, softmax, sampling, the generate loop | ch01 |
| HBM / "memory beside the chip", load once, 140 GB ÷ bandwidth; a one-line gloss of byte ("file sizes are counted in bytes", why two waits for ch06); the word amortising, named on the start-up load | ch02 |
| server, data centre, the serving stack, statelessness, context, system prompt, tools, skills | ch03 |
| streaming, open connection, round trip, "the cache" as a running record on the server (contents explained in ch13) | ch04 |
| operation / FLOP, powers of ten, count vs rate, the 300× gap | ch05 |
| GPU vs CPU, bits and bytes, bandwidth, latency vs bandwidth, the two specs, the memory wall | ch06 |
| vector, matrix, matrix–vector multiply, token IDs, embedding lookup, position | ch07 |
| layer, attention, query / key / value, weighted average, context, residual stream, per-layer W_Q/W_K/W_V, parameter count | ch08 |
| HBM physically, read-never-written | ch09 |
| prefill, decode, 2 × parameters, arithmetic intensity of decode = 1, amortise (as a callback: ch02 names it first) | ch10 |
| bound by, arithmetic intensity, log axes, roofline, ridge | ch11 |
| KV cache, causal mask, quadratic vs linear, cache size formula | ch13 |
| prefix match, cache hit, warm and cold | ch15–16 |
| latency vs throughput, TTFT, TPOT, goodput | ch17 |

Before ch10, call prefill "the work of reading the whole prompt in" and decode "making the answer
one token at a time" the first time each is needed. Before ch13, the cache is "a running record the
server keeps of everything it has already processed".

## A chapter title card is added automatically

Each chapter opens with a title card (number + title) that the pipeline generates. Do not narrate
the chapter title. Start straight into the content.

## Per-chapter notes

- **ch00 Cold open** (no figures owned, 60–100 s). Hook: an answer streams at a token about every
  30 ms; the arithmetic for one token takes about 0.1 ms; so more than 99% of the time is spent on
  something other than mathematics. Promise: by the end you will derive the 30 ms from two hardware
  numbers. Close on the film's title, *The Memory Wall*, as its own final beat. Tease; do not teach.
- **ch01** starts from absolute zero: a model is a file of numbers.
- **ch02** derives 30 ms (fig 14) and ends with fig 15's "everything between those two boxes is
  inference".
- **ch03** introduces the production setting. Prefill is not yet taught (see above).
- **ch04** ends with fig 60, the route the series takes, as the close of the "journey" half.
- **ch06** ends on the one line to remember: arithmetic is cheap, data movement is expensive.
- **ch07 / ch08** use the corrected 70B shapes above.
- **ch10** includes fig 115 (attention FLOPs: 5.4 / 21.5 / 335.5 GFLOP at 2,048 / 8,192 / 128,000
  tokens, +4% / +15% / +240%) and fig 116's precision table (FP32 0.5, FP16 1, INT8 2, INT4 4 ops
  per byte; ridge batch 590 / 295 / 148 / 74).
- **ch13** may reorder its figures for teaching: the cache problem and fix (131–137), then the size
  formula (140) decomposed (138–139: one key and one value per layer, 80 layers, 320 KB per token),
  then growth with context (140) and competition with the weights (141).
- **ch14** answers an objection the viewer may now have: if W_K is fixed after training, how can a
  key depend on earlier tokens? Frame it as "a fair question", not as something the viewer asked.
- **ch15 / ch16** use Examples A and B exactly as above.
- **ch17** places fig 55 (a cache hit only shortens prefill, so it helps TTFT and leaves TPOT
  untouched) right after TTFT and TPOT are defined.
- **ch18** recaps the five-link chain, then the road ahead, then a short closing line.
