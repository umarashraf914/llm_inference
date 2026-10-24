#!/usr/bin/env python3
"""Build an atlas from source pieces, so figures can be inserted, moved and rebuilt safely.

Each atlas has a folder figures/V0N/:
  shell.html   everything around the items: head, styles, header, footer. <!--ITEMS--> marks the spot.
  items/       one file per part heading or figure. Part headings are sNN. Figures that existed before
               the depth pass are oNNN (their number then); new ones are named for the plan entry that
               proposed them (p15, n36, …).
  order.txt    the items top to bottom, one id per line. A # starts a comment.
  src/         optional: the Python that generated an item, named like the item.

  python3 atlas_build.py split V06            one-time: carve atlases/V06_*.html into figures/V06/
  python3 atlas_build.py build V06 [--out F]  assemble, renumber, set ids, resolve refs; writes the atlas
  python3 atlas_build.py list V06             figure numbers, stamps, ids and titles, in order
  python3 atlas_build.py insert V06 o013 p15 p16   put new items after o013, in that order
  python3 atlas_build.py move V06 o009 o010   move o009 to just after o010
  python3 atlas_build.py drop V06 o002        take o002 out of the order (its file stays)
  python3 atlas_build.py index                update the counts in atlases/index.html

insert, move and drop lock order.txt, so two people can work on one atlas at once.

Every figure and part heading gets a permanent id, v06-o013 or v06-p15, so links survive renumbering.
In an item, {{ref:v01-o084}} becomes a link reading "V1 Fig 91", and {{fig:v01-o084}} the same words
without the link (for SVG text). Run from the repository root.
"""
from __future__ import annotations
import argparse, html, re, sys
from pathlib import Path

ROOT = Path.cwd()
ITEM = re.compile(r"<div class=['\"]sec['\"]>|<figure\b")
STAMP = re.compile(r"(<div class=['\"]ts['\"]>Fig )([^ &<]+)( &nbsp;&middot;&nbsp; )([0-9:]+)(</div>)")
REF = re.compile(r"\{\{(ref|fig):(v\d\d)-([a-z][a-z0-9_-]*)\}\}")
NAME = re.compile(r"[a-z][a-z0-9_-]*$")
WIDGET_CSS = """
/* widgets */
:where(svg text){fill:var(--ink)}
.wg{margin:0 0 4px;padding:16px 18px 6px;border:1px solid var(--rule);border-radius:10px}
.wg .ctl{display:flex;flex-wrap:wrap;gap:8px 22px;margin:0 0 10px;font-size:13px;color:var(--muted)}
.wg label{display:flex;align-items:center;gap:10px;flex:1 1 340px}
.wg label.opt{flex:0 0 auto;gap:6px}
.wg input[type=range]{flex:1;min-width:110px;accent-color:var(--m)}
.wg input[type=radio],.wg input[type=checkbox]{accent-color:var(--m)}
.wg button{font:500 12.5px var(--sans);color:var(--ink);background:var(--u-fill);
border:1px solid var(--u);border-radius:6px;padding:5px 12px;cursor:pointer}
.wg button:disabled{opacity:.45;cursor:default}
.wg .val{font-family:var(--mono);font-size:12.5px;color:var(--ink);min-width:54px}
a.xref{color:inherit;text-decoration:underline;text-decoration-color:var(--rule);
text-underline-offset:3px}
a.xref:hover{text-decoration-color:var(--muted)}
"""


def atlas_file(v: str) -> Path:
    hits = [p for p in sorted((ROOT / "atlases").glob(f"{v}_*.html")) if "animation" not in p.name]
    if len(hits) != 1:
        sys.exit(f"{v}: expected one atlas in atlases/, found {[p.name for p in hits]}")
    return hits[0]


def src_dir(v: str) -> Path:
    return ROOT / "figures" / v


def read_order(v: str) -> list[str]:
    ids = []
    for ln in (src_dir(v) / "order.txt").read_text(encoding="utf-8").splitlines():
        ln = ln.split("#", 1)[0].strip()
        if ln:
            ids.append(ln)
    return ids


def is_figure(chunk: str) -> bool:
    return chunk.lstrip().startswith("<figure")


