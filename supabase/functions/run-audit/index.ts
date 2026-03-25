import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ConversionDoc, an expert CRO analyst. 
Analyse this landing page content across 6 pillars.
Return ONLY valid JSON in this exact format:

{
  "overall_score": [0-100],
  "verdict": "[Healthy/Needs Attention/Critical]",
  "scores": {
    "clarity": { "score": [0-10], "issue": "[string]", "fix": "[string]" },
    "hook": { "score": [0-10], "issue": "[string]", "fix": "[string]" },
    "trust": { "score": [0-10], "issue": "[string]", "fix": "[string]" },
    "desire": { "score": [0-10], "issue": "[string]", "fix": "[string]" },
    "action": { "score": [0-10], "issue": "[string]", "fix": "[string]" },
    "objections": { "score": [0-10], "issue": "[string]", "fix": "[string]" }
  },
  "top_3_fixes": [
    { "priority": 1, "issue": "[string]", "impact": "[string]", "fix": "[string]" },
    { "priority": 2, "issue": "[string]", "impact": "[string]", "fix": "[string]" },
    { "priority": 3, "issue": "[string]", "impact": "[string]", "fix": "[string]" }
  ]
}

Rules:
- overall_score = average of all 6 scores x 10
- Be specific. No vague advice.
- Most pages score between 30-65.
- Return ONLY the JSON. Nothing else.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return new Response(
        JSON.stringify({ error: "Invalid URL. Must start with http:// or https://" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Scrape with Jina Reader
    console.log("Scraping URL with Jina Reader:", url);
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain" },
    });

    if (!jinaResponse.ok) {
      console.error("Jina Reader error:", jinaResponse.status);
      return new Response(
        JSON.stringify({ error: "Failed to read the page. Please check the URL and try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pageContent = await jinaResponse.text();

    if (!pageContent || pageContent.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract enough content from that page." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Send to Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Sending to AI for analysis...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyse this landing page content:\n\n${pageContent.slice(0, 15000)}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-audit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
