#!/usr/bin/env python3
"""Is each frame composed from the centre out, like a slide? The user's rule: plan the frame from everything it
will hold, centre that whole composition on the screen, centre groups of boxes as groups, and centre each box's
contents in the box (and so on inside), rather than drawing from the top left and ending wherever the drawing ends.

  python3 tools/compose.py v01 ch13_s04          # one scene (or chapters: ch13)
  python3 tools/compose.py v01 all               # the film: a list of places to look at
  python3 tools/compose.py v01 ch13_s04 --at 15.2 --show    # one moment, with the measured boxes drawn on a still

Each beat is measured where it has settled (just before it ends):
  frame  everything visible (the chapter label aside) as one block: how far its centre is from the screen's centre.
         A heading (a large centred line at the top, with its subtitle) and a closing line (a centred line at the
         bottom) are left out of the block, which is then judged against the space between them, as on a slide.
         An axis where the block runs off the screen (a camera close-up) is not judged.
  box    each box (a rect with a fill or an outline) holding other things: how far the block of its contents sits
         from the box's centre, and each row of those contents (things side by side) on its own.
It finds candidates, not verdicts: a chart's axis labels or a deliberate offset can be right. Look at each one.
"""
import argparse, json, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

FRAME_X, FRAME_Y = 24, 40      # px the whole composition may sit off the screen's centre
BOX = 12                       # px a box's contents may sit off its centre
ROW = 20                       # px one row of a box's contents may sit off the box's centre

