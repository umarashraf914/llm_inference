#!/usr/bin/env bash
# One-time setup for rendering the films in a fresh container.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --silent
mkdir -p engine/vendor
for f in gsap DrawSVGPlugin MorphSVGPlugin MotionPathPlugin CustomEase; do
  cp "node_modules/gsap/dist/$f.min.js" engine/vendor/
done
# Python Playwright must match the Chromium build preinstalled under /opt/pw-browsers (1194 -> 1.56.0)
pip install --quiet "playwright==1.56.0" kokoro-onnx soundfile numpy
mkdir -p /opt/tts
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "/opt/tts/$f" ] || curl -sSL -o "/opt/tts/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
python3 tools/build_icons.py || true
echo "setup done"
