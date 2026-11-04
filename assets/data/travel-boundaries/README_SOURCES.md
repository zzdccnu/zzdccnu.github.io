# City boundary sources and licensing

`wuhan.geojson` and `xiamen.geojson` are **simplified, dissolved municipal polygons derived from** the data in the 2017-era [`Lchiffon/leafletCN`](https://github.com/Lchiffon/leafletCN) repository:

- Wuhan: `inst/geojson/420100.json`
- Xiamen: `inst/geojson/350200.json`
- Original project: Dawei Lang, `leafletCN`, **GPL-2**. Full license: `LICENSE-GPL-2.txt`.
- Processing: round vertices to 4 decimal places, simplify district rings and dissolve multiple district shapes into municipal MultiPolygons. Consequently these are **visualization-grade approximations**, not up-to-date official boundaries.

The source was originally a district-level FeatureCollection, not a high-resolution city outline. Some islands and border segments can be dated or generalized. Replace these files with appropriately licensed, more accurate GeoJSONs when available, and update this notice accordingly.

World basemap: OpenFreeMap using OpenStreetMap contributors, subject to their attribution and usage terms.

## Important usage note

This code package is an overlay for a Jekyll site, and the GPL-2 data license applies to the two example boundary derivatives. Don't claim the city polygons are official or authoritative.

## Adding a city

1. Obtain a legally reusable city boundary as WGS84 GeoJSON. Record its source, license, date and precision here, and retain any required license and attribution. Do not use an unlicensed or invented outline.
2. Install Shapely 2 in a separate Python environment and run:

   ```sh
   python3 tools/prepare-travel-boundary.py source.geojson assets/data/travel-boundaries/city.geojson --name 'City' --source 'provider, date, license'
   ```

   The script repairs invalid input, dissolves overlapping districts and simplifies with topology preservation. Its default keeps every island and hole. Inspect the original and result on a map; only use `--min-part-area` or `--min-hole-area` after inspecting the components. Areas are in square degrees and vary with latitude. The simplification tolerance is in degrees, not meters; reduce it for small or complex cities. The script reports area change and rejects antimeridian-spanning input for manual handling.
3. Add an entry to `assets/data/visited-cities.json`: a unique `id`, `name`, `country`, `countryCode`, `region`, `coordinates` in **latitude, longitude** order, `date`, `description`, `photos` and the root-relative `boundary` path. Use `demo: true` for examples. GeoJSON itself uses **longitude, latitude** order. A city without a boundary remains visible as a marker.

The existing Wuhan and Xiamen examples were already dissolved and simplified before this change; their source geometry is not included in this repository. No additional cleanup has been applied without validating the original geometry and important islands.

## Deployment and Content Security Policy

The page uses MapLibre GL JS 5.24.0 from jsDelivr and OpenFreeMap vector tiles, styles, glyphs and sprites. There is no CSP declaration in this repository; check any policy added by a hosting proxy separately. This MapLibre bundle uses a Blob worker, so an enforced policy must allow `worker-src blob:` as well as the CDN and OpenFreeMap origins for the relevant script, style, image, font and connection directives. No `unsafe-eval` is required. For a policy forbidding Blob workers, host the matching version's CSP build and worker on the site origin, configure `workerUrl`, and verify the actual response headers before deployment. A blocked network, WebGL or worker produces a visible error while the city list remains usable; this version does not include a raster fallback.
