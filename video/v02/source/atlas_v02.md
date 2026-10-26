# Inside the GPU
_From what a FLOP is and why DRAM is slow, through warps, the memory ladder and the roofline, to why a model stops fitting on one chip. Built from the ground up, in the order the video covers it. Timestamps mark your position in the video, not the extent of a figure._


## The question
_What the chip is actually being asked to do._

### Fig 01 · 0:00
**What a chip physically is**
- [HEAD] What is actually inside the package
- [LABEL] The package: what you can hold
- [sub] memory
- [sub] the die
- [sub] memory
- [sub2] the die is a single square of silicon, roughly 29 mm on a side
- [PROSE] About eighty billion transistors are printed onto that square, which works out at roughly a hundred million of them per square millimetre. Nothing is assembled by hand. The pattern is printed with light, all at once, the way a photograph is developed. Everything this document describes, all 132 multiprocessors and every cache, is regions of that one square.
> CAPTION: Useful scale for the phrase silicon budget. When a later figure says the CPU spends its area differently, it means literally which parts of this square do what.

### Fig 02 · 0:00
**What a chip is made of**
- [HEAD] A chip is a slab of silicon covered in switches
- [LABEL] One transistor
- [sub] a wire in
- [sub] a switch
- [sub] on, or off
- [PROSE] That is the entire building block. A transistor lets current through, or does not, depending on a control voltage. It is a tap with no in-between position. Wire a handful together and you can build a circuit that adds two numbers. Wire eighty billion of them together and you have a modern GPU. Everything in this document is made of nothing but these.
> CAPTION: Worth thirty seconds, because the phrase silicon budget appears constantly below and it means literally this: how many transistors, spent on what.

### Fig 03 · 0:00
**Instructions, cycles and threads**
- [HEAD] An instruction is one thing the chip is told to do
- [sub] add these two
- [sub] fetch that number
- [sub] jump somewhere else
- [HEAD] A clock cycle is one tick, and one tick is when work happens
- [sub2] a modern chip ticks well over a billion times a second
- [PROSE] So a cycle is under a nanosecond, a billionth of a second. When a later figure says a memory access costs hundreds of cycles, it means hundreds of these ticks spent doing nothing else. A thread is simply a sequence of instructions being worked through, one after another. A chip that runs many threads is working through many such sequences at the same time.
> CAPTION: Three words the rest of the document leans on without explanation. A cycle is the unit of time at this scale, the way a second is at ours.

### Fig 04 · 0:00
**Two numbers predict the token rate**
- [LABEL] Arithmetic rate
- [sub] operations per second
- [LABEL] Memory bandwidth
- [sub] bytes per second
- [LABEL] Tokens per second
- [PROSE] Under 1% of a decode step goes to arithmetic. The other 99% is the chip waiting for weights.
> CAPTION: Two hardware numbers, and the ratio between them, decide almost everything about inference speed. This document is about where those two numbers come from.

### Fig 05 · 0:06
**A count is not a rate, and a wait is not a width**
- [HEAD] A count against a rate
- [LABEL] FLOP
- [sub] one operation: a count
- [LABEL] FLOP/s
- [sub] operations per second: a rate
- [sub] 140 billion operations ÷ 989.4 trillion per second = 0.14 ms
- [HEAD] A wait against a width
- [PROSE] latency
- [sub] ask
- [sub2] wait for the one answer
- [sub] arrive
- [PROSE] bandwidth
- [sub2] many requests travelling at once, each with its own wait
- [PROSE] A FLOP is one operation, a count with no time in it. FLOP/s is a rate. Dividing the count by the rate gives seconds, and if the units do not cancel that way, the two have been swapped (V1 Fig 40). Latency is how long one request takes to come back. Bandwidth is how many bytes arrive per second when many requests are travelling at once. They are independent: a wide, slow pipe has high bandwidth and high latency (V1 Fig 54).
> CAPTION: Two pairs of words that sound alike and measure different things. Nearly every confusing performance claim swaps one of them, so the rest of this atlas keeps them apart.

### Fig 06 · 0:06
**What throughput means**
- [HEAD] Throughput is finished work per unit of time
- [sub] work arrives
- [sub] the machine
- [sub] work leaves
- [sub2] count what leaves, per second
- [PROSE] It says nothing about how long any single item took inside. A machine can have splendid throughput and make every individual item wait a long time. That is exactly the trade this chip makes. It runs each thread slowly and runs an enormous number of them, so the count leaving per second is huge. Whenever a figure below quotes operations per second or bytes per second, it is quoting a throughput, and saying nothing about any one operation's latency.
> CAPTION: The word appears in every specification. It counts what comes out, never how long one item spent inside.

### Fig 07 · 0:10
**Bandwidth is wires times how fast each one runs**
- [HEAD] A bus is the set of wires between memory and the chip
- [LABEL] memory
- [LABEL] the chip
- [sub2] every wire carries one bit at a time, all of them at once
- [sub] bandwidth = wires × bits per second on each wire ÷ 8 bits per byte
- [HEAD] Two real buses, drawn to scale
- [PROSE] RTX 4090
- [sub2] 384 wires at 21.0 Gb/s each
- [PROSE] H100
- [sub2] 5,120 wires at 5.24 Gb/s each
- [PROSE] The gaming card's memory runs each wire four times as fast, 21.0 billion bits a second against 5.24 billion. The H100 still moves 3.3 times as many bytes per second, because it has 13.3 times as many wires. Widening is the main way memory gets faster, and it explains where memory sits: thousands of wires only work over millimetres, so a wide memory has to be packed beside the chip (V1 Fig 52, V1 Fig 100). Every weight the model uses travels along these wires before any arithmetic can touch it.
> CAPTION: Bars are wire counts, to scale. The slow-wire chip wins on bandwidth by going wide, which is the whole design of high-bandwidth memory. Rates: NVIDIA's H100 whitepaper; Luo et al. 2024 for the RTX 4090.

### Fig 08 · 0:10
**3.35 TB/s is 5,120 wires, each carrying 5.24 billion bits a second**
- [HEAD] The package from above: the GPU die and its five memory stacks
- [LABEL] GPU die
- [sub] 814 mm²
- [LABEL] HBM3 stack
- [sub] 1,024 wires
- [LABEL] HBM3 stack
- [sub] 1,024 wires
- [LABEL] HBM3 stack
- [sub] 1,024 wires
- [LABEL] HBM3 stack
- [sub] 1,024 wires
- [LABEL] HBM3 stack
- [sub] 1,024 wires
- [sub2] unused site
- [sub] 5 stacks × 1,024 wires
- [sub2] = 5,120 wires
- [sub] × 2,619 million clocks a second × 2 transfers per clock
- [sub2] = 5.238 billion bits a second on each wire
- [sub] 5,120 × 5.238 billion
- [sub2] = 26.8 trillion bits a second
- [sub] ÷ 8 bits per byte
- [sub2] = 3,352 GB/s, the 3.35 TB/s on the specification
- [PROSE] Each stack is a pile of DRAM chips joined to the package by 1,024 data wires. The full Hopper die has room for six stacks; the H100 sold in this form enables five, which is where its 80 GB and its 5,120-bit memory interface come from. Each wire is driven at 2,619 million clocks a second and carries a bit on both the rising and the falling edge of the clock, so 5.24 billion bits a second. Nothing about the memory is exotic per wire. The bandwidth comes from the count.
> CAPTION: Schematic layout; the numbers are NVIDIA's (H100 whitepaper, final specifications). The same equation returns for the H200 and for the links between chips, and it is the reason bandwidth grows so slowly: more wires need more edge.

### Fig 09 · 0:13
**The units of time at this scale**
- [HEAD] Three durations on one logarithmic axis, from 0.1 ns to 100 ms
- [sub2] 0.1 ns
- [sub2] 1 ns
- [sub2] 10 ns
- [sub2] 100 ns
- [sub2] 1 µs
- [sub2] 10 µs
- [sub2] 100 µs
- [sub2] 1 ms
- [sub2] 10 ms
- [sub2] 100 ms
- [PROSE] one tick
- [sub2] 0.55 ns at 1.83 GHz
- [PROSE] a load from HBM
- [sub2] about 270 ns, or 479 ticks
- [PROSE] one token
- [sub] about 30 ms
- [PROSE] Each equal step along the axis is ten times longer. A load from HBM lasts about 500 ticks, and one token lasts about 110,000 loads. The three are not a thousand apart each: the steps are about 500 and about 110,000. A tick is the chip's clock: the H100's tensor cores are rated at 1.83 billion ticks a second, so one tick is 0.55 ns. The load time was measured on a Hopper GPU, 479 ticks at its 1.755 GHz clock. Almost every timing argument below compares the first two rows.
> CAPTION: Bar lengths are logarithmic. A nanosecond against a millisecond is the same ratio as a second against eleven days. Load latency: Luo et al. 2024, measured on an H800; clock: NVIDIA's H100 whitepaper.

### Fig 10 · 0:39
**Almost three hundred, counted two ways**
- [HEAD] One decode step of a 70B model on an H100, in time (log axis)
- [sub2] 10 µs
- [sub2] 0.1 ms
- [sub2] 1 ms
- [sub2] 10 ms
- [sub2] 100 ms
- [PROSE] arithmetic
- [sub2] 0.141 ms
- [PROSE] reading weights
- [sub2] 41.8 ms
- [HEAD] The same step, as operations per byte (log axis)
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [PROSE] decode delivers
- [sub2] 1 operation per byte
- [PROSE] the chip needs
- [sub] 295 operations per byte
- [sub] 41.8 ms ÷ 0.141 ms = 295 = (989.4 T ÷ 3.352 T) ÷ 1
- [PROSE] Reading 140 GB of weights at 3,352 GB/s takes 41.8 ms (V1 Fig 125). The arithmetic, 140 billion operations at 989.4 trillion a second, takes 0.141 ms. The maths is busy 0.34% of the time. Counted the second way, decode does one operation for each byte it reads (V1 Fig 109), while the chip can do 295 operations in the time one byte arrives: the ridge (V1 Fig 119). The two ratios are the same number, because 140 billion operations over 140 billion bytes is exactly one.
> CAPTION: Time spent and work per byte tell one story: on a single request the chip waits 295 times longer than it computes. The rest of this atlas is about the machine that makes that so.

### Fig 11 · 0:52
**The three questions**
- [LABEL] Why so different
- [sub] from a laptop CPU?
- [LABEL] Why is a byte
- [sub] so expensive
- [sub] next to an operation?
- [LABEL] What can the
- [sub] hardware do
- [sub] to fight back?
- [PROSE] Parts 2 to 5 answer the first: one bet about the workload, the multiprocessor built around it, and the two habits it punishes. Parts 6 and 7 answer the second, from the memory cell up to the four-rung ladder. Parts 8 to 15 answer the third: latency hiding, coalescing, tensor cores, lower precision and more chips.
> CAPTION: The structure of everything below. Holding these three in mind makes the ordering feel inevitable rather than arbitrary.

### Fig 12 · 0:58
**Fetching a number from DRAM costs 700 times the energy of adding it**
- [HEAD] Energy per operation at 45 nm, in picojoules (log axis)
- [sub2] 0.1 pJ
- [sub2] 1 pJ
- [sub2] 10 pJ
- [sub2] 100 pJ
- [sub2] 1000 pJ
- [PROSE] 32-bit float add
- [sub2] 0.9 pJ, 1.0×
- [PROSE] 32-bit float multiply
- [sub] 3.7 pJ, 4.1×
- [PROSE] 32-bit read, SRAM cache
- [sub] 5 pJ, 5.6×
- [PROSE] 32-bit read, DRAM
- [sub] 640 pJ, 711×
- [PROSE] Fetching one 32-bit number from DRAM took 640 picojoules, 711 times the energy of adding two such numbers once they have arrived. A read from a small on-chip SRAM cache cost 5 pJ, close to the arithmetic. So the hierarchy is not only about time. On a chip limited by power, moving data is the expensive act and computing is nearly free.
> CAPTION: Energies from Han et al. 2015, after Horowitz, for a 45 nm process; the multiples are against the add. Absolute energies have shrunk since. The ordering has not, and it shapes every accelerator.

### Fig 13 · 1:16
**The bet**
- [LABEL] The workload
- [sub] the same few operations,
- [sub] over billions of numbers
- [LABEL] That shape is a matrix multiply
- [sub] and a transformer is mostly those
- [PROSE] Design a chip around this one assumption and it stops resembling a general-purpose processor.
> CAPTION: Everything the GPU is follows from committing to this. Where the assumption breaks, so does the chip's advantage.

### Fig 14 · 1:16
**In sequence against in parallel**
- [HEAD] In sequence: one worker, one job at a time
- [sub] job 1
- [sub] job 2
- [sub] job 3
- [sub] job 4
- [sub2] finishes at time 4
- [HEAD] In parallel: four workers, one job each
- [sub] job 1
- [sub] job 2
- [sub] job 3
- [sub] job 4
- [sub2] all finish at time 1
- [PROSE] Parallel work is only possible when the jobs do not depend on one another. Job 2 cannot start early if it needs job 1's answer. That single condition decides almost everything about which parts of running a model can be spread across a chip and which cannot.
> CAPTION: The dependency question is the one that matters. Keep it in mind: it returns as the reason a whole prompt can be processed at once while new tokens come one at a time.


## Two design philosophies
_The same silicon budget, spent in opposite directions._

### Fig 15 · 1:39
**What general purpose actually costs**
- [HEAD] A general-purpose processor does not know what is coming
- [sub] an instruction
- [sub] might be anything at all
- [PROSE] It could be arithmetic, a jump somewhere else, a read from memory, or a decision that depends on a value not yet computed. The processor cannot know until it looks. So it spends silicon on guessing: predicting which way a decision will go, fetching data before it is asked for, and reordering work to fill gaps. All of that machinery is pure overhead on a workload where the answer is always the same: it is another multiply, on the next number along. The GPU is a chip built for a workload that never surprises it, and that is the entire difference between the two designs.
> CAPTION: Anticipation is only worth paying for when you do not know what is next. On a matrix multiply you always do.

### Fig 16 · 1:39
**The CPU spends its silicon on anticipation**
- [LABEL] CPU core
- [sub] anticipation: predict, prefetch, reorder
- [sub] math
- [sub2] Runs perhaps a few tens of these fast threads at once.
> CAPTION: Schematic: the split of area is illustrative, not measured. Most of the die goes to guessing what the thread will do next and lining the data up before it asks, so the core almost never stops and waits.

### Fig 17 · 1:53
**A CPU runs ahead on a guess, and throws the work away when it guessed wrong**
- [HEAD] Guessing a branch: the answer to the test arrives three slots late
- [PROSE] wait
- [sub] i1
- [sub] i2
- [sub] i3
- [sub] if?
- [sub] i5
- [sub] i6
- [sub] i7
- [sub] i8
- [PROSE] guess right
- [sub] i1
- [sub] i2
- [sub] i3
- [sub] if?
- [sub] i5
- [sub] i6
- [sub] i7
- [sub] i8
- [sub] i9
- [sub] i10
- [sub] i11
- [PROSE] guess wrong
- [sub] i1
- [sub] i2
- [sub] i3
- [sub] if?
- [sub2] i5
- [sub2] i6
- [sub2] i7
- [sub] e5
- [sub] e6
- [sub] e7
- [sub] e8
- [sub2] answer known
- [HEAD] Prefetching: the core spots a pattern in the addresses and fetches ahead
- [PROSE] asked for
- [sub] 100
- [sub] 104
- [sub] 108
- [sub2] +4 each time, so
- [sub] 112
- [sub] 116
- [sub2] fetched before anyone asks
- [PROSE] no prefetch
- [sub] ask
- [sub2] wait for memory
- [sub] use
- [PROSE] prefetched
- [sub] use
- [sub2] 112 is already waiting nearby
- [PROSE] A branch tests a value, and the value may not be ready yet. Rather than stall, the core guesses which way the test will go and runs ahead. Right, and the work was free. Wrong, and it is thrown away and the core restarts down the other path, no later than if it had waited. Prefetching makes the same bet about data: a core that sees addresses 100, 104, 108 asked for in turn fetches 112 and 116 before they are wanted, so those loads find their data close by. Both cost silicon: tables of past branches, address trackers, room to hold half-finished guesses.
> CAPTION: Schematic timings. This is what anticipation means: machinery that pays off for one thread making unpredictable turns. A GPU spends that silicon on more threads instead.

