"""V7 Part 6, sharing, routing and pricing: b44–b47 and o014 rebuilt (P44–P47 of the review, and §5
items 5 and 11 for Fig 14).

  b44   two block tables point at one physical copy; only the partly filled block is copied
  b45   a cached prefix lives on one replica, so routing for hits fights routing for load
  o014  what providers charge to write and to read a cached prefix, with the providers named
  b46   the break-even: a cached prefix pays for itself during its second use
  b47   widget: an agent's bill, step by step, with and without the cache

Prices: Anthropic's prompt-caching page (cache writes 1.25x for a five-minute lifetime, 2x for an
hour; reads about 0.1x, lower on some newer models) and OpenAI's prompt-caching guide (reads 0.1x on
its recent models), both read 2026-10-24. They match the multipliers quoted at 17:39-17:51.

  python3 figures/V07/src/sharing.py
"""
from bcommon import (SRT, JS_FMT, KV8, P8, PEAK, arr, box, cell, emit, emit_widget, eq, f, g, ghost,
                     hd, js_fill, ln, path, pc, prose, stamp, tw, txt)

BLOCK = 16                                     # tokens per block
WRITE5, WRITE60, READ = 1.25, 2.00, 0.10       # price multiples of a normal input token


# ---- b44: copy-on-write -------------------------------------------------------------------------
def b44():
    shared = 40
    full, part = divmod(shared, BLOCK)
    assert (full, part) == (2, 8)
    blk, slot = divmod(shared, BLOCK)            # where token 40 goes: block 2, slot 8
    assert (blk, slot) == (2, 8)
    table_a = [7, 1, 3]
    table_b_after = [7, 1, 9]                    # block 9: B's copy of block 3
    block_bytes = BLOCK * KV8
    prefix_bytes = shared * KV8
    assert block_bytes == 2 * 2**20 and prefix_bytes == 5 * 2**20
    sys_blocks, rem = divmod(2000, BLOCK)
    assert (sys_blocks, rem) == (125, 0)
    saved = 49 * sys_blocks * block_bytes        # 50 requests share one copy instead of 50
    assert round(saved / 1e9, 1) == 12.8

    COLS, CW = [150, 276, 402, 528], 112        # x of each column of blocks, and its width
    mid = lambda c: COLS[c] + CW / 2
    b = []

    def panel(y, head, a_tab, b_tab, mem, logical=False):
        """y: the heading's baseline. mem: (column, block number, colour, note) per physical block."""
        b.append(hd(40, y, head))
        if logical:
            for k in range(3):
                b.append(txt(mid(k), y + 24, f"logical block {k}", "sub2", "middle"))
        b.append(txt(40, y + 47, "A's table", "cap"))
        b.append(txt(40, y + 105, "memory", "cap"))
        b.append(txt(40, y + 163, "B's table", "cap"))
        col_of = {num: c for c, num, _, _ in mem}
        for c, num, cls, note in mem:
            b.append(box(COLS[c], y + 78, CW, 44, cls, f"block {num}", note, rx=4))
        for k, v in enumerate(a_tab):
            b.append(cell(mid(k) - 26, y + 30, 52, 24, "u", label=f"→ {v}"))
            b.append(arr(mid(k), y + 56, mid(col_of[v]), y + 74))
        for k, v in enumerate(b_tab):
            b.append(cell(mid(k) - 26, y + 146, 52, 24, "u", label=f"→ {v}"))
            if col_of[v] == k:
                b.append(arr(mid(k), y + 144, mid(k), y + 126))
            else:                                  # B's pointer now leads to its own copy
                b.append(path([(mid(k), y + 144), (mid(k), y + 135), (mid(col_of[v]), y + 135),
                               (mid(col_of[v]), y + 126)], marker=True))

    panel(46, f"Both sequences hold the same {shared} tokens: {full} full blocks, and one holding {part}",
          table_a, table_a, [(0, 7, "s", "0–15 · count 2"), (1, 1, "s", "16–31 · count 2"),
                             (2, 3, "s", "32–39 · count 2")], logical=True)
    y2 = 46 + 200
    panel(y2, f"Each writes its token {shared}, which goes in block {blk} at slot {slot}: copy that block first",
          table_a, table_b_after, [(0, 7, "s", "0–15 · count 2"), (1, 1, "s", "16–31 · count 2"),
                                   (2, 3, "m", "32–40 · count 1"), (3, 9, "m", "copy · count 1")])
    body, yb = prose(y2 + 170 + 40, [
        f"With paged memory a sequence's cache lives in blocks of {BLOCK} tokens, and its block table "
        f"lists which physical block holds each one ({{{{fig:v07-a13}}}}). Two sequences sharing a "
        f"{shared}-token prefix simply list the same physical blocks: {shared} = {full} × {BLOCK} + "
        f"{part}, so two blocks are full and the third holds {part} tokens. A count on each block "
        "records how many tables point at it.",
        f"Nothing shared is ever copied, because a token's keys and values never change once written. "
        f"Only the partly filled block is at risk: token {shared} belongs in block {blk} at slot "
        f"{shared} − {blk * BLOCK} = {slot}, and the two sequences write different tokens there. So "
        "that block is copied first, and each sequence writes into its own.",
        f"On Llama 3 8B a block is {BLOCK} × {g(KV8)} bytes = 2 MiB, so diverging costs one 2 MiB "
        f"copy rather than the {prefix_bytes // 2**20} MiB prefix. A 2,000-token system prompt fills "
        f"{sys_blocks} blocks exactly and needs no copy at all. Shared by 50 requests, it is stored "
        f"once instead of 50 times, which saves {f(saved / 1e9, 1)} GB.",
        "An operating system does the same when a program forks: the new copy of the running program "
        "shares its parent's memory pages, marked read-only, and a page is copied only when one side "
        "writes to it. That is what copy-on-write means.",
    ])
    emit("b44", stamp(SRT, "Sharing a prefix is two sequences"),
         "Two block tables share one physical copy until they disagree", yb + 32, b + [body],
         "Paging is what made sharing free. Without fixed-size blocks two sequences could not point "
         "at the same prefix, and sharing it would mean copying it.")


