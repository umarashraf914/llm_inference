#!/usr/bin/env python3
"""Drawing helpers for figure atlases. Import these; do not hand-write SVG."""


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def box(x, y, w, h, cls, title, sub=None, sub2=None, rx=8):
    """A labelled box. One, two or three centred lines."""
    cy = y + h / 2 if not sub else (y + h / 2 - 9 if not sub2 else y + h / 2 - 17)
    o = f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>'
    o += f'<text class="lbl" x="{x+w/2}" y="{cy}" text-anchor="middle" dominant-baseline="central">{esc(title)}</text>'
    if sub:
        yy = y + h / 2 + 9 if not sub2 else y + h / 2 + 1
        o += f'<text class="sub" x="{x+w/2}" y="{yy}" text-anchor="middle" dominant-baseline="central">{esc(sub)}</text>'
    if sub2:
        o += f'<text class="sub" x="{x+w/2}" y="{y+h/2+18}" text-anchor="middle" dominant-baseline="central">{esc(sub2)}</text>'
    return o + "</g>"


def cont(x, y, w, h, cls, title, sub=None, rx=14):
    """A container. Label sits top-left; leave >=20px below the last child."""
    o = f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>'
    o += f'<text class="lbl" x="{x+22}" y="{y+26}">{esc(title)}</text>'
    if sub:
        o += f'<text class="sub" x="{x+22}" y="{y+44}">{esc(sub)}</text>'
    return o + "</g>"


def cell(x, y, w, h, cls, rx=3, label=None):
    """A small filled rect with an optional centred label."""
    o = f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>'
    if label is not None:
        o += f'<text class="sub" x="{x+w/2}" y="{y+h/2}" text-anchor="middle" dominant-baseline="central">{esc(label)}</text>'
    return o + "</g>"


def ghost(x, y, w, h, rx=3, label=None):
    """A dashed outline: an empty slot, or an annotation boundary."""
    o = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="none" '
         f'stroke="var(--rule)" stroke-width="1" stroke-dasharray="3 3"/>')
    if label:
        o += f'<text class="sub2" x="{x+w/2}" y="{y+h/2}" text-anchor="middle" dominant-baseline="central">{esc(label)}</text>'
    return o


def arr(x1, y1, x2, y2):
    return f'<line class="conn" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" marker-end="url(#arw)"/>'


def ln(x1, y1, x2, y2, cls="conn"):
    return f'<line class="{cls}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'


def txt(x, y, s, cls="cap", anchor="start"):
    """Free text. y is the BASELINE. Inside a box use cell(label=) instead."""
    return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}">{esc(s)}</text>'


def hd(x, y, s):
    return f'<text class="hd" x="{x}" y="{y}">{esc(s)}</text>'


def eq(x, y, w, s, cls="u", h=42):
    """A formula in its own box."""
    return cell(x, y, w, h, cls, rx=6, label=s)


def brace(x1, x2, y, label):
    return (ln(x1, y, x2, y, "tick") + ln(x1, y, x1, y + 6, "tick") + ln(x2, y, x2, y + 6, "tick")
            + txt((x1 + x2) / 2, y + 22, label, "cap", "middle"))


