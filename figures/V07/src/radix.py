"""V7 Part 6, the radix tree: b39–b43 and o013 redrawn (P39–P43 of plans/depth_pass/V07_review.md).

  b39   what a tree is (folders: root, node, edge, leaf, path)
  b40   a prefix tree, one token per node: three prompts, 25 tokens sent, 15 nodes stored
  b41   a radix tree merges every chain: 15 nodes become 5
  b42   a lookup walks until it disagrees; a hit at a node adds a leaf, a hit inside an edge splits it
  o013  the tree a chat service builds: turn 4 below turn 3, a retry as a fork, a second user as a branch
  b43   widget: evict the least recently used leaf whose reference count is zero, step by step

Words stand in for tokens, one per word. The tree code below builds every tree from the prompts, so
the counts in the prose are computed, not typed.

  python3 figures/V07/src/radix.py
"""
import json
from bcommon import (SRT, JS_FMT, arr, cell, emit, emit_widget, f, g, ghost, hd, js_fill, ln, node,
                     prose, stamp, tw, txt)

PROMPTS = ["You are helpful . What is 2+2 ?",
           "You are helpful . What is the capital of France ?",
           "You are helpful . Translate cat"]


# ---- the data structures, built from the prompts ------------------------------------------------
def trie(prompts):
    """A prefix tree with one token per node: nested dicts, in first-seen order."""
    root = {}
    for p in prompts:
        n = root
        for t in p.split():
            n = n.setdefault(t, {})
    return root


def count(t):
    return sum(1 + count(c) for c in t.values())


def radix(t):
    """Merge every chain of single-child nodes: {tuple_of_tokens: children}."""
    out = {}
    for tok, kids in t.items():
        run = [tok]
        while len(kids) == 1:
            (nxt, kids), = kids.items()
            run.append(nxt)
        out[tuple(run)] = radix(kids)
    return out


def rinsert(tree, toks):
    """Insert into a radix tree the way SGLang does: walk, split an edge at a mismatch, add the rest
    as a new child. Returns (tokens hit, what happened)."""
    hit, n = 0, tree
    while toks:
        edge = next((e for e in n if e[0] == toks[0]), None)
        if edge is None:
            n[tuple(toks)] = {}
            return hit, "new leaf"
        k = 0
        while k < len(edge) and k < len(toks) and edge[k] == toks[k]:
            k += 1
        hit += k
        if k < len(edge):                               # disagreement inside the edge: split it
            kids = n.pop(edge)
            n[edge[:k]] = {edge[k:]: kids}
            if toks[k:]:
                n[edge[:k]][tuple(toks[k:])] = {}
            return hit, "split"
        n, toks = n[edge], toks[k:]
    return hit, "already cached"


TRIE = trie(PROMPTS)
SENT = sum(len(p.split()) for p in PROMPTS)
NODES = count(TRIE)
RADIX = radix(TRIE)
assert (SENT, NODES, count(RADIX)) == (25, 15, 5)


# ---- drawing a left-to-right tree: the first child continues the row, later children drop a row --
def layout(tree, x0, y0, pitch, gap=14, label=lambda k: k if isinstance(k, str) else " ".join(k)):
    """Place nodes. Returns (nodes, edges): nodes are dicts with x, y, w, s, key, depth, path."""
    nodes, edges, row = [], [], [0]

    def place(key, kids, x, parent, pth):
        s = label(key)
        w = max(26, round(tw(s) + 18))
        nd = {"x": x, "y": y0 + row[0] * pitch, "w": w, "s": s, "key": key, "path": pth + [key]}
        nodes.append(nd)
        if parent is not None:
            edges.append((parent, nd))
        for i, (k2, c2) in enumerate(kids.items()):
            if i:
                row[0] += 1
            place(k2, c2, x + w + gap, nd, nd["path"])

    for i, (k, c) in enumerate(tree.items()):
        if i:
            row[0] += 1
        place(k, c, x0, None, [])
    return nodes, edges


