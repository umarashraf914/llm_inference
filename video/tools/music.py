#!/usr/bin/env python3
"""Synthesise a quiet ambient pad to sit under the narration.

Deliberately simple and safe: slow consonant chords built from sine partials (no harsh highs),
a long attack and release, a synthetic reverb tail, and a 64-second loop tiled to any length.

  python3 video/tools/music.py out.wav --seconds 5400
"""
import argparse, wave

import numpy as np

SR = 24000
# eight chords, 8 s each, in D major / B minor; every chord shares notes with the next
CHORDS = [
    ["D3", "A3", "F#4", "C#5", "E5"],     # Dmaj9
    ["B2", "F#3", "D4", "A4", "C#5"],     # Bm9
    ["G2", "D3", "B3", "F#4", "A4"],      # Gmaj9
    ["A2", "E3", "C#4", "F#4", "B4"],     # A6/9
    ["D3", "A3", "E4", "F#4", "A4"],      # Dadd9
    ["F#2", "C#3", "A3", "E4", "F#4"],    # F#m7
    ["G2", "D3", "A3", "B3", "F#4"],      # Gmaj7(9)
    ["A2", "E3", "G3", "C#4", "E4"],      # A7sus feel
]
NOTE = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}


def freq(n):
    name, octave = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave - 4)) / 12)


def loop(seconds_per_chord=8.0):
    L = int(len(CHORDS) * seconds_per_chord * SR)
    t = np.arange(L) / SR
    out = np.zeros(L)
    seg = seconds_per_chord
    for k, chord in enumerate(CHORDS):
        start = k * seg
        # each chord swells in over 3 s and out over 4 s, overlapping its neighbours (wraps for a seamless loop)
        for shift in (0, len(CHORDS) * seg):
            c0 = start - 2.0 + shift - len(CHORDS) * seg * (shift > 0)
            env = np.clip((t - c0) / 3.0, 0, 1) * np.clip((c0 + seg + 4.0 - t) / 4.0, 0, 1)
            env = env ** 1.6
            if not env.any():
                continue
            for i, n in enumerate(chord):
                f = freq(n)
                for det in (-0.0018, 0.0018):        # slight chorus
                    ph = 2 * np.pi * f * (1 + det) * t
                    tone = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
                    out += env * tone * (0.9 if i == 0 else 0.55) / len(chord)
    # gentle movement
    out *= 0.85 + 0.15 * np.sin(2 * np.pi * t / (len(CHORDS) * seg))
    return out


def reverb(x, seconds=3.5, seed=7):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / seconds))
    ir /= np.sqrt((ir ** 2).sum())
    # circular convolution keeps the loop seamless
    N = len(x)
    y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(np.pad(ir, (0, max(0, N - n)))[:N], N), N)
    return 0.55 * x + 0.75 * y


def lowpass(x, cutoff=1800):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--seconds", type=float, required=True)
    a = ap.parse_args()
    lp = lowpass(reverb(loop()))
    lp /= np.max(np.abs(lp)) + 1e-9
    reps = int(np.ceil(a.seconds * SR / len(lp)))
    full = np.tile(lp, reps)[: int(a.seconds * SR)]
    fade = int(3 * SR)
    full[:fade] *= np.linspace(0, 1, fade)
    full[-fade:] *= np.linspace(1, 0, fade)
    pcm = (full * 0.5 * 32767).astype("<i2")
    with wave.open(a.out, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f"{a.out}: {a.seconds/60:.1f} min ambient bed")


if __name__ == "__main__":
    main()