CSS = """
:root{--paper:#FBFAF8;--ink:#17191C;--muted:#6B6F76;--rule:#DFDDD8;
--m:#9A6410;--m-fill:#FBEEDA;--m-text:#6B4408;--s:#1B7A6B;--s-fill:#DEF0EC;--s-text:#0F4A41;
--h:#B4472C;--h-fill:#F7E7E1;--h-text:#7A2E1B;--u:#9B9FA6;--u-fill:#F0EFEC;--u-text:#3A3D42;
--sans:ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;}
@media(prefers-color-scheme:dark){:root{--paper:#131416;--ink:#E8E6E1;--muted:#9AA0A7;--rule:#2C2E32;
--m:#E0A83C;--m-fill:#392B11;--m-text:#F2DAAA;--s:#4FBFA8;--s-fill:#12332E;--s-text:#A3E0D3;
--h:#E07A5F;--h-fill:#3A211A;--h-text:#F2C6B6;--u:#6E727A;--u-fill:#1E2023;--u-text:#C8CBD0;}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.65;
-webkit-font-smoothing:antialiased}
.wrap{max-width:860px;margin:0 auto;padding:64px 28px 96px}
header{border-bottom:1px solid var(--rule);padding-bottom:28px}
.kick{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;
color:var(--muted);margin-bottom:14px}
h1{font-size:31px;font-weight:500;margin:0 0 10px;letter-spacing:-.012em}
.meta{color:var(--muted);font-size:14.5px;margin:0;max-width:68ch}
.key{display:flex;gap:20px;flex-wrap:wrap;margin:26px 0 0;font-size:13px;color:var(--muted)}
.key i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:7px;
vertical-align:-1px;border:1px solid}
.km i{background:var(--m-fill);border-color:var(--m)}
.ks i{background:var(--s-fill);border-color:var(--s)}
.kh i{background:var(--h-fill);border-color:var(--h)}
.ku i{background:var(--u-fill);border-color:var(--u)}
.sec{margin:60px 0 0;padding:24px 0 0;border-top:2px solid var(--ink)}
.sec .l{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--h)}
.sec h2{font-size:24px;font-weight:500;margin:8px 0 6px;letter-spacing:-.008em}
.sec p{margin:0;color:var(--muted);font-size:14.5px;max-width:66ch}
figure{margin:0;padding:36px 0 32px;border-bottom:1px solid var(--rule)}
.ts{font-family:var(--mono);font-size:12px;color:var(--h);letter-spacing:.04em}
h3{font-size:18.5px;font-weight:500;margin:6px 0 20px;letter-spacing:-.005em}
figcaption{margin-top:20px;font-size:14.5px;color:var(--muted);max-width:70ch}
svg{display:block;width:100%;height:auto;overflow:visible}
svg rect{stroke-width:1}
svg .lbl{font:500 13px var(--sans)} svg .sub{font:400 11.5px var(--sans)}
svg .cap{font:400 12.5px var(--sans);fill:var(--muted)}
svg .sub2{font:400 11.5px var(--sans);fill:var(--muted)}
svg .hd{font:500 13px var(--sans);fill:var(--ink)}
svg g.m rect{fill:var(--m-fill);stroke:var(--m)} svg g.m text{fill:var(--m-text)}
svg g.s rect{fill:var(--s-fill);stroke:var(--s)} svg g.s text{fill:var(--s-text)}
svg g.h rect{fill:var(--h-fill);stroke:var(--h)} svg g.h text{fill:var(--h-text)}
svg g.u rect{fill:var(--u-fill);stroke:var(--u)} svg g.u text{fill:var(--u-text)}
svg .conn{stroke:var(--muted);stroke-width:1;fill:none}
svg .axis{stroke:var(--rule);stroke-width:1}
svg .tick{stroke:var(--muted);stroke-width:1}
svg .mark{stroke:var(--h);stroke-width:1.2;stroke-dasharray:4 3}
svg .pl-m{fill:none;stroke:var(--m);stroke-width:2}
svg .pl-h{fill:none;stroke:var(--h);stroke-width:2}
svg text.halo{paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
footer{margin-top:44px;font-size:13.5px;color:var(--muted)}
"""


def render(F, out, kick, title, lede, keys, footer=""):
    """F is a list of ("SEC", letter, title, blurb) and ("FIG", ts, title, height, body, caption)."""
    p = ["<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>",
         "<meta name='viewport' content='width=device-width,initial-scale=1'>",
         f"<title>{esc(title)}</title>", f"<style>{CSS}</style></head><body>",
         "<svg width='0' height='0' style='position:absolute' aria-hidden='true'><defs>",
         "<marker id='arw' viewBox='0 0 10 10' refX='8' refY='5' markerWidth='6' markerHeight='6' ",
         "orient='auto-start-reverse'><path d='M2 1L8 5L2 9' fill='none' stroke='#9AA0A7' ",
         "stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></marker></defs></svg>",
         f"<div class='wrap'><header><div class='kick'>{kick}</div><h1>{esc(title)}</h1>",
         f"<p class='meta'>{esc(lede)}</p><div class='key'>"]
    for c, t in keys:
        p.append(f"<span class='k{c}'><i></i>{esc(t)}</span>")
    p.append("</div></header>")
    n = 0
    for e in F:
        if e[0] == "SEC":
            p.append(f"<div class='sec'><div class='l'>Part {e[1]}</div><h2>{esc(e[2])}</h2><p>{esc(e[3])}</p></div>")
        else:
            n += 1
            _, ts, ttl, h, body, cap = e
            p.append(f"<figure><div class='ts'>Fig {n:02d} &nbsp;&middot;&nbsp; {ts}</div>")
            p.append(f"<h3>{esc(ttl)}</h3><svg viewBox='0 0 680 {h}' role='img'>")
            p.append(f"<title>{esc(ttl)}</title>{''.join(body)}</svg>")
            p.append(f"<figcaption>{esc(cap)}</figcaption></figure>")
    p.append(f"<footer>{esc(footer)}</footer></div></body></html>")
    open(out, "w", encoding="utf-8").write("".join(p))
    return n
