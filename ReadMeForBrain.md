# Joseph's Baker Inventory - Sprint 1 (The Brain)

## Setup Instructions
1. **Create Virtual Environment:** `python3 -m venv venv`
2. **Activate Environment:**
   - Mac/Linux: `source venv/bin/activate`
   - Windows: `.\venv\Scripts\activate`
3. **Install Dependencies:** `pip install -r requirements.txt`
4. **The Data:** Ensure `branded_food.csv` is in the root folder.
5. **The Engine:** Install Tesseract OCR on your machine.

## Features Included
* **OCR Receipt Reader:** Extracts SKUs from Costco/Walmart images.
* **USDA SKU Lookup:** Connects SKUs to the 950MB `branded_food.csv` (not included in repo).
* **Volume Estimation:** Statistical calculation of remaining product.
* **Inventory Alerts:** Time-based triggers to validate stock levels.

## Setup Instructions
1. **The Data:** Download `branded_food.csv` from the USDA website and place it in the root folder.
2. **The Dependencies:** Run `pip install -r requirements.txt`.
3. **The Engine:** You must have Tesseract OCR installed on your OS for the receipt reader to function.
4. **Run:** Execute `python brain.py` to see the inventory report and validation alerts.

## Critical Note
The `branded_food.csv` is ignored by Git due to its 950MB size. Please ensure you have a local copy in the project directory before running.