### Fig 18 · 2:07
**The GPU makes the opposite trade**
- [LABEL] One GPU multiprocessor
- [sub2] no prefetch
- [sub] arithmetic
- [sub2] Holds up to 2,048 threads. None is fast alone, and none gets the anticipation machinery.
> CAPTION: Schematic, like the previous figure, and not the same budget: one CPU core against one of 132 multiprocessors. The GPU does not avoid waiting; it arranges to always have other work ready.

### Fig 19 · 2:12
**Hopper is the design, H100 is the chip, NVL72 is the rack**
- [HEAD] A design, the chips built to it, and the boxes that hold them
- [sub2] architecture, year
- [sub2] chips
- [sub2] systems
- [sub] Volta, 2017
- [sub] V100
- [sub] Ampere, 2020
- [sub] A100
- [sub] DGX: 8 GPUs, one NVLink domain
- [sub] Hopper, 2022
- [sub] H100, H200
- [sub] DGX: 8 GPUs, one NVLink domain
- [sub] Blackwell, 2024
- [sub] B200, GB200
- [sub] GB200 NVL72: 72 GPUs in one rack
- [sub2] gold: Hopper and the H100, the chip used throughout this atlas
- [PROSE] An architecture is a design: how a multiprocessor is laid out, which number formats its tensor cores accept. Hopper is NVIDIA's 2022 design. A chip is one product built to it: the H100 has 132 multiprocessors and 80 GB of memory, and the H200 is the same chip with more and faster memory. Systems are what get bought and wired together. A DGX box holds eight GPUs joined by NVLink. A GB200 superchip pairs one Grace CPU with two Blackwell GPUs, and an NVL72 rack holds 36 of them, 72 GPUs in one NVLink domain.
> CAPTION: Three kinds of name that the specification sheets mix freely. Later parts compare generations by architecture and chips by product name, so the distinction carries a lot of weight.

### Fig 20 · 2:17
**One design, stamped 132 times**
- [PROSE] 132 identical compute units up to 2,048 threads in each over 270,000 threads in flight The highlighted square is the one unit we open up next. The other 131 are copies of it.
> CAPTION: This is why understanding a single multiprocessor is enough to understand the chip.

### Fig 21 · 2:48
**Why slow threads win here**
- [HEAD] A handful of fast lanes
- [HEAD] Many slow lanes
- [PROSE] When the job is the same operation over a billion elements, 100,000 slow threads in parallel beat a handful of fast ones by orders of magnitude.
> CAPTION: A chip full of slow threads looks like wasted performance until you notice the workload has no serial dependencies worth accelerating.

### Fig 22 · 2:48
**Where the bet loses**
- [HEAD] Where the GPU bet loses
- [LABEL] Work with no dependencies
- [sub] millions of identical multiplies,
- [sub] in any order
- [LABEL] Work that forms a chain
- [sub] each step needs the answer
- [sub] from the one before
- [PROSE] For the first, a thousand slow lanes finish far sooner than four fast ones. For the second, nine hundred and ninety-nine of those lanes have nothing to do. A chain runs at the speed of one lane, and one GPU lane is much slower than one CPU core. Tokens do form a chain, since each needs the one before. But every link is a full pass through the model: one 4,096 × 4,096 matrix times a vector alone is 16,777,216 independent multiply-adds. The lanes have plenty to do. What starves them in decode is that each weight fetched is used once (V1 Fig 105).
> CAPTION: The trade is not free for genuinely serial work. Decode is not that: its chain is long but every link is wide, and what it lacks is reuse of each byte, not parallel work.


## Building one multiprocessor
_Five components introduced separately, then assembled into four identical quarters._

### Fig 23 · 3:17
**The arithmetic units**
- [LABEL] 128 CUDA cores
- [sub] scalar, one multiply-add
- [sub] per cycle each
- [LABEL] 4 tensor cores
- [sub] operate on whole matrix tiles,
- [sub] not single values
- [PROSE] Everything else on the multiprocessor exists to keep these two fed.
> CAPTION: A maths unit waiting on data is doing nothing. That sentence is the design brief for the four components that follow.

### Fig 24 · 3:34
**The headline comes from four tensor cores, not 128 CUDA cores**
- [HEAD] Peak operations per second, all 132 multiprocessors, drawn to scale
- [PROSE] CUDA cores, 32-bit
- [sub2] 66.9 trillion a second
- [PROSE] CUDA cores, 16-bit
- [sub2] 133.8 trillion a second
- [PROSE] tensor cores, 16-bit
- [sub] 989.4 trillion a second
- [PROSE] The H100's headline, close to a thousand trillion operations a second, comes almost entirely from the four tensor cores in each multiprocessor. The 128 CUDA cores in each one, across all 132, reach 66.9 trillion on 32-bit numbers, the format they are built around, and 133.8 trillion on 16-bit numbers, which they handle two at a time. Like for like, at 16 bits, the tensor cores are 7.4 times ahead. The next figure takes the 989.4 apart.
> CAPTION: A program that never uses the tensor cores cannot come within a factor of seven of the headline, however well it is otherwise written. Figures from NVIDIA's H100 whitepaper.

### Fig 25 · 3:39
**989 trillion is 132 × 4 × 1,024 × 1.83 billion**
- [HEAD] The headline, multiplied out one factor at a time
- [sub] 132 multiprocessors × 4 tensor cores
- [sub2] = 528 tensor cores
- [sub] × 1,024 operations per tick each
- [sub2] = 540,672 operations per tick
- [sub] × 1.83 billion ticks a second
- [sub2] = 989.4 trillion operations a second
- [HEAD] One multiprocessor, one tick, drawn to scale
- [PROSE] 4 tensor cores
- [sub] 4,096 operations
- [PROSE] 128 CUDA cores
- [sub2] 256 operations, 32-bit
- [PROSE] Where 1,024 comes from: an A100 tensor core finishes 256 multiply-adds every tick, and NVIDIA doubled the rate per multiprocessor, clock for clock, in Hopper. That is 512 multiply-adds, and a multiply-add counts as two operations (V1 Fig 104). The CUDA cores do one 32-bit multiply-add each per tick, 256 operations per multiprocessor, a sixteenth of the tensor cores (on 16-bit pairs, 512, an eighth). Across the chip the 32-bit gap is 14.8 rather than 16 because NVIDIA rates the tensor cores at 1.83 GHz and the CUDA cores at 1.98 GHz. The 1,978.9 trillion sometimes quoted is the same hardware credited with the multiply-adds it skips when two of every four weights are zero, NVIDIA's 2:4 structured sparsity.
> CAPTION: Every factor is NVIDIA's (H100 and A100 whitepapers), and the product lands on the published 989.4. A peak is a count of units times work per tick times ticks, nothing more mysterious.

### Fig 26 · 3:56
**What a register is**
- [HEAD] A register is a named slot the arithmetic can reach instantly
- [sub] r0
- [sub] r1
- [sub] r2
- [sub2] ...
- [sub] the arithmetic unit
- [PROSE] An arithmetic unit cannot reach into memory. It can only read from a register and write to a register, and something else has to have put the values there first. So every number takes the same path: memory, then a register, then the maths, then back. The register step is not optional. Registers are the fastest thing on the chip because they sit right next to the units that use them, and because there are very few of them.
> CAPTION: The first rung of the ladder, and the only one the arithmetic can actually touch. Everything else exists to keep it fed.

### Fig 27 · 3:56
**The register file**
- [LABEL] Register file
- [sub] 256 KB, single-cycle access
- [PROSE] Partitioned across every thread the multiprocessor is running. A thread's working values live here, and reaching them is effectively free. Because each thread's slice stays allocated the whole time it is resident, switching between threads costs nothing.
> CAPTION: The partitioning is the detail that matters. It is what makes latency hiding free, which is the subject of Part 8.

### Fig 28 · 4:03
**256 KB is 65,536 registers, and 2,048 threads get 32 each**
- [HEAD] 256 KB ÷ 4 bytes per register = 65,536 registers, shared out
- [sub2] registers per thread
- [sub2] threads that fit
- [PROSE] 32 each
- [sub2] 32
- [sub2] 2,048 (100%)
- [PROSE] 64 each
- [sub2] 64
- [sub2] 1,024 (50%)
- [PROSE] 128 each
- [sub2] 128
- [sub2] 512 (25%)
- [PROSE] 255 each
- [sub2] 255
- [sub2] 256 (12.5%)
- [PROSE] Each thread gets a private slice of the register file for as long as it is resident. At 32 registers a thread, all 2,048 threads fit: 2,048 × 32 = 65,536. Double the registers and half as many threads fit; the product never changes. The compiler decides how many registers a thread needs, up to 255. They are handed out 256 at a time per group of 32 threads, so 255 registers cost 256 a thread and leave room for 256 threads. Fewer resident threads means fewer to switch to while others wait (Part 8).
> CAPTION: Bars to scale. Registers per thread and threads per multiprocessor trade one for one: a program that hoards registers buys speed per thread with fewer threads to hide waits. Limits: NVIDIA's CUDA programming guide and occupancy calculator.

### Fig 29 · 4:07
**On-chip SRAM**
- [LABEL] 256 KB of SRAM per multiprocessor
- [sub] up to 228 KB claimed as shared memory
- [sub] L1
- [PROSE] Shared memory is a scratchpad the program manages by hand, so cooperating threads can stage the data they share. Whatever is not claimed serves as an ordinary L1 cache.
> CAPTION: The split is a software decision rather than a fixed partition, which is what makes deliberate tiling possible.

### Fig 30 · 4:20
**Staging a tile: fetch each number once and let four threads read it**
- [HEAD] One 4 × 4 block of outputs, 16 threads, one output each
- [sub] b11
- [sub] b12
- [sub] b13
- [sub] b14
- [sub] b21
- [sub] b22
- [sub] b23
- [sub] b24
- [sub] b31
- [sub] b32
- [sub] b33
- [sub] b34
- [sub] b41
- [sub] b42
- [sub] b43
- [sub] b44
- [sub] a11
- [sub] a12
- [sub] a13
- [sub] a14
- [sub] c11
- [sub] c12
- [sub] c13
- [sub] c14
- [sub] a21
- [sub] a22
- [sub] a23
- [sub] a24
- [sub] c21
- [sub] c22
- [sub] c23
- [sub] c24
- [sub] a31
- [sub] a32
- [sub] a33
- [sub] a34
- [sub] c31
- [sub] c32
- [sub] c33
- [sub] c34
- [sub] a41
- [sub] a42
- [sub] a43
- [sub] a44
- [sub] c41
- [sub] c42
- [sub] c43
- [sub] c44
- [sub2] tile of B
- [sub2] tile of A
- [sub2] outputs, one per thread
- [HEAD] Numbers read from HBM, to scale
- [sub2] each thread its own 8
- [sub2] 128
- [sub2] staged once
- [sub2] 32
- [sub] c23 = a21·b13 + a22·b23 + a23·b33 + a24·b43
- [PROSE] The thread computing c23 needs row 2 of A and column 3 of B, eight numbers. Every thread in the same row of outputs needs the same four numbers of A, and every thread in the same column the same four of B. If each thread fetched its own eight from HBM, the block would make 16 × 8 = 128 reads. Staged, the block first copies the 16 numbers of A and the 16 of B into shared memory, 32 reads, and every thread then reads from there. That is 4 times fewer: the saving equals the width of the tile, so a 128-wide tile saves 128 times. Cutting a large matrix multiply into blocks like this, each staged once and used many times, is called tiling.
> CAPTION: Same arithmetic, a quarter of the HBM traffic. This is what a scratchpad managed by hand is for: the program knows in advance who needs what, which a cache can only guess.

### Fig 31 · 4:22
**What a cache is**
- [HEAD] A cache is a small fast copy of something slow and far away
- [sub] cache
- [sub2] small, close, quick
- [sub] the real memory
- [sub2] large, further away, slow
- [PROSE] When a value is fetched, a copy is kept nearby in case it is wanted again. If it is, the second request is answered from the copy and never makes the long trip. This works only when programs reuse data. A program that touches every number exactly once gains nothing from any cache, however large. Hold that thought. Generating one token touches every weight exactly once.
> CAPTION: The last line is the whole problem in miniature, and it is why so much of this series is about moving data rather than caching it.

### Fig 32 · 4:22
**Cache against shared memory**
- [HEAD] Two kinds of fast memory, and who decides what is in them
- [LABEL] A cache
- [sub] the hardware decides,
- [sub] using what was recently used
- [LABEL] Shared memory
- [sub] the program decides,
- [sub] by writing instructions to fill it
- [PROSE] Both are the same silicon and roughly the same speed. The difference is who is in charge. A cache guesses, and guesses well when a program reuses data. Shared memory does not guess: the program states exactly which block it wants staged and when. For a workload that streams through data once, guessing is worthless and stating is everything. That is why this chip offers both and why serious kernels use the second. The split between them is itself a setting the program chooses.
> CAPTION: Same silicon, opposite philosophies. The choice between them is the difference between hoping for locality and engineering it.

### Fig 33 · 4:27
**The schedulers**
- [LABEL] Scheduler 1
- [sub] picks a group,
- [sub] issues one instruction
- [LABEL] Scheduler 2
- [sub] picks a group,
- [sub] issues one instruction
- [LABEL] Scheduler 3
- [sub] picks a group,
- [sub] issues one instruction
- [LABEL] Scheduler 4
- [sub] picks a group,
- [sub] issues one instruction
- [PROSE] Four of them, each choosing a group of threads every cycle and issuing its next instruction.
> CAPTION: A group of threads gets a precise name shortly. That name is the warp, and its size is not a coincidence.

### Fig 34 · 4:27
**What the scheduler is choosing between**
- [HEAD] What a scheduler decides, every cycle
- [sub] its 16 resident groups
- [sub] which one can run now?
- [sub] issue one instruction
- [PROSE] Each of the four schedulers owns a quarter of the groups resident on the multiprocessor, 16 of the 64. A group is handed to one scheduler when it arrives and stays with it. A group whose data has not arrived cannot run. A group waiting on another group cannot run. The scheduler picks from whatever is ready and issues its next instruction, in hardware, in a single cycle, with no involvement from the program. If none of its 16 is ready, that scheduler's lanes sit idle for the cycle. That is the failure this whole chip is designed to avoid, and the next parts are about how.
> CAPTION: One decision, repeated a billion times a second. Everything about occupancy and latency hiding is about making sure this choice is never empty.

### Fig 35 · 4:35
**The tensor memory accelerator**
- [LABEL] HBM
- [sub] main memory
- [LABEL] TMA
- [sub] dedicated copy engine
- [LABEL] SRAM
- [sub] on the multiprocessor
- [PROSE] It streams blocks of data in the background, so threads never spend their own instructions on the transfer.
> CAPTION: A copy engine that runs independently of the maths units is what allows loading and computing to overlap completely.

