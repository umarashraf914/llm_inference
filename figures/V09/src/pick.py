"""V9 Part 8, the pick and the user (stops 5 and 6): Fig 12 retitled, N26 (the call as JSON, cut into
tokens), N27 (the state after the brace), N27w (a stepper through the whole call), N28 (mask, then
renormalise), Fig 13 fixed. plans/depth_pass/V09_review.md §4 I and §5 Figs 12, 13.

  python3 figures/V09/src/pick.py       writes items o012 n26 n27 n27w n28 o013

The masks are not typed in. A small checker below decides whether a piece of text can still grow into
a valid call in this format (three tools, each with its own arguments, in a fixed field order), and a
candidate token is allowed exactly when the text so far plus that token passes it. The candidates and
their probabilities are illustrative; which of them survive is computed.
"""
import json
from common import SRT, cell, ghost, txt, hd, ln, para, stamp, emit, emit_widget, width, f, n, esc

# ---- the format, and a checker for "can this still become a valid call?" -----------------------------
WS, STR = object(), object()
TOOLS = {"run_tests": ["path"], "read_file": ["path"], "edit_file": ["path", "find", "replace"]}


def _items(tool):
    it = ["{", WS, '"name"', WS, ":", WS, f'"{tool}"', WS, ",", WS, '"arguments"', WS, ":", WS, "{"]
    for k, field in enumerate(TOOLS[tool]):
        if k:
            it += [WS, ","]
        it += [WS, f'"{field}"', WS, ":", WS, STR]
    return it + [WS, "}", WS, "}"]


def _m(s, i, its, k):
    if i == len(s):
        return True                                   # the text ended: still a valid beginning
    if k == len(its):
        return False
    it = its[k]
    if it is WS:                                      # any number of spaces, including none
        j = i
        while True:
            if _m(s, j, its, k + 1):
                return True
            if j < len(s) and s[j] == " ":
                j += 1
            else:
                return False
    if it is STR:                                     # a quoted string with no quote inside
        if s[i] != '"':
            return False
        j = i + 1
        while j < len(s) and s[j] != '"':
            j += 1
        return True if j == len(s) else _m(s, j + 1, its, k + 1)
    c = min(len(it), len(s) - i)
    if s[i:i + c] != it[:c]:
        return False
    return True if i + c == len(s) else _m(s, i + len(it), its, k + 1)


def valid(s):
    return any(_m(s, 0, _items(t), 0) for t in TOOLS)


