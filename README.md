# Pick & Pack Puzzle — Warehouse Digital Twin

NEXAI 2026 Hackathon · Track 4 · PS 4.2

A browser game that turns warehouse slotting into a puzzle, set in **Holly & Ivy Gifts**, a UK gift and
Christmas-décor wholesaler in its November rush (the company name is ours; the orders are real November 2011 orders
from Online Retail II). A 3D twin of the picking floor replays those orders. You rearrange 100 products; the twin
replays exactly the same orders and scores walking distance and pick time before vs after.

**Live:** https://nexai-jayesh-panis-projects.vercel.app

## Modules

The app opens on a home screen with three separate modules, one per must-have requirement.

| # | Module | Requirement | Code |
|---|---|---|---|
| 1 | **Order data** | Pre-processing: one month of order lines turned into JSON (top 100 products, pick counts, orders) | `preprocess.py`, `src/modules/data` |
| 2 | **Warehouse replay** | 3D grid warehouse (racks, aisles, packing dock, animated picker) replaying orders with live distance and time | `src/modules/twin` |
| 3 | **Slotting game** | Swap products between slots, replay the same orders, compare walking distance and pick time against the automatic baseline | `src/modules/game` |

`src/core` holds what all three share: the simulator (`engine/`: geometry, routing, scoring, layouts) and data
loading. The replay module is read-only: no swapping, scoring or optimiser. Everything game-related lives in
module 3, which reuses the replay's 3D scene. `src/modules/boundaries.test.ts` fails the build if a module
imports one it shouldn't (core imports no module; data and replay never import the game).

## How to play (module 3)

The game opens on its own menu: **Play the puzzle**, **Free play**, **How to play** and **High scores**.

