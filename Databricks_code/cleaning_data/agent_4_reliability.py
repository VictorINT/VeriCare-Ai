import json
from datetime import datetime
from llm_client import call_llm, parse_json_safe

def process(canonical, translated):
    # 1. LLM Audit
    prompt = f"""
    Determine 'reliability' (High/Moderate/Low) and 'reliability_reasons' (List).
    Create 'stats' object with score (0-100).
    Input: {json.dumps(translated, ensure_ascii=False)}
    """
    
    try:
        raw = call_llm(prompt, system_prompt="Output ONLY valid JSON.")
        data = parse_json_safe(raw)
        
        if "reliability" in data:
            translated["reliability"] = data["reliability"]
        if "reliability_reasons" in data:
            translated["reliability_reasons"] = json.dumps(data["reliability_reasons"])
        if "stats" in data:
            translated["stats"] = json.dumps(data["stats"])
            
    except Exception as e:
        print(f"Agent 4 Warning: LLM Audit failed ({e}). Using Heuristic.")
        
    # 2. FINAL GUARANTEE (The Heuristic Fallback)
    # If reliability is still missing, calculate it based on data presence
    if not translated.get("reliability"):
        has_name = bool(translated.get("name"))
        has_source = bool(translated.get("source_url"))
        if has_name and has_source:
            translated["reliability"] = "Moderate"
            translated["reliability_reasons"] = '["Auto-assigned Moderate: Basic info present but LLM audit skipped."]'
        else:
            translated["reliability"] = "Low"
            translated["reliability_reasons"] = '["Auto-assigned Low: Missing core identifiers."]'

    # Ensure stats exist
    if not translated.get("stats") or translated["stats"] == "{}":
        translated["stats"] = json.dumps({"score": 50, "note": "Heuristic Default"})

    translated["created_at"] = datetime.utcnow().isoformat() + "Z"
    
    return {"translated": translated}