def draw(nodes, edges, cls=lambda nd: "u", h=26, gap=14, root=None):
    """Edges first, as elbows in the gap after the parent, then the cells on top."""
    o = []
    if root is not None:                                   # a small root marker, and its edges
        rx, ry = root
        o.append(cell(rx, ry + h / 2 - 5, 10, 10, "u", rx=5))
        for nd in nodes:
            if nd is nodes[0] or all(nd is not e[1] for e in edges):
                xm = rx + 10 + (nd["x"] - rx - 10) / 2
                o.append(ln(rx + 10, ry + h / 2, xm, ry + h / 2))
                if nd["y"] != ry:
                    o.append(ln(xm, ry + h / 2, xm, nd["y"] + h / 2))
                o.append(ln(xm, nd["y"] + h / 2, nd["x"], nd["y"] + h / 2))
    for p, c in edges:
        x1, y1, xm = p["x"] + p["w"], p["y"] + h / 2, p["x"] + p["w"] + gap / 2
        if c["y"] == p["y"]:
            o.append(ln(x1, y1, c["x"], y1))
        else:
            o.append(ln(x1, y1, xm, y1) + ln(xm, y1, xm, c["y"] + h / 2) + ln(xm, c["y"] + h / 2, c["x"], c["y"] + h / 2))
    for nd in nodes:
        o.append(cell(nd["x"], nd["y"], nd["w"], h, cls(nd), label=nd["s"]))
    return "".join(o)


def bracket(x1, x2, y, s, up=True):
    """A thin bracket over (up) or under a run of cells, with a sub2 label."""
    d = 5 if up else -5
    o = ln(x1, y, x2, y, "tick") + ln(x1, y, x1, y + d, "tick") + ln(x2, y, x2, y + d, "tick")
    return o + txt((x1 + x2) / 2, y - 6 if up else y + 15, s, "sub2", "middle")


# ---- b39: what a tree is ------------------------------------------------------------------------
FOLDERS = {"home": {"alice": {"notes.txt": {}, "todo.txt": {}}, "bob": {"draft.txt": {}}},
           "etc": {"hosts": {}}}


def b39():
    b = [hd(40, 46, "Folders on a disk form a tree: one root, and one path to every file")]
    nodes, edges = layout({"/": FOLDERS}, 70, 76, 40, gap=30)
    on_path = lambda nd: nd["path"] in (["/"], ["/", "home"], ["/", "home", "alice"],
                                        ["/", "home", "alice", "notes.txt"])
    b.append(draw(nodes, edges, cls=lambda nd: "s" if on_path(nd) else "u", gap=30))
    leaves = [nd for nd in nodes if not any(e[0] is nd for e in edges)]
    assert [nd["s"] for nd in leaves] == ["notes.txt", "todo.txt", "draft.txt", "hosts"]
    root = nodes[0]
    b.append(txt(root["x"] + root["w"] / 2, root["y"] + 42, "the root", "sub2", "middle"))
    xl = max(nd["x"] + nd["w"] for nd in leaves) + 22
    b.append(ln(xl, leaves[0]["y"] + 4, xl, leaves[-1]["y"] + 22, "tick"))
    b.append(txt(xl + 10, (leaves[0]["y"] + leaves[-1]["y"]) / 2 + 9, "leaves: no children", "sub2"))
    alice = next(nd for nd in nodes if nd["s"] == "alice")
    b.append(txt(alice["x"], alice["y"] - 8, "a node", "sub2"))
    body, yb = prose(270, [
        "SGLang, an inference engine, keeps its cached prefixes in a structure called a radix tree; "
        "it calls the feature RadixAttention. First, what a tree is.",
        "A tree is nodes joined by edges. Each edge runs from a parent to a child. The root is the "
        "one node with no parent, and a leaf is a node with no children. Every other node has exactly "
        "one parent, so from the root to any node there is exactly one path.",
        "A file path is such a path: /home/alice/notes.txt names the four nodes passed through, "
        "highlighted here. Two files in one folder share the beginning of their paths, and the tree holds "
        "that shared part once: home and alice exist once, for both notes.txt and todo.txt.",
    ])
    emit("b39", stamp(SRT, "S G Lang's radix attention keeps them in"),
         "A tree gives every node exactly one path from the root", yb + 32, b + [body],
         "Swap folder names for tokens and this is the next figure: paths that begin the same way "
         "share their beginning, stored once.")


