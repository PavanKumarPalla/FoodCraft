"""
CLI runner for Food Craft YOLOv8 ingredient detection.
Used by Node.js backend when FastAPI daemon is not yet running.
Usage:
    python -m backend.scripts.detect_cli <path_to_image_or_base64_file> [confidence]
"""

import sys
import json
import base64
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services import vision_service

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No input provided"}))
        sys.exit(1)

    input_arg = sys.argv[1]
    conf = float(sys.argv[2]) if len(sys.argv) > 2 else 0.20

    try:
        p = Path(input_arg)
        if p.exists() and p.is_file():
            # Could be binary image or text file containing base64
            with open(p, "rb") as f:
                content = f.read()
            if input_arg.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
                b64_str = base64.b64encode(content).decode("utf-8")
            else:
                b64_str = content.decode("utf-8", errors="ignore").strip()
        else:
            b64_str = input_arg

        result = vision_service.detect_ingredients(b64_str, confidence_threshold=conf)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
