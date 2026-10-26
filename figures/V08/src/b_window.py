"""V8 Part 7, why attending to fewer works, and the sliding window: review §4 I1-I4, fix P6 (Fig 17).

  b05   one query's softmax: four tokens carry 82.5% of the weight             (I1)
  b06   at 128k, one head in one layer scores 8.6 billion pairs                (I2)
  b07   a window turns the triangle into a band (Mistral 7B, 4,096)            (new: the mask)
  b08   widget: each layer reaches one window further back                     (I3)
  o017  Mistral 7B's reach, to scale, "in theory"                              (P6)
  b09   the rolling buffer: slot = position mod W, and the cache stops         (I4)

  python3 figures/V08/src/b_window.py
"""
import json, math, random
from b_lib import (cell, ghost, txt, hd, ln, arr, prose, emit, stamp, f, n0, pct, text, esc, OUT, CTX)

# ---- b05: attention lands on a handful -------------------------------------------------------------
SCORES = [4, 3.5, 3.2, 3.0] + [0.0] * 28                  # illustrative: four strong matches among 32
EX = [math.exp(s) for s in SCORES]
TOT = sum(EX)
W8 = [e / TOT for e in EX]
TOP4 = sum(W8[:4])
assert round(TOT, 1) == 160.3 and round(TOP4, 3) == 0.825 and round(W8[-1], 4) == 0.0062
assert abs(sum(W8) - 1) < 1e-12


def b05():
    b = [hd(40, 46, "One query's weights over 32 earlier tokens, sorted (scores illustrative)")]
    X0, PITCH, BW, BASE, SC = 64, 17.5, 12, 236, 440
    for i, w in enumerate(W8):
        x = X0 + i * PITCH
        h = w * SC
        b.append(cell(x, BASE - h, BW, h, "s" if i < 4 else "u", rx=1))
    top = BASE - W8[0] * SC
    b.append(txt(X0 + 4 * PITCH + 12, top + 10, "the four: " + ", ".join(f(w) for w in W8[:3]) + f" and {f(W8[3])}", "sub2"))
    b.append(ln(X0 - 4, BASE, X0 + 32 * PITCH, BASE, "axis"))
    mid = X0 + 4 * PITCH + 14 * PITCH
    b.append(txt(mid, BASE - 22, f"28 tokens at {f(W8[-1], 4)} each", "sub2", "middle"))
    # the same weights as one 100% bar
    y2, L = 266, 560
    w1 = TOP4 * L
    b.append(cell(X0, y2, w1, 28, "s", label=f"the top 4: {pct(TOP4)} of the weight"))
    b.append(cell(X0 + w1, y2, L - w1, 28, "u", label=pct(1 - TOP4)))
    b.append(txt(X0 + w1 + (L - w1) / 2, y2 + 46, "the other 28", "sub2", "middle"))
    body, yb = prose(352, [
        f"Four strong matches scored 4, 3.5, 3.2 and 3, and 28 others scored 0. Raising e to each "
        f"gives {f(EX[0], 1)}, {f(EX[1], 1)}, {f(EX[2], 1)} and {f(EX[3], 1)}, against 1 for each of the "
        f"28; the total is {f(TOT, 1)}. So the four take {f(sum(EX[:4]), 1)} ÷ {f(TOT, 1)} = {pct(TOP4)} "
        f"of the weight, and each of the others gets {pct(W8[-1])} ({{{{fig:v01-o009}}}}).",
        "Trained models look like this, only more so. The authors of H2O, a method in Part 8, measured "
        "attention in OPT models and found more than 95% of the weights below one hundredth of their "
        "row's largest, in almost every layer.",
    ])
    emit("b05", stamp("Most of the attention weight lands"),
         "One query's attention: four tokens take 82.5% of the weight", yb + 30, b + [body],
         "Scores illustrative, shape measured. A query's answer is decided by a handful of tokens; the "
         "rest are read for almost nothing.")


# ---- b06: every pair -----------------------------------------------------------------------------------
PAIRS = CTX * (CTX + 1) // 2
assert PAIRS == 8_590_000_128


def heavy_cells(n=24, seed=8):
    """Illustrative strong cells per row: the first token, the diagonal, and one match in between."""
    rnd = random.Random(seed)
    hv = set()
    for q in range(n):
        hv.add((q, 0))
        hv.add((q, q))
        if q >= 3:
            hv.add((q, rnd.randrange(1, q - 1)))
    return hv


