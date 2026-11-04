# City boundary sources and licensing

`wuhan.geojson` and `xiamen.geojson` are **simplified, dissolved municipal polygons derived from** the data in the 2017-era [`Lchiffon/leafletCN`](https://github.com/Lchiffon/leafletCN) repository:

- Wuhan: `inst/geojson/420100.json`
- Xiamen: `inst/geojson/350200.json`
- Original project: Dawei Lang, `leafletCN`, **GPL-2**. Full license: `LICENSE-GPL-2.txt`.
- Processing (2026-11): repair and dissolve the original district polygons, simplify with topology preservation at 0.0002 degrees, and fill interior holes smaller than 0.0002 square degrees. The three Wuhan and two Xiamen holes in the dissolved source were small triangular gaps; filling them is a display choice, not a claim about official jurisdiction or water. All separate polygon parts were retained. Area changes relative to the dissolved source were 0.046% and 0.143%, respectively. These remain **visualization-grade approximations**, not up-to-date official boundaries.

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

The original source files are linked above. Re-check the relevant license, islands and holes before replacing or further processing these examples. Increment the boundary URL query version in the city data when changing a file to avoid stale browser caches.

## Tianditu deployment

The Footprints page uses Tianditu's base, Chinese labels and global boundary layers. Chinese city boundaries are requested from Tianditu administrative division API V2; if unavailable, the existing local GeoJSON is used with a visible notice. Cities outside China use a supplied local boundary or a marker. Preserve the source notices and the demo status. Confirm whether storing or publishing Tianditu boundary data is permitted before doing so; API responses are not written into the repository by this page.

The browser application key is configured in `assets/data/travel-config.json` at the site owner's request and is public to visitors. Use a browser-only key, restrict its allowed domains if the provider supports this, and monitor its quota. The site is static and has no server-side secret. An absent key leaves the map disabled and the city list usable.

The page loads MapLibre GL JS 5.24.0's CSP build from jsDelivr and its matching same-origin worker. The map does not require Blob workers or `unsafe-eval`; the deployed CSP must allow HTTPS connections and images from Tianditu. Verify actual response headers after deployment. Check the exact map service, current map approval number, attribution, usage terms and any requirements for the publicly displayed overlay with the provider or competent authority before publication. The demo polygons are not proof of map compliance.
