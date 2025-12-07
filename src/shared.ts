import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { GeoreferencedMap } from "@allmaps/annotation";
import { editionsById, semiSheets } from "./config.ts";
import { GcpTransformer } from "@allmaps/transform";
import {
  geometryToGeojsonGeometry,
  geojsonGeometryToGeojsonFeature,
  geojsonFeaturesToGeojsonFeatureCollection,
} from "@allmaps/stdlib";
import type { Feature } from "geojson";
import type { Canvas } from "@iiif/presentation-3";
import type { EnrichedGeoreferencedMap, Metadata } from "./types.ts";

export const loadFolderContents = async (path: string) => {
  let fileNames = await readdir(path);
  fileNames = fileNames.filter((i) => i[0] !== "." && i[0] !== "_");
  return Promise.all(
    fileNames.map((filename) => loadJson(join(path, filename)))
  );
};

export const loadJson = async (path: string) => {
  return Bun.file(path).json();
};

export const sortMaps = (
  a: EnrichedGeoreferencedMap,
  b: EnrichedGeoreferencedMap
) => {
  const sameEdition = a._meta.edition === b._meta.edition;
  const bothBis = a._meta.bis === b._meta.bis;
  if (sameEdition && !bothBis) {
    const aBis = a._meta.bis ? 1 : 0;
    const bBis = b._meta.bis ? 1 : 0;
    return aBis - bBis;
  } else if (sameEdition) {
    return a._meta.yearEnd - b._meta.yearEnd;
  } else {
    return a._meta.edition - b._meta.edition;
  }
};

export const maskToGeoJson = async (maps: GeoreferencedMap[]) => {
  const features: Feature[] = [];
  for (const map of maps) {
    // See: https://github.com/allmaps/allmaps/blob/main/apps/cli/src/commands/transform/resource-mask.ts
    const transformation = map.transformation?.type;
    const transformer = new GcpTransformer(map.gcps, transformation);
    const polygon = transformer.transformToGeo([map.resourceMask]);
    const geoJsonPolygon = geometryToGeojsonGeometry(polygon);
    const feature = geojsonGeometryToGeojsonFeature(geoJsonPolygon);
    features.push(feature);
  }
  return geojsonFeaturesToGeojsonFeatureCollection(features);
};

export const getMetadataFromCanvas = (canvas: Canvas) => {
  const metadata: Metadata = {};

  // From Manifest
  const id = canvas.id.match(/1874-\d+/)?.[0];
  if (id) {
    const editionInfo = editionsById.get(id);
    if (editionInfo) {
      metadata.edition = editionInfo.edition;
      metadata.bis = editionInfo.bis;
    }
  }

  // From Canvas Label
  const fullLabel = canvas.label?.none?.[0];
  const [number, position, type, extra] = fullLabel?.split(".") || [];
  if (type && type !== "dup") {
    metadata.type = type;
  }
  if (number && position) {
    metadata.number = parseInt(number);
    const isSemiSheet = semiSheets.includes(metadata.number);
    metadata.x = isSemiSheet
      ? 0
      : position.includes("W")
      ? -1
      : position.includes("E")
      ? 1
      : 0;
    metadata.y = position.includes("N") ? 1 : position.includes("S") ? -1 : 0;
    metadata.sheet = metadata.number === 0 ? "index" : `${number}.${position}`;
    metadata.duplicate = extra === "dup" || type === "dup";

    // From Canvas Metadata
    const years: number[] = [];
    if (canvas.metadata) {
      canvas.metadata.forEach(({ label, value }) => {
        let year = value.en?.[0];
        if (year?.includes(".")) {
          year = year.split(".")[1];
        } else if (year?.includes("[")) {
          year = year.slice(1, 5);
        }
        if (year) years.push(parseInt(year));
      });
    }
    if (years.length) {
      metadata.yearEnd = Math.max(...years);
      metadata.yearStart = Math.min(...years);
    }
  }
  return metadata;
};
