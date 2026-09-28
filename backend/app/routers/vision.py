"""
Food Craft AI — Vision Router
──────────────────────────────
POST /api/detect-ingredients

Accepts a base64-encoded image, runs YOLOv8 inference,
and returns detected food ingredient labels.
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import vision_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Vision"])


# ── Request / Response Schemas ───────────────────────────────

class DetectRequest(BaseModel):
    """Payload for ingredient detection."""
    image: str = Field(
        ...,
        description="Base64-encoded image (with or without data URI prefix)",
    )
    confidence: float | None = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold (0-1). Uses server default if omitted.",
    )

    model_config = {"json_schema_extra": {"examples": [{"image": "data:image/jpeg;base64,/9j/4AAQ..."}]}}


class BoxCoords(BaseModel):
    x: float = Field(..., description="Left offset in percentage of image width")
    y: float = Field(..., description="Top offset in percentage of image height")
    w: float = Field(..., description="Box width in percentage of image width")
    h: float = Field(..., description="Box height in percentage of image height")


class DetectionItem(BaseModel):
    name: str
    confidence: str
    confidence_raw: float
    color: str = "#10b981"
    box: BoxCoords
    bbox_pixels: list[float] = Field(default_factory=list)


class DetectResponse(BaseModel):
    success: bool
    detected_ingredients: list[DetectionItem]
    unique_ingredients: list[str]
    count: int
    model: str
    message: str | None = None


# ── Endpoint ─────────────────────────────────────────────────

@router.post(
    "/detect-ingredients",
    response_model=DetectResponse,
    summary="Detect food ingredients from an image",
    description="Upload a base64-encoded image and receive a list of detected food ingredients with confidence scores.",
)
async def detect_ingredients(payload: DetectRequest):
    try:
        result = vision_service.detect_ingredients(
            image_base64=payload.image,
            confidence_threshold=payload.confidence,
        )
        return result
    except Exception as exc:
        logger.error("Vision detection failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(exc)}")
