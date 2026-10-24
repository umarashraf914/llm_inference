"""V2 Part 15, other bets and the close: review proposal 36 (the systolic array, beat by beat, as a
widget) and 37 (the three questions answered), the dropped Google Cloud caveat restored to Fig 98, and the
voice of Figs 99 and 100 fixed.

  python3 figures/V02/src/bets.py     writes p36 p37; edits o098 o099 o100

The array follows Google's description of the TPU (TPU, in common.py): "the TPU loads the parameters
from HBM into the Matrix Multiplication Unit (MXU). Then, the TPU loads data from HBM. As each
multiplication is executed, the result is passed to the next multiply-accumulator." So the weights sit
still, the data moves right, and the running sums move down.
"""
import json
from common import *  # noqa: F401,F403

N = 3
A = [[2, 1, 3], [1, 4, 2], [3, 2, 1]]
B = [[1, 2, 1], [3, 1, 2], [2, 1, 3]]
C = [[sum(A[i][k] * B[k][j] for k in range(N)) for j in range(N)] for i in range(N)]
T = 3 * N - 2                      # beats until the last output leaves the array
SLOTS = 2 * N - 1                  # queue places to the left of each row
assert C == [[11, 8, 13], [17, 8, 15], [11, 9, 10]] and T == 7
assert 128 * 128 == 16_384


def state(s):
    """What the array shows after s beats (0..T). Cell (k, j) holds weight B[k][j]; in beat t it serves
    output row i = t - j - k: it takes the sum of A[i][0..k-1] x B[..][j] from above, adds A[i][k] x B[k][j]
    and passes the result down. A[i][k] enters row k at beat i + k."""
    cells, queue, out = {}, {}, {}
    for k in range(N):
        for j in range(N):
            i = s - 1 - j - k
            if s > 0 and 0 <= i < N:
                sin = sum(A[i][kk] * B[kk][j] for kk in range(k))
                cells[k, j] = ("m", f"{sin} + {A[i][k]}×{B[k][j]} = {sin + A[i][k] * B[k][j]}")
            else:
                cells[k, j] = ("u", "idle")
    for k in range(N):
        for m in range(SLOTS):
            i = m + s - k
            queue[k, m] = str(A[i][k]) if 0 <= i < N else None
    for i in range(N):
        for j in range(N):
            out[i, j] = str(C[i][j]) if i + j + 2 <= s - 1 else None
    macs = sum(1 for i in range(N) for j in range(N) for k in range(N) if i + j + k <= s - 1)
    read = f"{s} of {T} beats done: {macs} of {N ** 3} multiply-adds"
    return cells, queue, out, macs, read


# the claims the prose makes, from the simulation itself
assert state(T)[3] == 27 and all(v is not None for v in state(T)[2].values())
assert state(T - 1)[2][2, 2] is None and state(T)[2][2, 2] == str(C[2][2])
assert [state(s)[3] for s in range(T + 1)] == [0, 1, 4, 10, 17, 23, 26, 27]
for k in range(N):                                     # each number of A meets every weight in its row
    for i in range(N):
        assert sum(1 for s in range(1, T + 1) for j in range(N) if s - 1 - j - k == i) == N
assert all(state(i + j + 3)[2][i, j] == str(C[i][j]) for i in range(N) for j in range(N))

GX, GY, CW, CH, PX, PY = 260, 96, 108, 58, 120, 70
QW, QP = 30, 36


