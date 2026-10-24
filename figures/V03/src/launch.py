"""V3 Part 16, launches: a new part heading (s17); §5a item 24; §5c voice (o095); §5d 95+96+97 -> 2 plus the
widget; review #42 and #43. o096 becomes the widget, keeping its id (V5 links to it for the launch cost).

  s17   Part 16: Launches; s15 relabelled Part 17
  p42   one token takes hundreds of launches (44:18)
  o095  what the CPU is doing while the GPU waits (44:54; redrawn, id kept, V9 links to it)
  o096  WIDGET: the GPU starves only when its kernels are shorter than their launches (45:03; id kept)
  o097  record once, replay every step: CUDA graphs (45:25; redrawn, absorbs o096's replay half)

The counts of kernels per layer and the microseconds per launch are illustrative, as the lecture's are ("a
handful", "a few microseconds"); the idle-share rule is exact for the two-lane model drawn.

  python3 figures/V03/src/launch.py
"""
import json
from common import *  # noqa: F401,F403
from common import section as sec

KERNELS = ["normalise", "make Q, K, V", "rotate Q, K", "attention", "combine heads",
           "add", "normalise", "feed-forward 1", "feed-forward 2", "add"]
LAYERS = 32
N_DRAWN = 8                      # kernels drawn in the widget
K0, L0 = 4.0, 5.0                # the widget's starting kernel time and launch cost, microseconds
KS = [1 + 0.5 * i for i in range(23)]       # 1 .. 12
LS = [2 + 0.5 * i for i in range(13)]       # 2 .. 8
WX0, WSC = 120, 5.0              # widget time axis: x = WX0 + t * WSC, t in microseconds


def sections():
    sec("s17", f"Part {PART['launch']}", "Launches",
        "Hundreds of kernels for every token, and the cost of handing each one to the GPU.")
    sec("s15", f"Part {PART['fixed']}", "What stayed fixed", "The one thing none of this touched.")


# ---- p42: hundreds of launches ------------------------------------------------------------------------------------------
def p42():
    per = len(KERNELS)
    total = per * LAYERS
    lo, hi = total * 3e-3, total * 5e-3                      # ms, at 3 and 5 microseconds a launch
    assert per == 10 and total == 320 and (round(lo, 2), round(hi, 1)) == (0.96, 1.6)
    b = [hd(40, 46, "One layer's kernels, in order (a typical list; models differ)")]
    for k, name in enumerate(KERNELS):
        i, j = divmod(k, 5)
        b.append(cell(40 + j * 120, 62 + i * 40, 114, 30,
                      "s" if name in ("make Q, K, V", "attention", "combine heads", "feed-forward 1", "feed-forward 2")
                      else "u", label=name))
    b.append(txt(40, 154, "teal: attention and the big matrix multiplies;  grey: the small steps between", "sub2"))
    y2 = 62 + 2 * 40 + 44
    b.append(hd(40, y2, f"× {LAYERS} layers: one generated token"))
    for k in range(LAYERS):
        b.append(cell(40 + k * 18.75, y2 + 14, 16.5, 26, "u", rx=2))
    b.append(txt(40, y2 + 60, f"{LAYERS} layers × {per} kernels = {total} launches", "sub2"))
    b.append(txt(640, y2 + 60, f"at 3 to 5 µs each: about {f(lo, 1)} to {f(hi, 1)} ms of CPU time", "sub2", "end"))
    body, yb = prose(y2 + 100, [
        "Producing a single token at batch size one runs a long chain of small kernels. Each layer launches a "
        "handful: one makes the queries, keys and values, one applies the position rotation, one runs "
        "attention, one combines the heads' outputs, two do the feed-forward network's big multiplies, and a "
        "few more do the small add-and-normalise steps between them. About ten per layer.",
        f"Across a {LAYERS}-layer model that is some {total} kernel launches for every generated token, and "
        f"each costs the CPU a few microseconds of bookkeeping: at 3 to 5 µs each, {f(lo, 1)} to {f(hi, 1)} ms "
        "of work per token before the GPU has computed anything.",
    ])
    figure("p42", st("Producing a single token at batch size"), "One token takes hundreds of launches", yb + 30,
           b + [body],
           esc("Counts and times are illustrative: real models fuse some of these steps and split others. Hundreds "
               "per token is the order of magnitude that matters."))


