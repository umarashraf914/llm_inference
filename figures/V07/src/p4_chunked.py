"""V7 Part 4, chunked prefill: review section F (P22-P27), the percentiles the video first leans on at
11:58 ("tail latency"), and the rebuilds of Figs 8 and 9 (o008, o009).

One step-time model runs through the whole part:
  Llama 3 8B on one H100 at its peak rates; 32 requests decoding, each with 1,000 tokens of context
  (illustrative); a 2,000-token prompt arriving. A step takes the longer of reading (weights, plus every
  cache its attention reads) and computing (2 x parameters per token). Attention's own arithmetic and
  the small writes of new cache entries are left out, and each figure that leans on that says so.

  o008     two kinds of work in one iteration, drawn to scale in tokens
  a23  P22 the step time: the longer of reading and computing, flat to 372 tokens
  a24  P23 the stall: one prompt joins, every running request waits 5.5 times as long
  o009     Sarathi and Sarathi-Serve: one iteration under a 512-token budget
  a25  P24 the 2,000-token prompt over five iterations
  a26  P25 a budget caps the step, however long the prompt
  a27  P26 widget: budget and prompt length, priced both ways
  a28      percentiles and the tail, on one user's next 100 gaps between tokens
  a29      Sarathi-Serve's reported gains under a p99 limit
  a30  P27 even iterations shrink the pipeline bubble

  python3 figures/V07/src/p4_chunked.py

Sources: Agrawal et al., Sarathi (arXiv 2308.16369, Microsoft Research India and Georgia Tech) and
Sarathi-Serve (OSDI 2024, arXiv 2403.02310): token budgets of 512 and 2,048; naive hybrid batching up
to 28.3x the decode-only time between tokens; vLLM stalls "over several seconds" (Yi-34B, two A100s);
P99 TBT limits of 5x and 25x an undisturbed decode iteration; 2.6x (Mistral-7B, 1 A100), up to 3.7x
(Yi-34B, 2 A100s), up to 5.6x (Falcon-180B, TP4-PP2 on two nodes) serving capacity over vLLM.
"""
import json
import math
from v07common import *  # noqa: F401,F403

B, CTXD, LP = 32, 1000, 2000          # running decodes, their context (illustrative), the arriving prompt
TOK = 2 * P8 / PEAK                    # seconds of arithmetic per token in a step


def step_time(d, k, p):
    """d decode tokens, each reading CTXD cached tokens; k prompt tokens whose earlier p are cached."""
    by = W8 + d * CTXD * KV8 + p * KV8
    return max(by / BW, 2 * P8 * (d + k) / PEAK)


def schedule(budget, lp):
    """Stall-free batching: decodes first, the rest of the budget a chunk of the prompt."""
    chunk, p, out = budget - B, 0, []
    while p < lp:
        k = min(chunk, lp - p)
        out.append((k, p, step_time(B, k, p)))
        p += k
    return out


BASE = step_time(B, 0, 0)
READ = (W8 + B * CTXD * KV8) / BW
KNEE = READ / TOK
NAIVE = step_time(B, LP, 0)
S512 = schedule(512, LP)
assert round(BASE * 1e3, 2) == 6.04 and BASE == READ and round(KNEE) == 372
assert round(NAIVE * 1e3, 2) == 32.99 and round(NAIVE / BASE, 1) == 5.5
assert [k for k, _, _ in S512] == [480] * 4 + [80] and round(S512[0][2] * 1e3, 2) == 8.31
assert round(S512[-1][2] * 1e3, 2) == 6.12 and round(sum(t for *_, t in S512) * 1e3, 1) == 39.4
assert len(schedule(2048, LP)) == 1 and schedule(2048, LP)[0][2] == NAIVE
REREAD = lambda s: sum(p for _, p, _ in s) * KV8
assert round(REREAD(S512) / 1e6) == 629
ATT_SHARE = ATT8 * LP * (LP + 1) / 2 / PEAK / NAIVE          # attention's arithmetic, left out
assert round(ATT_SHARE * 100) == 3


def fms(sec, d=2):
    return f"{fc(sec * 1e3, d)} ms"