def b06():
    n, P, C, X0, Y0 = 24, 15, 13, 60, 64
    hv = heavy_cells(n)
    b = [hd(40, 46, "Every query against every earlier key: the causal triangle ({{fig:v03-o020}})")]
    for q in range(n):
        for k in range(q + 1):
            b.append(cell(X0 + k * P, Y0 + q * P, C, C, "s" if (q, k) in hv else "u", rx=2))
    b.append(txt(X0, Y0 + n * P + 18, "keys, oldest first →", "sub2"))
    b.append(txt(X0 + 6 * P, Y0 + 9, "queries run down, newest last", "sub2"))
    heads, layers = 64, 80
    total = PAIRS * heads * layers
    assert round(total / 1e13, 1) == 4.4 and len(hv) < 3 * n
    tx = 470
    b.append(txt(tx, 230, f"{n} tokens: {n * (n + 1) // 2} pairs", "sub2"))
    b.append(txt(tx, 252, f"{n0(CTX)} tokens:", "sub2"))
    b.append(txt(tx, 270, f"{n0(PAIRS)} pairs", "sub2"))
    b.append(txt(tx, 288, "per head, per layer", "sub2"))
    body, yb = prose(Y0 + n * P + 56, [
        f"Exact attention scores every query against every earlier key, a triangle of n(n + 1) ÷ 2 "
        f"cells. At {n} tokens that is {n * (n + 1) // 2}. At {n0(CTX)} tokens it is 8.6 billion, for each "
        f"of the 70B model's {heads} heads ({{{{fig:v03-o013}}}}) in each of its {layers} layers: "
        f"{f(total / 1e13, 1)} × 10¹³ "
        f"scores for one 128k prompt. In decode each step adds one row, the newest query against all "
        f"{n0(CTX)} keys, which is the cache read of {{{{fig:v08-b02}}}}.",
        "If each row looks like the previous figure, a handful of cells take most of the weight and "
        "almost all of the work goes to pairs that barely matter. The teal cells, illustrative, follow "
        "the pattern trained models show: the first token (Part 8 explains why), the nearest "
        "neighbours, and a few matches in between.",
    ])
    emit("b06", stamp("computing every pair anyway"),
         "At 128k tokens, one head in one layer scores 8.6 billion pairs", yb + 30, b + [body],
         "Computing every cell is what makes attention exact, and what makes it expensive. The rest of "
         "this part is about which cells can safely be skipped.")


# ---- b07: the band -----------------------------------------------------------------------------------------
WIN = 4096
BAND = sum(min(i + 1, WIN + 1) for i in range(CTX))
assert BAND == 528_611_328 and round(PAIRS / BAND, 1) == 16.3


def b07():
    n, w, P, C, X0, Y0 = 16, 4, 20, 17, 60, 70
    band = sum(min(i + 1, w + 1) for i in range(n))
    tri = n * (n + 1) // 2
    assert (band, tri) == (70, 136)
    b = [hd(40, 46, "Each token sees itself and the W tokens before it; drawn with W = 4")]
    for q in range(n):
        for k in range(q + 1):
            x, y = X0 + k * P, Y0 + q * P
            if q - k <= w:
                b.append(cell(x, y, C, C, "s", rx=2))
            else:
                b.append(ghost(x, y, C, C, rx=2))
    tx = 420
    b.append(txt(tx, 96, f"a window of {w}:", "sub2"))
    b.append(txt(tx, 114, f"{band} of the {tri} cells", "sub2"))
    b.append(txt(tx, 150, f"Mistral 7B, W = {n0(WIN)}, at {n0(CTX)}:", "sub2"))
    b.append(txt(tx, 168, f"{f(BAND / 1e9, 2)} billion of 8.59 billion pairs,", "sub2"))
    b.append(txt(tx, 186, f"{f(PAIRS / BAND, 1)} times fewer", "sub2"))
    b.append(txt(tx, 222, "the newest token reads", "sub2"))
    b.append(txt(tx, 240, f"{n0(WIN + 1)} keys, not {n0(CTX)}", "sub2"))
    b.append(ghost(tx, 266, 17, 17, rx=2))
    b.append(txt(tx + 26, 279, "outside the window: never computed", "sub2"))
    body, yb = prose(Y0 + n * P + 34, [
        f"The simplest version restricts each token to a fixed window of recent ones. Mistral 7B sets "
        f"that window at {n0(WIN)} tokens: each token attends to itself and the {n0(WIN)} before it. "
        f"Every row of the triangle is cut to a band of at most W + 1 cells, however long the text grows.",
        f"So the work grows in a straight line with the context instead of with its square. At {n0(CTX)} "
        f"tokens a {n0(WIN)} window computes {f(PAIRS / BAND, 1)} times fewer pairs than the full triangle, "
        f"and at each decode step the newest token reads {n0(WIN + 1)} keys and values instead of {n0(CTX)}.",
    ])
    emit("b07", stamp("Mistral 7B sets that window"),
         "A sliding window cuts the triangle down to a band", yb + 30, b + [body],
         "That looks like everything older is simply gone. It is not, and the next figure shows why.")


