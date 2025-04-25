# Source data for Watertijdreis

To install dependencies:

```bash
bun install
```

To run the local dev server of `iiif-hss`:

```bash
bun run dev
```

Go to [localhost:7111](http://localhost:7111) to see the IIIF Manifests and open them in the Manifest Editor.

## Syntax

Syntax for canvas label value:

`[sheet number].[position].[type]`

- `sheet number` Number in the range 1-62
- `position` Position of the subsheet
  - `W` West
  - `E` East
  - `NW` Northwest
  - `NE` Northeast
  - `SE` Southeast
  - `SW` Southwest
- `type` type of sheet
  - `WVE` Watervoorzieningseenheden
  - `HWP` Hydrologische waarnemingspunten
  - `B` Back of the sheet
  - `dup` Sheet is a duplicate

Example: `52.O.WVE`

## Metadata

Often, maps have multiple years recorded for different kinds of edits. The metadata contains the following abbreviations to encode these different categories:

- `bw` bewerkt
- `vk` verkend
- `hz` herzien
- `bij` bijgewerkt
- `gbij` gedeeltelijk bijgewerkt

Sometimes, multiple years are listed. This is encoded as `[year1].[year2]`

Example: \
`bw = 1912` \
`hz = 1910.1011`


---

This repository uses the [IIIF Headless Static Site](https://github.com/digirati-co-uk/headless-static-site) package.

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
