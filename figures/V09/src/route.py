"""V9 N4: the route map. One request's six stops, each with the techniques it meets there, every
technique linked to the figure that built it (plans/depth_pass/V09_review.md §4 N4; it replaces
Fig 2, which listed effects with no techniques and no episodes).

  python3 figures/V09/src/route.py      writes figures/V09/items/n04.html

Every pointer below was read before it was used: the label says what that figure teaches.
The chips use {{ref:}}, so they are links inside the SVG: this figure is the series' map.
"""
from common import SRT, box, cell, hd, para, stamp, emit, width

# stop, what happens there, then (technique, pointer)
STOPS = [
    ("1 · gateway", "picks the machine", [
        ("prefix match", "v01-o044"), ("the shared preamble", "v01-o026"),
        ("radix tree of prefixes", "v07-o013"), ("cache-aware routing", "v07-o014"),
        ("the orchestrator", "v07-o015")]),
    ("2 · prefill pool", "reads the new tokens", [
        ("skip the cached prefix", "v07-o012"), ("4-bit blocks with scales", "v04-o076"),
        ("tensor-core multiply", "v02-o079"), ("FlashAttention-4", "v03-o079"),
        ("tensor parallelism", "v05-o009"), ("experts and the router", "v06-o010"),
        ("the all-to-all", "v05-o016")]),
    ("3 · cache transfer", "crosses the network", [
        ("disaggregation", "v07-o010"), ("latent attention", "v03-o091"),
        ("8- and 4-bit cache", "v04-o071"), ("direct memory access", "v09-o009")]),
    ("4 · decode pool", "one token per step", [
        ("paged cache", "v03-o086"), ("continuous batching", "v07-o006"),
        ("speculative decoding", "v08-o002"), ("long-context cache", "v08-o015"),
        ("flash decoding", "v03-o094"), ("launch overhead", "v03-o095")]),
    ("5 · constrained pick", "only valid tokens", [
        ("the sampler", "v07-o021"), ("masking the logits", "v07-o023")]),
    ("6 · the user", "sees the stream", [
        ("streaming", "v01-o058"), ("TTFT and TPOT", "v01-o143"),
        ("goodput", "v07-o016"), ("percentiles", "v08-o025")]),
]
assert sum(len(c) for *_, c in STOPS) == 28 and len(STOPS) == 6
assert sum(ref.startswith("v09") for *_, c in STOPS for _, ref in c) == 1     # "all but one"


def n4():
    b = [hd(40, 46, "The six stops of one request, and the figure that built each technique it meets")]
    SX, SW = 40, 150                         # stop column
    X0, X1 = SX + SW + 22, 640               # chip area
    CH, RG, CG, PAD, MINH = 26, 8, 8, 11, 44
    y = 72
    blocks = []
    for stop, what, chips in STOPS:
        rows, cur, cx = [], [], X0           # lay the chips out in rows, measured at resolved length
        for name, ref in chips:
            lab = f"{name} · {{{{ref:{ref}}}}}"
            w = round(width(lab, "sub") + 2 * PAD)
            if cur and cx + w > X1:
                rows.append(cur)
                cur, cx = [], X0
            cur.append((lab, w))
            cx += w + CG
        rows.append(cur)
        ch = len(rows) * CH + (len(rows) - 1) * RG
        h = max(ch, MINH)
        cy = y + (h - ch) / 2
        for row in rows:
            cx = X0
            for lab, w in row:
                b.append(cell(cx, cy, w, CH, "s", label=lab))
                cx += w + CG
            assert cx - CG <= X1, (stop, cx)
            cy += CH + RG
        assert width(stop, "lbl") + 24 <= SW and width(what, "sub") + 24 <= SW
        b.append(box(SX, y, SW, h, "u", stop, what, rx=4))
        blocks.append((y, h))
        y += h + 24
    for (t1, h1), (t2, _) in zip(blocks, blocks[1:]):
        cx = SX + SW / 2
        b.append(f'<line class="conn" x1="{cx}" y1="{t1 + h1 + 3}" x2="{cx}" y2="{t2 - 3}" marker-end="url(#arw)"/>')
    y += 4
    band = "under every stop: the memory wall, {{ref:v01-o082}}, and the ridge it sets, {{ref:v01-o126}}"
    assert width(band, "sub") + 24 < 600
    b.append(cell(40, y, 600, 32, "h", label=band))
    y += 32
    body, yb = para(y + 40, [
        "These are the stops of the route {{fig:v01-o060}} drew in the first episode, named for this "
        "request. The router is the gateway here, and the pick, which happens inside every decode "
        "step, gets a stop of its own because this answer has to be a tool call.",
        "Beside each stop are the techniques the request meets there, each linked to the figure that "
        "builds it. All but one point back to an earlier episode. The exception, direct memory access "
        "between machines, is built in this one ({{fig:v09-o009}}).",
        "Under every stop sits the same constraint. A Blackwell GPU could use 1,250 operations for every "
        "byte it fetches, and a lone decode step offers it 4. Part 3 derives both numbers.",
    ])
    emit("n04", stamp(SRT, "A gateway picks a machine that already"),
         "Each stop on the route runs machinery built in an earlier episode", yb + 30, b + [body],
         "Only one technique on this route is new to the series. The final episode is an assembly, and "
         "each stop is one click from the figure that built it.")


if __name__ == "__main__":
    n4()
