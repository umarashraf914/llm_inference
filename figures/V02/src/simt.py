"""V2 Part 4, threads, warps and the chip: review proposals 10-14, Fig 38's data row, Fig 42's
occupancy wording, Fig 43's causal claim, and Fig 44 restamped with the thread block added.

  python3 figures/V02/src/simt.py     writes p10 p11 p12 p13 p14 o038 o042 o043 o044
"""
from common import *  # noqa: F401,F403

BLOCK = 256                           # threads per block in the running example


# ---- p10: a kernel, and how a thread finds its data -----------------------------------------------
def p10():
    idx = lambda blk, t: blk * BLOCK + t
    examples = [(0, 0), (0, 1), (3, 5)]
    assert idx(3, 5) == 773 and idx(3, 5) * 4 == 3092
    warp2 = [idx(0, t) for t in range(64, 96)]
    assert warp2 == list(range(64, 96)) and warp2[0] * 4 == 256 and (warp2[-1] + 1) * 4 - 1 == 383
    b = [hd(40, 46, "The whole kernel: two lines, run by every thread")]
    b.append(cell(40, 62, 600, 30, "u", rx=6, label="i  =  block number  ×  256  +  thread number"))
    b.append(cell(40, 98, 600, 30, "u", rx=6, label="c[i]  =  a[i]  +  b[i]"))
    b.append(txt(40, 160, "block", "sub2"))
    b.append(txt(110, 160, "thread", "sub2"))
    b.append(txt(190, 160, "its i", "sub2"))
    b.append(txt(290, 160, "where a[i] sits, in bytes from the start", "sub2"))
    rows = [(blk, t, idx(blk, t), f"{idx(blk, t) * 4:,}") for blk, t in examples]
    rows.append((0, "64 … 95", "64 … 95", "256 … 383: 128 bytes side by side"))
    for k, (blk, t, i, byte) in enumerate(rows):
        y = 170 + k * 36
        hot = k == 3
        b.append(cell(40, y, 56, 28, "u", label=str(blk)))
        b.append(cell(110, y, 66, 28, "u", label=str(t)))
        b.append(cell(190, y, 86, 28, "m" if hot else "u", label=str(i)))
        b.append(cell(290, y, 350, 28, "s" if hot else "u", label=byte))
    b.append(txt(40, 170 + 4 * 36 + 14, "last row: one warp, threads 64 to 95 of block 0", "sub2"))
    body, yb = prose(170 + 4 * 36 + 52, [
        "A kernel is the program the GPU runs. It is written once, for a single thread, and launched over "
        "thousands of threads at a time. Every thread runs the same lines; the only thing that differs is "
        "its number. The hardware hands each one its block number and its thread number inside the block.",
        "The first line turns those into an index. Thread 5 of block 3 gets i = 3 × 256 + 5 = 773, so it "
        "adds element 773 of a and b, which sit 773 × 4 = 3,092 bytes from the start of each array of "
        "4-byte numbers.",
        "Neighbouring threads get neighbouring indices. The warp made of threads 64 to 95 reads 32 numbers "
        "lying side by side, 128 consecutive bytes, which Part 9 shows is exactly what memory wants.",
    ])
    emit("p10", stamp(SRT, "What defines a warp"),
         "A kernel is written for one thread; each thread finds its data from its own number", yb + 24,
         b + [body],
         "The same instruction, different data, comes from one line of arithmetic on the thread's own "
         "number. The index formula is the one NVIDIA's own examples use.")


