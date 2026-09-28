"""
Food Craft AI Backend — FastAPI Application
─────────────────────────────────────────────
The central application factory that wires together:
    • CORS middleware
    • Vision router   (POST /api/detect-ingredients)
    • Recipes router  (POST /api/recommend-recipes)
    • Startup events  (load FAISS index)
    • Health endpoint  (GET /)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import vision, recipes
from app.services import retrieval_service

# ── Logging Configuration ────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    On startup: attempt to load the pre-built FAISS index from disk.
    If no index is found, the server starts but recipe search will return 503
    until the index is built via the /api/admin/build-index endpoint or CLI script.
    """
    logger.info("=" * 60)
    logger.info("  %s v%s — Starting up", settings.APP_NAME, settings.APP_VERSION)
    logger.info("=" * 60)

    # Try loading pre-built FAISS index
    loaded = retrieval_service.load_index()
    if loaded:
        logger.info("FAISS recipe index is ready for queries.")
    else:
        logger.warning(
            "No pre-built index found. Recipe search will be unavailable "
            "until you run: python -m scripts.build_index"
        )

    yield  # ── Application runs here ──

    logger.info("Shutting down %s ...", settings.APP_NAME)


# ── FastAPI App ──────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered food ingredient detection (YOLOv8) and "
        "semantic recipe retrieval (SBERT + FAISS) over 2.2M+ RecipeNLG recipes."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ────────────────────────────────────────
app.include_router(vision.router)
app.include_router(recipes.router)


# ── Root Health Check ────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "detect_ingredients": "POST /api/detect-ingredients",
            "recommend_recipes": "POST /api/recommend-recipes",
            "index_health": "GET /api/recipes/health",
        },
    }


# ── Admin: Build Index Endpoint ──────────────────────────────

@app.post("/api/admin/build-index", tags=["Admin"])
async def admin_build_index(max_recipes: int = 50_000):
    """
    Trigger FAISS index build from the Hugging Face dataset.
    WARNING: This is a long-running synchronous operation.
    For large datasets, use the CLI script instead.
    """
    logger.info("Admin triggered index build for %d recipes ...", max_recipes)
    try:
        index, meta = retrieval_service.build_index(max_recipes=max_recipes)
        return {
            "success": True,
            "indexed_recipes": index.ntotal,
            "metadata_rows": len(meta),
        }
    except Exception as exc:
        logger.error("Index build failed: %s", exc, exc_info=True)
        return {"success": False, "error": str(exc)}
