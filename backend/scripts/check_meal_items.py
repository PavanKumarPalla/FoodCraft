"""
Check which meal items exist in Hugging Face RecipeNLG dataset (train.csv).
"""
import pandas as pd
import json
import re

CSV_PATH = r"C:\Users\pavan\.cache\huggingface\hub\datasets--Default-Box--recipe_nlg-trim\snapshots\65198d5d9bcfda8da9dfa21919a26b1445238ce5\train.csv"

items = [
    # Breakfast items
    'Dosa', 'Chutney', 'Upma', 'Pongal', 'Vada', 'Idli', 'Poori', 'Uggani', 'Bajji', 'Pesarattu',
    # Lunch/Dinner South Indian items
    'Sambar Rice', 'Full Meals', 'Tomato Rice', 'Lady Finger', 'Lemon Rice', 'Brinjal Curry', 
    'Bagara Rice', 'Paneer Curry', 'Chicken Curry', 'Chicken Biryani', 'Chicken Fry',
    'Mutton Biryani', 'Ragi Rice', 'Fish Curry', 'Pulagam', 'Mutton Curry', 'Egg Curry',
    'Mushroom Curry', 'Veg Biryani', 'Brinjal Biryani', 'Chapati', 'Vegetable Curry', 
    'Dal', 'Curd', 'Rasam', 'Papad', 'Papadam', 'Cluster Beans', 'Roti', 'Aloo Curry',
    'Beetroot', 'Egg Roast', 'Sundal Curry', 'Aloo Fry', 'Tomato Curry', 'Cabbage Curry',
    'Cauliflower Curry', 'Egg Rice', 'Veg Pulav', 'Pulao'
]

print("Scanning dataset with on_bad_lines='skip' & engine='python'...")
try:
    df = pd.read_csv(CSV_PATH, usecols=['title', 'ingredients', 'directions', 'NER'], on_bad_lines='skip', engine='python')
except Exception as e:
    print(f"Fallback reading in chunks or with latin-1: {e}")
    df = pd.read_csv(CSV_PATH, usecols=['title', 'ingredients', 'directions', 'NER'], on_bad_lines='skip', engine='python', encoding_errors='ignore')
print(f"Loaded {len(df)} recipes successfully!")

results = {}
for item in items:
    # First search exact title match
    pattern = re.compile(r'\b' + re.escape(item) + r'\b', re.IGNORECASE)
    m = df[df['title'].str.contains(pattern, na=False)]
    
    if len(m) > 0:
        results[item] = {
            'found': True,
            'match_type': 'title',
            'count': len(m),
            'sample_title': m.iloc[0]['title'],
            'sample_directions': str(m.iloc[0]['directions'])[:150]
        }
    else:
        # Check in ingredients/NER or partial words
        # split multi-word like 'Sambar Rice' into words
        parts = item.split()
        if len(parts) > 1:
            part_pattern = '.*'.join([re.escape(p) for p in parts])
            m_part = df[df['title'].str.contains(part_pattern, case=False, na=False, regex=True)]
            if len(m_part) > 0:
                results[item] = {
                    'found': True,
                    'match_type': 'title_subphrase',
                    'count': len(m_part),
                    'sample_title': m_part.iloc[0]['title']
                }
                continue

        results[item] = {
            'found': False,
            'count': 0
        }

with open('backend/data/meal_items_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print("\n--- Summary ---")
found_items = [k for k, v in results.items() if v['found']]
missing_items = [k for k, v in results.items() if not v['found']]

print(f"Found in Hugging Face RecipeNLG ({len(found_items)} items):")
for it in found_items:
    print(f"  ✓ {it} (e.g. {results[it].get('sample_title')})")

print(f"\nMissing from Hugging Face RecipeNLG ({len(missing_items)} items):")
for it in missing_items:
    print(f"  ✗ {it}")