# ---- p11: grid, block, multiprocessor ------------------------------------------------------------
def p11():
    n_elem = 1 << 20
    blocks = n_elem // BLOCK
    assert blocks == 4096 and MAX_THREADS_BLOCK // WARP == 32 and MAX_THREADS_SM // MAX_THREADS_BLOCK == 2
    assert MAX_THREADS_SM // BLOCK == 8
    b = [cont(40, 40, 260, 254, "u", "one launch: a grid of blocks")]
    for r in range(4):
        for c in range(3):
            k = r * 3 + c
            hot = k in (4, 9)
            b.append(cell(62 + c * 76, 82 + r * 50, 66, 34, "m" if hot else "s", rx=4,
                          label="block " + (str(k) if k < 11 else "…")))
    b.append(cont(330, 40, 310, 254, "u", "one multiprocessor"))
    for k, blk in enumerate((4, 9)):
        y = 82 + k * 66
        b.append(cell(352, y, 266, 54, "m", rx=6, label=f"block {blk}: 1,024 threads, 32 warps"))
    b.append(cell(352, 82 + 2 * 66, 266, 54, "s", rx=6, label="shared memory: a separate part each"))
    body, yb = prose(330, [
        f"Launching a kernel means asking for a grid of blocks. To add two arrays of {n_elem:,} numbers "
        f"with 256 threads per block takes {blocks:,} blocks. A block may hold up to 1,024 threads, "
        "32 warps.",
        "The hardware places each block whole on one multiprocessor, which keeps it until all its threads "
        "finish. A multiprocessor holds up to 2,048 threads, two blocks of 1,024 or eight of 256, and "
        "never more than 32 blocks at once.",
        "Shared memory belongs to a block. Its threads all see the same scratchpad, as the staged tile "
        "did, and no other block can see it. That is why a block, and not a warp or a launch, is the "
        "unit that cooperates.",
    ])
    emit("p11", stamp(SRT, "What defines a warp"),
         "A launch is a grid of blocks, and a block is the unit that shares memory", yb + 24, b + [body],
         "Two levels between the thread and the chip: warps for issuing instructions, blocks for sharing "
         "memory. Limits from NVIDIA's CUDA programming guide (compute capability 9.0).")


# ---- o038: the data row filled in -----------------------------------------------------------------
def o038():
    b = [box(220, 40, 240, 44, "u", "c[i] = a[i] + b[i]")]
    for k in range(16):
        x = 62 + k * 36
        b.append(ln(340, 86, x + 13, 126, "conn"))
        b.append(cell(x, 128, 26, 30, "m"))
        b.append(cell(x - 2, 166, 30, 24, "s", label=str(64 + k)))
    b.append(txt(40, 212, "lanes of warp 2; under each, the i it works on", "sub2"))
    body, yb = prose(250, [
        "Fetched once, decoded once, fired across all 32 lanes in lockstep. Every lane runs the same add; "
        "lane k of this warp adds element 64 + k, the number its own thread index picked out.",
        "Sixteen lanes are drawn for legibility. All 32 execute the same instruction at the same moment. "
        "This is called SIMT: single instruction, multiple threads.",
    ])
    emit("o038", stamp(SRT, "What defines a warp"), "One instruction, 32 lanes, different data", yb + 24,
         b + [body],
         "The threads are not independent programs; they are lanes of one program, each pointed at its "
         "own data by its index.")


# ---- p12: an instruction is a number (absorbs o040) ----------------------------------------------
W1, W2 = 0x000000040B8C7223, 0x000FC4000000008E          # Volta FFMA R140, R11, R4, R142 (JIA §2)


