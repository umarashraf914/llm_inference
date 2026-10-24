# V04 Quantization — depth review

Reviewed: `atlases/V04_Quantization.html` (83 figures), its outline, the 20-second transcript, and the
raw SRT at specific windows. The repo was not modified. I rendered ten figures (24, 35, 43, 45, 48, 60,
67, 74, 76, 77) and read the SVG of several more. Every number below was run in Python. The scripts are
in `scratchpad/review/work/verify1.py` … `verify11.py`. `check_atlas.py` (report mode) finds one fault:
Fig 50, "how many share a scale" has 4 px of room.

---

## 1. Snapshot

**83 figures in 11 parts:**

| Part | Figures |
|---|---|
| The problem | 1–5 |
| What a number actually is | 6–27 (22) |
| The ladder | 28–39 |
| Why a trained network survives | 40–44 |
| Outlier features | 45–50 |
| Where quantization pays | 51–58 |
| The methods | 59–68 |
| The KV cache | 69–72 |
| Granularity | 73–76 |
| Choosing | 77–81 |
| What quantization cannot reach | 82–83 |

**What it does well. Keep these.**

- **The biased exponent is taught all the way to the floor**, in Figs 9–18. It goes from an unsigned
  field to the Kelvin analogy (Fig 12). Then it shows why bias beats two's complement: Fig 13 uses real
  FP16 words, 0.5 = 14,336 and 2.0 = 16,384 against 31,744 and 1,024. All four check out
  (`struct`/`np.float16`). Then come the reserved codes, the 127-not-128 reciprocal argument (Fig 16),
  and a full encode and decode of 6.5. FP16 gives `0 10001 1010000000`, FP32 gives `0x40D00000`; both
  verified. This is the best stretch of ground-floor work in the series so far.
- **The video's own numbers are checked, not repeated.**
  - Fig 31 derives FP16's window from the bias: 2^-14 = 6.10e-5 and (2 − 2^-10)·2^15 = 65,504.
  - Fig 27 shows that "seven digits" needs the hidden bit: 23·log10 2 = 6.92 against 24·log10 2 = 7.22.
  - Fig 20's gaps at exponent 2 are all right: 4.77e-7, 0.0039, 0.031, 0.5 and 1.0.
- **The ground-floor additions in the serving half are excellent.**
  - Fig 57 shows the dequantize step inside W4A16.
  - Fig 58 gives the group-size overhead: 0.5 + 2/g bytes, so 3.20×, 3.56×, 3.76× and 3.88×, all
    verified.
  - Fig 46 makes clear that a channel is a column, not a row.
  - Fig 69 checks 64 × 6,700 tokens × 327,680 B = 140.5 GB.
- **The presenter's caveats are kept.**
  - Fig 76 flags the 88% as vendor-sourced ("from the vendor whose format wins").
  - Fig 79 keeps both cautions.
  - Fig 72 attributes the MLA figures to DeepSeek.

---

## 2. Coverage against the transcript

**Stretches covered thinly or skipped**

| Time | What is said | In the atlas |
|---|---|---|
| 3:06–3:09 | "Below them sit the 8 bit floats then six and four bits." | FP6 is nowhere. FP4 (E2M1) appears only as a bit-split bar in Fig 28; its 15 values are never shown, though Fig 76 depends on them. |
| 6:24–6:45 | "Detm[ers] and his colleagues mapped them in the LLM int 8 paper" | Figs 47–48 never name Dettmers or LLM.int8(). Fig 47 says "in what is described as a phase shift". |
| 10:35–10:47 | "That is what speeds up computebound prefill and decode. Once the batch grows large enough that many tokens again share each weight load…" | Fig 56 aims W8A8 at "compute-bound prefill" only. Large-batch decode is dropped. |
| 10:58, 12:00, 12:43, 13:25 | GPTQ "from Frantar and colleagues in 2022"; SmoothQuant "from Xiao and colleagues at MIT"; AWQ "from the same MIT group"; "SpinQuant from Meta" | Every attribution is dropped, so the reader cannot look any of them up. |
| 14:05–14:27 | "KIVI and KVQuant, two groups working independently" | Fig 71: "Two groups arrived at this same recipe", unnamed. |
| 14:27 | MLA "which we unpacked in the kernels video" | Fig 72 does not point back to V03 Figs 90–92. |
| 16:57 | NVFP4 "within about one accuracy point of BF16 or FP8" | Fig 77 drops "or FP8". |
| 18:25 | "SmoothQuant-style FP8 is the proven recipe, but it only pays off on Hopper or newer" | Fig 81 keeps the hardware rule but loses the recipe. |
| 19:06–19:20 | "Budget for quantization aware training **or distillation from the full precision model**" | Distillation appears nowhere in the atlas. |
| 19:27–19:50 | "every format and method we met was one way or another a plan for handling the outliers" | The video's own recap has no figure. |
| 19:50–20:11 | "So it must be split across many chips and you pay for the communication between them." | Fig 82 drops the communication cost, which is the bridge into V5. |

**Stamp and order problems.** The stamps are monotone; no stamp is out of order. Content is out of
place in these cases:

- **Fig 31 (stamped 3:00)** derives the FP16 window that the video gives at **4:06–4:16**: "Back to the
  two 16-bit formats… roughly 6 × 10^-5 up to about 65,000". Restamp it 4:06 and move it after Fig 35,
  directly before Fig 36, which is where the video returns to FP16.
- **Fig 49 (6:47)**: perplexity is introduced at **7:17**. Restamp it.
- **Figs 41–43 (5:32–5:35)**: "rounding nudges each one up or down independently" is at 5:44–5:47, and
  "Inside the network's long weighted sums, those nudges mostly cancel" is at 5:49. Restamp Fig 43 to
  5:49 so the new figures 13–14 fit before it.
- **Fig 61 (11:12)** puts post-training against quantization-aware training at 11:12, but the video
  introduces that pair at 16:57–17:30. Only calibration belongs here, and it is said at 11:25, so
  restamp it 11:25. The PTQ/QAT half is then repeated in Fig 78.
- **Fig 78 (17:20)** uses the "below about 70 billion" rule that the video states at **19:06**. The
  reader meets "under about 50 billion" in Fig 77 and "below about 70 billion" one figure later with no
  comment. Move the 70B rule into Fig 80, where the video says it, and leave Fig 77's 50B as the
  measured result.

---

## 3. Concept trees

Floor: arithmetic, fractions, ratios, percentages, powers, roots, scientific notation, logs, linear
functions, coordinates, e^x, averages, basic probability, geometry. I also treat the vertex of a
parabola and sine/cosine as high-school floor.

```
T1  Fewer bits, fewer bytes per token                                 [COVERED Fig 01–05]
  every token reads every weight                                      [TAUGHT IN V01 Fig 07, 105, 108]
  bytes = parameters × bytes per weight                               [TAUGHT IN V01 Fig 73] [COVERED Fig 04]
  decode intensity at FP16, batch 1 = 1 op/byte                       [TAUGHT IN V01 Fig 116, 128] [PARTIAL Fig 02 — says 2 ops/byte: wrong, see §5]
  rerouting is exact, shrinking is lossy                              [COVERED Fig 03, 05]
```

```
T2  Binary integers (what an exponent field and an INT8 actually hold)
  bits and bytes                                                      [TAUGHT IN V01 Fig 72–73]
  place value in base two: 110₂ = 4 + 2 = 6                           [MISSING]
    powers of two                                                     floor
  n bits give 2^n codes: 8 bits → 0..255                              [PARTIAL Fig 10, 14 — asserted, never shown]
  a 16-bit word read as one integer (Fig 13's "word = 14,336")        [MISSING — needs place value]
  negative integers
    a spare sign bit, and its two zeros                               [PARTIAL Fig 10]
    two's complement: top bit worth −2^(n−1); INT8 −128..127, INT4 −8..7  [PARTIAL Fig 13 — named and used, not built]
  hexadecimal (Fig 18 "as hex: 0x40D00000")                           [MISSING — explain in one line or drop]
```

