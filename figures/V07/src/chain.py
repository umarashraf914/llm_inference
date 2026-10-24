"""V7 Part 11: o025 restamped and retitled; o026 rebuilt with the numbers of the limit case
(review §2 stamps, §5 items 12 and 29).

  python3 figures/V07/src/chain.py
"""
import re
from bcommon import BW, OUT, SRT, W70, cell, emit, f, g, hd, prose, stamp, txt


def o025():
    """Edit the existing item in place: the stamp moves to where the chain begins (28:10, not 27:57,
    which is still constrained decoding), and the title states the claim."""
    p = OUT / "o025.html"
    s = p.read_text(encoding="utf-8")
    ts = stamp(SRT, "Step back and the whole stack is a chain")
    s = re.sub(r"(<div class='ts'>Fig \S+ &nbsp;&middot;&nbsp; )[0-9:]+(</div>)", rf"\g<1>{ts}\g<2>", s, count=1)
    s = s.replace("<h3>The whole stack as one chain</h3>", "<h3>The whole stack is one chain of repairs</h3>")
    s = s.replace("<title>The whole stack as one chain</title>", "<title>The whole stack is one chain of repairs</title>")
    p.write_text(s, encoding="utf-8")
    print("o025", ts, "restamped")


def o026():
    step = W70 / BW
    one, crowd = 1 / step, 64 / step
    assert round(step * 1e3, 1) == 41.8 and round(one, 1) == 23.9 and round(crowd) == 1531
    b = [hd(40, 46, "Tokens a second from the same reads of Llama 3 70B's weights, drawn to scale")]
    X0, SC = 210, 280 / crowd
    for k, (lab, v, cls, note) in enumerate([("one user", one, "h", f"{f(one, 1)} tokens a second"),
                                             ("64 users, the same reads", crowd, "s", f"{g(crowd)} tokens a second")]):
        y = 66 + k * 40
        b.append(txt(40, y + 18, lab, "cap"))
        b.append(cell(X0, y, max(v * SC, 2), 26, cls))
        b.append(txt(X0 + max(v * SC, 2) + 10, y + 18, note, "sub2"))
    b.append(cell(90, 166, 500, 40, "m", label="so get more than one token out of a read, for the same request"))
    body, yb = prose(250, [
        "Every technique in this document raises the number of tokens produced per read of the "
        "weights, and each does it the same way: by putting more requests behind that one read. So set "
        "the number of requests to one: a single user, one conversation, nothing else on the machine.",
        f"Every technique still runs, and not one of them helps. On Llama 3 70B each read of 140 GB takes "
        f"140 GB ÷ 3.35 TB/s = {f(step * 1e3, 1)} ms, so that one stream gets {f(one, 1)} tokens a "
        "second, exactly as at the start ({{fig:v01-o130}}). The same reads shared by 64 requests "
        f"would produce {g(crowd)}.",
        "It is as memory-bound as it ever was, because there is nothing to share the read with. If you "
        "cannot put more requests behind a weight read, the only direction left is to get more than one "
        "token out of it for the same request. That is speculative decoding.",
    ])
    emit("o026", stamp(SRT, "So, set the number of requests to one."),
         "Where the batching argument runs out", yb + 32, b + [body],
         "A clean limit. Everything in this document scales with the crowd; the single-user case needs a "
         "different idea entirely.")


if __name__ == "__main__":
    o025()
    o026()
