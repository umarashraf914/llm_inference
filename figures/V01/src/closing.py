"""V01 Part 16, where that leaves us: o146 with the factor of 300 stated as a division that passes its own
unit test (review section 5.1, #1), and proposal 36, any model on any chip, as a widget.

  python3 figures/V01/src/closing.py
"""
import json

from common import (cell, arr, txt, hd, eq, prose, emit, widget, tag, st, f, g, rnd, W_BYTES, KV_PER_TOKEN,
                    PEAK, BW, RIDGE, CHIPS, JS_FMT)
from roof import sig3

# ---- o146: the 300 is a ratio of two rates ------------------------------------------------------
RATE_BW = BW / W_BYTES                             # tokens a second the bandwidth allows
RATE_MATH = PEAK / W_BYTES                         # tokens a second the arithmetic alone would allow
assert round(RATE_BW, 1) == 23.9 and round(RATE_MATH) == 7064
assert abs(RATE_MATH / RATE_BW - RIDGE) < 1e-9 and round(RIDGE) == 295

# ---- 36: any model, any chip --------------------------------------------------------------------
# Llama 3 configs (config.json, NousResearch mirrors of Meta's files, read 2026-10-24):
#   70B: hidden 8192, 80 layers, 8 KV heads of 128;  8B: hidden 4096, 32 layers, 8 KV heads of 128.
# Weights are the round counts of the names. Caches are 16-bit: 2 (K and V) x layers x 8 x 128 x 2 bytes.
MODELS = {
    "70B": dict(n=70e9, d=8192, layers=80, kv=2 * 80 * 8 * 128 * 2),
    "8B": dict(n=8e9, d=4096, layers=32, kv=2 * 32 * 8 * 128 * 2),
}
assert MODELS["70B"]["kv"] == KV_PER_TOKEN and MODELS["8B"]["kv"] == 131_072
BITS = [16, 8, 4]
CTXS = [0, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000]
BATCHES = [1, 2, 4, 8, 16, 32, 64, 128, 256]
PRICES = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
START = dict(model="70B", bits=16, chip="H100", ctx=0, batch=1, price=3)


def step(model, bits, chip, ctx, batch):
    """One decode step for a batch: bytes read, operations done, and the time, the longer of the two."""
    m, c = MODELS[model], CHIPS[chip]
    wb = m["n"] * bits / 8                          # weights, read once per step and shared by the batch
    cb = batch * ctx * m["kv"]                      # every request reads its own cache
    ops = batch * (2 * m["n"] + 4 * m["d"] * m["layers"] * ctx)   # weights, then attention's scores and blend
    t_read, t_math = (wb + cb) / c["bw"], ops / c["peak"]
    return dict(wb=wb, cb=cb, read=t_read, math=t_math, t=max(t_read, t_math),
                bound="memory" if t_read >= t_math else "compute", mem=wb + cb, cap=c["cap"])


def p36_lines(model, bits, chip, ctx, batch, price):
    s = step(model, bits, chip, ctx, batch)
    total = batch / s["t"]
    return [f"each step reads {sig3(s['wb'] / 1e9)} GB of weights and {sig3(s['cb'] / 1e9)} GB of caches",
            f"one step: {sig3(s['t'] * 1e3)} ms, {s['bound']} bound",
            f"tokens a second: {sig3(1 / s['t'])} for each user, {sig3(total)} in total",
            f"arithmetic units busy: {sig3(100 * s['math'] / s['t'])}% of the step",
            f"at ${f(price, 2)} an hour: ${sig3(price / (total * 3600) * 1e6)} per million tokens",
            f"memory needed: {sig3(s['mem'] / 1e9)} GB, where one {chip} holds {g(s['cap'] / 1e9)} GB"]


def bars(model, bits, chip, ctx, batch):
    """Widths of the reading and arithmetic bars: the longer one is 380 px, the other to scale."""
    s = step(model, bits, chip, ctx, batch)
    top = max(s["read"], s["math"])
    return rnd(380 * s["read"] / top), rnd(380 * s["math"] / top)


S0 = step(**{k: START[k] for k in ("model", "bits", "chip", "ctx", "batch")})
assert f(S0["t"] * 1e3, 1) == "41.8" and S0["bound"] == "memory"
assert p36_lines(**START)[4] == "at $3.00 an hour: $34.8 per million tokens"
assert p36_lines(**START)[5].endswith("one H100 holds 80 GB")
SEEDS = [("70B", 16, "H100"), ("70B", 16, "H200"), ("8B", 16, "H100"), ("70B", 4, "B200")]
SEED_MS = [sig3(step(m, b, c, 0, 1)["t"] * 1e3) for m, b, c in SEEDS]
assert SEED_MS == ["41.8", "29.2", "4.78", "4.38"]


