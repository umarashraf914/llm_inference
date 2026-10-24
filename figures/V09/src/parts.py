"""V9 part headings. Ten parts in the video's order; Parts 4-8 follow the route's six stops (N4),
and each says which stop it is, so the reader always knows where the request is.

  python3 figures/V09/src/parts.py      writes figures/V09/items/s01.html … s10.html
"""
from common import section

PARTS = [
    ("s01", "The request, and the machine it lands on",
     "One question from a coding assistant, and the rack of 72 GPUs that will answer it."),
    ("s02", "The route",
     "Six stops between the question and the answer, and the episode that built each one."),
    ("s03", "The wall, restated",
     "The first episode's division, in Blackwell numbers: what the chip needs from a byte, and what "
     "a byte can offer."),
    ("s04", "Arrival",
     "Stop 1, the gateway. It routes by what each machine already holds, so most of the prompt is "
     "never computed again."),
    ("s05", "Inside prefill",
     "Stop 2. The new tokens go through the model once, and four episodes' machinery fires inside "
     "a single forward pass."),
    ("s06", "The handoff",
     "Stop 3. The cache crosses to the decode machines, and three techniques make the crossing small "
     "and fast."),
    ("s07", "Decode",
     "Stop 4. One token per step, where the wall bites hardest, and the two ways of putting more "
     "behind each weight read."),
    ("s08", "The pick, and what the user sees",
     "Stops 5 and 6. Only tokens that keep the tool call valid survive, and the stream reaches the "
     "user."),
    ("s09", "An old wall, a new stack",
     "How young the answers are, against how old the problem is."),
    ("s10", "A model that writes many positions at once",
     "The assumption under every decode technique, and a family of models that drops it."),
]

if __name__ == "__main__":
    for k, (name, title, blurb) in enumerate(PARTS, 1):
        assert name == f"s{k:02d}"
        section(name, k, title, blurb)
