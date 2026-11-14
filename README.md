<div align="center">

# 📐 Convex Hull Studio

**Find the edge of a small cloud.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue coordinate notebook with typed named point/selection models, pointer and keyboard editing, monotone-chain geometry, and SVG/CSV/TXT/JSON exports._

</div>

---

## ✨ Highlights

- **A bounded point cloud:** Keep 1–24 unique integer-coordinate points on a −50…50 grid.
- **Follow the outside:** Derive the counterclockwise convex hull, excluding interior and intermediate collinear points.
- **Named Vue models:** Share immutable point-array replacements and selection through two typed component models.
- **Direct manipulation:** Drag SVG dots or use arrows, with Shift for five-unit steps and collision rejection.
- **Geometry with explicit edge cases:** Inspect area, boundary length, and polygon centroid; points and segments have defined degenerate behavior.
- **Stable editing:** Separate name/point forms preserve unrelated pending candidates, with confirmed point removal.
- **Full delivery:** Export complete SVG, ordered-point CSV, geometry TXT, or canonical HC JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── HullPlot.vue
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── hull.ts                        # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text, identity, number, and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. Native SVG attributes describe domain geometry. Standalone exported SVG carries its own presentation. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **The edge of a little garden** contains eight points, of which six form the hull. Its exact area is 4575.5 square units; the boundary length is about 253.494 units. Two interior points remain in the notebook and every export.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

HullPlot exposes two typed named defineModel contracts: points and selected. The parent supplies a writable computed point-array model whose setter validates a complete replacement workspace. Pointer/keyboard moves emit new arrays with one replacement record; an occupied coordinate or invalid candidate preserves the previous valid model and shows an error. Selection is shared separately and remains transient. Vue retains keyed SVG circles as coordinates change.

The plot converts client coordinates with the inverse SVG screen transformation matrix, so pointer positions account for responsive scaling and page scroll. Positions round to integer coordinates and clamp to −50…50. Individual handles capture the active pointer; pointerup, pointercancel, and lostpointercapture end the gesture. Touch handling is limited to the draggable dots. Arrow keys move one unit and Shift moves five, without consuming Tab or unrelated shortcuts.

The pure monotone-chain algorithm sorts by x then y and constructs lower/upper chains with integer cross products. Non-left turns remove intermediate vertices, so points inside an edge do not become hull corners. The result starts at the lexicographically smallest point and follows counterclockwise mathematical coordinates. The SVG flips y for the usual upward axis.

Shoelace sums give exact half-unit area. Closed polygon edge lengths use Euclidean distance; a two-point result uses the single segment length, rather than a doubled closed perimeter. One point has zero area and length. The signed polygon centroid is derived from cross-product moments and is null for points or segments.

New points select an unused safe identity and the first available integer position in a deterministic center-out coordinate scan. The UI stops at 24 points, confirms removal, and keeps at least one. Name and selected-point form synchronization use primitive/value signatures so unrelated pending fields survive. Imports explicitly refresh both forms and selection.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-convex-hull-studio:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Name and ordered point identities/coordinates are persisted. Hull vertices, metrics, selection, active pointers, pending forms, validation messages, and dialogs are derived or transient.

| Field         | Accepted values                                                                       |
| ------------- | ------------------------------------------------------------------------------------- |
| version, name | 1; nonblank single-line workspace title up to 80 characters                           |
| points        | 1–24 ordered point records                                                            |
| id            | Unique safe lowercase identity up to 40 characters; reserved prototype names rejected |
| x, y          | Actual integers −50 through 50; coordinate pairs unique                               |

Wrong primitives, fractions, duplicate IDs/positions, out-of-bounds coordinates, empty/excess clouds, and unsupported versions reject candidates. Original order controls display numbers; hull order is derived independently.

SVG includes every point, original ordinal labels, hull path, axes, fixed coordinate limits, area/length, escaped title metadata, and HC attribution. Its geometry uses the same mathematical mapping as the preview. CSV keeps original point order with ID, x/y, hull-vertex membership, one-based hull order where applicable, and marker. TXT includes full coordinates, ordered hull identities, area, six-decimal boundary length/centroid, and explicit degenerate-centroid text. JSON retains ordered original points and provenance; selection and geometry results are recomputed.

Download Blob URLs are revoked after download. Destructive collection removal and sample restoration use native confirmation dialogs.

## ◈ Project Markers

- `HC` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `HC-XXXXXXXX` is a deterministic 32-bit content stamp calculated with FNV-1a over UTF-8 canonical workspace JSON, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- A small planar integer-coordinate experiment; no geographic projection, geodesic distance, holes, concave hull, or physical units.
- Coordinate pairs are unique. Dragging onto an occupied point retains the last accepted intermediate position.
- Intermediate points on straight hull edges are not counted as hull vertices. The notebook calls these points “other,” and CSV uses is_hull_vertex to distinguish vertices without claiming all other points lie strictly inside.
- A segment’s reported length is one end-to-end distance, not a doubled polygon perimeter.
- Area centroid is undefined for a single point or segment; it is not the arithmetic mean of all source points.
- Point numbers follow original notebook order, while hull order follows coordinates.
- Pointer moves clamp and snap; detached numeric forms reject out-of-range/fractional values explicitly.
- The exported SVG is a fixed diagram with system fonts; all full identities/coordinates also remain in TXT/CSV/JSON.
- Selection, gestures, pending forms, dialogs, and validation messages are transient.
- Extend geometry invariants, coordinate mapping, candidate validation, and artifacts together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover exact sample area/centroid/hull order, degenerate shapes, independent containment and strict convexity across 60 varied clouds, order independence, strict schema guards, safe center-out additions, maximum complete artifacts, and UTF-8 stamps. Four browser workflows exercise actual named models and keyed circle reuse, real pointer mapping and snapped movement, keyboard collision/clamping, pending forms, bounded confirmed operations, degenerate metrics, and real SVG/CSV/TXT/JSON downloads.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the complete escaped JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
