"""V7 Part 8, refusing work: o018 trimmed to an introduction (review §5 item 25), then b51–b54
(P51–P54).

  o018  three ways the scheduler defends goodput, with the systems named
  b51   taking requests in turn hands the machine to the heaviest tenant
  b52   widget: the virtual token counter, decision by decision (Sheng et al. 2024: the counter adds
        input tokens on admission and output tokens as they are generated; its experiments weight
        them 1 and 2, after OpenAI's pricing)
  b53   admission control on the step-time model: 55 requests all late, 47 all on time
  b54   the right prefill:decode split follows the traffic (rates from the 96-GPU SGLang run)

  python3 figures/V07/src/refuse.py
"""
from bcommon import (SRT, BW, JS_FMT, KV8, W8, box, cell, emit, emit_widget, f, g, ghost, hd, js_fill,
                     ln, pc, prose, stamp, txt)

# ---- o018 ---------------------------------------------------------------------------------------
def o018():
    b = [hd(40, 46, "Three ways the scheduler defends goodput")]
    for x, w, t1, t2, t3 in [(40, 190, "Fair sharing", "count tokens, not requests", "virtual token counter"),
                             (246, 190, "Admission control", "refuse what cannot finish", "Mooncake's early rejection"),
                             (452, 188, "Autoscaling", "reshape the pools", "NVIDIA Dynamo's planner")]:
        b.append(box(x, 70, w, 82, "s", t1, t2, t3))
    body, yb = prose(196, [
        "When one deployment serves many customers, and more requests arrive than it can finish in "
        "time, the scheduler has to decide whose work runs, what to turn away, and how many GPUs each "
        "pool gets. The next four figures take these in turn.",
    ])
    emit("o018", stamp(SRT, "When one deployment serves many"),
         "Defending goodput means deciding what to refuse", yb + 32, b + [body],
         "The counter-intuitive one is admission control. Accepting less work can be the only way to "
         "deliver more of it on time.")


# ---- b51: requests against tokens ---------------------------------------------------------------
A_TOK = 80                                       # tokens of prompt and answer in one of A's requests


def b51():
    def strip(y, k, label):
        sizes = [A_TOK if i % 2 == 0 else A_TOK * k for i in range(12)]
        tot = sum(sizes)
        sc = 560 / tot
        x = 60
        b.append(txt(40, y - 8, label, "sub2"))
        for i, sz in enumerate(sizes):
            w = sz * sc
            b.append(cell(round(x, 2), y, max(round(w - 1.5, 2), 1.0), 26, "s" if i % 2 == 0 else "m",
                          label=("A" if i % 2 == 0 else "B") if w > 22 else None))
            x += w
        share = 6 * A_TOK * k / tot
        return share
    b = [hd(40, 46, "Twelve turns taken one request each, drawn as GPU time to scale")]
    s5 = strip(88, 5, "B's requests five times A's")
    s100 = strip(156, 100, "B's requests a hundred times A's: A's turns are slivers")
    assert round(s5, 3) == 0.833 and round(s100, 3) == 0.990
    b.append(cell(60, 196, 12, 12, "s")); b.append(txt(78, 206, "A's request", "sub2"))
    b.append(cell(170, 196, 12, 12, "m")); b.append(txt(188, 206, "B's request", "sub2"))
    body, yb = prose(246, [
        f"Two customers, or tenants, share one deployment. A sends short requests, {A_TOK} tokens of prompt and "
        "answer each; B sends long ones. A scheduler that takes one request from each in turn looks "
        "fair: each gets half the requests.",
        f"But the machine's work is tokens, not requests. With B's requests five times A's, B gets 6 × "
        f"{5 * A_TOK} = {g(6 * 5 * A_TOK)} of {g(6 * A_TOK * 6)} tokens of work, {pc(s5)}. One request "
        f"can be a hundred times the size of another, and then B gets {pc(s100)}, while A waits behind "
        "a hundred times its own work for every request it sends.",
    ])
    emit("b51", stamp(SRT, "out the rest and counting requests will"),
         "Counting requests hands the machine to the heaviest tenant", yb + 32, b + [body],
         "Drawn to scale. Taking turns is fair to requests, not to customers: the heavy tenant takes "
         "the machine without ever sending more often.")


# ---- b52: the virtual token counter (widget) ----------------------------------------------------
A_IN, A_OUT, WP, WQ = 60, 20, 1, 2              # A's request; weights for input and output tokens
STEPS = 12


