"""V4 Part 8, the KV cache (13:36-15:08): review entry 30 (p30, keys per channel in numbers), Fig 71's two
groups named, and Fig 72 given the arithmetic inside DeepSeek's 93.3% (review entry 31, folded into
Fig 72 because V3's p39 now draws the same three bars) and a pointer back to V3's MLA figures.

Sources read: Liu et al., "KIVI" (2024): keys per channel, values per token, asymmetric (min-max) groups,
the newest tokens kept in full precision until a group is complete. Hooper et al. (UC Berkeley),
"KVQuant" (2024): per-channel key quantization. DeepSeek LLM, Table 2: the 67B model has 95 layers,
d_model 8,192, 64 heads and 8 KV heads (head dimension 128). DeepSeek-V2: 60 layers, d_c = 512,
d_h^R = 64, and the deployed cache "into 6 bits on average", citing Hooper et al.; 93.3% and 5.76x.

  python3 figures/V04/src/part8_kv.py
"""
import math
import numpy as np
from common import emit, hd, cell, text, rect, prose, f, fi, nb, MINUS, st, OUT
from fixes import reprose, apply

# ---- p30: keys need their scale down the column ------------------------------------------------------------
K = np.array([[0.4, -0.3, 12.3, 0.2],
              [-0.2, 0.5, 11.2, -0.4],
              [0.28, 0.15, 13.1, 0.3]])
HOT = 2
BAD = 0.1                     # an entry off by more than this is drawn as damaged


def minmax4(v):
    """A 4-bit grid from the group's minimum to its maximum (a zero-point, as Fig p09): 16 codes."""
    lo, hi = float(v.min()), float(v.max())
    s = (hi - lo) / 15
    t = (v - lo) / s
    assert np.all(np.abs(t - np.floor(t) - 0.5) > 0.02), "a value sits on a rounding tie"
    q = np.round(t)
    return lo + s * q, s, q


def schemes():
    tok = [minmax4(r) for r in K]
    ch = [minmax4(c) for c in K.T]
    R_tok = np.array([r[0] for r in tok])
    R_ch = np.array([c[0] for c in ch]).T
    return tok, ch, R_tok, R_ch


def rms(e):
    return math.sqrt(float((e ** 2).mean()))


def p30():
    tok, ch, R_tok, R_ch = schemes()
    e_tok, e_ch = R_tok - K, R_ch - K
    r_tok, r_ch = rms(e_tok), rms(e_ch)
    ordinary = np.delete(np.arange(4), HOT)
    s_tok = [t[1] for t in tok]
    s_ch = [c[1] for c in ch]
    codes_tok = sorted({int(q) for t in tok for j, q in enumerate(t[2]) if j != HOT})
    assert codes_tok == [0, 1] and max(abs(K[:, ordinary]).ravel()) == 0.5
    assert all(0.75 < s < 0.9 for s in s_tok) and np.all(e_tok[:, HOT] == 0)
    assert np.all(np.abs(e_ch) < BAD) and np.sum(np.abs(e_tok) > BAD) == 6
    assert f(r_tok, 3) == "0.139" and f(r_ch, 3) == "0.014" and f(r_tok / r_ch, 0) == "10"
    assert f(s_ch[HOT], 2) == "0.13" and all(0.03 < s_ch[j] < 0.06 for j in ordinary)
    cw, ch_, gp = 58, 26, 4
    b = [hd(40, 30, "Keys from one head: 3 tokens × 4 channels, and channel 3 runs large in every token")]
    gx, gy = 150, 70
    for j in range(4):
        b.append(text(gx + j * (cw + gp) + cw / 2, gy - 10, f"channel {j + 1}", "sub2", "middle"))
    for i in range(3):
        b.append(text(gx - 12, gy + i * (ch_ + gp) + 17, f"token {i + 1}", "sub2", "end"))
        for j in range(4):
            b.append(cell(gx + j * (cw + gp), gy + i * (ch_ + gp), cw, ch_, "h" if j == HOT else "u",
                          label=f(K[i, j], 2)))
    b.append(text(gx + 4 * (cw + gp) + 14, gy + 17, "channel 3: 12.3, 11.2, 13.1", "sub2"))
    b.append(text(gx + 4 * (cw + gp) + 14, gy + 35, "the rest: 0.5 or less in size", "sub2"))

    def panel(x0, y0, R, err, title, side):
        out = [text(x0, y0 - 28, title, "cap")]
        for i in range(3):
            for j in range(4):
                out.append(cell(x0 + j * (cw + gp), y0 + i * (ch_ + gp), cw, ch_,
                                "h" if abs(err[i, j]) > BAD else "s", label=f(R[i, j], 2)))
        return out + side

    py = gy + 3 * (ch_ + gp) + 76
    side_tok = [text(40 + 4 * (cw + gp) + 2, py + i * (ch_ + gp) + 17, f"step {f(s_tok[i], 2)}", "sub2")
                for i in range(3)]
    side_ch = [text(360 + j * (cw + gp) + cw / 2, py + 3 * (ch_ + gp) + 14, f(s_ch[j], 3), "sub2", "middle")
               for j in range(4)]
    side_ch.append(text(360, py + 3 * (ch_ + gp) + 32, "steps, one per channel", "sub2"))
    b += panel(40, py, R_tok, e_tok, "One scale per token, along the rows", side_tok)
    b += panel(360, py, R_ch, e_ch, "One scale per channel, down the columns", side_ch)
    yb = py + 3 * (ch_ + gp) + 62
    b.append(text(40, yb, f"read back; red where off by more than {f(BAD, 1)}", "sub2"))
    b.append(text(40, yb + 22, f"rms error, all 12 entries: {f(r_tok, 3)}", "cap"))
    b.append(text(360, yb + 22, f"rms error: {f(r_ch, 3)}, {f(r_tok / r_ch, 0)} times smaller", "cap"))
    body, y = prose(yb + 64, [
        "Each group gets a 4-bit grid from its own minimum to its maximum, a zero-point as in "
        "{{fig:v04-p09}}, which is how KIVI stores its groups. One scale per token: each row's span "
        f"reaches its channel-3 value, so its step is about {f(min(s_tok), 2)} to {f(max(s_tok), 2)}, wider "
        "than any ordinary value. The ordinary values collapse onto the bottom two of the 16 codes, and "
        f"the rms error over all twelve entries is {f(r_tok, 3)}.",
        f"One scale per channel: channel 3's span is 11.2 to 13.1, a step of {f(s_ch[HOT], 2)}, and each "
        "ordinary channel gets a step of about 0.05. Every entry survives, channel 3 included: rms error "
        f"{f(r_ch, 3)}, {f(r_tok / r_ch, 0)} times smaller.",
        "KIVI, from Zirui Liu and colleagues, and KVQuant, from Coleman Hooper and colleagues at Berkeley, "
        "both in 2024, landed on this recipe independently: keys per channel; values, which have no fixed "
        "outlier channels, per token. A channel's scale needs that channel's tokens, so KIVI keeps the "
        "newest keys in full precision until a group of them is complete, then quantizes the group "
        "channel by channel.",
    ])
    b.append(body)
    emit("p30", st("A scale per key channel"), "Keys need their scale down the column: the numbers", y + 26, b,
         "The same twelve numbers in the same four bits. Only the direction in which they share a scale "
         "changes, and it decides whether the ordinary channels survive.")