- **Play the puzzle (Challenge mode):** start from the Starting shelves (the plan's Baseline) with **10 swaps**.
  Click a shelf to pick it up, point at another to see the points the swap would earn, click to swap.
  Purple dashed lines point to the products most often bought together with the selected one.
- **Scoring:** 1 point per second of picking time saved over all test-week orders (walking + forklift access).
  Stars: 1 for any saving, 2 at 1,500 points, 3 at 4,000 points. A greedy 10-swap search reaches about 6,480,
  which set these thresholds. Each swap shows a pop-up ("+320 Great swap!" / "−40 Oops, slower").
  Finish early with **I'm done**.
- **High scores:** the top 8 puzzle scores, saved in this browser only (localStorage).
- **Free play (Sandbox mode):** start from the Jumbled shelves (the plan's Original) with unlimited swaps.
- **Ask the robot (AI Suggest):** simulated annealing in a Web Worker (5 s budget), tuned on the train weeks and
  scored on the test week.
- **Watch Pip pick** replays 25 sample orders from the test week (Walk 1×, Run 10×, Zoom 50×).
- **Colour by** Category, Class, FL, Picks or Busy (visits during the replay). Every shelf top carries a label:
  category icon, short product name, class badge and FL badge.
- **Grown-up stats** shows the plan's full scoreboard (total, mean, median, p90, average time).
- Esc puts a shelf back. Swapping the two shelves facing each other across an aisle changes nothing
  (same pick point) and costs no swap.

## Data rules

- Cancelled invoices (number starts with "C") are removed.
- Rows with Quantity ≤ 0 or Price ≤ 0 (returns, adjustments) are removed.
- Non-product codes (POST, DOT, M, BANK CHARGES, AMAZONFEE, gift vouchers, etc.) are removed by keeping only codes
  of the form five digits plus up to two letters.
- Stock codes are upper-cased and trimmed so variants such as 85049a and 85049A merge.
- Invoices that were later cancelled are still counted as picks: the goods were picked before the return.
- Month used: November 2011. **Train = 1–21 Nov (1,613 orders), Test = 22–30 Nov (735 orders).**
- Top 100 products are chosen by pick frequency (order lines, not units) in the train weeks, so the test week stays unseen.
- Order lines for products outside the top 100 are dropped; orders left empty are dropped. Large wholesale orders
  are kept and reported via median and p90.
- Affinity (products ordered together) and the Baseline are computed from the train weeks only.

## Product attributes (learn weeks only)

`products.json` entries are `{ id, code, name, picksTrain, category, price, valueTrain, abc, fl }`.

| Field | Rule |
|---|---|
| `category` | Keyword rules on the description, first match wins: Cosy & warm, Lights & candles, Bags & storage, Kitchen & baking, Party & paper, Christmas, Games & crafts, Home & garden (fallback Gifts & gadgets, currently unused) |
| `price` | Median unit price (£) |
| `valueTrain` | Σ price × units |
| `abc` | Cost class by sales value rank: top 20 products = A (48% of value), next 30 = B (28%), last 50 = C (24%) |
| `fl` | Forklift/handling level 0–7 from the mean units per order line: ≤6, ≤8, ≤10, ≤12, ≤14, ≤17, ≤22, >22 (FL0 by hand … FL7 forklift and pallet) |

## Time rules (`src/core/engine/rules.ts`)

| Rule | Time |
|---|---|
| Walking | 1 m/s along aisles |
| Handling per order line | 6 s + 4 s × FL (FL0 6 s … FL7 34 s) |
| Cost-class check | A +5 s (scan and seal), B +2 s, C +0 s |
| Forklift access | FL 4 and up: +2 s per metre between the shelf and the nearest cross aisle |

Handling and the class check are the same on every layout. Walking and forklift access depend on where products
sit, so slotting now has two goals: fast movers near the dock, and forklift items near the aisle ends.

## Layout assumptions (our own design)

| Parameter | Value |
|---|---|
| Aisles | 5 vertical aisles, 3 m wide, centerlines 5 m apart (x = 0, 5, 10, 15, 20) |
| Racks | Both sides of every aisle, back-to-back between aisles, 1 m deep |
| Slots | 10 bays per side × 2 sides × 5 aisles = 100 slots |
| Rack span | y = 1.5 m to 13.5 m (bay length 1.2 m) |
| Bay pick point | y = 2.1 + 1.2 × bay (on the aisle centerline) |
| Cross aisles | Front centerline y = 0, back centerline y = L = 15 |
| Dock | (10, 0), on the front cross aisle in line with the middle aisle |
| Walking speed | 1.0 m/s |
| Pick time | Per order line, from the time rules below the data rules |
| Picking policy | Single-order picking: one trip per order, dock → slots → dock |

## Routing and distance

- **Routing:** nearest neighbour from the dock, identical for every layout (ties go to the lower slot ID).
- **Distance:** within one aisle it is |Δy|. Between aisles the picker walks to the front or back cross aisle,
  whichever is shorter (ties go to the front): `min(y_a + y_b, 2L − y_a − y_b) + |x_a − x_b|`.
- **Distance never cuts through racks:** every move runs along an aisle or cross-aisle centerline. One function,
  `leg()`, returns both the distance and the waypoints, so the animation can never disagree with the score.

## Metrics

- Total, mean, median and p90 walking distance per order, over **all test-week orders**.
- Time per order = walking distance / 1 m/s + Σ pick time per line (time rules). Mean, median and p90 are reported.
  The game and the optimiser score total time; walking is reported alongside.

## Results (test week, 735 orders)

| Layout | Total time | Time / order | Median | p90 | Total walk | Walk / order | Time vs Original |
|---|---|---|---|---|---|---|---|
| Original (sorted by StockCode) | 186,452 s | 253.7 s | 176.4 s | 503.0 s | 51,723 m | 70.4 m | — |
| Baseline (fastest movers nearest the dock) | 184,645 s | 251.2 s | 177.8 s | 497.6 s | 49,659 m | 67.6 m | −1.0% |
| Best Challenge layout | _fill in after play-testing_ | | | | | | |
| AI Suggest (one 5 s run) | 172,291 s | 234.4 s | 163.6 s | 466.6 s | 45,025 m | 61.3 m | −7.6% |

AI Suggest is randomised, so each run differs. Runs beat the Baseline by about 6–8% of total time on the unseen test
week. It is seeded from the Baseline, minimises total time on the train weeks only, and its starting temperature is
set so that roughly half of worsening moves are accepted. The Baseline only orders by pick frequency, so it ignores
forklift access, which is why the optimiser has more to gain than walking alone suggests.

## Run locally

Requires Node 22.12+ (CI uses Node 24) and Python 3.10+ with `pandas openpyxl pyarrow`.

```bash
npm ci
npm run dev
```

To regenerate the data, put `online_retail_II.xlsx` in the project root and run:

```bash
python3 preprocess.py
python3 scripts/validate_data.py
```

## Tests

```bash
npm test
```

Vitest covers the Section 5.4 checks: `leg()` symmetry, waypoint length equal to scored distance, same-aisle
distance equal to |Δy|, no path through a rack, Baseline walks less than Original on train and test, deterministic
scoring, `swapDelta` + commit equal to a full rescore (time and distance), the time rules, the optimizer and the
module boundaries. `scripts/validate_data.py` checks the JSON
contracts and the train/test hold-out.

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs the data check, lint, typecheck, tests and build on every push
and PR. PRs get a Vercel preview; pushes to `main` deploy to production, are smoke-tested, then promoted.

## Dataset

Online Retail II, UCI Machine Learning Repository, licensed CC BY 4.0.
https://archive.ics.uci.edu/dataset/502/online+retail+ii
