"""V6 Part 4, the mechanism: Fig 10 (o010) redrawn and moved before Fig 09 (o009), which gains its
renormalised gates; then P11 (Mixtral counted), P12 (why 8x7B is not 56 B), P13 (reading time).

Sources: Mixtral-8x7B and Mistral-7B config.json on Hugging Face; Mistral's announcement
(mistral.ai/news/mixtral-of-experts: 46.7B total, 12.9B per token); NVIDIA's H100 page (3.35 TB/s).

  python3 figures/V06/src/mechanism.py      writes o010, o009, p11, p12, p13 in figures/V06/items/
"""
from common import (H100, MX, at, box, cell, dashed, dsv3, emit, f, hd, ln, n, nb, prose, rect, txt)


# ---- Fig 10: one network becomes many -------------------------------------------------------------
def o010():
    b = [hd(40, 46, "A dense layer runs one feed-forward network")]
    b.append(box(200, 66, 280, 44, "m", "one feed-forward network"))
    b.append(hd(40, 152, "An MoE layer holds N of them side by side, with a router in front"))
    b.append(box(40, 172, 98, 92, "s", "router", "also called", "the gate"))
    for i in range(6):
        b.append(box(152 + i * 82, 172, 74, 92, "m" if i in (0, 1) else "u", f"E{i + 1}", "a full", "network"))
    b.append(txt(152, 286, "each expert is a complete feed-forward network, the same size as the one it replaces",
                 "sub2"))
    body, y = prose(330, [
        "Where a dense layer runs one feed-forward network, an MoE layer holds N of them, called experts. "
        "Nothing else in the layer changes; the experts simply stand where the single network stood.",
        "In front of them sits a small router, also called the gate. Its whole job is to decide which "
        "experts see which token: it scores all N for every token that arrives and sends the token "
        "through only the K highest. The classic choice is K = 2, the two lit here.",
    ])
    emit("o010", at("Where a dense layer runs one feedforward"), "One network becomes many", y + 32, b + [body],
         "Note how local the change is. Attention and the residual stream are untouched; only the "
         "feed-forward block is replaced, by N copies and a router.")


# ---- Fig 09: top-k, with the renormalised gates --------------------------------------------------
SHARES = [0.05, 0.41, 0.02, 0.33, 0.11, 0.08]


def o009():
    assert abs(sum(SHARES) - 1) < 1e-12
    top = sorted(range(6), key=lambda i: -SHARES[i])[:2]
    kept = sum(SHARES[i] for i in top)
    gate = {i: SHARES[i] / kept for i in top}
    assert top == [1, 3] and round(kept, 2) == 0.74
    assert [f(gate[i], 3) for i in top] == ["0.554", "0.446"]
    b = [hd(40, 46, "Score every expert, keep the highest two, rescale them to one")]
    SC, X0 = 700, 160                                      # 700 px for a share of 1.0, as before
    for i, sh in enumerate(SHARES):
        y = 74 + i * 40
        b.append(txt(40, y + 18, f"expert {i + 1}", "cap"))
        w = sh * SC
        if i in top:
            b.append(cell(X0, y, w, 28, "m", label=f(sh)))
        else:
            b.append(rect(X0, y, w, 28, "u"))
            b.append(txt(X0 + w + 10, y + 18, f"{f(sh)}  dropped", "sub2"))
    yg = 74 + 6 * 40 + 20
    b.append(txt(40, yg, f"kept: {f(SHARES[1])} + {f(SHARES[3])} = {f(kept)}; divide each by it", "sub2"))
    for k, i in enumerate(top):
        y = yg + 16 + k * 40
        b.append(txt(40, y + 18, f"gate {i + 1}", "cap"))
        b.append(cell(X0, y, gate[i] * SC, 28, "m", label=f(gate[i], 3)))
    body, yy = prose(yg + 16 + 2 * 40 + 40, [
        f"The router's six scores add up to one, so each is a share. Keeping the top two keeps "
        f"{f(SHARES[1])} and {f(SHARES[3])}, three quarters of the total between them; experts 1, 3, 5 "
        "and 6 are never run for this token.",
        f"The two survivors are rescaled to add back up to one, each divided by {f(kept)}: "
        f"{nb(f'{f(SHARES[1])} / {f(kept)} = {f(gate[1], 3)}')} and {nb(f'{f(SHARES[3])} / {f(kept)} = {f(gate[3], 3)}')}. "
        f"Those are the weights of the blend: the layer's answer is {f(gate[1], 3)} of expert 2's output "
        f"plus {f(gate[3], 3)} of expert 4's.",
    ])
    emit("o009", at("keeps the K highest scorers"), "What top-k selection is", yy + 32, b + [body],
         "Bars drawn to scale. Two operations in one word: rank everything, then discard all but the best "
         "few. The scores that did the choosing also do the blending.")