### Fig 36 · 4:48
**The copy engine is told a shape, not 512 addresses**
- [HEAD] A 64 × 64 tile of 16-bit numbers, cut from a matrix 4,096 numbers wide
- [sub2] the descriptor, written once
- [sub] start address
- [sub] where row 0 begins
- [sub] shape
- [sub] 64 rows × 64 columns
- [sub] element size
- [sub] 2 bytes
- [sub] row stride
- [sub] 8,192 bytes
- [sub2] the 64 row addresses the engine works out
- [sub] row 0
- [sub] start
- [sub2] 128 bytes
- [sub] row 1
- [sub] start + 8,192
- [sub2] 128 bytes
- [sub] row 2
- [sub] start + 16,384
- [sub2] 128 bytes
- [sub2] … 60 more rows …
- [sub] row 63
- [sub] start + 516,096
- [sub2] 128 bytes
- [HEAD] Who issues what
- [PROSE] without the engine
- [sub] 128 threads × 4 copies of 16 bytes = 512 instructions, each with its own address
- [PROSE] with the engine
- [sub] 1 thread issues 1 instruction carrying the descriptor
- [PROSE] The program describes the tile once: where it starts, its shape, how big each number is, and how far apart its rows sit in memory (4,096 numbers × 2 bytes = 8,192 bytes). The copy engine generates every row address itself and moves each 128-byte row into shared memory in the background. Without it, as on the A100, the block's own threads work out every address and issue every copy: 8,192 bytes in 16-byte pieces is 512 copy instructions, 4 for each of 128 threads, each one an issue slot not spent on arithmetic.
> CAPTION: Describing a shape instead of listing addresses lets loading overlap computing completely: the threads hand over one instruction and go back to their maths. TMA details: NVIDIA's H100 whitepaper.

### Fig 37 · 4:54
**One multiprocessor is four identical quarters**
- [LABEL] One H100 multiprocessor
- [sub] quarter 1
- [sub] scheduler
- [sub] 32 FP32 lanes
- [sub] 1 tensor core
- [sub] 16,384 registers
- [sub] quarter 2
- [sub] scheduler
- [sub] 32 FP32 lanes
- [sub] 1 tensor core
- [sub] 16,384 registers
- [sub] quarter 3
- [sub] scheduler
- [sub] 32 FP32 lanes
- [sub] 1 tensor core
- [sub] 16,384 registers
- [sub] quarter 4
- [sub] scheduler
- [sub] 32 FP32 lanes
- [sub] 1 tensor core
- [sub] 16,384 registers
- [sub] 256 KB of L1 cache and shared memory, for all four
- [sub] TMA copy engine
- [PROSE] A multiprocessor is four identical quarters. Each has its own scheduler, 32 of the 128 FP32 lanes, one of the four tensor cores and a quarter of the register file: 16,384 registers, 64 KB. The 256 KB of L1 and shared memory, and the copy engine, serve all four. 128 lanes ÷ 4 schedulers = 32, so each scheduler can send one instruction across 32 threads in a single tick. That is exactly the size of the group a scheduler issues to, which the next part names. The match is the H100's, not a law: an A100 multiprocessor has 64 FP32 lanes, 16 a quarter, and runs the same 32-thread instruction over two ticks.
> CAPTION: A floor plan: the four quarters are peers, side by side, and none contains another. The next part builds the hierarchy of threads that runs on them. Layout from NVIDIA's H100 whitepaper and CUDA programming guide.


## Threads, warps and the chip
_The second structure, and this one really does nest._

### Fig 38 · 5:09
**32 threads make a warp**
- [HEAD] one warp = 32 threads
- [PROSE] The threads on a multiprocessor always move in warps of 32, never one at a time.
> CAPTION: The warp, not the thread, is the unit the hardware schedules. Everything about performance is really about warps.

### Fig 39 · 5:22
**A kernel is written for one thread; each thread finds its data from its own number**
- [HEAD] The whole kernel: two lines, run by every thread
- [sub] i = block number × 256 + thread number
- [sub] c[i] = a[i] + b[i]
- [sub2] block
- [sub2] thread
- [sub2] its i
- [sub2] where a[i] sits, in bytes from the start
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 4
- [sub] 3
- [sub] 5
- [sub] 773
- [sub] 3,092
- [sub] 0
- [sub] 64 … 95
- [sub] 64 … 95
- [sub] 256 … 383: 128 bytes side by side
- [sub2] last row: one warp, threads 64 to 95 of block 0
- [PROSE] A kernel is the program the GPU runs. It is written once, for a single thread, and launched over thousands of threads at a time. Every thread runs the same lines; the only thing that differs is its number. The hardware hands each one its block number and its thread number inside the block. The first line turns those into an index. Thread 5 of block 3 gets i = 3 × 256 + 5 = 773, so it adds element 773 of a and b, which sit 773 × 4 = 3,092 bytes from the start of each array of 4-byte numbers. Neighbouring threads get neighbouring indices. The warp made of threads 64 to 95 reads 32 numbers lying side by side, 128 consecutive bytes, which Part 9 shows is exactly what memory wants.
> CAPTION: The same instruction, different data, comes from one line of arithmetic on the thread's own number. The index formula is the one NVIDIA's own examples use.

### Fig 40 · 5:22
**A launch is a grid of blocks, and a block is the unit that shares memory**
- [LABEL] one launch: a grid of blocks
- [sub] block 0
- [sub] block 1
- [sub] block 2
- [sub] block 3
- [sub] block 4
- [sub] block 5
- [sub] block 6
- [sub] block 7
- [sub] block 8
- [sub] block 9
- [sub] block 10
- [sub] block …
- [LABEL] one multiprocessor
- [sub] block 4: 1,024 threads, 32 warps
- [sub] block 9: 1,024 threads, 32 warps
- [sub] shared memory: a separate part each
- [PROSE] Launching a kernel means asking for a grid of blocks. To add two arrays of 1,048,576 numbers with 256 threads per block takes 4,096 blocks. A block may hold up to 1,024 threads, 32 warps. The hardware places each block whole on one multiprocessor, which keeps it until all its threads finish. A multiprocessor holds up to 2,048 threads, two blocks of 1,024 or eight of 256, and never more than 32 blocks at once. Shared memory belongs to a block. Its threads all see the same scratchpad, as the staged tile did, and no other block can see it. That is why a block, and not a warp or a launch, is the unit that cooperates.
> CAPTION: Two levels between the thread and the chip: warps for issuing instructions, blocks for sharing memory. Limits from NVIDIA's CUDA programming guide (compute capability 9.0).

### Fig 41 · 5:22
**One instruction, 32 lanes, different data**
- [LABEL] c[i] = a[i] + b[i]
- [sub] 64
- [sub] 65
- [sub] 66
- [sub] 67
- [sub] 68
- [sub] 69
- [sub] 70
- [sub] 71
- [sub] 72
- [sub] 73
- [sub] 74
- [sub] 75
- [sub] 76
- [sub] 77
- [sub] 78
- [sub] 79
- [sub2] lanes of warp 2; under each, the i it works on
- [PROSE] Fetched once, decoded once, fired across all 32 lanes in lockstep. Every lane runs the same add; lane k of this warp adds element 64 + k, the number its own thread index picked out. Sixteen lanes are drawn for legibility. All 32 execute the same instruction at the same moment. This is called SIMT: single instruction, multiple threads.
> CAPTION: The threads are not independent programs; they are lanes of one program, each pointed at its own data by its index.

### Fig 42 · 5:22
**What lockstep means**
- [HEAD] Lockstep: one instruction, everybody at once
- [sub] add
- [sub] add
- [sub] add
- [sub] add
- [sub] add
- [sub] add
- [sub] add
- [sub] add
- [sub2] all eight doing the same thing, on their own numbers
- [HEAD] Not lockstep: each free to do something different
- [sub] add
- [sub] load
- [sub] jump
- [sub] add
- [sub] store
- [sub] wait
- [sub] mul
- [sub] add
- [sub2] eight separate instruction streams to fetch and track
- [PROSE] The second is more flexible and far more expensive: eight of everything that reads, decodes and tracks instructions, rather than one shared between eight. This chip takes the first. Thirty-two lanes share one instruction, which is why they must all do the same thing, and why the two sins later in this document are both about that.
> CAPTION: The reason a warp exists at all. Sharing one instruction across thirty-two lanes is what frees the silicon that becomes arithmetic.

### Fig 43 · 5:49
**An instruction is itself a number, and decoding it is the costly part**
- [HEAD] FFMA R140, R11, R4, R142: one fused multiply-add, as the chip stores it
- [PROSE] first 64 bits
- [sub] 23
- [sub] 72
- [sub] 8c
- [sub] 0b
- [sub] 04
- [sub] 00
- [sub] 00
- [sub] 00
- [sub2] reg 4
- [sub2] reg 11
- [sub2] reg 140
- [sub2] operation
- [PROSE] second 64 bits
- [sub] 8e
- [sub] 00
- [sub] 00
- [sub] 00
- [sub] 00
- [sub] c4
- [sub] 0f
- [sub] 00
- [sub2] scheduling hints
- [sub2] reg 142
- [HEAD] Before any arithmetic: fetch it, decode it, issue it
- [sub] fetch: read the number
- [sub] decode: split the fields
- [sub] issue: send to the lanes
- [HEAD] Fetches and decodes paid for 32 additions, to scale
- [PROSE] one scalar core
- [sub2] 32
- [PROSE] one warp
- [sub2] 1
- [PROSE] A program is stored in memory like any other data. On Volta, the first chip with tensor cores, each instruction is one 128-bit number: here the bytes 8c, 0b and 04 name registers 140, 11 and 4, the second word's 8e names register 142, and the low bits of the first word name the operation. Before anything is computed, the chip must fetch that number and decode it, splitting it into fields and routing each one. That machinery is real silicon and spends energy on every instruction. A scalar core pays it for every operation it runs; a warp pays it once and spreads it across 32 lanes.
> CAPTION: Fetch and decode are paid per instruction, not per operation, so sharing one instruction across 32 lanes divides their cost by 32. That saving is the silicon that becomes arithmetic. Encoding from Jia et al. 2018.

### Fig 44 · 6:15
**64 warps fill one multiprocessor**
- [sub2] scheduler 1
- [sub2] scheduler 2
- [sub2] scheduler 3
- [sub2] scheduler 4
- [PROSE] 64 warps resident × 32 threads = 2,048 threads, the most one multiprocessor can hold. Each of the four schedulers owns 16 of them, a row here. Occupancy is the share of those 64 places actually filled: 64 resident warps is 100%, 32 is 50%. With enough of them filled, each scheduler almost always has a warp ready to fire.
> CAPTION: Sixty-four is a limit, not a requirement. What the warps are for, covering each other's waits, is the subject of Part 8.

### Fig 45 · 6:15
**With 64 warps resident, each thread moves once every sixteen ticks**
- [HEAD] One scheduler, 48 ticks, all 16 of its warps ready
- [PROSE] issues warp 0 runs
- [sub2] 1
- [sub2] 17
- [sub2] 33
- [sub2] 48
- [sub2] tick
- [PROSE] Every tick, each of the four schedulers issues one instruction across 32 lanes: 128 thread-instructions per tick for the multiprocessor. Spread over 2,048 resident threads, each thread gets a turn every 16 ticks, if every warp is ready all the time. At 1.98 billion ticks a second that is about 124 million instructions a second per thread, a sixteenth of the clock. The chip as a whole issues 33.5 trillion thread-instructions a second. This is what “not one of them is fast on its own” means in numbers. The speed is in the count, not in any one thread.
> CAPTION: Gold cells are warp 0's turns. Slow threads are not a flaw to be engineered away; they are how 64 warps share four schedulers, and it is the sharing that hides the waits.

### Fig 46 · 6:20
**To keep a pipe full, count what must be on the road**
- [HEAD] A pizza leaves every 5 minutes, and each round trip takes 30
- [sub2] driver 1
- [sub2] driver 2
- [sub2] driver 3
- [sub2] driver 4
- [sub2] driver 5
- [sub2] driver 6
- [sub2] 0 min
- [sub2] 15 min
- [sub2] 30 min
- [sub2] 45 min
- [sub2] 60 min
- [sub2] 75 min
- [sub2] at minute 42: six on the road (teal)
- [sub] on the road = rate × time each trip takes = 12 an hour × ½ hour = 6
- [HEAD] The same sum for HBM
- [sub] 3,352 bytes per ns × 273 ns per trip = 915,096 bytes on the road
- [PROSE] To keep deliveries leaving every five minutes, the shop needs enough drivers out to cover a whole round trip. Fewer, and the ovens wait for drivers; more, and drivers wait for pizzas. This is Little's law: amount in flight = rate × time each item spends in flight (V1 Fig 53). HBM hands over 3,352 bytes every nanosecond, and a request takes about 273 ns to come back (measured on a Hopper GPU as 479 ticks of its 1.755 GHz clock). So about 915 thousand bytes must be requested and not yet returned at every moment, or the bus runs part empty.
> CAPTION: Bandwidth is only reached if enough requests are outstanding to cover the wait. The wait here was measured with the chip otherwise idle (Luo et al. 2024); under load it grows, and so does the amount that must be in flight.

### Fig 47 · 6:20
**2,048 threads can keep HBM busy, with little to spare**
- [HEAD] Bytes in flight per multiprocessor: needed, against what 2,048 threads can ask for
- [sub] 915,096 bytes in flight ÷ 132 multiprocessors = 6,933 bytes each
- [PROSE] needed
- [sub2] 6,933 bytes
- [PROSE] 4 bytes per thread
- [sub2] 8,192 bytes
- [PROSE] 16 bytes per thread
- [sub] 32,768 bytes
- [PROSE] If every one of the 2,048 threads has one 4-byte load outstanding, that is 8,192 bytes, 1.18 times what is needed: enough, just. A single load instruction can fetch 16 bytes, and then 2,048 threads cover the need 4.7 times over. The 2,048 is not derived from this sum. The V100, A100 and H100 all cap a multiprocessor at 2,048 threads, while their memories run at 0.9, 2.0 and 3.35 TB/s. The cap happens to clear the bar on the H100; the arithmetic checks it, it does not explain it.
> CAPTION: Little's law as a check, not a cause. And the margin is thinner than it looks: the latency was measured on an idle chip, and it grows when the memory is busy.

### Fig 48 · 6:20
**Assembled: the whole execution hierarchy**
- [LABEL] H100
- [sub] 132 multiprocessors
- [LABEL] One multiprocessor
- [sub] up to 64 warps, from up to 32 blocks
- [LABEL] One block
- [sub] up to 1,024 threads: 32 warps, one shared memory
- [LABEL] One warp
- [sub] 32 threads, one instruction
- [sub] t0
- [sub] t1
- [sub] t2
- [sub] …
- [sub] t31
- [PROSE] 32 threads make a warp. A block is up to 32 warps, placed whole on one multiprocessor and sharing one slice of shared memory. A multiprocessor holds up to 64 warps. 132 multiprocessors make the chip. 32 × 64 × 132 = 270,336 threads in flight.
> CAPTION: Every number in Parts 2 to 4 sits somewhere on this chain. Rebuild the chain and that whole stretch is yours.


## The two cardinal sins
_Both waste the resource the chip is starved for._

### Fig 49 · 6:38
**What a branch is**
- [HEAD] A branch is a fork in the instructions
- [sub] if this value is large
- [sub] do one thing
- [sub] do the other
- [PROSE] On an ordinary processor this is routine. One thread reaches the fork, takes one side, and carries on. Nothing is wasted. Here, thirty-two lanes reach the fork together sharing one instruction, and the value they are testing is different in every lane. Some lanes want the left path and some want the right, and there is only one instruction stream to give them. That conflict is what the next figure resolves, expensively.
> CAPTION: An ordinary construct in every program ever written. It becomes a performance problem only because of the lockstep decision in the previous part.

