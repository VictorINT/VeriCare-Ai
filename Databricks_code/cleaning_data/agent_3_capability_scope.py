import json
from llm_client import call_llm, parse_json_safe

def process(canonical, translated):
    # 1. Setup Context
    prompt = f"""
    Analyze 'canonical' and create:
    1. contact_info (Object: phone_numbers, websites, email)
    2. medical_details (Object: specialties, procedures)
    3. client_capability (String summary)
    
    Canonical: {json.dumps(canonical, ensure_ascii=False)}
    """
    
    try:
        raw = call_llm(prompt, system_prompt="Output ONLY valid JSON.")
        data = parse_json_safe(raw)
        
        # 2. Update Translated Record
        if "contact_info" in data:
            translated["contact_info"] = json.dumps(data["contact_info"])
        if "medical_details" in data:
            translated["medical_details"] = json.dumps(data["medical_details"])
        if "client_capability" in data:
            translated["client_capability"] = data["client_capability"]
            
    except Exception as e:
        print(f"Agent 3 Warning: LLM enrichment failed ({e}). Keeping defaults.")

    return {"translated": translated}