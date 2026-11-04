#!/usr/bin/env python3
"""Dissolve and simplify a WGS84 city boundary; requires Shapely 2.x."""
import argparse
import json
from pathlib import Path

from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid


def polygons(geometry):
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, (MultiPolygon, GeometryCollection)):
        return [p for part in geometry.geoms for p in polygons(part)]
    return []


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='WGS84 GeoJSON source')
    parser.add_argument('output', type=Path)
    parser.add_argument('--name', required=True)
    parser.add_argument('--source', required=True, help='Source, date and license')
    parser.add_argument('--tolerance', type=float, default=0.001, help='Simplification in degrees (default 0.001)')
    parser.add_argument('--min-part-area', type=float, default=0, help='Remove parts smaller than this area in square degrees (default keeps all)')
    parser.add_argument('--min-hole-area', type=float, default=0, help='Remove holes smaller than this area in square degrees (default keeps all)')
    args = parser.parse_args()
    if min(args.tolerance, args.min_part_area, args.min_hole_area) < 0:
        parser.error('Parameters must be non-negative')
    data = json.loads(args.input.read_text())
    if data.get('crs'):
        parser.error('Reproject to WGS84 and remove the legacy crs member before processing')
    features = data['features'] if data['type'] == 'FeatureCollection' else [data]
    parts = []
    for feature in features:
        geom = shape(feature.get('geometry', feature))
        if geom.bounds and (geom.bounds[0] < -180 or geom.bounds[2] > 180 or geom.bounds[1] < -90 or geom.bounds[3] > 90 or geom.bounds[2] - geom.bounds[0] > 180):
            parser.error('Coordinates are outside WGS84 or cross the antimeridian; inspect/reproject first')
        parts.extend(polygons(make_valid(geom)))
    if not parts:
        parser.error('No polygon geometries found')
    merged = unary_union(parts)
    simplified = merged.simplify(args.tolerance, preserve_topology=True)
    kept = []
    for part in polygons(simplified):
        if part.area < args.min_part_area:
            continue
        holes = [ring.coords for ring in part.interiors if Polygon(ring).area >= args.min_hole_area]
        kept.append(Polygon(part.exterior.coords, holes))
    result = unary_union(kept)
    if result.is_empty or not result.is_valid or not polygons(result):
        parser.error('Result is empty or invalid; inspect the input and parameters')
    args.output.write_text(json.dumps({'type': 'Feature', 'properties': {'name': args.name, 'source': args.source}, 'geometry': mapping(result)}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'parts: {len(parts)} -> {len(polygons(result))}; area change: {(result.area / merged.area - 1) * 100:.3f}%; valid: {result.is_valid}')


if __name__ == '__main__':
    main()