def p12():
    reg = lambda w, byte: (w >> (8 * byte)) & 0xFF
    assert (reg(W1, 2), reg(W1, 3), reg(W1, 4), reg(W2, 0)) == (140, 11, 4, 142)
    b = [hd(40, 46, "FFMA R140, R11, R4, R142: one fused multiply-add, as the chip stores it")]
    BW = 60                                           # px per byte, bit 0 at the right
    X0 = 640 - 8 * BW
    bx = lambda byte: X0 + (7 - byte) * BW            # left edge of a byte's cell
    for row, (w, lab) in enumerate([(W1, "first 64 bits"), (W2, "second 64 bits")]):
        y = 74 + row * 92
        b.append(txt(40, y + 20, lab, "cap"))
        for byte in range(8):
            hot = (row == 0 and byte <= 4) or (row == 1 and byte == 0)
            b.append(cell(bx(byte) + 1, y, BW - 2, 30, "m" if hot else "u", label=f"{reg(w, byte):02x}"))
        notes = ([(4, 1, "reg 4"), (3, 1, "reg 11"), (2, 1, "reg 140"), (1, 2, "operation")] if row == 0
                 else [(6, 2, "scheduling hints"), (0, 1, "reg 142")])
        for byte, span, s_ in notes:
            xc = bx(byte) + span * BW / 2
            b.append(txt(round(xc, 1), y + 48, s_, "sub2", "middle"))
    ys = 74 + 2 * 92 + 10
    b.append(hd(40, ys + 14, "Before any arithmetic: fetch it, decode it, issue it"))
    for k, (lab, c) in enumerate([("fetch: read the number", "u"), ("decode: split the fields", "u"),
                                  ("issue: send to the lanes", "m")]):
        x = 40 + k * 206
        b.append(cell(x, ys + 28, 188, 30, c, rx=6, label=lab))
        if k < 2:
            b.append(arr(x + 190, ys + 43, x + 204, ys + 43))
    yb2 = ys + 92
    b.append(hd(40, yb2, "Fetches and decodes paid for 32 additions, to scale"))
    for k, (lab, cnt, c) in enumerate([("one scalar core", 32, "h"), ("one warp", 1, "s")]):
        y = yb2 + 16 + k * 36
        b.append(txt(40, y + 18, lab, "cap"))
        for j in range(cnt):
            b.append(cell(170 + j * 14, y, 12, 26, c, rx=2))
        b.append(txt(170 + cnt * 14 + 8, y + 18, f"{cnt}", "sub2"))
    body, yb = prose(yb2 + 16 + 2 * 36 + 40, [
        "A program is stored in memory like any other data. On Volta, the first chip with tensor cores, "
        "each instruction is one 128-bit number: here the bytes 8c, 0b and 04 name registers 140, 11 "
        "and 4, the second word's 8e names register 142, and the low bits of the first word name the "
        "operation.",
        "Before anything is computed, the chip must fetch that number and decode it, splitting it into "
        "fields and routing each one. That machinery is real silicon and spends energy on every "
        "instruction. A scalar core pays it for every operation it runs; a warp pays it once and "
        "spreads it across 32 lanes.",
    ])
    emit("p12", stamp(SRT, "Fetching and decoding"),
         "An instruction is itself a number, and decoding it is the costly part", yb + 24, b + [body],
         "Fetch and decode are paid per instruction, not per operation, so sharing one instruction across "
         "32 lanes divides their cost by 32. That saving is the silicon that becomes arithmetic. Encoding "
         "from Jia et al. 2018.")


# ---- o042: 64 warps, four schedulers, and what occupancy means ------------------------------------
def o042():
    b = []
    per_sched = MAX_WARPS_SM // SUBPARTS
    assert per_sched == 16 and MAX_WARPS_SM * WARP == MAX_THREADS_SM
    for r in range(SUBPARTS):
        y = 50 + r * 24
        b.append(txt(40, y + 14, f"scheduler {r + 1}", "sub2"))
        for c in range(per_sched):
            b.append(cell(130 + c * 31, y, 27, 18, "u", rx=2))
    body, yb = prose(178, [
        "64 warps resident × 32 threads = 2,048 threads, the most one multiprocessor can hold. Each of "
        "the four schedulers owns 16 of them, a row here.",
        "Occupancy is the share of those 64 places actually filled: 64 resident warps is 100%, 32 is "
        "50%. With enough of them filled, each scheduler almost always has a warp ready to fire.",
    ])
    emit("o042", stamp(SRT, "up to 64 warps resident"), "64 warps fill one multiprocessor", yb + 24,
         b + [body],
         "Sixty-four is a limit, not a requirement. What the warps are for, covering each other's waits, "
         "is the subject of Part 8.")