CALL = '{"name": "edit_file", "arguments": {"path": "parser.py", "find": "a - b", "replace": "a + b"}}'
# (token, candidates with illustrative probabilities, what the format allows at this point)
STEPS = [
    ("{", [("{", .70), ("Sure", .20), ("I", .10)], "nothing written yet: a call must open with a brace"),
    ('"name', [('"name', .60), ('"tool', .25), ('"function', .10), (" ", .05)],
     'after the brace: the format requires the field "name" first, or a space'),
    ('":', [('":', .95), ("s", .03), ("_", .02)], "inside a field name: only its own letters, then the closing quote"),
    (' "', [(' "', .90), (" {", .06), (" null", .04)], "after the colon: the tool's name, a quoted string"),
    ("edit", [("pytest", .40), ("edit", .30), ("run", .20), ("read", .05), ("bash", .05)],
     "inside the tool's name: it must grow into one of the three listed tools"),
    ("_file", [("_file", .97), ("_files", .02), ("or", .01)], "the name so far is 'edit': only edit_file can follow"),
    ('",', [('",', .96), ('"}', .03), (" ", .01)], "the name is complete: close it, then a comma"),
    (' "', [(' "', .95), (" }", .05)], 'after the comma: the next field must be "arguments"'),
    ("arguments", [("arguments", .88), ("args", .08), ("parameters", .04)], 'inside the second field name: "arguments"'),
    ('":', [('":', .98), ("_list", .02)], "close the field name, then a colon"),
    (' {"', [(' {"', .90), (' "', .07), (" [", .03)], "the arguments are an object: an opening brace"),
    ("path", [("path", .80), ("file", .15), ("filename", .05)], 'edit_file\'s first argument is "path"'),
    ('":', [('":', .97), ("s", .03)], "close the field name, then a colon"),
    (' "', [(' "', .97), (" null", .03)], "a string value must follow"),
    ("parser", [("parser", .50), ("tests", .40), ("src", .10)], "inside a free string: any text without a quote"),
    (".py", [(".py", .90), ("_test", .10)], "still inside the string: anything goes"),
    ('",', [('",', .92), ('"}', .08)], "close the string; edit_file still needs two more fields"),
    (' "', [(' "', .98), (" }", .02)], 'the next field must be "find"'),
    ("find", [("find", .70), ("old", .20), ("search", .10)], 'edit_file\'s second argument is "find"'),
    ('":', [('":', .99), ("_text", .01)], "close the field name, then a colon"),
    (' "', [(' "', .99), (" [", .01)], "a string value must follow"),
    ("a", [("a", .60), ("return", .30), ("x", .10)], "inside a free string: any text without a quote"),
    (" -", [(" -", .85), (" +", .15)], "still inside the string: the format cannot tell right from wrong"),
    (" b", [(" b", .95), (" 1", .05)], "still inside the string"),
    ('",', [('",', .94), ('"}}', .06)], 'close the string; edit_file still needs "replace"'),
    (' "', [(' "', .99), (" }", .01)], 'the next field must be "replace"'),
    ("replace", [("replace", .75), ("with", .15), ("new", .10)], 'edit_file\'s third argument is "replace"'),
    ('":', [('":', .98), ("ment", .02)], "close the field name, then a colon"),
    (' "', [(' "', .99), (" null", .01)], "a string value must follow"),
    ("a", [("a", .70), ("return", .20), ("b", .10)], "inside a free string: any text without a quote"),
    (" +", [(" +", .90), (" -", .10)], "still inside the string"),
    (" b", [(" b", .97), (" 1", .03)], "still inside the string"),
    ('"}}', [('"}}', .90), ('",', .08), ('"}', .02)], "every field is done: close the string and both braces"),
]
CONTENT = {4, 5, 14, 15, 21, 22, 23, 29, 30, 31}       # tokens the model chooses; the rest the format fixes
TOKENS = [t for t, _, _ in STEPS]
assert "".join(TOKENS) == CALL and valid(CALL) and len(TOKENS) == 33 and len(CALL) == 94


def resolve(k):
    """Step k: prefix, candidates with allowed flags, allowed total, and probabilities after the mask."""
    tok, cands, state = STEPS[k]
    pre = "".join(TOKENS[:k])
    rows = [(c, p, valid(pre + c)) for c, p in cands]
    tot = 0.0
    for _, p, ok in rows:
        if ok:
            tot += p
    after = [p / tot if ok else None for _, p, ok in rows]
    return pre, tok, state, rows, tot, after


for k, (tok, cands, state) in enumerate(STEPS):
    pre, _, _, rows, tot, after = resolve(k)
    assert abs(sum(p for _, p, _ in rows) - 1) < 1e-9, k
    i = [c for c, _, _ in rows].index(tok)
    assert rows[i][2] and after[i] == max(a for a in after if a is not None), k     # the call takes the top survivor
    assert len(rows) <= 5
# the specific claims the prose makes
assert [ok for _, _, ok in resolve(0)[3]] == [True, False, False]
r1 = resolve(1)
assert [ok for _, _, ok in r1[3]] == [True, False, False, True] and round(r1[4], 2) == 0.65
assert [round(a, 3) for a in r1[5] if a is not None] == [0.923, 0.077]
r4 = resolve(4)
assert [ok for _, _, ok in r4[3]] == [False, True, True, True, False] and round(r4[4], 2) == 0.55
assert [round(a, 3) for a in r4[5] if a is not None] == [0.545, 0.364, 0.091]
assert round(.30 / .20, 2) == 1.5 and round(.30 / .05, 2) == 6.0
assert all(ok for _, _, ok in resolve(14)[3]) and all(ok for _, _, ok in resolve(22)[3])   # free text: no help
VOCAB = 163840                                            # Kimi K2's vocabulary (config.json)


def show(t):
    return t.replace(" ", "␣")


