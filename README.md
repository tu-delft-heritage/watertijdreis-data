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

`[sheet number].[position].[type].[scan]`

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
- `scan` scan position
  - `L` Left
  - `R` Right

Example: `52.O.WVE`

---

This repository uses the [IIIF Headless Static Site](https://github.com/digirati-co-uk/headless-static-site) package.

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