# ---- b40: a prefix tree, one token per node -----------------------------------------------------
def users(nd):
    return sum(1 for p in PROMPTS if p.split()[:len(nd["path"])] == list(nd["path"]))


def b40():
    b = [hd(40, 46, "Three prompts, one token per node: 25 tokens sent, 15 nodes stored")]
    nodes, edges = layout(TRIE, 62, 86, 38, gap=12)
    assert len(nodes) == NODES
    b.append(draw(nodes, edges, cls=lambda nd: "s" if users(nd) > 1 else "u", gap=12, root=(40, 86)))
    trunk3 = [nd for nd in nodes if users(nd) == 3]
    trunk2 = [nd for nd in nodes if users(nd) == 2]
    assert [n["s"] for n in trunk3] == ["You", "are", "helpful", "."] and [n["s"] for n in trunk2] == ["What", "is"]
    b.append(bracket(trunk3[0]["x"], trunk3[-1]["x"] + trunk3[-1]["w"], 74, "in all three prompts"))
    b.append(bracket(trunk2[0]["x"], trunk2[-1]["x"] + trunk2[-1]["w"], 74, "in two"))
    ytab = 86 + 2 * 38 + 48
    for k, p in enumerate(PROMPTS):
        b.append(txt(40, ytab + k * 20, f"prompt {k + 1}", "cap"))
        b.append(txt(110, ytab + k * 20, p, "sub2"))
        b.append(txt(430, ytab + k * 20, f"{len(p.split())} tokens", "sub2"))
    body, yb = prose(ytab + 2 * 20 + 44, [
        "Each node holds one token, and the path from the root to a node spells out the beginning of "
        "a prompt. Prompts that start the same way walk the same nodes, so a shared beginning is "
        "stored once however many prompts share it.",
        f"All three prompts begin You are helpful ., so those four nodes serve all three, and What is "
        f"serves two. {SENT} tokens arrive and {NODES} nodes hold them, each with that token's keys and "
        "values. Words stand in for tokens here, one per word; a real tokenizer cuts text differently "
        "({{fig:v01-o006}}), and the sharing works the same way.",
        "This is a prefix tree, also called a trie. One token per node makes it easy to follow and "
        "wasteful to keep: a 2,000-token system prompt would be a chain of 2,000 nodes.",
    ])
    emit("b40", stamp(SRT, "A radix tree is a prefix tree whose"),
         "A prefix tree stores each shared beginning once", yb + 32, b + [body],
         "Every saving in this part comes from this one fact. What remains is making the structure "
         "cheap to keep and quick to search.")


# ---- b41: radix compression ---------------------------------------------------------------------
def chains(t, run=None):
    """The runs a radix tree would merge, as lists of token tuples (for outlining the trie)."""
    out = []
    for tok, kids in t.items():
        r = [tok]
        while len(kids) == 1:
            (nxt, kids), = kids.items()
            r.append(nxt)
        out.append(tuple(r))
        out += chains(kids)
    return out