def o146():
    b = [hd(40, 46, "The factor of 300, as one division")]
    rows = [(f"bandwidth ÷ bytes per token  =  3.35 TB/s ÷ 140 GB  =  {f(RATE_BW, 1)} tokens/s", "h"),
            (f"peak ÷ operations per token  =  989 T/s ÷ 140 billion  =  {g(RATE_MATH)} tokens/s", "m"),
            (f"{g(RATE_MATH)} ÷ {f(RATE_BW, 1)}  =  {round(RIDGE)}:  the ridge ÷ an intensity of 1", "u")]
    for k, (s, c) in enumerate(rows):
        b.append(eq(60, 66 + 46 * k, 560, s, c, h=36))
    body1, y1 = prose(66 + 3 * 46 + 22, [
        "The gap between what the arithmetic implies and what the chip delivers is not a mystery. Bandwidth "
        "divided by bytes per token is the rate decode actually gets; the factor of 300 is how far that "
        "falls short of the rate the arithmetic alone would allow ({{fig:v01-p22}})."])
    b.append(body1)
    y = y1 + 50
    b.append(hd(40, y, "The chain, in five links"))
    links = [("compute outgrows bandwidth", "s"), ("a forward pass streams every weight", "s"),
             ("prefill amortises, decode does not", "s"), ("the KV cache adds to the bill", "m"),
             ("the user feels TTFT and TPOT; the operator optimises goodput", "m")]
    y += 22
    for k, (s, c) in enumerate(links):
        if k:
            b.append(arr(300, y - 8, 300, y - 2))
        b.append(cell(60, y, 480, 32, c, rx=4, label=s))
        y += 42
    body, yb = prose(y + 26, ["Every link is a division or a multiplication that can be done by hand."])
    emit("o146", st("Let's recap where we are"), "The recap", yb + 22, b + [body],
         "Five sentences that between them explain the thirty milliseconds. Nothing in the chain requires "
         "anything beyond arithmetic.")