def cost(k):
    """Units the counter adds for one request of A, and one of B (k times A's in and out)."""
    a = WP * A_IN + WQ * A_OUT
    return a, a * k


def decide(mode, k, n=STEPS):
    """Returns per decision: (A's counter before, B's before, who is served)."""
    ca = cb = 0
    ua, ub = cost(k)
    out = []
    for i in range(n):
        if mode == "turns":
            who = "A" if i % 2 == 0 else "B"
        else:
            who = "A" if ca <= cb else "B"
        out.append((ca, cb, who))
        if who == "A":
            ca += ua
        else:
            cb += ub
    return out, ca, cb


K0 = 5

WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__, D = __D__;
  __FMT__
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  const [stepB, runB, clearB, resetB] = fig.querySelectorAll('button');
  let n = D.n;
  function decide(mode, k, steps) {
    let ca = 0, cb = 0; const ua = C.WP * C.AIN + C.WQ * C.AOUT, ub = ua * k, out = [];
    for (let i = 0; i < steps; i++) {
      const who = mode === 'turns' ? (i % 2 === 0 ? 'A' : 'B') : (ca <= cb ? 'A' : 'B');
      out.push([ca, cb, who]); if (who === 'A') ca += ua; else cb += ub;
    }
    return [out, ca, cb, ua, ub];
  }
  function draw() {
    const k = +sl.value, mode = rad[1].checked ? 'turns' : 'vtc';
    val.textContent = `${k}×`;
    const [rows, ca, cb, ua, ub] = decide(mode, k, n), [all] = decide(mode, k, C.N);
    for (let i = 0; i < C.N; i++) {
      const has = i < n, r = all[i];
      [['a', has ? gx(r[0]) : ''], ['b', has ? gx(r[1]) : ''], ['w', has ? r[2] : '']].forEach(([key, s]) => {
        q(`[data-${key}="${i}"]`).textContent = s;
      });
      const cellg = q(`[data-cw="${i}"]`);
      cellg.setAttribute('class', has ? (r[2] === 'A' ? 's' : 'm') : 'u');
    }
    const pt = q('[data-ptr]');
    if (n < C.N) { pt.style.display = ''; pt.setAttribute('x', (C.X0 + n * C.P + C.P / 2 - 3).toFixed(1)); }
    else pt.style.display = 'none';
    const total = 6 * ua + 6 * ub, sc = C.W / total, strip = q('[data-strip]');
    while (strip.firstChild) strip.removeChild(strip.firstChild);
    let x = C.SX;
    rows.forEach(r => {
      const w = (r[2] === 'A' ? ua : ub) * sc, g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      g.setAttribute('class', r[2] === 'A' ? 's' : 'm');
      rect.setAttribute('x', x.toFixed(2)); rect.setAttribute('y', C.SY); rect.setAttribute('height', 22);
      rect.setAttribute('width', Math.max(w - 1.5, 1).toFixed(2)); rect.setAttribute('rx', 2);
      g.appendChild(rect); strip.appendChild(g); x += w;
    });
    const na = rows.filter(r => r[2] === 'A').length, nb = rows.length - na;
    const sa = na * ua, sb = nb * ub;
    q('[data-sum]').textContent = n ? `after ${n} choices: A served ${na} requests, ${gx(sa)} units; B served ${nb}, ${gx(sb)} units; B's share ${pcx(sb / (sa + sb))}` : 'no choices made yet';
    q('[data-next]').textContent = n < C.N ? `next: ${mode === 'turns' ? (n % 2 === 0 ? 'A, its turn' : 'B, its turn') : (ca <= cb ? `A, counter ${gx(ca)} against ${gx(cb)}` : `B, counter ${gx(cb)} against ${gx(ca)}`)}` : 'all twelve made';
    stepB.disabled = runB.disabled = n >= C.N;
  }
  stepB.addEventListener('click', () => { if (n < C.N) n++; draw(); });
  runB.addEventListener('click', () => { n = C.N; draw(); });
  clearB.addEventListener('click', () => { n = 0; draw(); });
  resetB.addEventListener('click', () => { n = D.n; sl.value = D.k; rad[0].checked = true; draw(); });
  sl.addEventListener('input', draw); rad.forEach(r => r.addEventListener('change', draw));
  draw();
})();</script>"""


def b52():
    rows, ca, cb = decide("vtc", K0)
    ua, ub = cost(K0)
    who = [r[2] for r in rows]
    assert (ua, ub) == (100, 500) and who.count("A") == 10 and (ca, cb) == (1000, 1000)
    t_rows, tca, tcb = decide("turns", K0)
    assert (tca, tcb) == (600, 3000) and round(tcb / (tca + tcb), 3) == 0.833
    for k in range(1, 21):                       # the counter keeps service within one request's worth
        r_, a_, b_ = decide("vtc", k)
        assert abs(a_ - b_) <= max(cost(k))
    X0, P, W, SX, SY = 150, 40, 560, 60, 214
    s = [hd(40, 34, "Each choice goes to the tenant whose counter is lower; a tie goes to A")]
    s.append(txt(40, 66, "choice", "cap"))
    for i in range(STEPS):
        s.append(txt(X0 + i * P + P / 2, 66, f"{i + 1}", "sub2", "middle"))
    s.append(txt(40, 92, "A's counter", "cap"))
    s.append(txt(40, 118, "B's counter", "cap"))
    s.append(txt(40, 146, "served", "cap"))
    for i, (a_, b_, w_) in enumerate(rows):
        x = X0 + i * P
        s.append(f'<text class="sub2" x="{x + P / 2}" y="92" text-anchor="middle" data-a="{i}">{g(a_)}</text>')
        s.append(f'<text class="sub2" x="{x + P / 2}" y="118" text-anchor="middle" data-b="{i}">{g(b_)}</text>')
        s.append(f'<g class="{"s" if w_ == "A" else "m"}" data-cw="{i}"><rect x="{x + 6}" y="128" width="{P - 12}" '
                 f'height="26" rx="3"/><text class="sub" x="{x + P / 2}" y="141" text-anchor="middle" '
                 f'dominant-baseline="central" data-w="{i}">{w_}</text></g>')
    s.append(f'<rect data-ptr="" x="0" y="160" width="6" height="6" style="display:none;fill:var(--h)"/>')
    s.append(txt(40, SY - 10, "GPU time, to scale", "sub2"))
    sc = W / (6 * ua + 6 * ub)
    x, bars = SX, []
    for r in rows:
        w_ = (ua if r[2] == "A" else ub) * sc
        bars.append(f'<g class="{"s" if r[2] == "A" else "m"}"><rect x="{x:.2f}" y="{SY}" height="22" '
                    f'width="{max(w_ - 1.5, 1):.2f}" rx="2"/></g>')
        x += w_
    s.append(f'<g data-strip="">{"".join(bars)}</g>')
    na = who.count("A")
    s.append(f'<text class="sub2" x="40" y="{SY + 48}" data-sum="">after {STEPS} choices: A served {na} '
             f'requests, {g(na * ua)} units; B served {STEPS - na}, {g((STEPS - na) * ub)} units; B\'s share '
             f'{pc((STEPS - na) * ub / (na * ua + (STEPS - na) * ub))}</text>')
    s.append(f'<text class="sub2" x="40" y="{SY + 66}" data-next="">all twelve made</text>')
    body, yb = prose(SY + 106, [
        "The virtual token counter, from a 2024 fairness paper by Sheng and colleagues, keeps a running "
        "total for each tenant of the input and output tokens it has been served, and always serves "
        f"whoever has received least. Here a request is charged its input tokens plus twice its "
        f"output tokens, the weighting the paper's experiments used: A's {A_IN} in and {A_OUT} out "
        f"count {ua}, and B's, five times larger, {ub}. The paper adds output tokens as they are "
        "generated; serving one request at a time, as here, that comes to the same total.",
        f"Step through it: B is served once and its counter jumps to {ub}, so A is served until it "
        f"catches up, then B again. After twelve choices A has had {na} requests and B {STEPS - na}, "
        f"and each has received {g(ca)} units. Switch to taking turns and B takes "
        f"{pc(tcb / (tca + tcb))} of the machine.",
        "A tenant that arrives late starts at the lowest counter among those waiting, not at zero, so "
        "it cannot claim credit for time it was away. The choices were checked against the same rule "
        "in Python for every size from 1 to 20.",
    ])
    ctl = [f"<label>B's requests, times A's <input type='range' min='1' max='20' step='1' value='{K0}'>"
           f"<span class='val'>{K0}×</span></label>"
           "<label class='opt'><input type='radio' name='v07-b52-mode' value='vtc' checked> virtual token counter</label>"
           "<label class='opt'><input type='radio' name='v07-b52-mode' value='turns'> take turns</label>",
           "<button type='button'>Step</button><button type='button'>Run to 12</button>"
           "<button type='button'>Start over</button><button type='button'>Reset</button>"]
    js = js_fill(WIDGET_JS.replace("__FMT__", JS_FMT),
                 C=dict(WP=WP, WQ=WQ, AIN=A_IN, AOUT=A_OUT, N=STEPS, X0=X0, P=P, W=W, SX=SX, SY=SY),
                 D=dict(n=STEPS, k=K0))
    emit_widget("b52", stamp(SRT, "The virtual token counter from a 2024"),
                "The virtual token counter serves whoever has had least", ctl, "".join(s) + body, yb + 26,
                "Fairness measured in work rather than in requests. The heavy tenant still gets its "
                "share, but in proportion to what it consumes, not to how often it asks.", js)


# ---- b53: admission control ---------------------------------------------------------------------
CTX8K, TARGET = 8192, 0.020
POOL = 80e9 - W8 - 4e9


def step(n):
    return (W8 + n * CTX8K * KV8) / BW


def b53():
    per = CTX8K * KV8
    fit_mem = int(POOL // per)
    fit_slo = max(n for n in range(1, fit_mem + 1) if step(n) <= TARGET)
    assert (fit_mem, fit_slo) == (55, 47) and step(48) > TARGET
    t47, t55 = step(47), step(55)
    thr47, thr55 = 47 / t47, 55 / t55
    assert round(t47 * 1e3, 2) == 19.86 and round(t55 * 1e3, 2) == 22.42
    assert round(thr47) == 2367 and round(thr55) == 2453
    b = [hd(40, 46, "One decode step, to scale: the weights read once, then every request's cache")]
    X0, SC = 150, 18000                        # px per second: 20 ms = 360 px
    wt = W8 / BW
    for k, (n, t) in enumerate([(47, t47), (55, t55)]):
        y = 74 + k * 50
        b.append(txt(40, y + 18, f"{n} requests", "cap"))
        b.append(cell(X0, y, wt * SC, 28, "u", label="weights"))
        late = t > TARGET
        b.append(cell(X0 + wt * SC, y, (t - wt) * SC, 28, "h" if late else "s",
                      label=f"{n} caches, {f(n * per / 1e9, 1)} GB"))
        b.append(txt(X0 + t * SC + 8, y + 18, f"{f(t * 1e3, 1)} ms", "sub2"))
    xt = X0 + TARGET * SC
    b.append(ln(xt, 64, xt, 74 + 50 + 38, "mark xok"))
    b.append(txt(xt, 182, "20 ms target", "sub2", "middle"))
    rows = [("tokens a second", f"{g(thr47)}", f"{g(thr55)}"), ("on time", f"{g(thr47)}", "0"),
            ("GPU busy", "100%", "100%")]
    b.append(txt(250, 218, "admit 47", "sub2", "middle"))
    b.append(txt(400, 218, "admit 55", "sub2", "middle"))
    for k, (lab, v1, v2) in enumerate(rows):
        y = 228 + k * 30
        b.append(txt(40, y + 16, lab, "cap"))
        b.append(cell(190, y, 120, 24, "s" if lab != "GPU busy" else "u", label=v1))
        b.append(cell(340, y, 120, 24, "h" if lab == "on time" else "u", label=v2))
    body, yb = prose(348, [
        f"Take Llama 3 8B on one H100, every request holding {g(CTX8K)} tokens of context, "
        f"{f(per / 1e9, 2)} GB of cache each ({{{{fig:v07-a07}}}}), and a target of 20 ms per output "
        "token. Requests in a batch advance together, so they share one step time: the weights read "
        "once, plus every request's cache ({{fig:v07-a23}}).",
        f"47 requests make a step of (16.06 + 47 × {f(per / 1e9, 2)}) GB ÷ 3.35 TB/s = "
        f"{f(t47 * 1e3, 1)} ms, and all are on time. 55, all that memory holds ({{{{fig:v07-a10}}}}), make "
        f"{f(t55 * 1e3, 1)} ms, and every one is late. The GPU turns out {pc(thr55 / thr47 - 1, 0)} more "
        f"tokens and goodput falls from {g(thr47)} tokens a second to none, while utilisation, the "
        "share of time the GPU is busy, reads 100% throughout.",
        "Admission control refuses the excess instead. The scheduler can predict that a 48th request "
        "would push every step past 20 ms, and reject or defer it so the 47 still land. Mooncake, the "
        "platform that serves Kimi, Moonshot AI's language-model service, does this with a "
        "prediction-based early rejection policy: when a "
        "request arrives it predicts the load that request will add to the decode pool once its "
        "prefill is done, and turns it away before spending anything on it.",
    ])
    emit("b53", stamp(SRT, "When more requests arrive than the"),
         "Admit fifty-five and every one is late; admit forty-seven and all are on time", yb + 32,
         b + [body],
         "Bars to scale. Overload does not slow a few requests, it slows all of them, because they "
         "share the step. That is why goodput collapses instead of fading.")


# ---- b54: the split follows the traffic ---------------------------------------------------------
IN_GPU, OUT_GPU = 52.3e3 / 8, 22.3e3 / 8          # tokens a second per GPU in the 96-GPU run
RATE = 10


def b54():
    mixes = [("long prompts, short answers", 2000, 200), ("short prompts, long answers", 200, 2000)]
    res = []
    for lab, i, o in mixes:
        pg, dg = RATE * i / IN_GPU, RATE * o / OUT_GPU
        res.append((lab, i, o, pg, dg))
    assert (round(res[0][3], 2), round(res[0][4], 2)) == (3.06, 0.72)
    assert (round(res[1][3], 2), round(res[1][4], 2)) == (0.31, 7.17)
    share = [r[3] / (r[3] + r[4]) for r in res]
    assert (round(share[0], 2), round(share[1], 2)) == (0.81, 0.04)
    b = [hd(40, 46, f"GPUs needed at {RATE} requests a second, drawn to scale")]
    X0, SC = 220, 50
    for k, (lab, i, o, pg, dg) in enumerate(res):
        y = 76 + k * 74
        b.append(txt(40, y + 14, lab, "cap"))
        b.append(txt(40, y + 30, f"{g(i)} in, {g(o)} out", "sub2"))
        b.append(cell(X0, y, pg * SC, 30, "m", label="prefill" if pg * SC > 70 else None))
        b.append(cell(X0 + pg * SC, y, dg * SC, 30, "s", label="decode" if dg * SC > 70 else None))
        b.append(txt(X0, y + 46, f"{f(pg)} prefill + {f(dg)} decode GPUs: {pc(pg / (pg + dg), 0)} prefill", "sub2"))
        assert X0 + (pg + dg) * SC < 640
    b.append(cell(X0, 232, 12, 12, "m")); b.append(txt(X0 + 18, 242, "prefill GPUs", "sub2"))
    b.append(cell(X0 + 120, 232, 12, 12, "s")); b.append(txt(X0 + 138, 242, "decode GPUs", "sub2"))
    body, yb = prose(284, [
        "Prefill GPUs are needed in proportion to prompt tokens, decode GPUs in proportion to output "
        f"tokens. Take the per-GPU rates of the 96-GPU SGLang run: 52,300 ÷ 8 = {g(IN_GPU, 1)} prompt "
        f"tokens a second on a prefill GPU, and 22,300 ÷ 8 = {g(OUT_GPU, 1)} output tokens on a decode "
        f"GPU. At {RATE} requests a second, long prompts with short answers need {RATE} × 2,000 ÷ "
        f"{g(IN_GPU, 1)} = {f(res[0][3])} prefill GPUs and {RATE} × 200 ÷ {g(OUT_GPU, 1)} = "
        f"{f(res[0][4])} decode GPUs.",
        f"Short prompts with long answers need the opposite, {f(res[1][3])} and {f(res[1][4])}. The "
        f"right split moves from {pc(share[0], 0)} prefill to {pc(share[1], 0)} with nothing but the "
        "traffic changing.",
        "NVIDIA Dynamo's planner watches load across the two pools and moves GPUs from one to the "
        "other, so the split tracks the traffic actually arriving rather than the traffic someone "
        "assumed when the cluster was deployed.",
    ])
    emit("b54", stamp(SRT, "And when the pools themselves are the"),
         "The right split between the pools follows the traffic", yb + 32, b + [body],
         "Rates borrowed from one measured run and applied to other mixes, so illustrative. The point "
         "survives any rates: the split is a property of the traffic, not of the model.",
         links=["the 96-GPU SGLang run (P35, Part 5): point the per-GPU rates at it once it exists"])


if __name__ == "__main__":
    for fn in (o018, b51, b52, b53, b54):
        fn()
