"""Number formats for the V4 atlas, computed from first principles (no ml_dtypes, no torch).

A format is (E, M, kind): E exponent bits, M mantissa bits, and how it spends its top exponent code.
  kind "ieee": all-ones exponent is infinity and NaN (FP32, FP16, BF16, E5M2)
  kind "e4m3": all-ones exponent holds numbers too; only S.1111.111 is NaN, no infinity (OCP FP8 E4M3)
  kind "fn":   every code is a finite number, no infinity, no NaN (OCP FP6 E2M3 / E3M2, FP4 E2M1)
Bias is 2^(E-1) - 1. Exponent code 0 means a subnormal: 2^(1-bias) x 0.mantissa.
"""
from fractions import Fraction as Fr
from functools import lru_cache

FORMATS = {
    "FP32": (8, 23, "ieee"), "BF16": (8, 7, "ieee"), "FP16": (5, 10, "ieee"),
    "E5M2": (5, 2, "ieee"), "E4M3": (4, 3, "e4m3"),
    "E3M2": (3, 2, "fn"), "E2M3": (2, 3, "fn"), "E2M1": (2, 1, "fn"),
}


def bias(E):
    return 2 ** (E - 1) - 1


def decode(code, E, M, kind):
    """Value of a non-negative bit pattern (sign bit 0), as an exact Fraction; None for inf/NaN."""
    e, m = code >> M, code & ((1 << M) - 1)
    top = (1 << E) - 1
    if kind == "ieee" and e == top:
        return None
    if kind == "e4m3" and e == top and m == (1 << M) - 1:
        return None
    b = bias(E)
    if e == 0:
        return Fr(m, 1 << M) * Fr(2) ** (1 - b)
    return (1 + Fr(m, 1 << M)) * Fr(2) ** (e - b)


@lru_cache(maxsize=None)
def values(name):
    """All non-negative finite values, in code order (code k at index k), as Fractions.
    Only for formats of 16 bits or fewer; FP32 has two billion codes."""
    E, M, kind = FORMATS[name]
    assert E + M <= 15, f"{name} is too wide to list"
    out = []
    for code in range(1 << (E + M)):
        v = decode(code, E, M, kind)
        if v is None:
            break
        out.append(v)
    return tuple(out)


def limits(name):
    """Largest value, smallest normal, smallest subnormal and the count of non-negative finite codes,
    from the field widths alone."""
    E, M, kind = FORMATS[name]
    b, top = bias(E), (1 << E) - 1
    if kind == "ieee":
        mx = (2 - Fr(1, 1 << M)) * Fr(2) ** (top - 1 - b)
        codes = top << M
    elif kind == "e4m3":
        mx = (2 - Fr(2, 1 << M)) * Fr(2) ** (top - b)
        codes = (1 << (E + M)) - 1
    else:
        mx = (2 - Fr(1, 1 << M)) * Fr(2) ** (top - b)
        codes = 1 << (E + M)
    out = {"max": mx, "min_normal": Fr(2) ** (1 - b), "min_sub": Fr(2) ** (1 - b - M), "codes": codes}
    if E + M <= 15:
        v = values(name)
        assert (v[-1], v[1], len(v)) == (mx, out["min_sub"], codes)
    return out


def round_to(x, name, saturate=True):
    """Round a real number to the nearest value of the format, ties to the even code (IEEE default).
    Above the top value: saturate to it (OCP conversion with clamping) or return inf (IEEE)."""
    v = values(name)
    s = -1 if x < 0 else 1
    a = Fr(abs(x)) if not isinstance(x, Fr) else abs(x)
    if a >= v[-1]:
        if a == v[-1] or saturate:
            return s * v[-1]
        # IEEE: round to inf only past the midpoint to the next (virtual) value
        E, M, kind = FORMATS[name]
        nxt = v[-1] + (v[-1] - v[-2])
        return s * (v[-1] if a < (v[-1] + nxt) / 2 else Fr(10) ** 400)
    lo, hi = 0, len(v) - 1
    while hi - lo > 1:                      # v[lo] <= a < v[hi]
        mid = (lo + hi) // 2
        if v[mid] <= a:
            lo = mid
        else:
            hi = mid
    d_lo, d_hi = a - v[lo], v[hi] - a
    k = lo if d_lo < d_hi else hi if d_hi < d_lo else (lo if lo % 2 == 0 else hi)
    return s * v[k]


def int_range(bits, symmetric=True):
    """Signed integer codes: two's complement gives -2^(b-1)..2^(b-1)-1; symmetric quantization uses
    -(2^(b-1)-1)..2^(b-1)-1 and leaves the bottom code unused."""
    top = 2 ** (bits - 1) - 1
    return (-top if symmetric else -top - 1, top)


def rhe(x):
    """Round half to even, on floats or Fractions (Python's round does this for floats)."""
    return round(x)


def quant_sym(xs, bits):
    """Symmetric absmax quantization: s = max|x| / (2^(b-1)-1), q = round(x/s), x_hat = s q."""
    lo, hi = int_range(bits)
    s = max(abs(x) for x in xs) / hi
    q = [min(hi, max(lo, rhe(x / s))) for x in xs]
    return s, q, [s * k for k in q]


def quant_asym(xs, bits, lo_x=None, hi_x=None):
    """Asymmetric (zero-point) quantization onto 0..2^b-1: s = (max-min)/(2^b-1), z = round(-min/s),
    q = clamp(round(x/s) + z), x_hat = s (q - z)."""
    lo_x = min(xs) if lo_x is None else lo_x
    hi_x = max(xs) if hi_x is None else hi_x
    top = 2 ** bits - 1
    s = (hi_x - lo_x) / top
    z = rhe(-lo_x / s)
    q = [min(top, max(0, rhe(x / s) + z)) for x in xs]
    return s, z, q, [s * (k - z) for k in q]