# ---- p13: each thread gets a turn every sixteen ticks ---------------------------------------------
def p13():
    per_tick = SUBPARTS * WARP                    # thread-instructions issued per tick per SM
    every = MAX_THREADS_SM // per_tick
    per_thread = CLK_FP32 / every
    chip = SMS * per_tick * CLK_FP32
    assert per_tick == 128 and every == 16 and round(per_thread / 1e6, 2) == 123.75
    assert round(chip / 1e12, 1) == 33.5
    b = [hd(40, 46, "One scheduler, 48 ticks, all 16 of its warps ready")]
    TW = 10
    b.append(txt(40, 82, "issues", "cap"))
    b.append(txt(40, 122, "warp 0 runs", "cap"))
    for t in range(48):
        x = 150 + t * TW
        b.append(cell(x, 68, TW - 2, 22, "m" if t % 16 == 0 else "u", rx=1))
        if t % 16 == 0:
            b.append(cell(x, 108, TW - 2, 22, "m", rx=1))
        else:
            b.append(ghost(x, 108, TW - 2, 22, rx=1))
    for t in (0, 16, 32, 47):
        b.append(txt(150 + t * TW + (TW - 2) / 2, 150, f"{t + 1}", "sub2", "middle"))
    b.append(txt(150 + 48 * TW - 2, 168, "tick", "sub2", "end"))
    body, yb = prose(206, [
        f"Every tick, each of the four schedulers issues one instruction across 32 lanes: {per_tick} "
        f"thread-instructions per tick for the multiprocessor. Spread over 2,048 resident threads, each "
        f"thread gets a turn every {every} ticks, if every warp is ready all the time.",
        f"At 1.98 billion ticks a second that is about {round(per_thread / 1e6):,} million instructions "
        f"a second per thread, a sixteenth of the clock. The chip as a whole issues "
        f"{f(chip / 1e12, 1)} trillion thread-instructions a second.",
        "This is what “not one of them is fast on its own” means in numbers. The speed is in "
        "the count, not in any one thread.",
    ])
    emit("p13", stamp(SRT, "up to 64 warps resident"), "With 64 warps resident, each thread moves once every sixteen ticks",
         yb + 24, b + [body],
         "Gold cells are warp 0's turns. Slow threads are not a flaw to be engineered away; they are how "
         "64 warps share four schedulers, and it is the sharing that hides the waits.")


# ---- p14: Little's law, first on the road ---------------------------------------------------------
LAT_NS = round(LAT["hbm"] / H800_CLK * 1e9)       # 272.8 ns measured; used as 273 everywhere
IN_FLIGHT = HBM_BW / 1e9 * LAT_NS                  # bytes per ns times ns


def p14():
    rate_per_h, trip_h = 12, 0.5
    drivers = rate_per_h * trip_h
    assert drivers == 6
    b = [hd(40, 46, "A pizza leaves every 5 minutes, and each round trip takes 30")]
    X0, PX = 150, 5                                 # minute 0 at X0, 5 px a minute
    NOW = 42
    on_road = [k for k in range(12) if k * 5 < NOW <= k * 5 + 30]
    assert len(on_road) == drivers
    for r in range(6):
        b.append(txt(40, 62 + r * 22 + 12, f"driver {r + 1}", "sub2"))
    for k in range(12):
        start = k * 5
        y = 62 + (k % 6) * 22
        b.append(cell(X0 + start * PX, y, 30 * PX - 2, 16, "s" if k in on_road else "u", rx=2))
    ax = 62 + 6 * 22 + 6
    b.append(ln(X0, ax, X0 + 85 * PX, ax, "axis"))
    for m in (0, 15, 30, 45, 60, 75):
        b.append(vline(X0 + m * PX, ax, ax + 5))
        b.append(txt(X0 + m * PX, ax + 19, f"{m} min", "sub2", "middle"))
    xm = X0 + NOW * PX
    b.append(ln(xm, 56, xm, ax, "mark xok"))
    b.append(txt(xm + 6, ax + 38, f"at minute {NOW}: six on the road (teal)", "sub2"))
    b.append(eq(40, ax + 56, 600, "on the road  =  rate  ×  time each trip takes  =  12 an hour  ×  ½ hour  =  6"))
    y2 = ax + 56 + 42 + 28
    b.append(hd(40, y2, "The same sum for HBM"))
    b.append(eq(40, y2 + 14, 600, f"{n(HBM_BW / 1e9)} bytes per ns  ×  {LAT_NS} ns per trip  =  "
                                  f"{n(IN_FLIGHT)} bytes on the road"))
    body, yb = prose(y2 + 14 + 42 + 36, [
        "To keep deliveries leaving every five minutes, the shop needs enough drivers out to cover a "
        "whole round trip. Fewer, and the ovens wait for drivers; more, and drivers wait for pizzas. "
        "This is Little's law: amount in flight = rate × time each item spends in flight "
        "({fig}).".replace("{fig}", "{{fig:v01-o075}}"),
        f"HBM hands over {n(HBM_BW / 1e9)} bytes every nanosecond, and a request takes about "
        f"{LAT_NS} ns to come back (measured on a Hopper GPU as 479 ticks of its 1.755 GHz clock). "
        f"So about {round(IN_FLIGHT / 1e3):,} thousand bytes must be requested and not yet returned at "
        "every moment, or the bus runs part empty.",
    ])
    emit("p14", stamp(SRT, "have one ready to fire"), "To keep a pipe full, count what must be on the road",
         yb + 24, b + [body],
         "Bandwidth is only reached if enough requests are outstanding to cover the wait. The wait here "
         "was measured with the chip otherwise idle (Luo et al. 2024); under load it grows, and so does "
         "the amount that must be in flight.")


