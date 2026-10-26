"""V8 Part 3: the acceptance rule worked with three tokens (review §4 C1–C9; §5 P11, P21, P22).

  python3 figures/V08/src/spec_accept.py     writes items a05–a13, o005, o006 and o007

The running example is Fig 05's own bar: the target p = (cat 0.5, dog 0.3, rest 0.2), and a drafter
q = (0.2, 0.6, 0.2) that overrates dog. Dog is then exactly the rule's spoken example: drafter 60%,
target 30%, kept with probability 50%.

a05  C1  Keeping the drafter's guesses writes dog twice as often as the target would
o006     rewritten: the rule as a decision for one guess; caption fixed (P11)
a06  C2  Five guesses, checked left to right, stopping at the first rejection
a07  C3  The chance of keeping a guess is p over q, capped at one
a08  C4  Proposed and kept: the smaller of p and q
a09  C5  The replacement is drawn only from what the drafter left short
a10  C6  0.2 kept plus 0.3 replaced is cat's 0.5: the target, rebuilt
a11  C7  At temperature zero, the rule becomes the greedy check
a12  C9  A bad drafter is slower, never wrong
a13  C8  widget: drag the drafter; the output does not move
o007     rewritten: what the two original papers measured, to scale
o005     recoloured: the target's bar is grey, as p is everywhere in this part
"""
import json
from spec_common import (cell, ghost, txt, hd, ln, arr, box, prose, emit, at, bar, f, fc, widget,
                         mulberry32, MULBERRY_JS, FMT_JS, OUT)

TOK = ["cat", "dog", "rest"]
P = [0.5, 0.3, 0.2]                       # Fig 05's bar: the target
Q = [0.2, 0.6, 0.2]                       # a drafter that overrates dog


def rule(p, q):
    """Everything the acceptance rule computes for one guess, for distributions p and q."""
    kept = [min(a, b) for a, b in zip(p, q)]               # proposed and kept: q × min(1, p/q)
    alpha = sum(kept)
    left = [max(0.0, a - b) for a, b in zip(p, q)]          # what the drafter left short
    L = sum(left)
    share = [x / L for x in left] if L > 1e-12 else [0.0] * len(p)
    out = [k + L * s for k, s in zip(kept, share)]
    return kept, alpha, left, L, share, out


def pick(d, u):
    c = 0.0
    for i, v in enumerate(d):
        c += v
        if u < c:
            return i
    return max(i for i, v in enumerate(d) if v > 0)


def sample(p, q, n, seed):
    """The rule run n times, as the widget runs it: propose from q, test, or replace."""
    kept, alpha, left, L, share, out = rule(p, q)
    rnd, cnt, acc = mulberry32(seed), [0] * len(p), 0
    for _ in range(n):
        x = pick(q, rnd())
        if rnd() < min(1.0, p[x] / q[x]):
            acc += 1
            cnt[x] += 1
        else:
            cnt[pick(share if L > 1e-12 else p, rnd())] += 1
    return cnt, acc


KEPT, ALPHA, LEFT, L, SHARE, OUTD = rule(P, Q)
RATIO = [a / b for a, b in zip(P, Q)]
assert RATIO == [2.5, 0.5, 1.0] and [min(1, r) for r in RATIO] == [1, 0.5, 1]
assert KEPT == [0.2, 0.3, 0.2] and abs(ALPHA - 0.7) < 1e-12
assert [round(x, 12) for x in LEFT] == [0.3, 0, 0] and abs(L - (1 - ALPHA)) < 1e-12 and SHARE == [1.0, 0, 0]
assert all(abs(o - p) < 1e-12 for o, p in zip(OUTD, P))
CF_P = [k + (1 - ALPHA) * a for k, a in zip(KEPT, P)]           # test, but replace from p itself
CF_DROP = [k / ALPHA for k in KEPT]                             # test, and drop rejections
assert [round(x, 2) for x in CF_P] == [0.35, 0.39, 0.26] and [round(x, 2) for x in CF_DROP] == [0.29, 0.43, 0.29]
CONF = [Q[i] if Q[i] >= 0.5 else 0 for i in range(3)]          # keep only confident guesses, redraw the rest from p
NAIVE_CONF = [CONF[i] + (1 - sum(CONF)) * P[i] for i in range(3)]
assert [round(x, 2) for x in NAIVE_CONF] == [0.2, 0.72, 0.08]
MC_N, MC_SEED = 1_000_000, 2026
MC_CNT, MC_ACC = sample(P, Q, MC_N, MC_SEED)
assert abs(MC_ACC / MC_N - 0.7) < 0.002 and all(abs(c / MC_N - p) < 0.002 for c, p in zip(MC_CNT, P))


# ---- o005: recolour the target's bar --------------------------------------------------------------
def o005():
    path = OUT / "o005.html"
    s = path.read_text(encoding="utf-8")
    if 'class="m"' in s:
        assert s.count('<g class="m">') == 4
        s = s.replace('<g class="m">', '<g class="u">')
        path.write_text(s, encoding="utf-8")
    print("o005 recoloured")


