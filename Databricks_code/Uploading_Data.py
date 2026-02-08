# Databricks notebook source
# MAGIC %pip install supabase

# COMMAND ----------

# MAGIC %md
# MAGIC ## Imports

# COMMAND ----------

import pandas as pd
from supabase import create_client, Client

# COMMAND ----------

url = "https://ozefgycfszavqsxnpopz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZWZneWNmc3phdnFzeG5wb3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDE1ODQsImV4cCI6MjA4NjExNzU4NH0.oF-eBYodH_mfm-yu9v4fyE0weR46CWU7KQ6WK2F_DZk"
supabase: Client = create_client(url, key)

# COMMAND ----------

df = spark.read.table("workspace.default.finaldata")
df = df.toPandas()

# Convert datetime columns to string
for col in df.select_dtypes(include=['datetime64', 'datetime']).columns:
    df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')

records = df.to_dict(orient='records')

try:
    data = supabase.table('hospitals').insert(records).execute()
    print(f"Succes! Loaded {len(records)} entries.")
except Exception as e:
    print(f"Error: {e}")