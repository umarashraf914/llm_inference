"""V8 Part 4: from acceptance rate to speed-up, and the ceiling (review §4 D1–D5; §5 P9, P21, P24).

  python3 figures/V08/src/spec_speedup.py     writes items a14–a18, o008 and o009

o008     regenerated: three tokens for 147 GB against 420; tokens per pass defined (fixes P9)
a14  D1  The k-th guess counts only if it and every guess before it survive
a15  D2  Tokens per pass: 1 + 0.7 + 0.49 + 0.34 + 0.24 + 0.17 = 2.94
a16  D3  Summing the series without adding it up: multiply by α and subtract
a17  D4  Longer drafts stop paying: tokens per pass never pass 1 ÷ (1 − α)
a18  D4  widget: choose α, the draft length and the drafter's cost
o009 D5  the ceiling, rebuilt as time per pass against positions per pass (P21, P24)
"""
import json, math
from spec_common import (cell, ghost, txt, hd, ln, arr, box, prose, emit, at, bar, f, fc, widget,
                         mulberry32, FMT_JS, BYTES, T_READ, T_POS, RIDGE, DRAFT_BYTES)

ALPHA, GAMMA = 0.7, 5
C_BYTES = DRAFT_BYTES / BYTES                     # the drafter's cost per pass, by bytes: 0.01


def powk(a, k):
    """a to the power k by repeated multiplication, exactly as the widget's JavaScript does it."""
    p = 1.0
    for _ in range(k):
        p *= a
    return p


def tokens(a, g):
    """Expected tokens per pass with g guesses each kept with chance a: 1 + a + ... + a^g."""
    return (1 - powk(a, g + 1)) / (1 - a)


def speedup(a, g, c):
    return tokens(a, g) / (1 + g * c)


E5 = tokens(ALPHA, GAMMA)
TERMS = [powk(ALPHA, k) for k in range(GAMMA + 1)]
assert abs(sum(TERMS) - E5) < 1e-12 and round(E5, 3) == 2.941 and round(E5 / 1.05, 2) == 2.80
assert round(3 / 1.05, 2) == 2.86 and round(420 / 147, 2) == 2.86 and round(C_BYTES, 10) == 0.01
lo, hi = 0.6, 0.8                                   # the acceptance rate that gives exactly 3 tokens
for _ in range(60):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if tokens(mid, GAMMA) < 3 else (lo, mid)
A3 = lo
assert round(A3, 3) == 0.709
_r, _tot = mulberry32(5), 0                        # simulate passes: guesses kept independently at 0.7
for _ in range(1_000_000):
    k = 0
    while k < GAMMA and _r() < ALPHA:
        k += 1
    _tot += k + 1
MC_TOK = _tot / 1_000_000
assert abs(MC_TOK - E5) < 0.005


# ---- o008: the arithmetic of the win, with tokens per pass defined ----------------------------------
def o008():
    b = [hd(40, 46, "Three tokens, two ways, by bytes read")]
    X0, W = 240, 380
    SC = W / 420
    b.append(txt(40, 92, "ordinary decode", "cap"))
    b.append(cell(X0, 76, 420 * SC, 32, "h", label="3 passes × 140 GB = 420 GB"))
    b.append(txt(40, 152, "one speculative step", "cap"))
    b.append(cell(X0, 136, 147 * SC, 32, "m", label="147 GB"))
    b.append(txt(X0 + 147 * SC + 14, 157, "140 for the target, 7 for the drafter", "sub2"))
    b.append(box(190, 196, 300, 42, "u", f"420 ÷ 147 = {420 / 147:.2f}"))
    body, yb = prose(286, [
        "Ordinary decode makes three tokens with three trips through the target, each reading all "
        "140 GB: 420 GB. One speculative step makes the same three with a single read of 140 GB, plus "
        "the 7 GB the drafter moved for its five guesses: 147 GB. That is a factor of just under three.",
        "So the speed-up follows the tokens each pass yields. Three tokens a pass means two guesses "
        "survived on average, plus the one token the target always adds: the replacement after a "
        "rejection, or the free sixth token when all five survive. Papers on later methods report "
        "this tokens-per-pass figure as the average acceptance length; counted as surviving guesses "
        "alone, it would be one less.",
        "The real speed-up always lands a little under the tokens per pass, because the drafter adds "
        "its 7 GB to every weight read.",
    ])
    emit("o008", at("that is where the speed up comes from"),
         "Three tokens for one read of the weights: a factor of 2.86", yb + 30, b + [body],
         "Tokens per pass is the number to raise, and every method after this one is an attempt to "
         "raise it.")


