#!/usr/bin/env python3
"""Quality gate for figure atlases. All checks must pass before shipping.

  python3 check_atlas.py atlas.html ...          report only
  python3 check_atlas.py --fix atlas.html ...    auto-fix padding, then report

  bounds      anything drawn outside its canvas
  collisions  text over text, or text clipping a box edge
  padding     a child box crowding or crossing its container
  alignment   a label not vertically centred in its box
  split-word  a word cut in two across neighbouring labels
  order       a stamp earlier than the figure before it (mark a deliberate recap <figure class='recap'>)
  numbering   figure numbers not running 1, 2, 3 …
  ids         an id used twice

An atlas built from figures/V0N/ is fixed at its source: --fix writes into the items and rebuilds.

Deliberately allowed (do not "fix" these):
  - a filled bar sitting exactly on its dashed track: they share edges on purpose
  - dashed annotation outlines hugging their contents: boundaries, not containers
"""
import html, sys, os, re
from playwright.sync_api import sync_playwright

BOUNDS = """() => [...document.querySelectorAll('svg[viewBox]')].map((s,i)=>{
  const W=s.viewBox.baseVal.width, H=s.viewBox.baseVal.height; let n=0;
  s.querySelectorAll('rect,text,line,polyline').forEach(e=>{try{const b=e.getBBox();
    if(b.x+b.width>W+2||b.x<-2||b.y+b.height>H+2)n++;}catch(_){}});
  return n?`fig ${__fn(s,i)}: ${n} element(s) outside the canvas`:null;}).filter(Boolean)"""

COLLIDE = """() => {
  const out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const it=[]; svg.querySelectorAll('rect,text').forEach(e=>{try{const b=e.getBBox();
      if(b.width>0&&b.height>0)it.push({tag:e.tagName.toLowerCase(),b,
        txt:(e.textContent||'').slice(0,34)});}catch(_){}});
    const ix=(a,b,t)=>a.x<b.x+b.width-t&&a.x+a.width>b.x+t&&a.y<b.y+b.height-t&&a.y+a.height>b.y+t;
    const inside=(a,b)=>a.x>=b.x-2&&a.x+a.width<=b.x+b.width+2&&a.y>=b.y-2&&a.y+a.height<=b.y+b.height+2;
    const hits=new Set();
    for(let i=0;i<it.length;i++)for(let j=i+1;j<it.length;j++){
      const A=it[i],B=it[j];
      if(A.tag==='text'&&B.tag==='text'){ if(ix(A.b,B.b,1.5)) hits.add(`"${A.txt}" x "${B.txt}"`); }
      else if(A.tag!==B.tag){ const T=A.tag==='text'?A:B,R=A.tag==='text'?B:A;
        if(ix(T.b,R.b,1.5)&&!inside(T.b,R.b)) hits.add(`"${T.txt}" clips a box`); }}
    if(hits.size)out.push(`fig ${__fn(svg,fi)}: ${[...hits].slice(0,3).join(' | ')}`);
  }); return out; }"""

ALIGN = """() => {
  const out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const rects=[...svg.querySelectorAll('rect')].map(e=>({e,b:e.getBBox()}));
    const g=new Map();
    svg.querySelectorAll('text').forEach(t=>{let tb;try{tb=t.getBBox();}catch(_){return;}
      const h=rects.filter(r=>tb.x>=r.b.x-1&&tb.x+tb.width<=r.b.x+r.b.width+1&&
                              tb.y>=r.b.y-1&&tb.y+tb.height<=r.b.y+r.b.height+1)
                   .sort((a,b)=>a.b.width*a.b.height-b.b.width*b.b.height)[0];
      if(!h||h.b.height>60)return;
      if(!g.has(h.e))g.set(h.e,{b:h.b,ts:[]}); g.get(h.e).ts.push({t,tb});});
    const bad=[];
    g.forEach(v=>{const top=Math.min(...v.ts.map(x=>x.tb.y));
      const bot=Math.max(...v.ts.map(x=>x.tb.y+x.tb.height));
      const off=(top+bot)/2-(v.b.y+v.b.height/2);
      if(Math.abs(off)>2.5)bad.push(`"${v.ts[0].t.textContent.slice(0,20)}" ${off>0?'+':''}${off.toFixed(1)}px`);});
    if(bad.length)out.push(`fig ${__fn(svg,fi)}: ${bad.slice(0,3).join(', ')}`);
  }); return out; }"""


