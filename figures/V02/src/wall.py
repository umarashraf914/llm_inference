"""V2 Part 10, the memory wall: Fig 69 labelled and corrected, review proposals 21 and 22, and Fig 71
given its number.

  python3 figures/V02/src/wall.py     writes o069 p21 p22; edits o071
"""
from common import *  # noqa: F401,F403

GEN = [  # name, year, dense 16-bit FLOP/s, bandwidth B/s, narrowest float format, its dense FLOP/s
    ("V100", 2017, V100["fp16"], V100["bw"], "FP16", V100["fp16"]),
    ("A100", 2020, A100["bf16"], A100["bw"], "BF16", A100["bf16"]),
    ("H100", 2022, PEAK_BF16, HBM_BW, "FP8", PEAK_FP8),
    ("B200", 2024, B200["bf16"], B200["bw"], "FP4", B200["fp4"]),
]
R16 = [c / b for _, _, c, b, _, _ in GEN]
RNEW = [cn / b for _, _, _, b, _, cn in GEN]
assert [round(r) for r in R16] == [139, 153, 295, 281]
assert [round(r) for r in RNEW] == [139, 153, 590, 1125] and round(RNEW[-1] / RNEW[0], 1) == 8.1
assert round(GEN[-1][2] / GEN[0][2]) == 18 and round(GEN[-1][3] / GEN[0][3], 1) == 8.9


def o069():
    b = []
    cols = [(40, "Generation"), (180, "Dense 16-bit compute"), (390, "Bandwidth"), (540, "Ridge")]
    for x, s in cols:
        b.append(f'<text class="hd" x="{x}" y="62">{esc(s)}</text>')
    c0, b0 = GEN[0][2], GEN[0][3]
    for k, (name, year, c, bw, _, _) in enumerate(GEN):
        y = 92 + k * 40
        b.append(txt(40, y, f"{name}, {year}", "cap"))
        b.append(txt(180, y, f"{c / 1e12:,.0f} TFLOP/s  ({f(c / c0, 1).rstrip('0').rstrip('.')}×)", "sub2"))
        b.append(txt(390, y, f"{f(bw / 1e12, 2 if name == 'H100' else 1)} TB/s  ({f(bw / b0, 1).rstrip('0').rstrip('.')}×)", "sub2"))
        b.append(txt(540, y, f"{R16[k]:.0f}", "sub2"))
    body, yb = prose(92 + 4 * 40 + 22, [
        "Over seven years, dense 16-bit compute grew eighteen-fold and bandwidth about nine-fold. The "
        "ridge, their ratio, doubled from 139 to around 290.",
        "It did not rise every generation: the B200's 281 sits just below the H100's 295, because "
        "Blackwell's memory grew a little faster than its 16-bit compute. Even so, work that kept a V100's "
        "maths busy can be memory-bound on an H100 without anything about it having changed.",
    ])
    emit("o069", stamp(SRT, "Bandwidth has grown steadily"), "The wall, in numbers", yb + 24, b + [body],
         "At 16 bits the ridge doubled and then held level. The climb went somewhere else: into each "
         "generation's newest, narrowest format, next. Figures from NVIDIA's whitepapers, datasheets and "
         "B200 specifications (dense, without sparsity).")


def p21():
    b = [hd(40, 46, "Ridge, in operations per byte, at 16 bits and at each chip's narrowest float (log axis)")]
    X0, X1, V0, V1 = 170, 600, 100, 2000
    for k, (name, year, _, _, fmt, _) in enumerate(GEN):
        y = 64 + k * 62
        b.append(txt(40, y + 16, f"{name}, {year}", "cap"))
        for j, (v, c, lab) in enumerate([(R16[k], "u", "16-bit"), (RNEW[k], "m", fmt)]):
            yy = y + j * 26
            w = logx(v, V0, V1, X0, X1) - X0
            b.append(rect(X0, yy, w, 22, c))
            b.append(txt(X0 + w + 8, yy + 16, f"{v:,.0f} at {lab}", "sub2"))
    ax = 64 + 4 * 62 + 2
    b.append(ln(X0, ax, X1, ax, "axis"))
    for v in (100, 200, 500, 1000, 2000):
        x = logx(v, V0, V1, X0, X1)
        b.append(vline(x, ax, ax + 5))
        b.append(txt(round(x, 1), ax + 19, f"{v:,}", "sub2", "middle"))
    body, yb = prose(ax + 56, [
        "Each generation's tensor cores accept a narrower number, and halving the bits roughly doubles the "
        "operations per second on the same chip. Bandwidth gets no such multiplier. So at each chip's "
        f"narrowest floating-point format the ridge climbs from {RNEW[0]:.0f} on the V100 to "
        f"{RNEW[-1]:,.0f} on the B200, {RNEW[-1] / RNEW[0]:.1f} times higher, while at 16 bits it only "
        "doubled.",
        "Halving the bits also halves the bytes per weight, so work moved to the new format does twice the "
        "operations per byte: decode at 8 bits does 2 ({fig}), still 295 times below the FP8 ridge of 590. "
        "The formats speed up both sides for the work that adopts them; the headline compute races ahead "
        "of bandwidth.".replace("{fig}", "{{fig:v01-o116}}"),
    ])
    emit("p21", stamp(SRT, "lower precision math format"), "At each generation's narrowest format, the ridge climbs eightfold",
         yb + 24, b + [body],
         "This is the trend behind “compute climbed faster still”: not more silicon so much as narrower "
         "numbers. The A100 added no narrower float than 16 bits, which is why its two bars match.")


