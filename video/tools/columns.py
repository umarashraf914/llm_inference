#!/usr/bin/env python3
"""Rows of boxes and the pictures under them: is each picture centred under its box, and do the pictures of
one row share a centre line? The audit reads text, so it cannot see this; the user did ("the figures are not
centred under their names' boxes, and not in line with each other").

  python3 tools/columns.py v01 ch03_s02          # one scene
  python3 tools/columns.py v01 all               # the film: a list of places to look at

A row is two or more filled boxes of one size side by side, evenly spaced, no further apart than a box is wide
(cards, name plates, headers). Each box's picture is
everything visible drawn below it, down to the next box or 420 px, whose middle lies in the box's column; a
picture wider than its column (a panel, a band) belongs to no column. Sampled where each beat has settled. It
finds candidates, not verdicts: a bar chart's bars stand on one baseline on purpose, so look at each one.
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

TOL = 10            # px a picture may sit off its box's centre, or off its row's centre line

CHECK = r"""
o => {
  const film = document.getElementById('film'), root = document.getElementById('scene-root');
  const op = e => {
    let v = 1;
    for (let n = e; n && n.nodeType === 1 && n !== film; n = n.parentNode) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      v *= parseFloat(cs.opacity || '1');
      const a = n.getAttribute('opacity');
      if (a !== null && a !== '' && n.style.opacity === '') v *= parseFloat(a);
    }
    return v;
  };
  const bb = e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  // the boxes: filled rects of card size, each counted once (a card draws its base and its face on one spot)
  const seen = new Set(), boxes = [];
  for (const s of root.querySelectorAll('rect')) {
    const f = s.getAttribute('fill');
    if (!f || f === 'none' || s.closest('defs, pattern, clipPath, mask') || op(s) < 0.5) continue;
    const b = bb(s);
    if (b.w < 90 || b.w > 760 || b.h < 34 || b.h > 420) continue;
    const key = [b.l, b.t, b.w, b.h].map(Math.round).join(',');
    if (seen.has(key)) continue;
    seen.add(key); boxes.push(b);
  }
  // rows: same top, height and width, side by side
  const rows = [];
  for (const b of boxes) {
    const row = rows.find(r => Math.abs(r[0].t - b.t) <= 3 && Math.abs(r[0].h - b.h) <= 3 && Math.abs(r[0].w - b.w) <= 3);
    row ? row.push(b) : rows.push([b]);
  }
  // what is drawn: shapes, texts, and each icon as one piece
  const pieces = [];
  for (const e of root.querySelectorAll('rect, circle, ellipse, path, line, polyline, polygon, text, svg')) {
    if (e.closest('defs, pattern, clipPath, mask')) continue;
    const host = e.parentNode && e.parentNode.closest && e.parentNode.closest('svg');
    if (host && host !== film) continue;                  // inside an icon: the icon counts as one piece
    if (op(e) < 0.15) continue;                            // a dimmed picture still shows
    const b = bb(e);
    if (b.w < 1 && b.h < 1) continue;
    pieces.push({ ...b, text: e.tagName === 'text', tag: e.tagName });
  }
  const out = [];
  for (const row of rows) {
    if (row.length < 2) continue;
    row.sort((a, b) => a.l - b.l);
    const gaps = row.slice(1).map((b, i) => b.l - row[i].r);
    if (gaps.some(g => g < 0 || g > row[0].w)) continue;               // overlapping, or too far apart to head columns
    if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 0.15 * Math.max(...gaps) + 4) continue;   // uneven
    const L = row[0].l, R = row[row.length - 1].r, TOP = row[0].t, BOT = row[0].b;
    const frames = [...root.querySelectorAll('rect')].filter(s => !s.closest('defs, pattern, clipPath, mask') && op(s) >= 0.15)
      .map(bb).filter(f => f.l <= L - 1 && f.r >= R + 1 && f.t <= TOP - 1 && f.b >= BOT + 40);
    const frame = frames.sort((a, b) => a.w * a.h - b.w * b.h)[0];
    // a second row of boxes below ends the columns (a box inside a picture, such as a tray, does not)
    const below = rows.filter(r => r !== row && r.length > 1 && r[0].t > BOT + 4 && r[0].w > 0.6 * row[0].w)
      .flat().filter(b => b.l < R && b.r > L);
    const floor = Math.min(...below.map(b => b.t), frame ? frame.b : BOT + 420);
    const cols = row.map((b, i) => {
      const lb = i ? (row[i - 1].r + b.l) / 2 : b.l - (row.length > 1 ? (row[1].l - b.r) / 2 : 30);
      const rb = i < row.length - 1 ? (b.r + row[i + 1].l) / 2 : b.r + (row.length > 1 ? (b.l - row[i - 1].r) / 2 : 30);
      let u = null;
      for (const p of pieces) {
        if (p.t < b.b + 2 || p.b > floor - 6) continue;           // a label on the frame's edge is the frame's
        const cx = (p.l + p.r) / 2;
        if (p.text && p.t < b.b + 60 && Math.abs(cx - (b.l + b.r) / 2) < 6) continue;   // the box's caption
        if (cx < lb || cx > rb || p.w > rb - lb + 40) continue;
        u = u ? { l: Math.min(u.l, p.l), r: Math.max(u.r, p.r), t: Math.min(u.t, p.t), b: Math.max(u.b, p.b) } : { ...p };
        if (o.debug === i) (o.took = o.took || []).push([p.tag, ...[p.l, p.r, p.t, p.b].map(Math.round)]);
      }
      return { box: b, pic: u && (u.r - u.l) >= 30 && (u.b - u.t) >= 16 ? u : null };
    });
    const withPic = cols.filter(c => c.pic);
    if (withPic.length < 2) continue;
    const r = x => Math.round(x);
    const off = withPic.map(c => ({ box: r((c.box.l + c.box.r) / 2), pic: r((c.pic.l + c.pic.r) / 2), mid: r((c.pic.t + c.pic.b) / 2) }));
    const mids = off.map(c => c.mid);
    const spread = Math.max(...mids) - Math.min(...mids);
    const offCentre = off.filter(c => Math.abs(c.pic - c.box) > o.tol);
    if (offCentre.length || spread > o.tol)
      out.push({ row: `${row.length} boxes ${r(row[0].w)}x${r(row[0].h)} at y ${r(row[0].t)}`,
                 offCentre: offCentre.map(c => `box ${c.box}: picture ${c.pic} (${c.pic - c.box > 0 ? '+' : ''}${c.pic - c.box})`),
                 lines: spread > o.tol ? `picture middles at y ${mids.join(', ')}` : null });
  }
  return o.debug !== undefined ? o.took : out;
}
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film")
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--tol", type=float, default=TOL)
    a = ap.parse_args()
    film = Path(a.film) if Path(a.film).is_dir() else render.VIDEO / a.film
    timing = json.loads((film / "build" / "timing.json").read_text())
    ids = [s for s in render.select(timing, a.scenes) if timing["scenes"][s]["kind"] != "title"]
    st = render.Stage(film.resolve())
    found = 0
    try:
        for sid in ids:
            entry = timing["scenes"][sid]
            st.load(entry)
            seen = {}
            for b in entry["beats"]:                     # where each beat has settled, and halfway through it
                for t in (b["start"] + b["dur"] * 0.5, b["end"] - 0.15):
                    st.seek(round(t, 2))
                    for f in st.page.evaluate(CHECK, {"tol": a.tol}):
                        key = json.dumps(f, sort_keys=True)
                        seen.setdefault(key, (f, []))[1].append(round(t, 1))
            for f, ts in seen.values():
                found += 1
                where = f"t={ts[0]}" + (f"..{ts[-1]}" if len(ts) > 1 else "")
                print(f"{sid} {where}: {f['row']}")
                for c in f["offCentre"]:
                    print(f"    off centre: {c}")
                if f["lines"]:
                    print(f"    not on one line: {f['lines']}")
    finally:
        st.close()
    print(f"{found} place(s) to look at" if found else "every row's pictures sit centred and in line")


if __name__ == "__main__":
    main()
