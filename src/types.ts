import type { GeoreferencedMap } from "@allmaps/annotation";
import type { Canvas, ImageService2, ImageTile } from "@iiif/presentation-3";
import type { FeatureCollection } from "geojson";

export type Metadata = {
  // label: string;
  sheet?: string;
  edition?: number;
  bis?: boolean;
  number?: number;
  position?: string;
  x?: number;
  y?: number;
  type?: string;
  duplicate?: boolean;
  yearStart?: number;
  yearEnd?: number;
};

export type EnrichedGeoreferencedMap = GeoreferencedMap & {
  id: string;
  tiles?: ImageTile[];
  _meta?: Metadata;
};

export type MapsWithMeta = {
  annotations?: EnrichedGeoreferencedMap[];
  imageInformation?: ImageService2;
  canvas?: Canvas;
  allmapsVersion?: string;
  metadata?: Metadata;
  manifestId?: string;
  sprite?: Sprite;
  geojson?: FeatureCollection;
};

export type Sprite = {
  imageId: string;
  allmapsId: string;
  scaleFactor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteTileScale: number;
};
