#!/usr/bin/env python3
"""Run the repository-level Naver Blog importer from this skill."""

from __future__ import annotations

import runpy
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
runpy.run_path(str(REPO_ROOT / "ops" / "import_naver_blog.py"), run_name="__main__")