# ---- o008 -----------------------------------------------------------------------------------------
def o008():
    b = [hd(40, 46, "Tokens of work in one iteration, drawn to scale")]
    X0, SC = 200, 430 / (B + LP)
    b.append(txt(40, 88, "an ordinary step", "cap"))
    b.append(cell(X0, 70, B * SC, 28, "m", rx=2))
    b.append(txt(round(X0 + B * SC + 10, 1), 89, f"{B} tokens: one for each running request", "sub2"))
    b.append(txt(40, 136, "the step a prompt joins", "cap"))
    b.append(cell(X0, 118, B * SC, 28, "m", rx=2))
    b.append(cell(round(X0 + B * SC, 2), 118, round(LP * SC, 2), 28, "h", rx=2,
                  label=f"a new request's {fc(LP)}-token prompt"))
    assert round(LP / B, 1) == 62.5
    body, yb = prose(196, [
        f"A decode step advances each running request by a single token: {B} running requests, {B} tokens "
        "of work. A request that has just been admitted must first process its whole prompt, and prompts "
        "run to thousands of tokens ({{fig:v01-o109}}).",
        "Both are one iteration to the scheduler. So the moment a new request joins, that iteration "
        "stops being a step and becomes a bulk job, with everyone else's next token sitting behind it.",
    ])
    emit("o008", st("There is one kind of work in that batch"),
         "One prompt brings 62 times the work of the whole decode batch", yb + 32, b + [body],
         "Drawn to scale in tokens: the running requests are the sliver on the left. The next figure "
         "turns tokens into milliseconds.")


# ---- a23 · P22 ------------------------------------------------------------------------------------
def a23():
    b = [hd(40, 46, "Step time against tokens processed in the step, linear axes")]
    X0, X1, Y0, Y1, XM, YM = 110, 600, 280, 84, 2200, 36e-3
    px = lambda n: X0 + n / XM * (X1 - X0)
    py = lambda t: Y0 - t / YM * (Y0 - Y1)
    b.append(ln(X0, Y0, X1, Y0, "axis"))
    b.append(ln(X0, Y1, X0, Y0, "axis"))
    for v in (0, 500, 1000, 1500, 2000):
        b.append(tick(px(v), Y0, px(v), Y0 + 5))
        b.append(txt(round(px(v), 1), Y0 + 19, fc(v), "sub2", "middle"))
    for v in (0, 10, 20, 30):
        b.append(tick(X0 - 5, py(v / 1e3), X0, py(v / 1e3)))
        b.append(txt(X0 - 9, round(py(v / 1e3) + 4, 1), f"{v}", "sub2", "end"))
    b.append(txt(X0 - 9, Y1 - 14, "ms per step", "sub2"))
    b.append(txt((X0 + X1) / 2, Y0 + 38, "tokens processed in the step", "sub2", "middle"))
    b.append(poly([(px(0), py(READ)), (px(XM), py(READ))], "pl-h"))
    b.append(poly([(px(0), py(0)), (px(XM), py(XM * TOK))], "pl-m"))
    xk = round(px(KNEE), 1)
    b.append(f'<line class="mark" x1="{xk}" y1="{round(py(READ), 1)}" x2="{xk}" y2="{Y0}"/>')
    b.append(txt(xk, Y0 + 19, f"{round(KNEE)}", "sub2", "middle"))
    b.append(txt(300, round(py(READ) - 9, 1), f"reading: {gb(W8)} GB of weights + {gb(B * CTXD * KV8)} GB of caches", "sub2"))
    b.append(txt(round(px(1250) - 14, 1), round(py(1250 * TOK) - 4, 1),
                 f"computing: {f(TOK * 1e6, 1)} µs per token", "sub2", "end"))
    b.append(dot(round(px(B), 1), round(py(BASE), 1), "u", r=4))
    b.append(halo(round(px(B) + 8, 1), round(py(BASE) + 18, 1), f"{B} decodes alone: {fms(BASE)}"))
    xt, yt = round(px(B + LP), 1), round(py(NAIVE), 1)
    b.append(dot(xt, yt, "h", r=4))
    b.append(txt(xt + 10, yt + 20, f"{fms(NAIVE, 1)}, with", "sub2"))
    b.append(txt(xt + 10, yt + 34, "the prompt", "sub2"))
    body, yb = prose(Y0 + 76, [
        "A step takes the longer of two times: reading every byte it needs, and doing every operation "
        f"({{{{fig:v01-o123}}}}). Reading is the weights, {gb(W8)} GB, plus the caches the running requests' "
        f"attention reads: {B} requests holding {fc(CTXD)} tokens each, {gb(B * CTXD * KV8)} GB. "
        f"{nb(gb(W8 + B * CTXD * KV8) + ' GB')} at {nb('3.35 TB/s')} is {nb(fms(READ))}, whatever the step "
        "computes.",
        f"Computing is 2 × {f(P8 / 1e9, 2)} billion operations per token, {f(TOK * 1e6, 1)} µs "
        f"(millionths of a second) at the chip's peak. The {B} decode tokens need {fms(B * TOK)}, far inside the read, and a step can hold "
        f"{round(KNEE)} tokens before the arithmetic takes longer. A {fc(LP)}-token prompt makes it "
        f"{fc(B + LP)} tokens: {fms(NAIVE, 1)}.",
        f"Assumed: the chip at its peak rates and {fc(CTXD)} tokens of context per running request "
        f"(illustrative). Attention's own arithmetic is left out; it would add about "
        f"{round(ATT_SHARE * 100)}% to the step with the prompt.",
    ])
    emit("a23", st("a bulk job with everyone"), "A step takes the longer of reading and computing",
         yb + 32, b + [body],
         "The flat stretch is why a step costs the same whether it computes 32 tokens or 372. The ramp "
         "is what a joining prompt climbs.")