# ---- b08: the reach widget -----------------------------------------------------------------------------------
NCOL, NLAY = 25, 4            # positions 0..24 (newest at 24); layers 1..4 above the input row
W0, L0 = 4, 3


def reach(w, lay):
    """reached[l][c] for rows l = 0 (input) .. NLAY, tracing from the newest token at layer `lay`."""
    newest = NCOL - 1
    return [[(l <= lay and c >= newest - (lay - l) * w) for c in range(NCOL)] for l in range(NLAY + 1)]


for _w in range(1, 7):        # the claims the prose makes, for every setting the sliders allow
    for _l in range(1, NLAY + 1):
        r = reach(_w, _l)
        assert sum(r[0]) == _l * _w + 1                       # inputs heard from: L × W back, plus itself
        assert all(sum(r[l]) == (_l - l) * _w + 1 for l in range(_l + 1))
        assert all(not any(r[l]) for l in range(_l + 1, NLAY + 1))
assert 32 * WIN == 131_072

WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const NCOL = __NCOL__, NLAY = __NLAY__, W0 = __W0__, L0 = __L0__, X0 = __X0__, PITCH = __PITCH__, CW = __CW__;
  const [sw, sl] = [...fig.querySelectorAll('input[type=range]')];
  const val = [...fig.querySelectorAll('.val')], q = s => fig.querySelector(s);
  function draw() {
    const w = +sw.value, lay = +sl.value, newest = NCOL - 1;
    val[0].textContent = w; val[1].textContent = lay;
    for (let l = 0; l <= NLAY; l++) {
      for (let c = 0; c < NCOL; c++) {
        const on = l <= lay && c >= newest - (lay - l) * w;
        q(`[data-c="${l}-${c}"]`).setAttribute('class', on ? 's' : 'u');
      }
      q(`[data-row="${l}"]`).textContent = l === 0 ? 'input' : (l === lay ? `layer ${l}, traced` : `layer ${l}`);
    }
    const back = lay * w, left = newest - back;
    q('[data-back]').textContent = `${back} back`;
    q('[data-back]').setAttribute('x', (X0 + left * PITCH + CW / 2).toFixed(1));
    q('[data-sum]').textContent = `From layer ${lay}, the newest token has heard from inputs up to ${back} positions back: ${lay} × a window of ${w}.`;
  }
  [sw, sl].forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sw.value = W0; sl.value = L0; draw(); });
  draw();
})();</script>"""


def b08():
    X0, PITCH, CW, CH, Y0, RP = 152, 19.6, 15, 20, 56, 28
    r = reach(W0, L0)
    s = [hd(40, 34, "Teal: every vector, at every level, that can reach the traced layer's newest token")]
    rows = list(range(NLAY, -1, -1))                            # top row = layer 4, bottom = input
    for k, l in enumerate(rows):
        y = Y0 + k * RP
        lab = "input" if l == 0 else (f"layer {l}, traced" if l == L0 else f"layer {l}")
        s.append(f'<text class="cap" x="40" y="{y + 15}" data-row="{l}">{esc(lab)}</text>')
        for c in range(NCOL):
            x = X0 + c * PITCH
            s.append(f'<g class="{"s" if r[l][c] else "u"}" data-c="{l}-{c}"><rect x="{x:.1f}" y="{y}" '
                     f'width="{CW}" height="{CH}" rx="2"/></g>')
    yb = Y0 + (NLAY + 1) * RP
    newest_x = X0 + (NCOL - 1) * PITCH + CW / 2
    left = NCOL - 1 - L0 * W0
    s.append(text(newest_x, yb + 12, "newest", "sub2", "middle"))
    s.append(text(X0 + left * PITCH + CW / 2, yb + 30, f"{L0 * W0} back", "sub2", "middle", ' data-back=""'))
    s.append(text(40, yb + 64, f"From layer {L0}, the newest token has heard from inputs up to {L0 * W0} "
                  f"positions back: {L0} × a window of {W0}.", "cap", "start", ' data-sum=""'))
    body, ybb = prose(yb + 104, [
        "Each layer is computed from the layer below it ({{fig:v01-o096}}). With a window, the newest "
        "token's vector at layer 1 mixes only the inputs within W positions. At layer 2 it mixes "
        "layer-1 vectors that each mixed W inputs of their own, so its reach doubles; every layer adds "
        "one more window.",
        f"Mistral 7B stacks 32 layers on a {n0(WIN)} window, so the newest token at the top can carry "
        f"information from 32 × {n0(WIN)} = {n0(32 * WIN)} positions back, in theory. The widget's "
        "arithmetic was checked against Python at every setting.",
    ])
    title = "Each layer reaches one window further back"
    ctl = (f"<label>window W <input type='range' min='1' max='6' step='1' value='{W0}'>"
           f"<span class='val'>{W0}</span></label>"
           f"<label>trace from layer <input type='range' min='1' max='{NLAY}' step='1' value='{L0}'>"
           f"<span class='val'>{L0}</span></label>")
    js = (WIDGET_JS.replace("__NCOL__", str(NCOL)).replace("__NLAY__", str(NLAY)).replace("__W0__", str(W0))
          .replace("__L0__", str(L0)).replace("__X0__", str(X0)).replace("__PITCH__", str(PITCH))
          .replace("__CW__", str(CW)))
    html = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {stamp('A token sees the 4,000')}"
            f"</div><h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
            f"<div class='ctl'><button type='button'>Reset</button></div>"
            f"<svg viewBox='0 0 680 {ybb + 26}' role='img'><title>{title}</title>{''.join(s)}{body}</svg></div>"
            "<figcaption>A local window is not a short memory: each layer passes along what the layers below "
            "have already gathered.</figcaption>"
            f"{js}</figure>")
    (OUT / "b08.html").write_text(html, encoding="utf-8")
    print("b08         ", title)


# ---- o017: the real reach ------------------------------------------------------------------------------------
def o017():
    rows = [(1, "after 1 layer"), (2, "after 2 layers"), (32, "after 32 layers")]
    SC = 300 / (32 * WIN)
    b = [hd(40, 46, "Mistral 7B: how far back the newest token can carry information, drawn to scale")]
    for k, (lay, lab) in enumerate(rows):
        y = 74 + k * 52
        b.append(txt(40, y + 19, lab, "cap"))
        w = lay * WIN * SC
        b.append(cell(220, y, w, 30, "s"))
        b.append(txt(220 + w + 10, y + 20, f"{n0(lay * WIN)} tokens" + (", in theory" if lay == 32 else ""), "sub2"))
    assert rows[-1][0] * WIN * SC == 300
    body, yb = prose(262, [
        f"Mistral 7B sets the window at {n0(WIN)} tokens, and no single layer ever looks further back "
        f"than that. Yet after two layers the newest token carries information from {n0(2 * WIN)} back, "
        f"and after all 32 from {n0(32 * WIN)}: about 130,000 tokens, in theory.",
        "In theory, because that is how far information can travel, not how much of it arrives. To "
        "cross the distance it is handed on 32 times through intermediate tokens, mixed at each layer "
        "with everything else they attend to. Mistral's paper itself calls it a theoretical attention "
        "span.",
    ])
    emit("o017", stamp("After 32 layers that reaches"),
         "Mistral 7B: a 4,096-token window, a 131,072-token reach in theory", yb + 30, b + [body],
         "The reach is real but thin. A window makes distant information possible, not dependable.")


# ---- b09: the rolling buffer ---------------------------------------------------------------------------------
MISTRAL_KV = 2 * 32 * 8 * 128 * 2                          # bytes per token: K and V, 32 layers, 8 KV heads
assert MISTRAL_KV == 131_072


def b09():
    W, NOW = 4, 13
    slots = {}
    for i in range(NOW):                                     # fill the buffer up to step 12
        slots[i % W] = i
    held = sorted(slots.values())
    assert held == [9, 10, 11, 12] and NOW % W == 1 and slots[NOW % W] == NOW - W
    b = [hd(40, 46, "The cache as W slots, drawn with W = 4: token i is stored in slot i mod 4")]
    X0, P, C = 120, 36, 31
    b.append(txt(40, 89, "token", "cap"))
    b.append(txt(40, 125, "slot", "cap"))
    for i in range(NOW + 1):
        x = X0 + i * P
        if i < NOW - W:
            b.append(ghost(x, 72, C, 26, label=str(i)))
        else:
            b.append(cell(x, 72, C, 26, "s" if i < NOW else "u", label=str(i)))
        b.append(txt(x + C / 2, 125, str(i % W), "sub2", "middle"))
    b.append(txt(X0 + 4 * P + C / 2, 156, "tokens 0 to 8: overwritten, gone", "sub2", "middle"))
    b.append(txt(X0 + 11 * P + C / 2, 156, "9 to 12 held, 13 arriving", "sub2", "middle"))
    # the buffer at step 13
    b.append(hd(40, 196, f"The buffer when token {NOW} arrives"))
    BX, BW = 120, 118
    for s_ in range(W):
        x = BX + s_ * (BW + 10)
        lab = f"slot {s_}: token {slots[s_]}"
        b.append(cell(x, 212, BW, 30, "h" if s_ == NOW % W else "s", label=lab))
    x1 = BX + (NOW % W) * (BW + 10) + BW / 2
    b.append(txt(x1, 262, f"{NOW} mod {W} = {NOW % W}: token {NOW} overwrites token {NOW - W} here", "sub2", "middle"))
    # Mistral 7B, to scale
    buf = WIN * MISTRAL_KV
    full32, full128 = 32768 * MISTRAL_KV, CTX * MISTRAL_KV
    assert buf == 512 * 2**20 and full32 / buf == 8 and full128 / buf == 32
    b.append(hd(40, 306, "Mistral 7B, one sequence, drawn to scale"))
    SC = 360 / full128
    rows = [("rolling buffer, any length", buf, "s", f"{f(buf / 1e9, 2)} GB (512 MiB)"),
            ("full cache at 32k tokens", full32, "h", f"{f(full32 / 1e9, 2)} GB"),
            ("full cache at 128k tokens", full128, "h", f"{f(full128 / 1e9, 1)} GB")]
    for k, (lab, v, c, note) in enumerate(rows):
        y = 322 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        w = v * SC
        b.append(cell(230, y, w, 26, c))
        b.append(txt(230 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(470, [
        "Once the window has moved past a token, nothing will ever attend to it again, so its key and "
        f"value can be thrown away. The cache becomes W slots, and token i is stored in slot i mod W, "
        f"the remainder when i is divided by W. Here 13 = 3 × 4 + 1, so token 13 goes to slot 1.",
        "At step 13 the slots hold tokens 9 to 12. Token 13 attends to them and to itself, then "
        "overwrites slot 1, where token 9 was: the entry W positions behind it, which no later token can "
        "see. Each new token does the same, and the cache stops growing.",
        f"In Mistral 7B one token's keys and values take 2 × 32 layers × 8 KV heads × 128 × 2 bytes = "
        f"{n0(MISTRAL_KV)} bytes, so {n0(WIN)} slots hold {f(buf / 1e9, 2)} GB. A full cache would be 8 times "
        f"that at 32k tokens, the saving Mistral's paper reports, and 32 times at 128k.",
    ])
    emit("b09", stamp("Each new token overwrites"),
         "A rolling buffer: token i goes to slot i mod W, and the cache stops growing", yb + 30, b + [body],
         "The one method in this part that deletes anything. It can, because the window guarantees "
         "nothing will ask for those tokens again.")


if __name__ == "__main__":
    for fn in (b05, b06, b07, b08, o017, b09):
        fn()
