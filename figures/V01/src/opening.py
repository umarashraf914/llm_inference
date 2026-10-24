"""V01 Part 1: the thirty-millisecond figure, redrawn to scale (review §5.1 #7).

  python3 figures/V01/src/opening.py      writes figures/V01/items/o011.html
"""
from common import cell, ln, txt, hd, prose, emit, g, f

MS = 30                                         # the lecture's round figure for one token
PER_S = 1000 / MS
assert round(PER_S, 1) == 33.3


def o011():
    b = [hd(40, 46, "One second of output, drawn to scale: a slot for each 30 ms token")]
    X0, X1, Y = 60, 620, 84
    px = (X1 - X0) / 1000                       # pixels per millisecond
    whole = int(PER_S)                          # 33 whole tokens fit in a second
    for k in range(whole):
        b.append(cell(round(X0 + k * MS * px + 1, 1), Y, round(MS * px - 2, 1), 28, "s", rx=2))
    b.append(ln(X0, Y + 40, X1, Y + 40, "axis"))
    for t in (0, 250, 500, 750, 1000):
        x = round(X0 + t * px, 1)
        b.append(ln(x, Y + 40, x, Y + 45, "tick"))
        b.append(txt(x, Y + 60, f"{t / 1000:g} s" if t else "0", "sub2", "middle"))
    # a bracket under the first slot: one token is 30 ms
    b.append(txt(X0, Y - 10, "one token, 30 ms", "sub2"))
    assert X0 + whole * MS * px <= X1 and X0 + (whole + 1) * MS * px > X1
    body, yb = prose(Y + 110, [
        f"Thirty milliseconds is three hundredths of a second, so one second holds 1,000 ÷ 30 = "
        f"{f(PER_S, 1)} of them: the {whole} slots above, with a sliver left over. That is faster "
        "than anyone reads.",
        "The figure is a round one for a large model serving real traffic, not a law of nature. By the "
        "end of this atlas the time per token can be worked out from two numbers printed on a chip's "
        "specification sheet, for any model on any chip ({{fig:v01-p36}}).",
    ])
    emit("o011", "0:00", "Thirty milliseconds, per token", yb + 26, b + [body],
         "One turn of the generate-one-token loop. The whole atlas is about where those 30 "
         "milliseconds go, and the answer is that almost none of them is spent on arithmetic.")


if __name__ == "__main__":
    o011()
