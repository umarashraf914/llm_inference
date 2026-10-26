"""V6 Part 13, reading the headline: the part heading s13, then P47 (five headline numbers) and P48 (the
series so far, and the assumption it leaves) of plans/depth_pass/V06_review.md. Fig 23 (o023) is trimmed in
edits.py; its last paragraphs move to P48, which is where the video says them.

Sources, read for this build: DeepSeek-V3 model card (671B total, 37B activated); Mistral's Mixtral
announcement (46.7B, 12.9B per token); Qwen3-235B-A22B model card and report (235B, 22B activated, 128
experts, 8 active, no shared expert); Meta's Llama 4 announcement (Maverick: 400B total, 17B active, 128
routed experts and a shared one, each token to the shared expert and one routed); Kimi K2 model card (1T
total, 32B activated, 384 experts, 8 per token, 1 shared). DeepSeek V4 Pro's 1.6 trillion and its six of 384
experts are the series' own figures (V5), early ones.

  python3 figures/V06/src/headline.py      writes s13, p47, p48 in figures/V06/items/
"""
from decimal import Decimal
from common import (OUT, at, box, cell, dashed, emit, f, hd, ln, n, nb, pct, prose, rect, txt)


def share(a, t):
    """An exact decimal share, so 17 of 400 prints as 4.3% rather than as a binary float's 4.2."""
    return Decimal(int(a)) / Decimal(int(t))

MODELS = [  # name, total, active, how it routes
    ("DeepSeek V3", 671e9, 37e9, "8 of 256, and 1 shared"),
    ("Mixtral 8×7B", 46.7e9, 12.9e9, "2 of 8"),
    ("Qwen3-235B", 235e9, 22e9, "8 of 128"),
    ("Llama 4 Maverick", 400e9, 17e9, "1 of 128, and 1 shared"),
    ("Kimi K2", 1000e9, 32e9, "8 of 384, and 1 shared"),
]
V4PRO = 1.6e12


def s13():
    (OUT / "s13.html").write_text(
        "<div class='sec'><div class='l'>Part 13</div><h2>Reading the headline</h2>"
        "<p>What a total measures, what it does not, and what the whole arrangement assumes.</p></div>",
        encoding="utf-8")
    print("s13 Reading the headline")


def p47():
    shares = [share(a, t) for _, t, a, _ in MODELS]
    assert [pct(s) for s in shares] == ["5.5%", "27.6%", "9.4%", "4.3%", "3.2%"]
    assert 0.03 < min(shares) and max(shares) < 0.28
    b = [hd(40, 46, "Totals (grey) and active counts (amber) to one scale, with what each costs")]
    X0, W = 196, 200
    SC = W / V4PRO
    XS, XM, XO = 414, 548, 640
    b.append(txt(XS, 80, "share run", "sub2"))
    b.append(txt(XM, 80, "memory, FP8", "sub2", "end"))
    b.append(txt(XO, 80, "ops per token", "sub2", "end"))
    y = 92
    for name, tot, act, route in MODELS:
        b.append(txt(40, y + 14, name, "cap"))
        b.append(txt(40, y + 30, route, "sub2"))
        b.append(rect(X0, y, tot * SC, 18, "u"))
        b.append(rect(X0, y, max(act * SC, 1.5), 18, "m"))
        b.append(txt(XS, y + 14, pct(share(act, tot)), "sub2"))
        b.append(txt(XM, y + 14, f"{tot / 1e9:,.1f} GB" if tot < 100e9 else f"{tot / 1e9:,.0f} GB", "sub2", "end"))
        b.append(txt(XO, y + 14, f"{2 * act / 1e9:,.1f} billion" if act < 13e9 else f"{2 * act / 1e9:,.0f} billion", "sub2", "end"))
        y += 44
    b.append(txt(40, y + 14, "DeepSeek V4 Pro", "cap"))
    b.append(txt(40, y + 30, "6 of 384; early figures", "sub2"))
    b.append(rect(X0, y, V4PRO * SC, 18, "u"))
    b.append(txt(XS, y + 14, "tens of billions active", "sub2"))
    yb = y + 64
    body, yy = prose(yb, [
        "Read every headline the same way. The total times the bytes per weight is the memory just to hold "
        "the model ({{fig:v01-o105}}): at FP8, a gigabyte per billion. Twice the active count is the "
        "arithmetic per token ({{fig:v01-o114}}).",
        "Each lab reports its own two numbers, and they count the edges of the model a little differently "
        "({{fig:v06-p45}}), so read them to two figures, not four. DeepSeek V4 Pro's 1.6 trillion, with six "
        "of its 384 experts running per token ({{fig:v05-o015}}), is from early figures, with no active "
        "count yet beyond tens of billions.",
    ])
    emit("p47", at("The memory footprint still tracks every parameter"), "Five headline numbers, read the same way",
         yy + 32, b + [body],
         "Bars drawn to one scale. Every one of these models runs between 3% and 28% of what it holds, so "
         "its memory bill and its compute bill differ by that factor.")


def p48():
    chain = [
        ("V1", "decode waits on reading every weight", "the memory wall"),
        ("V2", "the chip's tiers and what they cost", "inside the GPU"),
        ("V3", "kernels that move fewer bytes", "kernels and memory"),
        ("V4", "fewer bits for every weight", "quantization"),
        ("V5", "a model too big for one chip, split", "parallelism"),
        ("V6", "only part of the model run per token", "mixture of experts"),
    ]
    b = [hd(40, 46, "Six episodes, each answering what the one before left")]
    y = 66
    for k, (v, what, name) in enumerate(chain):
        b.append(txt(40, y + 21, v, "cap"))
        b.append(box(80, y, 320, 32, "m" if v == "V6" else "u", what))
        b.append(txt(414, y + 21, name, "sub2"))
        if k < len(chain) - 1:
            b.append(f'<line class="conn" x1="240" y1="{y + 34}" x2="240" y2="{y + 44}" marker-end="url(#arw)"/>')
        y += 46
    b.append(f'<line class="conn" x1="240" y1="{y - 12}" x2="240" y2="{y - 2}" marker-end="url(#arw)"/>')
    b.append(box(80, y + 4, 320, 32, "h", "it assumes a crowd: enough users at once"))
    b.append(txt(414, y + 25, "V7, serving in production", "sub2"))
    body, yy = prose(y + 84, [
        "Over six episodes the series has assembled an inference stack piece by piece: the memory wall, the "
        "hardware and the kernels beneath it, weights shrunk to fewer bits, the model split across GPUs, "
        "and now its compute made sparse.",
        "But sparsity makes a quiet assumption. When one request arrives, eight experts do a little work and "
        "the other 248 do nothing at all ({{fig:v06-p39}}). For any of this to make sense there have to be "
        "enough users on the system at the same moment to keep every expert busy, while every one of those "
        "users still waits on an answer.",
        "How a serving system gathers that crowd and gets everyone their answer on time is the next episode.",
    ])
    emit("p48", at("Over six episodes"), "Six episodes, one stack", yy + 32, b + [body],
         "Each episode answered the bottleneck the one before it left. This one leaves a demand rather than a "
         "bottleneck: a crowd, served fast.")


if __name__ == "__main__":
    for fn in (s13, p47, p48):
        fn()
