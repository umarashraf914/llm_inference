"""V3 Part 7, online softmax, down to the algebra of rescaling a running sum: §5d merge 53+54, review #13-#16,
§5a item 6 (Fig 59's bit-exactness), and the widget.

One row of six scores in two tiles (common.ROW_X, ROW_V) is carried through every step:
  o053  the obstacle: every weight waits on two row-wide numbers (merges o054)
  o056  the two numbers carried per row (kept; restamped)
  p13   the 1.59, built from three scores (12:56)
  o057  every term folded in is too large by the same factor e²: the exponent law (rebuilt)
  p14   one multiplication repairs the sum: the distributive law (replaces o058)
  p15   the output takes the same factor, and one division at the end gives the answer (14:00)
  o055  the recurrence in four lines and a division (rebuilt)
  o059  exact, up to rounding: the row both ways (rebuilt)
  p16   widget: push a row through the tiles, with version 4's skipped rescale as a toggle

  python3 figures/V03/src/online.py
"""
import json
from common import *  # noqa: F401,F403

X1, X2 = ROW_X
V1, V2 = ROW_V
STEPS, ANSWER = online(ROW_X, ROW_V)
S1, S2 = STEPS
ALL_X, ALL_V = X1 + X2, V1 + V2
DIRECT = direct(ALL_X, ALL_V)
C = S2["c"]                                            # e^(3-5)
assert round(S1["l"], 2) == 1.59 and round(C, 3) == 0.135 and abs(ANSWER - DIRECT) < 1e-12
assert f(ANSWER, 2) == "39.18" and f(S1["O"], 2) == "24.05"


# ---- o053: the obstacle -----------------------------------------------------------------------------
def o053():
    nt = 64
    b = [hd(40, 46, "Every weight needs two numbers that depend on the whole row")]
    X0, W = 40, 600
    cw = W / nt
    for k in range(nt):
        b.append(cell(X0 + k * cw, 66, cw - 1.5, 22, "m" if k == 0 else "u", rx=1))
    b.append(txt(X0, 106, "tile 1 has arrived", "sub2"))
    b.append(txt(X0 + W, 106, f"tiles 2 to {nt}: not yet seen", "sub2", "end"))
    b.append(eq(40, 120, 600, "weight  =  e^(score − row maximum)  ÷  row sum of those exponentials", "u", 34))
    opts = [("wait for the whole row", "holds the n × n object tiling exists to avoid", "h"),
            ("make two passes over the row", "brings back the traffic tiling removed", "h"),
            ("trust the tiles seen so far", "wrong as soon as a later tile beats the maximum", "h"),
            ("be provisionally right, repair later", "online softmax: one multiplication per tile", "s")]
    for k, (opt, cost, cls) in enumerate(opts):
        y = 174 + k * 40
        b.append(cell(40, y, 250, 30, cls, label=opt))
        b.append(txt(306, y + 20, cost, "sub2"))
    body, yb = prose(174 + 4 * 40 + 30, [
        "Softmax divides every exponential by the row's sum and subtracts the row's maximum first "
        "({{fig:v03-p07}}). Both are row-wide: they depend on every score in the row. A tile only ever sees "
        "a slice of it, so as softmax is normally written, nothing in the row can be finished until the "
        "whole row exists.",
        "The first three ways out all fail: waiting holds the quadratic object, two passes bring the traffic "
        "back, and trusting the tiles seen so far gives wrong answers when a later tile holds a larger "
        "score. The fourth works, and the rest of this part shows why it costs almost nothing.",
    ])
    figure("o053", st("Softmax needs two row wide numbers"), "The obstacle", yb + 30, b + [body],
           esc("A real conflict, not a detail. Without the fourth row, tiled attention would not be possible; "
               "the fix was published in 2018 by Milakov and Gimelshein at NVIDIA, four years before "
               "FlashAttention."))