# ---- Fig 71 and Fig 72 ---------------------------------------------------------------------------------------
def deepseek():
    old = 2 * 8 * 128 * 95                    # DeepSeek 67B: K and V, 8 KV heads of 128, 95 layers
    new = (512 + 64) * 60                     # DeepSeek-V2: latent 512 + RoPE key 64, 60 layers
    assert (old, new) == (194560, 34560) and 8192 // 64 == 128
    mla = 1 - new / old
    both = 1 - new * 6 / (old * 16)
    assert f(100 * mla, 1) == "82.2" and f(100 * both, 1) == "93.3"
    return old, new, mla, both


def o071():
    """Redrawn: each scale is a chip beside the cells it serves (the old teal bar covered two cells)."""
    pitch, rowh, cw, ch_, x0 = 42, 24, 36, 18, 130
    hot = (2, 7)
    b = [hd(40, 46, "Keys: outliers sit in fixed channels")]
    y0 = 66
    for i in range(4):
        for j in range(10):
            b.append(rect(x0 + j * pitch, y0 + i * rowh, cw, ch_, "h" if j in hot else "u", rx=2))
    for j in range(10):
        b.append(cell(x0 + j * pitch, y0 + 4 * rowh + 6, cw, 18, "s", label="s"))
    b.append(text(40, y0 + 13, "4 tokens", "sub2"))
    b.append(text(40, y0 + 4 * rowh + 20, "scales", "sub2"))
    b.append(text(x0, y0 + 4 * rowh + 50, "so one scale per channel, down the columns: the red channels get their own",
                  "sub2"))
    y1 = y0 + 4 * rowh + 100
    b.append(hd(40, y1, "Values: no channel structure"))
    y2 = y1 + 20
    for i in range(4):
        for j in range(10):
            b.append(rect(x0 + j * pitch, y2 + i * rowh, cw, ch_, "u", rx=2))
        b.append(cell(x0 + 10 * pitch + 6, y2 + i * rowh, cw, ch_, "s", label="s"))
    b.append(text(40, y2 + 13, "4 tokens", "sub2"))
    b.append(text(x0, y2 + 4 * rowh + 22, "so one scale per token, along the rows", "sub2"))
    body, y = prose(y2 + 4 * rowh + 64, [
        "KIVI and KVQuant, two groups working independently, arrived at this same recipe; "
        "{{fig:v04-p30}} works it in numbers. The asymmetry is empirical rather than designed: keys "
        "happen to carry per-channel structure and values happen not to.",
    ])
    b.append(body)
    emit("o071", "14:05", "Keys and values need different treatment", y + 26, b,
         "A good illustration that the right granularity is a property of the data, not a universal choice.")


def fix_existing():
    old, new, mla, both = deepseek()
    reprose("o072", 174, [
        "Rather than compressing each stored value, MLA caches a small learned summary, the latent, and "
        "rebuilds keys and values from it on the fly; {{fig:v03-o091}} unpacked how. DeepSeek report the "
        "cache shrinking 93.3% and maximum generation throughput rising 5.76 times over their previous "
        "model, DeepSeek 67B.",
        "That 93.3% holds both approaches at once. DeepSeek 67B cached 2 × 8 × 128 = 2,048 numbers a "
        f"token in each of its 95 layers, {fi(old)} in all; DeepSeek-V2 caches 512 + 64 = 576 in each of "
        f"60, {fi(new)} in all. At 16 bits apiece that alone is {f(100 * mla, 1)}% smaller. The deployed "
        "V2 also stores its cache at about "
        "6 bits a number, citing KVQuant, and "
        + nb(f"1 − ({fi(new)} × 6) ÷ ({fi(old)} × 16) = {f(100 * both, 1)}%") + ". {{fig:v03-p39}} draws "
        "the three sources to scale.",
    ])
    apply([("o072", "Fig 72 &nbsp;&middot;&nbsp; 14:35</div>",
            f"Fig 72 &nbsp;&middot;&nbsp; {st('The architectural alternative is MLA')}</div>")])


if __name__ == "__main__":
    p30()
    o071()
    fix_existing()