# ---- o095: one launch, from the CPU's side (redrawn) ------------------------------------------------------------------------
def o095():
    b = [hd(40, 46, "One launch, from the CPU's side (durations schematic)")]
    b.append(txt(40, 84, "CPU", "cap"))
    steps = [("validate the arguments", 150), ("queue the work", 120), ("talk to the driver", 140)]
    x = 110
    for lab, w in steps:
        b.append(cell(x, 66, w - 4, 28, "h", label=lab))
        x += w
    b.append(txt(40, 128, "GPU", "cap"))
    b.append(ghost(110, 110, x - 110 - 4, 28, label="waiting"))
    b.append(cell(x, 110, 120, 28, "s", label="kernel runs"))
    b.append(txt(110, 166, "a few microseconds of CPU work, then a few microseconds of GPU work, per kernel", "sub2"))
    body, yb = prose(206, [
        "Each launch costs the CPU a few microseconds of bookkeeping: validating the arguments, queuing the "
        "work, talking to the driver. A few microseconds would not normally matter. But at batch size one the "
        "kernels themselves often run for only a few microseconds too, so the GPU finishes each piece of work "
        "and then idles, waiting for the CPU to hand it the next.",
        "Nothing is wrong with the GPU. The machine is limited by how fast work can be handed to it, which "
        "makes the CPU, for once, the part that sets the pace.",
    ])
    figure("o095", st("Each launch costs the CPU"), "What the CPU is doing while the GPU waits", yb + 30, b + [body],
           esc("At small batch the slowest part of producing a token can be the processor that does no "
               "arithmetic on it at all."))


# ---- o096: the widget ---------------------------------------------------------------------------------------------------------------
def lanes(K, L, n=N_DRAWN):
    """CPU launch i occupies [i L, (i+1) L]; kernel i starts when its launch is done and kernel i-1 has ended."""
    cpu = [(i * L, (i + 1) * L) for i in range(n)]
    gpu, end = [], 0.0
    for i in range(n):
        s = max((i + 1) * L, end)
        end = s + K
        gpu.append((s, end))
    return cpu, gpu


def idle_share(K, L):
    return max(0.0, L - K) / L


def readout(K, L):
    sh = idle_share(K, L)
    if sh == 0:
        return f"0%: kernels outlast launches, a queue builds, the GPU never waits"
    return f"{fn(100 * sh, 0)}%: the GPU waits {fn(L - K, 1)} µs in every {fn(L, 1)}"


O096_JS = r"""<script>(() => {
  const fig = document.currentScript.closest('figure');
  const N = __N__, X0 = __X0__, SC = __SC__, K0 = __K0__, L0 = __L0__;
  const q = s => fig.querySelector(s), sl = [...fig.querySelectorAll('input[type=range]')];
  const fx = (v, d) => v.toFixed(d);
  function draw() {
    const K = +sl[0].value, L = +sl[1].value;
    let end = 0;
    for (let i = 0; i < N; i++) {
      const c = q(`[data-cpu="${i}"]`), g = q(`[data-gpu="${i}"]`);
      c.setAttribute('x', fx(X0 + i * L * SC, 1)); c.setAttribute('width', fx(L * SC - 2, 1));
      const s = Math.max((i + 1) * L, end); end = s + K;
      g.setAttribute('x', fx(X0 + s * SC, 1)); g.setAttribute('width', fx(K * SC - 2, 1));
    }
    const sh = Math.max(0, L - K) / L;
    q('[data-k]').textContent = fx(K, 1); q('[data-l]').textContent = fx(L, 1);
    q('[data-end]').textContent = fx(end, 1);
    q('[data-idle]').textContent = sh === 0 ? '0%: kernels outlast launches, a queue builds, the GPU never waits'
      : `${fx(100 * sh, 0)}%: the GPU waits ${fx(L - K, 1)} µs in every ${fx(L, 1)}`;
  }
  sl.forEach(s => s.addEventListener('input', draw));
  q('button').addEventListener('click', () => { sl[0].value = K0; sl[1].value = L0; draw(); });
  draw();
})();</script>"""


