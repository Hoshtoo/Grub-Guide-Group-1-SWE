
import os
import time
import base64
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # loads KROGER_CLIENT_ID and KROGER_CLIENT_SECRET from .env

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

TOKEN_URL     = "https://api.kroger.com/v1/connect/oauth2/token"
PRODUCTS_URL  = "https://api.kroger.com/v1/products"
LOCATIONS_URL = "https://api.kroger.com/v1/locations"


def _kroger_get(token, url, params, retries=3, backoff=1.5):
    """
    GET request to Kroger API with automatic retry on 503/429.
    retries: number of attempts total
    backoff: seconds to wait between attempts (doubles each time)
    """
    wait = backoff
    for attempt in range(retries):
        resp = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            params=params,
            timeout=10,
        )
        if resp.status_code in (503, 429):
            print(f"   Kroger {resp.status_code} on attempt {attempt+1}/{retries} — retrying in {wait}s...")
            time.sleep(wait)
            wait *= 2
            continue
        return resp
    return resp  # return last response even if still failing


# ── Internal: fetch a fresh token ─────────────
def _get_token():
    client_id     = os.environ.get("KROGER_CLIENT_ID")
    client_secret = os.environ.get("KROGER_CLIENT_SECRET")

    if not client_id or not client_secret:
        return None, "Server credentials not configured."

    credentials = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()

    resp = requests.post(
        TOKEN_URL,
        headers={
            "Content-Type":  "application/x-www-form-urlencoded",
            "Authorization": f"Basic {credentials}",
        },
        data={"grant_type": "client_credentials", "scope": "product.compact"},
        timeout=10,
    )

    if resp.status_code != 200:
        return None, f"Kroger auth failed ({resp.status_code})"

    return resp.json().get("access_token"), None


# ── Route: serve the frontend ─────────────────
@app.route("/")
def index():
    return app.send_static_file("index.html")


# ── Route: find stores by zip ─────────────────
@app.route("/api/locations")
def locations():
    zip_code = request.args.get("zip", "").strip()
    if not zip_code.isdigit() or len(zip_code) != 5:
        return jsonify({"error": "Invalid zip code."}), 400

    token, err = _get_token()
    if err:
        return jsonify({"error": err}), 500

    resp = _kroger_get(token, LOCATIONS_URL,
        params={"filter.zipCode.near": zip_code, "filter.limit": 5}
    )

    if resp.status_code != 200:
        return jsonify({"error": f"Location search failed ({resp.status_code})"}), 502

    raw       = resp.json().get("data", [])
    locations = []
    for loc in raw:
        addr = loc.get("address", {})
        locations.append({
            "locationId": loc.get("locationId"),
            "name":       loc.get("name", "Unknown"),
            "chain":      loc.get("chain", ""),
            "address":    f"{addr.get('addressLine1','')}, {addr.get('city','')}, {addr.get('state','')}",
        })

    return jsonify({"locations": locations})


# ── Route: search products at a location ──────
@app.route("/api/products")
def products():
    import json

    term        = request.args.get("term", "").strip()
    location_id = request.args.get("locationId", "").strip()

    print(f"\n══ PRODUCT REQUEST: term='{term}' locationId='{location_id}' ══")

    if not term:
        return jsonify({"error": "Search term required."}), 400
    if not location_id:
        return jsonify({"error": "locationId required."}), 400

    token, err = _get_token()
    if err:
        return jsonify({"error": err}), 500

    print(f"   Token acquired: {token[:20]}...")

    resp = _kroger_get(token, PRODUCTS_URL, params={
        "filter.term":       term,
        "filter.locationId": location_id,
        "filter.limit":      10,
    })

    print(f"   Kroger API status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"   ERROR body: {resp.text}")
        return jsonify({"error": f"Product search failed ({resp.status_code})"}), 502

    raw = resp.json().get("data", [])
    print(f"   Products returned: {len(raw)}")

    # Print the FULL first product so we can see every field
    if raw:
        print("   FIRST PRODUCT FULL DUMP:")
        print(json.dumps(raw[0], indent=4))

    products = []
    for p in raw:
        items      = p.get("items", [{}])
        item       = items[0] if items else {}
        price_info = item.get("price", {})

        regular = price_info.get("regular")
        promo   = price_info.get("promo")

        print(f"   → {p.get('description')} | regular={regular} | promo={promo} | price_info={price_info}")

        if promo is not None and promo > 0:
            price = promo
        elif regular is not None and regular > 0:
            price = regular
        else:
            price = None

        products.append({
            "productId":   p.get("productId"),
            "description": p.get("description", "Unknown"),
            "brand":       p.get("brand", ""),
            "size":        item.get("size", ""),
            "price":       price,
        })

    print(f"   Final prices sent to frontend: {[p['price'] for p in products]}")
    print("══════════════════════════════════════════\n")

    return jsonify({"products": products})


# ── Route: health check ───────────────────────
@app.route("/api/health")
def health():
    has_creds = bool(
        os.environ.get("KROGER_CLIENT_ID") and
        os.environ.get("KROGER_CLIENT_SECRET")
    )
    return jsonify({"status": "ok", "credentials_configured": has_creds})


# ── Route: raw debug — returns unprocessed Kroger response ──
# Usage: http://localhost:5000/api/debug?term=milk&locationId=YOUR_LOCATION_ID
@app.route("/api/debug")
def debug():
    term        = request.args.get("term", "milk").strip()
    location_id = request.args.get("locationId", "").strip()

    token, err = _get_token()
    if err:
        return jsonify({"error": err}), 500

    params = {"filter.term": term, "filter.limit": 2}
    if location_id:
        params["filter.locationId"] = location_id

    resp = _kroger_get(token, PRODUCTS_URL, params=params)

    # Return the raw unmodified Kroger API response
    return jsonify({
        "kroger_status": resp.status_code,
        "params_sent":   params,
        "raw_response":  resp.json(),
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