### Fig 50 · 6:38
**Warp divergence**
- [LABEL] The warp hits an if/else
- [sub] if
- [sub] if
- [sub] if
- [sub] if
- [sub] else
- [sub] else
- [sub] else
- [sub] else
- [LABEL] First pass: the if-path runs
- [sub2] idle
- [sub2] idle
- [sub2] idle
- [sub2] idle
- [LABEL] Second pass: the else-path runs
- [sub2] idle
- [sub2] idle
- [sub2] idle
- [sub2] idle
- [PROSE] There is only one instruction stream, so the hardware cannot run both branches at once. It runs them back to back, masking off half the lanes in each pass.
> CAPTION: Each lane sits idle through the half it skipped, so a balanced if/else halves throughput.

### Fig 51 · 7:09
**Masked lanes still take their turn, so each nested fork halves the useful work**
- [HEAD] The active mask: one bit per lane, 8 of the 32 drawn
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub2] a 0 lane still takes its slot, then throws its result away
- [HEAD] Useful share of the lanes' slots, if every fork splits the warp in half
- [PROSE] no fork
- [sub] 100% useful: 1 pass
- [PROSE] one fork
- [sub] 50% useful: 2 passes
- [PROSE] two, nested
- [sub2] 25% useful: 4 passes
- [PROSE] three, nested
- [sub2] 12.5% useful: 8 passes
- [PROSE] The hardware keeps a bitmask of which lanes are active. Inactive lanes still occupy their place in the instruction; they simply discard the answer. Nothing waits and nothing is recomputed, yet time passes with only some of the lanes doing useful work. The cost is not the decision itself. One instruction stream cannot serve two destinations at once, so it serves them one after the other. Each nested fork doubles the passes: one fork means two, two nested forks four, three make eight. So well-written kernels avoid branching on data inside a warp. A fork costs nothing when all 32 lanes go the same way.
> CAPTION: Bars to scale. Divergence is not a stall: it is issue slots spent on lanes that discard their results, which is why it shows up as lost throughput, never as waiting.

### Fig 52 · 7:09
**Both sins have the same cause**
- [HEAD] The two sins, side by side
- [LABEL] Divergence
- [sub] lanes in one group want
- [sub] different instructions
- [LABEL] Uncoalesced access
- [sub] lanes in one group want
- [sub] scattered addresses
- [PROSE] The same shape of problem, on the chip's two resources. A group of thirty-two shares one instruction and one memory request, and both are wasted when the thirty-two disagree. Divergence wastes issue slots. Scattered access wastes bandwidth, and bandwidth is the scarcer of the two by a wide margin. The second is the subject of a later part. Both come from the same design decision, which is that thirty-two lanes act as one.
> CAPTION: Naming them together makes the pattern visible: a group that acts as one is only efficient when its members agree, on instructions and on addresses alike.


## Why memory is slow in the first place
_The hierarchy is not an arbitrary design choice. It follows from what a memory cell is._

### Fig 53 · 7:44
**SRAM holds a bit in six transistors; DRAM holds it as charge on one capacitor**
- [HEAD] An SRAM cell: six transistors
- [sub2] two loops that hold each other's state
- [sub2] read in one cycle, without disturbing it
- [HEAD] A DRAM cell: one transistor, one capacitor
- [sub] C
- [sub2] the bit is a tiny charge on C
- [sub2] full is 1, empty is 0
- [HEAD] Left alone, the capacitor's charge leaks away
- [sub2] below this, it reads as 0
- [sub2] full
- [sub2] time
- [PROSE] Six transistors per bit against one transistor and one capacitor. DRAM is therefore far denser and cheaper per bit, which is how 80 GB fits beside the chip, and SRAM is what the chip itself is built from. But a capacitor holds a charge the way a leaky bucket holds water. A DRAM cell has to be topped up on a timer, and reading it is harder than reading an SRAM cell, as the next figure shows. That is the whole reason for a hierarchy: no technology has both density and speed, so machines use a little of the fast kind and a lot of the dense kind.
> CAPTION: The leak curve is schematic. Every rung of the ladder in the next part is a consequence of this one trade in silicon.

### Fig 54 · 7:44
**Reading DRAM destroys the bit, and every row must be rewritten every 64 ms**
- [HEAD] Reading a DRAM cell uses up what it read
- [LABEL] charge sits
- [LABEL] read: it drains out
- [LABEL] write it back
- [HEAD] And every row is rewritten on a timer, read or not
- [sub2] 0 ms
- [sub2] 64 ms
- [sub2] 128 ms
- [sub2] 192 ms
- [sub2] each jump up:
- [sub2] the row rewritten
- [sub2] back to full
- [PROSE] The charge is tiny, so measuring it drains it. Every read is a read followed by a rewrite, and the row is busy until the rewrite finishes. Charge also leaks, so the memory rewrites every row on a timer. A standard DRAM chip keeps its data only if every row is refreshed within 64 ms, or 32 ms above 85 °C. It does this with 8,192 refresh commands per window, one every 7.8 µs, each covering a slice of the rows: about 16 complete rewrites a second (31 when hot), whether or not anybody is reading.
> CAPTION: Refresh times from Micron's DDR4 datasheet; the decay drawn is schematic. These are the price of density: they make DRAM slower to answer, but they do not cap its bandwidth, which comes from wires.

### Fig 55 · 7:44
**Why latency does not improve with a wider bus**
- [HEAD] One load from HBM, in nanoseconds, drawn to scale
- [PROSE] whole load
- [sub] about 273 ns, measured
- [PROSE] cell's own work
- [sub2] 27.5 ns: open a row, read a column
- [PROSE] In a standard DRAM chip, opening a row takes 13.75 ns and reading a column from the open row another 13.75 ns. A load from a Hopper GPU's HBM was measured at about 273 ns, ten times longer. Most of the wait is the journey: checking the caches on the way for a copy, crossing the chip to the right memory controller, queuing there, and coming back. The charge is a small part. None of that shrinks when the bus gets wider. More wires carry more at once; they do not shorten the trip. That is why bandwidth and latency move independently across generations.
> CAPTION: Bars to scale. The cell timings are Micron's for DDR4-3200, standing in for HBM, which is built from the same kind of DRAM cell; the load was measured by Luo et al. 2024.

### Fig 56 · 7:46
**Why there has to be a ladder at all**
- [HEAD] The same trade, in every storage technology ever built
- [sub2] faster
- [sub2] bigger
- [sub2] registers
- [sub2] on-chip SRAM
- [sub2] memory beside the chip
- [sub2] a disk
- [PROSE] Nothing sits in the top right. No technology is both the fastest and the largest: the fast kind is not dense, and the dense kind is not fast. There is also geometry. Fast means close, and only a little of anything can be close to a given point. Making a memory bigger necessarily puts most of it further away. Even 80 GB at register speed, if the cells allowed it, could not all be next to the arithmetic. So the only sensible design is a ladder: a very little of the fast kind, a great deal of the slow kind, and machinery to move things between them. The four rungs that follow are that ladder.
> CAPTION: Positions are illustrative, the empty corner is not. Speed needs proximity and capacity needs area, two reasons that each alone would force a hierarchy.


## The memory ladder
_Four rungs, each trading speed for capacity._

### Fig 57 · 7:46
**The four rungs**
- [HEAD] Capacity of each rung, summed over the whole chip (log axis)
- [PROSE] registers
- [sub2] 256 KB in each SM
- [sub2] 34.6 MB
- [PROSE] L1 and shared
- [sub2] 256 KB in each SM
- [sub2] 34.6 MB
- [PROSE] L2
- [sub2] one, for all 132 SMs
- [sub2] 52.4 MB
- [PROSE] HBM
- [sub2] beside the die
- [sub2] 80 GB
- [sub2] 1 MB
- [sub2] 1 GB
- [sub2] 1 TB
- [PROSE] Four rungs. Counted across the whole chip, the registers hold 34.6 million bytes and HBM holds 80 GB, about 2,500 times as much. Each step down is bigger, further from the arithmetic and slower. The registers and the 256 KB of L1 and shared memory are inside each multiprocessor; the L2 is shared by all 132; HBM is the separate memory stacked beside the die. Latency and bandwidth for each rung follow below.
> CAPTION: Bar length is capacity on a log scale, for the whole chip. That capacity grows as speed falls is the whole point of a ladder, and it traces back to the SRAM and DRAM cells of Part 6.

### Fig 58 · 8:21
**The same four rungs, nested by scope**
- [LABEL] GPU package
- [LABEL] GPU die
- [LABEL] One multiprocessor, of 132
- [sub] registers, 256 KB, single cycle
- [sub] L1 and shared memory, 256 KB
- [sub] L2 cache, 50 MB, shared by all 132
- [sub] HBM, 80 GB at 3.35 TB/s, off the compute die
- [PROSE] Registers and SRAM belong to one multiprocessor. L2 is shared chip-wide. HBM sits off the compute die entirely, stacked beside it on the package.
> CAPTION: Scope, drawn: each box holds what can be reached from inside it. Registers and the SRAM belong to one multiprocessor, the L2 to the whole die, and HBM is separate chips beside it.

### Fig 59 · 8:21
**What scope means**
- [HEAD] Scope: who is allowed to see a level
- [sub] registers
- [sub2] one thread, and nobody else
- [sub] shared memory
- [sub2] every thread in one block, and no others
- [sub] L2 cache
- [sub2] every multiprocessor on the chip
- [sub] main memory
- [sub2] everything, including other chips
- [PROSE] Speed is not the only axis. A level is also defined by who can reach it, and that is what makes shared memory a way for threads to cooperate rather than merely a fast cache. Two threads that need to exchange a value must meet at a level they can both see. The higher that level, the cheaper the exchange.
> CAPTION: The second axis of the ladder. It is why the assembled diagram nests, and why splitting work across multiprocessors is more expensive than splitting it within one.

### Fig 60 · 8:24
**All the fast memory on the chip holds less than a thousandth of the model**
- [HEAD] Areas to scale: a 70B model's weights, and all the fast memory on the chip
- [sub] 140 GB of weights
- [sub] 121.6 million bytes: every register, L1, shared memory and L2
- [PROSE] On-chip memory counts in powers of two: NVIDIA's KB is 1,024 bytes, strictly a kibibyte (KiB), and its MB 1,048,576 bytes (MiB), while a model's gigabytes, like a bandwidth's, are round billions. So the chip's registers are 33,792 KB = 34,603,008 bytes, the L1 and shared memory the same again, and the 50 MB L2 is 52,428,800 bytes: 121.6 million bytes in all, 0.087% of the 140 billion bytes of a 70B model. The L2 alone holds one part in 2,670 of the weights. Generating a token reads every weight exactly once, so by the time a weight could be reused, thousands of others have passed through: during decode the caches have almost nothing worth keeping.
> CAPTION: Drawn as areas, so the small square's side is the square root of the ratio. This is why every token's weights must come up from HBM: there is nowhere closer to keep them.

### Fig 61 · 8:45
**Every rung, with its numbers**
- [HEAD] Time to answer one load, in ticks (log axis)
- [PROSE] registers
- [sub2] about 1, the single cycle
- [PROSE] shared memory
- [sub2] 29
- [PROSE] L1 cache
- [sub2] 40.7
- [PROSE] L2 cache
- [sub2] 263
- [PROSE] HBM
- [sub2] 478.8
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [HEAD] Bytes each multiprocessor can take in per tick (log axis)
- [PROSE] registers
- [sub2] 1,536, one FFMA per lane
- [PROSE] shared memory
- [sub2] 128, 32 banks × 4 bytes
- [PROSE] L2 cache
- [sub2] about 39, measured
- [PROSE] HBM
- [sub2] 12.8, its 3.35 TB/s shared by 132
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] 10,000
- [PROSE] Latencies were measured on a Hopper GPU, the H800, with the chip otherwise idle: 29 ticks for shared memory, 40.7 for L1, 263 for L2 and 478.8 for HBM. Bandwidth falls the other way. An FFMA on every lane reads three 4-byte registers, 1,536 bytes a tick per multiprocessor; shared memory delivers 128; HBM's 3,352 GB/s, divided among 132 multiprocessors at 1.98 billion ticks a second, is 12.8.
> CAPTION: Latency: Luo et al. 2024, measured on an H800; the L2 rate is theirs too, per multiprocessor of the H800. Bank count: NVIDIA's CUDA programming guide. Each rung down is slower to answer and narrower.

### Fig 62 · 8:51
**The asymmetry that defines the craft**
- [HEAD] How much worse the bottom rung is than the top, on one log axis
- [PROSE] bandwidth, round figure
- [sub] 100×
- [PROSE] bandwidth, worked out
- [sub] 120×
- [PROSE] latency, round figure
- [sub] 1,000×
- [PROSE] latency, measured idle
- [sub] 479×
- [sub2] 1×
- [sub2] 10×
- [sub2] 100×
- [sub2] 1,000×
- [PROSE] Top to bottom, bandwidth is usually said to fall a hundredfold and latency to grow a thousandfold. Worked out from the previous figure, bandwidth falls about 120× and latency grows about 479× on an idle chip, and more when the memory is busy and requests queue. Either way, reaching down to HBM for a byte costs vastly more than doing arithmetic on a byte already at the top. GPU programming is largely the craft of staging data upward and keeping the maths units fed from the fast end.
> CAPTION: Log axis: the gaps span two and three decades, past what straight bars can show honestly. They call for different remedies: bandwidth by moving fewer bytes, latency by having more work in flight.


## How the chip survives slow memory
_It does not avoid the stall. It hides it._

### Fig 63 · 9:13
**What hiding a wait means**
- [HEAD] Hiding a wait, away from computers
- [PROSE] One cook
- [sub2] waits for the oven
- [sub] prep
- [sub2] stands there watching it
- [PROSE] One cook
- [sub2] with other dishes
- [sub] prep
- [sub] dish 2
- [sub] dish 3
- [sub] dish 4
- [PROSE] The oven takes the same time either way. What changes is whether the cook is idle while it runs. Nothing was made faster. The wait was covered with other work, and that is the whole of what latency hiding means. It only works if there are other dishes. On this chip they are other warps, and a large matrix multiply supplies thousands of them.
> CAPTION: The whole strategy in a kitchen. Notice what it does not do: no dish cooks faster, and no fewer trips are made to the oven, so it cannot help work that is short of bandwidth.

### Fig 64 · 9:13
**The stall**
- [PROSE] One warp
- [sub] compute
- [sub] stalled, hundreds of cycles
- [sub] resumes
- [PROSE] A CPU would dodge a wait like this by predicting what comes next and fetching early. The GPU has none of that machinery. It does something simpler instead.
> CAPTION: Hundreds of cycles, every time a value is not already on chip. With no prefetching, this would be fatal if the chip had only one thread to run.

### Fig 65 · 9:30
**64 resident warps take turns**
- [sub2] Warp 0
- [sub2] Warp 1
- [sub] compute
- [sub2] Warp 2
- [sub] compute
- [sub2] Warp 3
- [sub] compute
- [PROSE] While warp 0 waits, the scheduler runs warps that are ready. By the time its data returns, dozens of others have taken their turn. Each warp still waits the full latency. The multiprocessor never does.
> CAPTION: This is what resident warps are for. How many it takes depends on how much work each warp has between loads, which the next figure lets you test.

### Fig 66 · 9:47
**How many warps it takes to hide a wait**
- [HEAD] One scheduler's warps over 1,200 ticks: issuing, waiting for memory, queued
- [PROSE] scheduler its warps, one row each
- [sub2] 0
- [sub2] 300
- [sub2] 600
- [sub2] 900
- [sub2] 1,200
- [sub2] ticks
- [sub2] scheduler busy 100.0% of the time
- [sub2] warps needed to cover the wait: ⌈(32 + 479) ÷ 32⌉ = 16
- [sub2] this scheduler holds 16 of its 16 warps: occupancy 100.0%
- [PROSE] Each warp does c instructions of work, then waits L ticks for a load. While one waits, the scheduler issues from another that is ready. It stays busy only if the other warps' work covers one warp's whole cycle, so a scheduler needs (c + L) ÷ c warps, rounded up. With the measured 479-tick wait for HBM, 32 instructions between loads needs 16 warps, every warp a scheduler can hold. At 16 instructions it would need 31, and at 8 it would need 61, so even full occupancy leaves the scheduler idle three quarters of the time. A simplified model: real schedulers interleave warps, and loads overlap. Its arithmetic was checked against Python at many settings.
> CAPTION: Occupancy cannot hide latency when there is too little work between loads: the scheduler's busy share is set by work against wait, and the warp count only caps it.

