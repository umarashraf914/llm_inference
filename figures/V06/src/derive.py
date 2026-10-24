"""V6 Part 12, the number, derived: Fig 22 (o022) as the setup, then P43 (one expert's shape), P44 (671
billion, counted), P45 (37 billion, counted) and P46 (the MoE calculator, a widget).

Sources: DeepSeek-V3 config.json (hidden 7,168; moe_intermediate 2,048; intermediate 18,432; 61 layers, the
first 3 dense; 256 routed + 1 shared; 8 per token; MLA ranks 1,536 and 512, heads 128 of 128 + 64;
vocabulary 129,280; untied embeddings; hidden_act silu) and its model card (671B main model; the 685B on
Hugging Face adds a 14B multi-token-prediction module). Mixtral's config for the calculator's second preset.

  python3 figures/V06/src/derive.py      writes o022, p43, p44, p45, p46 in figures/V06/items/
"""
import json, math
from common import (DS, MX, at, box, cell, dsv3, emit, emit_html, f, hd, ln, n, nb, pct, prose, rect, txt)

V = dsv3()
P = V["parts"]
D = DS["d"]


def b_(v, d=2):
    return f"{v / 1e9:,.{d}f} B" if v >= 1e7 else f"{v / 1e9:.4f} B"


# ---- Fig 22, the setup ---------------------------------------------------------------------------
def o022():
    b = [hd(40, 46, "Every piece is now in place")]
    facts = [("u", "The knowledge lives in the feed-forward block", "so that is what MoE splits"),
             ("u", "256 routed experts in every MoE layer", "plus one shared expert"),
             ("m", "The router runs just the top eight", "the shared expert runs alongside"),
             ("h", "Attention runs in full", "exactly as in a dense model")]
    for k, (cl, a, c) in enumerate(facts):
        y = 70 + k * 58
        b.append(box(40, y, 330, 40, cl, a))
        b.append(txt(386, y + 24, c, "sub2"))
    body, y = prose(70 + 4 * 58 + 34, [
        "This atlas opened on two numbers: 671 billion parameters held, 37 billion run for any single "
        "token. With the four facts above, both can be counted from DeepSeek V3's published shapes, one "
        "matrix at a time. The next three figures do exactly that.",
    ])
    emit("o022", at("Recall the number this video opened"), "Deriving the split", y + 32, b + [body],
         "Four facts, each built earlier in this atlas. The derivation is nothing more than them, "
         "multiplied out.")


# ---- P43: one expert -----------------------------------------------------------------------------
def p43():
    w = DS["ffn_expert"]
    per = D * w
    expert = 3 * per
    assert (per, expert) == (14_680_064, 44_040_192) == (per, V["expert"])
    b = [hd(40, 46, "One expert: two matrices widen the token, one narrows it, drawn to scale")]
    S = 250 / D                                          # px per row or column
    h_, w_ = w * S, D * S                                # 2,048 x 7,168 drawn as a wide, short block
    y0 = 70
    b.append(cell(40, y0, w_, h_, "m", label=f"gate: {n(D)} × {n(w)}"))
    b.append(cell(40, y0 + h_ + 10, w_, h_, "m", label=f"up: {n(D)} × {n(w)}"))
    b.append(cell(40, y0 + 2 * h_ + 20, w_, h_, "m", label=f"down: {n(w)} × {n(D)}"))
    for k, s in enumerate([f"{n(D)} numbers in, {n(w)} out", f"{n(D)} numbers in, {n(w)} out",
                           f"{n(w)} numbers in, {n(D)} back out"]):
        b.append(txt(40 + w_ + 16, y0 + k * (h_ + 10) + h_ / 2 + 4, s, "sub2"))
    ye = y0 + 3 * h_ + 20 + 24
    b.append(cell(40, ye, 230, 40, "u", rx=6, label=f"{n(D)} × {n(w)} = {n(per)}"))
    b.append(txt(284, ye + 25, "×  3  =", "sub2"))
    b.append(cell(338, ye, 160, 40, "m", rx=6, label=f"{n(expert)} weights"))
    body, y = prose(ye + 76, [
        f"Each expert is a gated feed-forward block, the three-matrix form noted in {{{{fig:v06-p06}}}}. "
        f"The token's {n(D)} numbers are multiplied by the gate and the up matrix, giving two lists of "
        f"{n(w)}. The gate's list goes through SiLU, x times the sigmoid of x ({{{{fig:v06-p20}}}}), and the "
        f"two lists are multiplied entry by entry. The down matrix takes the result back to {n(D)}.",
        f"Each matrix is {n(D)} × {n(w)} = {n(per)} weights, so an expert holds {n(expert)}: the 44 million "
        f"used throughout this atlas. Used once per token, that is {2 * expert / 1e6:.0f} million operations "
        "each time the expert runs.",
    ])
    emit("p43", at("We now have every piece needed to derive it"),
         "One DeepSeek V3 expert is three 7,168 × 2,048 matrices", y + 32, b + [body],
         "Every count of DeepSeek V3's experts rests on this one product. Change the 2,048 and every number "
         "in the next two figures moves with it.")