# ---- p13: the 1.59, built ------------------------------------------------------------------------------
def p13():
    s = S1
    assert s["m"] == 3 and f(s["l"], 3) == "1.591"
    b = [hd(40, 46, "Tile 1: three scores, their exponentials against the tile's maximum, and two sums")]
    cols = [(40, "score x", "start"), (180, "x − 3", "end"), (290, "e^(x − 3)", "end"), (400, "value v", "end"),
            (530, "e^(x − 3) × v", "end")]
    for cx, lab, an in cols:
        b.append(txt(cx, 84, lab, "sub2", an))
    for k in range(3):
        y = 110 + k * 26
        b.append(txt(40, y, f"{X1[k]:g}", "cap"))
        b.append(txt(180, y, f(X1[k] - 3, 1), "sub2", "end"))
        b.append(txt(290, y, f(s["terms"][k], 4), "sub2", "end"))
        b.append(txt(400, y, f"{V1[k]}", "sub2", "end"))
        b.append(txt(530, y, f(s["terms"][k] * V1[k], 4), "sub2", "end"))
    yt = 110 + 3 * 26 - 12
    b.append(tline(200, yt, 540, yt))
    b.append(txt(40, yt + 24, "running sums", "cap"))
    b.append(cell(214, yt + 8, 86, 26, "s", label=f"l = {f(s['l'], 3)}"))
    b.append(cell(424, yt + 8, 116, 26, "s", label=f"O = {f(s['O'], 2)}"))
    b.append(txt(556, yt + 26, "m = 3", "sub2"))
    body, yb = prose(yt + 70, [
        "The first tile's largest score is 3, so each exponential is taken as e^(score − 3): 1, e⁻¹ and "
        f"e^(−1.5). They add to {f(s['l'], 3)}, the running denominator l. The scores are chosen so this "
        "sum is the 1.59 quoted for the first tile; any scores would do.",
        "The same exponentials weight the values, and their weighted sum is the running output O = "
        f"{f(s['O'], 2)}. Nothing has been divided yet: O and l are carried, and the answer will be O ÷ l "
        "when the row is finished. Only m, l and O need to be remembered; the scores themselves can go.",
    ])
    figure("p13", st("accumulates to 1.59"), "The 1.59, built from three scores", yb + 30, b + [body],
           esc("Every number the kernel keeps for this row is in the bottom line. The next tile will show why "
               "they cannot simply be kept as they are."))


# ---- o057: every folded term is off by e² ------------------------------------------------------------
def o057():
    ratio = math.exp(5 - 3)
    should = [math.exp(x - 5) for x in X1]
    for t, sh in zip(S1["terms"], should):
        assert abs(t / sh - ratio) < 1e-12
    b = [hd(40, 46, "Tile 2 arrives holding a 5: the maximum moves from 3 to 5")]
    cols = [(40, "tile 1 score", "start"), (250, "folded in as e^(x − 3)", "end"), (440, "should be e^(x − 5)", "end"),
            (600, "too large by", "end")]
    for cx, lab, an in cols:
        b.append(txt(cx, 84, lab, "sub2", an))
    for k in range(3):
        y = 110 + k * 26
        b.append(txt(40, y, f"{X1[k]:g}", "cap"))
        b.append(txt(250, y, f(S1["terms"][k], 4), "sub2", "end"))
        b.append(txt(440, y, f(should[k], 4), "sub2", "end"))
        b.append(txt(600, y, f(ratio, 3), "sub2", "end"))
    ye = 110 + 3 * 26
    b.append(eq(40, ye, 600, "e^(x − 3)  =  e^(x − 5 + 2)  =  e^(x − 5) × e²", "u", 34))
    b.append(txt(40, ye + 60, "adding exponents is multiplying powers:  e^(a + b) = e^a × e^b", "sub2"))
    body, yb = prose(ye + 96, [
        "Every term already folded into the 1.59 subtracted the old maximum, 3. Against the true maximum, 5, "
        f"each is too large. And not by different amounts: every one is too large by exactly e^(5 − 3) = "
        f"e² = {f(ratio, 3)}, because subtracting 3 instead of 5 adds 2 to every exponent, and adding 2 to "
        "an exponent multiplies the power by e².",
        "They all subtracted the same wrong number, so they are all wrong by the same factor. That shared "
        "error is what will make the repair cheap.",
    ])
    figure("o057", st("too large by exactly"), "Every term folded in so far is too large by the same factor",
           yb + 30, b + [body],
           esc("The last column is the whole idea: one number, the same in every row. If the errors were "
               "different, no single correction could repair them."))


