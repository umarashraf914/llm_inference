"""V01 Part 10, the three ways past the ceiling: o014 rewritten as route 1 (review §4 H, §5.1 #8), and
proposals 23-26: fewer bits, batching as a lane chart, batching on the roofline (a widget), and checking
several guessed tokens in one pass.

  python3 figures/V01/src/routes.py
"""
import json
from common import (cell, ghost, arr, ln, txt, hd, eq, prose, emit, widget, tag, st, f, g, sig, rnd, JS_FMT,
                    CHIPS, N, W_BYTES, PEAK, BW, RIDGE)
import roof
from roof import xs, ys, axes, roof_points, sig3

T_READ = W_BYTES / BW * 1000                     # ms


def o014():
    rows = [(k, W_BYTES / c["bw"] * 1000, c["bw"]) for k, c in CHIPS.items()]
    assert [round(ms, 1) for _, ms, _ in rows] == [41.8, 29.2, 17.5]
    b = [hd(40, 46, "Route one: the same 140 GB, read by three chips; time per token to scale")]
    SC = 380 / rows[0][1]
    for k, (name, ms, bw) in enumerate(rows):
        y = 70 + k * 46
        b.append(txt(40, y + 20, f"{name}, {bw / 1e12:g} TB/s", "cap"))
        w = round(ms * SC, 1)
        b.append(cell(190, y, w, 30, "h" if k == 0 else "s", rx=3))
        b.append(txt(190 + w + 10, y + 20, f"{f(ms, 1)} ms", "sub2"))
    body, yb = prose(70 + 3 * 46 + 30, [
        "Time per token = bytes to read ÷ bytes read per second. A chip with faster memory reads the same "
        "140 GB sooner: the H200 has the H100's arithmetic and 4.8 TB/s, the B200 8 TB/s. The numbers are "
        "NVIDIA's specifications.",
        "The bound moves exactly in proportion to bandwidth, which is what makes this route reliable and also "
        "what limits it: bandwidth is the number that grows slowest ({{fig:v01-o081}}).",
        "For the opening's 30 ms: that is a round figure for a large model serving real traffic. The 41.8 ms "
        "here is the bound for this 70-billion-parameter model in 16 bits on one H100, a chip that in fact "
        "cannot hold it alone ({{fig:v01-p20}}).",
    ])
    emit("o014", st("The only ways past it are to raise the bandwidth"), "Route one: a faster memory", yb + 26,
         b + [body],
         "The simplest route, and the one this series spends least time on: it is bought, not engineered.")


def p23():
    rows = [(16, W_BYTES), (8, W_BYTES / 2), (4, W_BYTES / 4)]
    ms = [bts / BW * 1000 for _, bts in rows]
    assert [round(m, 1) for m in ms] == [41.8, 20.9, 10.4]
    b = [hd(40, 46, "Route two: the same 70 billion weights in fewer bits, on one H100, to scale")]
    SC = 380 / ms[0]
    for k, ((bits, bts), m) in enumerate(zip(rows, ms)):
        y = 70 + k * 46
        b.append(txt(40, y + 20, f"{bits} bits: {g(bts / 1e9)} GB", "cap"))
        w = round(m * SC, 1)
        b.append(cell(190, y, w, 30, "h" if k == 0 else "s", rx=3))
        b.append(txt(190 + w + 10, y + 20, f"{f(m, 1)} ms per token", "sub2"))
    body, yb = prose(70 + 3 * 46 + 30, [
        "Bytes per token are parameters × bytes per parameter, so halving the bits halves the bytes and halves "
        "the wait: 70 GB in 8 bits reads in 20.9 ms, 35 GB in 4 bits in 10.4 ms.",
        "The arithmetic does not shrink, but it was never the bottleneck. What can shrink is quality: every "
        "weight is rounded to one of fewer values ({{fig:v01-p07}}), and the fourth video is about how far "
        "that can go before the answers suffer ({{fig:v04-o057}}).",
        "The same lever works on the other bytes decode reads: Part 11 meets the keys and values kept for every "
        "token, and they can be stored in fewer bits too.",
    ])
    emit("p23", st("To shrink the bytes per token"), "Halving the bits halves the wait", yb + 26, b + [body],
         "Route two attacks the numerator of the division. It is the cheapest of the three, and it costs accuracy "
         "rather than money.")