# ---- a14 · D1: alpha to the k ---------------------------------------------------------------------
def a14():
    b = [hd(40, 46, "If each guess survives with chance 0.7, independently of the others")]
    X0, S = 150, 420
    labels = ["0.7", "0.7 × 0.7 = 0.49", "0.7³ = 0.343", "0.7⁴ = 0.240", "0.7⁵ = 0.168"]
    for k in range(1, GAMMA + 1):
        y = 66 + (k - 1) * 40
        v = TERMS[k]
        assert labels[k - 1].endswith(f"{v:.3f}".rstrip("0").rstrip(".") if k < 3 else f"{v:.3f}")
        b.append(txt(40, y + 19, f"guess {k}", "cap"))
        b.append(cell(X0, y, v * S, 28, "m"))
        b.append(txt(X0 + v * S + 10, y + 19, labels[k - 1], "sub2"))
    ya = 66 + 5 * 40 + 2
    b.append(ln(X0, ya, X0 + S, ya, "axis"))
    for v in (0, 0.5, 1):
        b.append(ln(X0 + v * S, ya, X0 + v * S, ya + 5, "tick"))
        b.append(txt(X0 + v * S, ya + 19, f"{v:g}", "sub2", "middle"))
    b.append(txt(X0, ya + 44, "chance the guess is kept", "sub2"))
    body, yb = prose(ya + 90, [
        "Guesses are checked left to right and the first rejection ends the pass, so guess k is kept "
        "only if guesses 1 to k all pass. If each passes with chance α = 0.7, and one guess passing "
        "says nothing about the next, the chances multiply: 0.7 for the first, 0.7 × 0.7 = 0.49 for "
        "the second, 0.7³ = 0.343 for the third.",
        "Multiplying is the rule for independent events: two coins both land heads half of half the "
        "time, a quarter. Every extra guess multiplies by another 0.7, so the fifth survives only "
        "0.168 of the time.",
    ])
    emit("a14", at("So the speed up follows the acceptance length"),
         "The k-th guess counts only if it and every guess before it survive", yb + 30, b + [body],
         "Every guess kept independently, at one fixed rate, is the 2022 paper's simplifying "
         "assumption. Real text is easier in some stretches than others, so read these as averages.")


# ---- a15 · D2: the expected tokens per pass ----------------------------------------------------------
def a15():
    b = [hd(40, 46, "Expected tokens from one pass, each term to scale")]
    X0, S = 150, 150
    b.append(txt(40, 89, "α = 0.7", "cap"))
    xx = X0
    shown = ["1", "0.7", "0.49", "0.34", "0.24", "0.17"]
    for k, v in enumerate(TERMS):
        b.append(cell(xx, 70, v * S - 2, 30, "u" if k == 0 else "m",
                      label="the target's own" if k == 0 else None))
        b.append(txt(xx + v * S / 2 - 1, 120, shown[k], "sub2", "middle"))
        xx += v * S
    assert [f"{v:.2f}".rstrip("0").rstrip(".") if k else "1" for k, v in enumerate(TERMS)] == \
        ["1", "0.7", "0.49", "0.34", "0.24", "0.17"]
    b.append(txt(xx + 10, 89, f"= {E5:.2f}", "sub2"))
    b.append(txt(X0 + S + 4, 140, "guess 1 to guess 5: each one's chance of being kept", "sub2"))
    b.append(txt(40, 189, "α = 0.709", "cap"))
    b.append(ghost(X0, 170, 3 * S - 2, 30, label=f"{tokens(A3, GAMMA):.2f} tokens: the three of {{{{fig:v08-o008}}}}"))
    y3 = 246
    b.append(txt(40, y3, f"speed-up at α = 0.7: {E5:.2f} tokens ÷ 1.05 passes' worth of bytes = "
                         f"{E5 / 1.05:.2f}×", "sub2"))
    body, yb = prose(y3 + 46, [
        "A guess adds one token when it is kept and none when it is not, so on average it adds its "
        "chance of being kept. The expected tokens per pass is therefore the sum of those chances, "
        "plus the 1 the target always adds: 1 + 0.7 + 0.49 + 0.343 + 0.240 + 0.168 = 2.94.",
        "That is essentially the three tokens of {{fig:v08-o008}}: an acceptance rate of 0.709 gives "
        "exactly 3. Each step costs 1.05 passes' worth of bytes, the target's 140 GB and the "
        f"drafter's 7, so α = 0.7 gives {E5:.2f} ÷ 1.05 = {E5 / 1.05:.2f} times the tokens per byte read.",
        f"Simulated a million passes, each guess kept at random with chance 0.7: {MC_TOK:.2f} tokens "
        "a pass.",
    ])
    emit("a15", at("The average number of drafted tokens that survive"),
         "Tokens per pass: 1 + 0.7 + 0.49 + 0.34 + 0.24 + 0.17 = 2.94", yb + 30, b + [body],
         "The 1 is the target's own token, guaranteed; the other 1.94 is what the drafter earns. "
         "Raise α and only that part grows.")


