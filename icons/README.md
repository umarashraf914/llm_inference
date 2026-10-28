# Icon library

The films' icons come from here: 131,351 free icons in 46 sets, from the best open-source collections,
and a kit of 655 of them picked for the topics of the nine lectures. The user asked for it when V01's
icons looked generic: "It should look very production quality, high quality video." Their example was
[LobeHub Icons](https://lobehub.com/icons), whose AI-brand logos are in the library as `lobe:`.

| Path | What it is |
|---|---|
| `kit.json` | The film kit: 534 concepts in 16 topics, each with its first-choice icon and the alternatives |
| `kit/sheets/*.jpg` | The kit drawn on the films' background, one sheet per topic: look here first |
| `kit/svg/<set>/<name>.svg` | Every kit icon as a standalone SVG file |
| `library_1.jpg`, `library_2.jpg` | Every set in the library, a row each with nine of its icons: colour sets, then one-colour sets |

The sets themselves are npm packages pinned in `video/package.json`: `npm install` in `video/` puts them
in `video/node_modules` (about 375 MB, never in git), and `video/tools/iconlib.py` lists them. The
computers that render need none of it: a scene draws only the icons it names, which
`video/tools/build_icons.py` bundles into `video/engine/icons.generated.js`.

## Using an icon

```bash
python3 video/tools/build_icons.py --search robot                    # ids, best first, in every set
python3 video/tools/build_icons.py --search server --family objects  # brands, objects, ui, code or glyphs
python3 video/tools/build_icons.py --sheet out.jpg --search rocket   # see the hits on the films' background
python3 video/tools/build_icons.py --sheet out.jpg lobe:claude-color fluent-emoji:brain
python3 video/tools/build_icons.py --sets                            # every set: size, licence, what for
python3 video/tools/build_icons.py                                   # bundle what the scenes use
python3 video/tools/build_icons.py --kit                             # after editing kit.json: sheets and SVGs
```

In a scene: `S.icon('fluent-emoji:robot', {x, y, size})`. An id is `<prefix>:<name>`; the prefixes are
Iconify's, so any icon can be browsed at `https://icon-sets.iconify.design/<prefix>/`, except four kept
from V01: `fluent:` is Fluent Emoji Flat, `fluent-ui:` is Iconify's `fluent`, `ms:` is Material Symbols
and `tabler-filled:` is Tabler's filled style. One-colour icons take the scene's colour (`color:`);
colour icons keep their own. Adding a new icon to a scene changes that scene's fingerprint only.

## Which set for what

- **AI labs, models and tools**: `lobe:<brand>-color`, else `lobe:<brand>`, the one-colour mark drawn in
  the scene's ink. `lobe:<brand>-text` is the wordmark.
- **Other technology brands**: `logos:` where the logo reads on navy. A brand drawn in dark ink (AWS's
  text, Intel, Apple, Broadcom, Rust) uses its one-colour mark from `simple-icons:` or `thesvg:`, tinted.
- **Real-world things and ideas**: `fluent-emoji:` first, Microsoft's 3D-looking Fluent Emoji (robot,
  brain, rocket, stopwatch, money bag, fire, snowflake, truck...). `fluent-color:` for interface ideas:
  chat, agents, database, document, settings, charts, people.
- **Files and code**: `vscode-icons:file-type-*` (json, safetensors, cuda, python...) and `logos:` languages.
- **Hardware the story is about** (a GPU, HBM, a server, a rack): drawn by `video/lib/hardware.js`, never
  an icon. A small mention: `streamline-color:` chips, servers and drives, or a glyph.
- **Symbols inside diagrams**, tinted to the scene's meaning colours: `ph:*-duotone`, the films' glyph
  style, or `solar:*-bold-duotone`.
- **One family per frame.** A 3D emoji beside a flat line icon looks pasted together. Brands are the
  exception: a logo is always the brand's own.
- **The films are dark navy.** An icon drawn with black outlines (IconPark, Marketeq) or a dark wordmark
  disappears on it. Look at an icon on a sheet before using it; every icon in the kit has been looked at.

## Sets and licences

