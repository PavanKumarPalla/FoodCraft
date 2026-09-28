"""
Food Craft AI Backend — Application Entry Point
─────────────────────────────────────────────────
Starts the Uvicorn ASGI server with live-reload for development.

Usage:
    python run.py
    python run.py --host 0.0.0.0 --port 8000
"""

import argparse
import uvicorn


def main():
    parser = argparse.ArgumentParser(description="Food Craft AI Backend Server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--reload", action="store_true", default=True, help="Enable auto-reload")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    args = parser.parse_args()

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level="info",
    )


if __name__ == "__main__":
    main()
