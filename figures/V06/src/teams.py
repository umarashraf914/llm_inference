"""V6 Parts 7 and 8, how many experts and the shared expert: P21, P22, P23 of
plans/depth_pass/V06_review.md, and the part heading s11 (The shared expert).

Source for the counts: Dai et al. 2024, DeepSeekMoE (arXiv 2401.06066), §3.1: 16 experts top-2 give 120
combinations, split into 4 each give 4,426,165,368. Shapes from the Mixtral and DeepSeek-V3 configs.

  python3 figures/V06/src/teams.py      writes p21, p22, p23 and s11 in figures/V06/items/
"""
import math
from common import (DS, MX, OUT, at, cell, dsv3, emit, f, hd, ln, n, nb, pct, prose, rect, txt)


def p21():
    letters = "ABCD"
    pairs = [(a, b) for i, a in enumerate(letters) for b in letters[i + 1:]]
    assert len(pairs) == 4 * 3 // 2 == math.comb(4, 2) == 6
    b = [hd(40, 46, "Four experts, two at a time: every pair, listed")]
    for i, (a, c) in enumerate(pairs):
        b.append(cell(40 + i * 82, 64, 72, 28, "m", label=f"{a} + {c}"))
    b.append(txt(40, 116, "4 choices for the first, 3 for the second: 12 ordered picks, each pair met twice, "
                          "12 / 2 = 6", "sub2"))
    b.append(hd(40, 160, "Sixteen experts: one cell for each pair, each pair once"))
    N, C, G, X0, Y0 = 16, 10, 2, 60, 178
    shaded = 0
    for r in range(N):
        for c in range(N):
            up = c > r
            shaded += up
            b.append(rect(X0 + c * (C + G), Y0 + r * (C + G), C, C, "m" if up else "u", rx=1))
    assert shaded == N * (N - 1) // 2 == math.comb(N, 2) == 120
    side = N * (C + G) - G
    for k, s in enumerate([f"{N} × {N} = {N * N} cells, one for each ordered pick",
                           f"{N} on the diagonal pair an expert with itself",
                           f"the other {N * N - N} hold every pair twice, above and below",
                           f"{N * N - N} / 2 = {shaded} shaded, which is {N} × {N - 1} / 2"]):
        b.append(txt(X0 + side + 30, Y0 + 26 + k * 24, s, "sub2"))
    yC = Y0 + side + 44
    b.append(hd(40, yC, "Sixty-four experts, eight at a time"))
    top = math.prod(range(64, 56, -1))
    bot = math.factorial(8)
    teams = top // bot
    assert top % bot == 0 and teams == math.comb(64, 8) == 4_426_165_368
    b.append(cell(40, yC + 18, 600, 32, "u", rx=6,
                  label=f"64 × 63 × 62 × 61 × 60 × 59 × 58 × 57 = {n(top)} ordered picks"))
    b.append(cell(40, yC + 58, 600, 32, "u", rx=6,
                  label=f"each team turns up in 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = {n(bot)} orders"))
    b.append(cell(40, yC + 98, 600, 32, "m", rx=6, label=f"{n(top)} / {n(bot)} = {n(teams)} teams"))
    ds = math.comb(DS["routed"], DS["k"])
    assert round(ds / 1e14, 1) == 4.1 and round(teams / 120) == 36_884_711
    body, y = prose(yC + 170, [
        "Counting teams is counting choices. The first member of a team can be any expert, the second "
        "any of those left, and so on; multiplying the shrinking choices counts every ordered pick. The "
        "same team then turns up once for every order its members could be picked in, so divide by that.",
        f"Two of 16 gives 16 × 15 / 2 = {math.comb(16, 2)}. Eight of 64 gives the product above, "
        f"{n(teams)}, about {teams / 120 / 1e6:.0f} million times as many. DeepSeek V3 picks "
        f"{DS['k']} of {DS['routed']}: {nb(f'{ds / 1e14:.1f} × 10¹⁴')} possible teams for every token.",
    ])
    emit("p21", at("Start with 16 experts"), "Counting teams: four experts make six pairs, sixteen make 120",
         y + 32, b + [body],
         "One rule does all three counts: choices multiplied, then divided by the orders the same team "
         "can be picked in. Splitting experts grows the top of that fraction far faster than the bottom.")


