#!/usr/bin/env python3
"""Narrate the chapter scripts with Kokoro and write the timing every scene is keyed to.

  python3 video/tools/tts.py video/v01                 # every chapter in script/
  python3 video/tools/tts.py video/v01 ch05 ch06       # only these (timing.json is still rebuilt for all)

Writes, under video/v01/build/:
  audio/<scene>.wav     the scene's narration, 24 kHz mono, padded to whole frames
  timing.json           order of scenes (title cards included), durations, beat and word times
Synthesis is cached per sentence in build/tts_cache, so re-running after an edit only redoes what changed.
"""
import os, hashlib, json, math, re, sys, wave
from pathlib import Path

import numpy as np

VOICE, SPEED, LANG = "af_heart", 0.94, "en-us"
SR = 24000
FPS_GRID = 30          # durations are rounded up to whole 1/30 s frames (also whole 1/60 s frames)
LEAD, GAP, TAIL = 0.7, 0.45, 1.0      # seconds: before the first beat, between beats, after the last
SENT_GAP = 0.22                       # between sentences inside a beat
TITLE_DUR = 3.6                       # chapter title cards
MODEL = "/opt/tts/kokoro-v1.0.onnx"
VOICES = "/opt/tts/voices-v1.0.bin"
_k = None


def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(MODEL, VOICES)
    return _k


def lexicon(film):
    p = film / "lexicon.json"
    return json.loads(p.read_text()) if p.exists() else {}


def apply_lexicon(text, lex):
    for k, v in lex.items():
        text = re.sub(rf"\b{re.escape(k)}\b", v, text)
    return text


def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", text.strip())
    return [p for p in parts if p.strip()]


def synth(text, cache):
    key = hashlib.sha1(f"{VOICE}|{SPEED}|{LANG}|{text}".encode()).hexdigest()[:20]
    f = cache / f"{key}.npy"
    if f.exists():
        return np.load(f)
    audio, sr = kokoro().create(text, voice=VOICE, speed=SPEED, lang=LANG)
    assert sr == SR
    audio = trim_silence(np.asarray(audio, dtype=np.float32))
    np.save(f, audio)
    return audio


def trim_silence(a, thr=0.004):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s, e = max(0, idx[0] - int(0.02 * SR)), min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]


def word_times(sentence, start, dur):
    """Estimate when each word starts: weight by letters, with extra weight for punctuation pauses."""
    toks = sentence.split()
    weights = []
    for t in toks:
        w = len(re.sub(r"[^A-Za-z0-9]", "", t)) + 1.5
        weights.append(w)
    pauses = [4.0 if t[-1] in ",;:" else 0.0 for t in toks]
    total = sum(weights) + sum(pauses[:-1])
    out, acc = [], 0.0
    for t, w, p in zip(toks, weights, pauses):
        out.append({"w": t, "start": round(start + dur * acc / total, 3)})
        acc += w + p
    return out


def frames_ceil(x):
    return math.ceil(x * FPS_GRID - 1e-6) / FPS_GRID


def write_wav(path, audio):
    pcm = np.clip(audio, -1, 1)
    pcm = (pcm * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def narrate_scene(sc, lex, cache, out_audio):
    t = LEAD
    pieces = [np.zeros(int(LEAD * SR), np.float32)]
    beats = []
    for bi, b in enumerate(sc["beats"]):
        if bi:
            pieces.append(np.zeros(int(GAP * SR), np.float32)); t += GAP
        b_start, words = t, []
        sents = sentences(b["say"])
        for si, s in enumerate(sents):
            if si:
                pieces.append(np.zeros(int(SENT_GAP * SR), np.float32)); t += SENT_GAP
            a = synth(apply_lexicon(s, lex), cache)
            d = len(a) / SR
            words += word_times(s, t, d)
            pieces.append(a); t += d
        beats.append({"id": b["id"], "start": round(b_start, 3), "dur": round(t - b_start, 3),
                      "end": round(t, 3), "text": b["say"], "words": words})
    total = frames_ceil(t + TAIL)
    audio = np.concatenate(pieces)
    audio = np.pad(audio, (0, int(round(total * SR)) - len(audio)))
    write_wav(out_audio / f"{sc['id']}.wav", audio)
    return {"id": sc["id"], "kind": "scene", "duration": total, "beats": beats}


def main(argv):
    film = Path(argv[0]).resolve()
    only = set(argv[1:])
    build = film / "build"
    cache, out_audio = build / "tts_cache", build / "audio"
    cache.mkdir(parents=True, exist_ok=True); out_audio.mkdir(parents=True, exist_ok=True)
    lex = lexicon(film)
    tpath = build / "timing.json"
    old = json.loads(tpath.read_text()) if tpath.exists() else {"scenes": {}}
    timing = {"voice": VOICE, "speed": SPEED, "fps_grid": FPS_GRID, "order": [], "scenes": {}}
    chapters = sorted((film / "script").glob("ch*.json"))
    for cf in chapters:
        ch = json.loads(cf.read_text())
        cid = ch["chapter"]
        num = int(cid[2:])
        chap = {"id": cid, "number": f"{num:02d}", "title": ch["title"], "kicker": ch["kicker"]}
        if num > 0:
            tid = f"{cid}_title"
            timing["order"].append(tid)
            timing["scenes"][tid] = {"id": tid, "kind": "title", "duration": TITLE_DUR, "beats": [], "chapter": chap}
        for si, sc in enumerate(ch["scenes"]):
            if only and cid not in only and sc["id"] in old["scenes"]:
                entry = old["scenes"][sc["id"]]
            else:
                entry = narrate_scene(sc, lex, cache, out_audio)
                print(f"{sc['id']}: {entry['duration']:.1f}s, {len(entry['beats'])} beats", flush=True)
            entry["chapter"] = {**chap, "enter": si == 0, "exit": si == len(ch["scenes"]) - 1}
            timing["order"].append(sc["id"])
            timing["scenes"][sc["id"]] = entry
    t = 0.0
    for sid in timing["order"]:
        timing["scenes"][sid]["globalStart"] = round(t, 3)
        t += timing["scenes"][sid]["duration"]
    timing["total"] = round(t, 3)
    tmp = tpath.with_suffix(".json.tmp")          # atomic: renderers may be reading it
    tmp.write_text(json.dumps(timing, indent=1))
    os.replace(tmp, tpath)
    print(f"total {t/60:.1f} min across {len(timing['order'])} scenes -> {tpath}")


if __name__ == "__main__":
    main(sys.argv[1:])
