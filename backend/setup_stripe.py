"""Idempotent Stripe catalog setup for FARLIGHT (Flow A claimable sandbox)."""
import os
from pathlib import Path
from dotenv import load_dotenv
import stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

CATALOG = [
    {
        "emergent_product_id": "farlight_occasional",
        "name": "Prestazione Occasionale — Concept Preliminare (singolo ambiente)",
        "tax_code": "txcd_10000000",
        "prices": [
            {"lookup_key": "farlight_occasional", "amount": 4900, "currency": "eur"},
        ],
    },
    {
        "emergent_product_id": "farlight_studio_pro",
        "name": "Abbonamento Studio Pro — fino a 5 progetti/mese",
        "tax_code": "txcd_10000000",
        "prices": [
            {"lookup_key": "farlight_studio_pro", "amount": 14900, "currency": "eur", "interval": "month"},
        ],
    },
]


def ensure_tax_settings():
    s = stripe.tax.Settings.retrieve()
    if s.head_office and getattr(s.head_office, "address", None):
        print("Tax settings already configured")
        return
    stripe.tax.Settings.modify(
        head_office={"address": {"country": "IT", "line1": "Via della Luce 1",
                                 "city": "Milano", "postal_code": "20121"}},
        defaults={"tax_behavior": "exclusive"},
    )
    print("Tax settings configured")


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(
        name=entry["name"], tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]},
    )


def ensure_price(product, p):
    existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
    if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
        stripe.Price.modify(existing[0].id, active=False)
        existing = []
    if not existing:
        kwargs = dict(product=product.id, unit_amount=p["amount"], currency=p["currency"],
                      lookup_key=p["lookup_key"], transfer_lookup_key=True)
        if p.get("interval"):
            kwargs["recurring"] = {"interval": p["interval"]}
        price = stripe.Price.create(**kwargs)
        print(f"Created price {p['lookup_key']}: {price.id}")
    else:
        print(f"Price {p['lookup_key']} already exists")


if __name__ == "__main__":
    account = stripe.Account.retrieve()
    print(f"Stripe account: {account.id} country={account['country']}")
    ensure_tax_settings()
    for entry in CATALOG:
        product = get_or_create_product(entry)
        print(f"Product: {product.name} ({product.id})")
        for p in entry["prices"]:
            ensure_price(product, p)
    print("Catalog setup complete")