```
T3  Binary floating point
  scientific notation: sign, exponent, significand                    [COVERED Fig 06] [TAUGHT IN V02 Fig 86]
  binary fractions: 0.1₂ = 1/2, 1.101₂ = 1.625                        [MISSING — used by Fig 07, 08, 17]
  normalising; the hidden bit; significand ≠ mantissa                 [COVERED Fig 07, 08]
  biased exponent
    unsigned field, signed need                                       [COVERED Fig 10]
    bias as a shift; Kelvin                                           [COVERED Fig 11, 12]
    bias keeps floats sortable as integers                            [COVERED Fig 13 — leans on T2's two's complement]
    reserved codes; bias = 2^(E−1) − 1; why 127 not 128               [COVERED Fig 14–16]
  subnormals: below the smallest normal the floor is a ramp           [MISSING — named in Fig 14 only; Fig 36 contradicts it]
  decode formula, worked both directions                              [COVERED Fig 09, 17, 18]
```

```
T4  Spacing, precision, rounding
  gap = 2^e × 2^−M; each bit removed doubles the gap                  [COVERED Fig 20]
  one value in four grids                                             [COVERED Fig 21]
  relative precision constant, absolute gap grows (staircase)         [COVERED Fig 22] [PARTIAL Fig 33 — drawn as smooth log spacing]
  decimal digits = bits × log10 2, counting the hidden bit            [COVERED Fig 26, 27 — said twice]
  round to nearest; error ≤ half a gap; zero mean                     [COVERED Fig 41, 42 — said twice]
    ties go to the even neighbour (why the mean is zero)              [MISSING]
  float error is relative to the value; integer error is a fixed s/2  [MISSING — the root of every outlier argument]
```

```
T5  The ladder
  FP32: 10^±38, 7 digits                                              [COVERED Fig 26]
  TF32, compute only                                                  [COVERED Fig 28, 29]
  FP16 against BF16; FP16 window 6.1e−5..65,504                       [COVERED Fig 30, 31] [TAUGHT IN V02 Fig 87–88]
  FP8 E4M3 / E5M2
    the split and the forward/backward roles                          [COVERED Fig 32] [TAUGHT IN V03 Fig 75]
    their ranges: max 448 vs 57,344; min 2^−9 vs 2^−16                [MISSING]
    E4M3 bends IEEE rules (no infinity, one NaN) to reach 448 not 240 [PARTIAL Fig 15 — "bend these rules slightly"]
  FP6 (E2M3 max 7.5, E3M2 max 28)                                     [MISSING — said at 3:09]
  FP4 E2M1: every value 0, 0.5, 1, 1.5, 2, 3, 4, 6                    [MISSING — Fig 28 shows only the split]
  INT8 / INT4: no per-value exponent, one shared scale                [COVERED Fig 33]
```

```
T6  Storage format against compute format
  TF32: stored FP32, multiplied TF32, accumulated FP32                [COVERED Fig 29]
  accumulate wider than you multiply                                  [TAUGHT IN V02 Fig 89]
  W4A16: dequantize on chip, multiply in FP16                         [COVERED Fig 57]
    two INT4 values packed per byte                                   [MISSING (minor; one line in Fig 57)]
  W8A8: integer products, scales factored outside the sum             [MISSING]
    pulling a common factor out of a sum                              floor
    INT32 accumulator: 127² × 4,096 = 66 million                      [MISSING]
  memory saving on any chip, maths speed-up only on matching silicon  [COVERED Fig 81, 83]
```

```
T7  Weights against activations
  histogram                                                           [COVERED Fig 23]
  weights bell-shaped near zero, where float ticks crowd              [PARTIAL Fig 24 — the ticks are not drawn]
  activations: most 0–2, a few ~100×                                  [COVERED Fig 25]
  in numbers: INT4 on bell-shaped weights ≈ 12% rms error             [MISSING]
```

```
T8  Integer quantization
  s = max|x| / (2^(b−1) − 1)                                          [COVERED Fig 34]
  round, clamp, dequantize; error ≤ s/2, worked on real numbers       [PARTIAL Fig 34 — formula only; "clamped" unexplained]
  symmetric uses −127..127, leaving −128 unused                       [MISSING]
  zero-point: asymmetric quantization                                 [PARTIAL Fig 34 — one sentence]
  a group shares a scale; storage overhead                            [COVERED Fig 33, 58]
```

```
T9  One outlier against a shared scale
  the scale is set by the max                                         [COVERED Fig 34, 35]
  ordinary values collapse into the bottom ticks                      [COVERED Fig 35, 45]
    in numbers: 0.37 → 0; worst error 39% instead of 0.39%            [MISSING]
    INT4 + 100× outlier: every ordinary value rounds to 0             [MISSING]
  ≈1.3 bits left describing the data                                  [COVERED Fig 35 — caption "six of eight" understates 6.66]
```

```
T10 The training range failure (the video's "training story")
  loss, gradient, weight update                                       [MISSING — V01 Fig 03 "nudge every weight" and V03 Fig 60 "backward pass" never name the slope]
    slope of a line                                                   floor
  gradients underflow in FP16                                         [PARTIAL Fig 36 — threshold wrong]
    subnormal ramp down to 2^−24                                      [MISSING]
  loss scaling                                                        [COVERED Fig 37 — no numbers]
    gradients are proportional to the loss, so ×S then ÷S is exact    [MISSING]
  BF16: range beats precision for training                            [COVERED Fig 38] [TAUGHT IN V02 Fig 87–88]
  no gradients at inference                                           [COVERED Fig 39]
```

```
T11 Why a trained network survives rounding
  overparameterized                                                   [COVERED Fig 40]
  a layer output is a weighted sum                                    [TAUGHT IN V01 Fig 05, 111; V03 Fig 14]
  one rounded weight moves the output by error × input                [MISSING — the root of GPTQ, AWQ and SmoothQuant]
    distributive law                                                  floor
  independent errors partly cancel: total ~ √n                        [PARTIAL Fig 43 — asserted]
    average square of a sum of independent ±1s is n                   [MISSING]
      averages, basic probability                                     floor
    "units of error" = one term's typical error                       [MISSING]
  correlated errors add to n                                          [COVERED Fig 43]
```

```
T12 Outlier features
  a channel is one column across tokens                               [COVERED Fig 46]
  fixed channels; abrupt emergence at 6.7B                            [COVERED Fig 47]
  150,000 outliers in 6 channels; zeroing them breaks the model       [COVERED Fig 48]
  perplexity = exp(average −ln p)                                     [PARTIAL Fig 49 — formula and reading, no worked case]
    probability the model gives the true next token                   [TAUGHT IN V01 Fig 08–09]
    ln and e^x                                                        floor
  source: Dettmers et al., LLM.int8()                                 [MISSING]
```

```
T13 Where quantization pays
  roofline, ridge 295                                                 [TAUGHT IN V01 Fig 121–126] [COVERED Fig 51]
  quantization only moves points right                                [COVERED Fig 52]
  prefill compute-bound, decode memory-bound                          [TAUGHT IN V01 Fig 109, 128–129] [COVERED Fig 53, 54]
  decode intensity = 2B / bytes per weight                            [TAUGHT IN V01 Fig 116] [COVERED Fig 55]
    the KV cache's bytes count too                                    [MISSING caveat]
  W8A8 also lifts the compute ceiling (ridge 591)                     [MISSING]
  large-batch decode turns compute-bound (10:35)                      [PARTIAL Fig 55, 56]
```

