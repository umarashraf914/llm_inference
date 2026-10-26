"""V2 Part 8, how the chip survives slow memory: review proposals 17 and 18 (two widgets), Fig 55's
last line, Fig 57's caption, and Figs 58 and 59 merged.

  python3 figures/V02/src/hiding.py     writes p17 p18; edits o055 o057 o059
"""
import json, math
from common import *  # noqa: F401,F403

# ---- p17: how many warps it takes to hide a wait ------------------------------------------------
W0, C0, L0 = 16, 32, 479               # defaults: a full scheduler, 32 instructions per load, the measured wait
T_WIN, LX0, LX1 = 1200, 150, 590       # ticks shown, and where they are drawn
ROW0, ROWH, ROWS = 74, 12, 16


def busy(w, c, l):
    return min(1.0, w * c / (c + l))


def needed(c, l):
    return math.ceil((c + l) / c)


def schedule(w, c, l):
    """Segments (kind, row, t0, t1) of the steady greedy schedule: each warp issues c instructions in
    one go, then waits l ticks; the period is max(w*c, c+l). Row -1 is the scheduler."""
    p = max(w * c, c + l)
    segs = []
    for k in range(w):
        if k * c > 0:
            segs.append(("queued", k, 0, k * c))
        n = 0
        while k * c + n * p < T_WIN:
            s = k * c + n * p
            segs.append(("issue", k, s, s + c))
            segs.append(("memory", k, s + c, s + c + l))
            if p > c + l:
                segs.append(("queued", k, s + c + l, s + p))
            n += 1
    n = 0
    while n * p < T_WIN:
        segs.append(("issue", -1, n * p, n * p + w * c))
        if p > w * c:
            segs.append(("idle", -1, n * p + w * c, (n + 1) * p))
        n += 1
    out = []
    for kind, row, a, b in segs:
        a, b = max(a, 0), min(b, T_WIN)
        if b > a:
            out.append((kind, row, a, b))
    return out


def tx_(t):
    return LX0 + t / T_WIN * (LX1 - LX0)


def seg_svg(kind, row, a, b):
    x, w = tx_(a), tx_(b) - tx_(a)
    y = 50 if row < 0 else ROW0 + row * ROWH
    h = 14 if row < 0 else 9
    if kind in ("queued", "idle"):
        return (f'<rect x="{fixed(x)}" y="{y}" width="{fixed(w)}" height="{h}" rx="1" fill="none" '
                f'stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>')
    cls = "m" if kind == "issue" else "h"
    return f'<g class="{cls}"><rect x="{fixed(x)}" y="{y}" width="{fixed(w)}" height="{h}" rx="1"/></g>'


def readouts(w, c, l):
    return {"busy": f"scheduler busy {f(100 * busy(w, c, l), 1)}% of the time",
            "need": f"warps needed to cover the wait: ⌈({c} + {l}) ÷ {c}⌉ = {needed(c, l)}",
            "occ": f"this scheduler holds {w} of its 16 warps: occupancy {f(100 * w / 16, 1)}%"}


