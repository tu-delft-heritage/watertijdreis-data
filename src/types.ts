export type EnrichedGeoreferencedMap = GeoreferencedMap & {
  id: string;
  _meta: {
    edition: number;
    bis: boolean;
    number: number;
    position: string;
    x: number;
    y: number;
    yearStart: number;
    yearEnd: number;
    label: string;
    type?: string;
  };
};