### Fig 67 · 9:51
**Why switching is free here and not elsewhere**
- [HEAD] What switching normally costs
- [PROSE] An ordinary processor
- [sub] work
- [sub] save and restore
- [sub] work
- [PROSE] This chip
- [sub] work
- [sub] work
- [PROSE] An ordinary processor has one set of registers, so switching threads means copying one thread's values out and another's in. That is real work and real cycles. Here, every resident warp already owns its own slice of the register file, for as long as it is resident. There is nothing to save because nothing is shared; the scheduler simply points at a different warp next cycle. The cost is that the register file must hold every resident thread's slice at once, which is why it is so large: 256 kilobytes per multiprocessor, as large as the SRAM beside it.
> CAPTION: A cost moved rather than removed. The chip pays in silicon area, once, instead of in cycles, constantly.

### Fig 68 · 9:51
**Occupancy, and what caps it**
- [HEAD] What limits how many warps fit
- [LABEL] Register file
- [sub] 256 KB per SM
- [LABEL] Shared memory
- [sub] up to 228 KB
- [LABEL] Hard limit
- [sub] 64 warps
- [PROSE] A thread using more registers means fewer threads fit. A block reserving more shared memory means fewer blocks fit. Whichever runs out first caps occupancy. Occupancy is a latency-hiding metric, not a speed metric. High occupancy with bad access patterns is still slow, and a well-tuned kernel at 50% occupancy can beat a careless one at 100%.
> CAPTION: The number to chase is enough concurrency to cover memory latency, not the maximum the hardware permits.

### Fig 69 · 9:51
**Whichever runs out first sets the occupancy**
- [HEAD] Warps that could be resident, by each limit separately
- [PROSE] registers
- [sub2] 32 warps (8 blocks)
- [PROSE] shared memory
- [sub2] 16 warps (4 blocks)
- [PROSE] 64-warp limit
- [sub2] 64 warps (16 blocks)
- [PROSE] 32-block limit
- [sub2] 128 warps (32 blocks)
- [sub2] 64
- [sub2] resident: 4 blocks × 4 warps = 16 warps, occupancy 25.0%, set by shared memory
- [sub2] per block: 4 warps × 2,048 registers each; 50,176 bytes of shared memory with the 1 KB reserve
- [PROSE] Four things limit how many warps a multiprocessor can hold for one kernel, and each is counted separately: registers (handed out 256 at a time per warp, from four quarters of 16,384), shared memory (in 128-byte units, plus 1 KB reserved per block, from a carve-out of up to 228 KB), the 64-warp maximum and the 32-block maximum. Blocks are placed whole, so whichever limit is reached first sets the occupancy. Try 256 threads at 128 registers: the registers bind at 16 warps. Then 256 threads at 32 registers: everything fits, 64 warps. The rules are NVIDIA's occupancy calculator's for this chip; the page's arithmetic was checked against them in Python.
> CAPTION: Red marks the limit that binds. A kernel that asks for a little more of any one resource can lose a whole block's worth of warps at once, which is why occupancy moves in steps.


## Coalescing
_The second sin, and the arithmetic behind it._

### Fig 70 · 10:33
**Memory arrives in 32-byte sectors, four to a 128-byte line**
- [HEAD] One 128-byte line: four 32-byte sectors, eight 4-byte numbers in each
- [sub2] sector 0: 32 bytes
- [sub2] sector 1: 32 bytes
- [sub2] sector 2: 32 bytes
- [sub2] sector 3: 32 bytes
- [sub2] a warp reading 32 neighbouring numbers: one line, four sectors, every byte wanted
- [HEAD] The same warp, each lane in a different sector
- [sub2] 16 of the 32 sectors drawn; teal is the 4 bytes a lane asked for, red the 28 that came anyway
- [HEAD] Bytes moved for the same 128 bytes asked for, to scale
- [PROSE] neighbours
- [sub2] 128 bytes: 4 sectors, 100% used
- [PROSE] scattered
- [sub] 1,024 bytes: 32 sectors, 12.5% used
- [PROSE] The memory system never hands over a single number. On this chip, as on every NVIDIA GPU of compute capability 6.0 or later, a warp's reads are gathered into 32-byte sectors, and the caches keep them in 128-byte lines of four sectors. A sector comes whole even if one number in it is wanted. So when the 32 lanes ask for neighbouring 4-byte numbers, four sectors serve the whole warp. When each asks for a number in a different sector, 32 sectors come up: 1,024 bytes moved for 128 used, 8 times the traffic. Counted in lines it is 32 requests where one would have done.
> CAPTION: The block the hardware moves is the sector, so the worst a scattered warp can do is 8 times the bytes, not 32. Granularity from NVIDIA's CUDA C++ Best Practices Guide and Nsight Compute documentation.

### Fig 71 · 10:35
**32 lanes of 4 bytes fill one 128-byte line exactly**
- [sub] 32 threads × 4 bytes = 128 bytes = one line = four sectors
- [HEAD] What one warp instruction turns into, to scale
- [PROSE] line requests
- [sub2] 1 (neighbours)
- [sub2] 32 (128 bytes apart)
- [PROSE] sectors moved
- [sub2] 4 (neighbours)
- [sub2] 32 (128 bytes apart)
- [PROSE] The warp width and the line size are matched: a warp reading 32 consecutive 4-byte numbers asks for exactly one 128-byte line, and its four sectors carry nothing but wanted bytes. Put the lanes 128 bytes apart and every lane needs a line of its own: 32 requests where one would have done, the 32 transactions usually quoted. The bytes grow only eightfold, from 4 sectors to 32, because each request brings one 32-byte sector, not a whole line.
> CAPTION: Two costs, counted separately: requests the caches must handle, and bytes the memory must move. Scattering multiplies the first by 32 and the second by 8.

### Fig 72 · 10:38
**Why walking a column costs more than walking a row**
- [HEAD] How a grid of numbers is actually stored
- [sub] 0,0
- [sub] 0,1
- [sub] 0,2
- [sub] 0,3
- [sub] 0,4
- [sub] 0,5
- [sub] 1,0
- [sub] 1,1
- [sub] 1,2
- [sub] 1,3
- [sub] 1,4
- [sub] 1,5
- [sub] 2,0
- [sub] 2,1
- [sub] 2,2
- [sub] 2,3
- [sub] 2,4
- [sub] 2,5
- [sub2] the grid as you think of it
- [HEAD] In memory it is one long line, row after row
- [sub2] row 0
- [sub2] row 1
- [sub2] row 2
- [PROSE] Element (row, column) of a grid 6 numbers wide is number row × 6 + column in that line, so its address is (row × 6 + column) × 4 bytes from the start. Neighbours along a row are 4 bytes apart; neighbours down a column are 6 × 4 = 24 bytes apart. In a real matrix 4,096 numbers wide, one step down a column is 4,096 × 4 = 16,384 bytes. A warp walking down a column puts every lane in a different sector, and each 32-byte sector it fetches carries 4 useful bytes. So walking a row is cheap and walking a column is expensive, purely because of how the numbers were laid out. Nothing about the mathematics prefers either direction.
> CAPTION: Layout is not a detail. The same loop written two ways can differ eightfold in traffic without changing a single arithmetic operation.

### Fig 73 · 10:56
**What a stride is**
- [HEAD] Stride: how far apart the requested numbers are
- [PROSE] stride 1
- [sub2] consecutive
- [PROSE] stride 4
- [sub2] every fourth
- [PROSE] Both rows read numbers for the same arithmetic. For a whole warp of 32 lanes, stride 1 touches 4 sectors and stride 4 touches 16: four times the bytes, most of them thrown away. At a stride of 8 four-byte numbers, 32 bytes, every lane lands in its own sector and the waste reaches its maximum: 32 sectors, 1,024 bytes moved for 128 used. Larger strides spread the lanes over more cache lines, but move no more bytes. Which is why the shape of a loop, and the order its indices run in, is a bandwidth decision rather than a matter of taste.
> CAPTION: The dial that turns a coalesced access into an uncoalesced one. It is set by how the loop is written, which is why this is a programming concern and not a hardware one.

### Fig 74 · 10:56
**Coalesced against uncoalesced**
- [HEAD] Coalesced
- [HEAD] Uncoalesced
- [sub] t0
- [sub] t0
- [sub] t1
- [sub] t1
- [sub] t2
- [sub] t2
- [sub] t3
- [sub] t3
- [sub] four sectors, every byte wanted
- [PROSE] Each lane on the right drags in a whole 32-byte sector for its 4 bytes. The teal sliver, one eighth of each block, is the part anybody asked for; the rest is hauled across the bus and thrown away.
> CAPTION: Slivers drawn at their true eighth. The direct ancestor of the next atlas, on kernels: FlashAttention is in large part an exercise in making every fetched byte count.

### Fig 75 · 11:04
**Turn the stride and watch the bytes go to waste**
- [HEAD] Lane k reads the number at k × stride; each sector the warp pulls in, drawn
- [PROSE] the 32 lanes sectors fetched
- [sub2] teal: bytes some lane asked for; red: the rest of each 32-byte sector
- [PROSE] bytes moved bytes asked for
- [sub2] sectors fetched: 32 × 32 = 1,024 bytes
- [sub2] 128-byte lines touched: 8
- [sub2] bytes the threads asked for: 32 × 4 = 128
- [sub2] used: 12.5% of what was moved
- [PROSE] At stride 1 the 32 lanes read neighbours and four sectors carry everything. Every doubling of the stride doubles the sectors until, at 8 numbers of 4 bytes (32 bytes), every lane has a sector to itself: 32 sectors, 1,024 bytes moved, 12.5% used. Beyond that the waste stays the same; the lanes just spread over more lines. Wider numbers waste less, because each lane uses more of its sector: 8-byte numbers at any large stride still use a quarter. The sector rule is NVIDIA's; the page's arithmetic was checked against Python at every setting.
> CAPTION: Same arithmetic at every setting; only where the numbers sit changes, and with it up to eight times the traffic for 4-byte numbers.


## The memory wall
_Why the ratio keeps getting worse._

### Fig 76 · 11:43
**What a generation is**
- [HEAD] What a generation means
- [PROSE] Volta
- [sub2] 2017
- [PROSE] Ampere
- [sub2] 2020
- [PROSE] Hopper
- [sub2] 2022
- [PROSE] Blackwell
- [sub2] 2024
- [PROSE] Roughly every two years, a new design on a smaller manufacturing process. Bars show peak arithmetic rate, and most generations add a narrower number format that multiplies it again. A quantity that doubles every two years grows thirty-two-fold in a decade. Arithmetic has roughly kept that pace. Memory bandwidth has not, and the next figures are about why that difference is structural rather than a matter of effort.
> CAPTION: Bars are relative peak rates rather than a single measured metric. The point is the shape of the climb, not any one number on it.

### Fig 77 · 11:43
**Two curves that keep diverging**
- [sub2] compute
- [sub2] bandwidth
- [sub2] 2017
- [sub2] 2024
- [PROSE] Both climb. Compute climbs faster, largely because each generation adds a lower-precision format that multiplies throughput without new silicon. The widening gap is the memory wall.
> CAPTION: Schematic. The next figure puts real numbers on it, and they are more lopsided than the sketch suggests.

### Fig 78 · 11:48
**The wall, in numbers**
- [HEAD] Generation
- [HEAD] Dense 16-bit compute
- [HEAD] Bandwidth
- [HEAD] Ridge
- [PROSE] V100, 2017
- [sub2] 125 TFLOP/s (1×)
- [sub2] 0.9 TB/s (1×)
- [sub2] 139
- [PROSE] A100, 2020
- [sub2] 312 TFLOP/s (2.5×)
- [sub2] 2.0 TB/s (2.3×)
- [sub2] 153
- [PROSE] H100, 2022
- [sub2] 989 TFLOP/s (7.9×)
- [sub2] 3.35 TB/s (3.7×)
- [sub2] 295
- [PROSE] B200, 2024
- [sub2] 2,250 TFLOP/s (18×)
- [sub2] 8.0 TB/s (8.9×)
- [sub2] 281
- [PROSE] Over seven years, dense 16-bit compute grew eighteen-fold and bandwidth about nine-fold. The ridge, their ratio, doubled from 139 to around 290. It did not rise every generation: the B200's 281 sits just below the H100's 295, because Blackwell's memory grew a little faster than its 16-bit compute. Even so, work that kept a V100's maths busy can be memory-bound on an H100 without anything about it having changed.
> CAPTION: At 16 bits the ridge doubled and then held level. The climb went somewhere else: into each generation's newest, narrowest format, next. Figures from NVIDIA's whitepapers, datasheets and B200 specifications (dense, without sparsity).

### Fig 79 · 12:00
**Why the two curves had to diverge**
- [HEAD] Why bandwidth cannot keep up: it needs physical connections
- [PROSE] On the same package
- [sub2] about 1,024 parallel signals
- [sub2] a stack of memory, millimetres away
- [PROSE] Across a board
- [sub2] about 64 signals
- [sub2] centimetres away
- [PROSE] Down a cable
- [sub2] about 4 signals
- [sub2] metres away
- [PROSE] Bandwidth is width times frequency, and width means real wires. A thousand of them can be run over millimetres, dozens over centimetres, a handful over metres. Arithmetic has no equivalent constraint. Adding more multipliers needs area, and area has been getting cheaper for fifty years. So one curve is limited by how small a transistor can be made, and the other by how many wires will fit between two objects. They were never going to grow at the same rate.
> CAPTION: Signal counts are approximate and vary by design. The ordering, and the reason for it, are not approximate at all.

### Fig 80 · 12:05
**At each generation's narrowest format, the ridge climbs eightfold**
- [HEAD] Ridge, in operations per byte, at 16 bits and at each chip's narrowest float (log axis)
- [PROSE] V100, 2017
- [sub2] 139 at 16-bit
- [sub2] 139 at FP16
- [PROSE] A100, 2020
- [sub2] 153 at 16-bit
- [sub2] 153 at BF16
- [PROSE] H100, 2022
- [sub2] 295 at 16-bit
- [sub2] 590 at FP8
- [PROSE] B200, 2024
- [sub2] 281 at 16-bit
- [sub2] 1,125 at FP4
- [sub2] 100
- [sub2] 200
- [sub2] 500
- [sub2] 1,000
- [sub2] 2,000
- [PROSE] Each generation's tensor cores accept a narrower number, and halving the bits roughly doubles the operations per second on the same chip. Bandwidth gets no such multiplier. So at each chip's narrowest floating-point format the ridge climbs from 139 on the V100 to 1,125 on the B200, 8.1 times higher, while at 16 bits it only doubled. Halving the bits also halves the bytes per weight, so work moved to the new format does twice the operations per byte: decode at 8 bits does 2 (V1 Fig 109), still 295 times below the FP8 ridge of 590. The formats speed up both sides for the work that adopts them; the headline compute races ahead of bandwidth.
> CAPTION: This is the trend behind “compute climbed faster still”: not more silicon so much as narrower numbers. The A100 added no narrower float than 16 bits, which is why its two bars match.

