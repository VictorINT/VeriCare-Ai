import json
from llm_client import call_llm, parse_json_safe

def process(canonical):
    # 1. Initialize Skeleton with Python (Guarantees data presence)
    t = {
        "id": canonical.get("id"),
        "name": canonical.get("name"),
        "source_url": canonical.get("source_url"),
        "description": canonical.get("description"),
        "mission_statement": canonical.get("missionStatement"),
        "organization_description": canonical.get("organizationDescription"),
        # Initialize others as None/Empty strings
        "contact_info": "{}", "medical_details": "{}", 
        "stats": "{}", "reliability_reasons": "[]", "capability_reasons": "[]",
        "social_media_links": None, "client_capability": None, 
        "reliability": None, "embedding": None, "created_at": None
    }

    # 2. Ask LLM ONLY for the complex structures
    prompt = f"""
    Extract 'organization_info' and 'location_info' from this data.
    Return JSON Object with exactly these 2 keys.
    Input: {json.dumps(canonical, ensure_ascii=False)}
    """
    
    try:
        raw = call_llm(prompt, system_prompt="Output ONLY valid JSON.")
        data = parse_json_safe(raw)
        
        # Merge if successful
        if "organization_info" in data:
            t["organization_info"] = json.dumps(data["organization_info"])
        else:
            t["organization_info"] = "{}"
            
        if "location_info" in data:
            t["location_info"] = json.dumps(data["location_info"])
        else:
            t["location_info"] = "{}"
            
    except Exception as e:
        # Fallback: Create minimal valid JSON strings
        print(f"Agent 2 Warning: LLM failed ({e}). Using empty defaults.")
        t["organization_info"] = json.dumps({"organization_type": "facility"})
        t["location_info"] = json.dumps({"address_line1": canonical.get("address_line1")})

    return {"translated": t}