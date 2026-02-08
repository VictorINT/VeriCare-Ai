"""
Orchestrator matching user filenames.
Flow: Splitter -> Cleaner -> Scope -> Reliability
"""
import json
import pandas as pd

# Imports using your specific filenames
from agent_1_capabilities_splitter import process_row as process_agent1
from agent_2_cleaner_formatter import process as process_agent2
from agent_3_capability_scope import process as process_agent3
from agent_4_reliability import process as process_agent4

def run_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    final_output_rows = []
    
    print(f"🔄 Processing {len(df)} rows through the 4-Agent Pipeline...")

    for index, r in df.iterrows():
        try:
            raw_row = r.to_dict()
            
            # --- Agent 1: Splitter ---
            res1 = process_agent1(raw_row)
            canonical = res1["canonical"]
            
            # --- Agent 2: Cleaner/Formatter ---
            res2 = process_agent2(canonical)
            translated = res2["translated"]
            
            # --- Agent 3: Capability Scope ---
            res3 = process_agent3(canonical, translated)
            translated = res3["translated"]
            
            # --- Agent 4: Reliability Audit ---
            res4 = process_agent4(canonical, translated)
            final_record = res4["translated"]
            
            final_output_rows.append(final_record)
            
            if (index + 1) % 5 == 0:
                print(f"✅ Completed {index + 1} rows...")

        except Exception as e:
            print(f"❌ Error on row {index} ({raw_row.get('name', 'Unknown')}): {e}")
            continue

    return pd.DataFrame(final_output_rows)