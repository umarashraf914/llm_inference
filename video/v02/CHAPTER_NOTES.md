# Film bible: shared numbers, conventions and per-chapter notes for V02

Read this together with `SCRIPT_GUIDE.md` and `PLAN.md`. These notes keep twenty-two chapters consistent with each other.

## The running example and hardware specs

| Quantity | Value | Say it as |
|---|---|---|
| H100 compute die | 814 mm², roughly 29 mm on a side, ~80 billion transistors | "about eighty billion transistors" |
| H100 SMs (multiprocessors) | 132 identical units | "one hundred and thirty-two multiprocessors" |
| H100 clock | 1.83 GHz for tensor cores, 1.98 GHz for CUDA cores | "one point eight three gigahertz" |
| H100 peak 16-bit compute | 989.4 TFLOP/s (dense, without sparsity) | "nine hundred and eighty-nine point four trillion operations a second" |
| H100 HBM3 bandwidth | 3,352 GB/s, 5 stacks × 1,024 wires = 5,120 wires | "three point three five terabytes per second", "five thousand one hundred and twenty wires" |
| H100 ridge at 16-bit | 989.4e12 / 3.352e12 = 295.17 | "two hundred and ninety-five operations per byte" |
| H100 thread hierarchy | 32 threads/warp; max 64 warps (2,048 threads) per SM; 132 SMs = 270,336 threads | "thirty-two threads in a warp", "two thousand and forty-eight threads in each multiprocessor", "over two hundred and seventy thousand threads in flight" |
| H100 registers | 256 KB per SM (65,536 32-bit registers) = 34.6 MB across chip | "two hundred and fifty-six kilobytes of registers" |
| H100 on-chip SRAM | 256 KB per SM (up to 228 KB shared memory, rest L1) | "two hundred and fifty-six kilobytes of fast S RAM" |
| H100 L2 cache | 50 MB (strictly 52.4 MB) shared chip-wide | "fifty megabytes of L two cache" |
| Memory latency on H100 | HBM ~273 ns (479 ticks), L2 263 ticks, L1 40.7 ticks, shared memory 29 ticks, registers 1 tick | "about five hundred ticks", "nearly three hundred nanoseconds" |
| H200 | Same die, 141 GB HBM3e at 4.8 TB/s (1.43× bandwidth, ridge = 206) | "four point eight terabytes per second" |
| B200 (Blackwell) | 2,250 TFLOP/s 16-bit (18× V100), 8.0 TB/s HBM3e (ridge = 281), 9,000 TFLOP/s at FP4 | "two thousand two hundred and fifty trillion", "nine thousand trillion at four bits" |
| V100 (Volta, 2017) | 125 TFLOP/s 16-bit, 0.9 TB/s (ridge = 139) | "one hundred and twenty-five trillion" |
| A100 (Ampere, 2020) | 312 TFLOP/s 16-bit, 2.0 TB/s (ridge = 153) | "three hundred and twelve trillion" |
| Interconnect hierarchy | HBM 3,352 GB/s → NVLink 450 GB/s each way (900 GB/s both) → InfiniBand 50 GB/s each way (400 Gb/s) | "seven point four times less", "nine times less again" |
| Llama 3 70B | 70 billion parameters = 140 GB at 16 bits; decode = 1 op/byte | "a seventy-billion-parameter model", "a hundred and forty gigabytes" |
| Llama 3 405B | 405 billion parameters = 810 GB at 16 bits (needs 11 H100s, 2 DGX boxes) | "four hundred and five billion parameters", "eight hundred and ten gigabytes" |

## Color meaning (same as V01)

- **Amber** (`--compute` `#ffb84d`): arithmetic, operations, CUDA cores, tensor cores (the cheap thing).
- **Coral** (`--bytes` `#ff6b6b`): memory traffic, bytes, data movement, buses, DRAM cells, uncoalesced waste (the expensive thing).
- **Teal** (`--helps` `#2fd9a7`): what helps, latency hiding, staged tiles, coalesced reads, cache hits, lower precision savings.
- **Blue** (`--struct` `#6ea8ff`): structure, thread lanes, warps, multiprocessors, register slots, packages, neutral data.
- **Violet** (`--violet` `#b48cff`): negative numbers, branch divergence, unmasked/divergent paths.
- White/grey (`--ink` / `--muted`): labels, plain text, scale numbers.

## Terms and where they are taught