def segbar(x, y, w, h, vals, cls, labels=None, gap=2):
    """A 100% bar cut into segments, one per token, to scale."""
    o, xx = [], x
    for k, v in enumerate(vals):
        ww = v * w
        if ww > 0:
            o.append(cell(xx, y, max(ww - gap, 1), h, cls[k] if isinstance(cls, list) else cls,
                          label=labels[k] if labels else None))
        xx += ww
    return "".join(o)


# ---- a05 · C1: the naive rule samples from q -------------------------------------------------------
def a05():
    b = [hd(40, 46, "Write p for the target's probabilities and q for the drafter's")]
    X0, W = 150, 470
    b.append(txt(40, 85, "target, p", "cap"))
    b.append(segbar(X0, 66, W, 30, P, "u", [f"{t} {v:.1f}" for t, v in zip(TOK, P)]))
    b.append(txt(40, 129, "drafter, q", "cap"))
    b.append(segbar(X0, 110, W, 30, Q, "m", [f"{t} {v:.1f}" for t, v in zip(TOK, Q)]))
    y0 = 196
    b.append(hd(40, y0, "A thousand runs, counted"))
    CW, G, XT = 120, 10, 200
    for k, t in enumerate(TOK):
        b.append(txt(XT + k * (CW + G) + CW / 2, y0 + 30, t, "sub2", "middle"))
    rows = [("the target alone", [round(1000 * v) for v in P], "u"),
            ("keeping every guess", [round(1000 * v) for v in Q], "m")]
    for r, (lab, counts, c) in enumerate(rows):
        y = y0 + 40 + r * 40
        b.append(txt(40, y + 19, lab, "cap"))
        for k, n in enumerate(counts):
            cls = "h" if (r == 1 and k == 1) else c
            b.append(cell(XT + k * (CW + G), y, CW, 28, cls, label=fc(n)))
    assert rows[1][1][1] == 2 * rows[0][1][1] == 600
    body, yb = prose(y0 + 160, [
        "Keep every guess the drafter makes and the text is whatever the drafter would have sampled: "
        "its distribution q, not the target's p. Over a thousand runs that writes ‘dog’ about 600 "
        "times where the target would write it about 300, and ‘cat’ 200 times instead of 500.",
        "Keeping only the guesses the drafter is confident about makes it worse. Keep its guesses "
        "above 0.5 and let the target redraw the rest: every ‘dog’ guess survives and the redraws "
        f"add more, so dog comes out {NAIVE_CONF[1]:.2f}. The drafter's opinion still decides.",
        "No single answer looks wrong. The proportions are wrong, and the proportions are what was "
        "asked for.",
    ])
    emit("a05", at("keep a guess whenever the drafter was confident"),
         "Keeping the drafter's guesses writes ‘dog’ twice as often as the target would", yb + 30,
         b + [body],
         "Each output looks fine; only the counts give it away. That is why correctness here means "
         "matching a distribution, as {{ref:v08-o005}} set out.")


# ---- o006: the rule, as a decision for one guess -------------------------------------------------
def o006():
    b = [hd(40, 46, "One guess x, proposed by the drafter with probability q(x)")]
    b.append(box(190, 66, 300, 40, "u", "the target scores the same token: p(x)"))
    b.append(arr(270, 108, 190, 140))
    b.append(arr(410, 108, 490, 140))
    b.append(box(40, 144, 285, 54, "m", "p(x) ≥ q(x)", "keep x"))
    b.append(box(355, 144, 285, 54, "m", "p(x) < q(x)", "keep x with probability p(x) ÷ q(x)"))
    b.append(arr(497, 200, 497, 228))
    b.append(box(355, 232, 285, 54, "h", "otherwise reject x", "replace it from the leftover; stop"))
    b.append(txt(40, 226, "kept guesses go on to the next one", "sub2"))
    body, yb = prose(334, [
        "The rule from the original 2022 paper works through the guesses one at a time. For each, the "
        "target has its own probability for the token the drafter proposed, p(x), and the drafter "
        "had one too, q(x).",
        "When the target likes the token at least as much, the guess is kept outright. When it likes "
        "it less, the guess is kept with probability p(x) ÷ q(x): a token the drafter rated at 60% "
        "and the target at 30% is kept half the time.",
        "A rejected guess is replaced rather than dropped. The replacement is drawn from the "
        "leftover: the target's probability for every token minus the drafter's, negatives clipped "
        "to zero, and what remains rescaled to add to 1. Then the pass stops.",
    ])
    emit("o006", at("The rule in the original paper avoids that completely"),
         "Keep with probability p ÷ q, capped at one; replace what is rejected", yb + 30, b + [body],
         "Two halves, and exactness needs both: the p-over-q test, and a replacement drawn only from "
         "what the drafter left short. The next five figures work both with three tokens.")


# ---- a06 · C2: the walk ---------------------------------------------------------------------------
WALK = [(1.4, None), (0.8, 0.35), (0.5, 0.62)]     # p/q at each guess, and the random draw (illustrative)