def p22():
    up = H200["bw"] / HBM_BW
    model = 70e9                                   # 70B weights at 8 bits, 70 GB: fits on both chips
    tps = [HBM_BW / model, H200["bw"] / model]
    ridge2 = PEAK_BF16 / H200["bw"]
    assert round(up, 2) == 1.43 and [round(t, 1) for t in tps] == [47.9, 68.6] and round(ridge2) == 206
    assert 140 <= H200["gb"] and 140 > HBM_GB
    b = [hd(40, 46, "Same compute die, different memory, drawn to scale")]
    rows = [("bandwidth, TB/s", [HBM_BW / 1e12, H200["bw"] / 1e12], 5.0, "{:.2f}", "{:.1f}"),
            ("tokens a second", tps, 70.0, "{:.1f}", "{:.1f}"),
            ("ridge, ops per byte", [PEAK_BF16 / HBM_BW, ridge2], 300.0, "{:.0f}", "{:.0f}")]
    y = 66
    for lab, (v1, v2), top, f1_, f2_ in rows:
        b.append(txt(40, y + 16, lab, "cap"))
        for j, (chip, v, fmt_) in enumerate([("H100", v1, f1_), ("H200", v2, f2_)]):
            yy = y + j * 26
            w = v / top * 330
            b.append(rect(230, yy, w, 22, "h" if j == 0 else "s"))
            b.append(txt(230 + w + 8, yy + 16, f"{chip}: {fmt_.format(v)}", "sub2"))
        y += 2 * 26 + 24
    body, yb = prose(y + 22, [
        f"The H200 keeps the H100's compute die and replaces the memory: 141 GB at 4.8 TB/s against 80 GB "
        f"at 3.35. That is {up:.2f} times the bandwidth.",
        "Decoding one request reads every weight once per token, so the token rate is bandwidth ÷ bytes "
        f"({{{{fig:v01-o014}}}}). For a 70B model stored at 8 bits, 70 GB, that goes from {tps[0]:.1f} to "
        f"{tps[1]:.1f} tokens a second, the same {100 * (up - 1):.0f}% as the bandwidth, from a change that "
        "added no arithmetic at all.",
        f"The ridge falls from 295 to {ridge2:.0f}: with more bytes a second, fewer operations per byte keep "
        "the same tensor cores busy. And 141 GB holds a 70B model's 140 GB at 16 bits, which an H100 "
        "cannot, though with almost nothing to spare.",
    ])
    emit("p22", stamp(SRT, "genuine speedup"), "The H200's extra 43% of bandwidth is 43% more tokens a second",
         yb + 24, b + [body],
         "Bars to scale. The ceiling assumes the model fits and nothing else competes for the bus; real "
         "systems land below it, but the ratio carries over. Memory figures from NVIDIA's H200 datasheet.")


def o071():
    edit_item("o071", from_y=220, paras=[
        "NVIDIA effectively ran the controlled experiment. The only thing that changed is the memory: "
        f"{H200['bw'] / HBM_BW:.2f} times the bandwidth. For memory-bound work that upgrade alone is a "
        "genuine speed-up.",
        "Direct evidence that inference is limited by bandwidth rather than by tensor-core speed.",
    ])


if __name__ == "__main__":
    o069()
    p21()
    p22()
    o071()