def b41():
    b = [hd(40, 46, f"The same three prompts: {NODES} single-token nodes become {count(RADIX)}")]
    b.append(txt(40, 72, "prefix tree, chains outlined", "sub2"))
    nodes, edges = layout(TRIE, 62, 84, 34, gap=12)
    b.append(draw(nodes, edges, gap=12, root=(40, 84)))
    # outline each chain: the run of nodes it merges
    runs = chains(TRIE)
    assert len(runs) == count(RADIX) and sum(map(len, runs)) == NODES
    for r in runs:
        mem = [nd for nd in nodes if nd["key"] == r[-1] and len(nd["path"]) >= len(r)
               and tuple(nd["path"][-len(r):]) == r]
        last = mem[0]
        first = next(nd for nd in nodes if nd["path"] == last["path"][:len(last["path"]) - len(r) + 1])
        b.append(ghost(first["x"] - 4, first["y"] - 4, last["x"] + last["w"] - first["x"] + 8, 34))
    y2 = 84 + 3 * 34 + 44
    b.append(txt(40, y2 - 12, "radix tree", "sub2"))
    rn, re_ = layout(RADIX, 62, y2, 38, gap=14)
    b.append(draw(rn, re_, cls=lambda nd: "s", gap=14, root=(40, y2)))
    body, yb = prose(max(nd["y"] for nd in rn) + 26 + 40, [
        "A chain is a run of nodes that each have exactly one child. Nothing can branch inside it, so "
        f"it can be stored as one node holding the whole run. The {NODES} nodes fall into "
        f"{count(RADIX)} chains.",
        "A radix tree is a prefix tree built that way: its edges carry whole sequences of tokens "
        f"rather than one token each. The tokens, and their keys and values, are the same {NODES} as "
        f"before. What shrinks is the structure to store and walk, from {NODES} nodes to "
        f"{count(RADIX)}.",
        "The saving grows with length. A 2,000-token system prompt is one node rather than a chain of "
        "2,000, and a lookup passes through it in one step.",
    ])
    emit("b41", stamp(SRT, "edges can carry whole sequences, rather"),
         "A radix tree merges every chain into one edge", yb + 32, b + [body],
         "Same contents, a fraction of the bookkeeping. This compact form is the tree SGLang's "
         "RadixAttention keeps.")


# ---- b42: lookup, insert, split -----------------------------------------------------------------
NEW1 = "You are helpful . What is 3+3 ?".split()
NEW2 = "You are kind .".split()


def copy(t):
    return {k: copy(v) for k, v in t.items()}


def b42():
    t1 = copy(RADIX)
    hit1, what1 = rinsert(t1, NEW1)
    t2 = copy(RADIX)
    hit2, what2 = rinsert(t2, NEW2)
    assert (hit1, len(NEW1) - hit1, what1) == (6, 2, "new leaf")
    assert (hit2, len(NEW2) - hit2, what2) == (2, 2, "split")
    assert count(t1) == 6 and count(t2) == 7
    b = []
    panels = [(t1, NEW1, hit1, f"hits {hit1} tokens at a node: {len(NEW1) - hit1} new tokens become a new leaf"),
              (t2, NEW2, hit2, f"hits {hit2} tokens inside an edge: the edge splits there")]
    y = 46
    for k, (t, new, hit, head) in enumerate(panels):
        b.append(hd(40, y, f"{' '.join(new)}"))
        b.append(txt(40, y + 18, head, "sub2"))
        nodes, edges = layout(t, 62, y + 34, 36, gap=14)
        walked = lambda nd, new=new: list(sum((list(p) for p in nd["path"]), [])) == new[:sum(len(p) for p in nd["path"])]
        fresh = lambda nd, new=new: nd["path"] and list(sum((list(p) for p in nd["path"]), [])) == new
        b.append(draw(nodes, edges, gap=14, root=(40, y + 34),
                      cls=lambda nd, w=walked, fr=fresh: "m" if fr(nd) else ("s" if w(nd) else "u")))
        rows = max(nd["y"] for nd in nodes)
        y = rows + 26 + 50
    b.append(cell(40, y - 26, 14, 12, "s")); b.append(txt(60, y - 16, "walked: a hit", "sub2"))
    b.append(cell(170, y - 26, 14, 12, "m")); b.append(txt(190, y - 16, "added: must be prefilled", "sub2"))
    body, yb = prose(y + 20, [
        "A lookup starts at the root and compares the prompt with an edge, token by token. If the "
        "whole edge matches it moves on, to the child whose first token is the prompt's next one. "
        "Wherever it stops, everything before that point is a hit and everything after must be "
        "prefilled.",
        f"The first prompt matches You are helpful . and What is, then finds no child starting with "
        f"3+3: a hit of {hit1} tokens, and the {len(NEW1) - hit1} left over become a new leaf. The "
        f"second disagrees inside the first edge, at kind against helpful: a hit of {hit2}. That edge "
        "is split in two at the point of difference, so the tree still branches only where prompts "
        "first differ.",
    ])
    emit("b42", stamp(SRT, "walk the same path through it"),
         "A new prompt walks the tree until it disagrees", yb + 32, b + [body],
         "Lookup and insertion are the same walk. The tree's shape always records exactly where any "
         "two cached prompts part company.")