def a06():
    b = [hd(40, 46, "Each guess gets a dart in [0, 1); it is kept if the dart lands below p ÷ q")]
    XS, W = 210, 260
    verdicts = []
    for k in range(5):
        y = 100 + k * 60
        b.append(txt(40, y + 19, f"guess {k + 1}", "cap"))
        if k < len(WALK):
            r, u = WALK[k]
            kp = min(1.0, r)
            b.append(txt(110, y + 19, f"p ÷ q = {r:.1f}", "sub2"))
            b.append(cell(XS, y, kp * W, 28, "m", label="keep"))
            if kp < 1:
                b.append(cell(XS + kp * W, y, (1 - kp) * W, 28, "h", label="reject"))
            if u is None:
                b.append(txt(XS + 4, y - 10, "1 or above: kept, no draw needed", "sub2"))
                verdicts.append("kept")
            else:
                xu = XS + u * W
                b.append(ln(xu, y - 8, xu, y - 1, "tick"))
                b.append(txt(xu, y - 15, f"dart {u:.2f}", "sub2", "middle"))
                verdicts.append("kept" if u < kp else "rejected")
            v = verdicts[-1]
            b.append(txt(XS + W + 16, y + 19, "kept" if v == "kept" else "rejected: replaced, stop", "sub2"))
        else:
            b.append(ghost(XS, y, W, 28, label="never checked"))
            b.append(txt(XS + W + 16, y + 19, "written after guess 3", "sub2"))
    assert verdicts == ["kept", "kept", "rejected"]
    tokens = verdicts.index("rejected") + 1
    assert tokens == 3
    yr = 100 + 5 * 60 + 4
    b.append(txt(40, yr + 19, "this pass yields", "cap"))
    b.append(cell(XS, yr, 82, 28, "m", label="guess 1"))
    b.append(cell(XS + 88, yr, 82, 28, "m", label="guess 2"))
    b.append(cell(XS + 176, yr, 84, 28, "u", label="replacement"))
    b.append(txt(XS + W + 16, yr + 19, f"{tokens} tokens", "sub2"))
    body, yb = prose(yr + 76, [
        "For each guess the target computes p ÷ q. At 1 or above the guess is kept without a draw. "
        "Below 1, a random number between 0 and 1 is drawn, like the dart of {{fig:v08-o005}}, and "
        "the guess is kept if it lands below p ÷ q: a chance of exactly p ÷ q.",
        "Guess 2 survives, since 0.35 is below 0.8. Guess 3 does not: 0.62 is above 0.5. It is "
        "replaced from the leftover, and guesses 4 and 5 are discarded unchecked, because they were "
        "written after a token that is no longer there.",
        "Had all five survived, the target's output at the fifth guess would already hold a full "
        "distribution for the next slot, and a sixth token would be drawn from it at no extra cost.",
    ])
    emit("a06", at("It works through the drafted tokens one at a time"),
         "Five guesses, checked left to right, stopping at the first rejection", yb + 30, b + [body],
         "Kept guesses always form an unbroken run from the left, so their chances multiply: that is "
         "where Part 4 starts. The ratios and darts here are illustrative.")


# ---- a07 · C3: min(1, p/q) ------------------------------------------------------------------------
def a07():
    b = [hd(40, 46, "Fig 05's target against a drafter that overrates ‘dog’")]
    XB, S = 230, 150                         # the ratio bar: 150 px per unit
    heads = [(40, "token"), (110, "p"), (160, "q"), (XB, "p ÷ q, to scale; amber is the chance of keeping")]
    for x, h in heads:
        b.append(txt(x, 78, h, "sub2"))
    for k, t in enumerate(TOK):
        y = 90 + k * 42
        b.append(txt(40, y + 19, t, "cap"))
        b.append(txt(110, y + 19, f"{P[k]:.1f}", "sub2"))
        b.append(txt(160, y + 19, f"{Q[k]:.1f}", "sub2"))
        r = RATIO[k]
        b.append(cell(XB, y, min(1, r) * S, 28, "m", label=f"kept {min(1, r):g}"))
        if r > 1:
            b.append(ghost(XB + S, y, (r - 1) * S, 28, label=f"{r:g}, capped at 1"))
    ya = 90 + 3 * 42 + 4
    b.append(ln(XB, ya, XB + 2.5 * S, ya, "axis"))
    for v in (0, 1, 2):
        b.append(ln(XB + v * S, ya, XB + v * S, ya + 5, "tick"))
        b.append(txt(XB + v * S, ya + 19, f"{v}", "sub2", "middle"))
    b.append(txt(XB, ya + 52, "kept with probability  min(1, p ÷ q)", "sub2"))
    body, yb = prose(ya + 98, [
        "Divide the target's probability by the drafter's. For dog that is 0.3 ÷ 0.6 = 0.5: the "
        "drafter said 60%, the target 30%, so a proposed ‘dog’ is kept half the time.",
        "For cat the ratio is 2.5: the target likes cat more than the drafter did. A chance cannot "
        "exceed 1, so the ratio is capped there and cat is always kept. Rest has the same probability "
        "in both, a ratio of exactly 1, and is always kept too.",
        "As one formula: kept with probability min(1, p ÷ q), where min means the smaller of the two.",
    ])
    emit("a07", at("When the large model's probability is at least as high"),
         "The chance of keeping a guess is p over q, capped at one", yb + 30, b + [body],
         "One division and one cap. Only dog, the token the drafter overrates, is ever rejected; the "
         "next figures show why always keeping the underrated ones is not a bias.")