LINES = r"""() => {
  const out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const kids=[...svg.querySelectorAll('rect,line,polyline,text')];
    const segs=[];
    kids.forEach((e,oi)=>{
      if(e.tagName==='line')segs.push({oi,x1:+e.getAttribute('x1'),y1:+e.getAttribute('y1'),
                                            x2:+e.getAttribute('x2'),y2:+e.getAttribute('y2')});
      if(e.tagName==='polyline'){const p=e.getAttribute('points').trim().split(/\s+/)
        .map(q=>q.split(',').map(Number));
        for(let i=0;i+1<p.length;i++)segs.push({oi,x1:p[i][0],y1:p[i][1],x2:p[i+1][0],y2:p[i+1][1]});}});
    const solid=[];
    kids.forEach((e,oi)=>{ if(e.tagName!=='rect')return;
      if((e.getAttribute('fill')||'')==='none')return;
      try{solid.push({oi,b:e.getBBox()});}catch(_){}});
    const cross=(s,b)=>{const X0=b.x-1.5,X1=b.x+b.width+1.5,Y0=b.y-1.5,Y1=b.y+b.height+1.5;
      const dx=s.x2-s.x1,dy=s.y2-s.y1; let t0=0,t1=1;
      const P=[-dx,dx,-dy,dy],Q=[s.x1-X0,X1-s.x1,s.y1-Y0,Y1-s.y1];
      for(let i=0;i<4;i++){ if(P[i]===0){ if(Q[i]<0)return false; }
        else{ const r=Q[i]/P[i];
          if(P[i]<0){ if(r>t1)return false; if(r>t0)t0=r; }
          else{ if(r<t0)return false; if(r<t1)t1=r; } } }
      return true;};
    const bad=[];
    kids.forEach(t=>{ if(t.tagName!=='text')return;
      if((t.getAttribute('class')||'').includes('halo'))return;   // knocked out on purpose
      let b; try{b=t.getBBox();}catch(_){return;} if(b.width<2)return;
      for(const s of segs){
        if(solid.some(r=>r.oi>s.oi&&b.x>=r.b.x-2&&b.x+b.width<=r.b.x+r.b.width+2&&
                          b.y>=r.b.y-2&&b.y+b.height<=r.b.y+r.b.height+2))continue;
        if(cross(s,b)){bad.push(`"${t.textContent.slice(0,28)}"`);break;}}});
    if(bad.length)out.push(`fig ${__fn(svg,fi)}: ${[...new Set(bad)].slice(0,3).join(", ")} over a line`);
  });
  return out; }"""


CRAMPED = r"""() => {
  const out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const rects=[...svg.querySelectorAll('rect')].map(e=>({e,b:e.getBBox()}));
    const bad=[];
    svg.querySelectorAll('text').forEach(t=>{
      let tb; try{tb=t.getBBox();}catch(_){return;} if(tb.width<2)return;
      const host=rects.filter(r=>Math.abs((tb.x+tb.width/2)-(r.b.x+r.b.width/2))<6 &&
                                 tb.y>r.b.y-2 && tb.y+tb.height<r.b.y+r.b.height+2 &&
                                 r.b.height<=90 && r.b.width>=60)
                      .sort((a,b)=>a.b.width-b.b.width)[0];
      if(!host)return;
      const pad=Math.min(tb.x-host.b.x,(host.b.x+host.b.width)-(tb.x+tb.width));
      if(pad<6)bad.push(`"${t.textContent.slice(0,32)}" has ${Math.round(pad)}px of room`);});
    if(bad.length)out.push(`fig ${__fn(svg,fi)}: ${bad.slice(0,3).join(", ")}`);
  });return out;}"""