# ---- p14: one multiplication repairs the sum ------------------------------------------------------------
def p14():
    l1 = S1["l"]
    fixed = l1 * C
    should = [math.exp(x - 5) for x in X1]
    assert abs(fixed - sum(should)) < 1e-15 and f(fixed, 4) == "0.2153"
    b = [hd(40, 46, "The repair, one law at a time")]
    b.append(eq(40, 66, 600, f"{f(l1, 3)} × e⁻²  =  (e⁰ + e⁻¹ + e^(−1.5)) × e⁻²", "u", 34))
    b.append(txt(52, 124, "distributive law: c × (a + b + d) = c×a + c×b + c×d", "sub2"))
    b.append(eq(40, 136, 600, "=  e⁻²  +  e⁻³  +  e^(−3.5)", "u", 34))
    b.append(txt(52, 194, "adding exponents: e^a × e^b = e^(a + b)", "sub2"))
    b.append(eq(40, 206, 600, "=  " + "  +  ".join(f(v, 4) for v in should) + f"  =  {f(fixed, 4)}", "s", 34))
    body, yb = prose(270, [
        f"The sum {f(l1, 3)} was made with the old maximum. Multiplying it by the correction e^(3 − 5) = "
        f"{f(C, 3)} multiplies each of its three terms by the same factor, because a factor outside a sum "
        "reaches every term inside it. Each term then becomes exactly what it would have been had the "
        "maximum been 5 all along.",
        f"So one multiplication repairs the whole sum, {f(fixed, 4)}, without remembering a single one of "
        "the terms that made it. Tile 2's own exponentials, taken against 5, can now be added on cleanly.",
    ])
    figure("p14", st("One multiplication repairs"), "Multiply the sum, and every term inside it moves",
           yb + 30, b + [body],
           esc("Two facts from school algebra carry the algorithm: adding exponents multiplies powers, and a "
               "factor distributes over a sum. The correction factor here is the 0.135 quoted for this step."))


# ---- p15: the output takes the same factor; divide at the end ---------------------------------------------
def p15():
    s2 = S2
    new_l = sum(s2["terms"])
    new_O = sum(t * v for t, v in zip(s2["terms"], V2))
    assert abs(S1["O"] * C + new_O - s2["O"]) < 1e-12 and abs(S1["l"] * C + new_l - s2["l"]) < 1e-15
    b = [hd(40, 46, "Tile 2: scores 5, 4, 1 with values 40, 50, 60, against the new maximum 5")]
    rows = [("old sums, repaired", f"l: {f(S1['l'], 4)} × {f(C, 4)} = {f(S1['l'] * C, 4)}",
             f"O: {f(S1['O'], 2)} × {f(C, 4)} = {f(S1['O'] * C, 3)}"),
            ("tile 2's terms", f"l: 1 + {f(s2['terms'][1], 4)} + {f(s2['terms'][2], 4)} = {f(new_l, 4)}",
             f"O: 40 + 50×{f(s2['terms'][1], 4)} + 60×{f(s2['terms'][2], 4)} = {f(new_O, 2)}"),
            ("new sums", f"l = {f(s2['l'], 4)}", f"O = {f(s2['O'], 2)}")]
    for k, (lab, a, c) in enumerate(rows):
        y = 84 + k * 44
        b.append(txt(40, y + 18, lab, "cap"))
        cls = "s" if k == 2 else "u"
        b.append(cell(186, y, 206, 28, cls, label=a))
        b.append(cell(400, y, 240, 28, cls, label=c))
    ye = 84 + 3 * 44 + 6
    b.append(eq(186, ye, 454, f"answer = O ÷ l = {f(s2['O'], 2)} ÷ {f(s2['l'], 4)} = {f(ANSWER, 2)}", "m", 34))
    b.append(txt(40, ye + 22, "at the end", "cap"))
    b.append(txt(186, ye + 58, f"all six scores at once, the direct way: {f(DIRECT, 2)}", "sub2"))
    body, yb = prose(ye + 96, [
        "The running output was built from the same stale exponentials, so it is off by the same factor, "
        "and the same multiplication repairs it. Then each sum takes tile 2's own terms, and the row is "
        "done.",
        f"Only now is anything divided: the answer is O ÷ l = {f(ANSWER, 2)}, the weighted average of the "
        "six values. Computed directly, with all six scores at once, it is the same number. The division "
        "happens once per row, at the very end.",
    ])
    figure("p15", st("The identical factor repairs it"),
           "The output takes the same factor, and one division at the end gives the answer", yb + 30, b + [body],
           esc("Denominator and output stay in step because they are rescaled by the same number at the same "
               "moment. Their ratio was never wrong; only their common scale was."))