def o096():
    cpu, gpu = lanes(K0, L0)
    assert idle_share(4, 5) == 0.2 and idle_share(3.5, 5) == 0.3 and idle_share(6, 5) == 0
    assert gpu[-1][1] == 44 and lanes(12, 8)[1][-1][1] == 104 and WX0 + 104 * WSC <= 640
    s = [hd(40, 34, f"{N_DRAWN} kernels in a row, kernels of K µs, launches of L µs")]
    s.append(f'<text class="sub2" x="40" y="58">K = <tspan data-k="">{fn(K0, 1)}</tspan> µs,  '
             f'L = <tspan data-l="">{fn(L0, 1)}</tspan> µs</text>')
    s.append(txt(40, 90, "CPU", "cap"))
    s.append(txt(40, 130, "GPU", "cap"))
    for i, ((a, z), (ga, gz)) in enumerate(zip(cpu, gpu)):
        s.append(f'<g class="h"><rect x="{WX0 + a * WSC:.1f}" y="72" width="{(z - a) * WSC - 2:.1f}" height="26" '
                 f'rx="2" data-cpu="{i}"/></g>')
        s.append(f'<g class="s"><rect x="{WX0 + ga * WSC:.1f}" y="112" width="{(gz - ga) * WSC - 2:.1f}" height="26" '
                 f'rx="2" data-gpu="{i}"/></g>')
    for t in range(0, 101, 20):
        s.append(tline(WX0 + t * WSC, 146, WX0 + t * WSC, 150))
        s.append(txt(WX0 + t * WSC, 164, f"{t} µs", "sub2", "middle"))
    s.append(f'<text class="sub2" x="40" y="194">all {N_DRAWN} done at <tspan data-end="">{fn(gpu[-1][1], 1)}</tspan> µs'
             f'</text>')
    s.append(f'<text class="cap" x="40" y="216">GPU idle in the steady state: <tspan data-idle="">{readout(K0, L0)}'
             f'</tspan></text>')
    body, yb = prose(258, [
        "The CPU issues launches one after another, each taking L microseconds, and a kernel can start once "
        "its launch is done and the kernel before it has finished. When kernels run longer than launches, the "
        "CPU gets ahead, a queue builds, and the GPU never waits. When they are shorter, the GPU finishes each "
        "one and waits for the next launch: it idles for L − K of every L microseconds.",
        "At batch size one, kernels of a few microseconds against launches of a few microseconds give idle "
        "shares like these, and at small batch that dispatch overhead can reach 20 to 30% of the whole step. "
        "The arithmetic here was checked against Python.",
    ])
    title = "The GPU starves only when its kernels are shorter than their launches"
    ctl = ("<label>kernel time K <input type='range' min='1' max='12' step='0.5' value='4'></label>"
           "<label>launch cost L <input type='range' min='2' max='8' step='0.5' value='5'></label>"
           "<button type='button'>Reset</button>")
    js = (O096_JS.replace("__N__", str(N_DRAWN)).replace("__X0__", str(WX0)).replace("__SC__", repr(WSC))
          .replace("__K0__", repr(K0)).replace("__L0__", repr(L0)))
    guard_split_word("o096", "".join(s) + body)
    html_ = (f"<figure class='widget'><div class='ts'>Fig ?? &nbsp;&middot;&nbsp; {st('A few microseconds would not')}"
             f"</div><h3>{esc(title)}</h3><div class='wg'><div class='ctl'>{ctl}</div>"
             f"<svg viewBox='0 0 680 {int(yb + 26)}' role='img'><title>{esc(title)}</title>{''.join(s)}{body}</svg>"
             "</div><figcaption>" + esc("Two lanes, one rule: the GPU idles max(0, L − K) ÷ L of the time. Small "
                                        "batches shrink K, and that is what exposes the launch cost.")
             + f"</figcaption>{js}</figure>")
    (ITEMS / "o096.html").write_text(html_, encoding="utf-8")
    print("o096", title)


# ---- o097: CUDA graphs (redrawn) ----------------------------------------------------------------------------------------------
def o097():
    b = [hd(40, 46, "The same five kernels, launched one by one and replayed as a graph (schematic)")]
    L, K, n = 5, 2, 5
    X0, SC = 210, 8.0
    b.append(txt(40, 84, "every launch", "cap"))
    b.append(txt(40, 100, "paid each time", "sub2"))
    cpu, gpu = lanes(K, L, n)
    for (a, z), (ga, gz) in zip(cpu, gpu):
        b.append(cell(X0 + a * SC, 66, (z - a) * SC - 2, 14, "h", rx=2))
        b.append(cell(X0 + ga * SC, 84, (gz - ga) * SC - 2, 14, "s", rx=2))
    b.append(txt(X0 + gpu[-1][1] * SC + 8, 96, f"done at {gpu[-1][1]:g} µs", "sub2"))
    b.append(txt(40, 144, "one replay", "cap"))
    b.append(txt(40, 160, "the graph, launched once", "sub2"))
    b.append(cell(X0, 126, L * SC - 2, 14, "h", rx=2))
    t = L
    for i in range(n):
        b.append(cell(X0 + t * SC, 144, K * SC - 2, 14, "s", rx=2))
        t += K
    b.append(txt(X0 + t * SC + 8, 156, f"done at {t:g} µs", "sub2"))
    assert gpu[-1][1] == 27 and t == 15
    b.append(cell(40, 190, 12, 12, "h"))
    b.append(txt(58, 200, "CPU launching", "sub2"))
    b.append(cell(170, 190, 12, 12, "s"))
    b.append(txt(188, 200, "GPU computing", "sub2"))
    body, yb = prose(244, [
        "CUDA graphs pay that overhead once instead of per kernel. During a warm-up step the runtime records "
        "the entire launch sequence into a graph object. From then on a single call replays the whole graph, "
        "and hundreds of kernels are dispatched for the price of one launch.",
        "The one constraint is that a replayed graph must touch the same memory addresses every time. That is "
        "awkward for a paged cache whose blocks are allocated as requests grow, so serving systems lay out "
        "fixed buffers to keep their decode graphs replayable.",
        "Prefill runs a few large kernels and gains little. Decode at small batch gains the most, which is "
        "why the major serving systems all replay their decode steps this way.",
    ])
    figure("o097", st("CUDA graphs amortize"), "What recording and replaying means", yb + 30, b + [body],
           esc("A fix for overhead rather than for computation: the kernels, and every operation in them, are "
               "exactly the same."))


if __name__ == "__main__":
    for job in (sections, p42, o095, o096, o097):
        job()
