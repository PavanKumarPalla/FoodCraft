"""
Food Craft AI — Recipes Router
────────────────────────────────
POST /api/recommend-recipes   → Semantic ingredient-based recipe retrieval
GET  /api/recipes/health      → Index health check
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import retrieval_service, image_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Recipes"])


# ── Request / Response Schemas ───────────────────────────────

class RecommendRequest(BaseModel):
    """Payload for recipe recommendation."""
    ingredients: list[str] = Field(
        ...,
        min_length=1,
        description="List of ingredient names detected or entered by the user.",
    )
    top_k: int | None = Field(
        None,
        ge=1,
        le=100,
        description="Number of recipes to return (default: 20).",
    )
    include_images: bool = Field(
        True,
        description="Whether to fetch images for each recipe.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ingredients": ["chicken", "garlic", "onion", "tomato"],
                    "top_k": 10,
                    "include_images": True,
                }
            ]
        }
    }


class RecipeResult(BaseModel):
    rank: int
    title: str
    ingredients: list[str]
    directions: list[str]
    ner_tags: list[str]
    similarity_score: float
    image: dict | None = None


class RecommendResponse(BaseModel):
    success: bool
    query_ingredients: list[str]
    total_results: int
    recipes: list[RecipeResult]


class IndexHealthResponse(BaseModel):
    index_loaded: bool
    total_vectors: int
    total_metadata_rows: int


# ── Endpoints ────────────────────────────────────────────────

@router.post(
    "/recommend-recipes",
    response_model=RecommendResponse,
    summary="Get recipe recommendations from ingredients",
    description="Provide a list of ingredient names and receive semantically matched recipes ranked by relevance.",
)
async def recommend_recipes(payload: RecommendRequest):
    if not retrieval_service.is_index_ready():
        raise HTTPException(
            status_code=503,
            detail="Recipe index is not loaded. Please build the index first.",
        )

    try:
        results = retrieval_service.search_recipes(
            ingredients=payload.ingredients,
            top_k=payload.top_k,
        )

        # Attach images if requested
        if payload.include_images:
            for recipe in results:
                recipe["image"] = image_service.get_recipe_image(recipe["title"])

        return {
            "success": True,
            "query_ingredients": payload.ingredients,
            "total_results": len(results),
            "recipes": results,
        }

    except Exception as exc:
        logger.error("Recipe recommendation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(exc)}")


@router.get(
    "/recipes/health",
    response_model=IndexHealthResponse,
    summary="Check recipe index health",
    description="Returns whether the FAISS index is loaded and how many recipes are indexed.",
)
async def index_health():
    loaded = retrieval_service.is_index_ready()

    if loaded and retrieval_service._faiss_index is not None and retrieval_service._recipe_metadata is not None:
        return {
            "index_loaded": True,
            "total_vectors": retrieval_service._faiss_index.ntotal,
            "total_metadata_rows": len(retrieval_service._recipe_metadata),
        }

    return {
        "index_loaded": False,
        "total_vectors": 0,
        "total_metadata_rows": 0,
    }
