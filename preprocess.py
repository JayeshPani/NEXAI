import os, json
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
products = [{"id": pid[c], "code": c,
             "name": str(names.get(c, "Unknown")).strip().title(),
             "picksTrain": int(picks[c])} for c in top]

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