| Term | Taught in |
|---|---|
| Package, die, transistor, clock cycle, thread, instruction | ch01 |
| Latency vs bandwidth, FLOP vs FLOP/s, bus width × clock, 5,120 wires | ch02 |
| The 295:1 gap, ridge recap, energy per op (700× DRAM vs add), parallel vs sequence | ch03 |
| CPU anticipation (speculation, branch prediction, prefetch) vs GPU throughput | ch04 |
| 128 CUDA cores vs 4 tensor cores per SM, 989.4 trillion formula derivation | ch05 |
| Registers, single-cycle access, register partitioning, shared memory scratchpad, tiling | ch06 |
| Schedulers (4 per SM), TMA copy engine, 4 identical quarters of an SM | ch07 |
| 32-thread warp, kernel index formula (`blockIdx * 256 + threadIdx`), SIMT, lockstep | ch08 |
| 64 warps per SM, Little's law check (`rate × latency`), full execution hierarchy | ch09 |
| Branch divergence, active mask, serialization of divergent branches | ch10 |
| SRAM (6 transistors) vs DRAM (1 transistor, 1 capacitor), refresh leak, latency journey | ch11 |
| The 4-rung memory ladder (registers, L1/shared, L2, HBM), scope and capacities | ch12 |
| Latency hiding, resident warps, zero-cost context switching, occupancy limits | ch13 |
| Coalescing, 32-byte sectors and 128-byte cache lines, row-major storage, strides | ch14 |
| Memory wall over generations (V100 → A100 → H100 → B200), physical wire scaling, H200 proof | ch15 |
| The roofline diagram, attainable performance, arithmetic intensity, prefill vs decode | ch16 |
| Tensor core matrix multiply accumulate (`D = A × B + C`), tile reuse, 528 units | ch17 |
| Long multiplication in binary (`width × width`), square law of multipliers | ch18 |
| Floating point (sign, exponent, mantissa), BF16 vs FP16 vs FP32, precision vs range, FP32 accumulation | ch19 |
| Capacity wall, DGX boxes, NVLink vs InfiniBand, all-reduce exchanges in tensor parallelism | ch20 |
| Systolic array (TPUs), software ecosystem and CUDA moats, summary of three answers | ch21 |

## Per-chapter notes

- **ch00 Cold open** (60–90 s, no figures owned): hook on 989 trillion operations waiting for numbers over 5,120 wires; promise that by the end you will understand every piece of silicon on this chip.
- **ch01**: From bare silicon: transistors as voltage switches, cycles as ticks, the die as a photograph printed with light.
- **ch02**: Keep count and rate strictly apart; bandwidth = width × speed; why the 4090 runs fast wires and the H100 runs wide ones.
- **ch03**: Walk the 295:1 gap and the 700× energy difference between reading DRAM and adding numbers.
- **ch04**: The fundamental philosophical fork: CPU spends area anticipating one thread; GPU throws anticipation away to fit thousands of lanes.
- **ch05**: Break down 989.4 TFLOP/s into `132 × 4 × 1,024 × 1.83 billion`.
- **ch06**: Tiling worked out cleanly: 128 reads reduced to 32 by staging a 4×4 tile in shared memory.
- **ch07**: Floor plan of an SM: 4 quarters side by side, TMA streaming shapes without thread instructions.
- **ch08**: Kernel index arithmetic: why adjacent threads work on adjacent numbers.
- **ch09**: Little's law for HBM: 915 KB needed in flight at all times.
- **ch10**: Divergence illustrated with active bitmasks; why nested branches compound exponentially.
- **ch11**: Why DRAM is slow: the physics of capacitor leakage and destructive readout.
- **ch12**: The 4-rung ladder: registers, L1/shared, L2, HBM, with capacities, latencies, and bandwidths.
- **ch13**: Kitchen cook analogy for latency hiding; why switching between resident warps costs 0 cycles.
- **ch14**: Stride walk: why column-major access wastes 7/8ths of the fetched bytes.
- **ch15**: Generational curves; why H200 proves the memory wall experimentally.
- **ch16**: Full roofline mechanics with prefill and decode placed on opposite sides of the 295 ridge.
- **ch17**: Walk a 4×4 tensor step; every number used 4 times.
- **ch18**: Binary long multiplication; why an 8-bit multiplier takes 1/4 the silicon of a 16-bit multiplier.
- **ch19**: Field-by-field dissection of BF16 π (3.140625); the 256 sum wall without FP32 accumulation.
- **ch20**: Llama 3 405B split across 11 GPUs; 160 all-reduces per token across NVLink vs InfiniBand.
- **ch21**: Systolic arrays rhythmic flow; software ecosystem constraint; final synthesis answering the three core questions.
