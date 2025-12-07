import { Vault, type NormalizedEntity } from "@iiif/helpers";
import { IIIFBuilder } from "@iiif/builder";
import { generateAnnotation } from "@allmaps/annotation";
import { outputFolder, baseUrl, editionsById } from "./config";
import { sortMaps } from "./shared";

import type { EnrichedGeoreferencedMap, MapsWithMeta } from "./types";
import type { Manifest } from "@iiif/presentation-3";

export const writeAnnotations = async (
  maps: Map<string, MapsWithMeta>,
  writeMask: boolean = true
) => {
  let count = 0;
  const annotationPath = `${outputFolder}/annotations/`;
  const geoJsonPath = `${outputFolder}/geojson/`;
  for (const [id, map] of maps) {
    if (map.annotations && map.geojson) {
      // Write annotation
      const annotationFile = Bun.file(annotationPath + id + ".json");
      await Bun.write(
        annotationFile,
        JSON.stringify(generateAnnotation(map.annotations), null, 2)
      );
      if (writeMask) {
        // Write GeoJSON of mask
        const geoJsonFile = Bun.file(geoJsonPath + id + ".geojson");
        await Bun.write(geoJsonFile, JSON.stringify(map.geojson, null, 2));
      }
      count++;
    }
  }
  console.log("Annotations written:", count);
  if (writeMask) {
    console.log("GeoJSONs written:", count);
  }
  // Single files with all maps and annotations
  const sortedMaps = maps
    .values()
    .toArray()
    .map((i) => i.annotations)
    .filter((i) => i)
    .flat()
    .sort(sortMaps);
  await Bun.write(
    Bun.file(outputFolder + "maps.json"),
    JSON.stringify(sortedMaps, null, 2)
  );

  await Bun.write(
    Bun.file(outputFolder + "annotations.json"),
    JSON.stringify(generateAnnotation(sortedMaps), null, 2)
  );

  await Bun.write(
    Bun.file(outputFolder + "annotations-regular.json"),
    JSON.stringify(
      generateAnnotation(
        sortedMaps.filter((i: EnrichedGeoreferencedMap) => !i._meta.type)
      ),
      null,
      2
    )
  );

  await Bun.write(
    Bun.file(outputFolder + "annotations-special.json"),
    JSON.stringify(
      generateAnnotation(
        sortedMaps.filter((i: EnrichedGeoreferencedMap) => i._meta.type)
      ),
      null,
      2
    )
  );
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
