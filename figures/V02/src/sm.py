"""V2 Part 3, building one multiprocessor: review proposals 5-9, Fig 28 labelled, Fig 34's
sixteen-per-scheduler fix, the cache figure (o014) moved to where the video says "L1 cache", and the
assembled floor plan (p09) replacing Figs 36 and 41.

  python3 figures/V02/src/sm.py     writes o028 p05 p06 p07 p08 p09; edits o014 o032 o034 s04
"""
import math
from common import *  # noqa: F401,F403

# ---- the 989.4 -----------------------------------------------------------------------------------
A100_FMA_TC = 256                     # A100WP: FP16 FMA per tensor core per clock
H100_FMA_TC = 2 * A100_FMA_TC         # WP104: double per SM, clock for clock; four tensor cores per SM on both
OPS_TC = 2 * H100_FMA_TC              # a multiply-add counts as two operations (V1 Fig 111)
tcs = SMS * TC_PER_SM
ops_tick = tcs * OPS_TC
peak = ops_tick * CLK_TC
cuda = SMS * FP32_PER_SM * 2 * CLK_FP32
per_sm_tc, per_sm_cuda = TC_PER_SM * OPS_TC, FP32_PER_SM * 2
assert tcs == 528 and OPS_TC == 1024 and ops_tick == 540_672
assert round(peak / 1e12, 1) == PEAK_BF16 / 1e12 and round(cuda / 1e12, 1) == PEAK_FP32 / 1e12
assert per_sm_tc / per_sm_cuda == 16 and round(PEAK_BF16 / PEAK_FP32, 1) == 14.8
assert round(PEAK_BF16_SPARSE / PEAK_BF16, 3) == 2.0


# ---- o028: the two bars, labelled -----------------------------------------------------------------
def o028():
    b = [hd(40, 46, "Peak operations per second, all 132 multiprocessors, drawn to scale")]
    SC = 400 / PEAK_BF16
    PEAK_FP16_CUDA = 133.8e12                    # WP104: peak FP16 (non-tensor)
    for k, (lab, v, c) in enumerate([("CUDA cores, 32-bit", PEAK_FP32, "u"), ("CUDA cores, 16-bit", PEAK_FP16_CUDA, "u"),
                                     ("tensor cores, 16-bit", PEAK_BF16, "m")]):
        y = 66 + k * 44
        b.append(txt(40, y + 19, lab, "cap"))
        w = v * SC
        note = f"{f(v / 1e12, 1)} trillion a second"
        if w > tw(note) + 30:
            b.append(cell(200, y, w, 28, c, label=note))
        else:
            b.append(rect(200, y, w, 28, c))
            b.append(txt(200 + w + 10, y + 19, note, "sub2"))
    assert round(PEAK_BF16 / PEAK_FP16_CUDA, 1) == 7.4 and round(PEAK_FP16_CUDA / PEAK_FP32) == 2
    body, yb = prose(232, [
        "The H100's headline, close to a thousand trillion operations a second, comes almost entirely "
        "from the four tensor cores in each multiprocessor. The 128 CUDA cores in each one, across all "
        f"132, reach {f(PEAK_FP32 / 1e12, 1)} trillion on 32-bit numbers, the format they are built around, "
        f"and {f(PEAK_FP16_CUDA / 1e12, 1)} trillion on 16-bit numbers, which they handle two at a time.",
        f"Like for like, at 16 bits, the tensor cores are {f(PEAK_BF16 / PEAK_FP16_CUDA, 1)} times ahead. "
        "The next figure takes the 989.4 apart.",
    ])
    emit("o028", stamp(SRT, "headline throughput"), "The headline comes from four tensor cores, not 128 CUDA cores",
         yb + 24, b + [body],
         "A program that never uses the tensor cores cannot come within a factor of seven of the "
         "headline, however well it is otherwise written. Figures from NVIDIA's H100 whitepaper.")


