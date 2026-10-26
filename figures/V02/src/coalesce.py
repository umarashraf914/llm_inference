"""V2 Part 9, coalescing: review proposals 19 and 20, with the 32-byte sector corrections to Figs 63,
65 and 66, and Fig 64's address formula. Granularity: NVIDIA, CUDA C++ Best Practices Guide §10.2.1
("the concurrent accesses of the threads of a warp will coalesce into a number of transactions equal to
the number of 32-byte transactions necessary"), and the Nsight Compute profiling guide ("An L1 or L2
cache line is four sectors, i.e. 128 bytes").

  python3 figures/V02/src/coalesce.py     writes p19 o063 p20; edits o064 o065 o066
"""
import json
from common import *  # noqa: F401,F403


def access(stride, elem):
    """Sectors and lines a warp touches when lane k reads `elem` bytes at k * stride * elem."""
    addrs = [k * stride * elem for k in range(WARP)]
    sectors = sorted({a // SECTOR for a in addrs})
    lines = sorted({a // LINE for a in addrs})
    used = WARP * elem
    moved = len(sectors) * SECTOR
    return dict(sectors=sectors, lines=lines, used=used, moved=moved, pct=100 * used / moved)


A1, A8 = access(1, 4), access(8, 4)
assert (len(A1["sectors"]), len(A1["lines"]), A1["moved"], A1["pct"]) == (4, 1, 128, 100)
assert (len(A8["sectors"]), len(A8["lines"]), A8["moved"], A8["pct"]) == (32, 8, 1024, 12.5)
assert [len(access(s, 4)["sectors"]) for s in (1, 2, 4, 8, 16, 32, 64)] == [4, 8, 16, 32, 32, 32, 32]
assert [len(access(s, 4)["lines"]) for s in (1, 2, 4, 8, 16, 32, 64)] == [1, 2, 4, 8, 16, 32, 32]
assert access(2, 4)["pct"] == 50                       # BPG: "A stride of 2 results in a 50% of load/store efficiency"
assert len(access(32, 4)["lines"]) == 32 and access(32, 4)["moved"] // A1["moved"] == 8


# ---- p19: sectors and lines (replaces o061 and o062) ---------------------------------------------
def p19():
    b = [hd(40, 46, "One 128-byte line: four 32-byte sectors, eight 4-byte numbers in each")]
    CW, X0 = 17, 68
    for k in range(32):
        sec = k // 8
        b.append(cell(X0 + k * CW, 64, CW - 2, 26, "s", rx=2))
    for s_ in range(4):
        x = X0 + s_ * 8 * CW
        b.append(ln(x, 98, x + 8 * CW - 2, 98, "tick"))
        b.append(txt(x + 4 * CW - 1, 114, f"sector {s_}: 32 bytes", "sub2", "middle"))
    b.append(txt(X0, 136, "a warp reading 32 neighbouring numbers: one line, four sectors, every byte wanted",
                 "sub2"))
    b.append(hd(40, 182, "The same warp, each lane in a different sector"))
    for k in range(16):
        x = X0 + k * 34
        b.append(rect(x, 198, 30, 26, "h", rx=2))
        b.append(rect(x, 198, 30 * 4 / 32, 26, "s", rx=1))
    b.append(txt(X0, 244, "16 of the 32 sectors drawn; teal is the 4 bytes a lane asked for, red the 28 that "
                          "came anyway", "sub2"))
    rows = [("neighbours", A1, "s"), ("scattered", A8, "h")]
    b.append(hd(40, 290, "Bytes moved for the same 128 bytes asked for, to scale"))
    for k, (lab, a, c) in enumerate(rows):
        y = 306 + k * 40
        w = a["moved"] / 1024 * 440
        b.append(txt(40, y + 18, lab, "cap"))
        note = f"{a['moved']:,} bytes: {len(a['sectors'])} sectors, {a['pct']:g}% used"
        if w > tw(note) + 30:
            b.append(cell(170, y, w, 26, c, label=note))
        else:
            b.append(rect(170, y, w, 26, c))
            b.append(txt(170 + w + 10, y + 18, note, "sub2"))
    body, yb = prose(306 + 2 * 40 + 36, [
        "The memory system never hands over a single number. On this chip, as on every NVIDIA GPU of "
        "compute capability 6.0 or later, a warp's reads are gathered into 32-byte sectors, and the caches "
        "keep them in 128-byte lines of four sectors. A sector comes whole even if one number in it is "
        "wanted.",
        "So when the 32 lanes ask for neighbouring 4-byte numbers, four sectors serve the whole warp. When "
        "each asks for a number in a different sector, 32 sectors come up: 1,024 bytes moved for 128 used, "
        "8 times the traffic. Counted in lines it is 32 requests where one would have done.",
    ])
    emit("p19", stamp(SRT, "It moves a whole block at a time"), "Memory arrives in 32-byte sectors, four to a 128-byte line",
         yb + 24, b + [body],
         "The block the hardware moves is the sector, so the worst a scattered warp can do is 8 times the "
         "bytes, not 32. Granularity from NVIDIA's CUDA C++ Best Practices Guide and Nsight Compute "
         "documentation.")


# ---- o063: the matched sizes, with sectors ------------------------------------------------------
def o063():
    A32 = access(32, 4)                                 # lanes 128 bytes apart: one line each
    assert len(A32["lines"]) == 32 and len(A32["sectors"]) == 32 and A32["moved"] == 1024
    b = [eq(90, 46, 500, "32 threads  ×  4 bytes  =  128 bytes  =  one line  =  four sectors", cls="m")]
    b.append(hd(40, 136, "What one warp instruction turns into, to scale"))
    groups = [("line requests", [("neighbours", len(A1["lines"]), "s"), ("128 bytes apart", len(A32["lines"]), "h")]),
              ("sectors moved", [("neighbours", len(A1["sectors"]), "s"), ("128 bytes apart", len(A32["sectors"]), "h")])]
    y = 152
    for name, rows in groups:
        b.append(txt(40, y + 18, name, "cap"))
        for k, (lab, v, c) in enumerate(rows):
            yy = y + k * 32
            w = v / 32 * 220
            b.append(rect(300, yy, w, 24, c))
            b.append(txt(300 + w + 10, yy + 17, f"{v}  ({lab})", "sub2"))
        y += 2 * 32 + 22
    body, yb = prose(y + 24, [
        "The warp width and the line size are matched: a warp reading 32 consecutive 4-byte numbers asks "
        "for exactly one 128-byte line, and its four sectors carry nothing but wanted bytes.",
        "Put the lanes 128 bytes apart and every lane needs a line of its own: 32 requests where one would "
        "have done, the 32 transactions usually quoted. The bytes grow only eightfold, from 4 sectors to 32, "
        "because each request brings one 32-byte sector, not a whole line.",
    ])
    emit("o063", stamp(SRT, "a cache line"), "32 lanes of 4 bytes fill one 128-byte line exactly", yb + 24,
         b + [body],
         "Two costs, counted separately: requests the caches must handle, and bytes the memory must move. "
         "Scattering multiplies the first by 32 and the second by 8.")


# ---- p20: the stride widget --------------------------------------------------------------------
S0, E0 = 8, 4
SW = 15                                   # px per sector cell


def p20_read(stride, elem):
    a = access(stride, elem)
    return {"sec": f"sectors fetched: {len(a['sectors'])} × 32 = {a['moved']:,} bytes",
            "lin": f"128-byte lines touched: {len(a['lines'])}",
            "use": f"bytes the threads asked for: 32 × {elem} = {a['used']}",
            "pct": f"used: {f(a['pct'], 1)}% of what was moved"}


def p20_cells(stride, elem):
    """For each of up to 32 sectors fetched, the share of its 32 bytes that some lane wanted."""
    a = access(stride, elem)
    out = []
    for s_ in a["sectors"]:
        lanes = sum(1 for k in range(WARP) if (k * stride * elem) // SECTOR == s_)
        out.append(lanes * elem / SECTOR)
    return out


P20_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const DEF = __DEF__, SW = __SW__, X0 = __X0__;
  const sl = fig.querySelector('input[type=range]'), val = fig.querySelector('.val');
  const rad = [...fig.querySelectorAll('input[type=radio]')], q = s => fig.querySelector(s);
  const f1 = v => v.toFixed(1), NS = 'http://www.w3.org/2000/svg';
  function draw() {
    const st = +sl.value, el = +rad.find(r => r.checked).value;
    val.textContent = st;
    const secs = new Map(), lines = new Set();
    for (let k = 0; k < 32; k++) {
      const a = k * st * el, s = Math.floor(a / 32);
      secs.set(s, (secs.get(s) || 0) + 1); lines.add(Math.floor(a / 128));
    }
    const keys = [...secs.keys()].sort((x, y) => x - y), moved = keys.length * 32, used = 32 * el;
    const g = q('[data-cells]'); g.replaceChildren();
    keys.forEach((s, i) => {
      const x = X0 + i * SW, share = secs.get(s) * el / 32;
      const r = document.createElementNS(NS, 'rect'), u = document.createElementNS(NS, 'rect');
      const gr = document.createElementNS(NS, 'g'), gu = document.createElementNS(NS, 'g');
      [[r, SW - 2], [u, (SW - 2) * share]].forEach(([e, w]) => { e.setAttribute('x', x); e.setAttribute('y', 92);
        e.setAttribute('width', w.toFixed(1)); e.setAttribute('height', 26); e.setAttribute('rx', 1); });
      gr.setAttribute('class', 'h'); gu.setAttribute('class', 's'); gr.appendChild(r); gu.appendChild(u);
      g.appendChild(gr); g.appendChild(gu);
    });
    q('[data-moved]').setAttribute('width', (moved / 1024 * 440).toFixed(1));
    q('[data-sec]').textContent = `sectors fetched: ${keys.length} × 32 = ${moved.toLocaleString('en-US')} bytes`;
    q('[data-lin]').textContent = `128-byte lines touched: ${lines.size}`;
    q('[data-use]').textContent = `bytes the threads asked for: 32 × ${el} = ${used}`;
    q('[data-pct]').textContent = `used: ${f1(100 * used / moved)}% of what was moved`;
    q('[data-usedbar]').setAttribute('width', (used / 1024 * 440).toFixed(1));
  }
  sl.addEventListener('input', draw); rad.forEach(r => r.addEventListener('change', draw));
  q('button').addEventListener('click', () => { sl.value = DEF[0]; rad.forEach(r => r.checked = +r.value === DEF[1]); draw(); });
  draw();
})();</script>"""


def p20():
    X0 = 150
    a = access(S0, E0)
    rd = p20_read(S0, E0)
    b = [hd(40, 34, "Lane k reads the number at k × stride; each sector the warp pulls in, drawn")]
    b.append(txt(40, 82, "the 32 lanes", "cap"))
    for k in range(32):
        b.append(cell(X0 + k * SW, 64, SW - 2, 20, "u", rx=1))
    b.append(txt(40, 110, "sectors fetched", "cap"))
    cells = []
    for i, share in enumerate(p20_cells(S0, E0)):
        x = X0 + i * SW
        cells.append(f'<g class="h"><rect x="{x}" y="92" width="{fixed(SW - 2)}" height="26" rx="1"/></g>'
                     f'<g class="s"><rect x="{x}" y="92" width="{fixed((SW - 2) * share)}" height="26" rx="1"/></g>')
    b.append(f'<g data-cells="">{"".join(cells)}</g>')
    b.append(txt(X0, 136, "teal: bytes some lane asked for; red: the rest of each 32-byte sector", "sub2"))
    b.append(txt(40, 172, "bytes moved", "cap"))
    b.append(f'<g class="h"><rect x="{X0}" y="156" width="{fixed(a["moved"] / 1024 * 440)}" height="24" rx="3" data-moved=""/></g>')
    b.append(txt(40, 206, "bytes asked for", "cap"))
    b.append(f'<g class="s"><rect x="{X0}" y="190" width="{fixed(a["used"] / 1024 * 440)}" height="24" rx="3" data-usedbar=""/></g>')
    for k, key in enumerate(("sec", "lin", "use", "pct")):
        b.append(f'<text class="sub2" x="40" y="{244 + k * 20}" data-{key}="">{esc(rd[key])}</text>')
    body, yb = prose(244 + 4 * 20 + 30, [
        "At stride 1 the 32 lanes read neighbours and four sectors carry everything. Every doubling of the "
        "stride doubles the sectors until, at 8 numbers of 4 bytes (32 bytes), every lane has a sector to "
        "itself: 32 sectors, 1,024 bytes moved, 12.5% used. Beyond that the waste stays the same; the lanes "
        "just spread over more lines.",
        "Wider numbers waste less, because each lane uses more of its sector: 8-byte numbers at any large "
        "stride still use a quarter. The sector rule is NVIDIA's; the page's arithmetic was checked against "
        "Python at every setting.",
    ])
    title = "Turn the stride and watch the bytes go to waste"
    ctl = (f"<label>stride, in numbers <input type='range' min='1' max='64' step='1' value='{S0}'>"
           f"<span class='val'>{S0}</span></label>")
    opts = "".join(f"<label class='opt'><input type='radio' name='v02-p20-elem' value='{e}'"
                   f"{' checked' if e == E0 else ''}> {e}-byte numbers</label>" for e in (2, 4, 8))
    opts += "<button type='button'>Reset</button>"
    js = P20_JS.replace("__DEF__", json.dumps([S0, E0])).replace("__SW__", str(SW)).replace("__X0__", str(X0))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {stamp(SRT, 'up to 32 transactions')}</div>"
             f"<h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div><div class='ctl'>{opts}</div>"
             f"<svg viewBox='0 0 680 {yb + 24}' role='img'><title>{title}</title>{''.join(b)}{body}</svg></div>"
             "<figcaption>Same arithmetic at every setting; only where the numbers sit changes, and with it up "
             "to eight times the traffic for 4-byte numbers.</figcaption>"
             f"{js}</figure>")
    (OUT / "p20.html").write_text(html_, encoding="utf-8")
    print("p20   ", title)


def fixes():
    edit_item("o064", from_y=400, paras=[
        "Element (row, column) of a grid 6 numbers wide is number row × 6 + column in that line, so its "
        "address is (row × 6 + column) × 4 bytes from the start. Neighbours along a row are 4 bytes "
        "apart; neighbours down a column are 6 × 4 = 24 bytes apart.",
        "In a real matrix 4,096 numbers wide, one step down a column is 4,096 × 4 = 16,384 bytes. A warp "
        "walking down a column puts every lane in a different sector, and each 32-byte sector it fetches "
        "carries 4 useful bytes.",
        "So walking a row is cheap and walking a column is expensive, purely because of how the numbers "
        "were laid out. Nothing about the mathematics prefers either direction.",
    ], caption="Layout is not a detail. The same loop written two ways can differ eightfold in traffic "
               "without changing a single arithmetic operation.")
    edit_item("o065", from_y=260, paras=[
        "Both rows read numbers for the same arithmetic. For a whole warp of 32 lanes, stride 1 touches "
        "4 sectors and stride 4 touches 16: four times the bytes, most of them thrown away.",
        "At a stride of 8 four-byte numbers, 32 bytes, every lane lands in its own sector and the waste "
        "reaches its maximum: 32 sectors, 1,024 bytes moved for 128 used. Larger strides spread the lanes "
        "over more cache lines, but move no more bytes.",
        "Which is why the shape of a loop, and the order its indices run in, is a bandwidth decision rather "
        "than a matter of taste.",
    ])
    sliver = 50 * 4 / 32
    reps = [(f'<g class="s"><rect x="{x}" y="126" width="11" height="40" rx="4"></rect></g>',
             f'<g class="s"><rect x="{x}" y="126" width="{sliver:g}" height="40" rx="1"></rect></g>')
            for x in (382, 444, 506, 568)]
    reps.append(("one transaction, every byte wanted", "four sectors, every byte wanted"))
    edit_item("o066", replace=reps, from_y=196, paras=[
        "Each lane on the right drags in a whole 32-byte sector for its 4 bytes. The teal sliver, one "
        "eighth of each block, is the part anybody asked for; the rest is hauled across the bus and thrown "
        "away.",
    ], caption="Slivers drawn at their true eighth. The direct ancestor of the next atlas, on kernels: "
               "FlashAttention is in large part an exercise in making every fetched byte count.")


if __name__ == "__main__":
    p19()
    o063()
    p20()
    fixes()