### Fig 81 · 12:13
**The natural experiment**
- [LABEL] H100
- [sub] same compute die, same tensor cores
- [sub] 80 GB at 3.35 TB/s
- [LABEL] H200
- [sub] same compute die, same peak FLOPS
- [sub] 141 GB HBM3e at 4.8 TB/s
- [PROSE] NVIDIA effectively ran the controlled experiment. The only thing that changed is the memory: 1.43 times the bandwidth. For memory-bound work that upgrade alone is a genuine speed-up. Direct evidence that inference is limited by bandwidth rather than by tensor-core speed.
> CAPTION: The cleanest single argument for the whole thesis: same compute, more bandwidth, faster inference.

### Fig 82 · 12:45
**The H200's extra 43% of bandwidth is 43% more tokens a second**
- [HEAD] Same compute die, different memory, drawn to scale
- [PROSE] bandwidth, TB/s
- [sub2] H100: 3.35
- [sub2] H200: 4.8
- [PROSE] tokens a second
- [sub2] H100: 47.9
- [sub2] H200: 68.6
- [PROSE] ridge, ops per byte
- [sub2] H100: 295
- [sub2] H200: 206
- [PROSE] The H200 keeps the H100's compute die and replaces the memory: 141 GB at 4.8 TB/s against 80 GB at 3.35. That is 1.43 times the bandwidth. Decoding one request reads every weight once per token, so the token rate is bandwidth ÷ bytes (V1 Fig 125). For a 70B model stored at 8 bits, 70 GB, that goes from 47.9 to 68.6 tokens a second, the same 43% as the bandwidth, from a change that added no arithmetic at all. The ridge falls from 295 to 206: with more bytes a second, fewer operations per byte keep the same tensor cores busy. And 141 GB holds a 70B model's 140 GB at 16 bits, which an H100 cannot, though with almost nothing to spare.
> CAPTION: Bars to scale. The ceiling assumes the model fits and nothing else competes for the bus; real systems land below it, but the ratio carries over. Memory figures from NVIDIA's H200 datasheet.

### Fig 83 · 12:56
**Three attacks on the wall**
- [LABEL] Lower precision
- [sub] fewer bytes per weight
- [LABEL] Faster HBM
- [sub] more bytes per second
- [LABEL] Wider links
- [sub] between chips
- [PROSE] Every generation attacks the wall the same few ways. Which side of the wall a given operation lands on comes down to one number.
> CAPTION: The first is the subject of the fourth atlas, on quantization. The third is Part 14 below.


## The ridge
_One number that separates the two regimes._

### Fig 84 · 13:19
**What attainable means**
- [HEAD] Attainable: the best this chip could possibly do on this work
- [sub] attainable = the lower of the two limits
- [sub] what memory can deliver
- [sub] what arithmetic can consume
- [sub2] whichever is smaller is what you get
- [PROSE] It is a ceiling, not a prediction. A badly written kernel will fall well below it, but nothing can exceed it. That makes it the right thing to measure against. A kernel at 20% of attainable has a software problem; a kernel at 95% has a hardware one, and needs a different chip or a different algorithm. Knowing which of those two situations you are in is most of the value of the diagram.
> CAPTION: The diagram does not tell you how fast your code runs. It tells you how fast it could run, which is the more useful number.

### Fig 85 · 13:23
**The roofline, and the 295 it turns on**
- [sub] attainable = min( 989.4 trillion a second, 3.352 TB/s × intensity )
- [sub2] 0.1
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] 10,000
- [sub2] operations per byte (log)
- [sub2] 1 T
- [sub2] 10 T
- [sub2] 100 T
- [sub2] 1,000 T
- [sub2] operations a second (log)
- [sub2] ridge: 295
- [sub2] memory bound
- [sub2] compute bound
- [sub] ridge = 989.4 trillion ÷ 3.352 trillion bytes = 295 operations per byte
- [PROSE] A recap of V1's roofline (V1 Fig 115). Below the ridge the slanted roof binds: the chip can do no more operations a second than bandwidth times intensity. Above it the flat ceiling binds, the tensor cores' peak. The ridge is where the two meet, the two hardware peaks divided (V1 Fig 119). Below 295 operations per byte a kernel waits on HBM; above it, on the tensor cores.
> CAPTION: Both axes logarithmic. The ridge is not a free-standing number: it is the tensor cores' peak over HBM's bandwidth, so every change to either chip spec moves it.

### Fig 86 · 13:46
**Where prefill and decode land**
- [sub] intensity = operations ÷ bytes moved
- [PROSE] decode
- [sub2] 1 token
- [sub2] 1 per byte
- [PROSE] prefill, all bytes
- [sub2] 2,048 tokens
- [sub2] 1,024 per byte
- [PROSE] prefill, weights only
- [sub2] as V1 counts it
- [sub2] 2,048 per byte
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] the ridge, 295
- [PROSE] The same weights, the same chip, 16-bit numbers. A token's vector times a 4,096 × 4,096 weight matrix uses each weight once: one operation per byte. A 2,048-token prompt times the same matrix reuses each weight 2,048 times. Counting every byte read and written, prefill does 1,024 operations per byte; counting only the weights, 2,048. V1's “about 2,000” counts a whole 70B model, where the weights dwarf everything else (V1 Fig 121). Either way prefill sits far right of the ridge and decode far left.
> CAPTION: Log axis; intensity computed from the shapes. This single comparison explains most of what is strange about serving large language models.

### Fig 87 · 13:46
**Intensity, worked for two real operations**
- [HEAD] Two operations at 16 bits, against the H100's ridge (log axis)
- [PROSE] adding two arrays
- [sub2] c[i] = a[i] + b[i]
- [sub2] 0.17 per byte
- [PROSE] multiplying two matrices
- [sub2] 1,024 × 1,024 each
- [sub2] 341 per byte
- [sub2] 0.1
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] ridge 295
- [PROSE] Adding two arrays reads two numbers and writes one for each addition: 6 bytes per operation at 2 bytes a number, 0.17 operations per byte. Multiplying two 1,024 × 1,024 matrices does 2 × 1,024³ = 2,147,483,648 operations on 3 × 1,024² numbers, if each is read or written only once, the best case that tiling approaches: 6,291,456 bytes, 341 operations per byte, just right of the ridge. Two thousand times apart, and neither number depends on the chip. The chip only decides where the ridge falls; which side you land on was settled by the mathematics.
> CAPTION: Computed from the shapes, not measured. Precision moves intensity too: at 32 bits every number takes twice the bytes, and both intensities halve.


## The tensor core
_The unit that produces almost all the throughput._

### Fig 88 · 14:04
**Multiplying two matrices is every row meeting every column**
- [HEAD] Row 1 of A meets column 1 of B: multiply the pairs, add, and that is one entry
- [sub] 5
- [sub] 6
- [sub] 7
- [sub] 8
- [sub] 1
- [sub] 2
- [sub] 3
- [sub] 4
- [sub] 19
- [sub] 22
- [sub] 43
- [sub] 50
- [sub2] B
- [sub2] A
- [sub2] C = A × B
- [sub] c11 = 1 × 5 + 2 × 7 = 19
- [sub] c12 = 1 × 6 + 2 × 8 = 22
- [sub] c21 = 3 × 5 + 4 × 7 = 43
- [sub] c22 = 3 × 6 + 4 × 8 = 50
- [PROSE] To multiply two matrices, every row of the first meets every column of the second. Multiply the pairs, add the products, and the sum is one entry of the answer: row 1 of A against column 1 of B gives 1 × 5 + 2 × 7 = 19. Two 2 × 2 matrices take 8 multiply-adds, and every number is used twice: the 1 meets both the 5 and the 6. For two n × n matrices it is n³ multiply-adds from 2n² numbers, so every number is used n times. A matrix times a vector is the case where B has one column (V1 Fig 66): each weight meets one number and is used once. That is decode. A prompt of many tokens makes B a matrix with a column per token, and every weight is used once per token.
> CAPTION: Matrix × matrix is matrix × vector done for many vectors at once. The reuse that brings is the whole difference between prefill and decode, and the whole reason for the tensor core.

### Fig 89 · 14:16
**Scalar against tile**
- [HEAD] A CUDA core, one cycle
- [HEAD] A tensor core, one instruction
- [PROSE] A CUDA core multiplies two numbers and adds a third, producing one result per cycle. A tensor core multiplies two small matrices and adds a third, producing a whole tile at once. That operation is matrix multiply accumulate, and it is all a tensor core does.
> CAPTION: Sixteen output cells drawn. The narrowness is the point: a unit that does one thing, extremely fast, with no generality to pay for.

### Fig 90 · 14:16
**What the instruction actually does**
- [HEAD] One matrix multiply accumulate instruction
- [sub] A tile
- [HEAD] x
- [sub] B tile
- [HEAD] +
- [sub] C tile
- [HEAD] =
- [sub] D tile
- [PROSE] All four operands are small matrices. The instruction issues once and the hardware performs every multiply and add inside the tile. In the older warp-wide form the operands sit in registers; Hopper's newer form can read A and B straight from shared memory. The accumulator, C and then D, is usually kept at higher precision than A and B, so that a long chain of accumulations does not lose information.
> CAPTION: One instruction, thousands of multiply-adds: a warp's 16 × 8 × 16 step is 2,048. That density is why four tensor cores outproduce 128 scalar cores more than sevenfold at 16 bits.

### Fig 91 · 14:28
**Inside one tensor-core step: a 4 × 4 tile, 64 multiply-adds, every number used four times**
- [HEAD] D = A × B + C on a 4 × 4 tile, with one entry traced
- [sub2] A
- [sub2] B
- [sub2] C
- [sub2] D
- [HEAD] ×
- [HEAD] +
- [HEAD] =
- [sub] d23 = a21·b13 + a22·b23 + a23·b33 + a24·b43 + c23
- [PROSE] one 4 × 4 × 4 step
- [sub] 64 multiply-adds from 32 numbers: each used 4 times
- [PROSE] Volta's tensor core, 2017
- [sub] exactly this step, 64 multiply-adds every tick
- [PROSE] Hopper's tensor core
- [sub] 512 multiply-adds every tick
- [PROSE] one warp instruction
- [sub] 16 × 8 × 16 = 2,048 multiply-adds: 4 ticks of one core
- [PROSE] Each of the 16 entries of D is a row of A against a column of B, four multiply-adds, plus the matching entry of C: 64 multiply-adds in all. Every number of A and B is used four times, once for each entry in its row or column of D. The first tensor cores, in Volta, did exactly one such 4 × 4 × 4 step per tick. Hopper's does 512 multiply-adds a tick, so a warp's 16 × 8 × 16 instruction, 2,048 multiply-adds, keeps one tensor core busy for four ticks.
> CAPTION: What “a whole tile at once” means, counted. Volta's rate and the 16 × 8 × 16 shape are from NVIDIA's A100 whitepaper; Hopper's rate is the one behind the 989.4 trillion.

### Fig 92 · 14:39
**Bigger tiles feed themselves: each number fetched is used n times**
- [HEAD] Times each fetched number is used, for an n × n × n tile (log axis)
- [PROSE] tile 2 × 2
- [sub2] 2 uses; 1 operation per byte
- [PROSE] tile 4 × 4
- [sub2] 4 uses; 2 operations per byte
- [PROSE] tile 16 × 16
- [sub2] 16 uses; 8 operations per byte
- [PROSE] tile 128 × 128
- [sub] 128 uses; 64 operations per byte
- [sub2] 1
- [sub2] 10
- [sub2] 100
- [PROSE] An n × n × n tile does n³ multiply-adds on 2n² numbers, so every number fetched is used n times, and at 2 bytes a number the tile does n ÷ 2 operations for each byte it brings in. Double the tile and the reuse doubles. That is why tensor cores work on tiles, why kernels stage large tiles in shared memory, and why prefill, whose many tokens make a wide tile, runs on the compute side of the ridge while decode, a tile one column wide, cannot.
> CAPTION: Reuse is a property of the shape, not of the chip. The same arithmetic returns as the systolic array in Part 15, which is a tile made of hardware.

### Fig 93 · 14:46
**Why one operation gets its own hardware**
- [HEAD] What a transformer actually spends its arithmetic on
- [sub] matrix multiplies
- [sub] rest
- [PROSE] Well over ninety percent. The remainder is additions, normalisations and the activation function, all of which are cheap and none of which dominate. A chip that did matrix multiplication superbly and everything else merely adequately would therefore be almost as good as one that did everything superbly, and much cheaper to build. The H100 has 528 such units, four per multiprocessor. It also explains the risk: a model whose arithmetic looked different would leave most of this chip idle.
> CAPTION: The bet made in silicon. It has paid off for a decade because the shape of the workload has not changed, and it is not guaranteed against a workload that does.

### Fig 94 · 15:10
**Peak against sustained**
- [HEAD] Peak against what code actually reaches
- [PROSE] Peak, from the specification
- [sub] 989 TFLOP/s
- [PROSE] A well-tuned kernel
- [sub] 50 to 80%
- [PROSE] Ordinary code Peak assumes every unit fed every cycle with no stalls, no divergence and no waiting on memory. Nothing achieves it and nothing is meant to. The gap between the first bar and the second is the subject of the next atlas, on kernels. So a chip is best compared with another chip on peak, and a program is best compared with itself on the fraction of peak it reaches.
> CAPTION: The third bar is illustrative. The first two are the ones quoted in practice, and confusing them is how most misleading performance claims are made.


## Precision
_The lever that moves two constraints at once._

### Fig 95 · 15:35
**Lower precision pays off twice**
- [LABEL] Fewer bits per number
- [LABEL] More through the tensor cores
- [sub] each second
- [LABEL] Fewer bytes across
- [sub] the memory bus
- [PROSE] More compute and less memory traffic from the same silicon. That is why every tensor-core generation has added a lower-precision format.
> CAPTION: Both arrows point at bottlenecks already established. The bytes side was counted in V1 Fig 109; the compute side is worked out over the next figures.

### Fig 96 · 15:40
**Multiplying in binary is long multiplication, and it costs width × width**
- [HEAD] 11 × 13 in binary, as long multiplication
- [sub2] 128
- [sub2] 64
- [sub2] 32
- [sub2] 16
- [sub2] 8
- [sub2] 4
- [sub2] 2
- [sub2] 1
- [PROSE] place value
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 0
- [sub] 1
- [HEAD] ×
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 1
- [sub] 1
- [sub] 1
- [sub2] 11 = 8 + 2 + 1
- [sub2] 13 = 8 + 4 + 1
- [sub2] 1 × 1011
- [sub2] 0 × 1011, one place left
- [sub2] 1 × 1011, two places left
- [sub2] 1 × 1011, three places left
- [sub2] 143 = 128 + 8 + 4 + 2 + 1
- [PROSE] 16 bits, each one AND the sum
- [sub] ANDs = width × width: 16 at 4 bits, 64 at 8, 256 at 16, 1,024 at 32
- [PROSE] Binary long multiplication is the decimal method with an easier times table. Each digit of 1101 is 0 or 1, so each row is either 0000 or a copy of 1011, shifted one place further left for each place, and the rows are added. Read by place value (V1 Fig 50), the sum is 128 + 8 + 4 + 2 + 1 = 143. Every bit in the four rows pairs one bit of 1011 with one bit of 1101, and it is 1 only when both are 1. A chip makes each with an AND gate: 4 × 4 = 16 of them for a 4-bit multiply, and four rows to add. So the work grows with the square of the width: 64 ANDs at 8 bits, 256 at 16, 1,024 at 32, each with its bits to add up. Halve the width of a number and its multiplier shrinks to about a quarter.
> CAPTION: 11 × 13 = 143, the way a chip does it. Storing a number costs its width; multiplying two costs the width squared, which is why narrow formats pay off so well in the arithmetic.

