"""Shared helpers and verified constants for the V2 depth pass (plans/depth_pass/V02_review.md).

Every spec value below was read in the source named beside it. Derived numbers are computed, never
typed, and the build-up scripts assert the claims their prose makes.

Sources, as cited in the captions:
  WP104   NVIDIA H100 Tensor Core GPU Architecture whitepaper, V1.04 ("includes final GPU / memory
          clocks and final TFLOPS performance specs"), Tables 1 and 3, and the SM, TMA and NVLink
          sections
  A100WP  NVIDIA A100 Tensor Core GPU Architecture whitepaper (Tensor Core section)
  V100WP  NVIDIA Tesla V100 GPU Architecture whitepaper
  A100DS  NVIDIA A100 datasheet (80 GB SXM column)
  H200DS  NVIDIA H200 Tensor Core GPU datasheet
  HGX     nvidia.com HGX page (HGX B200 column; "Dense is ½ sparse spec shown")
  DGXB200 nvidia.com DGX B200 specifications (64 TB/s HBM3e across 8 GPUs)
  NVL72   nvidia.com GB200 NVL72 specifications
  BPG     NVIDIA CUDA C++ Best Practices Guide, §10.2.1 "Coalesced Access to Global Memory" and
          §11.1.1 "Calculating Occupancy"
  NCU     NVIDIA Nsight Compute Profiling Guide: "An L1 or L2 cache line is four sectors, i.e. 128
          bytes"
  PG      NVIDIA CUDA Programming Guide, compute capability tables (CC 9.0); CUDA 12.4 edition
          §4.1 SIMT, §4.2 Hardware Multithreading, §16.8 Compute Capability 9.0
  OCC     cuda_occupancy.h, NVIDIA CUDA 12.4 runtime: registers handed out 256 per warp from four
          sub-partitions, shared memory in 128-byte units plus the per-block reservation
  LUO     Luo et al. 2024, "Benchmarking and Dissecting the Nvidia Hopper GPU Architecture",
          Table IV (latency in clocks, measured on an H800 PCIe, max clock 1,755 MHz)
  HAN     Han et al. 2015, "Learning both Weights and Connections", Fig. 1 (Horowitz, 45 nm)
  JIA     Jia et al. 2018, "Dissecting the NVIDIA Volta GPU Architecture via Microbenchmarking", §2
  MEG     Shoeybi et al. 2019, Megatron-LM, §3 (two all-reduces per layer in the forward pass)
  TPU     Google Cloud TPU system architecture page (128 x 128 MXU, bf16 multiply, fp32 accumulate)
  MICRON  Micron 4Gb DDR4 SDRAM datasheet (64 ms, 8192-cycle refresh; 32 ms at 85-95 °C; tREFI)
  AMD     amd.com MI300X specifications
"""
import math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / ".claude/skills/srt-figure-atlas/scripts"))
from atlas import box, cont, cell, ghost, arr, ln, txt, hd, eq, prose, item, stamp, esc  # noqa: E402,F401

SRT = ROOT / "transcripts/V02_Inside_the_GPU.srt"
OUT = ROOT / "figures/V02/items"

# ---- H100 SXM5, from WP104 -----------------------------------------------------------------------
SMS = 132                    # SMs per GPU
FP32_PER_SM = 128            # FP32 CUDA cores per SM
TC_PER_SM = 4                # tensor cores per SM
CLK_TC = 1.830e9             # boost clock for FP8/FP16/BF16/TF32 tensor-core work
CLK_FP32 = 1.980e9           # boost clock for FP64 tensor, FP32 and FP64 non-tensor work
PEAK_BF16 = 989.4e12         # dense FP16/BF16 tensor FLOP/s
PEAK_BF16_SPARSE = 1978.9e12
PEAK_FP8 = 1978.9e12         # dense FP8
PEAK_FP32 = 66.9e12          # non-tensor FP32
HBM_STACKS = 5
HBM_BITS = 5120              # memory interface width, bits
HBM_DDR_MHZ = 2619           # memory data rate, MHz DDR (two transfers per clock)
HBM_BW = 3352e9              # bytes per second, as tabled
HBM_GB = 80
L2_MB = 50
RF_KB_PER_SM = 256           # register file per SM
RF_KB_GPU = 33792            # register file per GPU, as tabled
SMEM_MAX_KB = 228            # shared memory, configurable up to
TRANSISTORS = 80e9
DIE_MM2 = 814
NVLINK_LINKS = 18            # fourth-generation NVLink links per H100
NVLINK_LINK_DIR = 25e9       # bytes per second, each direction, per link
NVLINK_PAIRS_DIR = 2         # differential pairs per direction per link
NVLINK_TOTAL = 900e9         # "900 GB/sec total bandwidth"
IB_GBIT = 400                # ConnectX-7 adapters in a DGX H100, "each running at 400 Gb/sec"