```
T14 GPTQ — one weight at a time, nudge the rest                       [PARTIAL Fig 60, 62, 63 — says what, not how]
  rounding one weight changes the output by (weight error) × (input)  [MISSING — Fig 62 states it in one line]
    a layer output is a weighted sum                                  [TAUGHT IN V01 Fig 05, 111; V03 Fig 14]
    (w + e)·x = w·x + e·x                                             floor
  judge the damage over many real inputs: mean squared output error   [MISSING]
    calibration data                                                  [COVERED Fig 61]
    squares and averages                                              floor
  when two inputs move together, one weight can cover for another     [MISSING]
    average of x1·x2: large when they move together                   [MISSING]
  the best nudge is the bottom of a parabola: δ = −e·Σx1x2 / Σx2²     [MISSING]
    vertex of a quadratic                                             floor
  Hessian = 2·Σ x xᵀ: diagonal = loudness, off-diagonal = co-movement  [PARTIAL Fig 62 — "a statistic of the inputs", "an input covariance"]
    matrix, transpose                                                 [TAUGHT IN V01 Fig 84; V03 Fig 19]
    "second-order" = the error is a quadratic bowl                    [MISSING]
  sequential order                                                    [COVERED Fig 60]
  never singles out outliers                                          [COVERED Fig 63]
  3-bit 175B on one 80 GB GPU                                         [PARTIAL Fig 63 — no numbers]
```

```
T15 W4A16 against W8A8
  notation, the two targets                                           [COVERED Fig 56]
  W4A16 internals                                                     [COVERED Fig 57]
  W8A8 internals (integer GEMM, scales outside)                       [MISSING — see T6]
  halving bits doubles tensor-core throughput                         [TAUGHT IN V02 Fig 84–85] [COVERED Fig 56]
```

```
T16 SmoothQuant
  activations hard, weights easy                                      [COVERED Fig 64]
  why activations cannot just take a per-channel scale                [MISSING — Fig 46/47 captions imply they can]
    factoring out of a sum                                            floor
  (x/s)·(s·w) = x·w                                                   [COVERED Fig 64]
  choosing s = max|X|^α / max|W|^(1−α); α = ½ → geometric mean        [MISSING]
    square roots                                                      floor
  Xiao et al., MIT                                                    [MISSING]
```

```
T17 AWQ
  salient ~1% found by activation size                                [COVERED Fig 65]
    why activation size: error × input                                [MISSING — T11]
  scaling by s before rounding divides that weight's error by s       [MISSING — Fig 65 gives only the outcome]
  limit: overscaling raises the group max and coarsens everyone       [MISSING]
```

```
T18 Rotation (QuaRot, SpinQuant)
  a 2-D rotation turns a vector without stretching it                 [MISSING]
    Pythagoras, sine and cosine                                       floor
  orthogonal: QᵀQ = I; dot products preserved                         [PARTIAL Fig 66 — algebra only, notation garbled]
    identity matrix, inverse                                          [MISSING]
    transpose                                                         [TAUGHT IN V03 Fig 19]
  (XQᵀ)(QW) = XW                                                      [COVERED Fig 66]
  an outlier A spreads to ≈ A/√n per channel                          [PARTIAL Fig 67 — no numbers, unsigned bars]
  Hadamard: ±1 entries, doubling construction                         [PARTIAL Fig 68 — stated]
  n log n: the butterfly                                              [PARTIAL Fig 68 — stated]
    logarithms                                                        floor
  payoff measured: INT4 error 4.7× lower in a worked case             [MISSING]
  FA3 used the same trick                                             [TAUGHT IN V03 Fig 76 (stated there, not built)]
  QuaRot fixed, SpinQuant learned (Meta)                              [COVERED Fig 68 — Meta dropped]
```

```
T19 KV-cache quantization
  cache size, 320 KB per token                                        [TAUGHT IN V01 Fig 138–141; V03 Fig 82] [COVERED Fig 69]
  KV heads, GQA                                                       [TAUGHT IN V03 Fig 88–89]
  no offline calibration; early errors leak forward                   [COVERED Fig 70] [TAUGHT IN V01 Fig 36, 39]
  keys per channel, values per token                                  [COVERED Fig 71 — no numbers; KIVI/KVQuant unnamed]
  MLA: cache a latent                                                 [TAUGHT IN V03 Fig 90–92] [COVERED Fig 72]
    the 93.3% = latent + ~6-bit cache quantization                    [MISSING — VERIFY configs]
```

```
T20 Granularity and block formats
  per tensor → channel/token → block                                  [COVERED Fig 73 — not to scale; "spoils one row"]
  containment; block floating point                                   [COVERED Fig 74 — the damage is not drawn]
  scales stored with blocks                                           [PARTIAL Fig 75 — overclaims "one fetch"]
  MXFP4: 32-block, E2M1 elements, E8M0 power-of-two scale             [PARTIAL Fig 76 — no E2M1 grid]
    what a power-of-two scale does to one block                       [PARTIAL Fig 76 — "off by up to a factor of two", unshown]
  NVFP4: 16-block, E4M3 scale, plus FP32 per tensor                   [PARTIAL Fig 76 — the FP32 level is unexplained]
  cost per value: 4.25 vs 4.5 bits                                    [MISSING]
  vendor's 88%                                                        [COVERED Fig 76, flagged]
```

```
T21 Model size, and rescuing small models
  large models within ~1 point; under 50B lose 4–14                   [COVERED Fig 77 — not to scale]
    what an accuracy point is                                         [MISSING (one line)]
  redundancy explanation, unmeasured                                  [COVERED Fig 77, 79]
  PTQ against QAT                                                     [COVERED Fig 61, 78 — twice, same caption]
    how QAT trains through a rounding step (straight-through)         [MISSING]
  sensitive layers kept at higher precision                           [COVERED Fig 78]
  distillation from the full-precision model                          [MISSING — said at 19:13]
  vendor numbers as upper bounds                                      [COVERED Fig 79]
```

```
T22 Choosing, and the wrap-up
  profile first: >80% of HBM bandwidth means memory-bound             [PARTIAL Fig 80 — rule, no arithmetic]
    achieved bandwidth = bytes per step / step time                   [TAUGHT IN V01 Fig 63, 74–75]
  match format to silicon (FP8 Hopper/Ada, NVFP4 Blackwell, INT8 Ampere)  [PARTIAL Fig 81 — see §5]
  every method is a plan for the outlier                              [MISSING — the video's recap, 19:35]
  two limits: capacity → parallelism; waste → MoE                     [COVERED Fig 82 — communication cost dropped]
```

---

## 4. Proposed new figures (video order)

**38 entries.** Entry 20 replaces Fig 62. Entry 5 is optional. Expressions are Python; "sim" means a
seeded NumPy simulation, which is in the work scripts.

### Group A — the binary floor (0:52–1:24). Fills T2, T3, T4.

**1. After Fig 06 (0:52): *Base two counts in powers of two***
- **Idiom:** bit layout. Eight columns headed 128 64 32 16 8 4 2 1. Three rows:
  - `00000110` = 6
  - `10000001` = 129, the exponent field Fig 18 decodes
  - `11111111` = 255

  Under them: 8 bits make 256 patterns, 5 bits make 32.
- **Fills:** T2 place value; n bits → 2^n codes.
- **Numbers:** `int('110',2)`=6; `int('10000001',2)`=129; `int('11111111',2)`=255; `2**8`=256; `2**5`=32.

**2. After entry 1 (0:52): *Bits after the point are halves, quarters and eighths***
- **Idiom:** number line from 0 to 2, ticked at 1/2, 1/4 and 1/8.
- **Worked:** 110.1₂ = 4 + 2 + 0.5 = 6.5, and 1.101₂ = 1 + 0.5 + 0.125 = 1.625. The atlas uses both
  later without building them (Figs 7, 8, 17).
- **Closing line:** decimal 0.1 has no finite binary form. FP32 stores 0.10000000149, FP16 stores
  0.0999755859375. Every format rounds; only the size of the rounding changes.