OVERBOX = r"""() => {
  const out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const kids=[...svg.querySelectorAll('rect,line,polyline')];
    const rects=[],segs=[];
    kids.forEach((e,oi)=>{
      if(e.tagName==='rect'){ if((e.getAttribute('fill')||'')==='none')return;
        try{rects.push({oi,b:e.getBBox()});}catch(_){} return;}
      if((e.getAttribute('class')||'').includes('xok'))return;   // crossing is intended
      if(e.tagName==='line')segs.push({oi,e,x1:+e.getAttribute('x1'),y1:+e.getAttribute('y1'),
                                             x2:+e.getAttribute('x2'),y2:+e.getAttribute('y2')});
      if(e.tagName==='polyline'){const p=e.getAttribute('points').trim().split(/\s+/)
        .map(q=>q.split(',').map(Number));
        for(let i=0;i+1<p.length;i++)segs.push({oi,e,x1:p[i][0],y1:p[i][1],x2:p[i+1][0],y2:p[i+1][1]});}});
    const holds=(A,B)=>B.b.x>=A.b.x-1&&B.b.x+B.b.width<=A.b.x+A.b.width+1&&
                       B.b.y>=A.b.y-1&&B.b.y+B.b.height<=A.b.y+A.b.height+1&&B!==A;
    rects.forEach(R=>{R.container=rects.filter(o=>holds(R,o)).length>=2;});
    const cross=(s,b)=>{const X0=b.x+1.5,X1=b.x+b.width-1.5,Y0=b.y+1.5,Y1=b.y+b.height-1.5;
      if(X1<=X0||Y1<=Y0)return false;
      const dx=s.x2-s.x1,dy=s.y2-s.y1;let t0=0,t1=1;
      const P=[-dx,dx,-dy,dy],Q=[s.x1-X0,X1-s.x1,s.y1-Y0,Y1-s.y1];
      for(let i=0;i<4;i++){if(P[i]===0){if(Q[i]<0)return false;}
        else{const r=Q[i]/P[i];if(P[i]<0){if(r>t1)return false;if(r>t0)t0=r;}
             else{if(r<t0)return false;if(r<t1)t1=r;}}}
      return (t1-t0)*Math.hypot(dx,dy)>3;};
    const bad=new Set();
    for(const s of segs)for(const r of rects)
      if(!r.container&&r.oi<s.oi&&cross(s,r.b))
        bad.add(`a ${s.e.getAttribute("class")||"line"} is drawn across a filled box`);
    if(bad.size)out.push(`fig ${__fn(svg,fi)}: ${[...bad].join(", ")}`);
  });return out;}"""


CROWD = r"""() => {
  const MIN=18, out=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const art=[];
    svg.querySelectorAll('rect,line,polyline').forEach(e=>{
      try{const b=e.getBBox(); if(b.width>1)art.push(b);}catch(_){}});
    const bad=[];
    svg.querySelectorAll('text').forEach(t=>{
      if(!(t.getAttribute('class')||'').split(' ').includes('cap'))return;
      let tb; try{tb=t.getBBox();}catch(_){return;} if(tb.width<2)return;
      let best=null;
      for(const b of art){
        if(b.x+b.width<tb.x+2||b.x>tb.x+tb.width-2)continue;
        if(b.y+b.height>tb.y)continue;
        if(best===null||b.y+b.height>best)best=b.y+b.height;}
      if(best===null)return;
      const gap=tb.y-best;
      if(gap<MIN)bad.push(`"${t.textContent.slice(0,30)}" sits ${Math.round(gap)}px under the drawing`);
    });
    if(bad.length)out.push(`fig ${__fn(svg,fi)}: ${bad.slice(0,2).join(" | ")}`);
  });return out;}"""

