import { readdir } from "node:fs/promises";
import {
  parseAnnotation,
  generateAnnotation,
  type GeoreferencedMap,
} from "@allmaps/annotation";
import { generateId } from "@allmaps/id";
import {
  baseMapping,
  baseUrl,
  editionsById,
  labels,
  outputFolder,
  semiSheets,
  sheetPostions,
  sheetTypes,
} from "./config";
import { GcpTransformer } from "@allmaps/transform";
import {
  geometryToGeojsonGeometry,
  geojsonGeometryToGeojsonFeature,
  geojsonFeaturesToGeojsonFeatureCollection,
} from "@allmaps/stdlib";
import { Vault, type NormalizedEntity } from "@iiif/helpers";
import { IIIFBuilder } from "@iiif/builder";
import type { Feature } from "geojson";
import type { Canvas, Manifest, Range } from "@iiif/presentation-3";
import type { EnrichedGeoreferencedMap } from "./types.ts";

// Parse all annotation pages as single array of map objects
export const getMaps = async () => {
  const path = "./content/annotations/";
  let fileNames = await readdir(path);
  fileNames = fileNames.filter((i) => i[0] !== ".");
  const annotationPages = await Promise.all(
    fileNames.map((filename: string) => Bun.file(path + filename).json())
  );
  const maps = annotationPages.map(parseAnnotation).flat();
  console.log("Maps parsed:", maps.length);
  return maps as GeoreferencedMap[];
};

export const getVersions = async () => {
  const path = "./content/allmaps-versions.json";
  const json = await Bun.file(path).json();
  return new Map(json) as Map<string, string>;
};

export const groupMapsByImageId = async (maps: GeoreferencedMap[]) => {
  const imageIds: Map<string, GeoreferencedMap[]> = new Map();
  for (const map of maps) {
    const id = await generateId(map.resource.id);
    const hasMaps = imageIds.get(id);
    if (hasMaps) {
      console.log("ID with multiple maps:", id);
      hasMaps.push(map);
    } else {
      imageIds.set(id, [map]);
    }
  }
  console.log("Unique IDs count:", imageIds.size);
  return imageIds;
};

export const groupCanvasesByImageId = async (canvases: Canvas[]) => {
  return Promise.all(
    canvases.map(async (canvas) => {
      const imageId =
        canvas.items?.[0]?.items?.[0]?.body?.service?.[0]?.id || undefined;
      const id = await generateId(imageId);
      return [id, canvas];
    })
  ).then((arr) => new Map(arr) as Map<string, Canvas>);
};

