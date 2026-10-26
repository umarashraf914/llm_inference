"""FP8 arithmetic for V3's Part 11: every value E4M3 and E5M2 can hold, rounding to them, and the small
simulation behind the rotation figure (p25). Checked against the FP8 formats paper (arXiv 2209.05433, Table 1):
E4M3 bias 7, largest 448 = 1.75 x 2^8, smallest subnormal 2^-9, no infinities, NaN is S.1111.111;
E5M2 bias 15, largest 57,344 = 1.75 x 2^15, smallest subnormal 2^-16.
"""
import math
import numpy as np


def decode(byte, ebits, mbits, bias, ieee_specials):
    s = -1.0 if byte >> (ebits + mbits) else 1.0
    e = (byte >> mbits) & ((1 << ebits) - 1)
    m = byte & ((1 << mbits) - 1)
    top = (1 << ebits) - 1
    if ieee_specials and e == top:
        return math.inf * s if m == 0 else math.nan
    if not ieee_specials and e == top and m == (1 << mbits) - 1:
        return math.nan
    if e == 0:
        return s * m / (1 << mbits) * 2.0 ** (1 - bias)
    return s * (1 + m / (1 << mbits)) * 2.0 ** (e - bias)


E4M3 = [decode(b, 4, 3, 7, False) for b in range(256)]
E5M2 = [decode(b, 5, 2, 15, True) for b in range(256)]
E4M3_POS = sorted({v for v in E4M3 if v == v and v > 0})
E5M2_POS = sorted({v for v in E5M2 if v == v and 0 < v < math.inf})
assert len(E4M3_POS) == 126 and 2 * len(E4M3_POS) + 1 == 253 and max(E4M3_POS) == 448
assert len(E5M2_POS) == 123 and 2 * len(E5M2_POS) + 1 == 247 and max(E5M2_POS) == 57344
assert min(E4M3_POS) == 2 ** -9 and min(E5M2_POS) == 2 ** -16
E4M3_GRID = np.array([-v for v in reversed(E4M3_POS)] + [0.0] + E4M3_POS)


def e4m3(x):
    """Round to the nearest E4M3 value (ties to even), saturating at 448, as FP8 conversions do."""
    x = np.asarray(x, dtype=np.float64)
    a = np.minimum(np.abs(x), 448.0)
    out = np.zeros_like(a)
    sub = a < 2.0 ** -6
    out[sub] = np.round(a[sub] / 2.0 ** -9) * 2.0 ** -9
    nz = ~sub
    e = np.floor(np.log2(a[nz]))
    step = 2.0 ** (e - 3)
    out[nz] = np.round(a[nz] / step) * step
    return np.sign(x) * np.minimum(out, 448.0)


# brute-force check of the rounding against the value list
_rng = np.random.default_rng(1)
_xs = np.concatenate([_rng.uniform(-460, 460, 4000), _rng.uniform(-0.05, 0.05, 4000)])
_near = E4M3_GRID[np.abs(E4M3_GRID[None, :] - np.clip(_xs, -448, 448)[:, None]).argmin(axis=1)]
assert np.all(np.abs(e4m3(_xs) - np.clip(_xs, -448, 448)) <= np.abs(_near - np.clip(_xs, -448, 448)) + 1e-12)


def quantise(t, per="tensor"):
    """Scale so the largest magnitude lands on 448, round to E4M3, scale back."""
    s = np.abs(t).max() / 448.0
    return e4m3(t / s) * s


def hadamard(d):
    H = np.array([[1.0]])
    while H.shape[0] < d:
        H = np.block([[H, H], [H, -H]])
    return H / math.sqrt(d)


def score_error(Q, K, M=None):
    """Relative RMS error of the scores Q K^T when Q and K are stored in E4M3 with one scale each,
    optionally after both are multiplied by the orthogonal matrix M."""
    S = Q @ K.T
    if M is not None:
        Q, K = Q @ M, K @ M
    S8 = quantise(Q) @ quantise(K).T
    return float(np.sqrt(np.mean((S8 - S) ** 2)) / np.sqrt(np.mean(S ** 2)))


def outlier_case(seed=0, n=512, d=128, channels=(7, 77), size=20.0):
    """Q and K whose entries are N(0, 1), except two channels that run `size` times larger in both."""
    rng = np.random.default_rng(seed)
    Q, K = rng.standard_normal((n, d)), rng.standard_normal((n, d))
    for c in channels:
        Q[:, c] *= size
        K[:, c] *= size
    return Q, K


def rotation(d=128, seed=0):
    rng = np.random.default_rng(seed + 100)
    D = np.diag(rng.choice([-1.0, 1.0], d))
    return D @ hadamard(d)                 # random signs, then a Hadamard: orthogonal (FA3 section 3.3)