# ---- b45: routing -------------------------------------------------------------------------------
QUEUES = [3, 6, 2, 4]                           # requests waiting at each replica, illustrative
HOLDER = 1                                      # replica 2 holds conversation A's history
HIST, NEW = 4000, 100


def b45():
    least = min(range(4), key=lambda i: QUEUES[i])
    assert least == 2 and least != HOLDER
    p_hit = 1 / len(QUEUES)
    t_miss = 2 * P8 * (HIST + NEW) / PEAK
    t_hit = 2 * P8 * NEW / PEAK
    b = [hd(40, 46, "A returning conversation, four replicas, and two ways to choose")]
    b.append(box(250, 64, 180, 40, "u", "router", "next turn of A"))
    X = [40, 192, 344, 496]
    for i, x in enumerate(X):
        b.append(f'<g class="u"><rect x="{x}" y="158" width="144" height="106" rx="10"/>'
                 f'<text class="lbl" x="{x + 16}" y="180">replica {i + 1}</text></g>')
        b.append(txt(x + 16, 200, f"{QUEUES[i]} waiting", "sub2"))
        for k in range(QUEUES[i]):
            b.append(cell(x + 16 + k * 18, 208, 12, 12, "u"))
        if i == HOLDER:
            b.append(cell(x + 16, 228, 112, 20, "s", label="A's history"))
    b.append(arr(318, 106, X[HOLDER] + 72, 154))
    b.append(arr(362, 106, X[least] + 72, 154))
    b.append(txt(236, 132, "cache-aware: a hit", "sub2", "end"))
    b.append(txt(444, 132, "least busy: a miss", "sub2"))
    body, yb = prose(306 + 8, [
        "A cached prefix lives in one replica's memory. A replica is a complete copy of the model "
        "serving its own share of the traffic ({{fig:v05-o018}}), so a hit is only possible on the "
        "replica that holds the prefix.",
        f"A router that ignores the cache sends the next turn wherever the queue is shortest. With "
        f"{len(QUEUES)} replicas the history is on that one 1 time in {len(QUEUES)}, a {pc(p_hit, 0)} "
        f"chance. The other times the whole {g(HIST + NEW)}-token prompt is prefilled again: at least "
        f"{f(t_miss * 1e3, 0)} ms on Llama 3 8B at peak arithmetic, against {f(t_hit * 1e3, 1)} ms for "
        f"the {g(NEW)} new tokens.",
        "So routing has to become cache-aware: send each request to the machine already holding its "
        "prefix, not to whichever is least busy. The two aims pull against each other, because the "
        f"replica with the hit may have the longest queue, as replica {HOLDER + 1} does here.",
    ])
    emit("b45", stamp(SRT, "One consequence reaches up into the"),
         "Routing for hits fights routing for load", yb + 32, b + [body],
         f"Queue lengths illustrative. A cache pays only if traffic finds it: routed by load alone, a "
         f"returning conversation lands on its own history 1 time in N.")