- **Fills:** T3 binary fractions.
- **Numbers:** `float(np.float32(0.1))`; `float(np.float16(0.1))`.

**3. After Fig 12 (1:12), before Fig 13: *Negative integers: the top bit counts as minus***
- **Idiom:** number line labelled with 5-bit codes: `10000` = −16 … `11111` = −1, `00000` = 0 …
  `01111` = 15. The rule: the top bit is worth −16.
- **Why here:** this makes Fig 13's "two's complement" legible. It also gives INT8 −128..127 and INT4
  −8..7, which Figs 33–35 and 44 use.
- **Fills:** T2 two's complement.
- **Numbers:** `format(-1 & 31,'05b')`='11111'; `format(-16 & 31,'05b')`='10000'.

**4. After Fig 14 (1:12): *Below the smallest normal number, precision drains away before the value reaches zero***
- **Idiom:** number line on a log axis from 1e-9 to 1e-3, in three bands:
  - normal: ≥ 2^-14 = 6.10e-5
  - subnormal: spacing fixed at 2^-24 = 5.96e-8
  - exactly zero: < 2^-25 = 2.98e-8

  A strip of examples beneath:

  | Value | FP16 stores | Error |
  |---|---|---|
  | 3e-5 | 2.998e-5 | 0.06% |
  | 1e-6 | 1.013e-6 | 1.3% |
  | 1e-7 | 1.19e-7 | 19% |
  | 2.9e-8 | 0 | — |
- **Fills:** T3 and T10 subnormals. This is the correction Fig 36 needs (see §5).
- **Numbers:** `np.float16(x)` for each value; `2**-24`, `2**-25`.

**5. (optional) After Fig 21 (1:24): *A tie goes to the even neighbour, so rounding has no lean***
- **Idiom:** number line of E5M2 from 4 to 8. 6.5 sits exactly halfway between 6 = 1.10₂·2² and
  7 = 1.11₂·2²; the rule picks the mantissa ending in 0, which is 6.
- **Why:** always rounding ties up would push every sum upward. Splitting ties keeps the mean error at
  zero, and that is the "unbiased" property Figs 41–43 spend.
- **Fills:** T4 ties.
- **Numbers:** E5M2 values in [4, 8] are 4, 5, 6, 7, 8 (enumeration, `verify2.py`).

### Group B — the rest of the ladder (3:09–3:12). Fills T5.

**6. After Fig 32 (stamp 3:09): *Below eight bits: six and four***
- **Idiom:** number line showing every FP4 E2M1 value: ±{0, 0.5, 1, 1.5, 2, 3, 4, 6}, 15 distinct
  values. The steps grow 0.5, 0.5, 0.5, 0.5, 1, 1, 2: the float staircase in miniature.
- **Plus a line for FP6:** E2M3 reaches 7.5, E3M2 reaches 28.
- **Fills:** FP6 (said at 3:09, absent) and the FP4 grid that Fig 76 depends on.
- **Caution for the body text:** do not claim FP4 beats INT4 on weights. In my simulation on Gaussian
  blocks, INT4 is slightly better at block 16 and 32 (rms 0.086 vs 0.094) and FP4 is better at 128
  (0.109 vs 0.118). Sim in `verify11.py`.
- **Numbers:** enumeration in `verify2.py`; `(1+7/8)*2**2`=7.5; `(1+3/4)*2**4`=28. The FP6 layouts are
  VERIFY against the OCP MX v1.0 tables.

**7. After entry 6 (3:12): *How far each eight-bit float reaches***
- **Idiom:** range bars to scale on a log₂ axis, all on one axis:
  - E4M3: 2^-9 (0.00195) to 448, 17.8 powers of two
  - E5M2: 2^-16 (1.5e-5) to 57,344, 31.8 powers of two
  - FP16: 5.96e-8 to 65,504
- **Note in the body:** E4M3 keeps exponent code 15 for real numbers (only S.1111.111 is NaN, and there
  is no infinity). That is how it reaches 448 instead of the 240 an IEEE-style layout gives. This makes
  Fig 15's "bend these rules slightly" concrete.
- **Fills:** T5 FP8 ranges. V03 Fig 75 gives only the bit counts.
- **Numbers:** enumeration gives max 448 / 240 / 57,344; `math.log2(448)+9`=17.81;
  `math.log2(57344)+16`=31.81.

### Group C — integer quantization by hand (3:44–3:55). Fills T8, T9.

**8. After Fig 34 (3:44): *Quantizing five numbers by hand***
- **Idiom:** table with columns x, x/s, round, x̂ = s·q, error.
  - x = 0.12, −0.5, 0.33, 0.9, −0.07
  - s = 0.9/127 = 0.00709
  - q = 17, −71, 47, 127, −10
  - x̂ = 0.1205, −0.5031, 0.3331, 0.9000, −0.0709
  - every |error| ≤ s/2 = 0.00354
- **One line:** −128 goes unused so the grid stays symmetric.
- **Fills:** T8 round, dequantize, error bound; −127..127.
- **Numbers:** `verify5.py` I.

**9. After entry 8 (3:44): *A zero-point slides the grid to where the data is***
- **Idiom:** small multiples. Two INT4 number lines for data spanning −1 to 6.5:
  - Symmetric (−7..7): s = 6.5/7 = 0.929. Codes −7..−2 are never used; only 9 of 15 codes are.
  - Asymmetric (0..15): s = 7.5/15 = 0.5, z = 2. Real 0 lands exactly on code 2.
- **Built term by term:** q = round(x/s) + z, then x̂ = s·(q − z). Values outside the range clamp to 0
  or 15, which says what "clamped" in Fig 34 means.
- **Fills:** T8 zero-point, clamp.
- **Numbers:** `7.5/15`=0.5; `round(1/0.5)`=2; `6.5/7`=0.929; step ratio 1.86.

**10. After Fig 35 (3:55): *The outlier's price is paid by every ordinary value***
- **Idiom:** small multiples. Zoomed INT8 number lines over 0..1:
  - group max 1: step 0.0079, 0.37 → 0.3701, worst error on a value near 1 is 0.39%
  - group max 100: step 0.787, 0.37 → 0, worst error 39%
- **Body:** a float's error is a fixed fraction of the value; an integer's is a fixed s/2 for every
  member of the group. That is why a shared scale punishes the small values.
- **Fills:** T4 relative vs absolute error; T9 in numbers.
- **Numbers:** `100/127`=0.787; `round(0.37/(100/127))`=0; `round(0.37*127)/127`=0.3701.
- **Then:** move Fig 31 here, restamped 4:06.

### Group D — the training side branch (4:14–4:31). Fills T10.

**11. Before Fig 36 (4:14): *A gradient is a slope, and a zero slope teaches nothing***
- **Idiom:** graph of loss against one weight, with a tangent line. Slope = change in loss ÷ change in
  weight. The update is w ← w − (learning rate × slope); if the slope is stored as 0, the weight never
  moves.
- **Fills:** T10 gradient, loss, update. V01 Fig 03 says "nudge every weight" but never names the slope.
- **Numbers:** schematic. Say so in the caption.

**12. After Fig 37 (4:31): *Loss scaling, followed through one gradient***
- **Idiom:** log number line from 1e-9 to 1e-2 with FP16's zero band marked, following one value:
  - g = 1e-8 rounds to FP16 0
  - × 65,536 gives 6.5536e-4, stored as 6.5517e-4
  - ÷ 65,536 in FP32 gives 9.997e-9, 0.03% off
- **Body:** every gradient is proportional to the loss, so scaling the loss scales all of them. That is
  why the update comes out unchanged.
- **Fills:** T10 loss scaling mechanism.
- **Numbers:** `verify5.py` loss-scaling line.