def split(v: str) -> None:
    path, out = atlas_file(v), src_dir(v)
    if (out / "order.txt").exists():
        sys.exit(f"{out} already exists; split is one-time")
    t = path.read_text(encoding="utf-8")
    start = t.index("</header>") + len("</header>")
    end = t.rindex("<footer")
    body = t[start:end]
    starts = [m.start() for m in ITEM.finditer(body)]
    if not starts or starts[0] != 0:
        sys.exit(f"{path.name}: something sits between the header and the first item")
    chunks = [body[a:b] for a, b in zip(starts, starts[1:] + [len(body)])]
    assert "".join(chunks) == body
    names, nsec, nfig = [], 0, 0
    for c in chunks:
        if is_figure(c):
            nfig += 1
            m = STAMP.search(c)
            if not m or int(m.group(2)) != nfig:
                sys.exit(f"{path.name}: figure {nfig} is stamped {m.group(2) if m else 'nothing'}")
            names.append(f"o{nfig:03d}")
        else:
            nsec += 1
            names.append(f"s{nsec:02d}")
    shell = t[:start] + "<!--ITEMS-->" + t[end:]
    assert shell.replace("<!--ITEMS-->", body) == t
    (out / "items").mkdir(parents=True)
    for n, c in zip(names, chunks):
        (out / "items" / f"{n}.html").write_text(c, encoding="utf-8")
    shell = shell.replace("</style>", WIDGET_CSS.lstrip("\n") + "</style>", 1)
    (out / "shell.html").write_text(shell, encoding="utf-8")
    (out / "order.txt").write_text("\n".join(names) + "\n", encoding="utf-8")
    print(f"{v}: {nsec} part headings and {nfig} figures written to {out.relative_to(ROOT)}")


def numbering(v: str) -> dict[str, int]:
    """Figure number of every figure id in an atlas, from its order."""
    nums, n = {}, 0
    for i in read_order(v):
        f = src_dir(v) / "items" / f"{i}.html"
        if f.exists() and is_figure(f.read_text(encoding="utf-8")):
            n += 1
            nums[i] = n
    return nums


def set_id(chunk: str, hid: str) -> str:
    m = re.match(r"\s*<(figure|div)\b([^>]*)>", chunk)
    attrs = re.sub(r"\s+id=(['\"]).*?\1", "", m.group(2))
    return chunk[: m.start(1) - 1] + f"<{m.group(1)}{attrs} id='{hid}'>" + chunk[m.end():]


def resolve(text: str, here: str, cache: dict) -> str:
    def sub(m):
        kind, v, i = m.group(1), m.group(2).upper(), m.group(3)
        if v not in cache:
            cache[v] = numbering(v)
        if i not in cache[v]:
            sys.exit(f"{here}: {{{{{kind}:{m.group(2)}-{i}}}}} points at no figure in {v}")
        label = f"V{int(v[1:])} Fig {cache[v][i]}"
        if kind == "fig":
            return label
        href = ("" if v == here else atlas_file(v).name) + f"#{m.group(2)}-{i}"
        return f"<a class='xref' href='{href}'>{label}</a>"
    return REF.sub(sub, text)


def build(v: str, out: Path | None) -> None:
    d = src_dir(v)
    order = read_order(v)
    dupes = sorted({i for i in order if order.count(i) > 1})
    if dupes:
        sys.exit(f"{v}: listed twice in order.txt: {dupes}")
    bad = [i for i in order if not NAME.match(i)]
    if bad:
        sys.exit(f"{v}: ids must be lowercase letters, digits, - or _: {bad}")
    missing = [i for i in order if not (d / "items" / f"{i}.html").exists()]
    if missing:
        sys.exit(f"{v}: no item file for {missing}")
    unused = sorted(p.stem for p in (d / "items").glob("*.html") if p.stem not in order)
    if unused:
        print(f"{v}: not in order.txt, so left out: {' '.join(unused)}")
    cache, parts, n = {}, [], 0
    for i in order:
        c = (d / "items" / f"{i}.html").read_text(encoding="utf-8")
        hid = f"{v.lower()}-{i}"
        if is_figure(c):
            n += 1
            if not STAMP.search(c):
                sys.exit(f"{v} {i}: a figure needs <div class='ts'>Fig ?? &nbsp;&middot;&nbsp; M:SS</div>")
            c = STAMP.sub(lambda m: f"{m.group(1)}{n:02d}{m.group(3)}{m.group(4)}{m.group(5)}", c, 1)
        c = resolve(set_id(c, hid), v, cache)
        parts.append(c)
    shell = (d / "shell.html").read_text(encoding="utf-8")
    a = shell.find("/* widgets */")                      # keep the shared widget styles current
    if a >= 0:
        shell = shell[:a] + WIDGET_CSS.lstrip("\n") + shell[shell.index("</style>", a):]
    page = resolve(shell, v, cache).replace("<!--ITEMS-->", "".join(parts))
    target = out or atlas_file(v)
    target.write_text(page, encoding="utf-8")
    print(f"{v}: {n} figures -> {target}")