# ---- P11: Mixtral's 46.7 billion, counted from its shapes ----------------------------------------
def p11():
    c, d = MX, MX["d"]
    qo = 2 * d * c["heads"] * c["head_dim"]
    kv = 2 * d * c["kv_heads"] * c["head_dim"]
    expert = 3 * d * c["ffn"]
    small = c["experts"] * d + 2 * d                       # router and the layer's two norms
    layer_h = qo + kv + c["experts"] * expert + small
    layer_r = qo + kv + c["k"] * expert + small
    ends = 2 * c["vocab"] * d + d                          # embedding, output head, final norm
    held = c["layers"] * layer_h + ends
    run = c["layers"] * layer_r + ends
    assert round(held / 1e9, 1) == 46.7 and round(run / 1e9, 1) == 12.9
    assert round(100 * c["layers"] * 8 * expert / held) == 97 and 3.5 < held / run < 4   # the caption
    rows = [
        ("attention: Q and O", f"2 × {n(d)} × {n(d)}", qo, qo),
        ("attention: K and V", f"2 × {n(d)} × {n(c['kv_heads'] * c['head_dim'])}", kv, kv),
        ("experts: 8 held, 2 run", f"3 × {n(d)} × {n(c['ffn'])} each", 8 * expert, 2 * expert),
        ("router and norms", f"8 × {n(d)} + 2 × {n(d)}", small, small),
        ("one layer", "", layer_h, layer_r),
        ("32 layers", "× 32", c["layers"] * layer_h, c["layers"] * layer_r),
        ("embedding and output head", f"2 × {n(c['vocab'])} × {n(d)}, and a norm", ends, ends),
    ]
    b = [hd(40, 46, "Mixtral's weights, counted from its published shapes")]
    XS, XH, XR = 236, 530, 640
    b.append(txt(XS, 78, "shape", "sub2"))
    b.append(txt(XH, 78, "held", "sub2", "end"))
    b.append(txt(XR, 78, "run per token", "sub2", "end"))
    y = 104
    for k, (lab, shape, hh, rr) in enumerate(rows):
        if lab in ("one layer", "embedding and output head"):
            b.append(ln(XS, y - 15, XR, y - 15, "tick"))
            y += 6
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(XS, y, shape, "sub2"))
        b.append(txt(XH, y, n(hh), "sub2", "end"))
        b.append(txt(XR, y, n(rr), "sub2", "end"))
        y += 28
    b.append(ln(XS, y - 15, XR, y - 15, "tick"))
    y += 8
    b.append(txt(40, y + 2, "total", "cap"))
    b.append(cell(XH - 112, y - 16, 112, 26, "u", label=f"{held / 1e9:.2f} billion"))
    b.append(cell(XR - 100, y - 16, 100, 26, "m", label=f"{run / 1e9:.2f} billion"))
    embed_row = c["vocab"] * d
    body, yy = prose(y + 52, [
        "Every count is rows × columns of a matrix ({{fig:v01-o101}} does the same sum for a dense "
        "model). Mixtral's 32 query heads share 8 key-value heads, so K and V are a quarter the size of "
        "Q and O. Each expert is the gated three-matrix block of {{fig:v06-p06}}, 14,336 wide.",
        f"The held column keeps all eight experts in every layer; the run column keeps the two a token is "
        f"sent to. They land on Mistral's published {held / 1e9:.1f} billion and {run / 1e9:.1f} billion. "
        "Both columns count the whole embedding table, as the published figures do; a token reads only "
        f"one row of it ({{{{fig:v01-o087}}}}), which would make the run column {(run - embed_row) / 1e9:.2f} billion.",
    ])
    emit("p11", at("makes the split concrete"), "Mixtral's 46.7 billion, counted from its shapes", yy + 32,
         b + [body],
         "Nothing about the headline numbers is mysterious: they are the shapes multiplied out. Experts "
         "are 97% of what Mixtral holds, which is why holding eight and running two divides the work by "
         "almost four.")
    return held, run


