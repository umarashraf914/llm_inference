@echo off
rem Render a film in 4K on this computer, saved in the rendered folder. Double-click or: make_film v01
rem Updates from GitHub first; video\tools\make_4k.py --help lists the options.
cd /d "%~dp0"
git pull --ff-only || echo (Could not update from GitHub; rendering the copy on this computer.)
where py >nul 2>nul
if %errorlevel%==0 (py video\tools\make_4k.py %*) else (python video\tools\make_4k.py %*)
pause