# ---- a16 · D3: the geometric sum ----------------------------------------------------------------------
def a16():
    b = [hd(40, 46, "Shift the sum one place, line it up under itself, subtract")]
    X0, CW, PITCH = 150, 46, 62
    cx = lambda j: X0 + j * PITCH
    sup = ["", "", "²", "³", "⁴", "⁵", "⁶"]
    term = lambda j: "1" if j == 0 else f"α{sup[j]}"
    rows = [("S =", range(0, 6), "u"), ("αS =", range(1, 7), "u")]
    for r, (lab, cols, c) in enumerate(rows):
        y = 70 + r * 44
        b.append(txt(40, y + 19, lab, "cap"))
        cols = list(cols)
        for i, j in enumerate(cols):
            b.append(cell(cx(j), y, CW, 28, c, label=term(j)))
            if i < len(cols) - 1:
                b.append(txt(cx(j) + CW + (PITCH - CW) / 2, y + 19, "+", "sub2", "middle"))
    y = 70 + 2 * 44 + 10
    b.append(ln(cx(0), y - 6, cx(6) + CW, y - 6, "tick"))
    b.append(txt(40, y + 19, "S − αS =", "cap"))
    for j in range(7):
        if j == 0:
            b.append(cell(cx(j), y, CW, 28, "m", label="1"))
        elif j < 6:
            b.append(ghost(cx(j), y, CW, 28, label="0"))
        else:
            b.append(cell(cx(j), y, CW, 28, "m", label="−α⁶"))
    S5 = sum(TERMS)
    a6 = powk(ALPHA, 6)
    assert abs((S5 - ALPHA * S5) - (1 - a6)) < 1e-12 and f"{a6:.6f}" == "0.117649"
    lines = ["S × (1 − α) = 1 − α⁶,  so  S = (1 − α⁶) ÷ (1 − α)",
             f"with α = 0.7:  S = (1 − {a6:.6f}) ÷ 0.3 = {1 - a6:.6f} ÷ 0.3 = {(1 - a6) / 0.3:.3f}"]
    for k, s in enumerate(lines):
        b.append(txt(150, y + 70 + k * 26, s, "sub2"))
    body, yb = prose(y + 70 + 26 + 50, [
        "Write S for the sum. Multiply every term by α and each moves one place along: 1 becomes α, "
        "α becomes α², and so on, with α⁶ falling off the end. Subtract the second row from the "
        "first: every term that appears in both cancels, leaving 1 − α⁶.",
        "So S × (1 − α) = 1 − α⁶, and dividing gives S = (1 − α⁶) ÷ (1 − α). With α = 0.7 that is "
        f"0.882351 ÷ 0.3 = {(1 - a6) / 0.3:.3f}, the same as adding the six terms one by one.",
        "With γ guesses instead of five the same subtraction leaves α to the power γ + 1 at the end, "
        "and S = (1 − α to the γ + 1) ÷ (1 − α): the formula the 2022 paper gives for the expected "
        "tokens per pass.",
    ])
    emit("a16", at("The real speed up always lands a little under"),
         "Summing the series without adding it up: multiply by α and subtract", yb + 30, b + [body],
         "The subtraction works for any number of terms, and it shows the limit at once: the leftover "
         "power of α shrinks toward zero as drafts grow, so S can never pass 1 ÷ (1 − α).")


