#!/usr/bin/env python3
"""Dump an atlas HTML file to a readable outline: parts, figures, every label, prose and caption.

  python3 video/tools/extract_atlas.py atlases/V01_The_Memory_Wall.html > video/v01/source/atlas_v01.md
"""
import html, re, sys
from html.parser import HTMLParser


class Atlas(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out, self.stack, self.buf, self.mode = [], [], [], None
        self.fig = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "")
        self.stack.append((tag, cls))
        if tag == "div" and cls == "sec":
            self.mode = "sec"
        elif tag == "div" and cls == "ts":
            self.mode, self.buf = "ts", []
        elif tag in ("h1", "h2", "h3", "figcaption") or (tag == "p" and self.mode in ("sec", "head")):
            self.mode_tag, self.buf = tag, []
        elif tag == "text":
            self.buf = []
        elif tag == "header":
            self.mode = "head"

    def handle_endtag(self, tag):
        tag_, cls = self.stack.pop() if self.stack else (tag, "")
        txt = " ".join("".join(self.buf).split())
        if tag == "div" and cls == "ts":
            self.fig += 1
            self.out.append(f"\n### {txt}")
            self.mode = None
        elif tag == "h1":
            self.out.append(f"# {txt}")
        elif tag == "h2":
            self.out.append(f"\n\n## {txt}")
        elif tag == "h3":
            self.out.append(f"**{txt}**")
        elif tag == "p" and self.mode in ("sec", "head"):
            self.out.append(f"_{txt}_")
        elif tag == "figcaption":
            self.out.append(f"> CAPTION: {txt}")
        elif tag == "text":
            kind = {"hd": "HEAD", "cap": "PROSE", "lbl": "LABEL", "sub": "sub", "sub2": "sub2"}.get(cls.split()[0] if cls else "", cls or "text")
            if txt:
                self.out.append(f"- [{kind}] {txt}")
        elif tag == "div" and cls == "sec":
            self.mode = None
        if tag in ("h1", "h2", "h3", "figcaption", "text", "p"):
            self.buf = []

    def handle_data(self, data):
        self.buf.append(data)


p = Atlas()
p.feed(open(sys.argv[1], encoding="utf8").read())
text = "\n".join(p.out)
# merge consecutive PROSE lines into paragraphs for readability
lines, merged = text.split("\n"), []
for ln in lines:
    if ln.startswith("- [PROSE] ") and merged and merged[-1].startswith("- [PROSE] "):
        merged[-1] += " " + ln[len("- [PROSE] "):]
    else:
        merged.append(ln)
print("\n".join(merged))
print(f"\n\n<!-- {p.fig} figures -->")