# ---- o013 and b43: the tree a chat service builds -----------------------------------------------
# One conversation (A) of four turns with a regenerated third answer, and a second user (B). Each
# node: (id, label, tokens, parent). Token counts are illustrative.
CHAT = [("S", "system prompt", 2000, None), ("A1", "A: turn 1", 400, "S"),
        ("A2", "A: turn 2", 350, "A1"), ("A3q", "A: question 3", 120, "A2"),
        ("A3a", "answer 3", 280, "A3q"), ("A4", "A: turn 4", 300, "A3a"),
        ("A3r", "answer 3, retried", 260, "A3q"), ("B1", "B: turn 1", 500, "S")]
# Requests in time order: (time, path of node ids it used). A request touches every node on its
# path, which is what sets each node's last-used time. B's second turn is running now, at 95.
EVENTS = [(40, ["S", "A1"]), (48, ["S", "A1", "A2"]), (60, ["S", "A1", "A2", "A3q", "A3a"]),
          (64, ["S", "A1", "A2", "A3q", "A3r"]), (71, ["S", "A1", "A2", "A3q", "A3a", "A4"]),
          (95, ["S", "B1"])]
RUNNING = ["S", "B1"]                          # the path of the request still running


def last_used():
    t = {}
    for when, pth in EVENTS:
        for n in pth:
            t[n] = when
    return t


def evict_order(running=True):
    """Least recently used leaf first, skipping any node a running request holds (count above 0);
    ties go to the earlier node in CHAT. Returns the ids in eviction order."""
    lu, gone, order = last_used(), set(), []
    ref = {n[0]: (1 if running and n[0] in RUNNING else 0) for n in CHAT}
    while True:
        alive = [n for n in CHAT if n[0] not in gone]
        leaves = [n for n in alive if not any(m[3] == n[0] for m in alive) and ref[n[0]] == 0]
        if not leaves:
            return order
        v = min(leaves, key=lambda n: (lu[n[0]], CHAT.index(n)))
        gone.add(v[0]); order.append(v[0])


def chat_tree():
    kids = {}
    for nid, lab, tok, par in CHAT:
        kids.setdefault(par, []).append(nid)
    lab = {n[0]: n[1] for n in CHAT}

    def build(nid):
        return {nid: {k: v for c in kids.get(nid, []) for k, v in build(c).items()}}
    return build("S"), lab


def chat_layout(x0, y0, pitch):
    tree, lab = chat_tree()
    return layout(tree, x0, y0, pitch, gap=16, label=lambda k: lab[k])


def o013():
    b = [hd(40, 46, "What SGLang's RadixAttention holds after two conversations")]
    nodes, edges = chat_layout(62, 92, 58)
    tok = {n[0]: n[2] for n in CHAT}
    b.append(draw(nodes, edges, gap=16, root=(40, 92),
                  cls=lambda nd: "s" if nd["key"] == "S" else ("m" if nd["key"] in ("A3r", "B1") else "u")))
    for nd in nodes:
        b.append(txt(nd["x"] + nd["w"] / 2, nd["y"] + 40, f"{g(tok[nd['key']])} tokens", "sub2", "middle"))
    byid = {nd["key"]: nd for nd in nodes}
    assert byid["A4"]["y"] == byid["A3a"]["y"] and byid["A4"]["x"] > byid["A3a"]["x"]   # turn 4 below turn 3
    assert byid["A3r"]["y"] > byid["A3a"]["y"] and byid["B1"]["y"] > byid["A3r"]["y"]
    a1, a4 = byid["A1"], byid["A4"]
    b.append(bracket(a1["x"], a4["x"] + a4["w"], 80, "one conversation: each turn a node below the last"))
    b.append(txt(byid["A3r"]["x"] - 14, byid["A3r"]["y"] + 17, "a retry forks where the answers differ", "sub2", "end"))
    b.append(txt(byid["B1"]["x"] + byid["B1"]["w"] + 12, byid["B1"]["y"] + 17, "another user branches after the system prompt", "sub2"))
    body, yb = prose(byid["B1"]["y"] + 26 + 52, [
        "RadixAttention keeps the keys and values of every prompt and of every generated answer in "
        "this tree. Each request's prompt is the whole conversation so far, so a new turn walks the "
        "entire path, hits all of it, and adds one node at the end. Turn 4 hangs below turn 3 "
        "because its prompt contains turn 3.",
        "Branches appear only where two cached texts first differ. A second user shares only the "
        "system prompt, so B branches right after it. Retrying answer 3 produces a second answer to "
        "the same question, so the node that held question 3 and its answer was split where the two "
        "answers begin.",
    ])
    emit("o013", stamp(SRT, "tree branches only at the token where"),
         "A conversation grows down the tree, and branches only where texts differ", yb + 32,
         b + [body],
         "Token counts illustrative. The shape of the tree is the history of the traffic: the system "
         "prompt at the trunk, each conversation a branch, each retry a fork.")