# ---- a24 · P23 ------------------------------------------------------------------------------------
def a24():
    steps = [BASE] * 3 + [NAIVE] + [BASE] * 3
    total = sum(steps)
    b = [hd(40, 46, "Seven steps of the engine, and one running user's tokens, drawn to scale in time")]
    X0, X1 = 150, 630
    sc = (X1 - X0) / 70e-3
    assert total < 70e-3
    b.append(txt(40, 88, "engine steps", "cap"))
    b.append(txt(40, 134, "one user's tokens", "cap"))
    t = 0
    for i, s_ in enumerate(steps):
        x, w = X0 + t * sc, s_ * sc
        big = s_ == NAIVE
        b.append(cell(round(x + 1, 2), 70, round(w - 2, 2), 28, "h" if big else "u", rx=2,
                      label=f"+ the {fc(LP)}-token prompt" if big else None))
        t += s_
        b.append(cell(round(X0 + t * sc - 2, 2), 120, 4, 20, "s", rx=1))
    t3 = 3 * BASE
    xa, xb = X0 + t3 * sc, X0 + (t3 + NAIVE) * sc
    b.append(ln(xa, 156, xb, 156, "tick") + ln(xa, 151, xa, 156, "tick") + ln(xb, 151, xb, 156, "tick"))
    b.append(txt(round((xa + xb) / 2, 1), 172, f"{fms(NAIVE, 1)} with no token", "sub2", "middle"))
    xc = X0 + BASE * sc
    b.append(ln(X0, 156, xc, 156, "tick") + ln(X0, 151, X0, 156, "tick") + ln(xc, 151, xc, 156, "tick"))
    b.append(txt(X0, 172, fms(BASE), "sub2"))
    for v in range(0, 71, 10):
        x = X0 + v * 1e-3 * sc
        b.append(tick(x, 190, x, 195))
        b.append(txt(round(x, 1), 209, f"{v} ms" if v == 70 else str(v), "sub2", "middle" if v < 70 else "end"))
    b.append(ln(X0, 190, X1, 190, "axis"))
    body, yb = prose(254, [
        f"Every running request gets its next token at the end of each step: with {B} decodes alone, every "
        f"{fms(BASE)}. The step that admits a {fc(LP)}-token prompt takes {fms(NAIVE, 1)}, so each of the "
        f"{B} waits {f(NAIVE / BASE, 1)} times as long for that token, mid-answer.",
        "Those numbers come from peak arithmetic on an 8B model with one prompt joining. Measured, "
        "Sarathi-Serve found naive mixing stretched the time between tokens by up to 28.3 times, and in "
        "vLLM, which admitted waiting prompts eagerly, stalls lasted several seconds (Yi-34B on two "
        "A100s): users mid-answer simply stop receiving text while a stranger's prompt is processed.",
    ])
    emit("a24", st("stretched the time between tokens"),
         "One prompt joins, and every running request waits 5.5 times as long", yb + 32, b + [body],
         "The stall falls on people already being served, and it grows with every token of a stranger's "
         "prompt.")


# ---- o009 -----------------------------------------------------------------------------------------
def o009():
    b = [hd(40, 46, "One iteration under a 512-token budget, drawn to scale in tokens")]
    X0, SC = 40, 600 / 512
    b.append(cell(X0, 70, B * SC, 34, "m", rx=2, label=str(B)))
    b.append(cell(round(X0 + B * SC, 2), 70, round((512 - B) * SC, 2), 34, "h", rx=2,
                  label=f"{512 - B} tokens of a waiting prompt"))
    b.append(txt(40, 128, f"1. the {B} running decodes go in first, one token each", "sub2"))
    b.append(txt(40, 146, f"2. what is left of the budget, 512 − {B} = {512 - B}, is filled with a chunk of a waiting prompt", "sub2"))
    body, yb = prose(194, [
        "Sarathi, a 2023 paper from Microsoft Research India and Georgia Tech, splits a prompt's prefill "
        "into near-equal chunks; its follow-up, Sarathi-Serve, builds a scheduler around them. Each "
        "iteration gets a fixed token budget.",
        f"The running decodes are packed in first, one token each, and whatever is left of the budget is "
        f"filled with a chunk of a waiting prompt. With a 512-token budget, one of the two Sarathi-Serve "
        f"uses, and {B} running requests, the chunk is {512 - B} tokens.",
        "That bounds the cost of every iteration, whatever the waiting prompt's length, so admitting "
        "new work no longer pauses generation already in flight: what the authors call a stall-free "
        "schedule.",
    ])
    emit("o009", st("Sarathi, a 2023 paper"), "Sarathi-Serve gives every iteration the same token budget",
         yb + 32, b + [body],
         "The decodes always fit, because they go in first; only the newcomer waits its turn, in "
         "pieces.")


