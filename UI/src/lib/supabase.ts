import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ozefgycfszavqsxnpopz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZWZneWNmc3phdnFzeG5wb3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDE1ODQsImV4cCI6MjA4NjExNzU4NH0.oF-eBYodH_mfm-yu9v4fyE0weR46CWU7KQ6WK2F_DZk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
