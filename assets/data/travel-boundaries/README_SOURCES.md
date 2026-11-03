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
