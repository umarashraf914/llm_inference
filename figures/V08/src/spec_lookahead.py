"""V8 Part 5, lookahead decoding: the model drafts for itself (review §4 G1–G4; §5 P19, P22).

  python3 figures/V08/src/spec_lookahead.py     writes items a31–a34 and o014

o014     rewritten: lookahead drops the guesser; what each method uses to guess, side by side
a31  G1  widget: Jacobi iteration, round by round, alone and with the pool
a32  G2  A right fragment in the wrong place is still a right fragment
a33  G3  The pool: fragments filed under their first token
a34  G4  A benchmark is a fixed exam, and every speed-up is measured on one

The model here is a stand-in, small enough to follow by hand. Given the right text so far it writes
the next word of "the cat sat on the mat"; given text with a wrong word in it, it writes the word that
usually follows the last word (cat → sat, on → the, the → mat, …). That is enough to show what Jacobi
iteration does, why it alone barely helps, and how lookahead's pool turns its waste into tokens.
Sources read: lookahead decoding (arXiv 2402.02057), MT-Bench (2306.05685), EAGLE-3 (2503.01840),
Medusa (2401.10774).
"""
import json
from spec_common import (cell, ghost, txt, hd, ln, arr, box, prose, emit, at, bar, f, fc, widget,
                         mulberry32, MULBERRY_JS)

C = ["the", "cat", "sat", "on", "the", "mat"]          # what the model writes, one word at a time
B = {"the": "mat", "cat": "sat", "sat": "on", "on": "the", "mat": ".", ".": "the",
     "a": "dog", "dog": "ran", "ran": "off", "off": ".", "big": "dog", "red": "hat", "hat": "."}
V = sorted(set(B) | set(C))                           # the words a starting guess is drawn from
N = len(C)
Y0 = ["a", "cat", "on", "big", "hat", "dog"]           # the starting guess drawn in the figures


def nxt(ctx):
    """The stand-in model: the next word, given everything to its left."""
    return C[len(ctx)] if list(ctx) == C[:len(ctx)] else B[ctx[-1]]


def settled(row):
    s = 0
    while s < N and row[s] == C[s]:
        s += 1
    return s


def run(y0, pool_on):
    """Rounds of Jacobi iteration. Each round is one pass: every position is recomputed from the
    previous round's guesses to its left. With the pool, the same pass also checks the fragments
    filed under the last settled word; matching words settle at once, plus the word after them."""
    rows, sets, pool, used = [list(y0)], [0], {}, [None]
    k = 0
    while sets[-1] < N:
        k += 1
        prev, s = rows[-1], sets[-1]
        jac = [nxt(prev[:i]) if i else C[0] for i in range(N)]
        new, hit = max(s + 1, settled(jac)), None
        if pool_on and s >= 1:
            best = 0
            for frag in pool.get(C[s - 1], []):
                m = 0
                while m < 2 and s + m < N and frag[1 + m] == C[s + m]:
                    m += 1
                if m > best:
                    best, hit = m, frag
            new = max(new, min(N, s + best + 1))
        rows.append([C[i] if i < new else jac[i] for i in range(N)])
        sets.append(new)
        used.append(hit)
        if pool_on and k >= 2:                    # file the fragments this round completed
            for i in range(N - 2):
                a, b, c = rows[k - 2][i], rows[k - 1][i + 1], rows[k][i + 2]
                if b == nxt(rows[k - 2][:i + 1]) and c == nxt(rows[k - 1][:i + 2]):
                    pool.setdefault(a, [])
                    if (a, b, c) not in pool[a]:
                        pool[a].append((a, b, c))
    return rows, sets, used, pool


def start_guess(seed):
    r = mulberry32(seed)
    return [V[int(r() * len(V))] for _ in range(N)]


