import { mapsById, manifestsById, initialiseData } from "./src/load";
import { enrichMaps, enrichManifests, createRanges } from "./src/enrich";
import { writeAnnotations, writeManifests, writeCollection } from "./src/save";

// Load data
await initialiseData();

// Enrich data
mapsById.forEach(enrichMaps);
const rangesByManifest = createRanges(mapsById.values().toArray());
manifestsById.forEach((manifest, id) => {
  const ranges = rangesByManifest.get(id);
  enrichManifests(manifest, id, ranges);
});

// Save data
await writeAnnotations(mapsById);
await writeManifests(manifestsById);
await writeCollection();