def p36():
    s0 = dict(START)
    lines = p36_lines(**s0)
    wr, wm = bars(*(s0[k] for k in ("model", "bits", "chip", "ctx", "batch")))
    st0 = step(*(s0[k] for k in ("model", "bits", "chip", "ctx", "batch")))
    b = [hd(40, 34, "Bytes per token over bandwidth, for any of these choices")]
    for k, (lab, w, c, t) in enumerate([("reading", wr, "h", st0["read"]), ("arithmetic", wm, "m", st0["math"])]):
        y = 56 + 40 * k
        b.append(txt(40, y + 19, lab, "cap"))
        b.append(f'<g class="{c}"><rect data-bar="{k}" x="160" y="{y}" width="{w}" height="28" rx="2"/></g>')
        b.append(tag("text", {"class": "sub2", "x": rnd(160 + w + 10), "y": y + 19, "data-bl": k},
                     f"{sig3(t * 1e3)} ms"))
    for k, s in enumerate(lines):
        b.append(tag("text", {"class": "sub2", "x": 40, "y": 160 + 22 * k, "data-r": k}, s))
    yt = 160 + 22 * len(lines) + 22
    b.append(hd(40, yt, "Four settings to try, with no cache and one request"))
    for c_, h in zip([60, 200, 300, 420], ["model", "chip", "weights", "one step"]):
        b.append(txt(c_, yt + 26, h, "sub2"))
    for k, ((m, bt, chip), ms) in enumerate(zip(SEEDS, SEED_MS)):
        y = yt + 50 + 22 * k
        for c_, v in zip([60, 200, 300, 420], [f"Llama 3 {m}", chip, f"{bt}-bit", f"{ms} ms"]):
            b.append(txt(c_, y, v, "sub2"))
    body, yb = prose(yt + 50 + 22 * 4 + 22, [
        "Decode reads every weight and every cached key and value once per step, so a step takes the bytes "
        "divided by the bandwidth, unless the arithmetic takes longer. That is the whole method of this atlas: "
        "the 30 milliseconds of the opening ({{fig:v01-o067}}) from two hardware numbers, for any model on any "
        "chip.",
        "Fewer bits shrink the weights' bytes; a batch shares them; a long context adds bytes that are not "
        "shared. Each later video of the series moves one of these terms.",
        "Weights are the round 70 and 8 billion of the names, stored in the bits chosen and multiplied in "
        "16-bit; caches are 16-bit, 327,680 bytes a token for the 70B and 131,072 for the 8B; the price is "
        "illustrative. Memory beyond one chip's is counted as if one chip held it all ({{fig:v01-o014}}). The "
        "readouts were checked against Python at every setting.",
    ])
    js = JS_FMT + r"""
  const sig3 = v => { if (v === 0) return '0'; const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(v))));
    return gx(v, d); };
  const fig = document.currentScript.closest('figure');
  const M = __M__, C = __C__, CTXS = __CTXS__, BS = __BS__, PR = __PR__, S0 = __S0__;
  const sl = [...fig.querySelectorAll('input[type=range]')], vals = [...fig.querySelectorAll('.val')];
  const rad = n => [...fig.querySelectorAll(`input[name="v01-p36-${n}"]`)], q = s => fig.querySelector(s);
  const pick = n => rad(n).find(r => r.checked).value;
  function draw() {
    const model = pick('model'), bits = +pick('bits'), chip = pick('chip');
    const ctx = CTXS[+sl[0].value], batch = BS[+sl[1].value], price = PR[+sl[2].value];
    vals[0].textContent = gx(ctx); vals[1].textContent = gx(batch); vals[2].textContent = '$' + fx(price, 2);
    const m = M[model], c = C[chip];
    const wb = m.n * bits / 8, cb = batch * ctx * m.kv, ops = batch * (2 * m.n + 4 * m.d * m.layers * ctx);
    const tr = (wb + cb) / c.bw, tm = ops / c.peak, t = Math.max(tr, tm), total = batch / t;
    const L = [`each step reads ${sig3(wb / 1e9)} GB of weights and ${sig3(cb / 1e9)} GB of caches`,
      `one step: ${sig3(t * 1e3)} ms, ${tr >= tm ? 'memory' : 'compute'} bound`,
      `tokens a second: ${sig3(1 / t)} for each user, ${sig3(total)} in total`,
      `arithmetic units busy: ${sig3(100 * tm / t)}% of the step`,
      `at $${fx(price, 2)} an hour: $${sig3(price / (total * 3600) * 1e6)} per million tokens`,
      `memory needed: ${sig3((wb + cb) / 1e9)} GB, where one ${chip} holds ${gx(c.cap / 1e9)} GB`];
    L.forEach((s, k) => q(`[data-r="${k}"]`).textContent = s);
    [tr, tm].forEach((v, k) => {
      const w = +(380 * v / t).toFixed(1);
      q(`[data-bar="${k}"]`).setAttribute('width', w);
      const lb = q(`[data-bl="${k}"]`); lb.setAttribute('x', +(160 + w + 10).toFixed(1));
      lb.textContent = `${sig3(v * 1e3)} ms`;
    });
  }
  sl.forEach(s => s.addEventListener('input', draw));
  ['model', 'bits', 'chip'].forEach(n => rad(n).forEach(r => r.addEventListener('change', draw)));
  q('button').addEventListener('click', () => {
    ['model', 'bits', 'chip'].forEach(n => rad(n).forEach(r => r.checked = r.value === String(S0[n])));
    sl[0].value = CTXS.indexOf(S0.ctx); sl[1].value = BS.indexOf(S0.batch); sl[2].value = PR.indexOf(S0.price);
    draw();
  });
  draw();""".replace("__M__", json.dumps(MODELS)).replace("__C__", json.dumps(CHIPS)) \
        .replace("__CTXS__", json.dumps(CTXS)).replace("__BS__", json.dumps(BATCHES)) \
        .replace("__PR__", json.dumps(PRICES)).replace("__S0__", json.dumps(START))

    def radios(name, opts, cur, fmt):
        return "".join(f"<label class='opt'><input type='radio' name='v01-p36-{name}' value='{o}'"
                       f"{' checked' if o == cur else ''}> {fmt(o)}</label>" for o in opts)

    ctl = [radios("model", list(MODELS), START["model"], lambda o: f"Llama 3 {o}") +
           radios("bits", BITS, START["bits"], lambda o: f"{o}-bit weights"),
           radios("chip", list(CHIPS), START["chip"], str),
           f"<label>context <input type='range' min='0' max='{len(CTXS) - 1}' step='1' "
           f"value='{CTXS.index(START['ctx'])}'><span class='val'>{g(START['ctx'])}</span></label>"
           f"<label>batch <input type='range' min='0' max='{len(BATCHES) - 1}' step='1' "
           f"value='{BATCHES.index(START['batch'])}'><span class='val'>{g(START['batch'])}</span></label>",
           f"<label>price per hour <input type='range' min='0' max='{len(PRICES) - 1}' step='1' "
           f"value='{PRICES.index(START['price'])}'><span class='val'>${f(START['price'], 2)}</span></label>"
           "<button type='button'>Reset</button>"]
    widget("p36", st("It is bandwidth divided by"), "Any model, any chip: bytes per token over bandwidth", ctl,
           yb + 22, b + [body],
           "The opening's promise, kept: the time per token from bytes and bandwidth, for either of these models "
           "on any of these chips.", js)


if __name__ == "__main__":
    for fn in (o146, p36):
        fn()
