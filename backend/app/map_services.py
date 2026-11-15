from __future__ import annotations

import asyncio
import io
import math
from pathlib import Path

import httpx
from PIL import Image

TILE_SIZE = 256
EARTH_CIRCUMFERENCE_M = 40_075_016.686
DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "map-cache"

TERRARIUM_BASE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium"
TRANSPARENT_PNG = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))


def terrarium_height(pixel: tuple[int, int, int]) -> float:
    red, green, blue = pixel
    return red * 256 + green + blue / 256 - 32768


def tile_for(lon: float, lat: float, zoom: int) -> tuple[int, int, int, int]:
    count = 2**zoom
    x_float = (lon + 180) / 360 * count
    lat_rad = math.radians(max(-85.05112878, min(85.05112878, lat)))
    y_float = (1 - math.asinh(math.tan(lat_rad)) / math.pi) / 2 * count
    x_pixel = min(count * TILE_SIZE - 1, max(0, math.floor(x_float * TILE_SIZE)))
    y_pixel = min(count * TILE_SIZE - 1, max(0, math.floor(y_float * TILE_SIZE)))
    return x_pixel // TILE_SIZE, y_pixel // TILE_SIZE, x_pixel % TILE_SIZE, y_pixel % TILE_SIZE


async def _fetch_cached(url: str, cache_path: Path) -> bytes:
    if cache_path.is_file():
        return cache_path.read_bytes()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "NEBULITH/0.1"})
    response.raise_for_status()
    cache_path.write_bytes(response.content)
    return response.content


async def terrarium_pixel(lon: float, lat: float, zoom: int = 12) -> float | None:
    x, y, pixel_x, pixel_y = tile_for(lon, lat, zoom)
    url = f"{TERRARIUM_BASE}/{zoom}/{x}/{y}.png"
    cache_path = DATA_DIR / "terrarium" / str(zoom) / str(x) / f"{y}.png"
    try:
        content = await _fetch_cached(url, cache_path)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return None
        raise
    image = Image.open(io.BytesIO(content)).convert("RGBA")
    red, green, blue, alpha = image.getpixel((pixel_x, pixel_y))
    if alpha == 0:
        return None
    return terrarium_height((red, green, blue))


async def sample_terrarium(lon: float, lat: float, zoom: int = 12) -> dict:
    center = await terrarium_pixel(lon, lat, zoom)
    if center is None:
        return {"elevation_m": None, "slope_degrees": None, "terrain_class": None, "coverage_status": "not_available", "source": "Terrarium elevation tiles (AWS)"}

    count = 2**zoom * TILE_SIZE
    world_y = (1 - math.asinh(math.tan(math.radians(max(-85.05112878, min(85.05112878, lat))))) / math.pi) / 2 * count
    lat_north = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (world_y - 1) / count))))
    lat_south = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (world_y + 1) / count))))
    lon_delta = 360 / count
    points = await asyncio.gather(
        terrarium_pixel(lon - lon_delta, lat, zoom),
        terrarium_pixel(lon + lon_delta, lat, zoom),
        terrarium_pixel(lon, lat_north, zoom),
        terrarium_pixel(lon, lat_south, zoom),
    )
    if any(value is None for value in points):
        return {"elevation_m": center, "slope_degrees": None, "terrain_class": None, "coverage_status": "partial", "source": "Terrarium elevation tiles (AWS)"}

    west, east, north, south = points
    resolution_m = max(0.1, EARTH_CIRCUMFERENCE_M * math.cos(math.radians(lat)) / count)
    gradient_x = (east - west) / (2 * resolution_m)
    gradient_y = (south - north) / (2 * resolution_m)
    slope = math.degrees(math.atan(math.hypot(gradient_x, gradient_y)))
    terrain_class = "Low relief" if slope < 3 else "Rolling" if slope < 8 else "Steep" if slope < 20 else "Very steep"
    return {"elevation_m": round(center, 1), "slope_degrees": round(slope, 1), "terrain_class": terrain_class, "coverage_status": "available", "source": "Terrarium elevation tiles (AWS)", "zoom": zoom, "processing_version": "central-difference-v1"}