def o012():
    b = [hd(40, 46, "One more step before a token is chosen")]
    flow = [("the model's scores", 170, "u"), ("tokens that break the format removed", 240, "h"),
            ("pick from the rest", 140, "s")]
    x = 40
    for k, (s_, w, c) in enumerate(flow):
        assert width(s_, "sub") + 24 <= w
        b.append(cell(x, 66, w, 40, c, rx=4, label=s_))
        if k < 2:
            b.append(f'<line class="conn" x1="{x + w + 4}" y1="86" x2="{x + w + 20}" y2="86" marker-end="url(#arw)"/>')
        x += w + 25
    body, yb = para(146, [
        "Every token that decode produces passes one more step before it is chosen. The model's last "
        "layer gives a score to every token in its vocabulary, 163,840 of them for a model shaped like "
        "Kimi K2, and the sampler turns the scores into probabilities and draws one ({{fig:v07-o021}}).",
        "The answer to this request has to be a tool call, so before the draw the engine removes every "
        "token that does not fit the call's format. That is constrained decoding ({{fig:v07-o023}}).",
        "It is the last point inside generation where the output can be steered. The software that runs "
        "the tool still parses the call, and can still refuse it ({{fig:v01-o024}}).",
    ])
    emit("o012", stamp(SRT, "Every token that decode produces passes"),
         "The engine deletes every token that would break the tool call", yb + 30, b + [body],
         "The guarantee is narrow: the tool call will parse. Whether it is the right call is a different "
         "question entirely.")


def n26():
    b = [hd(40, 46, "The call as characters: what the parser reads")]
    b.append(f'<g class="u"><text class="sub" x="40" y="80" style="white-space:pre">{esc(CALL)}</text></g>')
    assert width(CALL, "sub") < 600
    b.append(txt(40, 100, f"{len(CALL)} characters: braces open and close objects, quoted field names, colons, "
                 "values, commas", "sub2"))
    b.append(hd(40, 146, "The same call as the model writes it: 33 tokens, cut as a tokenizer might"))
    x, y = 40, 162
    for k, t in enumerate(TOKENS):
        lab = show(t)
        w = round(width(lab, "sub") + 14)
        if x + w > 640:
            x, y = 40, y + 34
        b.append(cell(x, y, w, 26, "m" if k in CONTENT else "u", label=lab))
        x += w + 5
    y += 26
    fixed = len(TOKENS) - len(CONTENT)
    b.append(cell(40, y + 22, 14, 12, "u", rx=2))
    b.append(txt(62, y + 32, f"fixed by the format: {fixed} tokens", "sub2"))
    b.append(cell(280, y + 22, 14, 12, "m", rx=2))
    b.append(txt(302, y + 32, f"chosen by the model: {len(CONTENT)} tokens", "sub2"))
    b.append(txt(40, y + 54, "␣ marks a space that is part of a token", "sub2"))
    assert fixed == 23
    body, yb = para(y + 98, [
        "JSON writes structured data as text. Braces open and close an object; inside, each field is a "
        "name in quotes, a colon and a value, with commas between fields. Software can parse the call "
        "only if every brace and quote is where the format says.",
        "The model does not write characters, though. It writes tokens ({{fig:v01-o006}}), and a token "
        "can hold a space and a quote together, or half a word: edit_file arrives as edit and _file. So "
        "'only valid text' has to be turned into 'only tokens whose characters keep the text valid', "
        "checked token by token.",
        "Twenty-three of the 33 tokens are forced by the format. The other ten carry the content, the "
        "tool's name and the arguments' values, and they are where the model's judgement shows. The cut "
        "is illustrative: the real one depends on the model's tokenizer.",
    ])
    emit("n26", stamp(SRT, "The answer to this request has to be a"),
         "The tool call is a JSON object, and the model writes it in tokens, not characters", yb + 30,
         b + [body],
         "The format is checked in characters, but the model chooses in tokens. Most of a call is "
         "scaffolding the format dictates; the content is a handful of tokens.")


def _bars(b, k, y0, SC=220):
    """Before and after bars for step k, drawn from y0. Returns the y below them."""
    pre, tok, state, rows, tot, after = resolve(k)
    b.append(txt(170, y0, "before the mask", "sub2"))
    b.append(txt(430, y0, "after: divided by the allowed total", "sub2"))
    y = y0 + 12
    for (c, p, ok), a in zip(rows, after):
        b.append(txt(40, y + 17, show(c), "cap"))
        b.append(cell(170, y, max(p * SC, 2), 24, "u"))
        b.append(txt(170 + p * SC + 8, y + 17, f(p, 2), "sub2"))
        if ok:
            b.append(cell(430, y, max(a * 160, 2), 24, "s"))
            b.append(txt(430 + a * 160 + 8, y + 17, f(a, 3), "sub2"))
        else:
            b.append(txt(430, y + 17, "removed", "sub2"))
        y += 32
    return y, tot


