"""Production server entry point for Railway deployment."""

import os

import uvicorn


def main() -> None:
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=False,
        forwarded_allow_ips="*",
    )


if __name__ == "__main__":
    main()