# ---- a17 · D4: diminishing returns, small multiples -------------------------------------------------
def a17():
    b = [hd(40, 46, "Tokens per pass against draft length γ = 1 to 10, all panels on one scale")]
    PW, PITCH, BW_, YS = 260, 26, 18, 11           # panel width, bar pitch, bar width, px per token
    panels = [(0.6, 60, 196), (0.7, 380, 196), (0.8, 60, 400), (0.9, 380, 400)]
    for a, x0, yb0 in panels:
        ceil_ = 1 / (1 - a)
        b.append(txt(x0, yb0 - 128, f"α = {a:g}", "hd"))
        for g in range(1, 11):
            e = tokens(a, g)
            assert e < ceil_
            x = x0 + (g - 1) * PITCH
            b.append(cell(x, yb0 - e * YS, BW_, e * YS, "m" if g == GAMMA else "u", rx=1.5))
        yc = yb0 - ceil_ * YS
        b.append(ln(x0, yc, x0 + PW - 8, yc, "mark"))
        b.append(txt(x0 + PW - 8, yc - 6, f"ceiling {ceil_:.2f}".rstrip("0").rstrip("."), "sub2", "end"))
        e5 = tokens(a, GAMMA)
        b.append(txt(x0 + (GAMMA - 1) * PITCH + BW_ / 2, yb0 + 16, f"{e5:.2f} at γ = 5", "sub2", "middle"))
        b.append(ln(x0, yb0, x0 + PW - 8, yb0, "axis"))
        b.append(txt(x0, yb0 + 16, "γ = 1", "sub2"))
        b.append(txt(x0 + PW - 8, yb0 + 16, "10", "sub2", "end"))
    gains = {a: tokens(a, 10) - tokens(a, 5) for a, _, _ in panels}
    assert round(gains[0.6], 2) == 0.11 and round(gains[0.9], 2) == 2.18
    body, yb = prose(452, [
        "Each extra guess adds its chance of surviving, α to the power of its place in the draft, and "
        "each such term is smaller than the one before. So the bars level off, and however long the "
        "draft, the total stays under 1 ÷ (1 − α): 2.5 tokens a pass at α = 0.6, 3.33 at 0.7, 5 at "
        "0.8 and 10 at 0.9.",
        "At five guesses the four drafters reach 2.38, 2.94, 3.69 and 4.69 tokens a pass (the 2022 "
        "paper's own table lists 3.69 for α = 0.8 and five guesses). Doubling the draft to ten adds "
        f"{gains[0.6]:.2f} tokens at α = 0.6 and {gains[0.9]:.2f} at α = 0.9.",
    ])
    emit("a17", at("The real speed up always lands a little under"),
         "Longer drafts stop paying: tokens per pass never pass 1 ÷ (1 − α)", yb + 30, b + [body],
         "Draft length is the cheap knob and acceptance rate the valuable one: at α = 0.7 no draft "
         "length gets past 3.33 tokens a pass.")


# ---- a18 · D4: the widget -----------------------------------------------------------------------------
WX, WPITCH, WBW, WYB, WYS = 110, 44, 30, 236, 16        # columns, baseline, px per token
GMAX = 12


def wstate(a, g, c):
    E = [tokens(a, k) for k in range(1, GMAX + 1)]
    S = [E[k - 1] / (1 + k * c) for k in range(1, GMAX + 1)]
    best = max(range(1, GMAX + 1), key=lambda k: S[k - 1])
    return E, S, best, 1 / (1 - a)


def wtext(a, g, c):
    E, S, best, ceil_ = wstate(a, g, c)
    l1 = (f"γ = {g}: {f(E[g - 1])} tokens a pass, for {f(1 + g * c)} passes' worth of time: "
          f"{f(S[g - 1])}× faster")
    l2 = f"ceiling 1 ÷ (1 − α) = {f(ceil_)} tokens; best draft length {best}, at {f(S[best - 1])}×"
    return l1, l2


