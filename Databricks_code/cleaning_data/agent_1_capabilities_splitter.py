import json
import math
from llm_client import call_llm, parse_json_safe

def process_row(clean_virt_row):
    # 1. Sanitize NaNs (Crucial Step)
    safe_row = {}
    for k, v in clean_virt_row.items():
        if isinstance(v, float) and (math.isnan(v) or v != v):
            safe_row[k] = None
        else:
            safe_row[k] = v

    # 2. Python-side List Enforcement (No LLM needed for this)
    # We trust the row structure but ensure lists are lists
    canon = safe_row.copy()
    
    # Map ID if needed
    if "pk_unique_id" in canon and "id" not in canon:
        canon["id"] = canon["pk_unique_id"]
    if "unique_id" not in canon:
        canon["unique_id"] = canon.get("id")

    # Force List Types
    list_fields = ["specialties", "procedure", "equipment", "capability", 
                   "phone_numbers", "websites", "countries", "affiliationTypeIds"]
    for f in list_fields:
        if f not in canon or canon[f] is None:
            canon[f] = []
        elif isinstance(canon[f], str):
            # Try parsing if it looks like a list string "['a','b']"
            try:
                if canon[f].startswith("["):
                    canon[f] = json.loads(canon[f].replace("'", '"'))
                else:
                    canon[f] = [canon[f]]
            except:
                canon[f] = [canon[f]]
                
    return {"canonical": canon}