PAD = r"""(DRY) => {
  const MIN=14, TARGET=20, log=[];
  document.querySelectorAll('svg[viewBox]').forEach((svg,fi)=>{
    const vb=svg.viewBox.baseVal;
    const all=()=>[...svg.querySelectorAll('rect,text,line,polyline')];
    const rects=()=>[...svg.querySelectorAll('rect')].map(e=>({e,b:e.getBBox()}))
                     .filter(r=>r.b.width>4&&r.b.height>4);
    const kids=(A,rs)=>rs.filter(B=>{ if(B.e===A.e)return false;
      const aA=A.b.width*A.b.height, aB=B.b.width*B.b.height;
      if(aA<3*aB)return false;
      if(Math.abs(B.b.height-A.b.height)<2)return false;      // overlay on a track
      if(Math.abs(B.b.width -A.b.width )<2)return false;
      if((A.e.getAttribute('stroke-dasharray')||'')!=='')return false;  // annotation, meant to hug
      const ox=Math.max(0,Math.min(A.b.x+A.b.width ,B.b.x+B.b.width )-Math.max(A.b.x,B.b.x));
      const oy=Math.max(0,Math.min(A.b.y+A.b.height,B.b.y+B.b.height)-Math.max(A.b.y,B.b.y));
      return ox*oy>=0.55*aB;});
    for(let pass=0;pass<6;pass++){
      const rs=rects(); let acted=false;
      for(const A of rs){ const ks=kids(A,rs); if(!ks.length)continue;
        const Ab=A.b.y+A.b.height, Ar=A.b.x+A.b.width;
        const kb=Math.max(...ks.map(k=>k.b.y+k.b.height));
        const kr=Math.max(...ks.map(k=>k.b.x+k.b.width));
        if(Ar-kr<2){ const dx=(kr+6)-Ar;
          if(!DRY)A.e.setAttribute('width',A.b.width+dx);
          log.push(`fig ${__fn(svg,fi)}: container too narrow by ${Math.round(dx)}px`); acted=true; break;}
        if(Ab-kb<MIN){ const dy=Math.round((kb+TARGET)-Ab);
          if(!DRY){ A.e.setAttribute('height',A.b.height+dy);
            const grpTop=new Map();      // a box and its label move together or not at all
            all().forEach(e=>{let bb;try{bb=e.getBBox();}catch(_){return;}
              const g=e.parentNode&&e.parentNode.tagName==='g'?e.parentNode:e;
              grpTop.set(g,Math.min(grpTop.has(g)?grpTop.get(g):1e9,bb.y));});
            all().forEach(e=>{
              const g=e.parentNode&&e.parentNode.tagName==='g'?e.parentNode:e;
              if(grpTop.get(g)<Ab-0.5)return;
              if(e.tagName==='line'){e.setAttribute('y1',+e.getAttribute('y1')+dy);
                                     e.setAttribute('y2',+e.getAttribute('y2')+dy);}
              else if(e.tagName==='polyline'){e.setAttribute('points',
                e.getAttribute('points').split(' ').map(p=>{const[x,y]=p.split(',');
                  return `${x},${+y+dy}`;}).join(' '));}
              else e.setAttribute('y',+e.getAttribute('y')+dy);});
            svg.setAttribute('viewBox',`0 0 ${vb.width} ${Math.round(vb.height+dy)}`);}
          log.push(`fig ${__fn(svg,fi)}: child crowds the container bottom by ${Math.round(dy)}px`);
          acted=true; break;}}
      if(!acted)break; }});
  return {log, html:[...document.querySelectorAll('svg[viewBox]')].map(s=>s.outerHTML)}; }"""


FIGNO = """() => { window.__fn = (svg, i) => { const f = svg.closest('figure');
  const ts = f && f.querySelector('.ts'); const m = ts && ts.textContent.match(/Fig\\s+(\\d+)/);
  return m ? m[1] : '#' + (i + 1); }; }"""

SVGS = """() => [...document.querySelectorAll('svg[viewBox]')].map(s =>
  [s.closest('figure') ? s.closest('figure').id : '', s.outerHTML])"""


def source_checks(f, src):
    """Checks on the HTML source: words cut across labels, stamp order, numbering, ids."""
    out = []
    figs = re.split(r"<figure\b", src)[1:]
    # a word split across two adjacent labels: the joined word is common, a fragment is not
    corpus = ""
    for g in os.listdir(os.path.dirname(os.path.abspath(f))):
        if g.endswith(".html"):
            corpus += open(os.path.join(os.path.dirname(os.path.abspath(f)), g), encoding="utf-8").read()
    words = {}
    for w in re.findall(r"[A-Za-z][A-Za-z'-]*", html.unescape(re.sub(r"<[^>]+>", " ", corpus))):
        words[w.lower()] = words.get(w.lower(), 0) + 1
    prev, prev_no = None, 0
    for k, fg in enumerate(figs, 1):
        m = re.search(r"class=['\"]ts['\"]>Fig (\d+) &nbsp;&middot;&nbsp; ([0-9:]+)<", fg)
        no = m.group(1) if m else f"#{k}"
        if m and int(m.group(1)) != prev_no + 1:
            out.append(f"  [numbering] fig {no}: follows fig {prev_no}")
        if m:
            prev_no = int(m.group(1))
            parts = [int(x) for x in m.group(2).split(":")]
            t = sum(x * 60 ** i for i, x in enumerate(reversed(parts)))
            recap = re.match(r"[^>]*class=['\"][^'\"]*\brecap\b", fg)
            if prev is not None and t < prev[0] and not recap:
                out.append(f"  [order] fig {no}: stamped {m.group(2)}, before fig {prev[1]}'s {prev[2]}")
            if not recap:
                prev = (t, no, m.group(2))
        texts = [html.unescape(re.sub(r"<[^>]+>", "", x)) for x in re.findall(r"<text[^>]*>(.*?)</text>", fg, re.S)]
        for a, b in zip(texts, texts[1:]):
            if a and b and a[-1].isalpha() and b[0].isalpha() and b[0].islower():
                wa = re.findall(r"[A-Za-z'-]+$", a)[0]
                wb = re.findall(r"^[A-Za-z'-]+", b)[0]
                if words.get((wa + wb).lower(), 0) >= 2 and min(words.get(wa.lower(), 0), words.get(wb.lower(), 0)) <= 2:
                    out.append(f'  [split-word] fig {no}: "{a[-24:]}" | "{b[:24]}"')
    ids = re.findall(r"\sid=['\"]([^'\"]+)['\"]", src)
    for i in sorted({i for i in ids if ids.count(i) > 1}):
        out.append(f"  [ids] {i} is used more than once")
    return out


