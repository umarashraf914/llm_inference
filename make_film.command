#!/bin/bash
# Render a film in 4K on this computer, saved in the rendered folder. Double-click in Finder or: ./make_film.command v01
# Updates from GitHub first; video/tools/make_4k.py --help lists the options.
cd "$(dirname "$0")" || exit 1
git pull --ff-only || echo "(Could not update from GitHub; rendering the copy on this computer.)"
# Finder starts this without the shell's PATH, so look for a Python where the usual installers put one
for py in "$HOME/anaconda3/bin/python3" /opt/anaconda3/bin/python3 "$HOME/miniconda3/bin/python3" \
          /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
  command -v "$py" >/dev/null 2>&1 && exec "$py" video/tools/make_4k.py "$@"
done
echo "Python 3 not found: install it from python.org, then double-click this again."