# ---- P12: why 8x7B is not 56 billion ----------------------------------------------------------------
def p12():
    c, d = MX, MX["d"]
    m = dsv3  # noqa: F841  (DeepSeek is not needed here)
    attn = 2 * d * c["heads"] * c["head_dim"] + 2 * d * c["kv_heads"] * c["head_dim"]
    expert = 3 * d * c["ffn"]
    ends = 2 * c["vocab"] * d + d
    shared_part = c["layers"] * (attn + 2 * d) + ends               # attention, norms, embeddings
    mistral7b = c["layers"] * expert + shared_part
    ffn_all = c["layers"] * c["experts"] * expert
    routers = c["layers"] * c["experts"] * d
    mixtral = ffn_all + shared_part + routers
    eight = 8 * mistral7b
    gap = eight - mixtral
    assert round(mistral7b / 1e9, 2) == 7.24 and round(mixtral / 1e9, 1) == 46.7
    assert gap == 7 * shared_part - routers and round(gap / 1e9, 2) == 11.23
    b = [hd(40, 46, "Billions of parameters, drawn to scale and split by what they are")]
    X0 = 200
    SC = 420 / eight
    rows = [("eight Mistral 7Bs", [(ffn_all, "m", "feed-forward"), (shared_part, "u", ""),
                                    (7 * shared_part, "h", "")]),
            ("Mixtral 8×7B", [(ffn_all, "m", "feed-forward"), (shared_part + routers, "u", "")])]
    for k, (lab, parts) in enumerate(rows):
        y = 74 + k * 64
        b.append(txt(40, y + 19, lab, "cap"))
        xx = X0
        for v, cl, inner in parts:
            w = v * SC
            if inner:
                b.append(cell(xx, y, w, 28, cl, label=f"{inner} {v / 1e9:.1f}"))
            else:
                b.append(rect(xx, y, w, 28, cl))
            xx += w
        tot = sum(v for v, _, _ in parts)
        b.append(txt(xx + 10, y + 19, f"{tot / 1e9:.1f}", "sub2"))
    yk = 74 + 2 * 64 - 4
    b.append(rect(X0, yk, 14, 14, "u"))
    b.append(txt(X0 + 22, yk + 11, f"attention, norms and embeddings, {shared_part / 1e9:.2f} each", "sub2"))
    b.append(rect(X0, yk + 24, 14, 14, "h"))
    b.append(txt(X0 + 22, yk + 35, f"seven more copies of them, {7 * shared_part / 1e9:.2f}", "sub2"))
    body, yy = prose(yk + 84, [
        f"Mistral 7B, the dense model Mixtral grew from, has {mistral7b / 1e9:.2f} billion parameters: one "
        f"feed-forward block per layer plus {shared_part / 1e9:.2f} billion of attention, norms and "
        f"embeddings. Eight of them would be {eight / 1e9:.1f} billion.",
        "Mixtral copies only the feed-forward block. Its eight experts per layer are exactly eight "
        "Mistral feed-forward blocks, but attention and the embeddings exist once. The gap, "
        f"{gap / 1e9:.2f} billion, is the seven copies of those that were never made, less "
        f"{routers / 1e6:.1f} million of routers that the dense models do not need.",
    ])
    emit("p12", at("46.7 billion total parameters"), "Why “8×7B” comes to 46.7 billion, not 56", yy + 32,
         b + [body],
         "The name counts the experts, not the model. Only the feed-forward block is multiplied, which "
         "is the same locality {{ref:v06-o010}} showed in a single layer.")


# ---- P13: reading time tracks what a token touches -----------------------------------------------
def p13(mx_held, mx_run):
    ds_held, ds_run = 671e9, 37e9                        # published; derived in Part 12
    t = lambda nbytes: nbytes / H100["bw"] * 1e3         # ms at one H100's bandwidth, one byte a weight
    assert round(t(ds_held)) == 200 and round(t(ds_run)) == 11
    b = [hd(40, 46, "Milliseconds to read one token's weights at 3.35 TB/s, one byte a weight")]
    X0, SC = 250, 350 / t(ds_held)
    rows = [("a dense 671 B model", t(ds_held), "h"), ("DeepSeek V3, 37 B run", t(ds_run), "m"),
            ("a dense 46.7 B model", t(mx_held), "h"), ("Mixtral, 12.9 B run", t(mx_run), "m")]
    for k, (lab, ms, cl) in enumerate(rows):
        y = 70 + k * 40 + (16 if k >= 2 else 0)
        b.append(txt(40, y + 19, lab, "cap"))
        w = ms * SC
        b.append(rect(X0, y, w, 28, cl))
        b.append(txt(X0 + w + 10, y + 19, f"{ms:.1f} ms" if ms < 20 else f"{ms:.0f} ms", "sub2"))
    body, yy = prose(70 + 4 * 40 + 16 + 44, [
        "At decode, a token's time is set by the bytes it must read divided by the bandwidth "
        f"({{{{fig:v01-o130}}}}). A dense model reads everything it holds; a mixture of experts reads only "
        f"the experts it runs, plus attention. DeepSeek V3's {t(ds_held):.0f} ms becomes {t(ds_run):.0f} ms, "
        f"Mixtral's {t(mx_held):.1f} ms becomes {t(mx_run):.1f} ms.",
        "These are one chip's rates for one token on its own. Real deployments split the weights across "
        "many chips, which shortens every bar alike, and a crowd of tokens wakes more experts at once, "
        "which Part 11 counts.",
    ])
    emit("p13", at("are used for any given token"), "Reading time tracks what a token touches", yy + 32,
         b + [body],
         "Bars drawn to scale. Time per token follows K, the experts run, while memory follows N, the "
         "experts held: the two dials of {{ref:v06-o011}}, turned into milliseconds.")


if __name__ == "__main__":
    o010()
    o009()
    held, run = p11()
    p12()
    p13(held, run)
