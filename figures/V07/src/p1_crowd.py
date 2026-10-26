"""V7 Part 1, the question: review section A (P1-P3) and the rebuild of Fig 1 (o001).

  a01  P1  why a mixture of experts needs a crowd: tokens per expert = batch x 8 / 256
  a02  P2  what a serving system promises: TTFT and TPOT on one request's timeline
  o001     the worst case, drawn to scale in time: 41.8 ms of reading against 0.142 ms of arithmetic
  a03  P3  the same fact on the roofline: intensity 1 against the ridge at 295

  python3 figures/V07/src/p1_crowd.py
"""
import math
from v07common import *  # noqa: F401,F403

# ---- the numbers ----------------------------------------------------------------------------------
EXPERTS, ACTIVE = 256, 8                              # DeepSeek V3, as the video says
R = round(RIDGE)                                      # 295 tokens per expert to reach the ridge
per_expert = lambda n: n * ACTIVE / EXPERTS
N_RIDGE = R * EXPERTS // ACTIVE                       # tokens in the step for 295 per expert
assert per_expert(32) == 1 and per_expert(64) == 2 and N_RIDGE == 9440 and per_expert(N_RIDGE) == R

T_READ70 = t_read(W70)                                # one full read of the 70B weights
T_MATH70 = t_math(2 * P70)                            # its arithmetic for one token
SHARE = T_MATH70 / T_READ70
assert round(T_READ70 * 1e3, 1) == 41.8 and round(T_MATH70 * 1e3, 3) == 0.142
assert abs(1 / SHARE - RIDGE) < 1e-9                  # the time ratio is the ridge itself
assert round(SHARE * 100, 2) == 0.34
ATTAIN1 = BW * 1 / 1e12                               # TFLOP/s reached at intensity 1
assert round(ATTAIN1, 2) == 3.35 and round(ATTAIN1 / (PEAK / 1e12) * 100, 2) == 0.34


# ---- a01 · P1 -------------------------------------------------------------------------------------
def a01():
    b = [hd(40, 46, "One token wakes 8 of the 256 experts in each mixture-of-experts layer")]
    lit = {9, 37, 70, 101, 142, 177, 214, 250}         # which eight: any eight, for the picture
    assert len(lit) == ACTIVE
    C, G, X0, Y0 = 13, 3, 40, 66
    for k in range(EXPERTS):
        r, c = divmod(k, 16)
        b.append(cell(X0 + c * (C + G), Y0 + r * (C + G), C, C, "m" if k in lit else "u", rx=2))
    gy = Y0 + 16 * (C + G) - G
    b.append(txt(X0, gy + 22, "8 experts run for this token; 248 sit idle", "sub2"))
    # the table: tokens in a step against tokens each expert sees
    TX = [334, 446, 640]
    b.append(txt(TX[0], 86, "tokens in the step", "sub2"))
    b.append(txt(TX[1], 86, "expert visits, × 8", "sub2"))
    b.append(txt(TX[2], 86, "per expert, ÷ 256", "sub2", "end"))
    rows = [1, 32, 64, N_RIDGE]
    for i, n in enumerate(rows):
        y = 100 + i * 44
        last = n == N_RIDGE
        b.append(txt(TX[0], y + 21, fc(n), "cap"))
        b.append(txt(TX[1], y + 21, fc(n * ACTIVE), "sub2"))
        v = per_expert(n)
        lab = f(v, 2) if v < 1 else fc(v)
        b.append(cell(TX[2] - 64, y + 4, 64, 26, "m" if last else "u", label=lab))
    b.append(txt(TX[0], 100 + 4 * 44 + 12, f"about {R} tokens per expert reach the ridge", "sub2"))
    body, yb = prose(gy + 64, [
        "A mixture-of-experts layer holds many small networks, the experts, and a router that sends "
        "each token to a few of them ({{fig:v06-o010}}). "
        f"In DeepSeek V3 the router picks {ACTIVE} of the {EXPERTS} experts in every such layer "
        "({{fig:v06-o009}}), while all of them stay resident in memory. A step "
        f"that carries N tokens hands out {ACTIVE}N expert visits, so each expert sees N × {ACTIVE} ÷ "
        f"{EXPERTS} = N ÷ {EXPERTS // ACTIVE} tokens on average.",
        "Whenever an expert runs, its whole weight matrix is read from memory, whether one token uses "
        f"it or three hundred. Only at about {R} tokens per expert does the arithmetic keep pace with "
        "that read: the ridge, {{fig:v07-a03}}.",
        "In decode, the token-by-token phase of generation ({{fig:v01-o109}}), each request adds one "
        f"token per step, so {R} tokens per expert means "
        f"{fc(N_RIDGE)} requests generating at the same moment across the deployment. Creating that "
        "crowd is the serving system's job.",
    ])
    emit("a01", st("In the last episode"), "Eight experts out of 256 need a crowd to stay busy",
         yb + 32, b + [body],
         "Sparsity saves arithmetic only when a crowd shows up. With one request in flight, eight "
         "experts each read their full weights to serve a single token.")


