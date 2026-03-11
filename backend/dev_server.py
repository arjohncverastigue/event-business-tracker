"""Convenience entry point for running uvicorn with limited reload scope."""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn


def main() -> None:
    backend_root = Path(__file__).resolve().parent
    app_dir = backend_root / "app"

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
        reload_dirs=[str(app_dir)],
        reload_excludes=[
            str(backend_root / "venv"),
            "**/__pycache__/*",
            "*.pyc",
            "*.pyo",
        ],
    )


if __name__ == "__main__":
    main()