# ---- a08 · C4: kept = min(p, q), and alpha ---------------------------------------------------------
def a08():
    b = [hd(40, 46, "How often each token is proposed, split into kept and rejected, to scale")]
    X0, S = 150, 400
    for k, t in enumerate(TOK):
        y = 66 + k * 42
        b.append(txt(40, y + 19, t, "cap"))
        b.append(cell(X0, y, KEPT[k] * S, 28, "m", label=f"kept {KEPT[k]:.1f}"))
        rej = Q[k] - KEPT[k]
        if rej > 1e-12:
            b.append(cell(X0 + KEPT[k] * S, y, rej * S, 28, "h", label=f"rejected {rej:.1f}"))
        b.append(txt(X0 + Q[k] * S + 10, y + 19, f"proposed {Q[k]:.1f}", "sub2"))
    y = 66 + 3 * 42 + 22
    b.append(txt(40, y + 19, "all guesses", "cap"))
    b.append(cell(X0, y, ALPHA * S, 28, "m", label=f"kept: α = {ALPHA:.1f}"))
    b.append(cell(X0 + ALPHA * S, y, (1 - ALPHA) * S, 28, "h", label=f"{1 - ALPHA:.1f}"))
    b.append(txt(X0, y + 52, "dog: 0.6 × min(1, 0.5) = 0.3, the smaller of p = 0.3 and q = 0.6", "sub2"))
    body, yb = prose(y + 98, [
        "A token is kept if the drafter proposes it and the test keeps it, so multiply the two "
        "chances: q × min(1, p ÷ q). When q is the larger, that is q × p ÷ q = p; when p is the "
        "larger, it is q × 1 = q. Either way it is the smaller of the two, min(p, q).",
        "Add the kept parts over every token and you have the acceptance rate, written α: 0.2 + 0.3 + "
        "0.2 = 0.7, so seven guesses in ten survive. All of the rejected 0.3 comes from dog, the only "
        "token the drafter proposes more often than the target would write it.",
        f"Simulated {fc(MC_N)} times with these numbers, {MC_ACC / MC_N * 100:.1f}% of guesses were kept.",
    ])
    emit("a08", at("60% and the target rated at 30%"),
         "Proposed and kept: the smaller of p and q", yb + 30, b + [body],
         "α is the overlap of the two distributions, the share they have in common. A drafter "
         "identical to the target would overlap completely, α = 1, and never be rejected.")


# ---- a09 · C5: the leftover --------------------------------------------------------------------------
def a09():
    b = [hd(40, 46, "Subtract, clip at zero, rescale to add to 1")]
    Z, S1 = 230, 250                          # p − q: zero at x=230, 250 px per unit
    X2, S2 = 370, 250                         # clipped
    X3, S3 = 500, 130                         # rescaled
    for x, h in [(150, "p − q"), (X2, "clip at zero"), (X3, "rescale")]:
        b.append(txt(x, 78, h, "sub2"))
    for k, t in enumerate(TOK):
        y = 90 + k * 42
        d = P[k] - Q[k]
        b.append(txt(40, y + 19, t, "cap"))
        if abs(d) < 1e-12:
            b.append(txt(Z + 8, y + 19, "0", "sub2"))
        elif d > 0:
            b.append(cell(Z, y, d * S1, 28, "u", label=f"+{d:.1f}"))
        else:
            b.append(cell(Z + d * S1, y, -d * S1, 28, "h", label=f"−{-d:.1f}"))
        if LEFT[k] > 1e-12:
            b.append(cell(X2, y, LEFT[k] * S2, 28, "u", label=f"{LEFT[k]:.1f}"))
        else:
            b.append(txt(X2 + 4, y + 19, "0", "sub2"))
        if SHARE[k] > 1e-12:
            b.append(cell(X3, y, SHARE[k] * S3, 28, "u", label=f"{SHARE[k]:.0f}"))
        else:
            b.append(txt(X3 + 4, y + 19, "0", "sub2"))
    ya = 90 + 3 * 42 + 2
    b.append(ln(Z, 86, Z, ya, "tick"))
    b.append(txt(Z, ya + 16, "0", "sub2", "middle"))
    b.append(txt(X2, ya + 16, f"total {L:.1f}", "sub2"))
    b.append(txt(X3, ya + 16, "total 1", "sub2"))
    body, yb = prose(ya + 62, [
        "Subtract the drafter's probability from the target's, token by token: +0.3 for cat, −0.3 "
        "for dog, 0 for rest. Clip the negatives to zero, so weight survives only where the target "
        "wanted a token more than the drafter did. Rescale so it adds to 1.",
        "Here the leftover is all cat, so every rejection is replaced by ‘cat’. That is the point: "
        "the drafter proposes cat 0.2 of the time where the target wants 0.5, and the replacements "
        "are how the missing 0.3 gets made up.",
        "Before rescaling, the leftover adds to 0.3, exactly the rejected share 1 − α. Both "
        "distributions add to 1, so whatever the drafter overrates on some tokens it underrates by "
        "the same total on others.",
    ])
    emit("a09", at("samples the replacement from the difference"),
         "The replacement is drawn only from what the drafter left short", yb + 30, b + [body],
         "What the drafter took too much of on one token, it owes on another. The rejections take "
         "back the excess, and the replacements pay the debt.")