# ---- o014: the prices ---------------------------------------------------------------------------
def o014():
    rows = [("normal input", 1.00, "u", "1.00"),
            ("cache write, kept 5 minutes", WRITE5, "m", f"{f(WRITE5)} · Anthropic"),
            ("cache write, kept an hour", WRITE60, "m", f"{f(WRITE60)} · Anthropic"),
            ("cache read", READ, "s", f"{f(READ)} · Anthropic and OpenAI")]
    b = [hd(40, 46, "Price of one input token, as a multiple of the normal price")]
    X0, SC = 230, 140
    for k, (lab, v, cls, note) in enumerate(rows):
        y = 70 + k * 42
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(X0, y, v * SC, 28, cls))
        b.append(txt(X0 + v * SC + 10, y + 19, note, "sub2"))
    assert WRITE60 * SC + X0 + 10 + tw("2.00 · Anthropic") < 640
    body, yb = prose(70 + 4 * 42 + 36, [
        "Anthropic and OpenAI both bill a cached prompt read at a tenth of the normal input price on "
        "most recent models, and a few newer models charge less still. Writing the cache can cost "
        f"extra: Anthropic charges {f(WRITE5)} times normal for an entry kept five minutes and "
        f"{f(WRITE60, 0)} times for one kept an hour, and each read restarts the clock.",
        "The prices follow the work. A write is a normal prefill plus the memory to hold its keys and "
        "values for the lifetime; a read skips the prefill and only loads what is stored.",
    ])
    emit("o014", stamp(SRT, "The pricing tells you what this is"),
         "A cached read costs a tenth, and a write costs a quarter more", yb + 32, b + [body],
         "Bars to scale. A price is a business decision, not a measurement, but a tenfold discount "
         "is the provider's own estimate of what a hit saves. Prices change, and differ by model.")


# ---- b46: break-even ----------------------------------------------------------------------------
def b46():
    fresh = lambda n: 1.00 * n
    cached = lambda n: WRITE5 + READ * (n - 1)
    even = (WRITE5 - READ) / (1.00 - READ)
    assert [round(cached(n), 2) for n in range(1, 6)] == [1.25, 1.35, 1.45, 1.55, 1.65]
    assert round(even, 2) == 1.28 and cached(2) < fresh(2) and cached(1) > fresh(1)
    fifty = cached(50)
    assert round(fifty, 2) == 6.15 and round(50 / fifty, 1) == 8.1
    b = [hd(40, 46, "Total cost of a prefix used n times, in normal input prices")]
    X0, SC = 130, 80
    b.append(cell(130, 60, 14, 12, "u")); b.append(txt(150, 70, "without the cache", "sub2"))
    b.append(cell(290, 60, 14, 12, "s")); b.append(txt(310, 70, "with it: one write, then reads", "sub2"))
    for n in range(1, 6):
        y = 84 + (n - 1) * 46
        b.append(txt(40, y + 22, f"{n} use{'s' if n > 1 else ''}", "cap"))
        b.append(cell(X0, y, fresh(n) * SC, 16, "u"))
        b.append(txt(X0 + fresh(n) * SC + 8, y + 12, f(fresh(n)), "sub2"))
        b.append(cell(X0, y + 19, cached(n) * SC, 16, "s"))
        b.append(txt(X0 + cached(n) * SC + 8, y + 31, f(cached(n)), "sub2"))
    ye = 84 + 5 * 46 + 14
    b.append(eq(40, ye, 190, "cached: 1.25 + 0.10 × (n − 1)", "s", h=34))
    b.append(eq(246, ye, 120, "fresh: 1.00 × n", "u", h=34))
    b.append(eq(382, ye, 258, f"equal at n = 1.15 ÷ 0.90 = {f(even)}", "m", h=34))
    body, yb = prose(ye + 34 + 40, [
        f"The first use pays {f(WRITE5)} instead of 1.00, so the cache starts {f(WRITE5 - 1)} behind. "
        f"Every later use costs {f(READ)} instead of 1.00, saving {f(1 - READ)}, so the deficit is "
        f"repaid during the second use: {f(WRITE5)} + {f(READ)} = {f(cached(2))} against 2.00.",
        f"As lines, fresh costs n and cached costs 1.15 + 0.10 n. They cross where 1.15 = 0.90 n, at "
        f"n = {f(even)} uses. For fifty requests behind one system prompt ({{{{fig:v07-b38}}}}) the "
        f"prompt costs 1.25 + 49 × 0.10 = {f(fifty)} units instead of 50, about {f(50 / fifty, 0)} "
        "times less.",
    ])
    emit("b46", stamp(SRT, "Anthropic charges a premium to write the"),
         "A cached prefix pays for itself on its second use", yb + 32, b + [body],
         "Bars to scale. Anything used twice within its lifetime is worth caching; the only question "
         "is whether it will come back before it expires.")