# ---- a25 · P24 ------------------------------------------------------------------------------------
def a25():
    b = [hd(40, 46, "Each iteration's 512 tokens: the decodes, then the prompt's next chunk, to scale")]
    X0, SC = 150, 300 / 512
    done = 0
    for i, (k, p, t) in enumerate(S512):
        y = 70 + i * 34
        done += k
        b.append(txt(40, y + 17, f"iteration {i + 1}", "cap"))
        b.append(cell(X0, y, B * SC, 24, "m", rx=2))
        b.append(cell(round(X0 + B * SC, 2), y, round(k * SC, 2), 24, "h", rx=2, label=str(k) if k * SC > 30 else None))
        b.append(txt(X0 + 312, y + 17, f"{fc(done)} of {fc(LP)} done · {fms(t)}", "sub2"))
    n = len(S512)
    assert n == math.ceil(LP / 480) and LP - 4 * 480 == 80
    ttft = sum(t for *_, t in S512)
    body, yb = prose(70 + n * 34 + 30, [
        f"⌈2,000 ÷ 480⌉ = {n} iterations: four chunks of 480 and a last of 2,000 − 4 × 480 = 80. The first "
        f"four steps carry 512 tokens and are compute-bound, {fms(S512[0][2])} each; the last carries "
        f"{B + 80} and rides under the read at {fms(S512[-1][2])}.",
        f"Each running request now waits at most {fms(S512[0][2])} for a token, against {fms(NAIVE, 1)} "
        f"with the prompt admitted whole. The prompt's own first token comes after 4 × "
        f"{f(S512[0][2] * 1e3, 2)} + {f(S512[-1][2] * 1e3, 2)} = {nb(fms(ttft, 1))}, against {nb(fms(NAIVE, 1))}.",
    ])
    emit("a25", st("Each iteration gets a fixed token budget"), "A 2,000-token prompt goes in over five iterations",
         yb + 32, b + [body],
         "The cost moved from the people already being served to the newcomer, whose first token now "
         "waits five steps instead of one.")


# ---- a26 · P25 ------------------------------------------------------------------------------------
def a26():
    b = [hd(40, 46, "The longest step for three prompt lengths, admitted whole and under a 512 budget, to scale")]
    X0, SC = 210, 330 / step_time(B, 8000, 0)
    rows = []
    for i, lp in enumerate((500, 2000, 8000)):
        whole = step_time(B, lp, 0)
        cap_ = max(t for *_, t in schedule(512, lp))
        rows.append((lp, whole, cap_))
        y = 70 + i * 62
        b.append(txt(40, y + 17, f"{fc(lp)}-token prompt", "cap"))
        b.append(cell(X0, y, whole * SC, 22, "h", rx=2))
        b.append(txt(round(X0 + whole * SC + 10, 1), y + 16, f"whole: {fms(whole, 2 if whole < 0.01 else 1)}", "sub2"))
        b.append(cell(X0, y + 26, cap_ * SC, 22, "s", rx=2))
        b.append(txt(round(X0 + cap_ * SC + 10, 1), y + 42, f"budget 512: {fms(cap_)}", "sub2"))
    assert all(round(c_ * 1e3, 2) == 8.31 for *_, c_ in rows)
    att8k = ATT8 * 8000 * 8001 / 2 / PEAK
    assert round(att8k * 1e3) == 17
    body, yb = prose(70 + 3 * 62 + 24, [
        "Admitted whole, a prompt's step grows with its length: "
        f"{fms(rows[0][1])} for 500 tokens, {fms(rows[1][1], 1)} for 2,000, {fms(rows[2][1], 0)} for 8,000. "
        f"Under a 512-token budget the longest step is {fms(rows[0][2])} for all three; a longer prompt "
        "only takes more steps.",
        f"And the first {round(KNEE) - B} prompt tokens of any step are free: until the step holds "
        f"{round(KNEE)} tokens the arithmetic still finishes inside the {fms(READ)} read "
        "({{fig:v07-a23}}). A budget near that size would cost the running requests almost nothing.",
        "Attention's own arithmetic, left out here, grows with the square of a prompt's length: at 8,000 "
        f"tokens it would add another {fms(att8k, 0)} to the whole-prompt step.",
    ])
    emit("a26", st("That bounds the cost of an iteration"), "A budget caps the step, however long the prompt",
         yb + 32, b + [body],
         "The budget turns one unbounded stall into many bounded steps. Running requests stop paying for "
         "a stranger's length.")