def p36_svg(s=0):
    cells, queue, out, macs, read = state(s)
    b = [hd(40, 36, "Weights held in the cells; A's numbers move right, running sums move down")]
    b.append(txt(76, GY - 14, "rows of A, fed in on a slant", "sub2"))
    b.append(txt(GX, GY - 14, "B's weights, one to a cell", "sub2"))
    for k in range(N):
        yc = GY + k * PY
        for m in range(SLOTS):
            x = GX - 10 - m * QP - QW
            v = queue[k, m]
            hide = "" if v is not None else ' style="display:none"'
            b.append(f'<g class="s" data-q="{k}-{m}"{hide}><rect x="{x}" y="{yc + (CH - 26) / 2:g}" width="{QW}" '
                     f'height="26" rx="3"/><text class="sub" x="{x + QW / 2:g}" y="{yc + CH / 2:g}" '
                     f'text-anchor="middle" dominant-baseline="central">{v or ""}</text></g>')
        for j in range(N):
            x = GX + j * PX
            c, calc = cells[k, j]
            b.append(f'<g class="{c}" data-cell="{k}-{j}"><rect x="{x}" y="{yc}" width="{CW}" height="{CH}" rx="6"/>'
                     f'<text class="lbl" x="{x + CW / 2:g}" y="{yc + 20}" text-anchor="middle" '
                     f'dominant-baseline="central">weight {B[k][j]}</text>'
                     f'<text class="sub" x="{x + CW / 2:g}" y="{yc + 40}" text-anchor="middle" '
                     f'dominant-baseline="central" data-calc="{k}-{j}">{esc(calc)}</text></g>')
    yo = GY + N * PY + 14
    b.append(txt(40, yo + 17, "the answer, C", "cap"))
    b.append(txt(40, yo + 34, "each column's, in order", "sub2"))
    for j in range(N):
        for i in range(N):
            x = GX + j * PX + 4 + i * 35
            v = out[i, j]
            b.append(f'<g class="{"s" if v else "u"}" data-out="{i}-{j}"><rect x="{x}" y="{yo}" width="32" '
                     f'height="24" rx="3"/><text class="sub" x="{x + 16}" y="{yo + 12}" text-anchor="middle" '
                     f'dominant-baseline="central">{v or ""}</text></g>')
    b.append(f'<text class="sub2" x="{GX}" y="{yo + 48}" data-read="">{esc(read)}</text>')
    body, yb = prose(yo + 48 + 44, [
        "Each cell holds one weight of B and does one multiply-add a beat: the running sum arriving from "
        "above, plus the number of A arriving from the left times its weight. It passes the sum down and "
        "the number right, and out of the bottom of each column falls a finished entry of C.",
        "Each row of A goes in on a slant, one number a beat into each row of cells, so that every number "
        f"meets its partial sum at the right cell on the right beat. Step through: the {N ** 3} multiply-adds take 3 × 3 − 2 = {T} beats, and "
        "every number of A is used by three cells, every weight by three rows, without a trip back to "
        "memory.",
        "Google describes its TPU this way: weights loaded into the array, data streamed through, each "
        "result passed to the next cell. Before TPU v6e its arrays are 128 × 128, 16,384 multiply-adds every "
        "beat, in bfloat16 with FP32 sums. The page's arithmetic was checked against Python at every beat.",
    ])
    return b, body, yb