def listing(v: str) -> None:
    n = 0
    for i in read_order(v):
        c = (src_dir(v) / "items" / f"{i}.html").read_text(encoding="utf-8")
        h = re.search(r"<h[23]>(.*?)</h[23]>", c, re.S)
        title = html.unescape(re.sub(r"<[^>]+>", "", h.group(1))) if h else ""
        if is_figure(c):
            n += 1
            st = STAMP.search(c)
            print(f"{n:4d}  {st.group(4) if st else '?':>7}  {i:10s} {title}")
        else:
            part = re.search(r"<div class=['\"]l['\"]>(.*?)</div>", c)
            print(f"\n      {i:>7}  {html.unescape(part.group(1)) if part else ''}: {title}")


def edit_order(v: str, cmd: str, args: list[str]) -> None:
    """insert AFTER NEW…, move ID AFTER, drop ID…: read, change and write order.txt under a lock."""
    import fcntl
    p = src_dir(v) / "order.txt"
    with open(src_dir(v) / ".order.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        lines = p.read_text(encoding="utf-8").splitlines()
        ids = [ln.split("#", 1)[0].strip() for ln in lines]
        where = lambda i: ids.index(i) if i in ids else sys.exit(f"{v}: {i} is not in order.txt")
        if cmd == "insert":
            after, new = args[0], args[1:]
            clash = [i for i in new if i in ids]
            if not new or clash:
                sys.exit(f"{v}: nothing to insert, or already in order.txt: {clash}")
            bad = [i for i in new if not NAME.match(i) or not (src_dir(v) / "items" / f"{i}.html").exists()]
            if bad:
                sys.exit(f"{v}: write items/<id>.html first (ids: lowercase letters, digits, - or _): {bad}")
            k = where(after) + 1
            lines[k:k] = new
        elif cmd == "move":
            item, after = args
            line = lines.pop(where(item))
            ids = [ln.split("#", 1)[0].strip() for ln in lines]
            k = where(after) + 1
            lines[k:k] = [line]
        else:
            for i in args:
                k = where(i)
                lines.pop(k)
                ids.pop(k)
        tmp = p.with_suffix(".tmp")                       # readers never see half a file
        tmp.write_text("\n".join(lines) + "\n", encoding="utf-8")
        tmp.replace(p)
    print(f"{v}: {cmd} {' '.join(args)}")


def index() -> None:
    p = ROOT / "atlases" / "index.html"
    t = p.read_text(encoding="utf-8")
    total = 0
    for k in range(1, 10):
        f = atlas_file(f"V{k:02d}")
        n = len(re.findall(r"<figure\b", f.read_text(encoding="utf-8")))
        total += n
        t, hit = re.subn(rf"(href='{re.escape(f.name)}'>.*?<span class='n'>)\d+( figures)", rf"\g<1>{n}\2", t, count=1)
        if not hit:
            sys.exit(f"index.html: no row for {f.name}")
    t, hit = re.subn(r"(<span><b>)[\d,]+(</b> figures</span>)", rf"\g<1>{total:,}\2", t, count=1)
    if not hit:
        sys.exit("index.html: no figure total")
    p.write_text(t, encoding="utf-8")
    print(f"index.html: {total:,} figures")


def main() -> None:
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("cmd", choices=["split", "build", "list", "insert", "move", "drop", "index"])
    a.add_argument("video", nargs="?", help="V01 … V09")
    a.add_argument("ids", nargs="*", help="insert: AFTER NEW…; move: ID AFTER; drop: ID…")
    a.add_argument("--out", type=Path, help="build: write here instead of atlases/")
    x = a.parse_args()
    if not (ROOT / "atlases").is_dir():
        sys.exit("run from the repository root")
    if x.cmd == "index":
        return index()
    if not x.video or not re.fullmatch(r"V0[1-9]", x.video):
        sys.exit("give a video: V01 … V09")
    if x.cmd in ("insert", "move", "drop"):
        need = {"insert": len(x.ids) >= 2, "move": len(x.ids) == 2, "drop": len(x.ids) >= 1}[x.cmd]
        if not need:
            sys.exit(f"{x.cmd}: see --help for the arguments")
        return edit_order(x.video, x.cmd, x.ids)
    {"split": lambda: split(x.video), "build": lambda: build(x.video, x.out),
     "list": lambda: listing(x.video)}[x.cmd]()


if __name__ == "__main__":
    main()