# ---- a27 · P26: the widget ------------------------------------------------------------------------
BUDGETS = [64, 128, 256, 384, 512, 768, 1024, 1536, 2048]
PROMPTS = [500, 1000, 2000, 4000, 8000]
DB, DP = 4, 2
GX0, GX1 = 150, 630


def fsz(nb_):
    return "nothing" if nb_ == 0 else (f"{f(nb_ / 1e9, 2)} GB" if nb_ >= 1e9 else f"{f(nb_ / 1e6, 0)} MB")


def chunk_state(bi, pi):
    bud, lp = BUDGETS[bi], PROMPTS[pi]
    s = schedule(bud, lp)
    n, mx, tt = len(s), max(t for *_, t in s), sum(t for *_, t in s)
    return {"vb": fc(bud), "vp": fc(lp),
            "r1": f"chunks of {fc(bud - B)}: the {fc(lp)}-token prompt goes in over {fc(n)} iteration{'s' if n > 1 else ''}",
            "r2": f"running requests wait up to {fms(mx)} for a token, against {fms(BASE)} with no prompt arriving",
            "r3": f"the prompt's first token after {fms(tt, 1)}; cache re-read by its later chunks: {fsz(REREAD(s))}",
            "_s": s, "_tt": tt}


def lane_svg(s, tt):
    """The steps as blocks and the running user's tokens as ticks, scaled so the lane ends at tt."""
    sc = (GX1 - GX0) / tt
    o, t = [], 0.0
    for k, p, dt in s:
        x, w = GX0 + t * sc, dt * sc
        o.append(f'<g class="h"><rect x="{x:.2f}" y="66" width="{max(w - 1, 0.6):.2f}" height="24" rx="1"/></g>')
        t += dt
        o.append(f'<g class="s"><rect x="{GX0 + t * sc - 1.5:.2f}" y="102" width="2" height="16" rx="0.5"/></g>')
    return "".join(o)