| Family | Prefix | Set | Icons | Licence | Kind | Tier | For |
|---|---|---|---:|---|---|---|---|
| brands | `lobe` | LobeHub Icons | 991 | MIT | colour | 1 | AI companies, models and tools: <brand>, <brand>-color, <brand>-text |
| brands | `logos` | SVG Logos | 2,043 | CC0-1.0 | colour | 1 | technology brands in full colour: chips, clouds, languages, tools |
| brands | `thesvg-color` | theSVG Color | 5,159 | MIT | colour | 2 | more brand logos in full colour |
| brands | `simple-icons` | Simple Icons | 3,467 | CC0-1.0 | one colour | 2 | brand marks in one colour, to tint |
| brands | `thesvg` | theSVG | 3,796 | MIT | one colour | 2 | more brand marks in one colour, to tint |
| brands | `devicon` | Devicon | 1,064 | MIT | colour | 2 | programming languages and developer tools, in colour |
| brands | `skill-icons` | Skill Icons | 400 | MIT | colour | 3 | technology badges on rounded tiles |
| brands | `gcp` | Google Cloud Icons | 214 | Apache-2.0 | colour | 3 | Google Cloud products |
| brands | `k8s` | Kubernetes Icons | 38 | Apache-2.0 | colour | 3 | Kubernetes objects |
| objects | `fluent-emoji` | Fluent Emoji | 3,126 | MIT | colour | 1 | real-world things and ideas, shaded like 3D: the first choice |
| objects | `fluent` | Fluent Emoji Flat | 3,145 | MIT | colour | 2 | the same things, flat-shaded (the first film's colour icons) |
| objects | `noto` | Noto Emoji | 3,729 | Apache-2.0 | colour | 2 | Google's emoji: real-world things |
| objects | `streamline-color` | Streamline color | 2,000 | CC-BY-4.0 | colour | 2 | objects and ideas, two-tone colour |
| objects | `streamline-plump-color` | Plump color icons | 1,000 | CC-BY-4.0 | colour | 2 | objects and ideas, rounded, colour |
| objects | `streamline-flex-color` | Flex color icons | 1,000 | CC-BY-4.0 | colour | 2 | objects and ideas, flexible line, colour |
| objects | `streamline-ultimate-color` | Ultimate color icons | 998 | CC-BY-4.0 | colour | 3 | objects and ideas, colour |
| objects | `streamline-freehand-color` | Freehand color icons | 1,000 | CC-BY-4.0 | colour | 3 | hand-drawn, colour |
| objects | `streamline-sharp-color` | Sharp color icons | 1,000 | CC-BY-4.0 | colour | 3 | sharp corners, colour |
| objects | `streamline-cyber-color` | Cyber color icons | 500 | CC-BY-4.0 | colour | 3 | technology, colour |
| objects | `streamline-kameleon-color` | Kameleon color icons | 400 | CC-BY-4.0 | colour | 3 | round badges, colour |
| objects | `streamline-stickies-color` | Stickies color icons | 200 | CC-BY-4.0 | colour | 3 | sticker style, colour |
| objects | `icon-park` | IconPark | 2,658 | Apache-2.0 | colour | 3 | multi-colour line icons |
| objects | `glyphs-poly` | Glyphs Poly | 863 | MIT | colour | 3 | multi-colour glyphs |
| objects | `marketeq` | Marketeq | 590 | MIT | colour | 3 | business, colour |
| objects | `flat-color-icons` | Flat Color Icons | 329 | MIT | colour | 3 | flat colour (Icons8) |
| objects | `meteocons` | Meteocons | 447 | MIT | colour | 3 | weather |
| objects | `circle-flags` | Circle Flags | 444 | MIT | colour | 2 | country and language flags, round |
| ui | `fluent-color` | Fluent UI System Color Icons | 890 | MIT | colour | 1 | interface symbols in colour (Microsoft 365 style) |
| code | `vscode-icons` | VSCode Icons | 1,712 | MIT | colour | 2 | file types and folders |
| code | `material-icon-theme` | Material Icon Theme | 908 | MIT | colour | 3 | file types and folders |
| code | `catppuccin` | Catppuccin Icons | 656 | MIT | colour | 3 | file types and folders, pastel |
| glyphs | `ph` | Phosphor | 9,072 | MIT | one colour | 1 | one-colour symbols in six weights; -duotone is the films' default |
| glyphs | `solar` | Solar | 8,706 | CC-BY-4.0 | one colour | 1 | one-colour symbols; -bold-duotone and -linear-duotone |
| glyphs | `fluent-ui` | Fluent UI System Icons | 19,900 | MIT | one colour | 2 | Microsoft's widest set: -regular and -filled |
| glyphs | `ms` | Material Symbols | 15,728 | Apache-2.0 | one colour | 2 | Google's, in styles: -outline, -rounded, -sharp |
| glyphs | `tabler` | Tabler Icons (outline) | 5,184 | MIT | one colour | 2 | outline |
| glyphs | `tabler-filled` | Tabler Icons (filled) | 1,054 | MIT | one colour | 2 | filled |
| glyphs | `lucide` | Lucide | 1,544 | ISC | one colour | 2 | clean outline |
| glyphs | `carbon` | Carbon | 2,631 | Apache-2.0 | one colour | 2 | IBM's: strong on computing and data |
| glyphs | `mdi` | Material Design Icons | 7,447 | Apache-2.0 | one colour | 2 | the widest range of objects |
| glyphs | `hugeicons` | Huge Icons | 6,065 | MIT | one colour | 2 | stroke, rounded |
| glyphs | `icon-park-twotone` | IconPark TwoTone | 1,944 | Apache-2.0 | one colour | 3 | two-tone line icons |
| glyphs | `duo-icons` | Duoicons | 91 | MIT | one colour | 3 | duotone symbols |
| glyphs | `game-icons` | Game Icons | 4,133 | CC-BY-3.0 | one colour | 3 | detailed silhouettes |
| glyphs | `ix` | Siemens Industrial Experience Icons | 1,490 | MIT | one colour | 3 | industrial equipment (Siemens) |
| glyphs | `fluent-emoji-high-contrast` | Fluent Emoji High Contrast | 1,595 | MIT | one colour | 3 | emoji as one-colour silhouettes |

131,351 icons in 46 sets.

Tier 1 is where to look first. Every set is free to use in the films. The ones under **CC BY** need a
credit line in a film's description when one of their icons is on screen:

- Streamline (`streamline-*`): "Icons by Streamline, streamlinehq.com, CC BY 4.0"
- Solar (`solar`): "Solar icons by 480 Design, CC BY 4.0"
- Game Icons (`game-icons`): "Icons from game-icons.net, CC BY 3.0"

The rest are MIT, Apache 2.0, ISC or CC0 and ask for no credit on screen. Brand logos stay the
trademarks of their owners: the films use them only to name the companies and products a lecture
discusses, as LobeHub's own catalogue does.

## Adding a set

`npm install --save-exact @iconify-json/<prefix>` in `video/`, then a line in `SETS` in
`video/tools/iconlib.py` (prefix, source, family, tier, what it is for). Check its licence first: sets
under share-alike (CC BY-SA), non-commercial (CC BY-NC) or GPL licences were left out on purpose.
