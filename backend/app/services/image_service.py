"""
Food Craft AI — Image Service (Wikipedia + Pollinations AI Fallback)
────────────────────────────────────────────────────────────────────
Fetches a high-quality food image for any recipe title.

Strategy:
    1. Query Wikipedia REST API for a page summary with a thumbnail.
    2. If Wikipedia returns a valid image, use it.
    3. Otherwise, construct a Pollinations AI generative image URL.
"""

import logging
import urllib.parse

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Timeout for external API calls (seconds) ─────────────────
_HTTP_TIMEOUT = 5


def get_recipe_image(recipe_name: str) -> dict:
    """
    Fetch the best available image URL for a recipe.

    Returns:
        {
            "url": "https://...",
            "source": "wikipedia" | "pollinations",
            "alt": "Recipe Name"
        }
    """
    # Attempt 1: Wikipedia
    wiki_url = _try_wikipedia(recipe_name)
    if wiki_url:
        logger.info("Wikipedia image found for '%s'", recipe_name)
        return {
            "url": wiki_url,
            "source": "wikipedia",
            "alt": recipe_name,
        }

    # Attempt 2: Pollinations AI (always succeeds — generative)
    poll_url = _build_pollinations_url(recipe_name)
    logger.info("Using Pollinations AI fallback for '%s'", recipe_name)
    return {
        "url": poll_url,
        "source": "pollinations",
        "alt": recipe_name,
    }


def get_batch_images(recipe_names: list[str]) -> list[dict]:
    """Fetch images for a batch of recipe titles."""
    return [get_recipe_image(name) for name in recipe_names]


# ─────────────────────────────────────────────────────────────
# Wikipedia Media API
# ─────────────────────────────────────────────────────────────

def _try_wikipedia(recipe_name: str) -> str | None:
    """
    Query the Wikipedia REST API for a page summary.
    Returns the thumbnail/original image URL, or None if unavailable.
    """
    try:
        encoded = urllib.parse.quote(recipe_name.replace(" ", "_"), safe="")
        url = f"{settings.WIKIPEDIA_API_URL}/{encoded}"

        response = requests.get(
            url,
            headers={"User-Agent": "FoodCraftAI/1.0 (contact: foodcraft975@gmail.com)"},
            timeout=_HTTP_TIMEOUT,
        )

        if response.status_code != 200:
            return None

        data = response.json()

        # Prefer originalimage, then thumbnail
        if "originalimage" in data and "source" in data["originalimage"]:
            return data["originalimage"]["source"]
        if "thumbnail" in data and "source" in data["thumbnail"]:
            return data["thumbnail"]["source"]

    except (requests.RequestException, ValueError, KeyError) as exc:
        logger.debug("Wikipedia API error for '%s': %s", recipe_name, exc)

    return None


# ─────────────────────────────────────────────────────────────
# Pollinations AI (Generative Fallback)
# ─────────────────────────────────────────────────────────────

def _build_pollinations_url(recipe_name: str) -> str:
    """
    Build a Pollinations AI image generation URL.
    The image is generated on-the-fly when the URL is loaded.
    """
    prompt = f"professional food photography of {recipe_name}, plated beautifully, soft lighting, top down angle"
    encoded_prompt = urllib.parse.quote(prompt, safe="")
    return (
        f"{settings.POLLINATIONS_URL}/{encoded_prompt}"
        f"?width={settings.POLLINATIONS_WIDTH}"
        f"&height={settings.POLLINATIONS_HEIGHT}"
        f"&nologo=true"
    )
