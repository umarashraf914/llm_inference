"""What this computer has free right now: memory, and the programs holding it. Standard library only, so make_4k.py
can plan a render with it and render.py can pace one (start another scene only while memory allows)."""
import os, re, subprocess, sys


def memory_gb():
    """(total memory, memory available to programs now) in GB; either is None where it cannot be read."""
    total = avail = None
    try:
        if os.name == "nt":
            import ctypes

            class MS(ctypes.Structure):
                _fields_ = [("len", ctypes.c_ulong), ("load", ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in
                            ("total", "avail", "ptotal", "pavail", "vtotal", "vavail", "xavail")]
            m = MS(); m.len = ctypes.sizeof(MS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
            return m.total / 2 ** 30, m.avail / 2 ** 30
        total = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2 ** 30
        if sys.platform == "darwin":            # free pages, and those holding cache the system gives up on demand
            out = subprocess.run(["vm_stat"], capture_output=True, text=True).stdout
            page = int(re.search(r"page size of (\d+)", out).group(1))
            avail = page * sum(map(int, re.findall(r"Pages (?:free|inactive|speculative):\s+(\d+)", out))) / 2 ** 30
        else:
            with open("/proc/meminfo") as f:
                avail = next(int(ln.split()[1]) for ln in f if ln.startswith("MemAvailable:")) / 2 ** 20
    except (OSError, ValueError, AttributeError, StopIteration):
        pass
    return total, avail


def biggest_programs(n=5):
    """[(program, GB, how many processes)] holding the most memory now, largest first; [] where it cannot be read.
    A program with many processes (a browser, an earlier render's browsers and encoders) is summed into one line."""
    use = {}
    try:
        if os.name == "nt":
            out = subprocess.run(["tasklist", "/fo", "csv", "/nh"], capture_output=True, text=True, timeout=20).stdout
            for row in re.findall(r'^"([^"]*)","\d+","[^"]*","[^"]*","([^"]*)"', out, re.M):
                kb = int(re.sub(r"\D", "", row[1]) or 0)     # "123,456 K", digits grouped by the locale's separator
                name = row[0]
                gb, k = use.get(name, (0.0, 0))
                use[name] = (gb + kb / 2 ** 20, k + 1)
        else:
            out = subprocess.run(["ps", "-axo", "rss=,comm="], capture_output=True, text=True, timeout=20).stdout
            for ln in out.splitlines():
                kb, _, cmd = ln.strip().partition(" ")
                if kb.isdigit():
                    name = os.path.basename(cmd.strip())
                    gb, k = use.get(name, (0.0, 0))
                    use[name] = (gb + int(kb) / 2 ** 20, k + 1)
    except (OSError, subprocess.SubprocessError, ValueError):
        return []
    return sorted(((name, gb, k) for name, (gb, k) in use.items()), key=lambda r: -r[1])[:n]


def process_alive(pid):
    """Is a process with this id running now? (False where it cannot be told.)"""
    try:
        if os.name == "nt":
            out = subprocess.run(["tasklist", "/fi", f"PID eq {pid}", "/fo", "csv", "/nh"], capture_output=True,
                                 text=True, timeout=20).stdout
            return f'"{pid}"' in out
        os.kill(pid, 0)
        return True
    except PermissionError:                     # it exists, under another user
        return True
    except (OSError, subprocess.SubprocessError):
        return False