P36_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const A = __A__, B = __B__, C = __C__, N = A.length, T = 3 * N - 2, SL = 2 * N - 1;
  const q = s => fig.querySelector(s), [back, step, reset] = fig.querySelectorAll('button');
  let s = 0;
  function draw() {
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) {
      const i = s - 1 - j - k, g = q(`[data-cell="${k}-${j}"]`), t = q(`[data-calc="${k}-${j}"]`);
      if (s > 0 && i >= 0 && i < N) {
        let sin = 0; for (let kk = 0; kk < k; kk++) sin += A[i][kk] * B[kk][j];
        t.textContent = `${sin} + ${A[i][k]}×${B[k][j]} = ${sin + A[i][k] * B[k][j]}`; g.setAttribute('class', 'm');
      } else { t.textContent = 'idle'; g.setAttribute('class', 'u'); }
    }
    for (let k = 0; k < N; k++) for (let m = 0; m < SL; m++) {
      const g = q(`[data-q="${k}-${m}"]`), i = m + s - k;
      if (i >= 0 && i < N) { g.style.display = ''; g.querySelector('text').textContent = A[i][k]; }
      else g.style.display = 'none';
    }
    let macs = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      for (let k = 0; k < N; k++) if (i + j + k <= s - 1) macs++;
      const g = q(`[data-out="${i}-${j}"]`), done = i + j + 2 <= s - 1;
      g.setAttribute('class', done ? 's' : 'u'); g.querySelector('text').textContent = done ? C[i][j] : '';
    }
    q('[data-read]').textContent = `${s} of ${T} beats done: ${macs} of ${N ** 3} multiply-adds`;
    back.disabled = s === 0; step.disabled = s === T;
  }
  back.addEventListener('click', () => { if (s > 0) { s--; draw(); } });
  step.addEventListener('click', () => { if (s < T) { s++; draw(); } });
  reset.addEventListener('click', () => { s = 0; draw(); });
  draw();
})();</script>"""


def p36():
    b, body, yb = p36_svg(0)
    title = "A systolic array, beat by beat"
    ctl = ("<button type='button'>Back a beat</button><button type='button'>Next beat</button>"
           "<button type='button'>Reset</button>")
    js = (P36_JS.replace("__A__", json.dumps(A)).replace("__B__", json.dumps(B)).replace("__C__", json.dumps(C)))
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; "
             f"{stamp(SRT, 'A fixed grid of multiply accumulate')}</div>"
             f"<h3>{title}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
             f"<svg viewBox='0 0 680 {yb + 24}' role='img'><title>{title}</title>{''.join(b)}{body}</svg></div>"
             "<figcaption>A 3 × 3 array computing C = A × B with B's weights held in place, so nothing goes back "
             "to a register file between multiply-adds. It is the reuse of a tile ({{ref:v02-p25}}) built into "
             "the wiring. TPU details from Google Cloud's TPU architecture page.</figcaption>"
             f"{js}</figure>")
    (OUT / "p36.html").write_text(html_, encoding="utf-8")
    print("p36   ", title)


# ---- p37: the three questions, answered -------------------------------------------------------------------
def p37():
    assert SMS * FP32_PER_SM == 16_896 and SMS * TC_PER_SM == 528 and MAX_WARPS_SM == 64
    assert round(PEAK_BF16 / HBM_BW) == 295
    cols = [(40, ("Why so different", "from a laptop CPU?", None), [
                ("one bet", "many identical operations"),
                ("lanes, not cleverness", "16,896 lanes, 528 tensor cores"),
                ("waiting is cheap", "64 warps to a multiprocessor")]),
            (245, ("Why is a byte", "so expensive", "next to an operation?"), [
                ("the cell", "a capacitor behind long wires"),
                ("the ladder", "fast memory is small"),
                ("the ridge", "295 operations a byte")]),
            (450, ("What can the", "hardware do", "to fight back?"), [
                ("hide and coalesce", "many warps, whole sectors"),
                ("reuse", "tensor cores working on tiles"),
                ("narrower and wider", "fewer bits, bigger domains")])]
    b = []
    for x, (t1, t2, t3), answers in cols:
        b.append(box(x, 50, 190, 88, "u", t1, t2, t3))
        for k, (a1, a2) in enumerate(answers):
            y = 166 + k * 66
            b.append(arr(x + 95, y - 24 if k == 0 else y - 14, x + 95, y - 2))
            b.append(box(x, y, 190, 52, "m" if x == 450 else ("h" if x == 245 else "s"), a1, a2))
    body, yb = prose(166 + 3 * 66 + 24, [
        "The first answer is one bet: the work is thousands of identical operations, so the silicon goes on "
        "arithmetic lanes rather than on making one thread fast (Parts 2 to 5).",
        "The second is physics and geometry: a DRAM cell is a capacitor read through long wires, memory that "
        "is fast cannot also be large, and so the H100 can do 295 operations in the time one byte arrives "
        "(Parts 6, 7, 10 and 11).",
        "The third is every technique since: enough warps in flight to hide the wait, whole sectors per "
        "fetch, each number reused across a tile, narrower numbers, and conversations kept inside the fast "
        "domain (Parts 8, 9 and 12 to 14). Which hardware gets used is then settled by software, and the code "
        "that makes it fast is the subject of the next atlas, on kernels.",
    ])
    emit("p37", stamp(SRT, "good place to end"), "The three questions, answered", yb + 24, b + [body],
         "The same three boxes as {{ref:v02-o011}}, now with their answers. Every number in them was worked "
         "out above.")


def fixes():
    edit_item("o098", from_y=330, paras=[
        "Well suited to dense matrix multiply and not much else, and for now rentable only on Google Cloud.",
    ])
    edit_item("o099", ts=stamp(SRT, "CUDA has had almost two decades"),
              caption="The layer that never appears on a specification sheet and frequently decides the "
                      "outcome.")
    edit_item("o100", from_y=190, paras=[
        f"On paper AMD beats the H100 where it matters here: {MI300X_GB} GB of HBM at 5.3 TB/s against 80 GB "
        "at 3.35, so a model needing two H100s fits on one.",
        "And yet most teams still reach for Nvidia. The deciding factor is software. CUDA has had almost two "
        "decades to accumulate the libraries, kernels and tooling that all of AI now sits on, and ROCm, "
        "AMD's equivalent, is still catching up.",
        "For most teams that maturity, not the hardware specification, is the real binding constraint.",
    ], caption="Bars to scale; memory figures from NVIDIA's H100 whitepaper and AMD's MI300X specifications. "
               "Every other figure here is about physics; this one is about software, and it often decides.")


if __name__ == "__main__":
    p36()
    p37()
    fixes()
