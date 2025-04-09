import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";

const config = parseYaml(readFileSync(".iiifrc-base.yml", "utf8"));

export const run = config.run;
export const collections = config.collections;
export const stores = config.stores;
export const server = config.server;
