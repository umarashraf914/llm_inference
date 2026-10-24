"""V3 Part 13, the KV cache and paging: §5a item 19; §5d (83 vs 84 replaced; 85 vs 86 captions); review #32,
#33, #33a and #34; o083, o086 and o087 redrawn with their ids kept (other atlases link to o083 and o086).

  o082  restamped (30:39); points at V1's cache formula
  p32   a reservation sized for the longest answer is 95% empty when the answer is short (31:16; replaces o084)
  o083  free memory that cannot be used: external fragmentation, and the measured 20.4-38.2% (31:33)
  o085  restamped (32:20), caption rewritten
  o086  paged attention: block tables over a pool of fixed-size blocks (32:24)
  p33   finding token 37 takes one division and one lookup; the waste bound (32:36)
  p33a  wasted cache is lost batch: the same 40 GB holds 31-58 requests, or 152 (33:19)
  o087  sharing a common beginning: reference counts, copy on write (33:38)
  p34   beam search keeps several answers alive over one stored prompt (33:49)

Sources, each read: vLLM (Kwon et al., SOSP 2023, arXiv 2309.06180): Fig. 2 and §3 (20.4-38.2%), the abstract
(2-4x at the same latency), §4.4 (reference counts, copy-on-write), §6.3 (37.6-55.2% saved on beam search,
1.3x to 2.3x over Orca (Oracle), OPT-13B, Alpaca). Llama 3 8B shape as in Part 6 (32 layers, 8 KV heads, 128).

  python3 figures/V03/src/cache.py
"""
from common import *  # noqa: F401,F403

KV_PER_TOKEN = 2 * 32 * 8 * 128 * 2           # Llama 3 8B, 16-bit: keys and values, 32 layers, 8 KV heads
assert KV_PER_TOKEN == 128 * 1024
LIMIT, USED, BLOCK = 4096, 200, 16
TABLE_A = [7, 1, 9, 4]                          # request A's block table, used in o086 and p33


# ---- p32: one reservation, to scale ------------------------------------------------------------------------
def p32():
    empty = LIMIT - USED
    assert empty == 3896 and round(100 * empty / LIMIT, 1) == 95.1 and round(100 * USED / LIMIT, 1) == 4.9
    held, used = LIMIT * KV_PER_TOKEN, USED * KV_PER_TOKEN
    assert round(held / 1e6) == 537 and round(used / 1e6) == 26
    b = [hd(40, 46, "One request's reservation: 4,096 token slots, 64 to a row")]
    P = 5                                                      # pixels per slot side: 64 x 64 slots = 320 px
    full_rows, rest = divmod(USED, 64)
    assert (full_rows, rest) == (3, 8)
    b.append(cell(40, 66, 64 * P, 64 * P, "u", rx=2))
    b.append(cell(40, 66, 64 * P, full_rows * P, "s", rx=1))
    b.append(cell(40, 66 + full_rows * P, rest * P, P, "s", rx=1))
    X = 400
    b.append(txt(X, 84, f"{LIMIT:,} slots reserved, one contiguous run", "cap"))
    b.append(cell(X, 104, 14, 14, "s"))
    b.append(txt(X + 22, 116, f"{USED} hold tokens: {100 * USED / LIMIT:.1f}%", "sub2"))
    b.append(cell(X, 130, 14, 14, "u"))
    b.append(txt(X + 22, 142, f"{empty:,} sit empty: {100 * empty / LIMIT:.1f}%", "sub2"))
    b.append(txt(X, 184, "at 128 KiB of cache per token", "cap"))
    b.append(txt(X, 204, f"{held / 1e6:,.0f} MB held", "sub2"))
    b.append(txt(X, 222, f"for {used / 1e6:.0f} MB of keys and values", "sub2"))
    body, yb = prose(66 + 64 * P + 40, [
        "A serving system cannot know in advance how long a response will run, so the systems before 2023 "
        "played it safe: each request got one contiguous stretch of HBM, sized for the longest sequence it "
        f"might reach. With a limit of {LIMIT:,} tokens and a response that stops at {USED}, the other "
        f"{empty:,} slots, {100 * empty / LIMIT:.1f}% of the reservation, sit reserved and empty until the "
        "request finishes.",
        "On the Llama 3 8B shape of Part 6, 128 KiB of keys and values per token, that is "
        f"{held / 1e6:,.0f} MB held for {used / 1e6:.0f} MB of cache. Waste inside a reservation like this is "
        "called internal fragmentation.",
    ])
    figure("p32", st("Suppose the limit is 4,096"), "A reservation sized for the longest answer is 95% empty "
           "when the answer is short", yb + 30, b + [body],
           esc("Areas to scale: the square is the reservation, the teal strip the 200 tokens actually generated."))


