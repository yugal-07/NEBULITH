"""Download public planetary color sources and build local Web Mercator XYZ JPEG tiles.

GDAL is not installed in the project environment. This script performs the
equirectangular-to-Web-Mercator warp with NumPy sampling and Pillow encoding.
"""

from __future__ import annotations

import argparse
import asyncio
import io
import math
import tempfile
from pathlib import Path

import httpx
import numpy as np
from PIL import Image

MOON_SOURCE = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif"
MARS_TILE_TEMPLATE = (
    "https://tiles.arcgis.com/tiles/lqRTrQp2HrfnJt8U/arcgis/rest/services/"
    "mars_viking_mosaic/MapServer/tile/5/{row}/{col}"
)
TILE_SIZE = 256
MAX_ZOOM = 5


async def download_moon_source(path: Path) -> None:
    async with httpx.AsyncClient(timeout=180, follow_redirects=True) as client:
        response = await client.get(MOON_SOURCE, headers={"User-Agent": "NEBULITH local map tile builder"})
        response.raise_for_status()
    path.write_bytes(response.content)


async def download_mars_source(path: Path, cache_dir: Path) -> None:
    """Reconstruct the 2:1 equirectangular image from USGS MarsEC0 LOD 5 tiles.

    The ArcGIS service tile matrix is square, but the Mars 2000 equidistant-
    cylindrical coverage spans rows 8 through 23 at level 5, yielding 8192x4096.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    coords = [(row, col) for row in range(8, 24) for col in range(32)]
    semaphore = asyncio.Semaphore(16)

    async with httpx.AsyncClient(timeout=45, follow_redirects=True, limits=httpx.Limits(max_connections=16)) as client:
        async def get_tile(row: int, col: int) -> tuple[int, int, bytes]:
            cached = cache_dir / f"{row}-{col}.png"
            if cached.is_file():
                return row, col, cached.read_bytes()
            async with semaphore:
                response = await client.get(
                    MARS_TILE_TEMPLATE.format(row=row, col=col),
                    headers={"User-Agent": "NEBULITH local map tile builder"},
                )
            response.raise_for_status()
            cached.write_bytes(response.content)
            return row, col, response.content

        tiles = await asyncio.gather(*(get_tile(row, col) for row, col in coords))

    mosaic = Image.new("RGB", (8192, 4096))
    for row, col, data in tiles:
        tile = Image.open(io.BytesIO(data)).convert("RGB")
        if tile.size != (TILE_SIZE, TILE_SIZE):
            raise ValueError(f"USGS Mars source tile {row}/{col} has unexpected size {tile.size}")
        mosaic.paste(tile, (col * TILE_SIZE, (row - 8) * TILE_SIZE))
    mosaic.save(path, format="TIFF", compression="tiff_lzw")


def warp_xyz(source_path: Path, output_dir: Path) -> int:
    source = np.asarray(Image.open(source_path).convert("RGB"), dtype=np.uint8)
    source_height, source_width, _ = source.shape
    output_dir.mkdir(parents=True, exist_ok=True)

    tile_axis = np.arange(TILE_SIZE, dtype=np.float64) + 0.5
    written = 0
    for zoom in range(MAX_ZOOM + 1):
        world_size = TILE_SIZE * (2**zoom)
        for x in range(2**zoom):
            world_x = x * TILE_SIZE + tile_axis
            longitude = world_x / world_size * 360.0 - 180.0
            source_x = np.mod((longitude + 180.0) / 360.0 * source_width - 0.5, source_width)
            x0 = np.floor(source_x).astype(np.int64)
            x1 = (x0 + 1) % source_width
            fx = (source_x - x0)[None, :, None]

            for y in range(2**zoom):
                world_y = y * TILE_SIZE + tile_axis
                mercator_y = world_y / world_size
                latitude = np.degrees(np.arctan(np.sinh(np.pi * (1.0 - 2.0 * mercator_y))))
                source_y = np.clip((90.0 - latitude) / 180.0 * source_height - 0.5, 0, source_height - 1)
                y0 = np.floor(source_y).astype(np.int64)
                y1 = np.minimum(y0 + 1, source_height - 1)
                fy = (source_y - y0)[:, None, None]

                top_left = source[y0[:, None], x0[None, :]].astype(np.float32)
                top_right = source[y0[:, None], x1[None, :]].astype(np.float32)
                bottom_left = source[y1[:, None], x0[None, :]].astype(np.float32)
                bottom_right = source[y1[:, None], x1[None, :]].astype(np.float32)
                top = top_left * (1.0 - fx) + top_right * fx
                bottom = bottom_left * (1.0 - fx) + bottom_right * fx
                rgb = np.clip(top * (1.0 - fy) + bottom * fy, 0, 255).astype(np.uint8)

                path = output_dir / str(zoom) / str(x) / f"{y}.jpg"
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(rgb, mode="RGB").save(path, format="JPEG", quality=80, optimize=True)
                written += 1
    return written


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("public/tiles"))
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="nebulith-map-sources-") as temp:
        work = Path(temp)
        moon_source = work / "moon-lroc-color-8k.tif"
        mars_source = work / "mars-viking-mdim21-8k.tif"
        await download_moon_source(moon_source)
        await download_mars_source(mars_source, work / "usgs-mars-z5-cache")
        moon_count = warp_xyz(moon_source, args.output / "moon")
        mars_count = warp_xyz(mars_source, args.output / "mars")
        print(f"Moon: {moon_count} JPEG tiles, source={Image.open(moon_source).size}")
        print(f"Mars: {mars_count} JPEG tiles, source={Image.open(mars_source).size}")


if __name__ == "__main__":
    asyncio.run(main())
