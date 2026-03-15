// Vault Assistant Edge Function - Google Gemini Direct API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service configuration error. GEMINI_API_KEY is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { messages } = await req.json();

    // Fetch user's vault data for context
    const { data: tools } = await supabase
      .from("tools")
      .select("name, category, platform, price, billing_cycle, last_used, times_used, purchase_date, tags, usage_goal, annual_value, notes")
      .eq("user_id", userId);

    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("tool_id, timestamp, source, duration")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(100);

    // Build vault context summary
    const toolCount = tools?.length || 0;
    const totalSpend = tools?.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0) || 0;
    const unusedTools = tools?.filter((t: any) => !t.last_used) || [];
    const mostUsed = [...(tools || [])].sort((a: any, b: any) => (b.times_used || 0) - (a.times_used || 0)).slice(0, 5);

    const vaultContext = `
## User's StackVault Data (live from database)

**Overview:** ${toolCount} tools, $${totalSpend.toFixed(2)} total investment

**All Tools:**
${tools?.map((t: any) => `- ${t.name} (${t.category}, ${t.platform}) — $${t.price || 0}/${t.billing_cycle || 'one-time'}, used ${t.times_used || 0} times, last used: ${t.last_used ? new Date(t.last_used).toLocaleDateString() : 'never'}${t.tags?.length ? `, tags: ${t.tags.join(', ')}` : ''}`).join('\n') || 'No tools added yet.'}

**Unused Tools (potential waste):** ${unusedTools.length > 0 ? unusedTools.map((t: any) => `${t.name} ($${t.price || 0})`).join(', ') : 'None — great job!'}

**Top 5 Most Used:** ${mostUsed.map((t: any) => `${t.name} (${t.times_used || 0} uses)`).join(', ') || 'N/A'}

**Recent Activity (last 100 logs):** ${usageLogs?.length || 0} entries
`;

    const systemPrompt = `You are the StackVault AI Assistant — a smart, concise advisor for SaaS tool portfolio management.

You have access to the user's live vault data below. Use it to answer questions about:
- Underused or unused tools (waste detection)
- ROI analysis and cost-per-use insights
- Tool consolidation recommendations
- Refund window alerts (60-day window from purchase)
- Usage patterns and streak analysis
- Category overlap and duplicate detection
- Actionable suggestions to optimize their stack

Rules:
- Be specific — reference actual tool names, prices, and usage counts
- Keep answers concise and actionable (use bullet points)
- If asked about something not in their data, say so honestly
- If the user has no tools yet, encourage them to add tools to their vault first
- Format currency as USD
- When suggesting actions, be direct: "Cancel X", "Use Y more", "Consider replacing A with B"

${vaultContext}`;

    // Convert messages to Gemini format
    const geminiContents = [];

    // Add system instruction as the first user turn context
    geminiContents.push({
      role: "user",
      parts: [{ text: systemPrompt }],
    });
    geminiContents.push({
      role: "model",
      parts: [{ text: "Understood. I'm the StackVault AI Assistant. I'll analyze your vault data and provide actionable insights. How can I help?" }],
    });

    // Add conversation messages
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Call Google Gemini API directly with streaming
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vault-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});