const sortMaps = (a: EnrichedGeoreferencedMap, b: EnrichedGeoreferencedMap) => {
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

export const writeAnnotations = async (
  maps: Map<string, EnrichedGeoreferencedMap[]>,
  writeMask: boolean = true
) => {
  let count = 0;
  const annotationPath = `${outputFolder}/annotations/`;
  const geoJsonPath = `${outputFolder}/geojson/`;
  for (const [id, map] of maps) {
    // Write annotation
    const annotationFile = Bun.file(annotationPath + id + ".json");
    await Bun.write(
      annotationFile,
      JSON.stringify(generateAnnotation(map), null, 2)
    );
    if (writeMask) {
      // Write GeoJSON of mask
      const geoJson = await maskToGeoJson(map);
      const geoJsonFile = Bun.file(geoJsonPath + id + ".geojson");
      await Bun.write(geoJsonFile, JSON.stringify(geoJson, null, 2));
    }
    count++;
  }
  console.log("Annotations written:", count);
  if (writeMask) {
    console.log("GeoJSONs written:", count);
  }
  // Single files with all maps and annotations
  const sortedMaps = maps.values().toArray().flat().sort(sortMaps);
  const sortedAnnotations = generateAnnotation(sortedMaps);
  const mapsFile = Bun.file(outputFolder + "maps.json");
  const annotationsFile = Bun.file(outputFolder + "annotations.json");
  await Bun.write(mapsFile, JSON.stringify(sortedMaps, null, 2));
  await Bun.write(annotationsFile, JSON.stringify(sortedAnnotations, null, 2));
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

export const writeManifests = async (manifests: Map<string, Manifest>) => {
  let count = 0;
  const path = `${outputFolder}/manifests/`;
  const vault = new Vault();
  for (const [id, manifest] of manifests) {
    const normalizedManifest = (await vault.load(
      id,
      manifest
    )) as NormalizedEntity;
    const json = vault.toPresentation3(normalizedManifest);
    const file = Bun.file(path + id + "/manifest.json");
    await Bun.write(file, JSON.stringify(json, null, 2));
    count++;
  }
  console.log("Manifests written:", count);
};

// Get manifests
export const getManifests = async () => {
  const path = "./content/iiif-manifests/";
  let fileNames = await readdir(path);
  fileNames = fileNames.filter((i) => i[0] !== "." && i[0] !== "_");
  const manifests = await Promise.all(
    fileNames.map((filename: string) => Bun.file(path + filename).json())
  );
  return manifests as Manifest[];
};

export const getMetadataFromCanvas = (canvas: Canvas) => {
  // From Manifest
  const id = canvas.id.match(/1874-\d+/)?.[0];
  let edition, bis;
  if (id) {
    const editionInfo = editionsById.get(id);
    if (editionInfo) {
      edition = editionInfo.edition;
      bis = editionInfo.bis;
    }
  }

  // From Canvas Label
  const fullLabel = canvas.label?.none?.[0];
  let [number, position, type, extra] = fullLabel?.split(".") || [];
  if (number && position) {
    const parsedNumber = +number;
    const isSemiSheet = semiSheets.includes(parsedNumber);
    const x = isSemiSheet
      ? 0
      : position.includes("W")
      ? -1
      : position.includes("E")
      ? 1
      : 0;
    const y = position.includes("N") ? 1 : position.includes("S") ? -1 : 0;
    const sheet = parsedNumber === 0 ? "index" : `${number}.${position}`;
    const duplicate = extra === "dup" || type === "dup";

    // From Canvas Metadata
    const years: number[] = [];
    if (canvas.metadata) {
      canvas.metadata.forEach(({ label, value }) => {
        // const key = label.en[0];
        const year = value.en?.[0];
        // meta[key] = year;
        if (year) {
          years.push(
            year.includes(".")
              ? +year.split(".")[1]
              : year.includes("[")
              ? +year.slice(1, 5)
              : +year
          );
        }
      });
    }
    const yearEnd = years.length ? Math.max(...years) : undefined;
    const yearStart = years.length ? Math.min(...years) : undefined;

    return {
      // manifest: id,
      // fullLabel,
      sheet,
      edition,
      bis,
      number: parsedNumber,
      position,
      x,
      y,
      type,
      yearStart,
      yearEnd,
      // duplicate
    };
  } else
    return {
      sheet: 0,
    };
};

export const addMetadataToCanvas = async (
  canvas: Canvas,
  maps: Map<string, GeoreferencedMap[]>,
  versions: Map<string, string>
) => {
  const metadata = getMetadataFromCanvas(canvas);
  if (metadata && metadata.sheet !== "index") {
    const { sheet, number, position, yearEnd, type } = metadata;
    if (yearEnd) {
      canvas.navDate = new Date(Date.parse(yearEnd.toString())).toISOString();
    }
    let parsedPosition;
    if (position) {
      parsedPosition = sheetPostions[position] || "";
    }
    const sheetTitle = baseMapping.find((i) => i.number === number);
    if (sheetTitle) {
      const label =
        sheetTitle.name + (parsedPosition ? " " + parsedPosition : "");
      canvas.label = {
        nl: [label],
      };
    }
    if (!canvas.metadata) {
      canvas.metadata = [];
    }
    canvas.metadata.forEach(({ label, value }) => {
      const labelValue = label.en?.[0];
      if (labelValue) {
        label.en[0] = labels[labelValue];
      }
    });
    if (type) {
      const sheetType = sheetTypes[type];
      if (sheetType) {
        canvas.metadata.unshift({
          label: { nl: ["Type"] },
          value: { nl: [sheetType] },
        });
      }
    }
    if (number && parsedPosition) {
      canvas.metadata.unshift(
        {
          label: { nl: ["Bladnummer"] },
          value: { nl: [number.toString()] },
        },
        {
          label: { nl: ["Positie"] },
          value: { nl: [parsedPosition] },
        }
      );
    }
  } else if (metadata && metadata.sheet === "index" && metadata.position) {
    const label =
      metadata.position?.charAt(0).toLocaleUpperCase() +
      metadata.position?.slice(1);

    canvas.label = {
      nl: [label],
    };
  }
  // Add reference to Georeference Annotation and GeoJSON mask to canvas
  const imageId =
    canvas.items?.[0]?.items?.[0]?.body?.service?.[0]?.id || undefined;
  const id = await generateId(imageId);
  const version = versions.get(id);
  const mapsFound = maps.get(id);
  if (mapsFound && version) {
    canvas.annotations = [
      {
        // id: `${baseUrl}annotations/${id}.json`,
        id: `https://annotations.allmaps.org/images/${id}@${version}`,
        type: "AnnotationPage",
        purpose: "georeferencing",
        label: {
          en: ["Georeference Annotation"],
        },
      },
    ];
    const featureCollection = await maskToGeoJson(mapsFound);
    canvas.navPlace = featureCollection;
    // canvas.navPlace = {
    //   // id: `${baseUrl}geojson/${id}.json`,
    //   id: `https://annotations.allmaps.org/images/${id}@${version}.geojson`,
    //   type: "FeatureCollection",
    // };
  } else if (metadata.sheet !== "index" && metadata.type !== "B") {
    console.log("No map found for", imageId);
  }
};

export const groupCanvasesBySheet = (canvases: Canvas[]) => {
  const numbers = new Map();
  // Ordering canvases per sheet to create ranges
  for (const canvas of canvases) {
    const metadata = getMetadataFromCanvas(canvas);
    const { sheet } = metadata;
    const sheetsForNumber = numbers.get(sheet);
    if (sheetsForNumber) {
      sheetsForNumber.push(canvas);
    } else {
      numbers.set(sheet, [canvas]);
    }
  }
  return numbers;
};

export const createRanges = (
  groupedCanvases: Map<string, Canvas[]>,
  baseUri: string
) => {
  const ranges: Range[] = [];
  groupedCanvases.forEach((canvases, sheet) => {
    const label =
      sheet === "index"
        ? "Bladwijzer"
        : sheet.includes(".O")
        ? `Blad ${sheet.split(".")[0]}`
        : `Blad ${sheet}`;
    const range = {
      id: `${baseUri}/range/p${sheet}`,
      type: "Range",
      label: {
        nl: [label],
      },
      items: canvases.map((canvas) => ({ id: canvas.id, type: "Canvas" })),
    };
    ranges.push(range as Range);
  });
  return ranges;
};

export const writeCollection = async () => {
  const builder = new IIIFBuilder();
  const id = baseUrl + "collection.json";
  const label = "Waterstaatskaart";
  // Collection
  const normalizedCollection = builder.createCollection(id, (collection) => {
    collection.addLabel(label, "nl");
    for (const [id, { edition, bis }] of editionsById) {
      const uri = `${baseUrl}manifests/${id}/manifest.json`;
      collection.createManifest(uri, (manifest) => {
        const label = `Editie ${edition}${bis ? " BIS" : ""}`;
        manifest.addLabel(label, "nl");
      });
    }
  });
  const collection = builder.toPresentation3(normalizedCollection);
  const file = Bun.file(outputFolder + "collection.json");
  await Bun.write(file, JSON.stringify(collection, null, 2));
};