# ---- o043: is 2,048 threads enough? ---------------------------------------------------------------
def o043():
    per_sm = IN_FLIGHT / SMS
    four, sixteen = MAX_THREADS_SM * 4, MAX_THREADS_SM * 16
    assert 6900 < per_sm < 6950 and four == 8192 and sixteen == 32768
    assert 1.1 < four / per_sm < 1.25 and 4.5 < sixteen / per_sm < 4.8
    b = [hd(40, 46, "Bytes in flight per multiprocessor: needed, against what 2,048 threads can ask for")]
    b.append(eq(40, 62, 600, f"{n(IN_FLIGHT)} bytes in flight  ÷  132 multiprocessors  =  {n(per_sm)} bytes each"))
    SC = 380 / sixteen
    rows = [("needed", per_sm, "h", f"{n(per_sm)} bytes"),
            ("4 bytes per thread", four, "s", f"{n(four)} bytes"),
            ("16 bytes per thread", sixteen, "s", f"{n(sixteen)} bytes")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 132 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        w = v * SC
        if w > tw(note) + 30:
            b.append(cell(200, y, w, 26, c, label=note))
        else:
            b.append(rect(200, y, w, 26, c))
            b.append(txt(200 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(132 + 3 * 40 + 34, [
        f"If every one of the 2,048 threads has one 4-byte load outstanding, that is {n(four)} bytes, "
        f"{four / per_sm:.2f} times what is needed: enough, just. A single load instruction can fetch 16 "
        f"bytes, and then 2,048 threads cover the need {sixteen / per_sm:.1f} times over.",
        "The 2,048 is not derived from this sum. The V100, A100 and H100 all cap a multiprocessor at "
        "2,048 threads, while their memories run at 0.9, 2.0 and 3.35 TB/s. The cap happens to clear "
        "the bar on the H100; the arithmetic checks it, it does not explain it.",
    ])
    emit("o043", stamp(SRT, "have one ready to fire"), "2,048 threads can keep HBM busy, with little to spare",
         yb + 24, b + [body],
         "Little's law as a check, not a cause. And the margin is thinner than it looks: the latency was "
         "measured on an idle chip, and it grows when the memory is busy.")


# ---- o044: the whole hierarchy, with the block --------------------------------------------------
def o044():
    total = WARP * MAX_WARPS_SM * SMS
    assert total == 270_336
    b = [cont(40, 36, 600, 344, "u", "H100", "132 multiprocessors"),
         cont(62, 92, 556, 268, "m", "One multiprocessor", "up to 64 warps, from up to 32 blocks"),
         cont(84, 148, 512, 192, "s", "One block", "up to 1,024 threads: 32 warps, one shared memory"),
         cont(106, 204, 468, 116, "u", "One warp", "32 threads, one instruction")]
    for k, s_ in enumerate(["t0", "t1", "t2", "…", "t31"]):
        b.append(cell(128 + k * 52, 260, 44, 40, "m", label=s_))
    body, yb = prose(414, [
        "32 threads make a warp. A block is up to 32 warps, placed whole on one multiprocessor and "
        "sharing one slice of shared memory. A multiprocessor holds up to 64 warps. 132 multiprocessors "
        "make the chip.",
        f"32 × 64 × 132 = {total:,} threads in flight.",
    ])
    emit("o044", stamp(SRT, "have one ready to fire"), "Assembled: the whole execution hierarchy", yb + 24,
         b + [body],
         "Every number in Parts 2 to 4 sits somewhere on this chain. Rebuild the chain and that whole "
         "stretch is yours.")


if __name__ == "__main__":
    p10()
    p11()
    o038()
    p12()
    o042()
    p13()
    p14()
    o043()
    o044()
