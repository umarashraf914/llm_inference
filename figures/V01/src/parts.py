"""V01's part headings, in order. The depth pass added Part 10 (the three ways past the ceiling) and
Parts 12-14 (the prompt-cache material, moved here from the front so that it follows the KV cache it
depends on), so the parts after them are renumbered.

  python3 figures/V01/src/parts.py      writes figures/V01/items/s01.html ... s16.html
"""
from common import section

PARTS = [
    ("s01", "Before we start", "What a model is, what a token is, and what running one actually involves. "
            "Skip this part if it is already familiar."),
    ("s02", "What inference is", "The engineering between a trained checkpoint and a chat window, and what "
            "one request actually carries."),
    ("s03", "The 30 millisecond puzzle", "A calculation that does not come out."),
    ("s04", "Two numbers, two different physics", "Why the gap exists and why it keeps widening."),
    ("s05", "What a transformer actually does", "The structure that makes inference byte-hungry."),
    ("s06", "The weights, and what they cost to move", "From a parameter count to a byte count."),
    ("s07", "Two phases with opposite profiles", "Same model, same chip, same code, different economics."),
    ("s08", "Arithmetic intensity and the roofline", "The vocabulary that makes the gap precise."),
    ("s09", "Placing the two phases", "The same diagram, and a factor of two thousand between them."),
    ("s13", "Three ways past the ceiling", "The speed limit bandwidth sets on decode, and the only three "
            "things that can raise it."),
    ("s10", "The KV cache", "Why decode is sequential, and the structure that makes it survivable."),
    ("s14", "Why a key depends on its context", "Whether keys and values worked out for one request can "
            "be reused by another depends on what they were computed from."),
    ("s15", "The prefix rule", "When a server can skip work it has already done: identical from the first "
            "token, or not at all."),
    ("s16", "Warm, cold, and what survives", "The rule applied to one conversation a minute later and a "
            "day later, and why the shared preamble outlives everything else."),
    ("s11", "What the user feels", "Four numbers, and the one that actually decides."),
    ("s12", "Where that leaves us", "One number, resolved."),
]

if __name__ == "__main__":
    for k, (name, title, blurb) in enumerate(PARTS, 1):
        section(name, k, title, blurb)
