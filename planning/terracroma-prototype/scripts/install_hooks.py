#!/usr/bin/env python3
"""Install this repository's local progress-maintenance hook."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
subprocess.run(["git", "-C", str(root), "rev-parse", "--show-toplevel"], check=True, capture_output=True)
subprocess.run(["git", "-C", str(root), "config", "core.hooksPath", ".githooks"], check=True)
print("Installed .githooks as the Git hooks directory.")