### Group E — why rounding survives (5:44–5:49). Fills T11 and the root of T14.

**13. Replacing the merged Fig 41/42 pair's second slot (5:46): *Rounding one weight moves the output by its error times its input***
- **Idiom:** equation built up term by term.
  - y = 0.31·1.0 + (−0.72)·0.5 + 0.18·2.0 + 0.55·(−1.5) = −0.515
  - On a 0.25 grid the weights become 0.25, −0.75, 0.25, 0.5
  - Errors: −0.06, −0.03, +0.07, −0.05
  - Error × input: −0.06, −0.015, +0.14, +0.075
  - The output moves by +0.14 (to −0.375). The four pushes total 0.29 in size but partly cancel.
- **Fills:** T11 and T14's root node. The brief's "weight-error × input" node, used again by GPTQ
  (11:30: "An error on a weight matters exactly as much as the input it multiplies"), AWQ and
  SmoothQuant.
- **Numbers:** `verify10.py` N14.

**14. Before Fig 43, restamped 5:49: *Independent nudges grow like the square root of their number*** — **WIDGET**
- **Widget:** flip n coins (±1), plot the running sum, repeat 200 times. The spread tracks √n; a slider
  runs n from 4 to 4,096.
- **Static fallback:** three random walks with ±√n envelopes at n = 16, 256 and 4,096, giving 4, 16
  and 64.
- **The rule:** each ±1 adds 1 to the average square of the sum, and the cross terms average to zero.
  So the average square is n and the typical size is √n.
- **Body:** "units of error" in Fig 43 means one term's typical error.
- **Fills:** T11 √n.
- **Numbers:** `sqrt(4096)`=64; sim: RMS of a sum of 4,096 U(−½, ½) = 18.2 against √(4096/12) = 18.5.

### Group F — outlier features (7:17). Fills T12.

**15. After Fig 49, restamped 7:17: *Perplexity, worked on four tokens***
- **Idiom:** table, then the equation built up.
  - Probabilities the model gave the true next tokens: 0.5, 0.25, 0.1, 0.8
  - −ln p: 0.693, 1.386, 2.303, 0.223
  - Mean 1.151, and e^1.151 = 3.16, the geometric mean of 1/p
  - Anchors: p = 0.5 everywhere gives perplexity 2; p = 0.1 gives 10
  - Perplexity 10 × 7 = 70 means as unsure as picking among 70 options
- **Fills:** T12 perplexity. Softmax probabilities are [TAUGHT IN V01 Fig 08–09].
- **Numbers:** `verify9.py`.

### Group G — two strategies inside the matmul (9:51–10:14). Fills T13, T6, T15.

**16. After Fig 56 (9:51): *W4 A16 and W8 A8 move different lines of the roofline***
- **Idiom:** small multiples. Three log-log rooflines:
  - FP16: ridge 295
  - W4A16: same ceiling, intensity ×4, reaches the ridge at batch 74
  - W8A8: ceiling ×2, so the ridge moves to 591; intensity ×2, so batch-to-ridge stays about 295 —
    but every point sits 2× higher
- **What it shows:** this is the 10:35 claim. W8A8 also speeds up decode once the batch is large.
- **Fills:** T13 ridge shift; T15.
- **Numbers:** `989e12/3.35e12`=295; `1979e12/3.35e12`=591. VERIFY the H100 SXM dense FP16/FP8/INT8
  datasheet peaks (989 / 1,979 / 1,979).

**17. After Fig 57 (10:14): *Inside a W8 A8 matmul the integers multiply and the scales wait outside the sum***
- **Idiom:** equation built up: y = Σ x_j w_j = Σ (a·q_j)(b·r_j) = a·b·Σ q_j r_j. One per-token scale
  `a` and one per-output-channel scale `b` come out of the sum. The sum itself is pure integer tensor-core
  work, followed by one float multiply per output.
- **Accumulator:** the largest possible sum, 127 × 127 × 4,096 = 66,064,384, fits in INT32 (max
  2,147,483,647) but not INT16 (max 32,767). That is why integer matmuls accumulate in INT32. Float accumulation is
  [TAUGHT IN V02 Fig 89].
- **Fills:** T6 integer GEMM.
- **Numbers:** `127*127*4096`.

### Group H — GPTQ from "error × input" (11:08–11:50). Fills T14. The core build-up.

**18. After Fig 60 (11:08): *Two weights fed the same input: round one, and the other can pay it back***
- **Idiom:** two number lines (w1 and w2 on an integer grid) above output-error bars.
- **Setup:** w = (0.4, 0.4), with x1 = x2 on four calibration inputs (1, 2, −1, 0.5).
  - Round-to-nearest gives (0, 0); output error −0.8·x; mean square 1.0.
  - GPTQ rounds w1 to 0 (error −0.4), nudges w2 to 0.8, then rounds it to 1. Output error +0.2·x;
    mean square 0.0625, 16× smaller.
- **Fills:** T14 compensation; correlated inputs.
- **Numbers:** `verify6.py` N.

**19. After entry 18 (11:13): *The right nudge is the bottom of a parabola*** — **WIDGET**
- **Equation built up:** the leftover error on each input is e1·x1 + δ·x2. Its mean square is
  e1²·Σx1² + 2·e1·δ·Σx1x2 + δ²·Σx2² (each sum averaged), a parabola in δ. It is lowest at
  δ = −e1·Σx1x2 / Σx2².
- **Worked:** 200 inputs with correlation 0.82 give averages 0.86, 0.71 and 0.88. For e1 = −0.4 that
  makes δ = +0.32, and the mean-square output error drops from 0.507 to 0.113 (4.5×).
- **Widget:** a correlation slider and a δ slider, drawing the parabola. "Second-order" means exactly
  this: the error is a quadratic.
- **Fills:** T14 parabola vertex.
- **Numbers:** `verify6.py` partial-correlation case (seeded).

**20. Replaces Fig 62 (11:20): *The Hessian is a table of input products***
- **Idiom:** grid. First the 2×2 worked case, H = 2·[[Σx1², Σx1x2], [Σx1x2, Σx2²]], then the shape for
  4,096 inputs: 16,777,216 entries.
  - The diagonal is how loud each input is, which is how much its weight's error costs.
  - The off-diagonal is how much two inputs move together, which is whether one weight can cover for
    another.
  - Entry 19's nudge is off-diagonal over diagonal. GPTQ applies the same rule to every remaining
    weight at once through H⁻¹. Checked: the OBS update vector is (−0.4, 0.3235), identical to entry
    19's δ.
