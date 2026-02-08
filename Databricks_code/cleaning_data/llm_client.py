import os
import requests
import json
import re

def call_llm(prompt, system_prompt="You are a helpful assistant", max_tokens=2000):
    host = os.environ.get("DATABRICKS_HOST", "").rstrip("/")
    token = os.environ.get("DATABRICKS_TOKEN")
    model = os.environ.get("DATABRICKS_MODEL_NAME", "databricks-meta-llama-3-3-70b-instruct")
    
    if not host or not token:
        raise Exception("Missing DATABRICKS_HOST or DATABRICKS_TOKEN.")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.1 # Slight temp helps avoid repetition loops
    }
    
    try:
        response = requests.post(f"{host}/serving-endpoints/{model}/invocations", headers=headers, json=body, timeout=60)
        if response.status_code != 200:
            raise Exception(f"API Error {response.status_code}: {response.text}")
        
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        raise Exception(f"LLM Connection Failed: {e}")

def parse_json_safe(text):
    """
    Robustly extracts JSON from LLM output, handling Markdown fences and extra text.
    """
    text = text.strip()
    
    # 1. Try stripping Markdown fences ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    
    # 2. If no fences, looks for the first '{' and last '}'
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]

    # 3. Try parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Fallback: simple cleanup of common trailing chars
        raise ValueError(f"Failed to parse JSON. Raw text start: {text[:50]}... Error: {e}")