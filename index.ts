import {
  getMaps,
  groupMapsByImageId,
  writeAnnotations,
  groupCanvasesBySheet,
  getManifests,
  createRanges,
  writeManifests,
  addMetadataToCanvas,
  groupCanvasesByImageId,
  getVersions,
  writeCollection,
  getMetadataFromCanvas,
} from "./src/functions";
import { baseUrl, iiifBaseUrl } from "./src/config";

import type { Canvas } from "@iiif/presentation-3";
import type { EnrichedGeoreferencedMap } from "./src/types";

// Get source data
const manifests = await getManifests();
const maps = await getMaps();
const versions = await getVersions();

// Sort both by Image ID
const mapsById = await groupMapsByImageId(maps);
const canvasesById = await groupCanvasesByImageId(
  manifests.map((i) => i.items).flat()
);
const metadataById = new Map(
  canvasesById
    .entries()
    .toArray()
    .map(([id, canvas]) => [id, getMetadataFromCanvas(canvas)])
);

// Add partOf
mapsById.forEach((maps, id) => {
  const canvas = canvasesById.get(id);
  const canvasId = canvas?.id;
  const manifestId = canvasId?.match(/1874-\d+/)?.[0];
  let meta = metadataById.get(id);
  for (const map of maps as EnrichedGeoreferencedMap[]) {
    // Add metadata
    // Manually correct two images with two annotations
    if (map.id === "f33303da7e3baae9-b") {
      // 35. Ahaus West
      meta = {
        ...meta,
        sheet: "35.W",
        number: 35,
        position: "W",
        x: 0,
        y: 0,
      };
    } else if (map.id === "826ce93dc498e974-b") {
      // 4. Vlieland West
      meta = {
        ...meta,
        sheet: "4.W",
        number: 4,
        position: "W",
        x: 0,
        y: 0,
      };
    }
    map._meta = meta;
    if (canvas) {
      map.resource.partOf = [
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
      console.warn("No canvas found for", map.id);
    }
  }
});

await writeAnnotations(mapsById);

// Process manifests
const manifestsWithStructures = await Promise.all(
  manifests.map(async (manifest) => {
    const id = manifest.id.match(/1874-\d+/)?.[0];
    const baseUri = "https://objects.library.uu.nl/iiif_manifest/" + id;
    // Create structures
    const groupedCanvases = groupCanvasesBySheet(manifest.items);
    const structures = createRanges(groupedCanvases, baseUri);
    manifest.structures = structures;
    // Update identifier
    manifest.id = baseUrl + "manifests/" + id + "/manifest.json";
    delete manifest.homepage;
    // Add metadata to canvases
    await Promise.all(
      manifest.items.map((canvas: Canvas) =>
        addMetadataToCanvas(canvas, mapsById, versions)
      )
    );
    return [id, manifest];
  })
);

await writeManifests(new Map(manifestsWithStructures));
await writeCollection();