# ---- a10 · C6: kept + replaced = p -----------------------------------------------------------------
def a10():
    b = [hd(40, 46, "What one guess produces, per token, inside the outline of the target's p")]
    X0, S = 150, 400
    for k, t in enumerate(TOK):
        y = 66 + k * 42
        b.append(txt(40, y + 19, t, "cap"))
        b.append(ghost(X0, y, P[k] * S, 28))
        b.append(cell(X0, y, KEPT[k] * S, 28, "m", label=f"kept {KEPT[k]:.1f}"))
        rep = L * SHARE[k]
        if rep > 1e-12:
            b.append(cell(X0 + KEPT[k] * S, y, rep * S, 28, "u", label=f"replaced {rep:.1f}"))
        b.append(txt(X0 + P[k] * S + 10, y + 19, f"= {OUTD[k]:.1f} = p", "sub2"))
    y1 = 66 + 3 * 42 + 26
    b.append(hd(40, y1, "Drop either half and dog drifts"))
    CW, XC = 70, 300
    for k, t in enumerate(TOK):
        b.append(txt(XC + k * (CW + 10) + CW / 2, y1 + 28, t, "sub2", "middle"))
    rows = [("both halves, the rule", OUTD, "m"), ("replace a rejection from p", CF_P, "h"),
            ("drop rejections instead", CF_DROP, "h")]
    for r, (lab, v, c) in enumerate(rows):
        y = y1 + 38 + r * 36
        b.append(txt(40, y + 17, lab, "cap"))
        for k in range(3):
            ok = abs(v[k] - P[k]) < 1e-9
            b.append(cell(XC + k * (CW + 10), y, CW, 26, "u" if ok else c, label=f"{v[k]:.2f}"))
    b.append(txt(XC + 3 * (CW + 10) + 4, y1 + 38 + 17, "= p", "sub2"))
    mc = [c / MC_N for c in MC_CNT]
    body, yb = prose(y1 + 38 + 3 * 36 + 40, [
        "Cat is kept 0.2 of the time and arrives as a replacement the other 0.3: 0.5 in all. Dog is "
        "kept 0.3 and never arrives as a replacement: 0.3. Rest is kept 0.2: 0.2. Token for token, "
        f"the target's distribution. Simulated {fc(MC_N)} times: {mc[0]:.3f}, {mc[1]:.3f}, {mc[2]:.3f}.",
        "It holds for any p and q, in one line. Kept is min(p, q). The replacement adds back "
        "max(0, p − q): how far p exceeds q, or nothing. If p is the smaller, that is p + 0; if q is "
        "the smaller, q + (p − q). Both are p.",
        "Replace a rejection from p itself and dog comes out 0.39; drop rejections and it comes out "
        "0.43. Only the two halves together give back p.",
    ])
    emit("a10", at("Accepting covers the probability the two models already agreed on"),
         "0.2 kept plus 0.3 replaced is cat's 0.5: the target, rebuilt", yb + 30, b + [body],
         "The proof fits in a line and needs both halves. Like the kernel changes of "
         "{{ref:v03-o099}}, the result can be switched on without retesting what the model says.")


# ---- a11 · C7: temperature zero -------------------------------------------------------------------
def a11():
    PG = [1.0, 0.0, 0.0]                      # temperature zero: all of p on the top token
    kept, alpha, left, Lg, share, out = rule(PG, Q)
    keep = [min(1, a / b) for a, b in zip(PG, Q)]
    assert keep == [1, 0, 0] and share == [1, 0, 0] and out == PG and abs(alpha - Q[0]) < 1e-12
    b = [hd(40, 46, "At temperature zero all of p sits on the target's top choice")]
    cols = [(40, "token"), (120, "p"), (170, "q"), (230, "min(1, p ÷ q)"), (400, "leftover, rescaled")]
    for x, h in cols:
        b.append(txt(x, 78, h, "sub2"))
    for k, t in enumerate(TOK):
        y = 90 + k * 40
        b.append(txt(40, y + 18, t, "cap"))
        b.append(txt(120, y + 18, f"{PG[k]:g}", "sub2"))
        b.append(txt(170, y + 18, f"{Q[k]:.1f}", "sub2"))
        b.append(cell(230, y, 140, 26, "m" if keep[k] else "h",
                      label="1: always kept" if keep[k] else "0: always rejected"))
        b.append(cell(400, y, 120, 26, "u", label=f"{share[k]:g}") if share[k] else txt(404, y + 18, "0", "sub2"))
    body, yb = prose(240, [
        "At temperature zero the target always writes its single most likely token, so all of p sits "
        "on that token: 1 for cat, 0 for everything else. ({{fig:v07-o021}} shows how temperature "
        "reshapes a distribution.)",
        "Then p ÷ q is 1 ÷ 0.2, capped to 1, for cat, and 0 for any other token: a guess survives "
        "exactly when it is the target's choice. The leftover is all cat, so a rejected guess is "
        "replaced by the target's choice. That is the greedy check of {{fig:v08-a04}}, and the text "
        "is word for word what the target would write alone.",
        "At any other setting, p and q are the two models' distributions after the sampler has "
        "reshaped them; the 2022 paper states the rule for those.",
    ])
    emit("a11", at("exactly the same distribution as tokens sampled from the target alone"),
         "At temperature zero, the rule becomes ‘keep the guesses the target agrees with’", yb + 30,
         b + [body],
         "Greedy checking is not a separate method, only this rule with all of p on one token. "
         "Exact means the same distribution when sampling, and the same text when greedy.")