# ---- p05: 989.4 trillion, factor by factor --------------------------------------------------------
def p05():
    b = [hd(40, 46, "The headline, multiplied out one factor at a time")]
    rows = [("132 multiprocessors  ×  4 tensor cores", f"{tcs} tensor cores"),
            ("×  1,024 operations per tick each", f"{n(ops_tick)} operations per tick"),
            ("×  1.83 billion ticks a second", f"{f(peak / 1e12, 1)} trillion operations a second")]
    y = 66
    for lhs, rhs in rows:
        b.append(cell(40, y, 330, 34, "u", rx=6, label=lhs))
        b.append(txt(386, y + 22, "=  " + rhs, "sub2"))
        y += 46
    b.append(hd(40, y + 30, "One multiprocessor, one tick, drawn to scale"))
    SC = 430 / per_sm_tc
    for k, (lab, v, c, note) in enumerate([
            ("4 tensor cores", per_sm_tc, "m", f"{n(per_sm_tc)} operations"),
            ("128 CUDA cores", per_sm_cuda, "u", f"{per_sm_cuda} operations, 32-bit")]):
        yy = y + 50 + k * 42
        w = v * SC
        b.append(txt(40, yy + 18, lab, "cap"))
        if w > tw(note) + 30:
            b.append(cell(190, yy, w, 26, c, label=note))
        else:
            b.append(rect(190, yy, w, 26, c))
            b.append(txt(190 + w + 10, yy + 18, note, "sub2"))
    body, yb = prose(y + 50 + 2 * 42 + 34, [
        "Where 1,024 comes from: an A100 tensor core finishes 256 multiply-adds every tick, and NVIDIA "
        "doubled the rate per multiprocessor, clock for clock, in Hopper. That is 512 multiply-adds, and "
        "a multiply-add counts as two operations ({{fig:v01-o111}}).",
        "The CUDA cores do one 32-bit multiply-add each per tick, 256 operations per multiprocessor, a "
        "sixteenth of the tensor cores (on 16-bit pairs, 512, an eighth). Across the chip the 32-bit gap "
        "is 14.8 rather than 16 because NVIDIA rates the tensor cores at 1.83 GHz and the CUDA cores at "
        "1.98 GHz.",
        "The 1,978.9 trillion sometimes quoted is the same hardware credited with the multiply-adds it "
        "skips when two of every four weights are zero, NVIDIA's 2:4 structured sparsity.",
    ])
    emit("p05", stamp(SRT, "comes almost entirely from those four tensor cores"),
         "989 trillion is 132 × 4 × 1,024 × 1.83 billion", yb + 24, b + [body],
         "Every factor is NVIDIA's (H100 and A100 whitepapers), and the product lands on the published "
         "989.4. A peak is a count of units times work per tick times ticks, nothing more mysterious.")


