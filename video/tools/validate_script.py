#!/usr/bin/env python3
"""Validate chapter scripts against the plan and the TTS rules.

  python3 video/tools/validate_script.py video/v01/script/ch05.json [...]
  python3 video/tools/validate_script.py --all video/v01      # every chapter + global coverage

Exit status 1 if any error is found. Warnings do not fail.
"""
import json, re, sys
from pathlib import Path

PLAN = {
    "ch00": [], "ch01": list(range(1, 11)), "ch02": list(range(11, 16)),
    "ch03": list(range(16, 26)) + [27], "ch04": list(range(28, 33)) + list(range(57, 61)),
    "ch05": list(range(61, 70)), "ch06": list(range(70, 84)), "ch07": list(range(84, 91)),
    "ch08": list(range(91, 105)), "ch09": list(range(105, 109)), "ch10": list(range(109, 119)),
    "ch11": list(range(119, 128)), "ch12": list(range(128, 131)), "ch13": list(range(131, 142)),
    "ch14": list(range(37, 44)), "ch15": [33, 34, 35, 36, 44, 45, 46],
    "ch16": [26] + list(range(47, 55)) + [56], "ch17": [142, 143, 144, 145, 55], "ch18": [146, 147],
}

BANNED = [r"\bthis figure\b", r"\bthe atlas\b", r"\bthe video (says|explains|shows)\b", r"\bpresenter\b",
          r"\bthis document\b", r"\bthe instructor\b", r"\badditional context\b"]
# things the voice will mangle if left in `say`
TTS_BAD = [
    (r"\d\s*(ms|GB|MB|KB|TB|TB/s|GB/s|B/s|W)\b", "unit abbreviation after a number; spell the unit out"),
    (r"\bTB/s\b|\bGB/s\b", "rate abbreviation; say 'terabytes per second'"),
    (r"\^", "caret; say 'ten to the fifteen'"),
    (r"[×÷→←≈≤≥±_]", "symbol; say it in words"),
    (r"\bW_[QKVO]\b", "matrix name with underscore; say 'W K' or 'the key matrix'"),
    (r"\b(TTFT|TPOT|HBM|GPU|CPU|KV|FLOPS?|LLM|API|LRU|FP16|FP32|INT8|INT4)\b", "acronym; spell with spaces (G P U) or say it in words"),
    (r"\bH100\b|\bH200\b|\bB200\b", "chip name; write 'H one hundred'"),
    (r"\([^)]*\)", "parentheses do not read aloud well"),
    (r"—|–", "dash; use a comma or full stop"),
    (r"\be\.g\.|\bi\.e\.|\betc\.", "abbreviation"),
]


def words(s):
    return len(re.findall(r"[A-Za-z0-9']+", s))


def check(path, errors, warnings):
    p = Path(path)
    try:
        d = json.loads(p.read_text())
    except Exception as e:
        errors.append(f"{p.name}: invalid JSON: {e}")
        return set(), 0
    ch = d.get("chapter")
    if ch not in PLAN:
        errors.append(f"{p.name}: unknown chapter id {ch!r}")
        return set(), 0
    for k in ("title", "kicker", "figs", "scenes", "checks"):
        if k not in d:
            errors.append(f"{ch}: missing key {k!r}")
    want = set(PLAN[ch])
    if set(d.get("figs", [])) != want:
        errors.append(f"{ch}: chapter figs {sorted(d.get('figs', []))} != plan {sorted(want)}")
    covered, total_words = set(), 0
    for si, sc in enumerate(d.get("scenes", []), 1):
        sid = sc.get("id")
        if sid != f"{ch}_s{si:02d}":
            errors.append(f"{ch}: scene {si} id {sid!r} should be {ch}_s{si:02d}")
        for k in ("name", "figs", "visual", "beats"):
            if k not in sc:
                errors.append(f"{sid}: missing key {k!r}")
        covered |= set(sc.get("figs", []))
        beats = sc.get("beats", [])
        if not beats:
            errors.append(f"{sid}: no beats")
        for bi, b in enumerate(beats, 1):
            bid = b.get("id")
            if bid != f"b{bi}":
                errors.append(f"{sid}: beat {bi} id {bid!r} should be b{bi}")
            say, show = b.get("say", ""), b.get("show", "")
            if not say.strip():
                errors.append(f"{sid}.{bid}: empty say")
            if not show.strip():
                errors.append(f"{sid}.{bid}: empty show")
            n = words(say)
            total_words += n
            if n > 70:
                warnings.append(f"{sid}.{bid}: {n} words in one beat; split it")
            for pat in BANNED:
                if re.search(pat, say, re.I):
                    errors.append(f"{sid}.{bid}: banned phrase /{pat}/ in say")
            for pat, why in TTS_BAD:
                m = re.search(pat, say)
                if m:
                    errors.append(f"{sid}.{bid}: TTS: {why}: {m.group(0)!r}")
    missing = want - covered
    if missing:
        errors.append(f"{ch}: figs not covered by any scene: {sorted(missing)}")
    extra = covered - want
    if extra:
        errors.append(f"{ch}: scenes claim figs owned by another chapter: {sorted(extra)}")
    for c in d.get("checks", []):
        if not all(k in c for k in ("claim", "python", "result")):
            errors.append(f"{ch}: malformed check {c}")
    return covered, total_words


def main(argv):
    files = []
    if argv and argv[0] == "--all":
        root = Path(argv[1]) / "script"
        files = sorted(root.glob("ch*.json"))
    else:
        files = [Path(a) for a in argv]
    errors, warnings, allfigs, words_total = [], [], set(), 0
    for f in files:
        cov, n = check(f, errors, warnings)
        allfigs |= cov
        words_total += n
        print(f"{f.name}: {n} words, about {n/150:.1f} min")
    if argv and argv[0] == "--all":
        gaps = set(range(1, 148)) - allfigs
        if gaps:
            errors.append(f"film: figures not covered anywhere: {sorted(gaps)}")
        print(f"TOTAL: {words_total} words, about {words_total/150:.0f} min of narration")
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