# ---- a12 · C9: three drafters ---------------------------------------------------------------------
DRAFTERS = [("good", [0.45, 0.35, 0.2]), ("middling", Q), ("bad", [0.05, 0.9, 0.05])]


def a12():
    res = [(name, q, rule(P, q)) for name, q in DRAFTERS]
    alphas = [r[1] for _, _, r in res]
    assert [round(a, 2) for a in alphas] == [0.95, 0.7, 0.4]
    assert all(all(abs(o - p) < 1e-12 for o, p in zip(r[5], P)) for _, _, r in res)
    ratio_rej = (1 - alphas[2]) / (1 - alphas[0])
    assert round(ratio_rej) == 12
    b = [hd(40, 46, "Three drafters for Fig 05's target")]
    XA, WA, XO, WO = 250, 180, 460, 170
    b.append(txt(110, 78, "q: cat · dog · rest", "sub2"))
    b.append(txt(XA, 78, "guesses kept", "sub2"))
    b.append(txt(XO, 78, "what comes out", "sub2"))
    for r, (name, q, (kept, alpha, left, Lx, share, out)) in enumerate(res):
        y = 90 + r * 44
        b.append(txt(40, y + 19, name, "cap"))
        b.append(txt(110, y + 19, " · ".join(f"{v:.2f}" for v in q), "sub2"))
        b.append(cell(XA, y, alpha * WA, 28, "m", label=f"α = {alpha:.2f}"))
        b.append(cell(XA + alpha * WA, y, (1 - alpha) * WA, 28, "h"))
        b.append(segbar(XO, y, WO, 28, out, "u"))
    yl = 90 + 3 * 44 + 6
    b.append(txt(XO, yl + 10, "cat 0.5 · dog 0.3 · rest 0.2 in every row", "sub2"))
    body, yb = prose(yl + 56, [
        "Three drafters for the same target, from close to far off. The share of guesses kept falls "
        f"from {alphas[0]:.2f} to {alphas[1]:.2f} to {alphas[2]:.2f}: the bad drafter is rejected "
        f"{ratio_rej:.0f} times as often as the good one, so each pass yields fewer tokens.",
        "The output column does not change. Every rejection is replaced from the leftover, and kept "
        "plus replaced is p whatever q is, as {{fig:v08-a10}} showed. What a bad drafter costs is "
        "time, never correctness.",
    ])
    emit("a12", at("Nothing in that argument depends on the drafter being good"),
         "A bad drafter is slower, never wrong", yb + 30, b + [body],
         "Drafter quality buys speed and nothing else. That is what lets Part 5 swap the drafter for "
         "something cheaper without touching correctness.")


# ---- a13 · C8: the widget ---------------------------------------------------------------------------
W_N, W_SEED = 10_000, 8
XQ, SQ, XO2, SO = 110, 200, 400, 200


def widget_state(w, seed):
    """What the widget shows for drafter weights w and a sampling seed: q, the rule, a sample."""
    t = sum(w)
    q = [v / t for v in w] if t > 0 else [1 / 3] * 3
    kept, alpha, left, Lx, share, out = rule(P, q)
    cnt, acc = sample(P, q, W_N, seed)
    return q, kept, alpha, Lx, share, out, cnt, acc


WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const P = __P__, W0 = __W0__, SEED0 = __SEED__, N = __N__;
  const XQ = __XQ__, SQ = __SQ__, XO = __XO__, SO = __SO__;
  __MULBERRY__
  __FMT__
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q$ = s => fig.querySelector(s), btn = [...fig.querySelectorAll('button')];
  let seed = SEED0;
  const pick = (d, u) => { let c = 0; for (let i = 0; i < d.length; i++) { c += d[i]; if (u < c) return i; }
    for (let i = d.length - 1; i >= 0; i--) if (d[i] > 0) return i; };
  function draw() {
    const w = sl.map(s => +s.value), t = w.reduce((a, b) => a + b, 0);
    const q = t > 0 ? w.map(v => v / t) : [1 / 3, 1 / 3, 1 / 3];
    const kept = P.map((p, i) => Math.min(p, q[i])), alpha = kept.reduce((a, b) => a + b, 0);
    const left = P.map((p, i) => Math.max(0, p - q[i])), L = left.reduce((a, b) => a + b, 0);
    const share = L > 1e-12 ? left.map(v => v / L) : [0, 0, 0];
    q.forEach((v, i) => val[i].textContent = 'q ' + fmt(v));
    for (let i = 0; i < 3; i++) {
      const k = q$(`[data-k="${i}"]`), r = q$(`[data-r="${i}"]`), rep = q$(`[data-o="${i}"]`);
      k.setAttribute('width', Math.max(kept[i] * SQ, 0).toFixed(2));
      r.setAttribute('x', (XQ + kept[i] * SQ).toFixed(2));
      r.setAttribute('width', Math.max((q[i] - kept[i]) * SQ, 0).toFixed(2));
      q$(`[data-qt="${i}"]`).setAttribute('x', (XQ + q[i] * SQ + 8).toFixed(2));
      q$(`[data-qt="${i}"]`).textContent = 'q ' + fmt(q[i]);
      q$(`[data-ok="${i}"]`).setAttribute('width', Math.max(kept[i] * SO, 0).toFixed(2));
      rep.setAttribute('x', (XO + kept[i] * SO).toFixed(2));
      rep.setAttribute('width', Math.max(L * share[i] * SO, 0).toFixed(2));
      q$(`[data-ot="${i}"]`).textContent = fmt(kept[i]) + ' kept + ' + fmt(L * share[i]) + ' replaced';
    }
    q$('[data-sum]').textContent = 'kept: α = ' + fmt(alpha) + ' of guesses; a rejection becomes cat ' +
      fmt(share[0]) + ' · dog ' + fmt(share[1]) + ' · rest ' + fmt(share[2]);
    const rnd = mulberry32(seed), cnt = [0, 0, 0]; let acc = 0;
    for (let n = 0; n < N; n++) {
      const x = pick(q, rnd());
      if (rnd() < Math.min(1, P[x] / q[x])) { acc++; cnt[x]++; }
      else cnt[pick(L > 1e-12 ? share : P, rnd())]++;
    }
    for (let i = 0; i < 3; i++) {
      q$(`[data-h="${i}"]`).setAttribute('width', (cnt[i] / N * SO).toFixed(2));
      q$(`[data-ht="${i}"]`).textContent = fmtc(cnt[i]);
      q$(`[data-ht="${i}"]`).setAttribute('x', (XO + Math.max(P[i], cnt[i] / N) * SO + 10).toFixed(2));
    }
    q$('[data-acc]').textContent = fmtc(acc) + ' of ' + fmtc(N) + ' guesses kept (' + fmt(acc / N * 100, 1) + '%)';
  }
  sl.forEach(s => s.addEventListener('input', draw));
  btn[0].addEventListener('click', () => { seed += 1; draw(); });
  btn[1].addEventListener('click', () => { sl.forEach((s, i) => s.value = W0[i]); seed = SEED0; draw(); });
  draw();
})();</script>"""


def a13():
    w0 = list(Q)
    q, kept, alpha, Lx, share, out, cnt, acc = widget_state(w0, W_SEED)
    assert q == Q
    s = [hd(40, 34, "Fig 05's target is fixed; the drafter is yours to move")]
    s.append(txt(XQ, 60, "drafter's q: kept and rejected", "sub2"))
    s.append(txt(XO2, 60, "what comes out, inside p's outline", "sub2"))
    for i, t in enumerate(TOK):
        y = 70 + i * 52
        s.append(txt(40, y + 18, t, "cap"))
        s.append(f'<g class="m"><rect x="{XQ}" y="{y}" width="{kept[i] * SQ:.2f}" height="26" rx="2" data-k="{i}"/></g>')
        s.append(f'<g class="h"><rect x="{XQ + kept[i] * SQ:.2f}" y="{y}" width="{(q[i] - kept[i]) * SQ:.2f}" height="26" rx="2" data-r="{i}"/></g>')
        s.append(f'<text class="sub2" x="{XQ + q[i] * SQ + 8:.2f}" y="{y + 17}" data-qt="{i}">q {f(q[i])}</text>')
        s.append(ghost(XO2, y, P[i] * SO, 26))
        s.append(f'<g class="m"><rect x="{XO2}" y="{y}" width="{kept[i] * SO:.2f}" height="26" rx="2" data-ok="{i}"/></g>')
        s.append(f'<g class="u"><rect x="{XO2 + kept[i] * SO:.2f}" y="{y}" width="{Lx * share[i] * SO:.2f}" height="26" rx="2" data-o="{i}"/></g>')
        s.append(f'<text class="sub2" x="{XO2}" y="{y + 41}" data-ot="{i}">{f(kept[i])} kept + {f(Lx * share[i])} replaced</text>')
    ys = 70 + 3 * 52 + 14
    s.append(f'<text class="sub2" x="40" y="{ys}" data-sum="">kept: α = {f(alpha)} of guesses; a rejection becomes '
             f'cat {f(share[0])} · dog {f(share[1])} · rest {f(share[2])}</text>')
    yh = ys + 40
    s.append(hd(40, yh, f"{W_N:,} guesses, actually run through the rule"))
    for i, t in enumerate(TOK):
        y = yh + 16 + i * 34
        s.append(txt(40, y + 16, t, "cap"))
        s.append(ghost(XO2, y, P[i] * SO, 22))
        s.append(f'<g class="u"><rect x="{XO2}" y="{y}" width="{cnt[i] / W_N * SO:.2f}" height="22" rx="2" data-h="{i}"/></g>')
        s.append(f'<text class="sub2" x="{XO2 + max(P[i], cnt[i] / W_N) * SO + 10:.2f}" y="{y + 16}" data-ht="{i}">{fc(cnt[i])}</text>')
    ya = yh + 16 + 3 * 34 + 12
    s.append(f'<text class="sub2" x="{XO2}" y="{ya}" data-acc="">{fc(acc)} of {fc(W_N)} guesses kept '
             f'({f(acc / W_N * 100, 1)}%)</text>')
    body, yb = prose(ya + 44, [
        "Each slider sets the drafter's weight on one token, and the three are scaled to add to 1. "
        "Move them and the left column changes: the overlap α shrinks as the drafter drifts from the "
        "target, and the leftover moves to whichever tokens the drafter now underrates.",
        "The right column does not move: kept plus replaced always fills p's outline. The counts are "
        "a real sample, 10,000 guesses proposed, tested and replaced by the rule, and they land on "
        "0.5, 0.3 and 0.2 within sampling noise. The arithmetic was checked against the same rule in "
        "Python.",
    ])
    ctl = "".join(
        f"<label>{t} <input type='range' min='0' max='1' step='0.05' value='{w0[i]:g}'>"
        f"<span class='val'>q {f(q[i])}</span></label>" for i, t in enumerate(TOK))
    btns = "<button type='button'>Sample again</button><button type='button'>Reset</button>"
    js = (WIDGET_JS.replace("__P__", json.dumps(P)).replace("__W0__", json.dumps(w0))
          .replace("__SEED__", str(W_SEED)).replace("__N__", str(W_N))
          .replace("__XQ__", str(XQ)).replace("__SQ__", str(SQ)).replace("__XO__", str(XO2))
          .replace("__SO__", str(SO)).replace("__MULBERRY__", MULBERRY_JS).replace("__FMT__", FMT_JS))
    widget("a13", at("A bad drafter simply gets rejected more often"),
           "Drag the drafter; the output does not move", [ctl, btns], yb + 26, s + [body],
           "Any drafter, any distance from the target: the output stays on p. Only the share of "
           "guesses kept moves, and with it the speed.", js)


# ---- o007: the measurements --------------------------------------------------------------------------
def o007():
    b = [hd(40, 46, "Speed-ups the two original papers measured, drawn to scale")]
    X1, S = 230, 120                          # 1× at x=230, 120 px per ×
    sx = lambda v: X1 + (v - 1) * S
    rows = [("2022 paper, T5-XXL (11B)", 2, 3, "2–3×, identical outputs"),
            ("DeepMind, Chinchilla (70B)", 2, 2.5, "2–2.5×")]
    for k, (lab, lo, hi, note) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(cell(sx(1), y, sx(lo) - sx(1), 28, "u"))
        b.append(cell(sx(lo), y, sx(hi) - sx(lo), 28, "m", label=note if k else "2–3×"))
        if not k:
            b.append(txt(sx(hi) + 10, y + 19, "identical outputs", "sub2"))
        else:
            b.append(txt(sx(hi) + 10, y + 19, "same distribution", "sub2"))
    ya = 70 + 2 * 46
    b.append(ln(sx(1), ya, sx(4), ya, "axis"))
    for v in (1, 2, 3, 4):
        b.append(ln(sx(v), ya, sx(v), ya + 5, "tick"))
        b.append(txt(sx(v), ya + 19, f"{v}×", "sub2", "middle"))
    b.append(txt(sx(1), ya + 44, "each bar starts at 1×, no speed-up; amber spans the reported range", "sub2"))
    body, yb = prose(ya + 92, [
        "The 2022 paper measured two to three times faster decoding on T5-XXL, an 11-billion-parameter "
        "model, with outputs identical to the target's own. A second paper, from DeepMind, derived the "
        "same rule independently and reported two to two and a half times on Chinchilla, a "
        "70-billion-parameter model.",
        "DeepMind checked the distribution, and it held to within hardware numerics: the only "
        "differences were the tiny rounding differences that come from doing the same arithmetic in "
        "a different order.",
        "Later methods loosen this rule to get more guesses accepted, and they give up the guarantee "
        "when they do.",
    ])
    emit("o007", at("The 2022 paper measured a speed up"),
         "Measured: two to three times faster, with the output unchanged", yb + 30, b + [body],
         "The strongest property in the whole series: a speed-up that is provably free of quality "
         "cost. Keep track of which later methods still have it.")


if __name__ == "__main__":
    for fn in (o005, a05, o006, a06, a07, a08, a09, a10, a11, a12, a13, o007):
        fn()
