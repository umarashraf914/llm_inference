"""V5 Part 6, data parallelism: Fig 18 rebuilt and N30 of plans/depth_pass/V05_review.md.

  python3 figures/V05/src/part6_data.py     writes items o018, n30
"""
from v05common import *  # noqa: F401,F403
from part3_tensor import box2


# ---- Fig 18: whole copies ------------------------------------------------------------------------
def o018():
    b = [cont(40, 40, 600, 128, "u", "Complete independent copies")]
    for k in range(4):
        x = 66 + k * 145
        b.append(cell(x, 92, 120, 52, "s", label="full model", rx=4))
        b.append(txt(x + 8, 190, f"requests {25 * k + 1}–{25 * (k + 1)}", "sub2"))
    body, yb = prose(240, [
        "Data parallelism is the simplest strategy of the five. Run complete, independent copies of "
        "the model and give each one its own share of the incoming requests.",
        f"The copies never need to talk while serving ({fwd('n30', 'next figure')}), so this "
        "scaling is free, but narrow. Replication cannot fit a "
        "bigger model, since every copy must already hold the whole thing, and it cannot make a "
        "single request faster, since each request still runs on exactly one replica. It buys "
        "throughput and nothing else.",
    ])
    emit("o018", stamp(SRT, "Run complete independent copies"),
         "Data parallelism runs whole copies side by side", yb + 26, b + [body],
         "More copies serve more requests at once. They do not make room for a bigger model or speed "
         "for any one request, which is why this split always wraps the others.")


# ---- N30: training averages its nudges, serving has none -----------------------------------------
def n30():
    w, d1, d2 = 0.50, -0.02, 0.04
    avg = (d1 + d2) / 2
    assert (f(w + d1), f(w + d2), f(avg), f(w + avg)) == ("0.48", "0.54", "0.01", "0.51")
    grad = WEIGHT_BYTES / 1e9                          # one 16-bit number per weight
    g8, gbig = 2 * 7 / 8 * grad, 2 * 15_999 / 16_000 * grad
    assert grad == 140 and g8 == 245 and round(gbig) == 280
    left = [("u", "copy 1 sees batch A", f"its nudge for one weight w: {f(d1)}"),
            ("u", "copy 2 sees batch B", f"its nudge for the same w: +{f(d2)}"),
            ("h", "applied separately, the copies drift:", f"w = {f(w + d1)} on one, {f(w + d2)} on the other"),
            ("s", f"averaged first: ({f(d1)} + {f(d2)}) ÷ 2 = +{f(avg)}", f"both copies: w = {f(w + avg)}"),
            ("h", "one number for every weight, every step:", "an all-reduce of 140 GB")]
    right = [("u", "copy 1 answers request A", "no weight changes"),
             ("u", "copy 2 answers request B", "no weight changes"),
             ("s", "nothing to average", "0 bytes exchanged")]
    b = [txt(40, 46, "Training, both copies starting from w = 0.50", "cap"),
         txt(380, 46, "Serving", "cap")]
    for col, x0, wd in ((left, 40, 300), (right, 380, 260)):
        for k, (c, l1, l2) in enumerate(col):
            y = 58 + k * 58
            b.append(box2(x0, y, wd, 44, c, l1, l2))
            if k < len(col) - 1:
                b.append(arr(x0 + wd / 2, y + 46, x0 + wd / 2, y + 56))
    b.append(hd(40, 370, "What each GPU sends per training step, with the ring of Part 8"))
    X0, SC = 230, 1.4
    for k, (lab, v) in enumerate([("a group of 8", g8), ("a group of 16,000", gbig)]):
        y = 386 + k * 36
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, v * SC, 26, "h", label=f"{f(v, 0)} GB"))
    b.append(txt(40, 476, "serving", "cap"))
    b.append(txt(X0, 476, "0 bytes", "sub2"))
    body, yb = prose(522, [
        "Training nudges every weight a little after each batch ({{fig:v01-o003}}). Two copies that "
        "see different batches compute different nudges, and if each applied its own, the copies "
        "would drift apart. So the nudges are averaged across every copy and the average applied "
        "everywhere: an all-reduce of one number per weight at every step, 140 GB for a "
        "70-billion-parameter model at two bytes each.",
        f"With the ring all-reduce ({{{{fig:v05-o022}}}}) each GPU sends 2 × 7/8 × 140 = {f(g8, 0)} GB "
        f"per step in a group "
        f"of eight, approaching {f(gbig, 0)} GB in a very large one. If you know data parallelism from "
        "training, that is the heavy coordination bill you would expect here.",
        "But inference computes no gradients. There is nothing to synchronise, so the replicas never "
        "exchange a byte.",
    ])
    emit("n30", stamp(SRT, "If you know data parallelism from"),
         "Training copies must agree on every nudge; serving copies have none", yb + 26, b + [body],
         "Bars to scale. This is the bill a training intuition expects and serving never pays: the "
         "all-reduce exists to keep learning copies identical, and a serving copy never learns.")


if __name__ == "__main__":
    for fn in (o018, n30):
        fn()
