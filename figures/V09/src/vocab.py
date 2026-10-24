"""V9 ground-floor pass: the vocabulary this trace leans on, each word linked to the figure that builds
it. Not a review proposal: it came from reading the atlas from the top as a newcomer, and it follows
the README's decision 2 (a short recap with links rather than teaching each prerequisite again).

  python3 figures/V09/src/vocab.py      writes figures/V09/items/g01.html

Every pointer was read before it was used.
"""
from common import SRT, cell, txt, hd, para, stamp, emit, width

WORDS = [
    ("model", "a file of learned numbers that predicts the next token", "v01-o001"),
    ("weight, parameter", "one of those numbers; this model has a trillion", "v01-o004"),
    ("token", "a piece of text, roughly a word: the unit of everything", "v01-o006"),
    ("layer", "one stage of the model: attention, then a feed-forward step", "v01-o091"),
    ("head", "one of several attention computations a layer runs side by side", "v03-o013"),
    ("forward pass", "one run through every layer, giving the next token", "v01-o007"),
    ("prefill, decode", "the prompt in one pass; then one new token per pass", "v01-o109"),
    ("key-value cache", "attention state kept for every token so far", "v01-o136"),
    ("batch", "requests that share one pass, and one read of the weights", "v07-o002"),
    ("GPU", "the chip that does the arithmetic, in thousands of lanes", "v01-o070"),
    ("HBM", "the GPU's own fast memory, in the same package", "v01-o107"),
    ("bandwidth", "bytes moved per second", "v01-o074"),
    ("ops per byte", "work done for each byte fetched; the ridge is the most a chip can use",
     "v01-o120"),
]


def g01():
    b = [hd(40, 46, f"{len(WORDS)} words, in one line each, and the figure that builds each one")]
    y = 64
    for term, what, ref in WORDS:
        assert width(term, "sub") + 24 <= 136, term
        assert width(what, "sub2") <= 404 - 16, what
        b.append(cell(40, y, 136, 24, "u", label=term))
        b.append(txt(190, y + 16, what, "sub2"))
        b.append(txt(590, y + 16, f"{{{{ref:{ref}}}}}", "sub2"))
        y += 30
    body, yb = para(y + 30, [
        "This is the last episode of the series, and it uses the vocabulary of the eight before it. Each "
        "word above is defined in a line and linked to the figure that builds it properly. Words that are "
        "new to this episode, such as remote direct memory access, are built where they first appear.",
    ])
    emit("g01", stamp(SRT, "A user asks a coding assistant to fix a"),
         "The words this trace leans on, and where each was built", yb + 30, b + [body],
         "A map of prerequisites rather than a lesson: every row is one click from the figure that "
         "teaches it.")


if __name__ == "__main__":
    g01()