# ---- CUDA, compute capability 9.0 (PG, OCC, BPG) -----------------------------------------------
WARP = 32
REGS_PER_SM = 65536
MAX_REGS_THREAD = 255
MAX_THREADS_SM = 2048
MAX_WARPS_SM = 64
MAX_BLOCKS_SM = 32
MAX_THREADS_BLOCK = 1024
SUBPARTS = 4                 # OCC: registers are allocated in each of 4 sub-partitions
REG_UNIT = 256               # OCC/BPG: per-warp register allocation rounded up to 256
SMEM_UNIT = 128              # OCC: shared memory allocation granularity, bytes (CC 9.x)
SMEM_RESERVED = 1024         # PG 12.4: 1 KB per block reserved for system use
SECTOR, LINE = 32, 128       # BPG, NCU

# ---- other chips ---------------------------------------------------------------------------------
A100 = dict(sms=108, fp32_sm=64, clk=1.410e9, bf16=312e12, int8=624e12, bw=2039e9, nvlink=600e9)
V100 = dict(fp16=125e12, bw=900e9, bits=4096)
H200 = dict(bw=4.8e12, gb=141)
B200 = dict(bf16=36e15 / 2 / 8, fp4=72e15 / 8, bw=64e12 / 8, nvlink=1.8e12)
MI300X_GB = 192

# ---- measured latencies in clocks (LUO Table IV, H800) ------------------------------------------
LAT = dict(shared=29.0, l1=40.7, l2=263.0, hbm=478.8)
H800_CLK = 1.755e9

# ---- energy at 45 nm, picojoules (HAN Fig. 1, after Horowitz) ------------------------------------
PJ = dict(fadd=0.9, fmul=3.7, sram=5.0, dram=640.0)


def f(v, d=2):
    """A number as printed, with a real minus sign. Exact halves round away from zero, as
    JavaScript's toFixed does, so a widget and the static figures print the same digits."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)   # exact binary value
    return ("−" if v < 0 and q != 0 else "") + f"{q:,.{d}f}"


def n(v):
    """An integer with thousands separators."""
    return f"{int(round(v)):,}"


def tw(s, cls="sub2"):
    """Approximate rendered width in px (design.md's per-character figures)."""
    return len(s) * {"lbl": 7, "hd": 7, "cap": 6.5, "sub": 6, "sub2": 6}[cls]


def logx(v, v0, v1, x0, x1):
    """Position of v on a log axis that runs v0..v1 across x0..x1."""
    return x0 + (math.log10(v) - math.log10(v0)) / (math.log10(v1) - math.log10(v0)) * (x1 - x0)


def emit(name, ts, title, h, body, caption, cls=None):
    (OUT / f"{name}.html").write_text(item(ts, title, h, body, caption, cls), encoding="utf-8")
    print(f"{name:6s} {ts:>6}  {title}")


def tx(x, y, s, cls="sub2", anchor="start", extra=""):
    """Free text with optional extra attributes (data-*, halo)."""
    return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}"{extra}>{esc(s)}</text>'


def rect(x, y, w, h, cls, rx=3, extra=""):
    return f'<g class="{cls}"><rect x="{x:.1f}" y="{y:.1f}" width="{max(w, 0):.1f}" height="{h:.1f}" rx="{rx}"{extra}/></g>'


def vline(x, y1, y2, cls="tick"):
    return ln(round(x, 1), y1, round(x, 1), y2, cls)