WIDGET_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const N = __NODES__, LU = __LU__, RUN = __RUN__;
  __FMT__
  const q = s => fig.querySelector(s), box = fig.querySelector('input[type=checkbox]');
  const [stepB, resetB] = fig.querySelectorAll('button');
  let gone = [];
  function victim() {
    const ref = id => (box.checked && RUN.includes(id)) ? 1 : 0;
    const alive = N.filter(n => !gone.includes(n[0]));
    const leaves = alive.filter(n => !alive.some(m => m[3] === n[0]) && ref(n[0]) === 0);
    if (!leaves.length) return null;
    return leaves.reduce((a, b) => (LU[b[0]] < LU[a[0]] ? b : a));
  }
  function draw() {
    const v = victim();
    let freed = 0, kept = 0;
    N.forEach(n => {
      const g = q(`[data-n="${n[0]}"]`), r = g.querySelector('rect'), t = g.querySelector('text');
      const out = gone.includes(n[0]);
      if (out) freed += n[2]; else kept += n[2];
      const ref = (box.checked && RUN.includes(n[0])) ? 1 : 0;
      g.setAttribute('class', out ? '' : (v && v[0] === n[0] ? 'h' : (ref ? 's' : 'u')));
      r.style.cssText = out ? 'fill:none;stroke:var(--rule);stroke-dasharray:3 3' : '';
      t.style.cssText = out ? 'fill:var(--muted)' : '';
      t.textContent = out ? 'evicted' : n[1];
      q(`[data-u="${n[0]}"]`).textContent = out ? '' : `used ${LU[n[0]]}`;
      q(`[data-c="${n[0]}"]`).textContent = out ? '' : `count ${ref}`;
    });
    q('[data-next]').textContent = v ? `next to go: ${v[1]}, the stalest leaf with count 0` : 'nothing left that can be evicted';
    q('[data-freed]').textContent = `freed ${gx(freed)} tokens; ${gx(kept)} still cached`;
    stepB.disabled = !v;
  }
  stepB.addEventListener('click', () => { const v = victim(); if (v) gone.push(v[0]); draw(); });
  resetB.addEventListener('click', () => { gone = []; box.checked = true; draw(); });
  box.addEventListener('change', draw);
  draw();
})();</script>"""


def b43():
    order = evict_order(True)
    order_free = evict_order(False)
    lu = last_used()
    assert order == ["A3r", "A4", "A3a", "A3q", "A2", "A1"]             # inward, toward the trunk
    assert order_free == order + ["B1", "S"]                             # once B's request ends
    assert lu["A3a"] < lu["A4"] or lu["A3a"] == lu["A4"]                  # a parent is never staler
    tok = {n[0]: n[2] for n in CHAT}
    freed = sum(tok[n] for n in order)
    need = 900
    k, acc = 0, 0
    while acc < need:
        acc += tok[order[k]]; k += 1
    assert (k, acc) == (4, 960)
    s = [hd(40, 34, "Each node: when a request last used it, and how many running requests hold it")]
    nodes, edges = chat_layout(62, 76, 70)
    byid = {nd["key"]: nd for nd in nodes}
    # edges (drawn once), then each node as a group the script can recolour or mark evicted
    o = []
    for p, c in edges:
        x1, y1, xm = p["x"] + p["w"], p["y"] + 13, p["x"] + p["w"] + 8
        if c["y"] == p["y"]:
            o.append(ln(x1, y1, c["x"], y1))
        else:
            o.append(ln(x1, y1, xm, y1) + ln(xm, y1, xm, c["y"] + 13) + ln(xm, c["y"] + 13, c["x"], c["y"] + 13))
    rx, ry = 40, 76
    o.append(cell(rx, ry + 8, 10, 10, "u", rx=5))
    o.append(ln(rx + 10, ry + 13, byid["S"]["x"], ry + 13))
    first = order[0]
    for nd in nodes:
        nid = nd["key"]
        ref = 1 if nid in RUNNING else 0
        cls = "h" if nid == first else ("s" if ref else "u")
        o.append(f'<g class="{cls}" data-n="{nid}"><rect x="{nd["x"]}" y="{nd["y"]}" width="{nd["w"]}" '
                 f'height="26" rx="3"/><text class="sub" x="{nd["x"] + nd["w"] / 2}" y="{nd["y"] + 13}" '
                 f'text-anchor="middle" dominant-baseline="central">{nd["s"]}</text></g>')
        o.append(f'<text class="sub2" x="{nd["x"] + nd["w"] / 2}" y="{nd["y"] + 40}" text-anchor="middle" '
                 f'data-u="{nid}">used {lu[nid]}</text>')
        o.append(f'<text class="sub2" x="{nd["x"] + nd["w"] / 2}" y="{nd["y"] + 54}" text-anchor="middle" '
                 f'data-c="{nid}">count {ref}</text>')
    s.append("".join(o))
    ybot = max(nd["y"] for nd in nodes) + 58 + 30
    s.append(f'<text class="sub2" x="40" y="{ybot}" data-next="">next to go: '
             f'{next(n[1] for n in CHAT if n[0] == first)}, the stalest leaf with count 0</text>')
    s.append(f'<text class="sub2" x="40" y="{ybot + 18}" data-freed="">freed 0 tokens; '
             f'{g(sum(tok.values()))} still cached</text>')
    body, yb = prose(ybot + 58, [
        "Times are seconds on an illustrative clock. When memory runs short the tree gives up the "
        "least recently used leaf first. Only a leaf can "
        "go, because removing a node from the middle would cut off everything below it; once a leaf "
        "is gone its parent may become a leaf, so eviction works inward toward the shared trunk.",
        "A count on each node says how many running requests are using it. B's second turn is running "
        "now, so B and the system prompt carry a count of 1 and cannot go. Turn 4's request walked "
        "all of A's path at time 71, so every node on it reads 71; they still leave one at a time "
        "from the end, because only a leaf can go.",
        f"Step it through: the retried answer goes first, then turn 4, then the rest of A, freeing "
        f"{g(freed)} tokens in all; freeing {g(need)} takes {k} steps. Untick the box and B's request "
        "ends: B and then the system prompt become evictable too. The order was checked against the "
        "same rule in Python.",
    ])
    ctl = ("<label class='opt'><input type='checkbox' checked> B's request is still running</label>"
           "<button type='button'>Evict one</button><button type='button'>Reset</button>")
    js = js_fill(WIDGET_JS.replace("__FMT__", JS_FMT), NODES=[list(n) for n in CHAT], LU=lu, RUN=RUNNING)
    emit_widget("b43", stamp(SRT, "When memory runs short, it evicts the"),
                "Evict the stalest leaf, never one in use", [ctl], "".join(s) + body, yb + 26,
                "Least recently used, leaves only, never anything in use: three rules, and together "
                "they peel a conversation back toward the trunk that everyone shares.", js)


if __name__ == "__main__":
    for fn in (b39, b40, b41, b42, o013, b43):
        fn()
