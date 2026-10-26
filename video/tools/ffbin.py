"""Locate ffmpeg: $FFMPEG, then the one on PATH, then the static build that ships with the imageio-ffmpeg wheel
(so a machine without ffmpeg installed can still render: pip install imageio-ffmpeg)."""
import os, re, shutil, subprocess, sys

_exe = None


def ffmpeg():
    global _exe
    if _exe is None:
        _exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
        if not _exe:
            try:
                import imageio_ffmpeg
                _exe = imageio_ffmpeg.get_ffmpeg_exe()
            except ImportError:
                sys.exit("ffmpeg not found: install it, or run  pip install imageio-ffmpeg")
    return _exe


def frames_and_fps(path):
    """Count a video's frames by reading its packets (no ffprobe needed) and read its frame rate."""
    # framecrc writes one line per packet; with stream copy that is one line per frame, and nothing is decoded
    out = subprocess.run([ffmpeg(), "-hide_banner", "-nostats", "-i", str(path), "-map", "0:v:0", "-c", "copy", "-f", "framecrc", "-"],
                         capture_output=True, text=True, errors="replace")
    fps = re.search(r"Video:.*?, ([\d.]+) fps", out.stderr)
    if out.returncode or not fps:
        raise RuntimeError(f"could not read {path}: {out.stderr[-400:]}")
    n = sum(1 for ln in out.stdout.splitlines() if ln and not ln.startswith("#"))
    return n, float(fps.group(1))