### Fig 97 · 15:50
**Why narrower numbers run faster**
- [HEAD] The same silicon as 32-bit, 16-bit or 8-bit multipliers (area to scale)
- [PROSE] one 32-bit multiplier
- [sub2] 1,024 ANDs
- [PROSE] four 16-bit ones
- [sub2] 256 ANDs each
- [PROSE] sixteen 8-bit ones
- [sub2] 64 ANDs each
- [PROSE] A multiplier's size goes with the square of its width (the last figure), so the area of one 32-bit multiplier holds four 16-bit ones, or sixteen 8-bit ones: 1,024 = 4 × 256 = 16 × 64. By area alone, halving the width would quadruple the multiplies per tick. Tensor cores double them instead: the H100 does 989.4 trillion operations a second at 16 bits and 1,978.9 trillion at 8. Why twice and not four times becomes clear once a floating-point number is taken apart (V2 Fig 104).
> CAPTION: Squares drawn to the AND-gate count, ignoring the wiring between them. The square law sets how much arithmetic fits; something else sets how fast it can be fed.

### Fig 98 · 16:00
**The generational ladder**
- [HEAD] Each generation's new, narrower tensor-core format (bar length is bits, to scale)
- [PROSE] FP16
- [sub2] 2017, Volta
- [sub] 16 bits
- [sub2] the first tensor-core format: 125 trillion a second on the V100
- [PROSE] FP8
- [sub2] 2022, Hopper
- [sub] 8 bits
- [sub2] 1,978.9 trillion on the H100, 2× its 989.4 at 16 bits
- [PROSE] FP4
- [sub2] 2024, Blackwell
- [sub] 4 bits
- [sub2] 9,000 trillion on the B200, 4× its 2,250 at 16 bits
- [PROSE] Each new format halves the bits, and on the chip that introduced it the rate doubles against 16 bits: the B200 does 2,250 trillion operations a second at 16 bits, 4,500 at 8 and 9,000 at 4. Across generations the gain compounds with everything else that improved, more and faster tensor cores among them: from the V100's 125 trillion at 16 bits to the B200's 9,000 trillion at 4 bits is 72 times.
> CAPTION: Bar length is bits per number, to scale. The doublings are measured against 16 bits on the same chip; rates are dense, from NVIDIA's whitepapers and the HGX B200 specifications.

### Fig 99 · 16:16
**What a floating-point number is**
- [HEAD] Scientific notation, in base two
- [sub] decimal: 1,500 = 1.5 × 10³
- [sub] binary: 6 = 110 = 1.1 × 2²
- [sub2] sign s
- [sub] 0
- [sub2] 0: plus
- [sub2] exponent e, 8 bits
- [sub] 10000001
- [sub2] 129 = 2 + 127
- [sub2] fraction f, 23 bits
- [sub] 10000000000000000000000
- [sub2] the .1 of 1.1, then zeros
- [sub] value = (−1)^s × 2^(e − 127) × 1.f
- [PROSE] Scientific notation writes a number as a few digits times a power of ten, the power saying where the decimal point goes. A floating-point number does the same in base two: 6 is 110 in binary, which is 1.1 × 2², the binary point moved two places. FP32 keeps the three parts in 32 bits. The sign bit is 0 for plus. The exponent field holds the power plus 127, the bias, so that negative powers need no sign of their own: 2² is stored as 129, and 2⁻³ would be 124. The fraction, often called the mantissa, holds the digits after the binary point. With the point placed just after the first 1, the digit before it is always 1, so it is not stored: the significand is 1.f, and FP32 gets 24 significant bits from 23.
> CAPTION: 6 written as FP32, checked in Python. Every format in this Part is these three fields in other widths; the fourth atlas, on quantization, takes them further (V4 Fig 45).

### Fig 100 · 16:20
**Range and precision are different things**
- [HEAD] Range and precision are bought separately
- [PROSE] More exponent bits
- [sub] reaches larger and smaller numbers
- [PROSE] More fraction bits
- [sub] tells nearby numbers apart
- [PROSE] A format with a wide exponent and a narrow fraction covers an enormous span coarsely. The reverse covers a narrow span finely. With a fixed number of bits, every one given to one field is taken from the other. There is no setting that improves both. So a format must choose. For neural networks the choice turned out to be range, and the next figures show what that buys and what it costs.
> CAPTION: Two properties that sound similar and trade directly against each other. Which one a workload needs is an empirical question, and deep learning gave a surprising answer.

### Fig 101 · 16:24
**BF16: keep the range, cut the precision**
- [HEAD] Three formats, one bit per 15 pixels
- [PROSE] FP32
- [sub2] 32 bits
- [sub2] 8 exponent bits
- [sub2] 23 mantissa bits
- [PROSE] FP16
- [sub2] 16 bits
- [sub2] 5 exponent bits
- [sub2] 10 mantissa bits
- [sub2] fine steps, narrow range
- [PROSE] BF16
- [sub2] 16 bits
- [sub2] 8 exponent bits
- [sub2] 7 mantissa bits
- [sub2] FP32's range, coarse steps
- [PROSE] Drawn to scale; the grey bit is the sign. The two 16-bit formats spend their bits in opposite ways. Deep learning leans on range while staying forgiving about precision. So BF16 keeps all eight of FP32's exponent bits, and with them FP32's range, and cuts the mantissa from twenty-three bits to seven. IEEE's FP16 does the reverse: ten mantissa bits and a five-bit exponent. BF16 is simply the first half of an FP32 number, rounded, so converting between the two costs almost nothing. NVIDIA reports that both 16-bit formats train networks in mixed precision to the same results as FP32, without retuning.
> CAPTION: Layouts and the training result from NVIDIA's A100 whitepaper. Mixed precision means low-precision inputs feeding higher-precision sums, the safeguard a few figures on.

### Fig 102 · 16:28
**π in BF16: 0 | 10000000 | 1001001 is 3.140625**
- [HEAD] π in BF16, read field by field
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 1
- [sub] 0
- [sub] 0
- [sub] 1
- [sub2] sign
- [sub2] exponent, 8 bits
- [sub2] fraction, 7 bits
- [sub] sign 0 → (−1)^0 = +1
- [sub] exponent 10000000 = 128 → 128 − 127 = 1 → 2^1 = 2
- [sub] significand 1.1001001 = 1 + 1/2 + 1/16 + 1/128 = 1 + 73/128 = 1.5703125
- [sub] value = +1 × 2 × 1.5703125 = 3.140625
- [PROSE] Each field is read by place value (V1 Fig 50). The exponent 10000000 is 128, and taking off the bias of 127 leaves 1. The fraction 1001001 is 73, so with its unstored leading 1 the significand is 1 + 73/128. π is 3.14159265…, so BF16's π is 0.00097 short, 0.031% off. Between 2 and 4 BF16's numbers are 2 ÷ 128 = 0.015625 apart, and π lies between 3.140625 and 3.15625, nearer the first. FP32 has sixteen more fraction bits, exactly the ones BF16 drops: its π, 3.14159274, is off by 0.0000028%.
> CAPTION: Checked in Python against FP32's π, whose first sixteen bits are exactly these. The first bit dropped is a 0, so cutting the rest off is the correct rounding here.

### Fig 103 · 16:33
**BF16 reaches 5 × 10³³ times higher than FP16, in steps eight times coarser**
- [HEAD] Range: smallest normal number to largest (log axis, eighty powers of ten)
- [PROSE] FP32
- [sub] 1.2 × 10⁻³⁸ to 3.4 × 10³⁸
- [PROSE] BF16
- [sub] 1.2 × 10⁻³⁸ to 3.4 × 10³⁸
- [PROSE] FP16
- [sub2] 6.1 × 10⁻⁵ to 65,504
- [sub2] 10⁻⁴⁰
- [sub2] 10⁻²⁰
- [sub2] 1
- [sub2] 10²⁰
- [sub2] 10⁴⁰
- [HEAD] Precision: every number each format holds from 1 to 1.03 (linear axis)
- [PROSE] FP16
- [sub2] every 0.00098
- [PROSE] BF16
- [sub2] every 0.0078
- [sub2] 1.00
- [sub2] 1.01
- [sub2] 1.02
- [sub2] 1.03
- [PROSE] The largest number has the biggest exponent and every fraction bit set; the smallest normal one has the smallest exponent and none. The all-zeros and all-ones exponent patterns are kept for zero, infinity and the tiniest numbers. So FP16, with five exponent bits and a bias of 15, spans 2⁻¹⁴ = 0.000061 to (2 − 2⁻¹⁰) × 2¹⁵ = 65,504, and BF16 spans 2⁻¹²⁶ to 3.4 × 10³⁸, the same powers of two as FP32. Precision runs the other way. Just above 1, FP16's numbers are 2⁻¹⁰ = 0.00098 apart and BF16's 2⁻⁷ = 0.0078, eight times coarser. Rounding to the nearest moves a value by at most 0.05% in FP16 and 0.4% in BF16. That is the whole trade: BF16 accepts a coarser blur on every number in order to reach every power of two that FP32 reaches.
> CAPTION: Both panels computed from the bit layouts, with FP16's and FP32's limits checked against numpy. On the top axis FP32 and BF16 differ only in the third digit of their largest number.

### Fig 104 · 16:38
**BF16's multiplier is a ninth the size of FP32's, yet the rate follows the bits**
- [HEAD] Each format's significand multiplier, width × width (area to scale)
- [PROSE] FP32: 24 bits
- [sub2] 24 × 24 = 576
- [PROSE] FP16: 11 bits
- [sub2] 11 × 11 = 121
- [PROSE] BF16: 8 bits
- [sub2] 8 × 8 = 64
- [PROSE] FP8: 4 bits
- [sub2] 4 × 4 = 16
- [HEAD] The H100's tensor-core rate, trillion operations a second (bars to scale)
- [sub2] bits a number
- [sub2] multiplier size
- [PROSE] TF32
- [sub2] 32
- [sub2] 121
- [sub2] 494.7
- [PROSE] FP16
- [sub2] 16
- [sub2] 121
- [sub2] 989.4
- [PROSE] BF16
- [sub2] 16
- [sub2] 64
- [sub2] 989.4
- [PROSE] FP8
- [sub2] 8
- [sub2] 16
- [sub2] 1,978.9
- [PROSE] Multiplying two floating-point numbers multiplies their significands and adds their exponents, since 2^a × 2^b = 2^(a + b). The adder is small, so the significand multiplier is most of the cost, and it grows with the square of the significand's width: 24 × 24 = 576 for FP32 against 8 × 8 = 64 for BF16, a ninth. Yet the rates follow the bits a number takes, not the multiplier. TF32 has FP16's 11-bit significand but is read as 32-bit numbers, and runs at half FP16's rate; BF16's multiplier is about half FP16's, at the same rate; FP8's is a quarter of BF16's, at twice the rate. The likely reason is delivery. Every operand must be carried to the tensor cores, and the paths that carry them move a fixed number of bits a tick, so halving the bits doubles the numbers that arrive. The square law sets how much arithmetic fits; the bits set how fast it is fed.
> CAPTION: Rates are dense, from NVIDIA's H100 whitepaper; TF32's layout is from the A100 whitepaper. The delivery explanation is reasoned from that pattern, not a published specification.

### Fig 105 · 16:44
**The accumulation safeguard**
- [LABEL] Multiplies run
- [sub] in low precision
- [LABEL] Results accumulate back in FP32
- [sub] so errors do not pile up
- [PROSE] Each product is added into a running total (V1 Fig 104), and the total is kept in FP32 even when the inputs are BF16 or FP8. It costs no speed: the H100's 989.4 trillion BF16 operations a second are quoted with FP32 accumulation. Google's TPUs make the same choice: bfloat16 multiplies, FP32 accumulation. The next figure shows what goes wrong without it.
> CAPTION: Storing, multiplying and accumulating in low precision are three separate decisions; the hardware takes the first two and declines the third. Sources: the H100 whitepaper's Table 3 and Google Cloud's TPU architecture page.

### Fig 106 · 16:49
**Add 1 over and over in BF16 and the total stops at 256**
- [HEAD] The running total, adding 1 each time, in three formats
- [sub2] 0
- [sub2] 1,000
- [sub2] 1,000
- [sub2] 2,000
- [sub2] 2,000
- [sub2] 3,000
- [sub2] 3,000
- [sub2] additions
- [sub2] running total
- [sub2] FP32: 3,000, exact
- [sub2] FP16: stuck at 2,048
- [sub2] BF16: stuck at 256
- [PROSE] Adding 1 stays exact only while the total's neighbours are at most 1 apart. BF16 has 8 significant bits, so from 256 its numbers run 256, 258, 260. 257 lies exactly halfway, the tie goes to 256, and every addition after that is rounded away. FP16, with 11 significant bits, lasts until 2,048; FP32, with 24, counts exactly to 16,777,216. A dot product of thousands of terms is just such a running total, which is why its sum is kept in FP32 even when every input is BF16. Real terms are not all 1, but the effect is the same: once the total is large, any term smaller than half the gap vanishes, and larger ones are rounded.
> CAPTION: Computed by emulating round-to-nearest, ties to even, in Python, and checked against numpy for FP16. The lines are the emulated totals, drawn through every point where their slope changes.

### Fig 107 · 16:54
**A caution on the marketing**
- [PROSE] Headline claim
- [sub] 9×
- [PROSE] Honest per-generation
- [sub2] gain on real work
- [sub2] 2 to 4×
- [PROSE] The headline blends the precision gain with faster interconnects and ideal benchmarks. Worth carrying as a habit: when a generational speed-up is quoted, ask which of the three attacks on the wall it is actually measuring.
> CAPTION: The kind of number that propagates through blog posts unchallenged. The underlying improvements are real; the multiplier is not comparable across workloads.


## When one chip is not enough
_A third bandwidth, and a different constraint._

### Fig 108 · 17:13
**The model does not fit**
- [sub] a frontier model's weights: hundreds of gigabytes
- [sub] H100: 80 GB
- [sub] H200: 141 GB
- [sub2] what a single chip holds
- [PROSE] This is a capacity wall, not a bandwidth wall. No amount of bandwidth helps if the weights do not fit at all. So the model is split across many GPUs, which then have to talk constantly. How fast they can talk becomes the next constraint.
> CAPTION: Capacity and bandwidth are independent failure modes with different remedies (V1 Fig 60). The weights bar is schematic; the next figure puts a real model to scale.

### Fig 109 · 17:21
**A 405-billion-parameter model at 16 bits needs eleven H100s before it does anything**
- [HEAD] Llama 3's 405B weights against H100 memory, in gigabytes (to scale)
- [PROSE] weights at 16 bits
- [sub2] 405 billion × 2 bytes
- [sub] 810 GB
- [PROSE] weights at 8 bits
- [sub2] 405 billion × 1 byte
- [sub] 405 GB
- [PROSE] H100s, 80 GB each
- [sub2] eight to a box
- [sub] 1
- [sub] 2
- [sub] 3
- [sub] 4
- [sub] 5
- [sub] 6
- [sub] 7
- [sub] 8
- [sub] 9
- [sub] 10
- [sub] 11
- [sub2] one box of eight: 640 GB
- [sub2] a second box
- [PROSE] Weights take parameters × bytes each (V1 Fig 49). Llama 3's largest model has 405 billion parameters, so at 16 bits its weights are 810 GB: ten full H100s and part of an eleventh, before any memory for the work itself. A box of eight H100s holds 640 GB, so at 16 bits the model spills into a second box, and whatever passes between the two goes over the network. At 8 bits the weights are 405 GB and fit in one box, with 235 GB to spare. A GB200 NVL72 rack holds 13.4 TB of HBM in one NVLink domain, more than sixteen times the 16-bit weights.
> CAPTION: Bars and boxes to scale; the dashed line is 810 GB. Parameter count from the Llama 3 paper, the rack's memory from NVIDIA's GB200 NVL72 specifications. Serving needs memory beyond the weights, so these counts are a floor.