# ---- a02 · P2 -------------------------------------------------------------------------------------
def a02():
    b = [hd(40, 46, "A fixed set of GPUs, a crowd of users, and a deadline for each of them")]
    # the crowd arriving at a fixed pool of GPUs
    for i in range(6):
        y = 70 + i * 16
        b.append(cell(40, y, 34, 11, "u", rx=2))
        b.append(arr(80, y + 5.5, 168, 84 + i * 13))
    b.append(txt(40, 184, "users, arriving whenever they like", "sub2"))
    b.append(f'<g class="u"><rect x="174" y="66" width="466" height="96" rx="14"/>'
             f'<text class="lbl" x="196" y="92">a fixed set of GPUs, all running the same model</text></g>')
    for k in range(8):
        b.append(cell(196 + k * 54, 108, 46, 34, "s", label="GPU"))
    # one request's two clocks
    b.append(hd(40, 236, "One user's request, start to finish"))
    AX, Y = 60, 300
    q0, q1, p1 = AX, 186, 280                        # queue, prefill, first token
    gap = 35                                          # one decode step, drawn evenly
    b.append(ghost(q0, Y - 13, q1 - q0, 26, label="waits in a queue"))
    b.append(cell(q1, Y - 13, p1 - q1, 26, "m", label="prefill"))
    toks = [p1 + k * gap for k in range(10)]
    for x in toks:
        b.append(cell(x, Y - 7, 12, 14, "s", rx=2))
    b.append(txt(AX, Y + 30, "arrives", "sub2"))
    b.append(txt(toks[0], Y + 30, "first token", "sub2"))
    # brackets: TTFT above, TPOT below
    def bracket(x1, x2, y, label, up=True):
        d = 6 if up else -6
        return (ln(x1, y, x2, y, "tick") + ln(x1, y, x1, y + d, "tick") + ln(x2, y, x2, y + d, "tick")
                + txt((x1 + x2) / 2, y - 8 if up else y + 18, label, "sub2", "middle"))
    b.append(bracket(q0, toks[0], Y - 26, "time to first token, TTFT"))
    b.append(bracket(toks[4], toks[5], Y + 44, "time per output token, TPOT", up=False))
    body, yb = prose(Y + 100, [
        "A serving system takes a fixed set of GPUs running a model, a trillion parameters in the "
        "largest cases, and serves as many users as it can without missing anyone's latency target.",
        "Each user is promised two things ({{fig:v01-o143}}). Time to first token covers the wait in "
        "the queue plus the prefill, the single pass that reads the whole prompt. Time per output "
        "token is the gap between "
        "tokens after that: one decode step each, so every user in a step waits for the whole step. "
        "The targets depend on the product: DistServe's chatbot settings ask for the first token "
        "within 0.25 to 4 seconds and each later one within 0.1 to 0.2 seconds, looser for bigger "
        "models.",
        "Putting more users in each step raises the tokens out of every read of the weights; the two "
        "targets set how far that can be pushed. Every technique in this document trades inside "
        "those two limits.",
    ])
    emit("a02", st("This episode is about the layer"), "A serving system makes two promises to every user",
         yb + 32, b + [body],
         "Throughput is the operator's number and the two latencies are the user's. A serving system "
         "is judged by how many users it can hold inside both at once.")


