import { getMetadataFromCanvas, loadFolderContents, loadJson } from "./shared";
import { iiifBaseUrl } from "./config";
import { generateId } from "@allmaps/id";

import type { ImageService2, Manifest } from "@iiif/presentation-3";
import { parseAnnotation, type GeoreferencedMap } from "@allmaps/annotation";
import type { EnrichedGeoreferencedMap, MapsWithMeta, Sprite } from "./types";
import { maskToGeoJson } from "./shared";

export const manifestsById: Map<string, Manifest> = new Map();
export const mapsById: Map<string, MapsWithMeta> = new Map();

export async function initialiseData() {
  // Get source data
  const manifests = (await loadFolderContents(
    "./content/iiif-manifests"
  )) as Manifest[];
  const annotations = (await loadFolderContents("./content/annotations").then(
    (arr) => arr.map(parseAnnotation)
  )) as EnrichedGeoreferencedMap[][];
  const sprites = (await loadFolderContents("./content/sprites")) as Sprite[][];
  const versions = (await loadJson("./content/allmaps-versions.json")) as [
    string,
    string
  ][];
  const imageInformation = (await loadJson(
    "./content/image-information.json"
  )) as ImageService2[];

  manifests.forEach((manifest) => {
    const id = manifest.id.match(/1874-\d+/)?.[0] || "no-id";
    manifestsById.set(id, manifest);
  });

  // Add maps
  for (const annotation of annotations.flat()) {
    const allmapsId = await generateId(annotation.resource.id);
    const hasAnnotations = mapsById.get(allmapsId)?.annotations;
    if (hasAnnotations) {
      console.log("ID with multiple maps:", allmapsId);
      hasAnnotations.push(annotation);
    } else {
      mapsById.set(allmapsId, { annotations: [annotation] });
    }
  }
  console.log("Unique IDs count:", mapsById.size);

  // Add GeoJSON of masks
  await Promise.all(
    mapsById.values().map(async (i) => {
      if (i.annotations) {
        i.geojson = await maskToGeoJson(i.annotations);
      }
    })
  );

  // Add canvases
  for (const canvas of manifests.map((i) => i.items).flat()) {
    const imageId = canvas.items?.[0]?.items?.[0]?.body?.service?.[0]?.id;
    const manifestId = canvas.id.match(/1874-\d+/)?.[0];
    const metadata = getMetadataFromCanvas(canvas);
    if (imageId) {
      const allmapsId = await generateId(imageId);
      const existingData = mapsById.get(allmapsId);
      if (existingData && existingData.canvas) {
        console.log("Duplicate canvas", canvas);
      } else {
        mapsById.set(allmapsId, {
          ...existingData,
          canvas,
          metadata,
          manifestId,
        });
      }
    } else {
      console.log("Could not find image ID for canvas", canvas);
    }
  }

  // Add Image Information
  for (const image of imageInformation) {
    const allmapsId = await generateId(image["@id"]);
    if (allmapsId) {
      const existingData = mapsById.get(allmapsId);
      mapsById.set(allmapsId, { ...existingData, imageInformation: image });
    }
  }

  // Add version
  for (const [allmapsId, version] of versions) {
    const existingData = mapsById.get(allmapsId);
    mapsById.set(allmapsId, { ...existingData, allmapsVersion: version });
  }

  // Add sprite
  for (const sprite of sprites.flat()) {
    const allmapsId = sprite.allmapsId;
    const existingData = mapsById.get(allmapsId);
    if (!existingData?.sprite) {
      mapsById.set(allmapsId, { ...existingData, sprite });
    } else {
      console.log("Duplicate image in sprite", allmapsId);
    }
  }
}