### Fig 110 · 17:27
**What a link is**
- [HEAD] A link is a bundle of wires between two chips
- [sub] GPU A
- [sub] GPU B
- [sub2] the same width-times-frequency arithmetic as any other bus
- [PROSE] The difference from the memory bus is only distance and count. Fewer wires, longer, therefore slower, and each bit costs more energy to send. So a chip has three bandwidths, not one: to its own memory, to a neighbouring chip, and out to the network. On an H100 system each is several times slower than the one before, as the coming figures count. Keeping those three apart is essential once a model stops fitting on one chip, which is where this part is heading.
> CAPTION: Not a new kind of object. It is the same wires-times-frequency argument as the memory bus, applied over a longer distance.

### Fig 111 · 17:31
**Two ways to wire GPUs together**
- [LABEL] Scale-up
- [sub] one box or rack
- [sub2] NVLink and the NVSwitch crossbar
- [LABEL] Scale-out
- [sub] separate boxes
- [sub] box A
- [sub] box B
- [sub2] ordinary data-centre networking
- [PROSE] NVLink gives every GPU full-speed access to every other in the domain. InfiniBand between boxes carries about a ninth as many bytes a second, each way (V2 Fig 115).
> CAPTION: The boundary between the two is the most important line in a cluster: whatever crosses it pays the network's rate.

### Fig 112 · 17:42
**Wiring every pair stops scaling; a switch gives each GPU one connection**
- [HEAD] Eight GPUs, wired in pairs or through a switch
- [sub] 1
- [sub] 2
- [sub] 3
- [sub] 4
- [sub] 5
- [sub] 6
- [sub] 7
- [sub] 8
- [sub] 1
- [sub] 2
- [sub] 3
- [sub] 4
- [sub] 5
- [sub] 6
- [sub] 7
- [sub] 8
- [sub] switch
- [PROSE] wired in pairs: 28 links
- [sub2] each GPU's links split seven ways
- [PROSE] through a switch: 8 connections
- [sub2] any pair at the full rate
- [sub] links to join every pair = n(n − 1) ÷ 2: 6 for 4 GPUs, 28 for 8, 2,556 for 72
- [PROSE] Joining every pair of n GPUs directly takes n(n − 1) ÷ 2 links: each GPU pairs with the n − 1 others, and each link has two ends. That is 6 for 4 GPUs, 28 for 8 and 2,556 for 72. And a GPU's links are a fixed budget, 18 on the H100, so in a mesh of eight each pair gets only about a seventh of them, and a GPU sending to one neighbour leaves most of its links idle. A switch turns this around. Every GPU runs all its links to the switch, which connects any pair at the full rate, and the connections grow with the number of GPUs rather than with the number of pairs. In the DGX H100 the eight GPUs meet in four NVSwitch chips.
> CAPTION: Drawn as one switch; the DGX H100 spreads each GPU's 18 links over four switch chips (H100 whitepaper). NVIDIA describes its switches as giving all-to-all communication at full NVLink speed.

### Fig 113 · 17:48
**NVLink is not standing still**
- [HEAD] Each GPU's own memory against its NVLink, each way, in GB/s (to scale)
- [PROSE] A100
- [sub2] 2020
- [sub2] HBM 2,039
- [sub2] NVLink 300 each way, 600 both: HBM is 6.8× faster
- [PROSE] H100
- [sub2] 2022
- [sub2] HBM 3,352
- [sub2] NVLink 450 each way, 900 both: HBM is 7.4× faster
- [PROSE] B200
- [sub2] 2024
- [sub2] HBM 8,000
- [sub2] NVLink 900 each way, 1,800 both: HBM is 8.9× faster
- [PROSE] NVLink per GPU has tripled in two generations: 600 GB/s on the A100, 900 on the H100, 1.8 TB/s on Blackwell. Those quoted figures add both directions; each way it is 300, 450 and 900. HBM grew as well, so the gap has held: a GPU reads its own memory 6.8, 7.4 and 8.9 times faster than it can receive from a neighbour, or 3.4, 3.7 and 4.4 times against the quoted two-way figures. Not an order of magnitude, but enough that moving data between GPUs is never free.
> CAPTION: Bars to scale. HBM from the A100 80 GB datasheet, the H100 whitepaper and the DGX B200 specifications; NVLink from the H100 whitepaper and NVIDIA's NVLink page, whose per-GPU figures count both directions.

### Fig 114 · 18:02
**Why each level out is slower**
- [HEAD] Why leaving the package is expensive
- [LABEL] On package
- [sub] HBM, 5,120
- [sub] short wires
- [LABEL] Off package
- [sub] NVLink, 72 pairs
- [sub] of longer wires
- [LABEL] Across the room
- [sub] InfiniBand, a cable
- [PROSE] Bandwidth is width times frequency, and width means physical connections. A package can carry thousands of them over millimetres; a board connector carries far fewer over centimetres; a network cable carries fewer still over metres. Each hop out also costs more energy per bit, because driving a longer wire at the same rate takes more power. So the drop at each level, several times per step, is not a design oversight. It is geometry.
> CAPTION: The same width-times-frequency reasoning from Part 1, applied outward. It explains why the hierarchy continues past the chip boundary.

### Fig 115 · 18:12
**Three links, each wires × rate, in the same units**
- [HEAD] Bytes a second = wires × bits a second on each ÷ 8 bits a byte
- [sub] HBM: 5,120 wires × 5.238 Gb/s = 26,819 Gb/s → 3,352 GB/s
- [sub] NVLink: 18 links × 2 pairs × 100 Gb/s = 3,600 Gb/s → 450 GB/s each way
- [sub] InfiniBand: one 400 Gb/s port per GPU → 50 GB/s each way
- [PROSE] HBM, its own memory
- [sub2] 3,352 GB/s
- [PROSE] NVLink, a neighbour
- [sub2] 450 GB/s each way: 7.4× less
- [PROSE] InfiniBand, the network
- [sub2] 50 GB/s each way: 9× less
- [sub2] 10
- [sub2] 100
- [sub2] 1,000
- [sub2] 10,000
- [sub2] GB/s (log)
- [PROSE] Each link is wires times the rate on each wire, the arithmetic of any bus (V1 Fig 52). Link rates are quoted in gigabits a second; dividing by 8 gives gigabytes. NVLink's quoted 900 GB/s adds its two directions; one way it carries 450. InfiniBand's 400 Gb/s is one way, as NVIDIA's own switch figures show: its 64 ports of 400 Gb/s make the 51.2 Tb/s it quotes for both directions. Per direction, then, each step out is 7.4 times and then 9 times slower. NVLink is not an order of magnitude behind memory, 3.7 times against its quoted 900, but the network is close to an order of magnitude behind NVLink.
> CAPTION: Log axis, three powers of ten. HBM's width and clock and NVLink's 25 GB/s each way over two wire pairs per link are from the H100 whitepaper; the port rate from NVIDIA's Quantum-2 InfiniBand specifications.

### Fig 116 · 18:16
**Split a sum across two GPUs, and the halves must meet before the next layer**
- [HEAD] One output of a layer, a sum of eight terms, split across two GPUs
- [PROSE] weights w
- [sub] 2
- [sub] 1
- [sub] 3
- [sub] 1
- [sub] 1
- [sub] 2
- [sub] 2
- [sub] 1
- [PROSE] inputs x
- [sub] 1
- [sub] 2
- [sub] 1
- [sub] 3
- [sub] 2
- [sub] 1
- [sub] 1
- [sub] 2
- [LABEL] GPU A
- [sub] 2×1 + 1×2 + 3×1 + 1×3 = 10
- [LABEL] GPU B
- [sub] 1×2 + 2×1 + 2×1 + 1×2 = 8
- [PROSE] partial sums cross the link
- [sub] GPU A: 10 + 8 = 18
- [sub] GPU B: 8 + 10 = 18
- [sub] 2 all-reduces a layer × 80 layers = 160 every token
- [PROSE] Tensor parallelism splits each layer's weights across GPUs. Every output is a dot product, a sum of weight × input terms (V1 Fig 104), and with the weights split, each GPU can add up only its own share of the terms. Before the next layer can start, the shares must meet: each GPU sends its partial sum and each ends with the total. The exchange is called an all-reduce, and Megatron-LM's split needs two per layer, one after the attention block and one after the feed-forward block. For an 80-layer model such as Llama 3 70B that is 160 all-reduces for every token, each one a wait on the link. That frequency is why the link's speed matters so much.
> CAPTION: Numbers small enough to check by hand. Two all-reduces per layer in the forward pass is from the Megatron-LM paper, the layer count from the Llama 3 paper; the fifth atlas, on parallelism, builds the whole scheme.

### Fig 117 · 18:16
**Why the gap matters**
- [LABEL] One token, one layer
- [sub] GPU
- [sub] GPU
- [sub] GPU
- [sub] GPU
- [sub] GPU
- [sub] GPU
- [sub2] results exchanged twice a layer: 160 times a token for 80 layers
- [PROSE] Splitting a layer's matrix multiply across GPUs means they must exchange partial results constantly. Inside an NVLink domain that is affordable. Across InfiniBand it dominates. The frequency is what makes the difference decisive. A single slow exchange would not matter; 160 a token, each given a ninth of NVLink's bandwidth across InfiniBand, become the bottleneck.
> CAPTION: Communication is paid per layer per token, so it multiplies with model depth. It is the constraint the fifth atlas, on parallelism, is built around.

### Fig 118 · 18:37
**Growing the fast domain**
- [PROSE] DGX, A100 and H100
- [sub2] 8 GPUs in one domain
- [PROSE] GB200 NVL72 One liquid-cooled rack, all 72 in a single NVLink domain. Far more of the model fits in the fast neighbourhood before you are forced onto the slow fabric. Between them the 72 GPUs hold 13.4 TB, and through the rack's switches each reaches any other at the full 1.8 TB/s.
> CAPTION: The strategic response to the interconnect gap: rather than making the slow fabric faster, make the fast domain large enough that you rarely leave it.


## Other bets
_The same physics, organised differently._

### Fig 119 · 19:14
**A different bet: the systolic array**
- [LABEL] TPU
- [sub] one giant systolic array
- [PROSE] A fixed grid of multiply-accumulate cells. Data flows in from the edges and each cell passes its result to its neighbour, rhythmically.
- [sub2] No trips back to a register file
- [sub2] between operations.
- [PROSE] Because the operands march through the array, each value loaded is reused by many cells before it leaves. That is a hardware answer to the same arithmetic-intensity problem tiling solves in software. Well suited to dense matrix multiply and not much else, and for now rentable only on Google Cloud.
> CAPTION: Worth seeing because it makes the point that the multiprocessor model is one way to organise silicon around matrix multiplication, not the only way.

### Fig 120 · 19:21
**A systolic array, beat by beat**
- [HEAD] Weights held in the cells; A's numbers move right, running sums move down
- [sub2] rows of A, fed in on a slant
- [sub2] B's weights, one to a cell
- [sub] 2
- [sub] 1
- [sub] 3
- [LABEL] weight 1
- [sub] idle
- [LABEL] weight 2
- [sub] idle
- [LABEL] weight 1
- [sub] idle
- [sub] 1
- [sub] 4
- [sub] 2
- [LABEL] weight 3
- [sub] idle
- [LABEL] weight 1
- [sub] idle
- [LABEL] weight 2
- [sub] idle
- [sub] 3
- [sub] 2
- [sub] 1
- [LABEL] weight 2
- [sub] idle
- [LABEL] weight 1
- [sub] idle
- [LABEL] weight 3
- [sub] idle
- [PROSE] the answer, C
- [sub2] each column's, in order
- [sub2] 0 of 7 beats done: 0 of 27 multiply-adds
- [PROSE] Each cell holds one weight of B and does one multiply-add a beat: the running sum arriving from above, plus the number of A arriving from the left times its weight. It passes the sum down and the number right, and out of the bottom of each column falls a finished entry of C. Each row of A goes in on a slant, one number a beat into each row of cells, so that every number meets its partial sum at the right cell on the right beat. Step through: the 27 multiply-adds take 3 × 3 − 2 = 7 beats, and every number of A is used by three cells, every weight by three rows, without a trip back to memory. Google describes its TPU this way: weights loaded into the array, data streamed through, each result passed to the next cell. Before TPU v6e its arrays are 128 × 128, 16,384 multiply-adds every beat, in bfloat16 with FP32 sums. The page's arithmetic was checked against Python at every beat.
> CAPTION: A 3 × 3 array computing C = A × B with B's weights held in place, so nothing goes back to a register file between multiply-adds. It is the reuse of a tile (V2 Fig 92) built into the wiring. TPU details from Google Cloud's TPU architecture page.

### Fig 121 · 19:38
**The constraint that is not hardware**
- [PROSE] H100
- [sub] 80 GB
- [PROSE] MI300X
- [sub] 192 GB
- [PROSE] On paper AMD beats the H100 where it matters here: 192 GB of HBM at 5.3 TB/s against 80 GB at 3.35, so a model needing two H100s fits on one. And yet most teams still reach for Nvidia. The deciding factor is software. CUDA has had almost two decades to accumulate the libraries, kernels and tooling that all of AI now sits on, and ROCm, AMD's equivalent, is still catching up. For most teams that maturity, not the hardware specification, is the real binding constraint.
> CAPTION: Bars to scale; memory figures from NVIDIA's H100 whitepaper and AMD's MI300X specifications. Every other figure here is about physics; this one is about software, and it often decides.

### Fig 122 · 19:58
**What a software ecosystem is**
- [HEAD] What sits between a model and the silicon
- [sub] The model
- [sub2] written in a high-level framework
- [sub] Libraries
- [sub2] hand-tuned routines for common operations
- [sub] The compiler and driver
- [sub2] turn that into instructions for this chip
- [sub] The silicon
- [sub2] 132 multiprocessors
- [PROSE] Almost nobody writes instructions for the silicon directly. They call a library routine, and somebody spent years making that routine fast on this particular chip. Two decades of those routines is what a mature software ecosystem means, and it is why a competitor with better hardware can still be the harder choice. The specification sheet describes the bottom row. What a team actually experiences is all four.
> CAPTION: The layer that never appears on a specification sheet and frequently decides the outcome.

### Fig 123 · 20:14
**The three questions, answered**
- [LABEL] Why so different
- [sub] from a laptop CPU?
- [LABEL] one bet
- [sub] many identical operations
- [LABEL] lanes, not cleverness
- [sub] 16,896 lanes, 528 tensor cores
- [LABEL] waiting is cheap
- [sub] 64 warps to a multiprocessor
- [LABEL] Why is a byte
- [sub] so expensive
- [sub] next to an operation?
- [LABEL] the cell
- [sub] a capacitor behind long wires
- [LABEL] the ladder
- [sub] fast memory is small
- [LABEL] the ridge
- [sub] 295 operations a byte
- [LABEL] What can the
- [sub] hardware do
- [sub] to fight back?
- [LABEL] hide and coalesce
- [sub] many warps, whole sectors
- [LABEL] reuse
- [sub] tensor cores working on tiles
- [LABEL] narrower and wider
- [sub] fewer bits, bigger domains
- [PROSE] The first answer is one bet: the work is thousands of identical operations, so the silicon goes on arithmetic lanes rather than on making one thread fast (Parts 2 to 5). The second is physics and geometry: a DRAM cell is a capacitor read through long wires, memory that is fast cannot also be large, and so the H100 can do 295 operations in the time one byte arrives (Parts 6, 7, 10 and 11). The third is every technique since: enough warps in flight to hide the wait, whole sectors per fetch, each number reused across a tile, narrower numbers, and conversations kept inside the fast domain (Parts 8, 9 and 12 to 14). Which hardware gets used is then settled by software, and the code that makes it fast is the subject of the next atlas, on kernels.
> CAPTION: The same three boxes as V2 Fig 11, now with their answers. Every number in them was worked out above.


<!-- 123 figures -->