def n27():
    b = [hd(40, 46, "The state machine's table for the start of a call, and where this request stands")]
    states = [("nothing yet", "an opening brace"),
              ("after the brace", '"name, or a space'),
              ("inside a field name", "its own letters, then the closing quote"),
              ("after a colon", "a space, then the value's opening quote"),
              ("inside the tool's name", "letters that can still become a listed tool"),
              ("inside a free string", "anything but a quote, or the closing quote")]
    b.append(txt(70, 74, "state", "sub2"))
    b.append(txt(260, 74, "tokens allowed next", "sub2"))
    for k, (st, al) in enumerate(states):
        y = 84 + k * 30
        cur = k == 1
        b.append(cell(70, y, 176, 24, "m" if cur else "u", label=st))
        b.append(txt(260, y + 17, al, "sub2"))
    yc = 84 + 30 + 12
    b.append(f'<line class="conn" x1="40" y1="{yc}" x2="64" y2="{yc}" marker-end="url(#arw)"/>')
    y0 = 84 + 6 * 30 + 26
    b.append(hd(40, y0, "At that state: the text so far is {, and four candidates"))
    y, tot = _bars(b, 1, y0 + 22)
    b.append(txt(40, y + 10, f"allowed total {f(tot, 2)}: 0.60 ÷ 0.65 = 0.923 and 0.05 ÷ 0.65 = 0.077", "sub2"))
    body, yb = para(y + 54, [
        "The engine tracks where the text stands in the format with a state machine: each token moves it "
        "to a new state, and each state allows only some next tokens ({{fig:v07-o022}}). Because JSON "
        "nests, it also keeps a stack of the braces still open.",
        f"After the opening brace, the format allows only the field it requires first, \"name\", or a "
        f"space. Of the {n(VOCAB)} tokens in the vocabulary, every other one gets a score of minus "
        "infinity, which softmax turns into a probability of exactly zero ({{fig:v07-o023}}).",
        "The survivors' probabilities are then divided by their total, 0.65, so they add up to one "
        "again. The probabilities are illustrative; which candidates survive is computed by checking each "
        "against the format.",
    ])
    emit("n27", stamp(SRT, "format. After an opening brace, only the"),
         "After the brace, the format leaves one field name standing", yb + 30, b + [body],
         "After an opening brace, only the field names the format allows are still available. Among the "
         "survivors the model's own ranking stands; only the illegal options vanish.")


