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
} from "./src/functions";
import { baseUrl, iiifBaseUrl } from "./src/config";

import type { Canvas } from "@iiif/presentation-3";

// Get source data
const manifests = await getManifests();
const maps = await getMaps();

// Sort both by Image ID
const groupedMaps = await groupMapsByImageId(maps);
const groupedCanvases = await groupCanvasesByImageId(
  manifests.map((i) => i.items).flat()
);

// Add partOf
groupedMaps.forEach((maps, id) => {
  const canvas = groupedCanvases.get(id);
  const canvasId = canvas?.id;
  const manifestId = canvasId?.match(/1874-\d+/)?.[0];
  for (const map of maps) {
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

writeAnnotations(groupedMaps);

// Process manifests
const manifestsWithStructures = new Map(
  manifests.map((manifest) => {
    const id = manifest.id.match(/1874-\d+/)[0];
    const baseUri = "https://objects.library.uu.nl/iiif_manifest/" + id;
    // Create structures
    const groupedCanvases = groupCanvasesBySheet(manifest.items);
    const structures = createRanges(groupedCanvases, baseUri);
    manifest.structures = structures;
    // Update identifier
    manifest.id = baseUrl + "manifests/" + id + "/manifest.json";
    delete manifest.homepage;
    // Add metadata to canvases
    manifest.items.map((canvas: Canvas) =>
      addMetadataToCanvas(canvas, groupedMaps)
    );
    return [id, manifest];
  })
);

writeManifests(manifestsWithStructures);

// Collection
// builder.createCollection(id, (collection) => {
//   collection.addLabel(label, "en");
//   for (const item of parsedUrls) {
//     collection.createManifest(item, (manifest) => {
//       // manifest.type = vault.get(item).type;
//       manifest.setLabel(vault.get(item).label);
//     });
//   }
// });