# ---- o055: the recurrence -------------------------------------------------------------------------------
def o055():
    b = [hd(40, 46, "Per row: a running maximum m, a running sum l, a running output O")]
    lines = [("when a tile arrives", "m_new  =  max( m,  the tile's largest score )"),
             ("", "c  =  e^(m − m_new)        the correction, 1 if the maximum did not move"),
             ("", "l  =  l × c  +  sum of e^(score − m_new) over the tile"),
             ("", "O  =  O × c  +  sum of e^(score − m_new) × value over the tile"),
             ("after the last tile", "answer  =  O ÷ l")]
    for k, (lab, s) in enumerate(lines):
        y = 66 + k * 42
        if lab:
            b.append(txt(40, y + 21, lab, "cap"))
        b.append(eq(190, y, 450, s, "m" if k == 4 else "u", 32))
    body, yb = prose(66 + 5 * 42 + 26, [
        "The worked row in general form. Everything already accumulated was made against the old maximum, "
        "so one correction factor moves it onto the new one; the tile's own terms are then added. Start with "
        "m at minus infinity and l and O at zero, and the first tile simply fills them.",
        "Written this way the output stays unnormalised until the end. The first version of FlashAttention "
        "instead divided O by l after every tile, so that O was always a finished average; the arithmetic "
        f"is the same plus one division per tile, which version 2 removed (Part {PART['fa2']}).",
    ])
    figure("o055", st("The identical factor repairs it"), "The recurrence", yb + 30, b + [body],
           esc("Four lines and a division. The denominator and the output carry the same correction, which is "
               "why they stay consistent with each other at every step."))


# ---- o059: exact, up to rounding ------------------------------------------------------------------------
def o059():
    a, d_ = ANSWER, DIRECT
    sa, sd = repr(a), repr(d_)
    assert sa == "39.18035943419077" and sd == "39.18035943419078"
    b = [hd(40, 46, "Why the repair is exact, and what 'exact' means in floating point")]
    b.append(eq(40, 66, 600, "e^(x − m_old)  ×  e^(m_old − m_new)  =  e^(x − m_new)", "u", 34))
    b.append(txt(40, 130, "the row of the last figures, in 64-bit floating point:", "sub2"))
    rows = [("tile by tile, with the correction", sa), ("all six at once", sd)]
    for k, (lab, v) in enumerate(rows):
        y = 144 + k * 38
        b.append(cell(40, y, 260, 28, "s" if k == 0 else "u", label=lab))
        b.append(txt(320, y + 19, v, "lbl"))
    body, yb = prose(144 + 2 * 38 + 30, [
        "The correction is not a heuristic. Multiplying a term made against one maximum by e^(m_old − m_new) "
        "gives exactly the term made against the other, by the exponent law. So by the last tile the running "
        "maximum is the true maximum, the running sum is the true sum, and the output is the true weighted "
        "average.",
        "Carried out in floating point, the two routes agree to fifteen significant figures and differ in "
        "the sixteenth: the additions happened in a different order, and floating point rounds after each "
        "one ({{fig:v03-p12}}). Exact means the same function, up to that rounding.",
    ])
    figure("o059", st("the correction was exact at every step"), "The recurrence is exact, up to rounding",
           yb + 30, b + [body],
           esc("Worth stating plainly, because the algorithm is often mistaken for an approximation. It is "
               "attention computed in a different order, which is why it can be dropped into a trained model "
               "unchanged."))