# ---- N27w: the stepper ------------------------------------------------------------------------------
N27_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const S = __S__, SC = 220;
  const q = s => fig.querySelector(s), qa = s => [...fig.querySelectorAll(s)];
  const fx = (v, d) => Math.abs(v).toFixed(d);
  const show = t => t.replace(/ /g, '␣');
  let k = 0;
  function draw() {
    const s = S[k];
    q('[data-k]').textContent = `token ${k + 1} of ${S.length}`;
    q('[data-pre]').textContent = s.pre === '' ? '(nothing yet)' : s.pre;
    q('[data-next]').textContent = `next: ${show(s.tok)}`;
    q('[data-state]').textContent = s.state;
    let tot = 0;
    s.rows.forEach(r => { if (r[2]) tot += r[1]; });
    for (let i = 0; i < 5; i++) {
      const g = q(`[data-row="${i}"]`), r = s.rows[i];
      if (!r) { g.setAttribute('visibility', 'hidden'); continue; }
      g.setAttribute('visibility', 'visible');
      g.querySelector('[data-c]').textContent = show(r[0]);
      const bw = Math.max(r[1] * SC, 2);
      g.querySelector('[data-pb]').setAttribute('width', bw.toFixed(1));
      const pv = g.querySelector('[data-pv]');
      pv.textContent = fx(r[1], 2); pv.setAttribute('x', (170 + r[1] * SC + 8).toFixed(1));
      const ab = g.querySelector('[data-ab]'), av = g.querySelector('[data-av]');
      if (r[2]) {
        const a = r[1] / tot;
        ab.setAttribute('visibility', 'visible'); ab.querySelector('rect').setAttribute('width', Math.max(a * 160, 2).toFixed(1));
        av.textContent = fx(a, 3); av.setAttribute('x', (430 + a * 160 + 8).toFixed(1));
      } else {
        ab.setAttribute('visibility', 'hidden'); ab.querySelector('rect').setAttribute('width', '0');
        av.textContent = 'removed'; av.setAttribute('x', '430');
      }
    }
    q('[data-tot]').textContent = `allowed total ${fx(tot, 2)}: each survivor is divided by it`;
    const bs = qa('button');
    bs[0].disabled = k === 0; bs[1].disabled = k === S.length - 1;
  }
  const bs = qa('button');
  bs[0].addEventListener('click', () => { if (k > 0) { k--; draw(); } });
  bs[1].addEventListener('click', () => { if (k < S.length - 1) { k++; draw(); } });
  bs[2].addEventListener('click', () => { k = 0; draw(); });
  draw();
})();</script>"""


def lines27(k):
    """Every string the stepper shows at step k, in document order, as the test reads them."""
    pre, tok, state, rows, tot, after = resolve(k)
    out = [f"token {k + 1} of {len(STEPS)}", pre if pre else "(nothing yet)", f"next: {show(tok)}", state]
    for (c, p, ok), a in zip(rows, after):
        out += [show(c), f(p, 2), f(a, 3) if ok else "removed"]
    return out + [f"allowed total {f(tot, 2)}: each survivor is divided by it"]


def n27w():
    s = []
    pre, tok, state, rows, tot, after = resolve(0)
    s.append(f'<text class="sub2" x="40" y="24" data-k="">token 1 of {len(STEPS)}</text>')
    s.append(txt(40, 50, "the call so far", "cap"))
    s.append(f'<g class="u"><text class="sub" x="40" y="72" style="white-space:pre" data-pre="">'
             f'{esc(pre) if pre else "(nothing yet)"}</text></g>')
    s.append(f'<g class="m"><text class="sub" x="40" y="96" style="white-space:pre" data-next="">'
             f'next: {esc(show(tok))}</text></g>')
    s.append(txt(40, 130, "what the format allows here", "cap"))
    s.append(f'<g class="u"><text class="sub" x="40" y="152" data-state="">{esc(state)}</text></g>')
    for k in range(len(STEPS)):
        assert width(lines27(k)[1], "sub") < 600 and width(lines27(k)[3], "sub") < 600
    y0 = 188
    s.append(txt(170, y0, "before the mask", "sub2"))
    s.append(txt(430, y0, "after: divided by the allowed total", "sub2"))
    SC = 220
    for i in range(5):
        y = y0 + 12 + i * 32
        r = rows[i] if i < len(rows) else None
        vis = "visible" if r else "hidden"
        c, p, ok = r if r else ("", 0.0, False)
        a = after[i] if r else None
        s.append(f'<g data-row="{i}" visibility="{vis}">'
                 f'<text class="cap" x="40" y="{y + 17}" style="white-space:pre" data-c="">{esc(show(c))}</text>'
                 f'<g class="u"><rect x="170" y="{y}" width="{max(p * SC, 2):.1f}" height="24" rx="3" data-pb=""/></g>'
                 f'<text class="sub2" x="{170 + p * SC + 8:.1f}" y="{y + 17}" data-pv="">{f(p, 2)}</text>'
                 f'<g class="s" data-ab="" visibility="{"visible" if ok else "hidden"}"><rect x="430" y="{y}" '
                 f'width="{max(a * 160, 2) if ok else 0:.1f}" height="24" rx="3"/></g>'
                 f'<text class="sub2" x="{430 + (a or 0) * 160 + 8 if ok else 430:.1f}" y="{y + 17}" data-av="">'
                 f'{f(a, 3) if ok else "removed"}</text></g>')
    yt = y0 + 12 + 5 * 32 + 8
    s.append(f'<text class="sub2" x="40" y="{yt}" data-tot="">allowed total {f(tot, 2)}: each survivor is '
             f'divided by it</text>')
    body, yb = para(yt + 44, [
        "Step through the call one token at a time. At each step the format allows some candidates and "
        "not others; the removed ones drop to zero and the survivors are rescaled to add to one. The "
        "candidates and their probabilities are illustrative; whether each one survives is computed by "
        "checking the text so far, plus that token, against the format.",
        "Watch token 5, the tool's name: the model's favourite, pytest, is not a listed tool, so it goes, "
        "and edit wins. Watch tokens 15 and 22: inside a free string every candidate survives, so the "
        "format cannot stop a wrong file name or a wrong fix. The arithmetic was checked against Python "
        "at every step.",
    ])
    ctl = ["<button type='button'>Back</button><button type='button'>Next</button>"
           "<button type='button'>Reset</button>"]
    data = []
    for k in range(len(STEPS)):
        pre, tok, state, rows, tot, after = resolve(k)
        data.append({"pre": pre, "tok": tok, "state": state, "rows": [[c, p, ok] for c, p, ok in rows]})
    js = N27_JS.replace("__S__", json.dumps(data, ensure_ascii=False))
    emit_widget("n27w", stamp(SRT, "field names the format allows are still"),
                "Step through the call: what the format allows at each token", ctl, s + [body], yb + 26,
                "Most steps leave one sensible choice; a few leave the model free. The mask decides only "
                "whether the call can parse, never whether it is the right call.", js)


def n28():
    b = [hd(40, 46, "At the tool's name: the text so far is {\"name\": \", and five candidates")]
    y, tot = _bars(b, 4, 72)
    b.append(txt(40, y + 10, f"allowed total {f(tot, 2)}: edit 0.30 ÷ 0.55 = 0.545, run 0.20 ÷ 0.55 = 0.364, "
                 "read 0.05 ÷ 0.55 = 0.091", "sub2"))
    body, yb = para(y + 54, [
        "The mask does not pick; it removes. Here the model's favourite, pytest, the usual command for "
        "running Python tests, is not one of the three listed tools, so its 0.40 goes to zero, along with "
        "bash.",
        "What is left adds up to 0.55. Dividing each survivor by 0.55 makes them add up to one again and "
        "keeps their ratios: edit is still 1.5 times as likely as run and 6 times as likely as read. It is "
        "the same dividing by a total that softmax does ({{fig:v01-o009}}), and the sampler then draws "
        "from the result.",
        "So the mask can delete the token the model most wanted and push it down a path it would not "
        "have taken ({{fig:v07-o024}}). What it guarantees is that the call parses.",
    ])
    emit("n28", stamp(SRT, "The model picks from what is left."),
         "The mask can delete the model's favourite, and what is left is rescaled to sum to one", yb + 30,
         b + [body],
         "Bars to scale on each side. The removed tokens' share is not handed to any one survivor; every "
         "survivor grows by the same factor, 1 ÷ 0.55.")


def o013():
    b = [hd(40, 46, "One request as the user sees it, schematic")]
    AX = 112
    b.append(ln(40, AX, 640, AX, "axis"))
    b.append(cell(40, AX - 16, 26, 32, "u"))
    b.append(cell(66, AX - 16, 150, 32, "m", label="prefill"))
    marks = [222]
    gap0 = 72
    x = 222 + 18 + gap0
    for _ in range(6):
        marks.append(x)
        x += 18 + 20
    for k, xm in enumerate(marks):
        b.append(cell(xm, AX - 16, 18, 32, "s"))
    b.append(cell(222 + 18 + 4, AX - 12, gap0 - 8, 24, "h", label="cache"))
    xe = marks[-1] + 18
    b.append(f'<line class="conn" x1="{xe + 6}" y1="{AX}" x2="{xe + 30}" y2="{AX}" marker-end="url(#arw)"/>')
    b.append(cell(xe + 36, AX - 16, 640 - xe - 36, 32, "u", label="seat freed"))
    b.append(txt(40, AX + 46, "time to first token", "hd"))
    b.append(txt(40, AX + 66, "the gateway, then prefill", "sub2"))
    b.append(txt(330, AX + 46, "time per output token", "hd"))
    b.append(txt(330, AX + 66, "each gap: everything decode does fits in one", "sub2"))
    body, yb = para(AX + 116, [
        "The wait before the first token is time to first token, and it covers everything from the "
        "gateway through prefill producing that token ({{fig:v01-o143}}). The gap between the tokens "
        "after that is time per output token, and everything decode does happens inside it: the weight "
        "read, the cache read, the batch, the drafts, the mask.",
        "The first gap is longer than the rest by the cache's crossing ({{fig:v09-n17}}). When the last "
        "token of the tool call is sent, the request releases its slot, and the decode machine gives the "
        "seat to a request that was waiting ({{fig:v09-n02}}).",
    ])
    emit("o013", stamp(SRT, "The wait before the first token is time"),
         "What the user sees: one pause, then a cadence", yb + 30, b + [body],
         "Schematic: no times are measured here. Everything else in this document is invisible to the "
         "person who asked the question.")


if __name__ == "__main__":
    for fn in (o012, n26, n27, n27w, n28, o013):
        fn()