A27_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const BUD = __BUD__, PR = __PR__, DB = __DB__, DP = __DP__, B = __B__, CTXD = __CTXD__;
  const W8 = __W8__, KV8 = __KV8__, P8 = __P8__, BW = 3.35e12, PEAK = 989e12, X0 = __GX0__, X1 = __GX1__;
  __FMT__
  const fms = (s, d = 2) => fcx(s * 1e3, d) + ' ms';
  const fsz = b => b === 0 ? 'nothing' : (b >= 1e9 ? fx(b / 1e9, 2) + ' GB' : fx(b / 1e6, 0) + ' MB');
  const stepT = (d, k, p) => Math.max((W8 + d * CTXD * KV8 + p * KV8) / BW, 2 * P8 * (d + k) / PEAK);
  function schedule(bud, lp) { const ch = bud - B, out = []; let p = 0;
    while (p < lp) { const k = Math.min(ch, lp - p); out.push([k, p, stepT(B, k, p)]); p += k; } return out; }
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  function rect(cls, x, y, w, h, rx) { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', cls);
    const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x.toFixed(2)); r.setAttribute('y', y);
    r.setAttribute('width', w.toFixed(2)); r.setAttribute('height', h); r.setAttribute('rx', rx); g.appendChild(r); return g; }
  function draw() {
    const bud = BUD[+sl[0].value], lp = PR[+sl[1].value], s = schedule(bud, lp);
    const n = s.length, mx = Math.max(...s.map(x => x[2])), tt = s.reduce((a, x) => a + x[2], 0);
    const rr = s.reduce((a, x) => a + x[1], 0) * KV8;
    val[0].textContent = fcx(bud); val[1].textContent = fcx(lp);
    q('[data-r1]').textContent = `chunks of ${fcx(bud - B)}: the ${fcx(lp)}-token prompt goes in over ${fcx(n)} iteration${n > 1 ? 's' : ''}`;
    q('[data-r2]').textContent = `running requests wait up to ${fms(mx)} for a token, against ${fms(stepT(B, 0, 0))} with no prompt arriving`;
    q('[data-r3]').textContent = `the prompt's first token after ${fms(tt, 1)}; cache re-read by its later chunks: ${fsz(rr)}`;
    q('[data-end]').textContent = fms(tt, 1);
    const g = q('[data-lane]'); g.replaceChildren();
    const sc = (X1 - X0) / tt; let t = 0;
    for (const [k, p, dt] of s) { g.appendChild(rect('h', X0 + t * sc, 66, Math.max(dt * sc - 1, 0.6), 24, 1));
      t += dt; g.appendChild(rect('s', X0 + t * sc - 1.5, 102, 2, 16, 0.5)); }
  }
  sl.forEach(x => x.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = DB; sl[1].value = DP; draw(); });
  draw();
})();</script>"""


def a27():
    s0 = chunk_state(DB, DP)
    b = [hd(40, 34, "From the prompt's arrival to its first token, each step drawn to scale in time")]
    b.append(txt(40, 83, "steps", "cap"))
    b.append(txt(40, 115, "a user's tokens", "cap"))
    b.append(f'<g data-lane="">{lane_svg(s0["_s"], s0["_tt"])}</g>')
    b.append(ln(GX0, 132, GX1, 132, "axis"))
    b.append(tick(GX0, 132, GX0, 137))
    b.append(tick(GX1, 132, GX1, 137))
    b.append(txt(GX0, 151, "the prompt arrives", "sub2"))
    b.append(f'<text class="sub2" x="{GX1}" y="151" text-anchor="end" data-end="">{esc(fms(s0["_tt"], 1))}</text>')
    b.append(txt(GX1 - 70, 151, "first token at", "sub2", "end"))
    RY = 190
    for k in (1, 2, 3):
        b.append(f'<text class="sub2" x="40" y="{RY + (k - 1) * 20}" data-r{k}="">{esc(s0[f"r{k}"])}</text>')
    s2048 = schedule(2048, LP)
    body, yb = prose(RY + 40 + 38, [
        "Chunk size is a real trade. Small chunks keep each step short and the token stream smooth, but "
        "the prompt needs more steps, so its own first token comes later, and every chunk re-reads the "
        "cache its earlier chunks wrote. Large chunks reverse both.",
        f"At a 512-token budget the running requests never wait more than {fms(S512[0][2])}, and the "
        f"prompt's first token comes after {fms(sum(t for *_, t in S512), 1)}, with {fsz(REREAD(S512))} "
        f"re-read. At 2,048 the prompt goes in whole: one {fms(s2048[0][2], 1)} stall, a first token at "
        f"{fms(s2048[0][2], 1)}, nothing re-read. Try a 64-token budget on an 8,000-token prompt.",
        "Sarathi-Serve measured the cost of small chunks at up to about 25% more prefill time at 512 on "
        "Yi-34B. This widget's arithmetic was checked against Python at every setting.",
    ])
    ctl = (f"<div class='ctl'><label>budget <input type='range' min='0' max='{len(BUDGETS) - 1}' step='1' value='{DB}'>"
           f"<span class='val'>{s0['vb']}</span></label>"
           f"<label>prompt <input type='range' min='0' max='{len(PROMPTS) - 1}' step='1' value='{DP}'>"
           f"<span class='val'>{s0['vp']}</span></label><button type='button'>Reset</button></div>")
    js = (A27_JS.replace("__BUD__", json.dumps(BUDGETS)).replace("__PR__", json.dumps(PROMPTS))
          .replace("__DB__", str(DB)).replace("__DP__", str(DP)).replace("__B__", str(B))
          .replace("__CTXD__", str(CTXD)).replace("__W8__", str(W8)).replace("__KV8__", str(KV8))
          .replace("__P8__", str(P8)).replace("__GX0__", str(GX0)).replace("__GX1__", str(GX1))
          .replace("__FMT__", JS_FMT))
    widget("a27", st("Chunk size is a real trade"), "Chunk size, priced both ways", ctl, yb + 26, b + [body],
           "Small chunks protect the people already being served; large ones protect the newcomer. The "
           "budget is the dial between them.", js)


def a27_cases():
    out = []
    order = [(DB, DP)] + [(i, j) for i in range(len(BUDGETS)) for j in range(len(PROMPTS)) if (i, j) != (DB, DP)]
    for i, j in order:
        s = chunk_state(i, j)
        out.append(({"label:nth-of-type(1) input": i, "label:nth-of-type(2) input": j},
                    {"label:nth-of-type(1) .val": s["vb"], "label:nth-of-type(2) .val": s["vp"],
                     "[data-r1]": s["r1"], "[data-r2]": s["r2"], "[data-r3]": s["r3"],
                     "[data-end]": fms(s["_tt"], 1)}))
    return out


# ---- a28: percentiles and the tail ----------------------------------------------------------------
def pct(v, q):
    """Nearest rank: the value at position ceil(q% of n) in the sorted list."""
    s = sorted(v)
    return s[math.ceil(q / 100 * len(s)) - 1]


GAPS_W = sorted([BASE] * 97 + [NAIVE] * 3)
GAPS_B = sorted([BASE] * 85 + [t for _ in range(3) for *_, t in S512])


def a28():
    assert len(GAPS_W) == len(GAPS_B) == 100
    assert pct(GAPS_W, 50) == BASE and pct(GAPS_W, 99) == NAIVE and pct(GAPS_W, 90) == BASE
    assert pct(GAPS_B, 50) == BASE and pct(GAPS_B, 90) == S512[0][2] == pct(GAPS_B, 99)
    mw, mb = sum(GAPS_W) / 100, sum(GAPS_B) / 100
    b = [hd(40, 46, "One user's next 100 gaps between tokens, sorted, as three prompts arrive")]
    X0, HS = 140, 1.8e3                                # 1 ms = 1.8 px of bar height
    def population(gaps, ybase, label):
        o = [txt(X0, ybase - 74, label, "sub2")]
        for i, g in enumerate(gaps):
            o.append(cell(X0 + i * 5, round(ybase - g * HS, 2), 4, round(g * HS, 2), "h" if g > BASE * 1.05 else "u", rx=0))
        for q_, lab in ((50, "p50"), (90, "p90"), (99, "p99")):
            x = X0 + (q_ - 1) * 5 + 2
            o.append(tick(x, ybase + 2, x, ybase + 7))
            o.append(txt(x, ybase + 20, lab, "sub2", "middle"))
        return o
    b += population(GAPS_W, 150, f"each prompt admitted whole: 97 gaps of {fms(BASE)}, 3 of {fms(NAIVE, 1)}")
    b += population(GAPS_B, 270, f"under a 512 budget: 88 near {fms(BASE)}, 12 of {fms(S512[0][2])}")
    b.append(txt(40, 146, "whole", "cap"))
    b.append(txt(40, 266, "budget 512", "cap"))
    # the summaries, on one scale
    YS, SS = 330, 300 / NAIVE
    b.append(hd(40, YS - 12, "The same gaps summarised, on one scale"))
    rows = [("whole", "median", BASE, "u"), ("", "average", mw, "u"), ("", "p99", NAIVE, "h"),
            ("budget 512", "median", BASE, "u"), ("", "average", mb, "u"), ("", "p99", pct(GAPS_B, 99), "h")]
    for i, (grp, lab, v, cls) in enumerate(rows):
        y = YS + i * 22 + (10 if i >= 3 else 0)
        if grp:
            b.append(txt(40, y + 14, grp, "cap"))
        b.append(txt(200, y + 14, lab, "sub2", "end"))
        b.append(cell(210, y, v * SS, 17, cls, rx=2))
        b.append(txt(round(210 + v * SS + 8, 1), y + 14, fms(v, 2 if v < 0.01 else 1), "sub2"))
    yend = YS + 6 * 22 + 10
    body, yb = prose(yend + 36, [
        "A percentile is a position in the sorted line. Sort the measurements and count from the fastest: "
        "the 90th percentile, p90, is the value 90% of them do not exceed, here the 90th of 100; p99 is "
        "the 99th. The median is p50 ({{fig:v07-a17}}), and the slow end of the line is the tail.",
        f"Admitted whole, each of three {fc(LP)}-token prompts makes one gap of {fms(NAIVE, 1)}: the median "
        f"stays {fms(BASE)} but p99 is {fms(NAIVE, 1)}. Under a 512-token budget each prompt makes four gaps "
        f"of {fms(S512[0][2])} instead: the median is unchanged and p99 falls to {fms(S512[0][2])}. The "
        f"averages, {nb(fms(mw))} and {nb(fms(mb))}, hardly tell the two apart.",
        "Sarathi-Serve was judged on exactly this, the 99th percentile of the time between tokens, because "
        "every token produces one such gap and readers notice the worst ones.",
    ])
    emit("a28", st("Under tail latency limits"), "The tail is where the stalls hide",
         yb + 32, b + [body],
         "Chunking leaves the median where it was and cuts the tail four times. Judged on the median or "
         "the average, the stalls would not exist.")


# ---- a29: Sarathi-Serve's results -----------------------------------------------------------------
def a29():
    b = [hd(40, 46, "Serving capacity under a p99 limit on the time between tokens, vLLM = 1, to scale")]
    rows = [("vLLM", "", 1.0, "u"), ("Mistral-7B", "1 A100", 2.6, "s"), ("Yi-34B", "2 A100s, up to", 3.7, "s"),
            ("Falcon-180B", "8 A100s, pipelined, up to", 5.6, "s")]
    X0, SC = 230, 380 / 5.6
    for i, (m, hw, v, cls) in enumerate(rows):
        y = 70 + i * 36
        b.append(txt(40, y + 12, m, "cap"))
        if hw:
            b.append(txt(40, y + 27, hw, "sub2"))
        b.append(cell(X0, y, v * SC, 26, cls, rx=2))
        b.append(txt(round(X0 + v * SC + 10, 1), y + 18, f"{v:.1f}×", "sub2"))
    body, yb = prose(70 + 4 * 36 + 30, [
        "Serving capacity is the highest request rate a deployment can sustain while the 99th percentile of "
        "its time between tokens stays inside a limit. Sarathi-Serve set the limit at 5 times, or in a "
        "relaxed setting 25 times, the time of an undisturbed decode step.",
        "Against vLLM it reported 2.6 times the capacity for Mistral-7B on one A100, up to 3.7 times for "
        "Yi-34B on two, and up to 5.6 times for Falcon-180B split over two nodes of four A100s with "
        "pipeline parallelism, which the next figure explains.",
    ])
    emit("a29", st("Under tail latency limits"), "Under a p99 limit, Sarathi-Serve served 2.6 to 5.6 times what vLLM could",
         yb + 32, b + [body],
         "The largest gain came where even steps pay twice: once in stalls, and once in the pipeline "
         "bubbles the next figure counts.")


# ---- a30 · P27: pipeline bubbles ------------------------------------------------------------------
def pipeline(sizes, S=4):
    fin = [[0.0] * len(sizes) for _ in range(S)]
    blocks = []
    for s in range(S):
        for i, d in enumerate(sizes):
            start = max(fin[s - 1][i] if s else 0, fin[s][i - 1] if i else 0)
            fin[s][i] = start + d
            blocks.append((s, start, d))
    total = fin[S - 1][-1]
    return total, 1 - S * sum(sizes) / (S * total), blocks


UNEVEN = [7, 1, 1, 1, 7, 1, 1, 1]
EVEN = [2.5] * 8


def a30():
    tu, iu, bu = pipeline(UNEVEN)
    te, ie, be = pipeline(EVEN)
    assert sum(UNEVEN) == sum(EVEN) == 20 and tu == 41 and te == 27.5
    assert round(iu * 100, 1) == 51.2 and round(ie * 100, 1) == 27.3 and abs(ie - 3 / 11) < 1e-12
    b = [hd(40, 46, "Four pipeline stages, eight iterations, the same 20 units of work, to scale")]
    X0, SC = 140, 460 / tu
    for k, (blocks, total, idle, y0, lab) in enumerate([
            (bu, tu, iu, 82, "uneven: prefill-heavy iterations cost 7, the rest 1"),
            (be, te, ie, 212, "even: every iteration chunked to 2.5")]):
        b.append(txt(X0, y0 - 10, lab, "sub2"))
        for s in range(4):
            y = y0 + s * 22
            b.append(txt(40, y + 14, f"stage {s + 1}", "cap"))
            b.append(track(X0, y, round(total * SC, 2), 18, rx=2))
        for s, start, d in blocks:
            b.append(cell(round(X0 + start * SC + 0.5, 2), y0 + s * 22, round(d * SC - 1, 2), 18, "m", rx=2))
        b.append(txt(round(X0 + total * SC + 8, 1), y0 + 4 * 22 - 8,
                     f"{f(total, 1) if total % 1 else int(total)} units", "sub2"))
        b.append(txt(X0, y0 + 4 * 22 + 12, f"{f(idle * 100, 1)}% of stage time idle", "sub2"))
    body, yb = prose(212 + 4 * 22 + 50, [
        "With pipeline parallelism each stage of the model sits on its own GPUs, and iterations pass "
        "through the stages like an assembly line ({{fig:v05-o012}}). A stage can start an iteration only "
        "when the stage before has finished it, and when it has finished its own previous one.",
        "When a prefill-heavy iteration costs 7 units and a decode-only one 1, the long ones stall every "
        f"stage behind them: {int(tu)} units with {f(iu * 100, 1)}% idle. Chunked so every iteration costs "
        f"2.5, the same work takes {f(te, 1)} units with {f(ie * 100, 1)}% idle: exactly V5's bubble formula, "
        f"{nb('(stages − 1) ÷ (iterations + stages − 1)')} = {nb('3 ÷ 11')}.",
    ])
    emit("a30", st("by a second effect"), "Even iterations shrink the pipeline bubble", yb + 32, b + [body],
         "Same work, a third less time: an assembly line moves at the pace of its most uneven step. vLLM "
         "now enables chunked prefill by default.")


if __name__ == "__main__":
    for fn in (o008, a23, a24, o009, a25, a26, a27, a28, a29, a30):
        fn()