CHECK = r"""
o => {
  const film = document.getElementById('film'), root = document.getElementById('scene-root');
  const W = 1920, H = 1080;
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
  const paints = e => {
    if (e.tagName === 'svg' || e.tagName === 'image' || e.tagName === 'use') return true;
    const cs = getComputedStyle(e);
    const f = cs.fill, s = cs.stroke;
    const fillOn = f && f !== 'none' && parseFloat(cs.fillOpacity || '1') > 0.02 && !/pglow/.test(f);
    const strokeOn = s && s !== 'none' && parseFloat(cs.strokeOpacity || '1') > 0.02 && parseFloat(cs.strokeWidth || '1') > 0;
    return fillOn || strokeOn;
  };
  // a text's box narrowed to its letters, as the engine's audit does (Poppins' line box is 1.4 em tall)
  const mctx = document.createElement('canvas').getContext('2d');
  const bb = e => {
    const r = e.getBoundingClientRect(), box = { l: r.left, r: r.right, t: r.top, b: r.bottom };
    if (e.tagName !== 'text' || !e.textContent.trim()) return box;
    const ctm = e.getScreenCTM();
    if (!ctm || Math.abs(ctm.b) > 1e-3 || Math.abs(ctm.c) > 1e-3) return box;
    const cs = getComputedStyle(e);
    mctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = mctx.measureText(e.textContent), lb = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    if (!lb) return box;
    const k = r.height / lb, base = r.top + m.fontBoundingBoxAscent * k;
    return { ...box, t: base - m.actualBoundingBoxAscent * k, b: base + m.actualBoundingBoxDescent * k };
  };
  const clip = b => ({ l: Math.max(0, b.l), r: Math.min(W, b.r), t: Math.max(0, b.t), b: Math.min(H, b.b) });
  const pieces = [];
  for (const e of root.querySelectorAll('rect, circle, ellipse, path, line, polyline, polygon, text, svg, image, use')) {
    if (e.closest('defs, pattern, clipPath, mask, marker')) continue;
    const host = e.parentNode && e.parentNode.closest && e.parentNode.closest('svg');
    if (host && host !== film) continue;                    // inside an icon: the icon counts as one piece
    if (op(e) < (o.minOp || 0.15) || !paints(e)) continue;
    const raw = bb(e);
    if ((raw.r - raw.l) * (raw.b - raw.t) < 150 && e.tagName !== 'text') continue;   // specks: particles, sparks, dots
    if (raw.r - raw.l >= W - 60 && raw.b - raw.t >= H - 60) continue;   // a backdrop
    const c = clip(raw);
    if (c.r <= c.l || c.b <= c.t) continue;                  // off the screen
    pieces.push({ ...c, raw, el: e, tag: e.tagName, text: e.tagName === 'text' ? e.textContent.slice(0, 24) : null });
  }
  const r0 = x => Math.round(x);
  const union = ps => ps.reduce((u, p) => u ? { l: Math.min(u.l, p.l), r: Math.max(u.r, p.r), t: Math.min(u.t, p.t), b: Math.max(u.b, p.b) } : { l: p.l, r: p.r, t: p.t, b: p.b }, null);
  const out = { frame: null, boxes: [] };
  // the frame: everything shown in full as one block (a picture dimmed to context does not set the composition)
  // a slide's heading (a large centred line at the top, with its subtitle) and its closing line (a centred line at
  // the bottom) frame the body: the body is centred in the space between them, and on the screen when they are absent
  const shown = pieces.filter(p => op(p.el) >= 0.5);
  const size = p => parseFloat(getComputedStyle(p.el).fontSize) || 0;
  const mid = p => Math.abs((p.l + p.r) / 2 - W / 2) < 300;
  const head = shown.filter(p => p.tag === 'text' && p.t < 200 && size(p) >= 32 && mid(p));
  if (head.length) {
    // the rest of the heading's line (a long equation reaches past the middle), then a subtitle centred under it
    const h1 = union(head);
    head.push(...shown.filter(p => p.tag === 'text' && !head.includes(p) && Math.abs(p.b - h1.b) < 14 && size(p) >= 28));
    const h0 = union(head);
    head.push(...shown.filter(p => p.tag === 'text' && !head.includes(p) && p.t >= h0.t && p.t < h0.b + 40 && Math.abs((p.l + p.r) / 2 - (h0.l + h0.r) / 2) < 60));
  }
  const foot = shown.filter(p => p.tag === 'text' && !head.includes(p) && p.t > 900 && size(p) >= 26 && mid(p));
  // a heading or closing line set in a pill or a card: the shape around it belongs to it
  const holds = (b, q) => b.l <= q.l + 1 && b.r >= q.r - 1 && b.t <= q.t + 1 && b.b >= q.b - 1;
  for (const set of [head, foot]) {
    const texts = [...set];
    set.push(...shown.filter(p => p.tag !== 'text' && !set.includes(p) && texts.some(q => holds(p, q)) && (p.b - p.t) < 160));
  }
  const body = shown.filter(p => !head.includes(p) && !foot.includes(p));
  const U = union(body.length ? body : shown);
  if (U) {
    // the space a body is centred in: under the heading (or the top of the safe area), above the closing line (or
    // the bottom of the safe area), which with neither is centred on the screen
    const top = head.length ? union(head).b : 70, bottom = foot.length ? union(foot).t : H - 70;
    const bleedX = U.l <= 2 || U.r >= W - 2, bleedY = U.t <= 2 || U.b >= H - 2;
    out.frame = { l: r0(U.l), r: r0(U.r), t: r0(U.t), b: r0(U.b), head: !!head.length, foot: !!foot.length,
                  dx: bleedX ? null : r0((U.l + U.r) / 2 - W / 2), dy: bleedY ? null : r0((U.t + U.b) / 2 - (top + bottom) / 2) };
  }
  // the boxes: rects big enough to hold things, each once (a card draws its base and face on one spot)
  const seen = new Set();
  const boxes = pieces.filter(p => p.tag === 'rect' && p.r - p.l >= 100 && p.b - p.t >= 44 && !(p.r - p.l >= W - 60 && p.b - p.t >= H - 60))
    .filter(p => { const k = [p.l, p.t, p.r, p.b].map(r0).join(','); if (seen.has(k)) return false; seen.add(k); return true; });
  const same = (a, b) => Math.abs(a.l - b.l) < 3 && Math.abs(a.r - b.r) < 3 && Math.abs(a.t - b.t) < 3 && Math.abs(a.b - b.b) < 3;
  for (const B of boxes) {
    if (B.raw.l < -1 || B.raw.r > W + 1 || B.raw.t < -1 || B.raw.b > H + 1) continue;   // partly off the screen
    const w = B.r - B.l, h = B.b - B.t;
    const inside = pieces.filter(p => p !== B && !same(p, B) && p.l >= B.l - 1 && p.r <= B.r + 1 && p.t >= B.t - 1 && p.b <= B.b + 1
      // the box's own rules and frames: a line across most of it, a rect nearly its size
      && !((p.tag === 'line' || p.tag === 'path') && (p.r - p.l) > 0.7 * w && (p.b - p.t) < 6)
      && !(p.tag === 'rect' && (p.r - p.l) > 0.9 * w && (p.b - p.t) > 0.8 * h));
    if (!inside.length) continue;
    // a track and the bar filling it from one end (a progress bar, a gauge) is not a box of contents
    const fills = inside.every(p => p.tag === 'rect' && (
      ((Math.abs(p.l - B.l) < 7 || Math.abs(p.r - B.r) < 7) && (p.b - p.t) > 0.5 * h) ||
      ((Math.abs(p.b - B.b) < 7 || Math.abs(p.t - B.t) < 7) && (p.r - p.l) > 0.5 * w)));
    if (fills) continue;
    const C = union(inside);
    if (C.r - C.l < 8 && C.b - C.t < 8) continue;
    const dx = (C.l + C.r) / 2 - (B.l + B.r) / 2, dy = (C.t + C.b) / 2 - (B.t + B.b) / 2;
    // rows: things side by side (overlapping in height), each row's block on its own
    const rows = [];
    for (const p of [...inside].sort((a, b) => a.t - b.t)) {
      const row = rows.find(rw => p.t < rw.u.b - 2 && p.b > rw.u.t + 2);
      if (row) { row.ps.push(p); row.u = union(row.ps); } else rows.push({ ps: [p], u: { l: p.l, r: p.r, t: p.t, b: p.b } });
    }
    const holdsBoxes = boxes.some(o2 => o2 !== B && !same(o2, B) && o2.l >= B.l - 1 && o2.r <= B.r + 1 && o2.t >= B.t - 1 && o2.b <= B.b + 1);
    const badRows = holdsBoxes ? [] : rows.filter(rw => rw.ps.length && Math.abs((rw.u.l + rw.u.r) / 2 - (B.l + B.r) / 2) > o.row && (rw.u.r - rw.u.l) < 0.92 * w)
      .map(rw => ({ y: r0((rw.u.t + rw.u.b) / 2), dx: r0((rw.u.l + rw.u.r) / 2 - (B.l + B.r) / 2), what: rw.ps.map(p => p.text || p.tag).slice(0, 4).join(' | ') }));
    if (Math.abs(dx) > o.box || Math.abs(dy) > o.box || badRows.length)
      out.boxes.push({ box: [r0(B.l), r0(B.t), r0(w), r0(h)], block: C, dx: r0(dx), dy: r0(dy), n: inside.length,
                       label: (inside.find(p => p.text) || {}).text || '', rows: badRows });
  }
  if (o.show) {
    // the screen's centre (pink), the composition's block (pink) and its centre (yellow); each off-centre box's
    // centre (cyan) and its contents' block and centre (yellow)
    const ns = 'http://www.w3.org/2000/svg';
    document.getElementById('compose-show')?.remove();
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'compose-show');
    const add = (tag, at) => { const e = document.createElementNS(ns, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); g.appendChild(e); };
    const rect = (b, c, dash) => add('rect', { x: b.l, y: b.t, width: b.r - b.l, height: b.b - b.t, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-dasharray': dash });
    const vline = (x, y1, y2, c, w, dash) => add('line', { x1: x, y1, x2: x, y2, stroke: c, 'stroke-width': w, 'stroke-dasharray': dash || '' });
    const hline = (y, x1, x2, c, w, dash) => add('line', { x1, y1: y, x2, y2: y, stroke: c, 'stroke-width': w, 'stroke-dasharray': dash || '' });
    vline(W / 2, 0, H, '#ff3b8b', 2, '8 8'); hline(H / 2, 0, W, '#ff3b8b', 2, '8 8');
    if (U) { rect(U, '#ff3b8b', '12 6'); vline((U.l + U.r) / 2, U.t, U.b, '#ffd23b', 3); hline((U.t + U.b) / 2, U.l, U.r, '#ffd23b', 3); }
    for (const f of out.boxes) {
      const [l, t, w, h] = f.box;
      vline(l + w / 2, t, t + h, '#37e0ff', 3, '6 4');
      const C = f.block;
      rect(C, '#ffd23b', '5 4'); vline((C.l + C.r) / 2, C.t, C.b, '#ffd23b', 2);
    }
    film.appendChild(g);
  }
  return out;
}
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film")
    ap.add_argument("scenes", nargs="+")
    ap.add_argument("--at", type=float, help="one moment instead of each beat's end")
    ap.add_argument("--show", action="store_true", help="with --at: save a still with the measured blocks drawn on it")
    ap.add_argument("--frame-x", type=float, default=FRAME_X)
    ap.add_argument("--frame-y", type=float, default=FRAME_Y)
    ap.add_argument("--box", type=float, default=BOX)
    ap.add_argument("--row", type=float, default=ROW)
    ap.add_argument("--json", help="also write every finding here")
    ap.add_argument("--sheet", action="store_true", help="save a sheet per scene: each beat's settled frame with the "
                    "measured blocks drawn on it (build/compose/<scene>.jpg)")
    a = ap.parse_args()
    film = Path(a.film) if Path(a.film).is_dir() else render.VIDEO / a.film
    timing = json.loads((film / "build" / "timing.json").read_text())
    ids = [s for s in render.select(timing, a.scenes) if timing["scenes"][s]["kind"] != "title"]
    opts = {"box": a.box, "row": a.row}
    st = render.Stage(film.resolve())
    found, everything = 0, []
    try:
        for sid in ids:
            entry = timing["scenes"][sid]
            st.load(entry)
            times = [a.at] if a.at is not None else [round(b["end"] - 0.15, 2) for b in entry["beats"]]
            planned, shots = None, []
            for t in times:
                st.seek(t)
                r = st.page.evaluate(CHECK, {**opts, "show": bool((a.show and a.at is not None) or a.sheet)})
                if a.sheet:
                    shot = film / "build" / "compose" / sid / f"{t:07.2f}.png"
                    shot.parent.mkdir(parents=True, exist_ok=True)
                    st.page.screenshot(path=str(shot))
                    fr0 = r["frame"] or {}
                    shots.append((shot, f"{t:.1f}s  across {fr0.get('dx')}  down {fr0.get('dy')}"))
                if a.show and a.at is not None:
                    shot = film / "build" / "stills" / sid / f"{sid}_{t:07.2f}_compose.png"
                    shot.parent.mkdir(parents=True, exist_ok=True)
                    st.page.screenshot(path=str(shot))
                    print(f"still with the measured blocks: {shot}")
                fr = r["frame"]
                lines = []
                if fr and ((fr["dx"] is not None and abs(fr["dx"]) > a.frame_x) or (fr["dy"] is not None and abs(fr["dy"]) > a.frame_y)):
                    within = " between its heading and closing line" if fr.get("head") and fr.get("foot") else \
                        " under its heading" if fr.get("head") else " above its closing line" if fr.get("foot") else ""
                    lines.append(f"    frame: block x {fr['l']}..{fr['r']}, y {fr['t']}..{fr['b']}{within}: off centre by "
                                 f"{fr['dx'] if fr['dx'] is not None else '-'} across, {fr['dy'] if fr['dy'] is not None else '-'} down")
                for b in r["boxes"]:
                    l, tt, w, h = b["box"]
                    c = b["block"]
                    lines.append(f"    box {l},{tt} {w}x{h} ('{b['label']}', {b['n']} things): contents x {c['l']:.0f}..{c['r']:.0f}, "
                                 f"y {c['t']:.0f}..{c['b']:.0f}: off centre by {b['dx']} across, {b['dy']} down")
                    for rw in b["rows"]:
                        lines.append(f"        row at y {rw['y']} off by {rw['dx']}: {rw['what']}")
                everything.append({"scene": sid, "t": t, **r})
                if fr:
                    planned = fr if planned is None else {k: (min if k in "lt" else max)(planned[k], fr[k]) for k in "lrtb"}
                if lines:
                    found += 1
                    print(f"{sid} t={t}")
                    print("\n".join(lines))
            if a.sheet and shots:
                sheet = film / "build" / "compose" / f"{sid}.jpg"
                args = []
                for f, label in shots:
                    args += ["-label", label, str(f)]
                subprocess.run(["montage", *args, "-tile", "3x", "-geometry", "960x540+4+4", "-background", "#000",
                                "-pointsize", "28", "-fill", "#fff", str(sheet)], check=False, capture_output=True)
                print(f"{sid}: sheet {sheet}")
            if planned and a.at is None:
                # the shot as planned: everything its beats hold, together (a camera move makes this only a guide)
                dx, dy = round((planned["l"] + planned["r"]) / 2 - 960), round((planned["t"] + planned["b"]) / 2 - 540)
                if (abs(dx) > a.frame_x and planned["l"] > 2 and planned["r"] < 1918) or (abs(dy) > a.frame_y and planned["t"] > 2 and planned["b"] < 1078):
                    found += 1
                    print(f"{sid} all beats together: block x {planned['l']}..{planned['r']}, y {planned['t']}..{planned['b']}: "
                          f"off centre by {dx} across, {dy} down")
    finally:
        st.close()
    if a.json:
        Path(a.json).write_text(json.dumps(everything, indent=1))
    print(f"{found} moment(s) to look at" if found else "every frame and box is composed from the centre")


if __name__ == "__main__":
    main()