# ---- p16: the widget ------------------------------------------------------------------------------------
WIDTHS = [1, 2, 3, 6]
NROWS = 6
P16_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const X0 = __X0__, V0 = __V0__, W0 = __W0__, TAU = __TAU__, WIDTHS = __WIDTHS__;
  const q = s => fig.querySelector(s), qa = s => [...fig.querySelectorAll(s)];
  const xs = qa('input[data-x]'), vs = qa('input[data-v]'), rad = qa('input[type=radio]'), skip = q('input[type=checkbox]');
  const fx = (v, d) => (v < 0 && Math.abs(v).toFixed(d) !== (0).toFixed(d) ? '−' : '') + Math.abs(v).toFixed(d);
  const num = el => { const v = parseFloat(el.value); return isFinite(v) ? v : 0; };
  function run(x, v, w, tau) {
    let m = -Infinity, l = 0, O = 0; const rows = [];
    for (let s = 0; s < x.length; s += w) {
      const tx = x.slice(s, s + w), tv = v.slice(s, s + w), tmax = Math.max(...tx);
      let mn, c, fired;
      if (m === -Infinity || tau === null || tmax - m > tau) { mn = Math.max(m, tmax); c = m === -Infinity ? 0 : Math.exp(m - mn); fired = m !== -Infinity && mn > m; }
      else { mn = m; c = 1; fired = false; }
      const t = tx.map(a => Math.exp(a - mn));
      l = l * c + t.reduce((a, b) => a + b, 0);
      O = O * c + t.reduce((a, b, i) => a + b * tv[i], 0);
      rows.push({tx, tmax, m: mn, c, l, O, fired}); m = mn;
    }
    return {rows, ans: O / l};
  }
  function draw() {
    const x = xs.map(num), v = vs.map(num), w = WIDTHS[rad.findIndex(r => r.checked)];
    const tau = skip.checked ? TAU : null, R = run(x, v, w, tau);
    const mx = Math.max(...x), e = x.map(a => Math.exp(a - mx));
    const dir = e.reduce((a, b, i) => a + b * v[i], 0) / e.reduce((a, b) => a + b, 0);
    for (let k = 0; k < __NROWS__; k++) {
      const r = R.rows[k], set = (f, s) => q(`[data-${f}="${k}"]`).textContent = s;
      if (!r) { ['k','t','tm','m','c','l','o'].forEach(f => set(f, '')); continue; }
      set('k', String(k + 1));
      set('t', r.tx.map(a => fx(a, 1)).join(', '));
      set('tm', fx(r.tmax, 2)); set('m', fx(r.m, 2));
      set('c', k === 0 ? 'start' : (r.c === 1 && !r.fired ? (tau !== null && r.tmax > r.m ? 'skipped' : '1') : fx(r.c, 4)));
      set('l', fx(r.l, 4)); set('o', fx(r.O, 4));
    }
    q('[data-ans]').textContent = fx(R.ans, 6);
    q('[data-dir]').textContent = fx(dir, 6);
    q('[data-agree]').textContent = Math.abs(R.ans - dir) < 1e-9 * Math.max(1, Math.abs(dir)) ? 'the same' : 'different';
  }
  qa('input').forEach(el => el.addEventListener('input', draw));
  rad.forEach(r => r.addEventListener('change', draw)); skip.addEventListener('change', draw);
  q('button').addEventListener('click', () => { xs.forEach((el, i) => el.value = X0[i]); vs.forEach((el, i) => el.value = V0[i]);
    rad[WIDTHS.indexOf(W0)].checked = true; skip.checked = false; draw(); });
  draw();
})();</script>"""


def p16_cells(x, v, w, tau):
    """What the widget prints, row by row, for scores x, values v, tile width w (Python's version)."""
    tx = [x[i:i + w] for i in range(0, len(x), w)]
    tv = [v[i:i + w] for i in range(0, len(v), w)]
    steps, ans = online(tx, tv, tau)
    rows = []
    for k, s in enumerate(steps):
        if k == 0:
            cc = "start"
        elif s["c"] == 1 and not s["fired"]:
            cc = "skipped" if tau is not None and s["tmax"] > s["m"] else "1"
        else:
            cc = fn(s["c"], 4)
        rows.append(dict(t=", ".join(fn(a, 1) for a in tx[k]), tm=fn(s["tmax"], 2), m=fn(s["m"], 2), c=cc,
                         l=fn(s["l"], 4), o=fn(s["O"], 4)))
    dr = direct(x, v)
    agree = "the same" if abs(ans - dr) < 1e-9 * max(1, abs(dr)) else "different"
    return rows, fn(ans, 6), fn(dr, 6), agree


def p16():
    x0, v0, w0 = ALL_X, ALL_V, 3
    rows, ans, dr, agree = p16_cells(x0, v0, w0, None)
    assert ans == dr == "39.180359" and agree == "the same"
    # claims in the prose, checked: a 1,000 anywhere still gives the direct answer, in either mode
    for pos in range(6):
        xx = list(x0)
        xx[pos] = 1000
        for w in WIDTHS:
            for tau in (None, TAU):
                r = p16_cells(xx, v0, w, tau)
                assert r[3] == "the same" and r[1] == fn(v0[pos], 6)
    # with the toggle, the worked row's rise of 2 (2.9 doublings) is skipped and the answer is unchanged
    r = p16_cells(x0, v0, 3, TAU)
    assert r[0][1]["c"] == "skipped" and r[1] == ans
    title = "Push one row through the tiles"
    s = [hd(40, 30, "The running numbers after each tile, and the answer both ways")]
    cols = [(40, "tile", "start"), (90, "its scores", "start"), (300, "its max", "end"), (370, "m", "end"),
            (450, "correction", "end"), (540, "l", "end"), (640, "O", "end")]
    for cx, lab, an in cols:
        s.append(txt(cx, 58, lab, "sub2", an))
    for k in range(NROWS):
        y = 82 + k * 24
        r = rows[k] if k < len(rows) else None
        s.append(f'<text class="sub2" x="40" y="{y}" data-k="{k}">{k + 1 if r else ""}</text>')
        for key, cx, an in (("t", 90, "start"), ("tm", 300, "end"), ("m", 370, "end"), ("c", 450, "end"),
                            ("l", 540, "end"), ("o", 640, "end")):
            s.append(f'<text class="sub2" x="{cx}" y="{y}" text-anchor="{an}" data-{key}="{k}">'
                     f'{esc(r[key]) if r else ""}</text>')
    ya = 82 + NROWS * 24 + 14
    s.append(f'<text class="cap" x="40" y="{ya}">tile by tile, O ÷ l: <tspan data-ans="">{ans}</tspan></text>')
    s.append(f'<text class="cap" x="40" y="{ya + 22}">all at once, the direct way: <tspan data-dir="">{dr}</tspan>'
             f'  —  <tspan data-agree="">{agree}</tspan></text>')
    body, yb = prose(ya + 62, [
        "Type any six scores and values, choose how many scores arrive per tile, and follow m, l and O. The "
        "correction column is e^(m_old − m_new): 1 when the maximum holds still, small when it jumps.",
        "Put a 1,000 anywhere after the first tile. Before it arrives the sums are ordinary; when it arrives the correction is "
        "e^(−995) or smaller, the earlier terms vanish, and the answer becomes that score's value, as the "
        "direct softmax says it must. Nothing overflows, whatever the order.",
        f"The checkbox applies version 4's rule (Part {PART['fa4']}): move the maximum only when a tile's maximum "
        "beats it by more than 8 doublings, a factor of 256. Smaller rises are skipped, l and O grow larger, "
        "and the answer does not change. The arithmetic was checked against Python.",
    ])
    inp = "width:4.4em;font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:4px;padding:2px 4px"
    ctl1 = ("<label class='opt'>scores</label>" + "".join(
        f"<label class='opt'><input type='number' step='any' data-x='{i}' value='{x0[i]:g}' style='{inp}'></label>"
        for i in range(6)))
    ctl2 = ("<label class='opt'>values</label>" + "".join(
        f"<label class='opt'><input type='number' step='any' data-v='{i}' value='{v0[i]:g}' style='{inp}'></label>"
        for i in range(6)))
    ctl3 = ("<label class='opt'>scores per tile</label>" + "".join(
        f"<label class='opt'><input type='radio' name='v03-p16-w' value='{w}'{' checked' if w == w0 else ''}> {w}</label>"
        for w in WIDTHS)
        + "<label class='opt'><input type='checkbox'> skip small rescales (version 4)</label>"
        + "<button type='button'>Reset</button>")
    js = (P16_JS.replace("__X0__", json.dumps(x0)).replace("__V0__", json.dumps(v0)).replace("__W0__", str(w0))
          .replace("__TAU__", repr(TAU)).replace("__WIDTHS__", json.dumps(WIDTHS)).replace("__NROWS__", str(NROWS)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
             f"{st('only two running numbers per row')}</div><h3>{esc(title)}</h3>"
             f"<div class='wg'><div class='ctl'>{ctl1}</div><div class='ctl'>{ctl2}</div><div class='ctl'>{ctl3}</div>"
             f"<svg viewBox='0 0 680 {int(yb + 26)}' role='img'><title>{esc(title)}</title>{''.join(s)}{body}</svg></div>"
             "<figcaption>" + esc("Attention never needed the whole row at once: three running numbers per row, "
                                  "corrected by one multiplication whenever the maximum moves.")
             + f"</figcaption>{js}</figure>")
    guard_split_word("p16", "".join(s) + body)
    (ITEMS / "p16.html").write_text(html_, encoding="utf-8")
    print("p16", title)


def patches():
    patch("o056", [("<figcaption>Stating the size makes the trade concrete. A quadratic object becomes two scalars per row, and the arithmetic that makes that legitimate is the next figure.</figcaption>",
                    "<figcaption>Stating the size makes the trade concrete. A quadratic object becomes two scalars "
                    "per row, and the figures that follow work through the arithmetic that makes it legitimate."
                    "</figcaption>")],
          stamp_to=st("running maximum"))


if __name__ == "__main__":
    for job in (o053, p13, o057, p14, p15, o055, o059, p16, patches):
        job()
