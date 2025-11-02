import { parseAnnotation, generateAnnotation } from "@allmaps/annotation";
import { generateId } from "@allmaps/id";
import { readdir } from "node:fs/promises";

const annotationsPath = "./content/annotations/";
const fileNames = await readdir(annotationsPath);
const files = await Promise.all(
  fileNames.map((filename: string) =>
    Bun.file(annotationsPath + filename)
      .json()
      .then((json) => [filename, json])
  )
);

const ids = new Array();

files.forEach(async ([filename, json]) => {
  const maps = parseAnnotation(json);
  const mapsWithBetterIds = await Promise.all(
    maps.map(async (map) => {
      const id = await generateId(map.resource.id);
      if (!ids.includes(id)) {
        ids.push(id);
        map.id = id;
      } else {
        console.log("Duplicate ID for " + map.resource.id);
        console.log("Used " + id + "-b");
        map.id = id + "-b";
      }
      return map;
    })
  );
  const annotation = generateAnnotation(mapsWithBetterIds);
  const file = Bun.file(annotationsPath + filename);
  Bun.write(file, JSON.stringify(annotation, null, 2));
});