# ---- editing existing items ----------------------------------------------------------------------
import re as _re


def edit_item(name, from_y=None, paras=None, caption=None, title=None, ts=None, extra_h=24,
              replace=(), cls=None):
    """Rewrite parts of an existing item in place.

    from_y   body prose starts at this baseline: every `cap` text at x=40 with y >= from_y is removed
             and `paras` is laid out from there; the canvas ends `extra_h` below the last line.
    replace  (old, new) pairs applied to the raw item first; each old must occur exactly once."""
    p = OUT / f"{name}.html"
    s = p.read_text(encoding="utf-8")
    for old, new in replace:
        if old not in s and new in s:            # already applied: rerunning a script is safe
            continue
        assert s.count(old) == 1, (name, old, s.count(old))
        s = s.replace(old, new)
    if paras is not None:
        pat = _re.compile(r'<text class="cap" x="40" y="([\d.]+)" text-anchor="start">.*?</text>')
        hits = [m for m in pat.finditer(s) if float(m.group(1)) >= from_y]
        assert hits, (name, "no prose at or below", from_y)
        for m in reversed(hits):
            s = s[:m.start()] + s[m.end():]
        svg_body, yb = prose(from_y, paras)
        k = s.index("</svg>")
        s = s[:k] + svg_body + s[k:]
        s = _re.sub(r"viewBox=(['\"])0 0 680 [\d.]+\1", f"viewBox='0 0 680 {round(yb + extra_h)}'", s, count=1)
    if caption is not None:
        s = _re.sub(r"<figcaption>.*?</figcaption>", lambda m: f"<figcaption>{esc(caption)}</figcaption>", s,
                    count=1, flags=_re.S)
    if title is not None:
        s = _re.sub(r"<h3>.*?</h3>", lambda m: f"<h3>{esc(title)}</h3>", s, count=1, flags=_re.S)
        s = _re.sub(r"<title>.*?</title>", lambda m: f"<title>{esc(title)}</title>", s, count=1, flags=_re.S)
    if ts is not None:
        s = _re.sub(r"(<div class=['\"]ts['\"]>Fig [^ &<]+ &nbsp;&middot;&nbsp; )[0-9:]+", lambda m: m.group(1) + ts, s, count=1)
    if cls is not None:
        s = _re.sub(r"^<figure[^>]*>", f"<figure class='{cls}'>" if cls else "<figure>", s, count=1)
    p.write_text(s, encoding="utf-8")
    print(f"{name:6s} edited")


# ---- items taken out of order.txt on purpose -----------------------------------------------------
# Their files stay in items/ (atlas_build's drop keeps them); the content lives on in the item named.
# A resumer should not re-insert these.
DROPPED = {
    "o008": "merged into o007 (the bus drawing, wires times rate)",
    "o009": "merged into o005 (latency against bandwidth, recap of V1 Fig 76)",
    "o036": "replaced by p09 (one multiprocessor is four identical quarters)",
    "o041": "absorbed into p09 (128 lanes / 4 schedulers = 32; the A100's 16 lanes a quarter)",
    "o040": "absorbed into p12 (fetch and decode paid once per warp, not per operation)",
    "o047": "merged into o048 (one stream cannot serve two destinations; nesting 2, 4, 8)",
    "o015": "merged into o016 (the capacitor and its leak) and o017 (refresh)",
    "o050": "merged into o018 (no technology is fast and large; geometry)",
    "o058": "merged into o059 (registers stay put, so switching is free)",
    "o061": "replaced by p19 (32-byte sectors, four to a 128-byte line)",
    "o062": "replaced by p19 (the hardware cannot fetch a single value)",
    "o075": "merged into o074 (the roofline recap and the 295 decomposed)",
}


def fixed(v, d=1):
    """JavaScript's Number.prototype.toFixed: the exact binary value, halves rounded away from zero."""
    q = Decimal(abs(v)).quantize(Decimal(1).scaleb(-d), rounding=ROUND_HALF_UP)
    return ("-" if v < 0 and q != 0 else "") + f"{q:.{d}f}"