# ---- p06: registers per thread against threads that fit -------------------------------------------
def regs_warps(r):
    """Groups of 32 threads that fit at r registers each (OCC: 256-register units, four quarters)."""
    per_group = math.ceil(r * WARP / REG_UNIT) * REG_UNIT
    return min((REGS_PER_SM // SUBPARTS) // per_group * SUBPARTS, MAX_WARPS_SM)


def p06():
    regs = RF_KB_PER_SM * 1024 // 4
    assert regs == REGS_PER_SM == 65536 and regs // MAX_THREADS_SM == 32
    table = [(r, regs_warps(r) * WARP) for r in (32, 64, 128, 255)]
    assert table == [(32, 2048), (64, 1024), (128, 512), (255, 256)]
    b = [hd(40, 46, "256 KB  ÷  4 bytes per register  =  65,536 registers, shared out")]
    b.append(txt(190, 82, "registers per thread", "sub2"))
    b.append(txt(400, 82, "threads that fit", "sub2"))
    for k, (r, t) in enumerate(table):
        y = 96 + k * 44
        b.append(txt(40, y + 18, f"{r} each", "cap"))
        w1 = r / 255 * 170
        b.append(rect(190, y, w1, 26, "s"))
        b.append(txt(190 + w1 + 8, y + 18, str(r), "sub2"))
        w2 = t / 2048 * 170
        b.append(rect(400, y, w2, 26, "m"))
        b.append(txt(400 + w2 + 8, y + 18, f"{t:,}  ({t / 2048:.1%})".replace(".0%", "%"), "sub2"))
    body, yb = prose(96 + 4 * 44 + 34, [
        "Each thread gets a private slice of the register file for as long as it is resident. At 32 "
        f"registers a thread, all 2,048 threads fit: 2,048 × 32 = {2048 * 32:,}. Double the registers "
        "and half as many threads fit; the product never changes.",
        "The compiler decides how many registers a thread needs, up to 255. They are handed out 256 "
        "at a time per group of 32 threads, so 255 registers cost 256 a thread and leave room for 256 "
        "threads. Fewer resident threads means fewer to switch to while others wait (Part 8).",
    ])
    emit("p06", stamp(SRT, "partitioned across every thread"),
         "256 KB is 65,536 registers, and 2,048 threads get 32 each", yb + 24, b + [body],
         "Bars to scale. Registers per thread and threads per multiprocessor trade one for one: a program "
         "that hoards registers buys speed per thread with fewer threads to hide waits. Limits: NVIDIA's "
         "CUDA programming guide and occupancy calculator.")


# ---- p07: staging a tile in shared memory ---------------------------------------------------------
T, K = 4, 4                           # a 4 x 4 block of outputs; each needs a row and a column of length 4


def p07():
    unstaged = T * T * 2 * K          # every thread fetches its own row of A and column of B
    staged = 2 * T * K                # the block fetches each number of the two tiles once
    assert unstaged == 128 and staged == 32 and unstaged // staged == T
    b = [hd(40, 46, "One 4 × 4 block of outputs, 16 threads, one output each")]
    C0, CS = 34, 30                   # pitch and size of a cell
    BX, BY = 214, 66                  # tile of B, above the outputs
    AX, AY = 60, 222                  # tile of A, left of the outputs
    CX, CY = 214, 222                 # the outputs
    I, J = 1, 2                       # the traced output, c23
    for k in range(K):
        for j in range(T):
            b.append(cell(BX + j * C0, BY + k * C0, CS, CS, "m" if j == J else "s", label=f"b{k + 1}{j + 1}"))
    for i in range(T):
        for k in range(K):
            b.append(cell(AX + k * C0, AY + i * C0, CS, CS, "m" if i == I else "s", label=f"a{i + 1}{k + 1}"))
        for j in range(T):
            b.append(cell(CX + j * C0, CY + i * C0, CS, CS, "m" if (i, j) == (I, J) else "u",
                          label=f"c{i + 1}{j + 1}"))
    b.append(txt(BX + T * C0 + 8, BY + 72, "tile of B", "sub2"))
    b.append(txt(AX, AY + T * C0 + 16, "tile of A", "sub2"))
    b.append(txt(CX, CY + T * C0 + 16, "outputs, one per thread", "sub2"))
    RX = 420
    b.append(hd(RX, 236, "Numbers read from HBM, to scale"))
    SC = 180 / unstaged
    for k, (lab, v, c) in enumerate([("each thread its own 8", unstaged, "h"), ("staged once", staged, "s")]):
        y = 254 + k * 54
        b.append(txt(RX, y + 12, lab, "sub2"))
        b.append(rect(RX, y + 18, v * SC, 22, c))
        b.append(txt(RX + v * SC + 8, y + 34, str(v), "sub2"))
    b.append(eq(40, AY + T * C0 + 36, 600, "c23  =  a21·b13  +  a22·b23  +  a23·b33  +  a24·b43"))
    body, yb = prose(AY + T * C0 + 36 + 42 + 40, [
        "The thread computing c23 needs row 2 of A and column 3 of B, eight numbers. Every thread in the "
        "same row of outputs needs the same four numbers of A, and every thread in the same column the "
        "same four of B.",
        f"If each thread fetched its own eight from HBM, the block would make 16 × 8 = {unstaged} reads. "
        f"Staged, the block first copies the 16 numbers of A and the 16 of B into shared memory, {staged} "
        f"reads, and every thread then reads from there. That is {unstaged // staged} times fewer: the "
        "saving equals the width of the tile, so a 128-wide tile saves 128 times.",
        "Cutting a large matrix multiply into blocks like this, each staged once and used many times, "
        "is called tiling.",
    ])
    emit("p07", stamp(SRT, "stage the data they share"),
         "Staging a tile: fetch each number once and let four threads read it", yb + 24, b + [body],
         "Same arithmetic, a quarter of the HBM traffic. This is what a scratchpad managed by hand is "
         "for: the program knows in advance who needs what, which a cache can only guess.")


# ---- p08: the TMA is told a shape -----------------------------------------------------------------
ROWS = COLS = 64
ELEM = 2                              # bytes, 16-bit numbers
WIDTH = 4096                          # the big matrix is 4,096 numbers wide
COPY = 16                             # widest single load or store, bytes (PG: 1, 2, 4, 8 or 16)
THREADS = 128


def p08():
    tile = ROWS * COLS * ELEM
    row_bytes = COLS * ELEM
    stride = WIDTH * ELEM
    copies = tile // COPY
    assert tile == 8192 and row_bytes == LINE and copies == 512 and copies // THREADS == 4
    b = [hd(40, 46, "A 64 × 64 tile of 16-bit numbers, cut from a matrix 4,096 numbers wide")]
    fields = [("start address", "where row 0 begins"), ("shape", "64 rows × 64 columns"),
              ("element size", "2 bytes"), ("row stride", f"{stride:,} bytes")]
    b.append(txt(40, 82, "the descriptor, written once", "sub2"))
    for k, (name, val) in enumerate(fields):
        y = 92 + k * 38
        b.append(cell(40, y, 104, 30, "u", label=name))
        b.append(cell(148, y, 140, 30, "s", label=val))
    b.append(arr(296, 92 + 2 * 38 - 4, 336, 92 + 2 * 38 - 4))
    b.append(txt(344, 82, "the 64 row addresses the engine works out", "sub2"))
    gen = [(0, "start"), (1, f"start + {stride:,}"), (2, f"start + {2 * stride:,}"), (None, "…"),
           (63, f"start + {63 * stride:,}")]
    for k, (r, a) in enumerate(gen):
        y = 92 + k * 30
        if r is None:
            b.append(txt(344, y + 18, f"… {ROWS - 4} more rows …", "sub2"))
            continue
        b.append(cell(344, y, 70, 24, "u", label=f"row {r}"))
        b.append(cell(418, y, 140, 24, "s", label=a))
        b.append(txt(566, y + 17, f"{row_bytes} bytes", "sub2"))
    yt = 92 + 5 * 30 + 26
    b.append(hd(40, yt + 20, "Who issues what"))
    rows = [("without the engine", f"{THREADS} threads × {copies // THREADS} copies of 16 bytes = {copies} instructions, each with its own address"),
            ("with the engine", "1 thread issues 1 instruction carrying the descriptor")]
    for k, (lab, s) in enumerate(rows):
        y = yt + 34 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(180, y, 460, 28, "h" if k == 0 else "s", label=s))
    body, yb = prose(yt + 34 + 2 * 40 + 36, [
        f"The program describes the tile once: where it starts, its shape, how big each number is, and "
        f"how far apart its rows sit in memory ({WIDTH:,} numbers × 2 bytes = {stride:,} bytes). The copy "
        f"engine generates every row address itself and moves each {row_bytes}-byte row into shared "
        "memory in the background.",
        f"Without it, as on the A100, the block's own threads work out every address and issue every copy: "
        f"{tile:,} bytes in 16-byte pieces is {copies} copy instructions, {copies // THREADS} for each of "
        f"{THREADS} threads, each one an issue slot not spent on arithmetic.",
    ])
    emit("p08", stamp(SRT, "never spend their own instructions"), "The copy engine is told a shape, not 512 addresses",
         yb + 24, b + [body],
         "Describing a shape instead of listing addresses lets loading overlap computing completely: the "
         "threads hand over one instruction and go back to their maths. TMA details: NVIDIA's H100 "
         "whitepaper.")


# ---- p09: the assembled floor plan, four identical quarters (replaces o036, absorbs o041) ---------
def p09():
    lanes_q = FP32_PER_SM // SUBPARTS
    regs_q = REGS_PER_SM // SUBPARTS
    a100_q = A100["fp32_sm"] // SUBPARTS
    assert lanes_q == WARP == 32 and regs_q == 16384 and regs_q * 4 // 1024 == 64 and a100_q == 16
    b = [cont(40, 60, 600, 318, "u", "One H100 multiprocessor")]
    QW, QH, QY = 135, 198, 104
    for q in range(SUBPARTS):
        x = 58 + q * (QW + 8)
        b.append(f'<g class="u"><rect x="{x}" y="{QY}" width="{QW}" height="{QH}" rx="10"/>'
                 f'<text class="sub" x="{x + 12}" y="{QY + 22}">quarter {q + 1}</text></g>')
        for k, (lab, c) in enumerate([("scheduler", "u"), (f"{lanes_q} FP32 lanes", "m"), ("1 tensor core", "m"),
                                      (f"{regs_q:,} registers", "s")]):
            b.append(cell(x + 12, QY + 36 + k * 38, QW - 24, 30, c, rx=4, label=lab))
    yb0 = QY + QH + 14
    b.append(cell(58, yb0, 412, 38, "s", rx=6, label="256 KB of L1 cache and shared memory, for all four"))
    b.append(cell(478, yb0, 144, 38, "u", rx=6, label="TMA copy engine"))
    body, yb = prose(410, [
        f"A multiprocessor is four identical quarters. Each has its own scheduler, {lanes_q} of the 128 "
        f"FP32 lanes, one of the four tensor cores and a quarter of the register file: {regs_q:,} "
        "registers, 64 KB. The 256 KB of L1 and shared memory, and the copy engine, serve all four.",
        f"128 lanes ÷ 4 schedulers = {lanes_q}, so each scheduler can send one instruction across 32 "
        "threads in a single tick. That is exactly the size of the group a scheduler issues to, which "
        "the next part names.",
        f"The match is the H100's, not a law: an A100 multiprocessor has 64 FP32 lanes, {a100_q} a "
        "quarter, and runs the same 32-thread instruction over two ticks.",
    ])
    emit("p09", stamp(SRT, "One SM holds up to 2048 threads"), "One multiprocessor is four identical quarters",
         yb + 24, b + [body],
         "A floor plan: the four quarters are peers, side by side, and none contains another. The next "
         "part builds the hierarchy of threads that runs on them. Layout from NVIDIA's H100 whitepaper "
         "and CUDA programming guide.")


def fixes():
    edit_item("s04", replace=[("Five components, introduced separately, then assembled.",
                               "Five components introduced separately, then assembled into four identical quarters.")])
    edit_item("o034", replace=[("64 groups, all resident", "its 16 resident groups")], from_y=152, paras=[
        "Each of the four schedulers owns a quarter of the groups resident on the multiprocessor, 16 of "
        "the 64. A group is handed to one scheduler when it arrives and stays with it.",
        "A group whose data has not arrived cannot run. A group waiting on another group cannot run. "
        "The scheduler picks from whatever is ready and issues its next instruction, in hardware, in a "
        "single cycle, with no involvement from the program.",
        "If none of its 16 is ready, that scheduler's lanes sit idle for the cycle. That is the failure "
        "this whole chip is designed to avoid, and the next parts are about how.",
    ])
    edit_item("o014", ts=stamp(SRT, "serves as L1 cache"))
    edit_item("o032", ts=stamp(SRT, "serves as L1 cache"))


if __name__ == "__main__":
    o028()
    p05()
    p06()
    p07()
    p08()
    p09()
    fixes()