# ---- o001 -----------------------------------------------------------------------------------------
def o001():
    b = [hd(40, 46, "One decode step of the series' 70B model on an H100, drawn to scale in time")]
    X0, X1 = 150, 630
    sc = (X1 - X0) / T_READ70
    b.append(txt(40, 94, "memory", "cap"))
    b.append(cell(X0, 72, X1 - X0, 34, "h", rx=3,
                  label=f"reading 140 GB of weights at 3.35 TB/s: {ms(T_READ70, 1)} ms"))
    b.append(txt(40, 144, "arithmetic", "cap"))
    b.append(track(X0, 122, X1 - X0, 34))
    w = max(T_MATH70 * sc, 2)
    b.append(cell(X0, 122, w, 34, "m", rx=1))
    b.append(txt(X0 + 12, 143, f"busy {ms(T_MATH70, 3)} ms: 140 billion operations at 989 trillion a second",
                 "sub2"))
    for v in range(0, 41, 10):
        x = X0 + v / 1e3 * sc
        b.append(tick(x, 162, x, 167))
        b.append(txt(round(x, 1), 181, f"{v} ms" if v in (0, 40) else f"{v}", "sub2", "middle"))
    body1, y1 = prose(226, [
        "To produce one token, the chip reads every weight out of high-bandwidth memory and multiplies "
        "it against the token's vector, a thin matrix-vector product ({{fig:v01-o085}}). For the "
        "series' 70-billion-parameter example that is 140 GB of reading against 140 billion operations "
        "({{fig:v01-o114}}).",
        f"The read takes {ms(T_READ70, 1)} ms and the arithmetic {ms(T_MATH70, 3)} ms, so the arithmetic "
        f"units are busy {f(SHARE * 100, 2)}% of the step: the tensor cores, the chip's matrix-multiply "
        "units, barely warm up. (140 GB is "
        "more than one 80 GB card holds. Split over two cards, both times halve and their ratio stays.)",
        "Nothing about that read was specific to the request. The same 140 GB would have crossed the "
        "bus whether one user was connected or 64.",
    ])
    qy = y1 + 30
    b.append(box(90, qy, 500, 42, "m", "how many tokens does the system get out of each full read of the weights?",
                 rx=6).replace('class="lbl"', 'class="sub"'))
    body2, y2 = prose(qy + 42 + 36, [
        "Serving one request at a time, it gets exactly one. Nearly every technique below is a way of "
        "raising that number.",
    ])
    emit("o001", st("The place to start is the worst case"),
         "One request at a time gets one token per read of the weights", y2 + 32, b + [body1, body2],
         "Drawn to scale: the arithmetic is a sliver two pixels wide. Carry the question through the "
         "whole document, and when a new technique appears, ask what it does to tokens per weight read.")


# ---- a03 · P3 -------------------------------------------------------------------------------------
def a03():
    b = [hd(40, 46, "attainable = min(989 TFLOP/s, 3.35 TB/s × intensity), on logarithmic axes")]
    A = LogAxes(110, 620, 280, 76, 0.1, 1e4, 1, 1000)
    b += A.draw([0.1, 1, 10, 100, 1000, 10000], [1, 10, 100, 1000],
                "arithmetic intensity: operations per byte moved", "TFLOP/s attainable")
    x_floor = 1 / (BW / 1e12)                          # where the slanted roof leaves the bottom edge
    roof = [(A.px(x_floor), A.py(1)), (A.px(RIDGE), A.py(PEAK / 1e12)), (A.px(1e4), A.py(PEAK / 1e12))]
    b.append(poly(roof, "pl-h"))
    xr = A.px(RIDGE)
    b.append(ln(round(xr, 1), round(A.py(PEAK / 1e12), 1) + 8, round(xr, 1), A.Y0, "mark"))
    b.append(halo(round(xr, 1) + 8, round(A.py(PEAK / 1e12)) + 26, f"ridge, {R}"))
    x1, y1 = A.px(1), A.py(ATTAIN1)
    b.append(dot(round(x1, 1), round(y1, 1), "h"))
    b.append(halo(round(x1, 1) - 4, round(y1, 1) + 22,
                  f"decode, batch one: {f(ATTAIN1)} TFLOP/s", anchor="start"))
    b.append(arr(round(x1 + 9, 1), round(y1, 1), round(xr - 3, 1), round(y1, 1)))
    xm = A.px(math.sqrt(RIDGE))                        # the midpoint of a log axis is the geometric mean
    b.append(halo(round(xm, 1), round(y1 - 8, 1), f"{R} times further right", anchor="middle"))
    body, yb = prose(A.Y0 + 78, [
        "Arithmetic intensity is the useful work done per byte moved ({{fig:v01-o120}}). In decode at "
        "batch one, each 2-byte weight that is read feeds one multiply-add, 2 operations, so the "
        "intensity is 1 ({{fig:v01-o116}}).",
        f"Memory delivers 3.35 trillion bytes a second, so at 1 operation per byte the chip reaches "
        f"{f(ATTAIN1)} TFLOP/s, trillion operations a second, of its 989: the same {f(SHARE * 100, 2)}% as the previous figure, seen "
        f"from the other side. The ridge, where memory and arithmetic run out together, is at 989 ÷ "
        f"3.35 = {R} operations per byte ({{{{fig:v01-o126}}}}).",
        "Moving the point to the right means getting more operations out of every byte read. Nothing "
        "about the model can do that at batch one. Sharing the read can.",
    ])
    emit("a03", st("Arithmetic intensity, the useful work"), "Decode at batch one sits 295 times left of the ridge",
         yb + 32, b + [body],
         f"Each grid step is ten times the last. The decode point sits {f(math.log10(RIDGE), 1)} decades "
         "left of the corner, and that distance is what batching has to cover.")


if __name__ == "__main__":
    for fn in (a01, a02, o001, a03):
        fn()
