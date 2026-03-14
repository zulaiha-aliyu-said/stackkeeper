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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
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
