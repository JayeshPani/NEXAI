import os, json, re
import pandas as pd
from itertools import combinations
from collections import Counter

os.makedirs("public/data", exist_ok=True)
if os.path.exists("retail.parquet"):     # needs pyarrow; reused after the first run
    df = pd.read_parquet("retail.parquet")
else:
    # Invoice, StockCode and Description mix numbers and text (e.g. "C536379"), so read them as text
    df = pd.read_excel("online_retail_II.xlsx", sheet_name="Year 2010-2011",  # needs openpyxl
                       dtype={"Invoice": str, "StockCode": str, "Description": str})
    df.to_parquet("retail.parquet")

df["Invoice"] = df["Invoice"].astype(str)
df["StockCode"] = df["StockCode"].astype(str).str.upper().str.strip()
df = df[~df["Invoice"].str.startswith("C")]                 # cancellations
df = df[(df["Quantity"] > 0) & (df["Price"] > 0)]           # returns / adjustments
df = df[df["StockCode"].str.match(r"^\d{5}[A-Z]{0,2}$")]    # products only

m = df[(df["InvoiceDate"] >= "2011-11-01") & (df["InvoiceDate"] < "2011-12-01")]
lines = m.groupby(["Invoice", "StockCode"], as_index=False).agg(
    q=("Quantity", "sum"), t=("InvoiceDate", "min"), name=("Description", "first"))

CUT = pd.Timestamp("2011-11-22")
train_lines = lines[lines["t"] < CUT]
picks = train_lines.groupby("StockCode").size().sort_values(ascending=False)
top = list(picks.head(100).index)          # top 100 chosen on TRAIN only

lines = lines[lines["StockCode"].isin(top)]
pid = {c: i for i, c in enumerate(top)}
names = lines.groupby("StockCode")["name"].first()

# --- Warehouse attributes (learn weeks only): category, price, ABC class, forklift/handling level ---
# Holly & Ivy Gifts is a UK gift and Christmas-decor wholesaler; categories come from the descriptions.
CATEGORIES = [  # first match wins
    ("Cosy & warm",      r"HOT WATER BOTTLE|HAND WARMER"),
    ("Lights & candles", r"T-LIGHT|NIGHT LIGHT|LIGHTS|CANDLE|LANTERN"),
    ("Bags & storage",   r"\bBAG\b|SHOPPER|STORAGE"),
    ("Kitchen & baking", r"CAKE|BAKING|TEA SET|JELLY|RECIPE|POPCORN|PANTRY|MUG"),
    ("Party & paper",    r"PAPER CHAIN|WRAP|NAPKIN|BUNTING|RIBBON|CRACKER"),
    ("Christmas",        r"CHRISTMAS|SLEIGH|JINGLE|STOCKING|TREE|STAR|ANGEL"),
    ("Games & crafts",   r"GAME|CARDS|NAUGHTS|STICKS|KNITTING|DOMINOES|HARMONICA|PENCIL|SEWING|CRAFT"),
    ("Home & garden",    r"HEART|WICKER|FRAME|CLOCK|DOORMAT|CHALKBOARD|ORNAMENT|OWL|KNEELING|DECORATION"),
]
def category(name):
    n = str(name).upper()
    return next((c for c, rx in CATEGORIES if re.search(rx, n)), "Gifts & gadgets")

train_rows = m[(m["InvoiceDate"] < CUT) & (m["StockCode"].isin(top))]
price = train_rows.groupby("StockCode")["Price"].median()
value = (train_rows["Price"] * train_rows["Quantity"]).groupby(train_rows["StockCode"]).sum()
units = train_lines[train_lines["StockCode"].isin(top)].groupby("StockCode")["q"].mean()

# ABC by sales value rank (count split): top 20% of products by value = A, next 30% = B, last 50% = C
by_value = list(value.sort_values(ascending=False).index)
abc = {c: "A" if i < 20 else "B" if i < 50 else "C" for i, c in enumerate(by_value)}

# Forklift/handling level from the mean units per order line: bigger loads need cases, pallets, then a forklift
FL_BANDS = [6, 8, 10, 12, 14, 17, 22]      # <=6 units -> FL0 (by hand) ... >22 units -> FL7 (forklift)
def fl(u):
    return next((i for i, b in enumerate(FL_BANDS) if u <= b), 7)

products = [{"id": pid[c], "code": c,
             "name": str(names.get(c, "Unknown")).strip().title(),
             "picksTrain": int(picks[c]),
             "category": category(names.get(c, "")),
             "price": round(float(price[c]), 2),
             "valueTrain": round(float(value[c]), 2),
             "abc": abc[c],
             "fl": fl(float(units[c]))} for c in top]

orders = []
for inv, g in lines.sort_values("t").groupby("Invoice", sort=False):
    orders.append({"id": inv, "t": g["t"].min().isoformat(),
                   "lines": [{"p": pid[c], "q": int(q)}
                             for c, q in zip(g["StockCode"], g["q"])]})

train = [o for o in orders if o["t"] < CUT.isoformat()]
test  = [o for o in orders if o["t"] >= CUT.isoformat()]

pairs = Counter()                          # affinity from TRAIN only
for o in train:
    ps = sorted({l["p"] for l in o["lines"]})
    pairs.update(combinations(ps, 2))
affinity = [[a, b, n] for (a, b), n in pairs.most_common(500)]

json.dump(products, open("public/data/products.json", "w"))
json.dump({"train": train, "test": test}, open("public/data/orders.json", "w"))
json.dump(affinity, open("public/data/affinity.json", "w"))
print(len(train), "train orders,", len(test), "test orders")
print("categories:", Counter(p["category"] for p in products).most_common())
print("ABC:", {k: (n, round(sum(p["valueTrain"] for p in products if p["abc"] == k) / value.sum(), 3))
               for k, n in sorted(Counter(p["abc"] for p in products).items())})
print("FL:", sorted(Counter(p["fl"] for p in products).items()))