# ---- b47: the agent's bill (widget) -------------------------------------------------------------
def bill(n, t, p0):
    """n steps, t new tokens a step, p0 tokens of starting context. Step k sends p0 + k*t."""
    sent = n * p0 + t * n * (n + 1) / 2
    reads = (n - 1) * p0 + t * n * (n - 1) / 2
    writes = p0 + n * t
    cost = WRITE5 * writes + READ * reads
    return sent, reads, writes, cost


AGENT = dict(n=20, t=1000, p0=0)

WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const D = __D__, G = __G__;
  __FMT__
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  function draw() {
    const n = +sl[0].value, t = +sl[1].value, p0 = +sl[2].value;
    val[0].textContent = n; val[1].textContent = gx(t); val[2].textContent = gx(p0);
    const sent = n * p0 + t * n * (n + 1) / 2, reads = (n - 1) * p0 + t * n * (n - 1) / 2;
    const writes = p0 + n * t, cost = 1.25 * writes + 0.10 * reads;
    const top = p0 + n * t, sc = G.H / top, bw = G.W / n;
    const bars = q('[data-bars]');
    while (bars.firstChild) bars.removeChild(bars.firstChild);
    for (let k = 1; k <= n; k++) {
      const tot = p0 + k * t, old = k === 1 ? 0 : p0 + (k - 1) * t, x = G.X + (k - 1) * bw;
      [[old, 0, 's'], [tot - old, old, 'm']].forEach(([h, base, c]) => {
        if (h <= 0) return;
        const g = document.createElementNS(NS, 'g'), r = document.createElementNS(NS, 'rect');
        g.setAttribute('class', c);
        r.setAttribute('x', (x + 1).toFixed(2)); r.setAttribute('width', Math.max(bw - 2, 1).toFixed(2));
        r.setAttribute('y', (G.B - (base + h) * sc).toFixed(2)); r.setAttribute('height', (h * sc).toFixed(2));
        r.setAttribute('rx', 1); g.appendChild(r); bars.appendChild(g);
      });
    }
    q('[data-top]').textContent = gx(top);
    q('[data-last]').textContent = `step ${n}`;
    q('[data-sent]').textContent = `sent over ${n} step${n > 1 ? 's' : ''}: ${gx(sent)} tokens, of which ${gx(reads)} (${pcx(reads / sent)}) are a cached prefix`;
    q('[data-cost]').textContent = `bill: ${gx(sent)} units fresh, or 1.25 × ${gx(writes)} + 0.10 × ${gx(reads)} = ${gx(cost)} with the cache`;
    q('[data-ratio]').textContent = `${fx(sent / cost)} times cheaper`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl.forEach((s, i) => s.value = D[i]); draw(); });
  draw();
})();</script>"""


def b47():
    n, t, p0 = AGENT["n"], AGENT["t"], AGENT["p0"]
    sent, reads, writes, cost = bill(n, t, p0)
    assert (sent, reads, writes, cost) == (210_000, 190_000, 20_000, 44_000)
    assert round(reads / sent, 3) == 0.905 and round(sent / cost, 2) == 4.77
    # with no starting context the tokens per step cancel out of the ratio
    for tt in (100, 700, 5000):
        s2, _, _, c2 = bill(n, tt, 0)
        assert abs(s2 / c2 - sent / cost) < 1e-12
    G = dict(X=60, W=560, B=250, H=170)
    s = [hd(40, 34, "Tokens each step sends: the part sent before, and the part that is new")]
    top = p0 + n * t
    sc, bw = G["H"] / top, G["W"] / n
    bars = []
    for k in range(1, n + 1):
        tot, old = p0 + k * t, (0 if k == 1 else p0 + (k - 1) * t)
        x = G["X"] + (k - 1) * bw
        for h, base, c in ((old, 0, "s"), (tot - old, old, "m")):
            if h > 0:
                bars.append(f'<g class="{c}"><rect x="{x + 1:.2f}" width="{max(bw - 2, 1):.2f}" '
                            f'y="{G["B"] - (base + h) * sc:.2f}" height="{h * sc:.2f}" rx="1"/></g>')
    s.append(f'<g data-bars="">{"".join(bars)}</g>')
    s.append(ln(G["X"], G["B"] + 0.5, G["X"] + G["W"], G["B"] + 0.5, "axis"))
    s.append(f'<text class="sub2" x="{G["X"] - 8}" y="{G["B"] - G["H"] + 4}" text-anchor="end" data-top="">{g(top)}</text>')
    s.append(txt(G["X"] - 8, G["B"] + 4, "0", "sub2", "end"))
    s.append(txt(G["X"], G["B"] + 18, "step 1", "sub2"))
    s.append(f'<text class="sub2" x="{G["X"] + G["W"]}" y="{G["B"] + 18}" text-anchor="end" data-last="">step {n}</text>')
    s.append(cell(G["X"] + 120, G["B"] + 8, 12, 12, "s")); s.append(txt(G["X"] + 138, G["B"] + 18, "sent before: read from the cache", "sub2"))
    s.append(cell(G["X"] + 340, G["B"] + 8, 12, 12, "m")); s.append(txt(G["X"] + 358, G["B"] + 18, "new: written to it", "sub2"))
    y = G["B"] + 50
    s.append(f'<text class="sub2" x="40" y="{y}" data-sent="">sent over {n} steps: {g(sent)} tokens, of which '
             f'{g(reads)} ({pc(reads / sent)}) are a cached prefix</text>')
    s.append(f'<text class="sub2" x="40" y="{y + 18}" data-cost="">bill: {g(sent)} units fresh, or 1.25 × '
             f'{g(writes)} + 0.10 × {g(reads)} = {g(cost)} with the cache</text>')
    s.append(f'<text class="hd" x="40" y="{y + 42}" data-ratio="">{f(sent / cost)} times cheaper</text>')
    body, yb = prose(y + 84, [
        "Step k sends everything before it plus its own new tokens, so n steps of t new tokens send "
        "t × (1 + 2 + … + n) = t × n(n + 1) ÷ 2 tokens: pair the first term with the last, the second "
        "with the one before last, and each pair makes n + 1, with n ÷ 2 pairs. At every step all but "
        "the newest t were sent before: t × n(n − 1) ÷ 2 of them.",
        f"Priced at {f(WRITE5)} to write each step's new tokens and {f(READ)} to read the rest, twenty "
        f"steps of 1,000 tokens cost 25,000 + 19,000 = {g(cost)} units against {g(sent)}, "
        f"{f(sent / cost)} times less. With no starting context the tokens per step cancel out of that "
        "ratio, and only the number of steps decides it; a starting context, such as a long system "
        "prompt, makes the saving larger still.",
        "This assumes each step writes only its new tokens and every read hits. The arithmetic was "
        "checked against Python over many settings.",
    ])
    ctl = [
        f"<label>steps <input type='range' min='1' max='50' step='1' value='{n}'><span class='val'>{n}</span></label>"
        f"<label>new tokens a step <input type='range' min='100' max='5000' step='100' value='{t}'><span class='val'>{g(t)}</span></label>",
        f"<label>starting context <input type='range' min='0' max='20000' step='1000' value='{p0}'><span class='val'>{g(p0)}</span></label>"
        "<button type='button'>Reset</button>",
    ]
    js = js_fill(WIDGET_JS.replace("__FMT__", JS_FMT), D=[n, t, p0], G=G)
    emit_widget("b47", stamp(SRT, "Agents lean on this hardest because an"),
                "An agent's bill is almost all prefix", ctl, "".join(s) + body, yb + 26,
                "What an agent sends grows with the square of its steps, because it replays its whole "
                "history every time. With the cache, almost all of that replay is billed at a tenth.", js)


if __name__ == "__main__":
    for fn in (b44, b45, o014, b46, b47):
        fn()