W_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const X = __X__, PITCH = __P__, BW = __BW__, YB = __YB__, YS = __YS__, G = __G__, D0 = __D0__;
  __FMT__
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q$ = s => fig.querySelector(s);
  const powk = (a, k) => { let p = 1; for (let i = 0; i < k; i++) p *= a; return p; };
  const tokens = (a, g) => (1 - powk(a, g + 1)) / (1 - a);
  function draw() {
    const a = +sl[0].value, g = +sl[1].value, c = +sl[2].value;
    val[0].textContent = fmt(a); val[1].textContent = String(g); val[2].textContent = fmt(c, 3);
    const E = [], S = [];
    for (let k = 1; k <= G; k++) { E.push(tokens(a, k)); S.push(E[k - 1] / (1 + k * c)); }
    let best = 1; for (let k = 2; k <= G; k++) if (S[k - 1] > S[best - 1]) best = k;
    for (let k = 1; k <= G; k++) {
      const e = q$(`[data-e="${k}"]`), s = q$(`[data-s="${k}"]`);
      e.setAttribute('y', (YB - E[k - 1] * YS).toFixed(2)); e.setAttribute('height', (E[k - 1] * YS).toFixed(2));
      s.setAttribute('y', (YB - S[k - 1] * YS).toFixed(2)); s.setAttribute('height', (S[k - 1] * YS).toFixed(2));
      s.parentNode.setAttribute('class', k === g ? 'm' : 'u');
    }
    const ceil = 1 / (1 - a), yc = YB - ceil * YS, line = q$('[data-ceil]'), lab = q$('[data-ceilt]');
    line.setAttribute('y1', yc.toFixed(2)); line.setAttribute('y2', yc.toFixed(2));
    lab.setAttribute('y', (yc - 6).toFixed(2)); lab.textContent = 'ceiling ' + fmt(ceil);
    const bx = X + (best - 1) * PITCH + BW / 2, bl = q$('[data-best]');
    bl.setAttribute('x', bx.toFixed(2));
    q$('[data-l1]').textContent = 'γ = ' + g + ': ' + fmt(E[g - 1]) + ' tokens a pass, for ' + fmt(1 + g * c) +
      " passes' worth of time: " + fmt(S[g - 1]) + '× faster';
    q$('[data-l2]').textContent = 'ceiling 1 ÷ (1 − α) = ' + fmt(ceil) + ' tokens; best draft length ' + best +
      ', at ' + fmt(S[best - 1]) + '×';
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q$('button').addEventListener('click', () => { sl.forEach((s, i) => s.value = D0[i]); draw(); });
  draw();
})();</script>"""


def a18():
    a0, g0, c0 = ALPHA, GAMMA, 0.01
    E, S, best, ceil_ = wstate(a0, g0, c0)
    assert best == 9 and round(S[8], 2) == 2.97 and round(S[4], 2) == 2.80
    E2, S2, best2, _ = wstate(0.7, 5, 0.05)
    assert best2 == 6 and round(S2[5], 2) == 2.35 and abs(S2[5] - S2[4]) < 1e-5     # 5 and 6 all but tie
    s = [hd(40, 34, "Tokens per pass (outline) and speed-up (filled), for each draft length")]
    for v in (0, 2, 4, 6, 8, 10):
        y = WYB - v * WYS
        s.append(ln(WX - 14, y, WX - 8, y, "tick"))
        s.append(txt(WX - 18, y + 4, f"{v}", "sub2", "end"))
    for k in range(1, GMAX + 1):
        x = WX + (k - 1) * WPITCH
        s.append(f'<rect x="{x}" y="{WYB - E[k - 1] * WYS:.2f}" width="{WBW}" height="{E[k - 1] * WYS:.2f}" '
                 f'rx="2" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" data-e="{k}"/>')
        s.append(f'<g class="{"m" if k == g0 else "u"}"><rect x="{x}" y="{WYB - S[k - 1] * WYS:.2f}" width="{WBW}" '
                 f'height="{S[k - 1] * WYS:.2f}" rx="2" data-s="{k}"/></g>')
        s.append(txt(x + WBW / 2, WYB + 18, f"{k}", "sub2", "middle"))
    s.append(ln(WX - 8, WYB, WX + GMAX * WPITCH - 6, WYB, "axis"))
    yc = WYB - ceil_ * WYS
    xe = WX + GMAX * WPITCH - 6
    s.append(f'<line class="mark" x1="{WX - 8}" y1="{yc:.2f}" x2="{xe}" y2="{yc:.2f}" data-ceil=""/>')
    s.append(f'<text class="sub2" x="{xe}" y="{yc - 6:.2f}" text-anchor="end" data-ceilt="">ceiling {f(ceil_)}</text>')
    bx = WX + (best - 1) * WPITCH + WBW / 2
    s.append(f'<text class="sub2" x="{bx:.2f}" y="{WYB + 34}" text-anchor="middle" data-best="">best</text>')
    s.append(txt(WX, WYB + 56, "draft length γ: guesses per pass", "sub2"))
    l1, l2 = wtext(a0, g0, c0)
    s.append(f'<text class="sub2" x="40" y="{WYB + 88}" data-l1="">{l1}</text>')
    s.append(f'<text class="sub2" x="40" y="{WYB + 112}" data-l2="">{l2}</text>')
    body, yb = prose(WYB + 158, [
        "The outline is tokens per pass, 1 + α + … up to the draft length. The filled bar divides it "
        "by what the pass costs: one target pass plus γ drafter passes at c each, so 1 + γ × c. The "
        "drafter's cost c is 0.01 by bytes for a drafter 100 times smaller; the 2022 paper measured "
        "its drafters at under 0.05 of a pass in time.",
        "At α = 0.7 and c = 0.01 the best draft is 9 guesses, at 2.97×, barely ahead of 5 guesses' "
        "2.80×. At c = 0.05 the best is 6, at 2.35×. The arithmetic here was checked against Python "
        "over every setting of the sliders.",
    ])
    ctl = (f"<label>α <input type='range' min='0.05' max='0.9' step='0.05' value='{a0:g}'><span class='val'>{f(a0)}</span></label>"
           f"<label>γ <input type='range' min='1' max='{GMAX}' step='1' value='{g0}'><span class='val'>{g0}</span></label>"
           f"<label>c <input type='range' min='0' max='0.1' step='0.005' value='{c0:g}'><span class='val'>{f(c0, 3)}</span></label>")
    btn = "<button type='button'>Reset</button>"
    js = (W_JS.replace("__X__", str(WX)).replace("__P__", str(WPITCH)).replace("__BW__", str(WBW))
          .replace("__YB__", str(WYB)).replace("__YS__", str(WYS)).replace("__G__", str(GMAX))
          .replace("__D0__", json.dumps([a0, g0, c0])).replace("__FMT__", FMT_JS))
    widget("a18", at("The real speed up always lands a little under"),
           "Choose the acceptance rate, the draft length and the drafter's cost", [ctl, btn],
           yb + 26, s + [body],
           "With a cheap drafter the best draft is long but the gain past five guesses is small; a "
           "costlier drafter pulls the best length shorter. Only α moves the ceiling.", js)


# ---- o009 · D5: the ceiling, as time per pass ---------------------------------------------------------
def o009():
    b = [hd(40, 46, "Time for one pass of the target, against the positions in it, both axes logarithmic")]
    XL, XD, YB_, YD = 110, 150, 320, 70             # x: 1 at 110, 150 px a decade; y: 0.1 ms at 320, 70 px a decade
    lx = lambda n: XL + XD * math.log10(n)
    ly = lambda ms: YB_ - YD * math.log10(ms / 0.1)
    read = T_READ * 1e3
    pos = T_POS * 1e3
    b.append(ln(XL, YB_, lx(1000), YB_, "axis"))
    b.append(ln(XL, YB_, XL, ly(100), "axis"))
    for n in (1, 10, 100, 1000):
        b.append(ln(lx(n), YB_, lx(n), YB_ + 5, "tick"))
        b.append(txt(lx(n), YB_ + 19, f"{n:,}", "sub2", "middle"))
    for ms, lab in ((0.1, "0.1 ms"), (1, "1"), (10, "10"), (100, "100 ms")):
        b.append(ln(XL - 5, ly(ms), XL, ly(ms), "tick"))
        b.append(txt(XL - 9, ly(ms) + 4, lab, "sub2", "end"))
    b.append(txt(lx(1000), YB_ + 40, "positions in one pass", "sub2", "end"))
    nmax = 100 / pos                                   # where the arithmetic line leaves the chart
    b.append(f'<polyline class="pl-h" points="{XL},{ly(read):.1f} {lx(1000):.1f},{ly(read):.1f}"/>')
    b.append(f'<polyline class="pl-m" points="{XL},{ly(pos):.1f} {lx(nmax):.1f},{ly(100):.1f}"/>')
    b.append(ln(lx(RIDGE), ly(100), lx(RIDGE), YB_, "mark"))
    b.append(txt(lx(RIDGE) + 6, YB_ - 8, f"ridge, {RIDGE:.0f}", "sub2"))
    b.append(txt(XL + 8, ly(read) + 20, "reading the weights: 41.8 ms", "sub2"))
    b.append(txt(lx(3) + 6, ly(3 * pos) + 22, "arithmetic: 0.142 ms a position", "sub2"))
    pts = [(1, "1"), (6, "6"), (64, "64"), (384, "384")]
    for n, lab in pts:
        t = max(read, n * pos)
        b.append(f'<circle cx="{lx(n):.1f}" cy="{ly(t):.1f}" r="4" fill="var(--paper)" stroke="var(--h)" stroke-width="1.5"/>')
        b.append(f'<circle cx="{lx(n):.1f}" cy="{ly(n * pos):.1f}" r="3" fill="var(--m)"/>')
        b.append(txt(lx(n) + (8 if n == 1 else 0), ly(t) - 10, lab, "sub2", "start" if n == 1 else "middle"))
    times = {n: n * pos for n, _ in pts}
    assert [f"{times[n]:.2f}" for n in (1, 6, 64, 384)] == ["0.14", "0.85", "9.06", "54.36"]
    # the four cases, as a table under the chart
    yt = YB_ + 72
    heads = [(40, "positions in the pass"), (300, "arithmetic"), (400, "weight read"), (500, "the pass takes")]
    for x, h in heads:
        b.append(txt(x, yt, h, "sub2"))
    cases = [(1, "one request"), (6, "one request, five guesses"), (64, "64 requests"),
             (384, "64 requests, five guesses each")]
    for k, (n, who) in enumerate(cases):
        y = yt + 24 + k * 24
        t = max(read, n * pos)
        b.append(txt(40, y, f"{n}: {who}", "cap"))
        b.append(txt(300, y, f"{n * pos:.2f} ms", "sub2"))
        b.append(txt(400, y, f"{read:.1f} ms", "sub2"))
        b.append(txt(500, y, f"{t:.1f} ms" + (", past the ridge" if n * pos > read else ""), "sub2"))
    # the batch speed-ups, counting weights only
    def sp(B):
        base = max(read, B * pos)
        spec = max(read, (GAMMA + 1) * B * pos) + GAMMA * max(read * C_BYTES, B * pos * C_BYTES)
        return E5 * base / spec
    sps = {B: sp(B) for B in (1, 64, 128, 256)}
    assert [round(sps[B], 2) for B in (1, 64, 128, 256)] == [2.80, 2.18, 1.11, 0.56]
    body, yb = prose(yt + 24 + 4 * 24 + 40, [
        "A pass takes the longer of two times: reading the weights, 41.8 ms however many positions it "
        "carries, and the arithmetic, 0.142 ms per position. They are equal at 295 positions, the "
        "ridge ({{fig:v01-o126}}). Below it the read decides and extra positions are free; above it "
        "every position adds time.",
        "At batch one, five guesses take a pass from 1 position to 6, far below the ridge. A batch of "
        "64 already carries 64, and five guesses for every request make it 384: past the ridge, so "
        "the pass takes 54.4 ms instead of 41.8.",
        f"Counting weights alone, with α = 0.7 and the drafter's reads included, the speed-up is "
        f"{sps[1]:.2f}× at batch 1, {sps[64]:.2f}× at 64, {sps[128]:.2f}× at 128 and {sps[256]:.2f}× at "
        "256, a slowdown. Speculation helps most on a machine serving one user, and least on one "
        "already packed with requests.",
    ])
    emit("o009", at("One pass of the large model also has a ceiling"),
         "Verification is free until the positions in a pass cross the ridge", yb + 30, b + [body],
         "Weights only, so this explains the direction of EAGLE-3's fall from 6.5× to 1.38× in Part 5, "
         "not its size. Speculation and batching spend the same idle arithmetic, so a busy server has "
         "less of it to spend.")


if __name__ == "__main__":
    for fn in (o008, a14, a15, a16, a17, a18, o009):
        fn()