def p22():
    d, w = MX["d"], MX["ffn"]
    full = 3 * d * w                                   # one expert of Mixtral's size
    quarter = 3 * d * (w // 4)
    assert full == 4 * quarter and 2 * full == 8 * quarter
    v = dsv3()
    dense = v["dense_ffn"]
    nine = (DS["k"] + DS["shared"]) * v["expert"]
    assert DS["ffn_dense"] == (DS["k"] + DS["shared"]) * DS["ffn_expert"] and dense == nine
    b = [hd(40, 46, "The same weights cut into two pieces or eight, drawn to scale")]
    X0, W = 230, 400
    SC = W / (2 * full)

    def split(y, k, each, cl, lab):
        b.append(txt(40, y + 19, lab, "cap"))
        for i in range(k):
            ww = each * SC
            if ww > 70:
                b.append(cell(X0 + i * ww, y, ww, 28, cl, label=f"{each / 1e6:.1f} M"))
            else:
                b.append(rect(X0 + i * ww, y, ww, 28, cl))

    split(70, 2, full, "m", "two full experts")
    split(112, 8, quarter, "m", "eight quarter experts")
    b.append(txt(X0, 162, f"{each_m(quarter)} each; {2 * full / 1e6:.1f} million either way", "sub2"))
    b.append(hd(40, 212, "DeepSeek V3: a token runs one dense block's worth"))
    SC = W / dense
    b.append(txt(40, 250, "a dense layer's block", "cap"))
    b.append(cell(X0, 232, W, 28, "m", label=f"18,432 wide: {dense / 1e6:.1f} M"))
    b.append(txt(40, 292, "8 routed + 1 shared", "cap"))
    for i in range(9):
        ww = v["expert"] * SC
        b.append(rect(X0 + i * ww, 274, ww, 28, "s" if i == 8 else "m"))
    b.append(txt(X0, 322, f"2,048 wide each: 9 × {v['expert'] / 1e6:.2f} M = {nine / 1e6:.1f} M; the last is the shared expert",
                 "sub2"))
    body, y = prose(370, [
        "An expert's weights are its three matrices, each the token's width by the expert's own width "
        f"({{{{fig:v06-p06}}}}). Cut the expert's width to a quarter and every matrix shrinks to a quarter: for "
        f"an expert of Mixtral's size, {nb(f'3 × {n(d)} × {n(w)}')} = {full / 1e6:.1f} million weights become "
        f"{nb(f'3 × {n(d)} × {n(w // 4)}')} = {quarter / 1e6:.1f} million. Each weight is one multiply-add, "
        "so the work shrinks with it.",
        f"So eight quarter-experts cost what two full experts cost, {2 * full / 1e6:.1f} million weights "
        "either way, while the teams go from 120 to 4,426,165,368.",
        f"DeepSeek V3 is built exactly so. Its first three layers keep a dense block {n(DS['ffn_dense'])} "
        f"wide, and {n(DS['ffn_dense'])} = 9 × {n(DS['ffn_expert'])}: a token's 8 routed experts plus the "
        "shared one are one dense block of work, chosen from 257 held.",
    ])
    emit("p22", at("eight quarter-width experts cost exactly"), "Slicing changes the number of teams, not the bill",
         y + 32, b + [body],
         "Bars drawn to scale. Fine-grained experts spend nothing extra per token; what they buy is choice, "
         "and what they cost is the memory to hold all of them.")


def each_m(v):
    return f"{v / 1e6:.1f} million"


def p23():
    v = dsv3()
    shared = v["parts"]["shared"]
    held, run = v["total"], v["active"]
    assert round(shared / 1e9, 2) == 2.55 and pct(shared / held, 2) == "0.38%" and pct(shared / run) == "6.8%"
    b = [hd(40, 46, "The nine experts a token runs in one MoE layer")]
    for i in range(9):
        b.append(cell(40 + i * 66, 64, 58, 30, "s" if i == 8 else "m", label="shared" if i == 8 else f"R{i + 1}"))
    b.append(txt(40, 116, "eight routed, chosen by the router, and the shared one, which every token gets", "sub2"))
    b.append(hd(40, 162, "The shared experts' weight, each bar to its own scale"))
    X0, W = 230, 400
    for k, (lab, tot, cl) in enumerate([(f"held: {tot_b(held)}", held, "u"), (f"run per token: {tot_b(run)}", run, "m")]):
        y = 182 + k * 50
        b.append(txt(40, y + 19, lab, "cap"))
        ws = shared / tot * W
        b.append(rect(X0, y, W - ws, 28, cl))
        b.append(rect(X0 + W - ws, y, max(ws, 2), 28, "s"))
        b.append(txt(X0 + W - ws - 8, y + 44, f"shared: {pct(shared / tot, 2 if k == 0 else 1)}", "sub2", "end"))
    body, y = prose(182 + 2 * 50 + 50, [
        "A shared expert is an ordinary expert, three matrices of 7,168 × 2,048, that skips the router "
        f"and runs for every token. DeepSeek V3 has one in each of its {v['moe_layers']} MoE layers: "
        f"{v['moe_layers']} × {v['expert'] / 1e6:.2f} million = {shared / 1e9:.2f} billion weights.",
        f"Against everything held, that is {pct(shared / held, 2)}, the price of one expert in 257. Against "
        f"what a token runs it is {pct(shared / run)}, and one expert in nine in every MoE layer: the "
        "always-on part of each token's bill.",
    ])
    emit("p23", at("pairs one shared expert"),
         "The shared expert costs a ninth of the expert work and 0.4% of the memory", y + 32, b + [body],
         "Cheap to hold and paid by every token, which is the right shape for knowledge every token "
         "needs. The routed experts carry the rest.")


def tot_b(v):
    return f"{v / 1e9:.1f} B"


def s11():
    (OUT / "s11.html").write_text(
        "<div class='sec'><div class='l'>Part 8</div><h2>The shared expert</h2>"
        "<p>One expert that every token uses.</p></div>", encoding="utf-8")
    print("s11 The shared expert")


if __name__ == "__main__":
    for fn in (p21, p22, p23, s11):
        fn()