# ---- o083: external fragmentation, and the measured cost (redrawn) -------------------------------------------------
def o083():
    runs = [("request A", 4096, "s"), (None, 1536, None), ("request B", 2048, "s"), (None, 1024, None),
            ("C", 3072, "s"), (None, 512, None)]
    total = sum(n for _, n, _ in runs)
    free = sum(n for lab, n, _ in runs if lab is None)
    need = 2048
    assert (total, free) == (12288, 3072) and free >= need and max(n for lab, n, _ in runs if lab is None) < need
    b = [hd(40, 46, "The cache region after requests of different lengths have come and gone")]
    X0, SC = 40, 600 / total
    x = X0
    for lab, n, cls in runs:
        w = n * SC
        if lab:
            b.append(cell(x, 66, w - 2, 34, cls, label=f"{lab}, {n:,}" if w > 120 else lab))
        else:
            b.append(ghost(x, 66, w - 2, 34))
            b.append(txt(x + (w - 2) / 2, 118, f"{n:,}", "sub2", "middle"))
        x += w
    b.append(txt(40, 140, f"free in total: 1,536 + 1,024 + 512 = {free:,} slots", "cap"))
    b.append(ghost(40, 154, need * SC, 30, label=f"new request: {need:,} in one run"))
    b.append(txt(40 + need * SC + 12, 174, "no single gap holds it", "sub2"))
    y2 = 222
    b.append(hd(40, y2, "Share of cache memory holding token states, in the serving systems of the time"))
    X1, X2 = 40, 600
    sc = lambda p: X1 + p * (X2 - X1)
    b.append(f'<rect x="{X1}" y="{y2 + 14}" width="{X2 - X1}" height="24" rx="3" fill="none" '
             f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
    b.append(cell(sc(0.204), y2 + 14, sc(0.382) - sc(0.204), 24, "s"))
    b.append(txt(sc(0.382) + 8, y2 + 31, "20.4% to 38.2%", "sub2"))
    for p in (0, 0.5, 1):
        b.append(tline(sc(p), y2 + 42, sc(p), y2 + 46))
        b.append(txt(sc(p), y2 + 60, f"{100 * p:.0f}%", "sub2", "middle"))
    body, yb = prose(y2 + 96, [
        "There is a second kind of waste. As requests of different lengths start and finish, the free memory "
        f"between reservations turns ragged. Here {free:,} slots are free in total, enough for a new request "
        f"of {need:,}, yet no single gap holds more than 1,536, and a reservation has to be one continuous "
        "run. That is external fragmentation. Operating-system textbooks have described both kinds since the "
        "1960s.",
        "The vLLM team measured what the two cost together. In the serving systems of the time, only 20.4% to "
        "38.2% of the KV-cache memory held actual token states. More than half of the most expensive memory in "
        "the machine was storing nothing.",
    ])
    figure("o083", st("There is a second kind"), "Free memory that cannot be used", yb + 30, b + [body],
           esc("Strip and bar to scale; the request sizes are illustrative, the 20.4–38.2% measured. Two wastes, "
               "one cause: insisting that a request's memory be one continuous run, sized in advance."))


# ---- o085: restamp, new caption ------------------------------------------------------------------------------------
def o085():
    patch("o085", [("Recognising the fragmentation as a problem somebody solved in the 1960s was most of the "
                    "work. The mechanism was already standard.",
                    "Contiguity becomes something the table maintains rather than something memory has to "
                    "provide. Nothing physical needs to sit side by side.")],
          stamp_to=st("Operating systems also solved"))


# ---- o086: paged attention (redrawn) ----------------------------------------------------------------------------------
def o086():
    table_b = [12, 3, 14]
    assert not set(TABLE_A) & set(table_b)
    b = [hd(40, 46, "Two requests' logical blocks, and where the block tables put them")]
    W, G = 36, 2
    px = lambda k: 40 + k * (W + G)
    for i, pb in enumerate(TABLE_A):
        b.append(cell(40 + i * 46, 66, 40, 30, "s", label=f"A{i}"))
    for i, pb in enumerate(table_b):
        b.append(cell(420 + i * 46, 66, 40, 30, "m", label=f"B{i}"))
    b.append(txt(40 + 4 * 46 + 6, 86, f"A's table: {', '.join(map(str, TABLE_A))}", "sub2"))
    b.append(txt(420 + 3 * 46 + 6, 86, f"B's table: {', '.join(map(str, table_b))}", "sub2"))
    yp = 186
    for k in range(16):
        cls = "s" if k in TABLE_A else ("m" if k in table_b else None)
        if cls:
            b.append(cell(px(k), yp, W, 30, cls, label=str(k)))
        else:
            b.append(ghost(px(k), yp, W, 30, label=str(k)))
    for i, pb in enumerate(TABLE_A):
        b.append(ln(40 + i * 46 + 20, 98, px(pb) + W / 2, yp - 2))
    for i, pb in enumerate(table_b):
        b.append(ln(420 + i * 46 + 20, 98, px(pb) + W / 2, yp - 2))
    b.append(txt(40, yp + 52, "physical blocks in HBM, 16 tokens each; dashed blocks are free, and any of them will do",
                 "sub2"))
    body, yb = prose(yp + 92, [
        "Paged attention, published in 2023 with the vLLM serving system, carries the operating system's "
        "answer over almost unchanged. The cache is cut into fixed-size blocks of 16 or 32 tokens, and every "
        "request gets a block table that maps its logical blocks, in order, to physical blocks that can sit "
        "anywhere in HBM.",
        "The attention kernel follows the table and sees one contiguous sequence. It computes the same "
        "function as before and gathers each block by following the table: what is new is where the bytes "
        "live, plus one lookup per block to find them.",
        "Internal fragmentation shrinks to at most one partly filled block per request. External "
        "fragmentation disappears entirely, because every free block is the same size and any of them will do.",
    ])
    figure("o086", st("Paged attention, published in 2023"), "Paged attention", yb + 30, b + [body],
           esc("Logical order lives in the table, not in memory: request A's tokens 0 to 63 sit in blocks 7, 1, "
               "9 and 4, in that order."))


# ---- p33: one lookup, and the waste bound --------------------------------------------------------------------------------
def p33():
    tok = 37
    lb, off = divmod(tok, BLOCK)
    pb = TABLE_A[lb]
    slot = pb * BLOCK + off
    assert (lb, off, pb, slot) == (2, 5, 9, 149)
    blocks = -(-USED // BLOCK)
    slack = blocks * BLOCK - USED
    assert (blocks, blocks * BLOCK, slack, round(100 * slack / (blocks * BLOCK), 1)) == (13, 208, 8, 3.8)
    b = [hd(40, 46, f"Where is token {tok} of request A? Blocks of {BLOCK} tokens")]
    b.append(eq(40, 62, 280, f"{tok} = {lb} × {BLOCK} + {off}", "u", 34))
    b.append(txt(336, 84, f"logical block {lb}, offset {off}", "sub2"))
    b.append(txt(40, 128, "A's block table", "cap"))
    for i, v in enumerate(TABLE_A):
        x = 160 + i * 50
        b.append(txt(x + 22, 114, f"{i}", "sub2", "middle"))
        b.append(cell(x, 120, 44, 28, "s" if i == lb else "u", label=str(v)))
    b.append(txt(370, 139, f"entry {lb} says physical block {pb}", "sub2"))
    b.append(txt(40, 192, f"physical block {pb}", "cap"))
    for s in range(BLOCK):
        x = 160 + s * 28
        b.append(cell(x, 176, 24, 24, "s" if s == off else "u", label=str(pb * BLOCK + s) if s == off else None))
    b.append(txt(160, 220, f"slots {pb * BLOCK} to {pb * BLOCK + BLOCK - 1} of the pool", "sub2"))
    b.append(eq(40, 236, 600, f"slot = {pb} × {BLOCK} + {off} = {slot}", "s", 34))
    y2 = 306
    b.append(hd(40, y2, f"The waste bound, for the {USED}-token answer"))
    rows = [("one contiguous reservation", f"{LIMIT:,} slots, {LIMIT - USED:,} empty", f"{100 * (LIMIT - USED) / LIMIT:.1f}%"),
            (f"blocks of {BLOCK}", f"{USED} ÷ {BLOCK} = 12.5, so {blocks} blocks: {blocks * BLOCK} slots, {slack} empty",
             f"{100 * slack / (blocks * BLOCK):.1f}%")]
    for k, (lab, what, p) in enumerate(rows):
        y = y2 + 28 + k * 26
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(230, y, what, "sub2"))
        b.append(txt(640, y, p, "sub2", "end"))
    body, yb = prose(y2 + 28 + 2 * 26 + 30, [
        f"Token {tok} sits in logical block {tok} ÷ {BLOCK} = {lb}, rounding down, at offset "
        f"{tok} − {lb} × {BLOCK} = {off}. Entry {lb} of A's block table says that logical block is physical "
        f"block {pb}, so the kernel reads slot {pb} × {BLOCK} + {off} = {slot} of the cache pool. One division "
        "and one lookup, done once for each block the kernel gathers rather than once per token.",
        f"The waste is now bounded by one partly filled block per request. The {USED}-token answer of "
        "{{fig:v03-p32}} takes " + f"{blocks} blocks, {blocks * BLOCK} slots, of which {slack} are empty: "
        f"{100 * slack / (blocks * BLOCK):.1f}%, where one reservation left {100 * (LIMIT - USED) / LIMIT:.1f}% "
        "empty. A request grows one block at a time, as its answer grows.",
    ])
    figure("p33", st("Give every request a block table"), f"Finding token {tok} takes one division and one lookup",
           yb + 30, b + [body],
           esc("The indirection is the whole cost of paging, and it is paid in arithmetic the chip has plenty of."))


# ---- p33a: wasted cache is lost batch ------------------------------------------------------------------------------------
def p33a():
    tokens, budget = 2000, 40e9                         # illustrative request length and cache budget
    per_req = tokens * KV_PER_TOKEN
    fits = [("every slot holds a token (paged)", int(budget // per_req), "s"),
            ("38.2% of the memory holds tokens", int(budget * 0.382 // per_req), "h"),
            ("20.4% of the memory holds tokens", int(budget * 0.204 // per_req), "h")]
    assert round(per_req / 1e6, 1) == 262.1 and [n for _, n, _ in fits] == [152, 58, 31]
    assert round(152 / 58, 1) == 2.6 and round(152 / 31, 1) == 4.9
    b = [hd(40, 46, f"Requests of {tokens:,} tokens that fit in 40 GB of cache (bars to scale)")]
    SC = 380 / 152
    for k, (lab, n, cls) in enumerate(fits):
        y = 66 + k * 36
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(hbar(260, y, n * SC, 24, cls, f"{n}", 60))
    body, yb = prose(66 + 3 * 36 + 30, [
        "Memory that sat reserved and empty can now hold other requests, and more requests in a batch means "
        f"more throughput. Take requests of {tokens:,} tokens on the same Llama 3 8B shape: {tokens:,} × 128 KiB "
        f"= {per_req / 1e6:.0f} MB of cache each. An illustrative 40 GB of HBM set aside for cache holds 152 "
        "of them when every slot holds a token, but only 58 when 38.2% of the memory holds tokens, and 31 at "
        "20.4%.",
        "That is a batch 2.6 to 4.9 times larger. vLLM measured 2 to 4 times the throughput of the serving "
        "systems before it, at the same latency. Throughput grows less than the batch does, because every "
        "request in the batch adds its own cache to read at every step ({{fig:v01-o141}}).",
    ])
    figure("p33a", st("The reclaimed"), "Wasted cache is lost batch", yb + 30, b + [body],
           esc("The 40 GB and the 2,000-token requests are illustrative; the 20.4% and 38.2% are vLLM's "
               "measurements of the systems before it."))


# ---- o087: sharing a common beginning (redrawn) ------------------------------------------------------------------------
def o087():
    ta, tb = [2, 5, 8, 11], [2, 5, 8, 13]
    shared = [p for p, q in zip(ta, tb) if p == q]
    assert shared == [2, 5, 8]
    b = [hd(40, 46, "Two requests that begin with the same system prompt")]
    for r, (name, t, cls) in enumerate((("A", ta, "s"), ("B", tb, "m"))):
        y = 66 + r * 40
        b.append(txt(40, y + 19, f"{name}'s table", "cap"))
        for i, v in enumerate(t):
            b.append(cell(140 + i * 50, y, 44, 28, "u" if v in shared else cls, label=str(v)))
    b.append(txt(350, 85, "entries 0 to 2: the shared prompt", "sub2"))
    b.append(txt(350, 125, "entry 3: where the two part ways", "sub2"))
    yp = 168
    b.append(txt(40, yp + 19, "physical blocks", "cap"))
    for k, v in enumerate([2, 5, 8, 11, 13]):
        x = 140 + k * 92
        lab = f"block {v}" if v not in shared else f"block {v}: 2 tables"
        b.append(cell(x, yp, 86, 28, "u" if v in shared else ("s" if v == 11 else "m"), label=lab))
    body, yb = prose(yp + 70, [
        "Sometimes many sequences begin identically: requests that share a system prompt or a long "
        "instruction preamble. Their tables can point at the same physical blocks for that shared "
        "beginning, here blocks 2, 5 and 8, so it is stored once however many requests use it.",
        "Nothing has to be copied to make this safe, because a token's keys and values never change once "
        "computed. Each block keeps a count of the tables that point at it, so it is freed only when the last "
        "one lets go, and a shared block is copied only when one sequence must write into it: the partly "
        "filled block where the sequences part ways.",
    ])
    figure("o087", st("Sometimes many sequences begin"), "Sharing comes free with the table", yb + 30, b + [body],
           esc("Immutability is what makes pointing at the same block safe; the count is what makes freeing it "
               "safe."))


# ---- p34: beam search ---------------------------------------------------------------------------------------------------
def p34():
    b = [hd(40, 46, "Three candidate answers to one prompt, as blocks; the number is how many tables point there")]
    nodes = {"p0": (40, 92, "prompt 0", 3), "p1": (150, 92, "prompt 1", 3),
             "c12": (260, 70, "shared 2", 2), "c3a": (260, 132, "own 2", 1),
             "c1": (390, 52, "candidate 1", 1), "c2": (390, 96, "candidate 2", 1), "c3": (390, 140, "candidate 3", 1)}
    edges = [("p0", "p1"), ("p1", "c12"), ("p1", "c3a"), ("c12", "c1"), ("c12", "c2"), ("c3a", "c3")]
    for a, z in edges:
        xa, ya = nodes[a][0] + 96, nodes[a][1] + 13
        xz, yz = nodes[z][0], nodes[z][1] + 13
        b.append(ln(xa, ya, xz, yz))
    for key, (x, y, lab, cnt) in nodes.items():
        w = 110 if key.startswith("c") and key[1:].isdigit() else 96
        b.append(cell(x, y, w, 26, "u" if cnt > 1 else "s", label=f"{lab}  ×{cnt}" if cnt > 1 else lab))
    y2 = 202
    b.append(hd(40, y2, "Measured on OPT-13B, Alpaca dataset (bars to scale)"))
    X1, X2 = 260, 620
    sc = lambda p: X1 + p * (X2 - X1)
    b.append(txt(40, y2 + 30, "cache memory saved, beam search", "cap"))
    b.append(f'<rect x="{X1}" y="{y2 + 14}" width="{X2 - X1}" height="24" rx="3" fill="none" '
             f'stroke="var(--rule)" stroke-dasharray="3 3"/>')
    b.append(cell(sc(0.376), y2 + 14, sc(0.552) - sc(0.376), 24, "s"))
    b.append(txt(sc(0.552) + 8, y2 + 31, "37.6% to 55.2%", "sub2"))
    b.append(txt(X1, y2 + 56, "0%", "sub2", "middle"))
    b.append(txt(X2, y2 + 56, "100%", "sub2", "middle"))
    SC = 300 / 2.3
    for k, (lab, v) in enumerate((("request rate vs Orca (Oracle), plain sampling", 1.3),
                                  ("the same, beam search 6 wide", 2.3))):
        y = y2 + 74 + k * 32
        b.append(txt(40, y + 17, lab, "cap"))
        b.append(hbar(X1 + 60, y, v * SC, 24, "s", f"{v:g}×", 60))
    body, yb = prose(y2 + 74 + 2 * 32 + 30, [
        "Sometimes a server explores several candidate continuations of one prompt at once and keeps the "
        "most promising: beam search. Every candidate gets its own block table, and the tables share every "
        "block the candidates have in common. A block is copied only when a candidate writes into one it "
        "shares, and a block whose count falls to zero is freed.",
        "Measured on OPT-13B with the Alpaca dataset, sharing saved 37.6% to 55.2% of the cache memory on beam "
        "search. That memory goes straight back into batch size. Against Orca (Oracle), an earlier system "
        "given the true output lengths in advance, vLLM sustained 1.3 times the request rate at the same "
        "latency on plain sampling, and 2.3 times on beam search six candidates wide.",
    ])
    figure("p34", st("a strategy called"), "Beam search keeps several answers alive over one stored prompt",
           yb + 30, b + [body],
           esc("The vLLM paper calls the copying rule copy-on-write, after the operating-system technique it "
               "borrows. The more the candidates share, the larger the saving."))


def patches():
    patch("o082", [("For a 70-billion-parameter model with 80 layers, 8 KV heads and head dimension 128, in FP16,",
                    "For Llama 3 70B, with 80 layers, 8 KV heads and head dimension 128, in 16 bits,"),
                   ("that is 320 KB for every token held in context.",
                    "that is 320 KB for every token held in context ({{fig:v01-o140}}).")],
          stamp_to=st("the KV cache from the"))


if __name__ == "__main__":
    for job in (patches, p32, o083, o085, o086, p33, p33a, o087, p34):
        job()
