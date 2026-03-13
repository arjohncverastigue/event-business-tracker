"""Development server entry point with reload support."""

import os
from pathlib import Path

import uvicorn


def main() -> None:
    backend_root = Path(__file__).resolve().parent

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=False,
        log_level="debug",
    )


if __name__ == "__main__":
    main()