def write_fix(f, before, after):
    """Save auto-fixed SVGs: into figures/V0N/items when the atlas is built from them, else in place."""
    changed = [(fid, k, new) for k, ((fid, old), new) in enumerate(zip(before, after)) if old != new]
    if not changed:
        return
    m = re.match(r"(V\d\d)_", os.path.basename(f))
    items = os.path.join(os.getcwd(), "figures", m.group(1), "items") if m else ""
    if items and os.path.isdir(items) and all(fid for fid, _, _ in changed):
        for fid, k, new in changed:
            item = os.path.join(items, fid.split("-", 1)[1] + ".html")
            src = open(item, encoding="utf-8").read()
            nth = sum(1 for fid2, _ in before[:k] if fid2 == fid)   # which svg of this figure
            svgs = re.findall(r"<svg viewBox.*?</svg>", src, re.S)
            src = src.replace(svgs[nth], new, 1)
            open(item, "w", encoding="utf-8").write(src)
        build = os.path.join(os.path.dirname(os.path.abspath(__file__)), "atlas_build.py")
        os.system(f'"{sys.executable}" "{build}" build {m.group(1)}')
        return
    src = open(f, encoding="utf-8").read()
    for old, new in zip(re.findall(r"<svg viewBox.*?</svg>", src, re.S), after):
        src = src.replace(old, new, 1)
    open(f, "w", encoding="utf-8").write(src)


def main():
    fix = "--fix" in sys.argv
    files = [a for a in sys.argv[1:] if a.endswith(".html")]
    if not files:
        sys.exit(__doc__)
    problems = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 900, "height": 1000})
        for f in files:
            pg.goto(f"file://{os.path.abspath(f)}"); pg.wait_for_timeout(800)
            pg.evaluate(FIGNO)
            if fix:
                before = pg.evaluate(SVGS)
                r = pg.evaluate(PAD, False)
                if r["log"]:
                    write_fix(f, before, r["html"])
                    pg.goto(f"file://{os.path.abspath(f)}"); pg.wait_for_timeout(800)
                    pg.evaluate(FIGNO)
            found = source_checks(f, open(f, encoding="utf-8").read())
            for label, js, arg in [("bounds", BOUNDS, None), ("collisions", COLLIDE, None),
                                   ("padding", PAD, True), ("alignment", ALIGN, None),
                                   ("lines", LINES, None), ("cramped", CRAMPED, None),
                                   ("over-box", OVERBOX, None),
                                   ("crowding", CROWD, None)]:
                out = pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
                if label == "padding":
                    out = out["log"]
                for line in sorted(set(out)):
                    found.append(f"  [{label}] {line}")
            name = os.path.basename(f)
            n = len(re.findall(r"<figure\b", open(f, encoding="utf-8").read()))
            if found:
                print(f"\n=== {name}  ({n} figures) ===")
                print("\n".join(found)); problems += len(found)
            else:
                print(f"{name:46s} {n:3d} figures   clean")
        b.close()
    print(f"\n{'PROBLEMS: ' + str(problems) if problems else 'ALL CHECKS PASS'}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