def p24():
    b = [hd(40, 46, "Route three: four users, one token each; time runs to the right, to scale")]
    X0, SC = 170, 440 / (4 * T_READ)
    b.append(txt(40, 92, "one at a time", "cap"))
    for k, u in enumerate("ABCD"):
        x = X0 + k * T_READ * SC
        b.append(cell(round(x, 1), 72, round(T_READ * SC - 2, 1), 32, "h", rx=3, label=f"read: {u}'s token"))
    b.append(txt(X0 + 4 * T_READ * SC, 124, f"{f(4 * T_READ, 1)} ms", "sub2", "end"))
    b.append(txt(40, 176, "as a batch of four", "cap"))
    b.append(cell(X0, 156, round(T_READ * SC - 2, 1), 32, "s", rx=3, label="one read"))
    b.append(txt(X0 + T_READ * SC + 8, 177, f"{f(T_READ, 1)} ms: tokens for A, B, C and D", "sub2"))
    ar = 4 * 2 * N / PEAK * 1000
    assert round(ar, 2) == 0.57 and ar < T_READ / 50
    body, yb = prose(232, [
        "Each pass reads all 140 GB of weights whether it makes one token or many. One at a time, four users "
        f"need four reads: {f(4 * T_READ, 1)} ms. As a batch ({{{{fig:v01-p01}}}}), one read feeds all four, and the "
        f"step still takes {f(T_READ, 1)} ms.",
        f"The batch does four times the arithmetic, {f(ar, 2)} ms of it at full speed. That is still a sliver of the "
        "read, so the step is no slower; each user gets a token in the same time, and the chip makes four.",
        "The weights are the same for every user ({{fig:v01-o108}}), which is the only reason one read can serve "
        "them all.",
    ])
    emit("p24", st("Or to amortize the weight transfer"),
         "In a batch, one read of the weights makes one token for every user in it", yb + 26, b + [body],
         "Batching does not make anyone's token faster. It makes the expensive part shared, which is what moves "
         "the cost per token.")


# ---- p25: the batch widget ---------------------------------------------------------------------------
BATCHES = [1, 2, 4, 8, 16, 32, 64, 74, 100, 128, 148, 200, 256, 295, 400, 512, 768, 1024]
B0, BITS0 = 1, 16


def step(bsz, bits, chip="H100"):
    """One decode step for a batch: every weight read once, 2N operations per token in the batch."""
    c = CHIPS[chip]
    by = N * bits / 8
    ops = 2 * N * bsz
    t = max(by / c["bw"], ops / c["peak"])
    return dict(i=ops / by, t=t, busy=ops / c["peak"] / t * 100, user=1 / t, total=bsz / t,
                a=min(c["peak"], c["bw"] * ops / by), bound="memory" if by / c["bw"] >= ops / c["peak"] else "compute")


TABLE = [1, 8, 32, 64, 128, 295, 512]
assert [round(step(b_, 16)["total"]) for b_ in TABLE] == [24, 191, 766, 1531, 3063, 7059, 7064]
assert round(step(512, 16)["user"], 1) == 13.8 and round(step(512, 16)["t"] * 1000, 1) == 72.5
assert round(RIDGE * 8 / 16) == 148 and round(RIDGE * 4 / 16) == 74 and round(RIDGE * 32 / 16) == 590


def p25_lines(bsz, bits):
    s = step(bsz, bits)
    return [f"batch {bsz}, weights in {bits} bits: {sig3(s['i'])} operations per byte",
            f"one step: {sig3(s['t'] * 1000)} ms, {s['bound']} bound",
            f"each user: {sig3(s['user'])} tokens a second",
            f"all users together: {sig3(s['total'])} tokens a second",
            f"arithmetic units busy: {sig3(s['busy'])}% of the step"]


