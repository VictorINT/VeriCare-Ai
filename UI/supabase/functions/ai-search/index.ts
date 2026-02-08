import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ search_terms: [], negate: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You parse healthcare facility search queries. Extract:
- search_terms: the medical services, capabilities, equipment, or facility types the user is asking about. Use simple lowercase terms like "surgery", "dental", "obstetrics", "emergency", "pediatrics", "imaging", "maternity", "x-ray", "ultrasound", "lab", etc. Include synonyms.
- negate: true if the user is asking for facilities that LACK or DON'T HAVE something, false if asking for facilities that HAVE something.
- region: if a specific Ghana region is mentioned (e.g. "Greater Accra", "Ashanti", "Northern"), include it. Otherwise empty string.

Examples:
"hospitals with surgery" → search_terms: ["surgery", "surgical"], negate: false
"facilities without dental care" → search_terms: ["dental", "dentistry"], negate: true  
"which regions lack emergency care" → search_terms: ["emergency"], negate: true
"show me hospitals that do obstetrics in Ashanti" → search_terms: ["obstetrics", "maternity", "maternal"], negate: false, region: "Ashanti"`
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_query",
              description: "Parse search intent",
              parameters: {
                type: "object",
                properties: {
                  search_terms: { type: "array", items: { type: "string" } },
                  negate: { type: "boolean" },
                  region: { type: "string" },
                },
                required: ["search_terms", "negate", "region"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_query" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call");

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
