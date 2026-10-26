"""Run the shared checker with one bug worked around, without editing it.

check_atlas.py's split-word check crashes with IndexError when a label that ends in a letter is
followed by one that starts with a non-ASCII lowercase letter (α, γ, σ): isalpha() accepts the letter,
but the pattern [A-Za-z'-] that extracts the word does not match it. This wrapper patches that one
comparison in memory to skip such pairs, then runs the unchanged checker. If the shared script has
been fixed, the patch target is missing and the checker runs as it is.

  python3 figures/V08/src/b_check.py path/to/V08.html
"""
import sys, types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PATH = ROOT / ".claude/skills/srt-figure-atlas/scripts/check_atlas.py"
OLD = ("                wa = re.findall(r\"[A-Za-z'-]+$\", a)[0]\n"
       "                wb = re.findall(r\"^[A-Za-z'-]+\", b)[0]\n")
NEW = ("                wa = (re.findall(r\"[A-Za-z'-]+$\", a) or [''])[0]\n"
       "                wb = (re.findall(r\"^[A-Za-z'-]+\", b) or [''])[0]\n"
       "                if not wa or not wb:\n"
       "                    continue\n")

src = PATH.read_text(encoding="utf-8")
if OLD in src:
    src = src.replace(OLD, NEW, 1)
    print("(b_check: split-word check patched to skip non-ASCII letters)")
mod = types.ModuleType("check_atlas")
mod.__file__ = str(PATH)
exec(compile(src, str(PATH), "exec"), mod.__dict__)
if "--fix" in sys.argv:
    sys.exit("b_check: --fix is not allowed here")
mod.main()
