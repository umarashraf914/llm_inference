"""V01 Part 7, two phases with opposite profiles: o113 and o116 redrawn.

o113 sums the operation count matrix by matrix, so it no longer repeats o104's drawing (review §5.1 #12,
§5.4). o116 separates how weights are stored from how the arithmetic is done (§5.1 #13); its old
ridge-at-batch rows now live with batching, in p25.

  python3 figures/V01/src/phases.py
"""
from common import (cell, ln, txt, hd, eq, prose, emit, st, f, g, D, FF, L, KVW, VOC, ATTN, FFN, N_EXACT,
                    PEAK, PEAK_INT8, BW, RIDGE)

MATS = [("W_Q", D, D), ("W_K", KVW, D), ("W_V", KVW, D), ("W_O", D, D),
        ("gate", FF, D), ("up", FF, D), ("down", D, FF)]
LAYER_W = sum(r * c for _, r, c in MATS)
HEAD_W = VOC * D
OPS = 2 * (L * LAYER_W + HEAD_W)                 # the input embedding is a lookup: no arithmetic
EMB = VOC * D
assert LAYER_W == ATTN + FFN and round(LAYER_W / 1e6, 1) == 855.6
assert round(OPS / 1e9, 1) == 139.0 and round(2 * N_EXACT / 1e9, 1) == 141.1
assert round((2 * N_EXACT - OPS) / (2 * N_EXACT) * 100, 1) == 1.5


def o113():
    b = [hd(40, 46, "One layer, matrix by matrix: the operations are twice the weights")]
    C = [40, 140, 300, 470]
    for c, h in zip(C, ["matrix", "rows × columns", "weights", "operations per token"]):
        b.append(txt(c, 74, h, "sub2"))
    for k, (name, r, c_) in enumerate(MATS):
        y = 98 + k * 24
        b.append(txt(C[0], y, name, "cap"))
        b.append(txt(C[1], y, f"{g(r)} × {g(c_)}", "sub2"))
        b.append(txt(C[2], y, f"{f(r * c_ / 1e6, 1)} million", "sub2"))
        b.append(txt(C[3], y, f"{f(2 * r * c_ / 1e6, 1)} million", "sub2"))
    yl_ = 98 + 6 * 24 + 10                       # the rule sits just under the last row
    yt = yl_ + 30                                # and the total clears it by the 18px the checker wants
    b.append(ln(40, yl_, 640, yl_, "axis"))
    b.append(txt(C[0], yt + 4, "one layer", "cap"))
    b.append(txt(C[2], yt + 4, f"{f(LAYER_W / 1e6, 1)} million", "sub2"))
    b.append(txt(C[3], yt + 4, f"{f(2 * LAYER_W / 1e9, 2)} billion", "sub2"))
    ys = yt + 36
    steps = [f"× 80 layers = {f(2 * L * LAYER_W / 1e9, 1)} billion",
             f"+ the output projection, {f(2 * HEAD_W / 1e9, 1)} billion",
             f"= {f(OPS / 1e9, 1)} billion operations per token"]
    for k, s in enumerate(steps):
        b.append(txt(C[3] - 130, ys + k * 22, s, "sub2"))
    b.append(eq(140, ys + 3 * 22 + 6, 400, "operations per token  ≈  2 × parameter count", "s"))
    body, yb = prose(ys + 3 * 22 + 6 + 42 + 36, [
        "The rule of {{fig:v01-o112}} holds for each matrix separately, so it holds for their sum. Add the seven "
        "and you have every weight in the layer; add 80 layers and the output projection and you have nearly "
        "every parameter in the model.",
        f"The exception is the embedding table, {f(EMB / 1e9, 2)} billion parameters read as a lookup with no "
        f"arithmetic ({{{{fig:v01-o088}}}}). That is why the exact count, {f(OPS / 1e9, 1)} billion, is 1.5% under "
        f"twice the parameter count, {f(2 * N_EXACT / 1e9, 1)} billion.",
        "So a parameter count, the one number every model is advertised with, converts straight into an "
        "operation count, to within a few percent.",
    ])
    emit("o113", "11:46", "Summing over the whole model", yb + 26, b + [body],
         "The rule survives the sum because it holds matrix by matrix. That is why a single headline number is "
         "enough to price a forward pass.")


def o116():
    b = [hd(40, 46, "The same parameter count drives both sides")]
    b.append(txt(40, 92, "Operations", "cap"))
    b.append(cell(250, 72, 260, 30, "m", rx=4, label="2 × N  =  140 billion"))
    b.append(txt(40, 138, "Bytes, at 16 bits", "cap"))
    b.append(cell(250, 118, 260, 30, "h", rx=4, label="N × 2  =  140 gigabytes"))
    b.append(cell(220, 168, 320, 34, "s", rx=6, label="1 operation per byte"))
    body1, y1 = prose(240, [
        "The 2 in the operation count and the 2 bytes of a 16-bit weight are unrelated quantities that happen to "
        "be the same number. Their ratio is exactly 1, and that is the arithmetic intensity of a single-token "
        f"decode step. The chip needs about {round(RIDGE)} to keep its arithmetic units busy (Part 8).",
    ])
    b.append(body1)
    yh = y1 + 44
    b.append(hd(40, yh, "Stored in fewer bits, still multiplied in 16"))
    rows = [("32 bits, 4 bytes", 0.5), ("16 bits, 2 bytes", 1), ("8 bits, 1 byte", 2), ("4 bits, half a byte", 4)]
    SC = 50
    for k, (lab, v) in enumerate(rows):
        y = yh + 18 + k * 34
        b.append(txt(40, y + 18, lab, "cap"))
        w = v * SC
        b.append(cell(250, y, w, 26, "s" if v > 1 else "h", rx=3))
        b.append(txt(250 + w + 10, y + 18, f"{v:g} operation{'s' if v != 1 else ''} per byte", "sub2"))
    assert abs(PEAK_INT8 / PEAK - 2) < 0.002
    body2, y2 = prose(yh + 18 + 4 * 34 + 30, [
        "Narrower weights do not change the operation count at all; they only shrink the bytes. These rows assume "
        "the weights are widened back to 16 bits on the chip just before each multiply ({{fig:v04-o057}}), so the "
        "chip's peak stays at 989 trillion operations a second.",
        f"If the arithmetic itself is done in 8 bits, the H100's peak doubles as well, to "
        f"{g(PEAK_INT8 / 1e12)} trillion operations a second, and so does the intensity the chip needs. "
        "Quantization moves the bytes; batching, in Part 10, moves the operations.",
    ])
    emit("o116", "11:46", "Why operations and bytes come out equal", y2 + 26, b + [body2],
         "The payoff of the whole derivation. One rule for operations, one for bytes, and their ratio is the "
         "number that decides whether a chip is waiting on maths or on memory.")


if __name__ == "__main__":
    o113()
    o116()