ROWS, SETS, _, _ = run(Y0, False)
PROWS, PSETS, PUSED, PPOOL = run(Y0, True)
assert SETS == [0, 1, 2, 3, 4, 5, 6]                                   # alone: one word a round
assert PSETS == [0, 1, 2, 5, 6] and PUSED[3] == ("cat", "sat", "on")   # pool: three at once in round 3
LUCKY = [(k, i) for k in range(len(ROWS) - 1) for i in range(N)
         if i >= SETS[k] and ROWS[k][i] == C[i] and ROWS[k + 1][i] != C[i]]
assert LUCKY == [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5)]              # a right word lands, then is overwritten
DIAG = [(0, 2), (1, 3), (2, 4)]                                       # 'on the mat', one place early
assert [ROWS[r][i] for r, i in DIAG] == ["on", "the", "mat"] and C[3:6] == ["on", "the", "mat"]


def row_note(k, sets, used):
    if k == 0:
        return "the starting guess"
    extra = sets[k] - sets[k - 1]
    note = f"{sets[k]} settled"
    if used[k]:
        note += f", +{extra} from the pool"
    return note


def mode_summary(sets, pool_on):
    r = len(sets) - 1
    return (f"{'With the pool' if pool_on else 'Jacobi alone'}: all {N} words settled after {r} rounds"
            + (", one a round" if sets == list(range(N + 1)) else ""))


# ---- o014: the claim, and the guessers side by side ---------------------------------------------------
def o014():
    b = [hd(40, 46, "What makes the guesses, method by method, for a 70B target")]
    cols = [(40, "method"), (150, "the guesser"), (420, "extra weights"), (540, "output")]
    for x, h in cols:
        b.append(txt(x, 78, h, "sub2"))
    rows = [("2022 paper", "a second model, 100 times smaller", "0.7 billion", "exact", "u"),
            ("Medusa", "extra heads on the target", "1.1 billion a head", "exact only with p ÷ q", "u"),
            ("EAGLE", "one small layer on the target's vectors", "1 billion", "exact", "u"),
            ("lookahead", "the target itself, from its own spare guesses", "none", "exact", "m")]
    for k, (m, g, w, o, c) in enumerate(rows):
        y = 90 + k * 40
        b.append(cell(40, y, 600, 30, c))
        b.append(txt(52, y + 20, m, "sub"))
        b.append(txt(150, y + 20, g, "sub"))
        b.append(txt(420, y + 20, w, "sub"))
        b.append(txt(540, y + 20, o, "sub"))
    body, yb = prose(90 + 4 * 40 + 40, [
        "Lookahead decoding gets several tokens out of a single pass with no drafter at all. It runs "
        "the model on several future positions at once, taking a rough guess at all of them, then "
        "runs again, improving the whole set of guesses together: an old method for solving many "
        "equations at once, Jacobi iteration.",
        "The extra weights in the table are for the 70B model followed through this series: a drafter "
        "a hundred times smaller has 0.7 billion; a Medusa head of this shape about 1.1 billion "
        "({{fig:v08-a20}}); EAGLE-1's drafter for a 70B target 0.99 billion. Lookahead adds nothing to "
        "store, read or train.",
    ])
    emit("o014", at("Look ahead decoding gets several tokens"),
         "Lookahead decoding drops the guesser altogether", yb + 30, b + [body],
         "Each row removes something the one above needed: the second model, then most of the second "
         "model, then any trained guesser at all. The next figures show where lookahead's guesses come "
         "from instead.")


# ---- a31 · G1: the widget ---------------------------------------------------------------------------------
GX, GW, GP, GY, GH, GR = 110, 64, 72, 74, 24, 30      # grid: x, cell width, pitch, top, cell height, row pitch


def cell_view(rows, sets, k, i):
    """What one cell shows: its word, marked if right but not yet settled, and its colour."""
    w = rows[k][i]
    if i < sets[k]:
        return w, "m"
    return (w + " ✓", "u") if w == C[i] else (w, "u")


WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const C = __C__, B = __B__, V = __V__, Y0 = __Y0__, N = C.length;
  __MULBERRY__
  const q$ = s => fig.querySelector(s), rad = [...fig.querySelectorAll('input[type=radio]')];
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const btn = [...fig.querySelectorAll('button')];
  let y0 = Y0.slice(), seed = 0;
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const nxt = ctx => same(ctx, C.slice(0, ctx.length)) ? C[ctx.length] : B[ctx[ctx.length - 1]];
  const settled = row => { let s = 0; while (s < N && row[s] === C[s]) s++; return s; };
  function run(start, poolOn) {
    const rows = [start.slice()], sets = [0], used = [null], pool = {};
    let k = 0;
    while (sets[sets.length - 1] < N) {
      k++;
      const prev = rows[rows.length - 1], s = sets[sets.length - 1];
      const jac = []; for (let i = 0; i < N; i++) jac.push(i ? nxt(prev.slice(0, i)) : C[0]);
      let nw = Math.max(s + 1, settled(jac)), hit = null;
      if (poolOn && s >= 1) {
        let best = 0;
        for (const fr of (pool[C[s - 1]] || [])) {
          let m = 0; while (m < 2 && s + m < N && fr[1 + m] === C[s + m]) m++;
          if (m > best) { best = m; hit = fr; }
        }
        nw = Math.max(nw, Math.min(N, s + best + 1));
      }
      const row = []; for (let i = 0; i < N; i++) row.push(i < nw ? C[i] : jac[i]);
      rows.push(row); sets.push(nw); used.push(hit);
      if (poolOn && k >= 2) for (let i = 0; i < N - 2; i++) {
        const a = rows[k - 2][i], b = rows[k - 1][i + 1], c = rows[k][i + 2];
        if (b === nxt(rows[k - 2].slice(0, i + 1)) && c === nxt(rows[k - 1].slice(0, i + 2))) {
          if (!pool[a]) pool[a] = [];
          if (!pool[a].some(fr => fr[1] === b && fr[2] === c)) pool[a].push([a, b, c]);
        }
      }
    }
    return {rows, sets, used};
  }
  function draw() {
    const poolOn = rad[1].checked, shown = +sl.value, r = run(y0, poolOn), R = r.rows.length - 1;
    val.textContent = String(shown);
    for (let k = 0; k <= N; k++) {
      const vis = k <= Math.min(shown, R);
      q$(`[data-note="${k}"]`).textContent = !vis ? '' : k === 0 ? 'the starting guess' :
        r.sets[k] + ' settled' + (r.used[k] ? ', +' + (r.sets[k] - r.sets[k - 1]) + ' from the pool' : '');
      for (let i = 0; i < N; i++) {
        const t = q$(`[data-w="${k}-${i}"]`), g = t.parentNode;
        g.setAttribute('visibility', vis ? 'visible' : 'hidden');
        if (!vis) continue;
        const w = r.rows[k][i], set = i < r.sets[k];
        t.textContent = set ? w : (w === C[i] ? w + ' ✓' : w);
        g.setAttribute('class', set ? 'm' : 'u');
      }
    }
    q$('[data-sum]').textContent = (poolOn ? 'With the pool' : 'Jacobi alone') + ': all ' + N +
      ' words settled after ' + R + ' rounds' + (same(r.sets, [...Array(N + 1).keys()]) ? ', one a round' : '');
  }
  rad.forEach(x => x.addEventListener('change', draw));
  sl.addEventListener('input', draw);
  btn[0].addEventListener('click', () => { seed += 1; const r = mulberry32(seed);
    y0 = []; for (let i = 0; i < N; i++) y0.push(V[Math.floor(r() * V.length)]); draw(); });
  btn[1].addEventListener('click', () => { y0 = Y0.slice(); seed = 0; rad[0].checked = true; sl.value = N; draw(); });
  draw();
})();</script>"""


def a31():
    s = [hd(40, 34, "Six positions refined together: one row per round, one pass per row")]
    for i in range(N):
        s.append(txt(GX + i * GP + GW / 2, 64, f"position {i + 1}", "sub2", "middle"))
    for k in range(N + 1):
        y = GY + k * GR
        s.append(txt(40, y + 17, "start" if k == 0 else f"round {k}", "cap"))
        for i in range(N):
            w, c = cell_view(ROWS, SETS, k, i)
            s.append(f'<g class="{c}" visibility="visible"><rect x="{GX + i * GP}" y="{y}" width="{GW}" '
                     f'height="{GH}" rx="3"/><text class="sub" x="{GX + i * GP + GW / 2}" y="{y + GH / 2}" '
                     f'text-anchor="middle" dominant-baseline="central" data-w="{k}-{i}">{w}</text></g>')
        s.append(f'<text class="sub2" x="{GX + N * GP + 4}" y="{y + 17}" data-note="{k}">'
                 f'{row_note(k, SETS, [None] * (N + 1))}</text>')
    yb0 = GY + (N + 1) * GR + 16
    s.append(txt(40, yb0 + 4, "amber: settled for good. ✓: the right word, not yet settled.", "sub2"))
    s.append(f'<text class="sub2" x="40" y="{yb0 + 28}" data-sum="">{mode_summary(SETS, False)}</text>')
    body, yb = prose(yb0 + 74, [
        "Start from a guess at all six positions, here random words. Each round is one pass of the "
        "model: every position is recomputed from the previous round's words to its left. Position 1 "
        "has nothing to its left but the prompt, so it is right after one round; position 2 is right "
        "once position 1 was, and so on. A position only settles once everything before it has.",
        "So alone the method settles one word a round, no faster than ordinary decoding, and each "
        "round a right word lands one place past the settled ones and is overwritten the next. Switch "
        "on the pool and the same rounds finish sooner (two figures on explain why). New starting "
        "guesses are drawn at random; the stepping was checked against the same rules in Python.",
    ])
    ctl1 = ("<label class='opt'><input type='radio' name='v08-a31-mode' value='alone' checked> Jacobi alone</label>"
            "<label class='opt'><input type='radio' name='v08-a31-mode' value='pool'> with the pool</label>"
            f"<label>rounds shown <input type='range' min='0' max='{N}' step='1' value='{N}'>"
            f"<span class='val'>{N}</span></label>")
    ctl2 = "<button type='button'>New starting guess</button><button type='button'>Reset</button>"
    js = (WIDGET_JS.replace("__C__", json.dumps(C)).replace("__B__", json.dumps(B))
          .replace("__V__", json.dumps(V)).replace("__Y0__", json.dumps(Y0)).replace("__MULBERRY__", MULBERRY_JS))
    widget("a31", at("It runs the model on several future positions at once"),
           "Jacobi iteration: guess every position, then refine them all at once", [ctl1, ctl2],
           yb + 26, s + [body],
           "Alone, Jacobi iteration settles a word a round and throws away right words it lands too "
           "early. The waste is the raw material: lookahead keeps it.", js)


# ---- a32 · G2: right fragment, wrong place --------------------------------------------------------------
def a32():
    b = [hd(40, 46, "The same rounds: three words on a diagonal are a real continuation")]
    rows_shown = 4
    for i in range(N):
        b.append(txt(GX + i * GP + GW / 2, 76, f"{i + 1}", "sub2", "middle"))
    for k in range(rows_shown):
        y = 86 + k * 34
        b.append(txt(40, y + 17, "start" if k == 0 else f"round {k}", "cap"))
        for i in range(N):
            w, c = cell_view(ROWS, SETS, k, i)
            if (k, i) in DIAG:
                c = "h"
            b.append(cell(GX + i * GP, y, GW, GH, c, label=w))
    for (r1, i1), (r2, i2) in zip(DIAG, DIAG[1:]):
        b.append(arr(GX + i1 * GP + GW + 1, 86 + r1 * 34 + GH + 1, GX + i2 * GP - 1, 86 + r2 * 34 - 1))
    y = 86 + rows_shown * 34 + 6
    b.append(txt(GX, y + 10, "red: ‘on’, then ‘the’, then ‘mat’, each written after the one before it", "sub2"))
    b.append(txt(GX, y + 30, "they belong at positions 4, 5 and 6; here they sit at 3, 4 and 5", "sub2"))
    body, yb = prose(y + 74, [
        "Each word in a round was written by reading the word to its left in the round before. So a "
        "word and its upper-left neighbour are a pair the model actually wrote, and a run of such "
        "pairs down a diagonal is a real fragment: ‘on’, then ‘the’, then ‘mat’.",
        "That fragment is right; it is just in the wrong place, one position early, and the next "
        "round writes over it. A guess in the wrong position is not the same as a wrong guess: the "
        "words still form a real continuation the model would produce somewhere.",
        "The ✓ marks show the other waste: in every round a right word lands one place past the "
        "settled ones, and the next round overwrites it.",
    ])
    emit("a32", at("But a guess in the wrong position is not the same as a wrong guess"),
         "A right fragment in the wrong place is still a right fragment", yb + 30, b + [body],
         "Jacobi iteration keeps producing real continuations and then discarding them because they "
         "turned up at the wrong offset. Lookahead's whole idea is to stop discarding them.")


# ---- a33 · G3: the pool ------------------------------------------------------------------------------------
def a33():
    pool2 = run(Y0, True)[3]
    # the pool as it stands when round 3 begins: fragments completed by rounds 0 to 2
    rows = PROWS
    before3 = {}
    for i in range(N - 2):
        a_, b_, c_ = rows[0][i], rows[1][i + 1], rows[2][i + 2]
        if b_ == nxt(rows[0][:i + 1]) and c_ == nxt(rows[1][:i + 2]):
            before3.setdefault(a_, []).append((a_, b_, c_))
    assert before3 == {"a": [("a", "dog", "ran")], "cat": [("cat", "sat", "on")], "on": [("on", "the", "mat")],
                       "big": [("big", "dog", "ran")]}
    assert ("the", "mat", ".") in pool2["the"] and PUSED[4] == ("the", "mat", ".")
    b = [hd(40, 46, "The pool after round 2, filed under each fragment's first word")]
    keys = ["a", "big", "cat", "on"]
    for k, key in enumerate(keys):
        y = 66 + k * 36
        b.append(cell(60, y, 70, 26, "m" if key == "cat" else "u", label=key))
        for j, frag in enumerate(before3[key]):
            b.append(cell(160, y, 150, 26, "m" if key == "cat" else "u", label=" ".join(frag)))
    b.append(txt(60, 66 + 4 * 36 + 10, "key", "sub2"))
    b.append(txt(160, 66 + 4 * 36 + 10, "fragment", "sub2"))
    xr = 360
    b.append(txt(xr, 76, "round 3: the settled text ends in ‘cat’", "sub2"))
    b.append(cell(xr, 86, 64, 26, "m", label="the"))
    b.append(cell(xr + 70, 86, 64, 26, "m", label="cat"))
    b.append(arr(xr + 100, 116, xr + 100, 138))
    b.append(txt(xr, 160, "look up ‘cat’: check ‘sat on’ in the same pass", "sub2"))
    for j, w in enumerate(["the", "cat", "sat", "on", "the"]):
        b.append(cell(xr + j * 52, 172, 46, 26, "m", label=w))
    b.append(txt(xr, 222, "‘sat’ and ‘on’ check out, and the pass also gives the", "sub2"))
    b.append(txt(xr, 240, "word after them: three settled in one round", "sub2"))
    body, yb = prose(270, [
        "Lookahead keeps every fragment the rounds produce in a pool, filed under its first word. Each "
        "time the model emits a real token, the pass also pulls out the fragments that begin with "
        "that token and checks them, exactly as a drafter's guesses are checked.",
        "When round 3 begins, the settled text ends in ‘cat’, and the pool holds ‘cat sat on’. Both "
        "‘sat’ and ‘on’ check out, and the check also yields the word after them, as it would for "
        "any drafter, so positions 3, 4 and 5 settle at once. In round 4 the fragment ‘the mat .’ "
        "finishes the sentence: four rounds instead of six.",
        "The model ends up drafting for itself out of its own discarded work, with nothing extra to "
        "train, and the check keeps the output exact.",
    ])
    emit("a33", at("look ahead keeps every one of them in a pool"),
         "The pool: fragments filed under their first token", yb + 30, b + [body],
         "The pool turns Jacobi iteration's waste into a free drafter. Its guesses are only as good as "
         "the fragments the rounds happen to produce, which is why its speed-ups are modest.")


# ---- a34 · G4: what a benchmark is -------------------------------------------------------------------------
CATS = ["writing", "roleplay", "extraction", "reasoning", "math", "coding", "STEM knowledge", "humanities"]
EAGLE3_V13B = [("MT-Bench, chat", 5.58), ("HumanEval, code", 6.47), ("GSM8K, maths", 5.32),
               ("Alpaca, instructions", 5.16), ("CNN/DM, summaries", 5.01)]   # EAGLE-3 paper, Table 1, T = 0


def a34():
    assert len(CATS) * 10 == 80
    b = [hd(40, 46, "MT-Bench: 80 fixed questions, ten in each of eight categories")]
    for r, cat in enumerate(CATS):
        y = 64 + r * 22
        b.append(txt(40, y + 14, cat, "sub2"))
        for j in range(10):
            b.append(cell(150 + j * 20, y, 16, 16, "u", rx=2))
    b.append(txt(150, 64 + 8 * 22 + 16, "each question has a follow-up turn", "sub2"))
    xr, S = 400, 34
    b.append(txt(xr, 60, "EAGLE-3's speed-up, one 13B model, five benchmarks", "sub2"))
    for k, (lab, v) in enumerate(EAGLE3_V13B):
        y = 72 + k * 34
        b.append(cell(xr, y, v * S, 24, "m" if v == max(x for _, x in EAGLE3_V13B) else "u", label=f"{v:.2f}×"))
        b.append(txt(xr, y + 36 - 2, lab, "sub2"))
    assert max(v for _, v in EAGLE3_V13B) == 6.47 and min(v for _, v in EAGLE3_V13B) == 5.01
    body, yb = prose(64 + 8 * 22 + 62, [
        "A benchmark is a fixed set of questions with a fixed way of scoring the answers, so that "
        "different models, or different methods, can be compared on the same exam. MT-Bench has 80 "
        "questions in eight categories, ten each, and every question has a follow-up turn; a strong "
        "model, GPT-4, scores each answer from 1 to 10.",
        "A speed-up is measured on a benchmark's prompts, and it depends on them, because predictable "
        "text accepts more guesses. EAGLE-3 on one 13B model ranges from 5.0× summarising news to "
        "6.5× writing code; Medusa's best category, extraction, ran 3.6× against 2.8× overall.",
        "Lookahead decoding reports up to 1.8× on MT-Bench, a benchmark of multi-turn dialogues, with "
        "the output still exact.",
    ])
    emit("a34", at("which is a benchmark for evaluating LLMs"),
         "A benchmark is a fixed exam, and every speed-up is measured on one", yb + 30, b + [body],
         "A speed-up belongs to the method, the model, the hardware and the prompts together. Two "
         "numbers measured on different benchmarks compare the benchmarks as much as the methods.")


if __name__ == "__main__":
    for fn in (o014, a31, a32, a33, a34):
        fn()