def p25():
    c = CHIPS["H100"]
    s0 = step(B0, BITS0)
    b = [hd(40, 34, "Batch size moves decode along the roofline")]
    b += axes()
    b.append(f'<polyline class="pl-m" points="{roof_points(c["peak"], c["bw"])}"/>')
    xr = xs(RIDGE)
    b.append(ln(xr, ys(PEAK) + 4, xr, roof.B, "mark"))
    b.append(txt(xr + 6, roof.B - 10, "ridge, 295", "sub2 halo"))
    b.append(f'<circle data-pt="" cx="{xs(s0["i"])}" cy="{ys(s0["a"])}" r="6" fill="var(--s-fill)" stroke="var(--s)" stroke-width="2"/>')
    for k, line in enumerate(p25_lines(B0, BITS0)):
        b.append(tag("text", {"class": "sub2", "x": 140, "y": roof.B + 70 + k * 20, "data-r": k}, line))
    yt = roof.B + 70 + 5 * 20 + 24
    b.append(hd(40, yt, "Sixteen-bit weights on one H100: the speed for each user holds until the ridge"))
    C = [60, 170, 300, 440]
    for c_, h in zip(C, ["batch", "one step", "each user", "all users together"]):
        b.append(txt(c_, yt + 26, h, "sub2"))
    for k, bsz in enumerate(TABLE):
        s = step(bsz, 16)
        y = yt + 50 + k * 22
        b.append(txt(C[0], y, g(bsz), "sub2"))
        b.append(txt(C[1], y, f"{f(s['t'] * 1000, 1)} ms", "sub2"))
        b.append(txt(C[2], y, f"{f(s['user'], 1)} tokens/s", "sub2"))
        b.append(txt(C[3], y, f"{g(s['total'])} tokens/s", "sub2"))
    body, yl = prose(yt + 50 + 7 * 22 + 20, [
        "A batch of B tokens does B times the arithmetic on the same bytes, so its intensity is B operations "
        "per byte. Below the ridge the step still takes the 41.8 ms the read takes: each user's speed holds and "
        "the total grows with every request added.",
        "Past the ridge the arithmetic takes longer than the read, and each step grows with the batch: at 512, "
        "72.5 ms, and each user slows to 13.8 tokens a second while the total barely moves. Storing weights in "
        "8 bits, still multiplied in 16, doubles the intensity and halves the batch that reaches the ridge, to "
        "148; 4 bits, 74; 32 bits would need 590.",
        "These are bounds that count only the weights; Part 11 adds the bytes each user's conversation brings. "
        "The readouts were checked against Python at every batch size and bit width.",
    ])
    js = JS_FMT + roof.JS_ROOF + r"""
  const fig = document.currentScript.closest('figure');
  const N = __N__, PEAK = __PEAK__, BW = __BW__, BS = __BS__, I0 = __I0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  function draw() {
    const bsz = BS[+sl.value], bits = +rad.find(r => r.checked).value;
    const by = N * bits / 8, ops = 2 * N * bsz, t = Math.max(by / BW, ops / PEAK);
    const i = ops / by, a = Math.min(PEAK, BW * i), bound = by / BW >= ops / PEAK ? 'memory' : 'compute';
    val.textContent = gx(bsz);
    const pt = q('[data-pt]'); pt.setAttribute('cx', xs(i)); pt.setAttribute('cy', ys(a));
    const L = [`batch ${bsz}, weights in ${bits} bits: ${sig3(i)} operations per byte`,
      `one step: ${sig3(t * 1000)} ms, ${bound} bound`, `each user: ${sig3(1 / t)} tokens a second`,
      `all users together: ${sig3(bsz / t)} tokens a second`, `arithmetic units busy: ${sig3(ops / PEAK / t * 100)}% of the step`];
    L.forEach((s, k) => q(`[data-r="${k}"]`).textContent = s);
  }
  sl.addEventListener('input', draw);
  rad.forEach(r => r.addEventListener('change', draw));
  q('button').addEventListener('click', () => { sl.value = I0; rad[0].checked = true; draw(); });
  draw();""".replace("__N__", repr(N)).replace("__PEAK__", repr(PEAK)).replace("__BW__", repr(BW)) \
        .replace("__BS__", json.dumps(BATCHES)).replace("__I0__", str(BATCHES.index(B0)))
    ctl1 = (f"<label>batch <input type='range' min='0' max='{len(BATCHES) - 1}' step='1' value='{BATCHES.index(B0)}'>"
            f"<span class='val'>{g(B0)}</span></label>")
    ctl2 = "".join(f"<label class='opt'><input type='radio' name='v01-p25-bits' value='{bt}'"
                   f"{' checked' if bt == BITS0 else ''}> {bt}-bit weights</label>" for bt in (16, 8, 4)) + \
        "<button type='button'>Reset</button>"
    widget("p25", st("by batching independent requests"),
           "Batching multiplies throughput and leaves each user's speed alone, until the ridge", [ctl1, ctl2],
           yl + 22, b + [body],
           "Batching is the one route that needs no new hardware and costs no accuracy. Its limit is the ridge, "
           "and, as Part 11 shows, the memory each extra user brings.", js)


def p26():
    b = [hd(40, 46, "Route three, again: four guessed tokens checked in one pass (illustrative)")]
    b.append(txt(40, 92, "a small model guesses", "cap"))
    for k in range(4):
        b.append(cell(210 + k * 70, 72, 62, 30, "u", rx=3, label=f"guess {k + 1}"))
    b.append(txt(40, 152, "the large model checks", "cap"))
    b.append(cell(210, 132, 272, 30, "h", rx=3, label="one pass: one read of 140 GB"))
    b.append(txt(40, 212, "tokens kept", "cap"))
    for k, (lab, c) in enumerate([("kept", "s"), ("kept", "s"), ("kept", "s"), ("replaced", "m")]):
        b.append(cell(210 + k * 70, 192, 62, 30, c, rx=3, label=lab))
    b.append(txt(500, 212, "four tokens, one read", "sub2"))
    body, yb = prose(262, [
        "A second way to share one read is to give the large model several positions to work on at once. A "
        "much smaller model writes a few guesses quickly; the large model then checks all of them in a single "
        "pass, because attention lets every position be scored in parallel ({{fig:v08-o003}}).",
        "Here the first three guesses agree with what the large model would have written and are kept. The "
        "fourth does not, so it is replaced by the large model's own choice. Four tokens for one read of the "
        "weights, plus four passes of the small model, which reads far fewer bytes.",
        "How many guesses survive depends on the text and the guesser, so these numbers are illustrative; the "
        "eighth video is about this technique, speculative decoding.",
    ])
    emit("p26", st("generating multiple tokens per forward pass"),
         "Checking several guessed tokens in one pass is the other way to share a read", yb + 26, b + [body],
         "Batching shares a read across users; speculation shares it across positions in one user's answer. "
         "Both work because arithmetic was never what decode waited on.")


if __name__ == "__main__":
    for fn in (o014, p23, p24, p25, p26):
        fn()
