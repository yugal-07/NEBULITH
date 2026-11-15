# Planetary tile attribution and source terms

## Moon

- Source: NASA Scientific Visualization Studio, CGI Moon Kit, `lroc_color_poles_8k.tif` (LRO/LROC WAC color mosaic), https://svs.gsfc.nasa.gov/4720/ and https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- Credit: NASA/GSFC Scientific Visualization Studio; Ernie Wright; Lunar Reconnaissance Orbiter / LROC.
- NASA-produced content is generally public domain in the United States. NASA identification and logos are not included. NASA does not endorse NEBULITH.

## Mars

- Source: USGS Astrogeology Science Center, Viking MDIM 2.1 Colorized Global Mosaic, 232 m/pixel, Mars 2000 equidistant-cylindrical map service, https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m
- Tile endpoint used to reconstruct the 8192 × 4096 global image: https://tiles.arcgis.com/tiles/lqRTrQp2HrfnJt8U/arcgis/rest/services/mars_viking_mosaic/MapServer/tile/5/{row}/{col}
- The USGS catalog identifies the map as public domain with no use constraints. Credit: USGS Astrogeology Science Center; NASA / JPL; Viking MDIM 2.1.

The files in `moon/` and `mars/` are derived XYZ Web Mercator JPEG tiles, generated locally at zoom levels 0–5 with JPEG quality 80. They are visual basemaps and are not elevation or scientific analysis products.
