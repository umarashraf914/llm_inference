"""Part numbers follow the order: Part 2 ("Why memory is slow") moved to 7:44 and became Part 6, so the
headings are renumbered from order.txt, and the one caption that still named "the quantization video"
is put in the atlas's voice.

  python3 figures/V02/src/parts.py     renumbers every s-item in order; edits o072
"""
import re
from common import *  # noqa: F401,F403

ORDER = (OUT.parent / "order.txt").read_text().split()


def renumber():
    secs = [i for i in ORDER if i.startswith("s")]
    for n_, sid in enumerate(secs, 1):
        p = OUT / f"{sid}.html"
        s = p.read_text(encoding="utf-8")
        s2, k = re.subn(r"(<div class='l'>)Part \d+(</div>)", rf"\g<1>Part {n_}\g<2>", s)
        assert k == 1, sid
        p.write_text(s2, encoding="utf-8")
        title = re.search(r"<h2>(.*?)</h2>", s2).group(1)
        print(f"{sid}  Part {n_}: {title}")
    return {sid: n_ for n_, sid in enumerate(secs, 1)}


if __name__ == "__main__":
    nums = renumber()
    assert nums["s02"] == 6 and nums["s03"] == 2 and nums["s14"] == 14
    edit_item("o072", caption="The first is the subject of the fourth atlas, on quantization. The third is "
                              "Part 14 below.")
