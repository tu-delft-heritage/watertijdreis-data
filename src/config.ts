interface Vocabulary {
  [key: string]: string;
}

export const outputFolder = "build/";
export const baseUrl =
  "https://tu-delft-heritage.github.io/watertijdreis-data/";

export const iiifBaseUrl = "https://objects.library.uu.nl/manifest/iiif/v3/";

export const editionsById = new Map([
  ["1874-389916", { edition: 1, bis: false }],
  ["1874-456650", { edition: 1, bis: true }],
  ["1874-455650", { edition: 2, bis: false }],
  ["1874-456550", { edition: 2, bis: true }],
  ["1874-456551", { edition: 3, bis: false }],
  ["1874-456552", { edition: 3, bis: true }],
  ["1874-456588", { edition: 4, bis: false }],
  ["1874-456553", { edition: 4, bis: true }],
  ["1874-456827", { edition: 5, bis: false }],
]);

export const sheetTypes: Vocabulary = {
  WVE: "Watervoorzieningseenheden",
  HWP: "Hydrologische Waarnemingspunten",
  B: "Achterkant",
  dup: "Duplicaat",
};

export const sheetPostions: Vocabulary = {
  W: "West",
  E: "Oost",
  NW: "Noordwest",
  NE: "Noordoost",
  SE: "Zuidoost",
  SW: "Zuidwest",
};

export const labels: Vocabulary = {
  bw: "Bewerkt",
  vk: "Verkend",
  hz: "Herzien",
  bij: "Bijgewerkt",
  gbij: "Gedeeltelijk bijgewerkt",
  ui: "Uitgave",
  ba: "Basiskaart",
};

export const semiSheets = [
  8, 13, 18, 23, 24, 29, 35, 36, 47, 53, 55, 56, 59, 61,
];

export const baseMapping = [
  {
    number: 1,
    name: "Ameland",
    altName: "Terschelling",
    bonneCoord: [20000, 235000],
    rdCoord: [140000, 625000],
  },
  { number: 2, name: "Schiermonnikoog" },
  { number: 3, name: "Uithuizen" },
  {
    number: 4,
    name: "Vlieland",
    bonneCoord: [-20000, 210000],
    rdCoord: [100000, 600000],
  },
  { number: 5, name: "Harlingen" },
  { number: 6, name: "Leeuwarden" },
  { number: 7, name: "Groningen" },
  { number: 8, name: "Nieuwe Schans", altName: "Nieuweschans", semi: "W" },
  {
    number: 9,
    name: "Den Helder",
    bonneCoord: [-20000, 185000],
    rdCoord: [100000, 575000],
  },
  { number: 10, name: "Sneek" },
  { number: 11, name: "Heerenveen" },
  { number: 12, name: "Assen" },
  { number: 13, name: "Boertange", altName: "Bourtange", semi: "W" },
  {
    number: 14,
    name: "Medemblik",
    bonneCoord: [-20000, 160000],
    rdCoord: [100000, 550000],
  },
  { number: 15, name: "Staveren", altName: "Stavoren" },
  { number: 16, name: "Steenwijk" },
  { number: 17, name: "Beilen" },
  { number: 18, name: "Roswinkel", semi: "W" },
  {
    number: 19,
    name: "Alkmaar",
    bonneCoord: [-20000, 135000],
    rdCoord: [100000, 525000],
  },
  { number: 20, name: "Enkhuizen", altName: "Lelystad" },
  { number: 21, name: "Zwolle" },
  { number: 22, name: "Coevorden" },
  { number: 23, name: "Nieuw-Schoonebeek", semi: "W" },
  {
    number: 24,
    name: "Hillegom",
    semi: "E",
    bonneCoord: [-60000, 110000],
    rdCoord: [60000, 500000],
  },
  { number: 25, name: "Amsterdam" },
  { number: 26, name: "Harderwijk" },
  { number: 27, name: "Hattem" },
  { number: 28, name: "Almelo" },
  { number: 29, name: "Denekamp", semi: "W" },
  {
    number: 30,
    name: "'s-Gravenhage",
    bonneCoord: [-60000, 85000],
    rdCoord: [60000, 475000],
  },
  { number: 31, name: "Utrecht" },
  { number: 32, name: "Amersfoort" },
  { number: 33, name: "Zutphen" },
  { number: 34, name: "Groenlo" },
  { number: 35, name: "Ahaus", altName: "Glanerbrug", semi: "W" },
  {
    number: 36,
    name: "Goedereede",
    semi: "E",
    bonneCoord: [-100000, 60000],
    rdCoord: [20000, 450000],
  },
  { number: 37, name: "Rotterdam" },
  { number: 38, name: "Gorinchem" },
  { number: 39, name: "Rhenen" },
  { number: 40, name: "Arnhem" },
  { number: 41, name: "Aalten" },
  {
    number: 42,
    name: "Zierikzee",
    bonneCoord: [-100000, 35000],
    rdCoord: [20000, 425000],
  },
  { number: 43, name: "Willemstad" },
  { number: 44, name: "Geertruidenberg" },
  { number: 45, name: "'s-Hertogenbosch" },
  { number: 46, name: "Vierlingsbeek" },
  {
    number: 47,
    name: "Cadzand",
    semi: "E",
    bonneCoord: [-140000, 10000],
    rdCoord: [-20000, 400000],
  },
  { number: 48, name: "Middelburg" },
  { number: 49, name: "Bergen op Zoom" },
  { number: 50, name: "Breda" },
  { number: 51, name: "Eindhoven" },
  { number: 52, name: "Venlo" },
  {
    number: 53,
    name: "Sluis",
    semi: "E",
    bonneCoord: [-140000, -15000],
    rdCoord: [-20000, 375000],
  },
  { number: 54, name: "Terneuzen" },
  { number: 55, name: "Hulst", semi: "W" },
  { number: 56, name: "Herentals", semi: "E" },
  { number: 57, name: "Valkenswaard" },
  { number: 58, name: "Roermond" },
  {
    number: 59,
    name: "Peer",
    semi: "E",
    bonneCoord: [20000, -40000],
    rdCoord: [140000, 350000],
  },
  { number: 60, name: "Sittard" },
  {
    number: 61,
    name: "Maastricht",
    semi: "E",
    bonneCoord: [20000, -65000],
    rdCoord: [140000, 325000],
  },
  { number: 62, name: "Heerlen" },
];