# ---- P44 and P45: the two counts ------------------------------------------------------------------
def rows(run):
    k = DS["k"] if run else DS["routed"]
    att_formula = f"{n(V['attn'])} × {DS['layers']}"
    return [
        ("attention (latent)", att_formula, P["attention"], "u"),
        ("dense blocks, layers 1-3", f"3 × {n(D)} × {n(DS['ffn_dense'])} × 3", P["dense_ffn"], "u"),
        ("routed experts", f"{n(V['expert'])} × {k} × {V['moe_layers']}", V["active_parts" if run else "parts"]["routed"], "m" if run else "h"),
        ("shared experts", f"{n(V['expert'])} × {V['moe_layers']}", P["shared"], "s"),
        ("routers", f"{DS['routed']} × {n(D)} × {V['moe_layers']}", P["routers"], "u"),
        ("embedding table", f"{n(DS['vocab'])} × {n(D)}", P["embed"], "u"),
        ("output head", f"{n(DS['vocab'])} × {n(D)}", P["head"], "u"),
        ("norms", f"{n(P['norms'])} numbers", P["norms"], "u"),
    ]


def table(b, rs, y0):
    XF, XV = 214, 640
    b.append(txt(XF, y0 - 14, "count", "sub2"))
    b.append(txt(XV, y0 - 14, "weights", "sub2", "end"))
    y = y0 + 6
    for lab, form, v, _ in rs:
        b.append(txt(40, y, lab, "cap"))
        b.append(txt(XF, y, form, "sub2"))
        b.append(txt(XV, y, b_(v), "sub2", "end"))
        y += 24
    b.append(ln(XF, y - 14, XV, y - 14, "tick"))
    return y + 8


def stacked(b, y, rs, total, width, x0=40, labels=True):
    xx = x0
    for lab, _, v, cl in rs:
        w = v / total * width
        if w >= 1:
            b.append(rect(xx, y, w, 30, cl, rx=0 if xx > x0 else 3))
        xx += w
    return xx


def p44():
    rs = rows(run=False)
    tot = sum(v for _, _, v, _ in rs)
    assert tot == V["total"] and round(tot / 1e9, 1) == 671.0
    assert pct(P["routed"] / tot) == "97.4%"
    b = [hd(40, 46, "Every weight DeepSeek V3 holds, by part")]
    y = table(b, rs, 92)
    b.append(txt(40, y, "total held", "cap"))
    b.append(cell(500, y - 18, 140, 26, "h", label=f"{tot / 1e9:,.2f} billion"))
    y += 34
    b.append(txt(40, y + 4, "to scale: routed experts (red) against everything else", "sub2"))
    stacked(b, y + 14, rs, tot, 600)
    body, yy = prose(y + 84, [
        "Each line is rows × columns, added up. Attention's 187.1 million a layer is five matrices: "
        f"queries compressed and expanded ({nb(f'{n(D)} × 1,536')} and {nb('1,536 × 24,576')}), keys and "
        f"values compressed and expanded ({nb(f'{n(D)} × 576')} and {nb('512 × 32,768')}), and the output "
        f"({nb(f'16,384 × {n(D)}')}), plus two small norms.",
        f"The routed experts are {pct(P['routed'] / tot)} of everything held, which is why the total is "
        "really a count of experts. The 685 billion published with the weights also includes a 14-billion "
        "module that predicts a second token ahead, used in training and left out of the 671.",
    ])
    emit("p44", at("plus one shared expert in every"), "671 billion, counted", yy + 32, b + [body],
         "The headline lands to within a rounding: 671.03 billion from the shapes alone. Nothing in it is "
         "estimated.")


