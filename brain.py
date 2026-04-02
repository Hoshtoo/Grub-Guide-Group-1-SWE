'''This will be the brain backend for the volume estimation and receipt reading. These two parts will be written in python since
I can just implement basic statistical/ML libraries in Python quickly.'''
import pytesseract
from PIL import Image
import os
import math
import re
import datetime
import statistics
import pandas as pd


def vol_estimator(initial, days_passed, avg_consumption):
    estimated_remaining = initial -(days_passed*avg_consumption)
    return max(0, estimated_remaining)

def receipt_reader(img):
    receipt = pytesseract.image_to_string(Image.open(img))
    vals = re.compile(r'\b\d{7}\b|\b\d{10,13}\b')
    skus = vals.findall(receipt)
    return skus


def poisson_dist(lambda_p, k):
    e = math.e
    prob = (e**(-lambda_p)) * (((lambda_p)**k)/math.factorial(k))
    expected_value = lambda_p
    variance = lambda_p
    return prob, expected_value, variance

def exponential_dist(lambda_x, x):
    e = math.e
    f_of_x = lambda_x * ((e)**(-lambda_x*x))
    expected_value = 1/lambda_x
    variance = 1/(lambda_x**2)
    cdf = 1 - ((e)**(-lambda_x*x))
    return f_of_x, expected_value, variance, cdf

def confidence_score(z_score, mean, standard_deviation, sample_size):
    table = {"90": 1.645, "95": 1.96, "99": 2.575, "99.5": 2.81, "99.9": 3.29}
    margin_of_error = table[z_score] * (standard_deviation/(math.sqrt(sample_size)))
    upper = mean+(table[f"{z_score}"]*(standard_deviation)/math.sqrt(sample_size))
    lower = mean-(table[f"{z_score}"]*(standard_deviation)/math.sqrt(sample_size))
    interval = [lower, upper]
    return round(margin_of_error, 2), interval

def sku_lookup(sku, csv_path="branded_food.csv"):
    cols = ["gtin_upc", "serving_size", "serving_size_unit", "short_description"]
    df = pd.read_csv(csv_path, usecols=cols, low_memory=False)
    found = df[(df["gtin_upc"].astype(str).str.contains(sku.strip())) & (df["serving_size_unit"].notna()) & (df["short_description"].notna())]
    if not found.empty:
        return found.iloc[0].to_dict()
    return None

def inventory_report(sku, days_on_shelf, user_history):
    product = sku_lookup(sku)
    if not product:
        return f"SKU {sku} not found. Use Manual Entry"
    serv_size = product["serving_size"]
    remaining = vol_estimator(serv_size, days_on_shelf, user_history["mean"])
    margin, interval = confidence_score("90", user_history["mean"], user_history["std_dev"], user_history["n"])
    return (f"Item: {product["short_description"]}\n"
            f"Approximately this much left: {remaining} {product["serving_size"]}\n"
            f"Confidence: 90% (Margin +/- {margin})")


now = datetime.datetime.now()

inventory_db = {
    "00027000612323": {
        "name": "WESSON VEGETABLE OIL",
        "last_updated": now - datetime.timedelta(days=10), 
        "n_days_threshold": 7,  # Alert after 7 days
        "current_vol": 15.0,
        "unit": "MLT"
    },
    "00051000198808": {
        "name": "SWN BF BRTH ASPTC",
        "last_updated": now - datetime.timedelta(days=2),  
        "n_days_threshold": 5,  # Alert after 5 days
        "current_vol": 240.0,
        "unit": "GRM"
    },
    "00051000213273": {
        "name": "CPB SLW KTL NECC",
        "last_updated": now - datetime.timedelta(days=6),  
        "n_days_threshold": 3,  
        "current_vol": 440.0,
        "unit": "GRM"
    },
    "00051000232847": {
        "name": "CPB SPAGOS W FRNKS",
        "last_updated": now - datetime.timedelta(days=1), 
        "n_days_threshold": 14, 
        "current_vol": 443.0,
        "unit": "GRM"
    }
}

def run_validation_monitor(db):

    flagged_for_review = []
    current_time = datetime.datetime.now()
    
    print(f"--- System Scan: {current_time.strftime('%Y-%m-%d %H:%M')} ---")
    
    for sku, data in db.items():

        delta = current_time - data["last_updated"]
        
        if delta.days >= data["n_days_threshold"]:
            flagged_for_review.append({
                "sku": sku,
                "name": data["name"],
                "days_since_update": delta.days
            })
            
    return flagged_for_review

def trigger_inventory_alerts(flagged_items, db):

    if not flagged_items:
        print("Inventory is up to date. No alerts triggered.")
        return

    print(f"\n🔔 PUSH NOTIFICATION: {len(flagged_items)} items need validation!")
    print("Joseph, please check your pantry levels for accuracy:")
    
    for item in flagged_items:
        sku = item['sku']
        print(f"\n⚠️ ALERT: {item['name']} (SKU: {sku})")
        print(f"   It has been {item['days_since_update']} days since your last update.")
        
        try:
            val = input(f"   How much is left? (Current estimate: {db[sku]['current_vol']} {db[sku]['unit']}): ")
            db[sku]["current_vol"] = float(val)
            db[sku]["last_updated"] = datetime.datetime.now() # Reset timestamp
            print(f"   ✅ Database Updated. Thank you, Joseph!")
        except ValueError:
            print("   ⏩ Update skipped or invalid input.")

mock_history = {"mean": 7.0, "std_dev": 0.025, "n": 10}
experiment = ["00027000612323", "00051000198808", "00051000213273", "00051000213303",
             "00051000224637", "00051000227492", "00051000227492", "00051000024213",
             "00051000227478", "00051000058874", "00051000232847"]
for i in experiment:
    print(inventory_report(i, 3, mock_history))
    print()

print(receipt_reader("WalmartReceipt.jpg"))

if __name__ == "__main__":
   
    to_alert = run_validation_monitor(inventory_db)
    
    trigger_inventory_alerts(to_alert, inventory_db)

