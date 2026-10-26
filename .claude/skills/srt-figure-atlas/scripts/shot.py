#!/usr/bin/env python3
"""Screenshot figures by id, to look at them before shipping.

  python3 shot.py atlas.html OUTDIR v06-p15 v06-p16 [--dark]

Writes OUTDIR/<id>.png (or <id>-dark.png). Open the PNGs and look: the checker cannot see a
confusing label, a cramped layout or a colour that means the wrong thing.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 3:
    sys.exit(__doc__)
atlas, out, ids = args[0], pathlib.Path(args[1]), args[2:]
dark = "--dark" in sys.argv
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 900, "height": 1000}, device_scale_factor=1.25,
                    color_scheme="dark" if dark else "light")
    pg.goto(pathlib.Path(atlas).resolve().as_uri())
    pg.wait_for_timeout(500)
    for i in ids:
        el = pg.query_selector(f"#{i}")
        if el is None:
            print(f"no figure with id {i}")
            continue
        el.scroll_into_view_if_needed()
        f = out / f"{i}{'-dark' if dark else ''}.png"
        el.screenshot(path=str(f))
        print(f)
    b.close()
