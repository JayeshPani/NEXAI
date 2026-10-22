# Warehouse Digital Twin — 3D Picking Floor Game

NEXAI 2026 Hackathon · Track 4 · PS 4.2

A browser game that turns warehouse slotting into a puzzle. A 3D twin of a picking floor replays real
November 2011 orders from Online Retail II. You rearrange 100 products; the twin replays exactly the same
orders and scores walking distance and pick time before vs after.

**Live:** https://nexai-jayesh-panis-projects.vercel.app

## How to play

- **Challenge (default):** start from the Baseline layout with **10 swaps** and try to beat it on the test week.
  Click a rack to select it, click another to swap. Hover first to see the Δ distance preview.
  Purple dashed lines point to the products most often ordered together with the selected one.
- **Sandbox:** start from the Original layout with unlimited swaps.
- **AI Suggest:** simulated annealing in a Web Worker (5 s budget), tuned on the train weeks and scored on the test week.
- **Replay** walks 25 sample orders from the test week at 1×, 10× or 50×. **Heatmap** recolours racks by visits.
- Esc deselects. Swapping the left and right slots of one bay changes nothing (same pick point) and costs no swap.

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
| Pick time | 10 s per order line |
| Picking policy | Single-order picking: one trip per order, dock → slots → dock |

## Routing and distance

- **Routing:** nearest neighbour from the dock, identical for every layout (ties go to the lower slot ID).
- **Distance:** within one aisle it is |Δy|. Between aisles the picker walks to the front or back cross aisle,
  whichever is shorter (ties go to the front): `min(y_a + y_b, 2L − y_a − y_b) + |x_a − x_b|`.
- **Distance never cuts through racks:** every move runs along an aisle or cross-aisle centerline. One function,
  `leg()`, returns both the distance and the waypoints, so the animation can never disagree with the score.

## Metrics

- Total, mean, median and p90 walking distance per order, over **all test-week orders**.
- Average pick time per order = (walking distance / 1 m/s + 10 s × lines) / orders. Pick time per line is identical
  across layouts, so only walking time differs.

## Results (test week, 735 orders)

| Layout | Total | Mean / order | Median | p90 | Avg time / order | vs Original |
|---|---|---|---|---|---|---|
| Original (sorted by StockCode) | 51,723 m | 70.4 m | 70.0 m | 110.8 m | 2m 24s | — |
| Baseline (fastest movers nearest the dock) | 49,659 m | 67.6 m | 68.4 m | 113.8 m | 2m 21s | −4.0% |
| Best Challenge layout | _fill in after play-testing_ | | | | | |
| AI Suggest (one 5 s run) | 43,031 m | 58.5 m | 52.8 m | 104.2 m | 2m 12s | −16.8% |

AI Suggest is randomised, so each run differs. Typical runs beat the Baseline by about 10–14% on the unseen test
week (16.8% on train in the run above). It is seeded from the Baseline, tuned on the train weeks only, and its
starting temperature is set so that roughly half of worsening moves are accepted.

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
distance equal to |Δy|, no path through a rack, Baseline beats Original on train and test, deterministic scoring,
`swapDelta` + commit equal to a full rescore, plus the optimizer. `scripts/validate_data.py` checks the JSON
contracts and the train/test hold-out.

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs the data check, lint, typecheck, tests and build on every push
and PR. PRs get a Vercel preview; pushes to `main` deploy to production, are smoke-tested, then promoted.

## Dataset

Online Retail II, UCI Machine Learning Repository, licensed CC BY 4.0.
https://archive.ics.uci.edu/dataset/502/online+retail+ii