def p45():
    rs = rows(run=True)
    run = sum(v for _, _, v, _ in rs)
    no_embed = run - P["embed"]
    assert run == V["active"] and round(run / 1e9, 2) == 37.55 and round(no_embed / 1e9, 1) == 36.6
    att_share = P["attention"] / run
    assert round(100 * att_share) == 30
    b = [hd(40, 46, "Every weight one token runs through, by part")]
    y = table(b, rs, 92)
    b.append(txt(40, y, "total run", "cap"))
    b.append(cell(500, y - 18, 140, 26, "m", label=f"{run / 1e9:,.2f} billion"))
    y += 34
    b.append(txt(40, y + 4, "held and run, drawn to one scale", "sub2"))
    held_rs = rows(run=False)
    stacked(b, y + 14, held_rs, V["total"], 600)
    stacked(b, y + 52, rs, V["total"], 600)
    b.append(txt(40 + run / V["total"] * 600 + 10, y + 72, f"{run / 1e9:.1f} B run", "sub2"))
    b.append(txt(40, y + 108, "the run bar alone, stretched to full width", "sub2"))
    stacked(b, y + 118, rs, run, 600)
    b.append(txt(40, y + 166, f"attention {pct(att_share, 0)}", "sub2"))
    b.append(txt(640, y + 166, f"routed experts {pct(V['active_parts']['routed'] / run, 0)}", "sub2", "end"))
    body, yy = prose(y + 210, [
        f"The same table with {DS['k']} routed experts per layer instead of {DS['routed']}: only that line "
        "changes. Everything else in the model runs for every token, as in a dense model.",
        f"Counted this way the total is {run / 1e9:.1f} billion. The embedding table is only looked up, one "
        f"row per token ({{{{fig:v01-o087}}}}); leave it out and the count is {no_embed / 1e9:.1f} billion. "
        "DeepSeek's report gives 37 billion.",
        f"Attention is {pct(att_share, 0)} of what a token runs, untouched by sparsity. Of the routed experts, "
        f"{pct(P['routed'] / V['total'])} of everything held, a token runs 8 of 256: "
        f"{pct(DS['k'] / DS['routed'])}.",
    ])
    emit("p45", at("Count what actually fired"), "37 billion, counted", yy + 32, b + [body],
         "Bars drawn to scale. Same model, same shapes, one line of the table changed: that line is the "
         "whole of mixture of experts.")


# ---- P46: the MoE calculator (a widget) ---------------------------------------------------------
ARCH = {
    "deepseek": dict(name="DeepSeek V3", d=DS["d"], layers=DS["layers"], dense=DS["dense_layers"],
                     ffn_dense=DS["ffn_dense"], attn=V["attn"], vocab=DS["vocab"], N=256, K=8, S=1, w=2048),
    "mixtral": dict(name="Mixtral", d=MX["d"], layers=MX["layers"], dense=0, ffn_dense=0,
                    attn=2 * MX["d"] * MX["heads"] * MX["head_dim"] + 2 * MX["d"] * MX["kv_heads"] * MX["head_dim"],
                    vocab=MX["vocab"], N=8, K=2, S=0, w=14336),
}
NS = [8, 16, 32, 64, 128, 256, 384, 512]
WS = [512, 1024, 1536, 2048, 3584, 7168, 14336]


def calc(a, N, K, S, w):
    d = a["d"]
    moe = a["layers"] - a["dense"]
    expert = 3 * d * w
    held = (a["layers"] * (a["attn"] + 2 * d) + a["dense"] * 3 * d * a["ffn_dense"]
            + moe * ((N + S) * expert + N * d) + 2 * a["vocab"] * d + d)
    run = held - a["vocab"] * d - moe * (N - K) * expert
    teams = 1.0
    for i in range(K):
        teams = teams * (N - i) / (i + 1)
    return dict(held=held, run=run, ops=2 * run, teams=teams)


SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def teams_text(c):
    if c < 1e6:
        return f"{round(c):,}"
    m, e = c, 0
    while m >= 10:
        m /= 10
        e += 1
    return f"{f(m, 1)} × 10{str(e).translate(SUP)}"


def outs(r):
    return {"held": f"{r['held'] / 1e9:,.1f} B", "run": f"{r['run'] / 1e9:,.1f} B",
            "mem": f"{r['held'] / 1e9:,.1f} GB", "ops": f"{r['ops'] / 1e9:,.1f} billion",
            "share": pct(r["run"] / r["held"]), "teams": teams_text(r["teams"])}


CX, CW = 200, 420                                       # held/run bars: left edge, width for the held count

P46_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const ARCH = __ARCH__, NS = __NS__, WS = __WS__, CX = __CX__, CW = __CW__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const one = v => group((v / 1e9).toFixed(1));
  const sup = s => s.replace(/[0-9]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
  function teams(c) {
    if (c < 1e6) return group(String(Math.round(c)));
    let m = c, e = 0; while (m >= 10) { m /= 10; e++; }
    return `${fmt(m, 1)} × 10${sup(String(e))}`;
  }
  function calc(a, N, K, S, w) {
    const d = a.d, moe = a.layers - a.dense, expert = 3 * d * w;
    const held = a.layers * (a.attn + 2 * d) + a.dense * 3 * d * a.ffn_dense + moe * ((N + S) * expert + N * d) + 2 * a.vocab * d + d;
    const run = held - a.vocab * d - moe * (N - K) * expert;
    let t = 1; for (let i = 0; i < K; i++) t = t * (N - i) / (i + 1);
    return {held, run, ops: 2 * run, teams: t};
  }
  const arch = () => ARCH[rad[0].checked ? 'deepseek' : 'mixtral'];
  function setTo(a) {
    sl[0].value = NS.indexOf(a.N); sl[1].value = a.K; sl[2].value = a.S; sl[3].value = WS.indexOf(a.w);
  }
  function draw() {
    const a = arch(), N = NS[+sl[0].value];
    if (+sl[1].value > N) sl[1].value = N;
    const K = +sl[1].value, S = +sl[2].value, w = WS[+sl[3].value];
    [String(N), String(K), String(S), group(String(w))].forEach((s, i) => val[i].textContent = s);
    const r = calc(a, N, K, S, w), set = (k, v) => q(`[data-r="${k}"]`).textContent = v;
    set('held', one(r.held) + ' B'); set('run', one(r.run) + ' B'); set('mem', one(r.held) + ' GB');
    set('ops', one(r.ops) + ' billion'); set('share', fmt(100 * r.run / r.held, 1) + '%'); set('teams', teams(r.teams));
    set('name', a.name);
    const big = Math.max(r.held, 1);
    q('[data-bar="run"]').setAttribute('width', Math.max(r.run / big * CW, 2).toFixed(1));
  }
  sl.forEach(s => s.addEventListener('input', draw));
  rad.forEach(r => r.addEventListener('change', () => { setTo(arch()); draw(); }));
  q('button').addEventListener('click', () => { rad[0].checked = true; setTo(ARCH.deepseek); draw(); });
  draw();
})();</script>"""


def p46():
    ds, mx = ARCH["deepseek"], ARCH["mixtral"]
    r0 = calc(ds, ds["N"], ds["K"], ds["S"], ds["w"])
    rm = calc(mx, mx["N"], mx["K"], mx["S"], mx["w"])
    assert r0["held"] == V["total"] and r0["run"] == V["active_no_embed"]
    assert round(rm["held"] / 1e9, 1) == 46.7 and round(rm["run"] / 1e9, 2) == 12.75
    assert teams_text(calc(ds, 64, 8, 0, 2048)["teams"]) == "4.4 × 10⁹"
    o = outs(r0)
    b = [f'<text class="hd" x="40" y="34">The calculator, set to <tspan data-r="name">{ds["name"]}</tspan></text>']
    lines = [("held", "held, every weight", ""), ("mem", "memory at one byte a weight", ""),
             ("run", "run per token", ""), ("share", "run as a share of held", ""),
             ("ops", "operations per token", ""), ("teams", "possible teams of experts", "")]
    for k, (key, lab, _) in enumerate(lines):
        y = 66 + k * 24
        b.append(f'<text class="sub2" x="40" y="{y}">{lab}: <tspan data-r="{key}">{o[key]}</tspan></text>')
    yb = 66 + 6 * 24 + 10
    b.append(txt(40, yb + 19, "held", "cap"))
    b.append(rect(CX, yb, CW, 26, "h"))
    b.append(txt(40, yb + 55, "run per token", "cap"))
    b.append(f'<g class="m"><rect x="{CX}" y="{yb + 36}" width="{max(r0["run"] / r0["held"] * CW, 2):.1f}" '
             f'height="26" rx="3" data-bar="run"/></g>')
    b.append(txt(CX, yb + 82, "to scale, against the model as held", "sub2"))
    body, yy = prose(yb + 126, [
        "Pick a model, then turn its MoE dials. The routed experts N and the expert width set what is held; "
        "the experts per token K and the shared experts set what runs. Attention, the dense layers and the "
        "embeddings stay as published.",
        "Held is every weight. Run counts the weights a token is multiplied by, so it leaves out the "
        "embedding table, which is only looked up. The presets give DeepSeek V3's 671.0 and 36.6 billion and "
        "Mixtral's 46.7 and 12.7 billion; the published 37 and 12.9 differ only in how they count the "
        "embedding table ({{fig:v06-p45}}, {{fig:v06-p11}}).",
        "A cluster holds the full set, every expert resident on some GPU, and ships each token to the "
        "experts it picked: per-token compute tracks what runs while memory tracks what is held. That "
        "decoupling is what lets totals keep climbing. The early DeepSeek V4 Pro figures reach 1.6 trillion "
        "total parameters, with the active count still in the tens of billions. The calculator's "
        "arithmetic was checked against Python.",
    ])
    title = "The MoE calculator"
    ctl1 = ("<label class='opt'><input type='radio' name='v06-p46-model' value='deepseek' checked> DeepSeek V3</label>"
            "<label class='opt'><input type='radio' name='v06-p46-model' value='mixtral'> Mixtral</label>"
            "<button type='button'>Reset</button>")
    ctl2 = (f"<label>routed experts N <input type='range' min='0' max='{len(NS) - 1}' step='1' value='{NS.index(ds['N'])}'>"
            f"<span class='val'>{ds['N']}</span></label>"
            f"<label>experts per token K <input type='range' min='1' max='16' step='1' value='{ds['K']}'>"
            f"<span class='val'>{ds['K']}</span></label>"
            f"<label>shared experts <input type='range' min='0' max='2' step='1' value='{ds['S']}'>"
            f"<span class='val'>{ds['S']}</span></label>"
            f"<label>expert width <input type='range' min='0' max='{len(WS) - 1}' step='1' value='{WS.index(ds['w'])}'>"
            f"<span class='val'>{n(ds['w'])}</span></label>")
    arch_js = {k: {kk: vv for kk, vv in a.items()} for k, a in ARCH.items()}
    js = (P46_JS.replace("__ARCH__", json.dumps(arch_js)).replace("__NS__", json.dumps(NS))
          .replace("__WS__", json.dumps(WS)).replace("__CX__", str(CX)).replace("__CW__", str(CW)))
    emit_html("p46", f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
              f"{at('lets totals keep climbing')}</div><h3>{title}</h3><div class='wg'><div class='ctl'>{ctl1}</div>"
              f"<div class='ctl'>{ctl2}</div><svg viewBox='0 0 680 {yy + 26}' role='img'><title>{title}</title>"
              f"{''.join(b)}{body}</svg></div>"
              "<figcaption>The two dials of the mechanism, with the rest of a real model attached. Double N and "
              "the memory nearly doubles while the work stays put; double K and only the work moves."
              f"</figcaption>{js}</figure>")


if __name__ == "__main__":
    for fn in (o022, p43, p44, p45, p46):
        fn()