- **Wording:** it is XXᵀ, uncentred. "Covariance" (Fig 62's caption) is only exact for zero-mean
  inputs.
- **Fills:** T14 Hessian. The video's "just a statistic of the inputs" (11:23).
- **Numbers:** `4096**2`; `verify6.py` OBS line. The calibration-set size (128 × 2,048-token segments)
  is VERIFY against the GPTQ paper.

*Then Fig 61, trimmed to calibration only and restamped 11:25.*

**21. After Fig 63 (11:50): *Three bits is what put 175 billion parameters on one GPU***
- **Idiom:** bars to scale against an 80 GB line:
  - FP16: 350 GB
  - 4-bit: 87.5 GB, does not fit
  - 3-bit: 65.6 GB, fits
- **Fills:** T14's last node.
- **Numbers:** `175e9*2`, `175e9*0.5`, `175e9*3/8` (scales ignored). VERIFY that the paper's single-GPU
  run was 3-bit on an 80 GB A100.

### Group I — SmoothQuant (12:00–12:21). Fills T16.

**22. Before Fig 64 (12:00): *A scale on the summed dimension cannot come out of the sum***
- **Idiom:** equation, continuing entry 17. With a per-input-channel activation scale c_j,
  y = Σ (c_j·q_j)(b·r_j). Because c_j changes from term to term, it stays inside the sum, so the
  integer path is lost.
- **The way out:** move c_j into the weights offline, x_j·w_j = (x_j/c_j)·(c_j·w_j). The weights are
  quantized after the move. That is SmoothQuant.
- **Also fixes:** the Fig 46/47 captions, which imply a per-channel activation scale simply works.
- **Fills:** T16 why activations cannot take per-channel scales.

**23. After Fig 64 (12:21): *Choosing S: the two maxima meet at their geometric mean*** — **WIDGET**
- **Idiom:** before/after bars on a log scale for one channel.
  - Activation max 50, weight max 0.1.
  - s = 50^α / 0.1^(1−α); at α = ½, s = √500 = 22.36.
  - Both become 2.236 = √(50 × 0.1).
  - A normal activation channel with max 1 goes from ±3 INT8 levels (scale 50/127) to ±57.
- **Widget:** an α slider from 0 to 1 showing the two maxima trading off.
- **Fills:** T16 choosing S.
- **Numbers:** `verify6.py` O. VERIFY the formula against the SmoothQuant paper's equation for s_j.

### Group J — AWQ (12:50). Fills T17.

**24. After Fig 65 (12:50): *Scaling a weight up before rounding divides its error***
- **Idiom:** small multiples of number lines at s = 1, 2 and 4, all with the same grid step Δ = 0.1
  (set by the group's largest weight, which is elsewhere).
  - w = 0.37 with input 10. At s = 1 it is stored as 0.4: output error +0.30. At s = 2 it is stored as
    0.7 and used as 0.35 (the 1/s rides on the activation): output error −0.20.
  - Across many weights the rms error goes 0.0289 → 0.0144 → 0.0072, which is Δ/(s√12).
- **Which weights:** the ones with large inputs, from entry 13.
- **The limit:** overscale and that weight becomes the group max, coarsening Δ for everyone. That is
  why the scale is searched rather than maximised.
- **Fills:** T17.
- **Numbers:** `verify6.py` P. VERIFY AWQ's search form s = s_X^α.

### Group K — rotation (13:00–13:27). Fills T18.

**25. Before Fig 66 (13:00): *A rotation turns a vector without stretching it*** — **WIDGET**
- **Idiom:** coordinate plane.
  - (8, 0) rotated by 45° becomes (5.66, 5.66).
  - Its length is 8 both times: 5.66² + 5.66² = 64.
  - The largest coordinate falls from 8 to 5.66.
  - For a = (3, 1) and b = (2, −1), the dot product is 5 before and after.
- **Widget:** drag the angle.
- **Fills:** T18 geometric meaning.
- **Numbers:** `verify7.py` Q.

**26. After Fig 66 (13:03), or as Fig 66's missing drawing: *QᵀQ = I, checked on a two-by-two***
- **Idiom:** equation built up. Q = [[0.707, −0.707], [0.707, 0.707]]; Qᵀ turns the other way.
  Multiplying out gives 0.707² + 0.707² = 1 on the diagonal and 0 off it. That is I, the matrix that
  changes nothing.
- **Fills:** T18 identity and inverse. Transpose is [TAUGHT IN V03 Fig 19].
- **Numbers:** `R.T@R` in `verify7.py`.

**27. After Fig 68 (13:20): *A Hadamard matrix is a rotation built from plus and minus ones***
- **Idiom:** a ±1 grid for H4 = ½·[[1,1,1,1], [1,−1,1,−1], [1,1,−1,−1], [1,−1,−1,1]], plus bars to
  scale.
  - x = (1, −1, 1, 20) becomes (10.5, −8.5, −10.5, 10.5).
  - The max falls from 20 to 10.5; the length is 20.075 both times.
  - Doubling rule: H₂ₙ = [[H, H], [H, −H]].
  - An outlier A spreads to about A/√n per channel: 100/√4096 = 1.56.
- **Fills:** T18 Hadamard and the 1/√n spread.
- **Numbers:** `verify7.py`, `verify8.py`.

**28. After entry 27 (13:22): *n log n: the butterfly***
- **Idiom:** butterfly network for n = 8: 3 stages of 4 add/subtract pairs.
- **Count:** n·log₂n = 4,096 × 12 = 49,152 additions against 16,777,216 multiply-adds for a dense
  rotation, 341× fewer.
- **Fills:** T18 n log n.
- **Numbers:** `verify7.py` R.

**29. After entry 28 (13:27; "Rotation is what finally makes 4-bit activations workable"): *What the rotation buys, measured***
- **Idiom:** summary bars to scale. 4,096 values drawn from N(0, 1) plus one at 100, per-tensor INT4.
  - No rotation: every ordinary value rounds to 0; rms error 1.00.
  - Hadamard first: max 5.1; rms error 0.21, 4.7× smaller.
- **Fills:** T18 payoff.
- **Numbers:** `verify7.py` Q2 (seed 0).

### Group L — KV cache (14:20–14:50). Fills T19.

**30. After Fig 71 (14:20): *Keys need their scale down the column: the numbers***
- **Idiom:** small-multiple heatmaps. K is 3 tokens × 4 channels, with channel 3 hot (12, 11, 13).
  - Per-token INT4 scales are 1.71, 1.57 and 1.86: every ordinary entry becomes 0 (rms error 0.365).
  - Per-channel scales are 0.071, 0.086, 1.857 and 0.057: ordinary entries kept (rms error 0.023,
    16× smaller).
- **Fills:** T19. Name KIVI and KVQuant in the body.
- **Numbers:** `verify10.py` N33.

**31. After Fig 72 (14:50): *DeepSeek's 93.3% is the latent and quantization together***
- **Idiom:** bars to scale, values cached per token.
  - DeepSeek 67B: 95 layers × 2 × 8 KV heads × 128 = 194,560
  - DeepSeek-V2: 60 layers × (512 + 64) = 34,560
  - At equal 16-bit precision that is 82.2% smaller.
  - With V2's cache at about 6 bits on average, as its paper reports deploying, it is
    1 − (34,560 × 6)/(194,560 × 16) = **93.34%**.
- **Fills:** T19. Both of the video's 14:47 answers ("shrinks every cache number" and "caches fewer
  numbers") are inside the one headline number.
- **Numbers:** `verify4.py`. VERIFY both configs (DeepSeek LLM Table 2; DeepSeek-V2 §3.2.3). The
  arithmetic match to four figures is strong but rests on configs I recalled from memory.

### Group M — block formats (16:15–16:40). Fills T20.

**32. After Fig 76 (16:15): *A power-of-two scale can only move in factors of two*** — **WIDGET**
- **Idiom:** small multiples. Each block's values mapped onto the FP4 grid under each scale:

  | Block max | MXFP4 scale (OCP rule 2^(⌊log₂ amax⌋ − 2)) | MXFP4 result | NVFP4 scale (amax/6, nearest E4M3) | NVFP4 result |
  |---|---|---|---|---|
  | 11 | 2 | 5.5 → 6 → reads 12 (error 1.0) | 1.875 | 5.87 → 6 → 11.25 (error 0.25) |
  | 7 | 1 | 7 clips to 6 (error 1.0) | 1.125 | 6.22 → 6 → 6.75 (error 0.25) |

- **Widget:** drag the block max and watch both scales step.
- **Fills:** T20 "off by up to a full factor of two" (16:15).
- **Numbers:** `verify10.py` N36. VERIFY the MX rule (OCP MX v1.0 §6.3) and NVIDIA's E4M3 block-scale
  recipe.
- **A check, not for the figure:** my toy simulation gives NVFP4 32% lower MSE than MXFP4 on Gaussian
  data and 60% lower on heavy-tailed t₃ data — not 88% (`verify8.py`). The atlas's vendor caveat is
  well placed; keep it.

**33. After entry 32 (16:35): *NVFP4's second scale exists because FP8 cannot reach every block***
- **Idiom:** log number line. E4M3 covers 2^-9 to 448, about 2^17.8. One FP32 factor per tensor slides
  every block scale into that window.
- **Fills:** the unexplained "+ FP32" box in Fig 76.
- **Numbers:** `448/2**-9`=229,376 = 2^17.81. VERIFY against NVIDIA's NVFP4 description.

**34. After entry 33 (16:40): *What the scales cost: 4.25 and 4.5 bits per value***
- **Idiom:** bars to scale, as in Fig 58.

  | Format | Bits per value | Smaller than FP16 |
  |---|---|---|
  | MXFP4 | 4 + 8/32 = 4.25 | 3.76× |
  | NVFP4 | 4 + 8/16 = 4.5, plus one FP32 per tensor | 3.56× |
  | INT4, group 128, FP16 scale | 4.125 | 3.88× |
- **Fills:** T20 cost per value. Ties block formats back to Fig 58.
- **Numbers:** `verify3.py`.

### Group N — choosing and closing (17:30–19:35). Fills T21, T22.

**35. After Fig 78 (17:30): *Quantization-aware training rounds going forward and pretends it did not going back***
- **Idiom:** graph of the rounding staircase (slope 0 almost everywhere) overlaid with the straight
  line the backward pass uses instead. A full-precision copy of the weights keeps moving.
- **Fills:** T21 QAT mechanism. Uses entry 11's slope.
- **Numbers:** schematic. VERIFY the name "straight-through estimator" and its source.

**36. After Fig 80 (18:02): *Reading the 80% rule***
- **Idiom:** count against rate. Achieved bandwidth = bytes per step ÷ step time.
  - 140 GB in 50 ms = 2.8 TB/s = 84% of 3.35 TB/s: memory-bound.
  - The same step taking 100 ms = 42%: the bottleneck is somewhere else.
- **Fills:** T22 profiling. Count against rate is [TAUGHT IN V01 Fig 63, 74–75].
- **Numbers:** `140e9/0.05/3.35e12`.

**37. After Fig 81 (19:13): *Distillation copies the full model's probabilities, not just its answers***
- **Idiom:** two probability bar charts. The BF16 teacher's next-token shares (V01 Fig 09's cat
  74.5%, dog 24.8%, the 0.68%, banana 0.03%) beside a 4-bit student trained to match the whole shape,
  not just "cat".
- **Fills:** T21 distillation (19:13, absent).
- **Numbers:** softmax of [8.2, 7.1, 3.5, 0.4] = [74.49, 24.80, 0.68, 0.03]%, checked.

**38. Before Fig 82 (19:35): *Every method here was a plan for the outlier***
- **Idiom:** table, one row per technique: what it does to the outlier.

  | Technique | What it does to the outlier |
  |---|---|
  | Group/block scales | contain it |
  | GPTQ | let the other weights absorb its error |
  | SmoothQuant | move it into the weights |
  | AWQ | protect the weights it multiplies |
  | QuaRot / SpinQuant | smear it across channels |
  | KIVI / KVQuant | give its channel its own scale |
  | MLA | store fewer numbers |
  | NVFP4 | a finer scale per smaller block |
- **Fills:** T22 recap, which is the video's own sentence at 19:35–19:50.

---

## 5. Problems in existing figures

### Factual and numeric errors

1. **Fig 02** — "Decode does about two operations for every byte it moves… A gap of about 150x."
   - At FP16 and batch 1, decode does 2 ops/parameter ÷ 2 bytes/parameter = **1 op/byte**. V01
     Figs 116, 128 and 129 say so, and this atlas's own Fig 55 says "FP16… I = 1B". The gap is
     `989e12/3.35e12` = **295×**.
   - Fix: "about one operation per byte… a gap of about 300×". Redraw the bar at 1 against 295.
2. **Fig 36** — draws "underflows to exactly zero" directly under FP16's 6e-5 floor.
   - That is only the smallest normal (2^-14). Subnormals continue down to 2^-24 = 5.96e-8, and a value
     becomes exactly 0 only below 2^-25 = 2.98e-8: `np.float16(2.9e-8)` = 0, while
     `np.float16(1e-7)` = 1.19e-7, 19% off.
   - The video simplifies ("underflow to exactly zero", 4:20). The atlas contradicts its own Fig 14.
   - Fix: add entry 4, relabel the axis "precision drains from 6e-5; zero below about 3e-8", and keep
     the video's point at the right threshold.
3. **Fig 76 caption** — "Two designs at the same granularity, differing in block size" contradicts
   itself (32 against 16). Fix: "…at the finest practical grain, differing in block size and in how
   precisely the shared scale can be written."
4. **Fig 59** — the boxes say "Works to 8 bits / falls apart below"; the prose says it "stops working
   somewhere around four bits". Fix: "holds at 8 bits, degrades at 4, collapses at 3". VERIFY against
   the GPTQ paper's RTN rows.
5. **Fig 73** — "Per channel or per token… spoils one row". By Fig 46's own convention a channel is a
   column. Fix: "spoils one row or one column".
   - Separately, "Bar length is how many numbers one scale must cover" is not true of the bars:
     250/125/31 px for 16.8M / 4,096 / 16–32 values. Use a labelled log axis: log₂ gives 24, 12,
     4–5 (`math.log2(4096*4096)`=24).
6. **Fig 66** — "leaves every output bit-identical". In floating point this is false, and after
   quantization the outputs differ on purpose.
   - Fix: "mathematically identical".
   - Also fix the notation: "x Q transpose Q y" should be xᵀQᵀQy.
7. **Fig 61 / Fig 62** — "The first costs minutes" and "collecting it takes minutes". The GPTQ abstract
   reports about four GPU hours for 175B. Fix: "minutes for small models, a few GPU-hours for the
   largest". VERIFY.
8. **Fig 75** — "a kernel reading a block gets everything it needs in one fetch… Per-tensor scales are
   cheaper to store but no cheaper to fetch."
   - The video says only "stored right alongside them" (15:45).
   - A per-tensor scale is one number loaded once, so it is cheaper to fetch.
   - Blackwell block-scaled GEMMs take the scale factors as a separate tensor in a tile-matched layout.
     VERIFY in the cuBLAS/CUTLASS docs.
   - Fix: keep "travels with its block", drop the last two sentences, and give the per-value cost
     instead (entry 34).
9. **Fig 81** — "FP8: Hopper or newer" (the video at 18:25) leaves out Ada (L4, L40S, RTX 40), which
   also has FP8 tensor cores. "Older chips: low-precision maths buys nothing" overstates: A100 INT8
   tensor cores run 624 TOPS against 312 TFLOPS for FP16, which is where SmoothQuant's W8A8 results
   came from.
   - Keep the video's rule and add: "for FP8 and FP4; INT8 W8A8 already pays on Ampere".
   - VERIFY the Ada whitepaper and the A100 datasheet.
10. **Fig 35 caption** — "six of eight bits spent". The body's own 1.3 bits leaves `8-(log2(127/100)+1)`
    = 6.66 bits wasted. Fix: "six and a half of eight".
11. **Fig 48** — "six channels, about a tenth of a percent".
    - 6/4,096 = 0.146%. Write "six of 4,096 channels (0.15%)", or keep the video's phrase and add the
      count. VERIFY the 6.7B model's width of 4,096.
    - The 4 px bar is 1.0% of 390 px, 7× too long; say "drawn at minimum visible width".
    - "All features": say "all channels", since "feature" is never defined.
12. **Fig 43** — the bars are 40 px against 300 px for 64 against 4,096 (true ratio 1:64, so the
    short bar should be 4.7 px). They are not to scale, and the caption does not say so. "Units of
    error" is undefined. Fix: draw to scale with the value outside, or use a log axis; define the unit.
13. **Fig 77** — 34 px for "about one point" against 250 px for "4 to 14 points" implies 7.4 points.
    - Draw a range bar from 4 to 14 at 17.9 px per point, and the ~1-point bar at the same scale.
    - Restore "or FP8".
    - Define an accuracy point: 78% → 77% on a benchmark is one point, 1.3% relative.
14. **Fig 63** — "fit a 175-billion-parameter model onto a single GPU". Only at 3 bits: 65.6 GB against
    87.5 GB at 4 bits on an 80 GB card. Add entry 21.
15. **Fig 55** — "it moves the ridge within reach": the ridge does not move; the batch needed to reach
    it shrinks. Two caveats are missing:
    - the formula counts weight bytes only, though Fig 54 says decode "rereads… the whole KV cache" and
      Fig 69 shows the cache can equal the weights;
    - W8A8 moves the ridge to 591.

    The table is also V01 Fig 116 verbatim. Give it one of these new jobs rather than repeating it.
16. **Fig 72** — add the decomposition of the 93.3% (entry 31). This also corrects V03 Fig 91, which
    puts "57 times smaller" beside "93.3 percent" — which would be 98.2%.
17. **Fig 04** — "1 bytes each" → "1 byte each".
18. **Fig 10** — "it wastes a bit": a spare sign bit wastes one code (a second zero), not a bit.
19. **Fig 18** — "as hex: 0x40D00000". Hexadecimal is never introduced. Either drop it or add "each hex
    digit is four bits: 0100 0000 1101 0000… = 4 0 D 0…".
20. **Fig 22** — "Eight equal steps every time… Drawn for BF16's seven mantissa bits". BF16 has 128
    steps per power of two; each panel shows an 8-step window. Say so.
21. **Fig 33** — float ticks are drawn with smoothly growing gaps (6, 10, 16, 24, 38, 60, 90 px). Real
    float spacing is a staircase, as Fig 22 correctly says. Draw FP4's 0, 0.5, 1, 1.5, 2, 3, 4, 6.
22. **Figs 46/47 captions** — "that is why a per-channel scale is possible at all" and "a per-channel
    scale can catch them". For activations the channel is the summed dimension, so the scale cannot be
    factored out of an integer matmul (entries 17 and 22). That limit is the reason SmoothQuant
    exists. As written, the reader is set up for a contradiction at 12:00. Add "…if the matmul allowed
    one; it does not, and 12:00 is the workaround".
23. **Fig 82** — restore "you pay for the communication between them" (19:58).
24. Minor, VERIFY:
    - Fig 68: QuaRot's Hadamard is randomised (random sign flips first).
    - Fig 37: "a hyperparameter nobody wants to tune" — dynamic loss scaling sets it automatically.

### ASR damage

None of the mangled forms reached the atlas: it writes HBM, INT4, QuaRot and SpinQuant correctly. But
every name the video gives is dropped. Restore them, and note that a search of the raw SRT fails on
the true spellings. The SRT forms are:

| SRT form | Correct |
|---|---|
| "Detm" | Dettmers |
| "LLM int 8" | LLM.int8() |
| "248" | 2,048 |
| "Frontar" | Frantar |
| "Shiao" | Xiao |
| "Quarrot", "Quarro's" | QuaRot |
| "Kivy" | KIVI |
| "KV quant" | KVQuant |
| "HPM" | HBM |
| "Even in T4" | Even INT4 |
| "having the bits" | halving |
| "FB8" | FP8 |
| "Mat speedups" | Maths speed-ups |
| "Weighton" | Weight-only |
| "pass token" | past token |
| "flow" (4:20) | floor |
| "a,000%" | 1,000% |
| "mantisa" | mantissa |
| "significant" | significand |

### Voice violations

- **Fig 27:** "The video says FP32 buys about seven decimal digits." → "FP32 is usually quoted at about
  seven decimal digits."
- **Fig 31:** "exactly the window quoted for FP16 in the video" → "exactly the window usually quoted
  for FP16".
- **Fig 47:** "in what is described as a phase shift" → "in what Dettmers and colleagues called a phase
  shift".

### Neighbours that repeat, and captions that restate

- **Figs 26/27** make the same 6.92-against-7.22 argument twice. Merge them: keep Fig 27's drawing and
  Fig 26's caption.
- **Figs 41/42** have the same drawing (10 ticks each) and the same properties. Their captions both
  promise "the next figure". Merge them; entry 13 takes the freed slot.
- **Figs 61/62/78** define post-training quantization three times. The Fig 61 and Fig 78 captions are
  nearly word for word the same ("The dividing line… is simply whether the weights are allowed to move
  in response to the rounding").
  - Fig 61 → calibration only.
  - Fig 62 → replaced by entry 20.
  - Fig 78 keeps PTQ against QAT, with a new caption.
- **Figs 35/45** both say "the scale stretches and the cluster collapses into the first tick or two".
  Give Fig 45 a job of its own: with INT4 and a 100× outlier, every ordinary value rounds to 0 (step
  14.3, half-step 7.1, above any N(0,1) value; `verify7.py`).
- **Fig 44's caption** restates the picture ("The weight histogram laid over INT4's available ticks").
  Replace it with the number: per group of 128 on bell-shaped weights, INT4 rms error is about 12% of
  the typical weight, and 16% of weights round to 0 (`verify10.py`).
- **Fig 74's caption** restates its heading. "At full precision" is also wrong; say "at the precision
  its own scale allows".

### Idioms that fight the idea

- **Fig 24** — the title says "and so do the ticks", but there are no ticks: the SVG has one axis line.
  Use the "histogram over a tick line" idiom and draw a float grid under the bars.
- **Fig 74** — the per-tensor panel shows no damage: apart from the red outlier, all 56 cells are
  neutral grey. The damaged block in the bottom panel uses the `m` ramp ("bits, precision"), not `h`
  ("outliers… what it costs"). Tint the ruined cells `h` in both panels.
- **Fig 67** — after rotation, all twelve bars are drawn equal and positive, but a rotation produces
  signed values. "every output unchanged" sits beside the *before* row. Use entry 27's
  (10.5, −8.5, −10.5, 10.5).
- **Fig 37** — boxes and arrows for something that is a value moving on a log number line (entry 12).
- **Fig 60** — boxes and arrows carry the sequence but not the mechanism. Keep it as the overview;
  entries 18–20 carry the how.
- **Fig 52** — the points are unlabelled and only the caption says which is teal and which is red.
  Label them "decode" and "prefill".
- **Fig 50** — the known checker fault: "how many share a scale" has 4 px of room. Widen the box or
  shorten the label.

---

## 6. Size after the pass

**Estimate: about 118 figures.** That is 83 + 38 proposed − 3 (Fig 27 and Fig 42 merged away, Fig 62
replaced). It is 117 if the optional entry 5 is dropped. Six entries would teach best as widgets: 14,
19, 23, 25, 32, and a bit-flipper attached to Fig 18 / entry 2.

**The three highest-value changes**

1. **Build GPTQ from "error × input"** with entries 13 → 14 → 18 → 19 → 20. This covers one rounded
   weight, √n cancellation, two-weight compensation, the parabola's vertex, and the Hessian as a table
   of input products. The video's most mathematical claim currently states what, not how.
2. **Fix the two numeric errors and lay the number floor.**
   - Fig 02: 1 op/byte and a ~295× gap, not 2 and 150×.
   - Fig 36: the zero floor is ~3e-8, not 6e-5 (with entry 4).
   - Binary place value, binary fractions and two's complement (entries 1–3).
   - The FP8, FP6 and FP4 ranges and grids the ladder never states (entries 6–7).
3. **Teach the scale properly:** worked quantization, zero-point and the outlier's price (entries 8–10);
   the integer matmul and why activations cannot take per-channel scales (entries 17 and 22, which
   resolve the Fig 46/47 → Fig 64 contradiction); and the block formats in numbers (entries 32–34).
