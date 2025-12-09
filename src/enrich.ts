import {
  manualCorrections,
  sheetPostions,
  baseMapping,
  labels,
  sheetTypes,
  baseUrl,
  iiifBaseUrl,
} from "./config";

import type { EnrichedGeoreferencedMap, MapsWithMeta } from "./types";
import type { Manifest, Range } from "@iiif/presentation-3";

export function enrichMaps(item: MapsWithMeta, id: string) {
  const {
    annotations,
    canvas,
    metadata,
    imageInformation,
    manifestId,
    sprite,
    allmapsVersion,
    geojson,
  } = item;

  if (annotations) {
    // Add more information to parsed annotations
    for (const annotation of annotations as EnrichedGeoreferencedMap[]) {
      // Add metadata with optional manual corrections
      annotation._meta = { ...metadata, ...manualCorrections[id] };
      // Add tiles information
      if (imageInformation?.tiles) {
        annotation.tiles = imageInformation.tiles;
      } else {
        console.log("Could not find image information for", id);
      }
      // Add sprite
      if (sprite) {
        annotation.sprite = sprite;
      } else {
        console.log("No sprite for", id);
      }
      // Add partOf
      if (canvas) {
        annotation.resource.partOf = [
          {
            id: canvas.id,
            type: "Canvas",
            partOf: [
              {
                id: iiifBaseUrl + manifestId,
                type: "Manifest",
              },
            ],
          },
        ];
      } else {
        console.warn("No canvas found for", annotation.id);
      }
    }
  } else {
    // console.log("No annotations found for", id);
  }

  if (canvas) {
    // Add more information to canvases
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
          label.en = [labels[labelValue] || ""];
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
    if (annotations && allmapsVersion && geojson) {
      canvas.annotations = [
        {
          // id: `${baseUrl}annotations/${id}.json`,
          id: `https://annotations.allmaps.org/images/${id}@${allmapsVersion}`,
          type: "AnnotationPage",
          purpose: "georeferencing",
          label: {
            en: ["Georeference Annotation"],
          },
        },
      ];
      canvas.navPlace = geojson;
      // canvas.navPlace = {
      //   // id: `${baseUrl}geojson/${id}.json`,
      //   id: `https://annotations.allmaps.org/images/${id}@${version}.geojson`,
      //   type: "FeatureCollection",
      // };
    } else if (
      metadata &&
      metadata.sheet !== "index" &&
      metadata.type !== "B"
    ) {
      console.log("No map found for", id);
    }
  } else {
    console.log("No canvas found for", id);
  }
}

export function createRanges(mapsById: MapsWithMeta[]) {
  const groupedByManifests: Map<string, MapsWithMeta[]> = new Map();
  for (const item of mapsById) {
    if (item.manifestId) {
      const manifestExist = groupedByManifests.get(item.manifestId);
      if (manifestExist) {
        manifestExist.push(item);
      } else {
        groupedByManifests.set(item.manifestId, [item]);
      }
    }
  }
  const rangesByManifest: Map<string, Range[]> = new Map();
  for (const [id, mapsWithMeta] of groupedByManifests) {
    const ranges = new Map();
    for (const item of mapsWithMeta) {
      const sheet = item.metadata?.sheet;
      const rangeExists = ranges.get(sheet);
      if (rangeExists) {
        rangeExists.items.push(item.canvas?.id);
      } else {
        const baseUri =
          "https://objects.library.uu.nl/iiif_manifest/" + item.manifestId;
        const label =
          sheet === "index"
            ? "Bladwijzer"
            : sheet?.includes(".O")
            ? `Blad ${sheet.split(".")[0]}`
            : `Blad ${sheet}`;
        const range: Range = {
          id: `${baseUri}/range/p${sheet}`,
          type: "Range",
          label: {
            nl: [label],
          },
          items: [{ id: item.canvas?.id || "", type: "Canvas" }],
        };
        ranges.set(sheet, range);
      }
    }
    rangesByManifest.set(id, ranges.values().toArray());
  }
  return rangesByManifest;
}

export function enrichManifests(
  manifest: Manifest,
  id: string,
  ranges: Range[] | undefined
) {
  if (ranges) {
    manifest.structures = ranges;
  }
  manifest.id = baseUrl + "manifests/" + id + "/manifest.json";
  delete manifest.homepage;
}
