# Databricks notebook source
# MAGIC %pip install langgraph langchain_core langchain_openai
# MAGIC %pip install databricks-sdk mlflow langchain-community

# COMMAND ----------

# MAGIC %md
# MAGIC ## Imports

# COMMAND ----------

import sys
import os
import re
import json
import pandas as pd
import requests
import importlib

# COMMAND ----------

# Add the specific folder where llm_client.py lives
path = "/Workspace/hackathon/cleaning_data"
if path not in sys.path:
    sys.path.append(path)

# Force a check
try:
    import llm_client
    print("llm_client found!")
except ImportError:
    print("llm_client still not found. Check the file path.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Load raw data from Databricks table

# COMMAND ----------

# --- Load from Databricks table ---
df = spark.read.table("workspace.default.virtue_foundation_ghana_")
df = df.toPandas()
print(f"Loaded {len(df)} rows from virtue_foundation_ghana_")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Preparing the data for MultiAgent analysis by cleaning

# COMMAND ----------

# --- Cleaning pipeline ---

# 1. Rename column with space for easier use
if "mongo DB" in df.columns:
    df = df.rename(columns={"mongo DB": "mongo_id"})

# 2. Replace literal "null" strings with NaN
df = df.replace("null", pd.NA)

# 3. Strip whitespace from string columns
for col in df.select_dtypes(include=["object"]).columns:
    df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

# 4. Normalize list-like columns: parse JSON-like strings, then back to consistent JSON string
def safe_parse_list(s):
    if pd.isna(s) or s is None:
        return None
    s = str(s).strip()
    if s in ("", "[]", "null"):
        return None
    s = re.sub(r'""', '"', s)
    try:
        out = json.loads(s)
        return out if isinstance(out, list) else None
    except (json.JSONDecodeError, TypeError):
        return None

list_columns = [
    "specialties", "procedure", "equipment", "capability",
    "phone_numbers", "websites", "affiliationTypeIds", "countries"
]
for col in list_columns:
    if col not in df.columns:
        continue
    parsed = df[col].apply(safe_parse_list)
    df[col] = parsed.apply(lambda x: json.dumps(x) if x else "")

# 5. Coerce numeric columns
numeric_cols = ["pk_unique_id", "yearEstablished", "area", "numberDoctors", "capacity"]
for col in numeric_cols:
    if col not in df.columns:
        continue
    df[col] = pd.to_numeric(df[col], errors="coerce")

# 6. Merge duplicate unique_id rows: combine information from all, then keep one row per unique_id
LIST_COLUMNS = [
    "specialties", "procedure", "equipment", "capability",
    "phone_numbers", "websites", "affiliationTypeIds", "countries"
]

def merge_list_column(series):
    seen = set()
    out = []
    for val in series:
        if pd.isna(val) or val == "":
            continue
        parsed = safe_parse_list(val)
        if not parsed:
            continue
        for item in parsed:
            key = (item if isinstance(item, str) else json.dumps(item))
            if key not in seen:
                seen.add(key)
                out.append(item)
    return json.dumps(out) if out else ""

def first_non_null(series):
    for v in series:
        if pd.notna(v) and v != "" and str(v).strip() != "":
            return v
    return pd.NA

def merge_group_into_one_row(group):
    row = {}
    for col in group.columns:
        if col in LIST_COLUMNS:
            row[col] = merge_list_column(group[col])
        elif col == "source_url":
            urls = group[col].dropna().astype(str).str.strip()
            urls = urls[urls != ""].unique()
            row[col] = " | ".join(urls) if len(urls) else ""
        else:
            row[col] = first_non_null(group[col])
    return pd.Series(row)

n_before = len(df)
merged_rows = []
for _uid, group in df.groupby("pk_unique_id"):
    merged_rows.append(merge_group_into_one_row(group))
df = pd.DataFrame(merged_rows)
print(f"Merged duplicate unique_id rows: {n_before} -> {len(df)} rows")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Save cleaned CSV locally

# COMMAND ----------

# This creates the physical file that Agent 1, 2, 3, and 4 will look for
csv_output_path = "/Workspace/hackathon/clean_virt.csv"
df.to_csv(csv_output_path, index=False)
print(f"CSV saved successfully for LLM agents at: {csv_output_path}")

# --- Write cleaned data to a NEW table in the catalogue (original is not touched) ---
# Same schema (e.g. workspace.default) as the source, new table name
cleaned_table_name = "workspace.default.cleandata"  # or "workspace.default.virtue_foundation_ghana_cleaned"
spark_df = spark.createDataFrame(df)
spark_df.write.format("delta").mode("overwrite").saveAsTable(cleaned_table_name)
print(f"Cleaned data written to table: {cleaned_table_name}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Testing

# COMMAND ----------

# --- Display cleaned data (Databricks) ---
display(df[["name", "address_city", "capability"]])

# COMMAND ----------


# --- Summary info about the cleaned dataset ---
print(f"\n--- cleandata summary ---")
print(f"Number of rows: {len(df)}")
print(f"Number of columns: {len(df.columns)}")
print(f"Column names (header): {list(df.columns)}")
print(f"\nFirst 2 full rows (all columns):")
print(df.head(2).to_string())
print(f"\n--- end summary ---\n")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Now that we have clean data, we can start extracting information.

# COMMAND ----------

df = df.drop(columns=["unique_id", "content_table_id", "mongo_id"], errors="ignore")
# Display top 3 rows of the cleaned table
display(df.head(3))

print("Columns:", list(df.columns))

# Columns: ['source_url', 'name', 'specialties', 'procedure', 'equipment', 'capability', 'organization_type', 'phone_numbers', 'email', 'websites', 'officialWebsite', 'yearEstablished', 'acceptsVolunteers', 'facebookLink', 'twitterLink', 'linkedinLink', 'instagramLink', 'logo', 'address_line1', 'address_line2', 'address_line3', 'address_city', 'address_stateOrRegion', 'address_zipOrPostcode', 'address_country', 'address_countryCode', 'countries', 'missionStatement', 'missionStatementLink', 'organizationDescription', 'facilityTypeId', 'operatorTypeId', 'affiliationTypeIds', 'description', 'area', 'numberDoctors', 'capacity', 'unique_id']

# Define columns for each list as requested

location_cols = [
    "address_line1", "address_line2", "address_line3", "address_city",
    "address_stateOrRegion", "address_zipOrPostcode", "address_country",
    "address_countryCode", "countries", "area"
]

social_media_cols = [
    "facebookLink", "twitterLink", "linkedinLink", "instagramLink"
]

website_cols = [
    "websites", "officialWebsite", "missionStatementLink"
]

# List 1: All columns except websites, social media, and location
# Move 'email', 'phone_numbers', 'logo' to social_media_cols
social_media_cols += ["email", "phone_numbers", "logo"]

# Create list_urls with 'source_url', 'yearEstablished', 'pk_unique_id'
list_urls = [col for col in ["pk_unique_id", "source_url", "yearEstablished"] if col in df.columns]

# MAINLIST: exclude website, social media, location, logo, email, phone_numbers, source_url, yearEstablished, pk_unique_id
exclude_cols = set(website_cols + social_media_cols + location_cols + ["source_url", "yearEstablished", "pk_unique_id"])
MAINLIST = [col for col in df.columns if col not in exclude_cols]

# List 2: Location columns
LIST2 = [col for col in df.columns if col in location_cols]

# List 3: The rest (websites and social media columns)
LIST3 = [col for col in df.columns if col in website_cols + social_media_cols]

# COMMAND ----------

# MAGIC %md
# MAGIC ## Checking our most important information from the main list.

# COMMAND ----------

print("mainlist columns:", MAINLIST)
display(df[MAINLIST])

# COMMAND ----------

# MAGIC %md
# MAGIC ## Core Information
# MAGIC
# MAGIC 1. **Specialization**
# MAGIC 2. **Equipment**
# MAGIC 3. **Doctors**
# MAGIC    - Type / specialty  
# MAGIC    - Number of doctors  
# MAGIC    → **Capability**
# MAGIC      - What they can do
# MAGIC      - How much / capacity
# MAGIC    → **Reliability**
# MAGIC      - Questionable ❓ or Safe ✅
# MAGIC 4. **What they can do**
# MAGIC    - Procedures / treatments
# MAGIC 5. **Facility**
# MAGIC    - Type / ID
# MAGIC 6. **Mission**
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## Location & Contact
# MAGIC
# MAGIC I. **Hospital location**  
# MAGIC II. **Contact details**  
# MAGIC III. **Social media**  
# MAGIC IV. **Website URLs**  
# MAGIC V. **Additional information**
# MAGIC
# MAGIC ---
# MAGIC
# MAGIC ## Agent Responsibilities
# MAGIC
# MAGIC **Agent 1: Splitter — Raw Data Standardization**
# MAGIC - Sanitize input rows by removing NaNs and corrupt data
# MAGIC - Normalize core identifiers (IDs, Names)
# MAGIC - Enforce list structures for Capabilities, Procedures, and Equipment
# MAGIC
# MAGIC **Agent 2: Cleaner — Schema Alignment & Extraction**
# MAGIC - Map canonical data to the target 18-column schema
# MAGIC - Extract and structure complex entities (organization_info, location_info)
# MAGIC - Initialize missing fields with safe JSON defaults
# MAGIC
# MAGIC **Agent 3: Scope — Capability & Contact Enrichment**
# MAGIC - Recover missing contact details (phone numbers, emails) from raw text
# MAGIC - Define medical scope (specialties, procedures)
# MAGIC - Synthesize client_capability: a summary of what the facility can do for a patient
# MAGIC
# MAGIC **Agent 4: Reliability — Audit & Trust Scoring**
# MAGIC - Assess data completeness (presence of Name, Source, Location)
# MAGIC - Detect contradictions or "red flags" in the description
# MAGIC - Assign a Reliability Grade (High/Moderate/Low) and generate an audit trail (reliability_reasons)
# MAGIC

# COMMAND ----------

# MAGIC %md
# MAGIC ## test api connection
# MAGIC

# COMMAND ----------

def debug_llm_connection():
    host = os.environ["DATABRICKS_HOST"]
    token = os.environ["DATABRICKS_TOKEN"]
    model = os.environ["DATABRICKS_MODEL_NAME"]
    
    url = f"{host}/serving-endpoints/{model}/invocations"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"messages": [{"role": "user", "content": "test"}], "max_tokens": 5}
    
    resp = requests.post(url, headers=headers, json=body)
    
    if resp.status_code == 200:
        print("🚀 SUCCESS! Direct API connection works.")
    else:
        print(f"❌ FAILED! Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")

debug_llm_connection()

# COMMAND ----------

# MAGIC %md
# MAGIC ## Test everything is loading correctly

# COMMAND ----------

# 1. SETUP PATHS
cleaning_data_path = "/Workspace/hackathon/cleaning_data"
if cleaning_data_path not in sys.path:
    sys.path.append(cleaning_data_path)

print("--- 🏥 SYSTEM HEALTH CHECK ---")

# STAGE 1: Environment Variables
print("\n[1/4] Checking Environment...")
vars_to_check = ["DATABRICKS_HOST", "DATABRICKS_TOKEN", "DATABRICKS_MODEL_NAME"]
missing = [v for v in vars_to_check if not os.environ.get(v)]

if missing:
    print(f"❌ FAIL: Missing environment variables: {missing}")
    print("👉 Action: Run your 'Credentials Injection' cell first.")
else:
    print(f"✅ PASS: All credentials found. Target Model: {os.environ['DATABRICKS_MODEL_NAME']}")

# STAGE 2: Direct API Connection (The "Dial Tone")
print("\n[2/4] Testing Direct API Call...")
import requests
try:
    host = os.environ["DATABRICKS_HOST"]
    token = os.environ["DATABRICKS_TOKEN"]
    model = os.environ["DATABRICKS_MODEL_NAME"]
    url = f"{host}/serving-endpoints/{model}/invocations"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {"messages": [{"role": "user", "content": "ping"}], "max_tokens": 5}
    
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    if resp.status_code == 200:
        print(f"✅ PASS: Direct API connection is LIVE.")
    else:
        print(f"❌ FAIL: API returned status {resp.status_code}: {resp.text}")
except Exception as e:
    print(f"❌ FAIL: API connection error: {e}")

# STAGE 3: Wrapper Test (Is llm_client.py correct?)
print("\n[3/4] Testing llm_client.py Wrapper...")
try:
    from llm_client import call_llm
    test_response = call_llm("Repeat the word 'Success'")
    if "Success" in test_response:
        print(f"✅ PASS: llm_client.py is working correctly. Response: '{test_response}'")
    else:
        print(f"⚠️ WARN: Wrapper returned unexpected string: '{test_response}'")
except Exception as e:
    print(f"❌ FAIL: llm_client.py wrapper crashed: {e}")
    print("👉 Action: Your .py file content is likely still using the old buggy logic.")

# STAGE 4: Orchestrator Test (Agent Logic)
print("\n[4/4] Testing Orchestrator on 1 Row...")
try:
    from orchestrator import run_pipeline
    # Create a dummy row for testing
    test_df = pd.DataFrame([{
        "name": "Test Hospital",
        "capability": '["Emergency Room", "X-Ray"]',
        "specialties": '["Cardiology"]'
    }])
    
    result = run_pipeline(test_df)
    reliability = result.iloc[0].get("reliability", "MISSING")
    reasoning = result.iloc[0].get("reliability_reasoning", "MISSING")
    
    if reliability != "uncertain" and reasoning != "Assessment failed.":
        print("✅ PASS: Orchestrator successfully ran Agents 1-4.")
        print(f"   - Reliability: {reliability}")
        print(f"   - Scoped Services: {result.iloc[0].get('capability_scope_services')}")
    else:
        print(f"❌ FAIL: Orchestrator returned a failure state.")
        print(f"   - Reason: {reasoning}")
except Exception as e:
    print(f"❌ FAIL: Orchestrator crashed during execution: {e}")

print("\n--- CHECK COMPLETE ---")

# COMMAND ----------

# MAGIC %md
# MAGIC ## reload all files to ensure new version is the one used

# COMMAND ----------

import sys
import os
import importlib.util

# 1. The exact folder where your scripts live
folder_path = "/Workspace/hackathon/cleaning_data"

# 2. List of your files in the order they should be loaded
modules_to_load = [
    'llm_client', 
    'agent_1_capabilities_splitter', 
    'agent_2_cleaner_formatter', 
    'agent_3_capability_scope', 
    'agent_4_reliability',
    'orchestrator' # Load last so it sees the new agents
]

print("--- 🛠️ FORCING MANUAL MODULE LOAD ---")

for module_name in modules_to_load:
    file_path = os.path.join(folder_path, f"{module_name}.py")
    
    try:
        # Create a module spec from the physical file path
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        module = importlib.util.module_from_spec(spec)
        
        # Add it to the system registry
        sys.modules[module_name] = module
        
        # Execute the module code
        spec.loader.exec_module(module)
        
        # Make it available globally in the notebook
        globals()[module_name] = module
        
        print(f"✅ Successfully loaded: {module_name}")
    except Exception as e:
        print(f"❌ Failed to load {module_name} from {file_path}: {e}")

print("\n🚀 All modules are live. You can now run the enrichment cell.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## transforming data to upload to supabase

# COMMAND ----------

import pandas as pd
import os
import time
from orchestrator import run_pipeline

# 1. 🔑 Setup Environment
try:
    # Auto-detect Databricks credentials
    os.environ["DATABRICKS_HOST"] = dbutils.notebook.entry_point.getDbutils().notebook().getContext().apiUrl().get()
    os.environ["DATABRICKS_TOKEN"] = dbutils.notebook.entry_point.getDbutils().notebook().getContext().apiToken().get()
    os.environ["DATABRICKS_MODEL_NAME"] = "databricks-meta-llama-3-3-70b-instruct"
except:
    print("⚠️ Note: Ensure DATABRICKS_HOST and DATABRICKS_TOKEN are set in your environment variables.")

# 2. 📥 Load the FULL Dataset
input_filename = 'clean_virt.csv'
output_filename = 'hospitals_translated_full.csv'

print(f"📖 Loading full dataset from: {input_filename}")
df_full = pd.read_csv(input_filename)
total_rows = len(df_full)

print(f"🚀 Starting transformation of {total_rows} rows...")
print("    (This may take some time. The orchestrator will print progress every 5 rows.)")

# 3. ⚙️ Run the Pipeline
start_time = time.time()

try:
    # Pass the ENTIRE dataframe to the pipeline
    df_result = run_pipeline(df_full)
    
    # 4. 💾 Save to CSV
    df_result.to_csv(output_filename, index=False)
    
    end_time = time.time()
    duration_min = (end_time - start_time) / 60
    
    print(f"\n✅ SUCCESS! Transformation Complete.")
    print(f"⏱️ Time taken: {duration_min:.2f} minutes")
    print(f"📂 Saved {len(df_result)} rows to: {output_filename}")

except Exception as e:
    print(f"\n❌ CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()