P17_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const DEF = __DEF__, TW = __TW__, X0 = __X0__, X1 = __X1__, R0 = __R0__, RH = __RH__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  const f1 = v => v.toFixed(1);
  const tx = t => X0 + t / TW * (X1 - X0);
  function segs(w, c, l) {
    const p = Math.max(w * c, c + l), out = [];
    for (let k = 0; k < w; k++) {
      if (k * c > 0) out.push(['queued', k, 0, k * c]);
      for (let n = 0; k * c + n * p < TW; n++) {
        const s = k * c + n * p;
        out.push(['issue', k, s, s + c]); out.push(['memory', k, s + c, s + c + l]);
        if (p > c + l) out.push(['queued', k, s + c + l, s + p]);
      }
    }
    for (let n = 0; n * p < TW; n++) {
      out.push(['issue', -1, n * p, n * p + w * c]);
      if (p > w * c) out.push(['idle', -1, n * p + w * c, (n + 1) * p]);
    }
    return out.map(([k, r, a, b]) => [k, r, Math.max(a, 0), Math.min(b, TW)]).filter(s => s[3] > s[2]);
  }
  function draw() {
    const [w, c, l] = sl.map(s => +s.value);
    val[0].textContent = w; val[1].textContent = c; val[2].textContent = l;
    const g = q('[data-lanes]'); g.replaceChildren();
    for (const [kind, row, a, b] of segs(w, c, l)) {
      const x = tx(a), wd = tx(b) - tx(a), y = row < 0 ? 50 : R0 + row * RH, h = row < 0 ? 14 : 9;
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', y);
      r.setAttribute('width', wd.toFixed(1)); r.setAttribute('height', h); r.setAttribute('rx', 1);
      if (kind === 'queued' || kind === 'idle') {
        r.setAttribute('fill', 'none'); r.setAttribute('stroke', 'var(--rule)');
        r.setAttribute('stroke-width', 1); r.setAttribute('stroke-dasharray', '3 3'); g.appendChild(r);
      } else {
        const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', kind === 'issue' ? 'm' : 'h');
        gg.appendChild(r); g.appendChild(gg);
      }
    }
    const busy = Math.min(1, w * c / (c + l)), need = Math.ceil((c + l) / c);
    q('[data-busy]').textContent = `scheduler busy ${f1(100 * busy)}% of the time`;
    q('[data-need]').textContent = `warps needed to cover the wait: ⌈(${c} + ${l}) ÷ ${c}⌉ = ${need}`;
    q('[data-occ]').textContent = `this scheduler holds ${w} of its 16 warps: occupancy ${f1(100 * w / 16)}%`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl.forEach((s, i) => s.value = DEF[i]); draw(); });
  draw();
})();</script>"""


def p17():
    assert busy(16, 32, 479) == 1 and needed(32, 479) == 16
    assert needed(16, 479) == 31 and round(100 * busy(16, 16, 479), 1) == 51.7
    assert needed(8, 479) == 61 and round(100 * busy(16, 8, 479), 1) == 26.3
    # the closed form is the long-run share of ticks the schedule keeps the scheduler busy
    for w, c, l in [(16, 32, 479), (16, 8, 479), (5, 40, 300), (3, 64, 100)]:
        p = max(w * c, c + l)
        assert abs(w * c / p - busy(w, c, l)) < 1e-12
    b = [hd(40, 34, "One scheduler's warps over 1,200 ticks: issuing, waiting for memory, queued")]
    b.append(txt(40, 61, "scheduler", "cap"))
    b.append(txt(40, ROW0 + 9, "its warps,", "cap"))
    b.append(txt(40, ROW0 + 27, "one row each", "cap"))
    lanes = "".join(seg_svg(*s) for s in schedule(W0, C0, L0))
    b.append(f'<g data-lanes="">{lanes}</g>')
    ax = ROW0 + ROWS * ROWH + 6
    b.append(ln(LX0, ax, LX1, ax, "axis"))
    for t in range(0, T_WIN + 1, 300):
        b.append(vline(tx_(t), ax, ax + 5))
        b.append(txt(round(tx_(t), 1), ax + 19, f"{t:,}", "sub2", "middle"))
    b.append(txt(LX1, ax + 36, "ticks", "sub2", "end"))
    r = readouts(W0, C0, L0)
    yr = ax + 64
    b.append(f'<text class="sub2" x="40" y="{yr}" data-busy="">{esc(r["busy"])}</text>')
    b.append(f'<text class="sub2" x="40" y="{yr + 20}" data-need="">{esc(r["need"])}</text>')
    b.append(f'<text class="sub2" x="40" y="{yr + 40}" data-occ="">{esc(r["occ"])}</text>')
    body, yb = prose(yr + 84, [
        "Each warp does c instructions of work, then waits L ticks for a load. While one waits, the "
        "scheduler issues from another that is ready. It stays busy only if the other warps' work covers "
        "one warp's whole cycle, so a scheduler needs (c + L) ÷ c warps, rounded up.",
        f"With the measured {L0}-tick wait for HBM, 32 instructions between loads needs 16 warps, every warp "
        "a scheduler can hold. At 16 instructions it would need 31, and at 8 it would need 61, so even "
        "full occupancy leaves the scheduler idle three quarters of the time.",
        "A simplified model: real schedulers interleave warps, and loads overlap. Its arithmetic was "
        "checked against Python at many settings.",
    ])
    title = "How many warps it takes to hide a wait"
    ctl = (f"<label>warps on this scheduler <input type='range' min='1' max='16' step='1' value='{W0}'>"
           f"<span class='val'>{W0}</span></label>"
           f"<label>instructions between loads, c <input type='range' min='4' max='64' step='4' value='{C0}'>"
           f"<span class='val'>{C0}</span></label>"
           f"<label>wait for a load, L ticks <input type='range' min='100' max='1000' step='1' value='{L0}'>"
           f"<span class='val'>{L0}</span></label>")
    js = (P17_JS.replace("__DEF__", json.dumps([W0, C0, L0])).replace("__TW__", str(T_WIN))
          .replace("__X0__", str(LX0)).replace("__X1__", str(LX1)).replace("__R0__", str(ROW0))
          .replace("__RH__", str(ROWH)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {stamp(SRT, 'dozens of others')}</div>"
             f"<h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
             f"<div class='ctl'><button type='button'>Reset</button></div>"
             f"<svg viewBox='0 0 680 {yb + 24}' role='img'><title>{title}</title>{''.join(b)}{body}</svg></div>"
             "<figcaption>Occupancy cannot hide latency when there is too little work between loads: the "
             "scheduler's busy share is set by work against wait, and the warp count only caps it.</figcaption>"
             f"{js}</figure>")
    (OUT / "p17.html").write_text(html_, encoding="utf-8")
    print("p17   ", title)


# ---- p18: whichever runs out first sets the occupancy ---------------------------------------------
T18, R18, S18 = 128, 64, 48           # threads per block, registers per thread, KB of shared memory per block
SMEM_SM = SMEM_MAX_KB * 1024          # carve-out at its 228 KB maximum


def occupancy(threads, regs, smem_kb, regs_sm=REGS_PER_SM, smem_sm=SMEM_SM, reserve=SMEM_RESERVED):
    """Blocks per SM by each limit, after NVIDIA's cuda_occupancy.h (compute capability 9.0)."""
    wpb = math.ceil(threads / WARP)
    rpw = math.ceil(regs * WARP / REG_UNIT) * REG_UNIT
    if rpw * (math.ceil(wpb / SUBPARTS) * SUBPARTS) > regs_sm or regs > MAX_REGS_THREAD:
        by_regs = 0
    else:
        by_regs = (regs_sm // SUBPARTS) // rpw * SUBPARTS // wpb
    per_block = math.ceil((smem_kb * 1024 + reserve) / SMEM_UNIT) * SMEM_UNIT
    by_smem = smem_sm // per_block
    by_warps = MAX_WARPS_SM // wpb
    lim = {"registers": by_regs, "shared memory": by_smem, "64-warp limit": by_warps, "32-block limit": MAX_BLOCKS_SM}
    blocks = min(lim.values())
    return wpb, rpw, per_block, lim, blocks


def p18_text(threads, regs, smem_kb):
    wpb, rpw, per_block, lim, blocks = occupancy(threads, regs, smem_kb)
    warps = blocks * wpb
    order = ["registers", "shared memory", "64-warp limit", "32-block limit"]
    binding = [k for k in order if lim[k] == blocks]
    rows = {k: f"{lim[k] * wpb} warps ({lim[k]} block{'s' if lim[k] != 1 else ''})" for k in order}
    if blocks == 0:
        head = "a single block does not fit: " + " and ".join(binding)
    else:
        head = (f"resident: {blocks} block{'s' if blocks != 1 else ''} × {wpb} warp{'s' if wpb != 1 else ''} = "
                f"{warps} warps, occupancy {f(100 * warps / 64, 1)}%, set by {' and '.join(binding)}")
    detail = (f"per block: {wpb} warps × {rpw:,} registers each; {per_block:,} bytes of shared memory "
              f"with the 1 KB reserve")
    return rows, head, detail, binding, lim, wpb


P18_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const DEF = __DEF__, C = __C__, BX = __BX__, PX = __PX__;
  const sl = [...fig.querySelectorAll('input[type=range]')], val = [...fig.querySelectorAll('.val')];
  const q = s => fig.querySelector(s);
  const ORDER = ['registers', 'shared memory', '64-warp limit', '32-block limit'];
  function occ(t, r, s) {
    const wpb = Math.ceil(t / C.WARP), rpw = Math.ceil(r * C.WARP / C.REG_UNIT) * C.REG_UNIT;
    let byRegs;
    if (rpw * (Math.ceil(wpb / C.SUB) * C.SUB) > C.REGS || r > C.MAXR) byRegs = 0;
    else byRegs = Math.floor(Math.floor(Math.floor(C.REGS / C.SUB) / rpw) * C.SUB / wpb);
    const per = Math.ceil((s * 1024 + C.RES) / C.SMU) * C.SMU;
    const lim = {'registers': byRegs, 'shared memory': Math.floor(C.SMEM / per),
                 '64-warp limit': Math.floor(C.WARPS / wpb), '32-block limit': C.BLOCKS};
    return [wpb, rpw, per, lim, Math.min(...Object.values(lim))];
  }
  const pl = (n, w) => `${n} ${w}${n !== 1 ? 's' : ''}`;
  function draw() {
    const [t, r, s] = sl.map(x => +x.value);
    val[0].textContent = t; val[1].textContent = r; val[2].textContent = s + ' KB';
    const [wpb, rpw, per, lim, blocks] = occ(t, r, s), warps = blocks * wpb;
    const binding = ORDER.filter(k => lim[k] === blocks);
    ORDER.forEach((k, i) => {
      const w = Math.max(Math.min(lim[k] * wpb, 64) * PX, 2), bar = q(`[data-bar="${i}"]`), tt = q(`[data-v="${i}"]`);
      bar.setAttribute('width', w.toFixed(1));
      bar.parentNode.setAttribute('class', binding.includes(k) ? 'h' : 'u');
      tt.textContent = `${lim[k] * wpb} warps (${pl(lim[k], 'block')})`;
      tt.setAttribute('x', (BX + w + 10).toFixed(1));
    });
    q('[data-head]').textContent = blocks === 0
      ? 'a single block does not fit: ' + binding.join(' and ')
      : `resident: ${pl(blocks, 'block')} × ${pl(wpb, 'warp')} = ${warps} warps, occupancy ${(100 * warps / 64).toFixed(1)}%, set by ${binding.join(' and ')}`;
    q('[data-detail]').textContent = `per block: ${wpb} warps × ${rpw.toLocaleString('en-US')} registers each; ${per.toLocaleString('en-US')} bytes of shared memory with the 1 KB reserve`;
  }
  sl.forEach(x => x.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl.forEach((x, i) => x.value = DEF[i]); draw(); });
  draw();
})();</script>"""


def p18():
    # NVIDIA's worked example (CUDA C++ Best Practices Guide, compute capability 7.0, the same register
    # rules): 37 registers, 128-thread blocks -> 12 blocks, 75%; 320-thread blocks -> 4 blocks, 62.5%
    assert occupancy(128, 37, 0)[3]["registers"] == 12 and occupancy(320, 37, 0)[3]["registers"] == 4
    # the review's presets
    assert occupancy(128, 64, 48)[4] * 4 == 16 and p18_text(128, 64, 48)[3] == ["shared memory"]
    assert occupancy(256, 128, 0)[4] * 8 == 16 and p18_text(256, 128, 0)[3] == ["registers"]
    assert occupancy(256, 32, 0)[4] * 8 == 64
    rows, head, detail, binding, lim, wpb = p18_text(T18, R18, S18)
    BX, PX = 200, 5.0                                 # bar origin, px per warp
    b = [hd(40, 34, "Warps that could be resident, by each limit separately")]
    order = ["registers", "shared memory", "64-warp limit", "32-block limit"]
    for i, k in enumerate(order):
        y = 50 + i * 36
        w = max(min(lim[k] * wpb, 64) * PX, 2)
        b.append(txt(40, y + 17, k, "cap"))
        b.append(f'<g class="{"h" if k in binding else "u"}"><rect x="{BX}" y="{y}" width="{fixed(w)}" height="24" rx="3" data-bar="{i}"/></g>')
        b.append(f'<text class="sub2 halo" x="{fixed(BX + w + 10)}" y="{y + 17}" data-v="{i}">{esc(rows[k])}</text>')
    b.append(ln(BX + 64 * PX, 44, BX + 64 * PX, 50 + 4 * 36 - 6, "mark xok"))
    b.append(txt(BX + 64 * PX + 6, 50 + 4 * 36 + 8, "64", "sub2"))
    b.append(f'<text class="sub2" x="40" y="{50 + 4 * 36 + 40}" data-head="">{esc(head)}</text>')
    b.append(f'<text class="sub2" x="40" y="{50 + 4 * 36 + 60}" data-detail="">{esc(detail)}</text>')
    body, yb = prose(50 + 4 * 36 + 100, [
        "Four things limit how many warps a multiprocessor can hold for one kernel, and each is counted "
        "separately: registers (handed out 256 at a time per warp, from four quarters of 16,384), shared "
        "memory (in 128-byte units, plus 1 KB reserved per block, from a carve-out of up to 228 KB), the "
        "64-warp maximum and the 32-block maximum. Blocks are placed whole, so whichever limit is reached "
        "first sets the occupancy.",
        "Try 256 threads at 128 registers: the registers bind at 16 warps. Then 256 threads at 32 "
        "registers: everything fits, 64 warps. The rules are NVIDIA's occupancy calculator's for this chip; "
        "the page's arithmetic was checked against them in Python.",
    ])
    title = "Whichever runs out first sets the occupancy"
    ctl = (f"<label>threads per block <input type='range' min='32' max='1024' step='32' value='{T18}'>"
           f"<span class='val'>{T18}</span></label>"
           f"<label>registers per thread <input type='range' min='16' max='255' step='1' value='{R18}'>"
           f"<span class='val'>{R18}</span></label>"
           f"<label>shared memory per block <input type='range' min='0' max='227' step='1' value='{S18}'>"
           f"<span class='val'>{S18} KB</span></label>")
    consts = dict(WARP=WARP, REG_UNIT=REG_UNIT, SUB=SUBPARTS, REGS=REGS_PER_SM, MAXR=MAX_REGS_THREAD,
                  RES=SMEM_RESERVED, SMU=SMEM_UNIT, SMEM=SMEM_SM, WARPS=MAX_WARPS_SM, BLOCKS=MAX_BLOCKS_SM)
    js = (P18_JS.replace("__DEF__", json.dumps([T18, R18, S18])).replace("__C__", json.dumps(consts))
          .replace("__BX__", str(BX)).replace("__PX__", str(PX)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {stamp(SRT, 'switching warps is free')}</div>"
             f"<h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
             f"<div class='ctl'><button type='button'>Reset</button></div>"
             f"<svg viewBox='0 0 680 {yb + 24}' role='img'><title>{title}</title>{''.join(b)}{body}</svg></div>"
             "<figcaption>Red marks the limit that binds. A kernel that asks for a little more of any one resource "
             "can lose a whole block's worth of warps at once, which is why occupancy moves in steps.</figcaption>"
             f"{js}</figure>")
    (OUT / "p18.html").write_text(html_, encoding="utf-8")
    print("p18   ", title)


def fixes():
    edit_item("o055", from_y=252, paras=[
        "The oven takes the same time either way. What changes is whether the cook is idle while it runs.",
        "Nothing was made faster. The wait was covered with other work, and that is the whole of what "
        "latency hiding means.",
        "It only works if there are other dishes. On this chip they are other warps, and a large matrix "
        "multiply supplies thousands of them.",
    ], caption="The whole strategy in a kitchen. Notice what it does not do: no dish cooks faster, and no "
               "fewer trips are made to the oven, so it cannot help work that is short of bandwidth.")
    edit_item("o057", caption="This is what resident warps are for. How many it takes depends on how much "
              "work each warp has between loads, which the next figure lets you test.")
    edit_item("o059", from_y=212, paras=[
        "An ordinary processor has one set of registers, so switching threads means copying one thread's "
        "values out and another's in. That is real work and real cycles.",
        "Here, every resident warp already owns its own slice of the register file, for as long as it is "
        "resident. There is nothing to save because nothing is shared; the scheduler simply points at a "
        "different warp next cycle.",
        "The cost is that the register file must hold every resident thread's slice at once, which is why "
        "it is so large: 256 kilobytes per multiprocessor, as large as the SRAM beside it.",
    ])


if __name__ == "__main__":
    p17()
    p18()
    fixes()
