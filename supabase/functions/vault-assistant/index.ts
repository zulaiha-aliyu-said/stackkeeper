import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  console.log(`Vault Assistant request: ${req.method} ${new URL(req.url).pathname}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service configuration error. GROQ_API_KEY is missing." }),
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

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
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
`;

    const appKnowledge = `
## App Knowledge Base (Step-by-Step Guides)

### 🚀 Navigation & Stats
- **Dashboard**: View high-level ROI and investment stats at [Dashboard](/dashboard).
- **Tool Library**: Manage all your tools in one place at [Tool Library](/library).
- **Analytics**: Deep dive into spending and usage charts at [Analytics](/analytics).
- **Insights**: Historical trends and usage summaries at [Insights](/insights).
- **Tool Network**: Visual graph of tool relationships at [Network](/network).

### 📊 Dashboard Sections
- **Recently Added**: Shows the 5 most recently added tools with name, category, price, and date added. Helps users track their latest acquisitions.
- **Quick Insights**: A summary panel showing key metrics — total tools count, active vs unused tools, wasted spend on unused tools, and top spending categories. Gives an instant health check of the stack.
- **Tool Graveyard**: Lists tools that have never been used (timesUsed = 0 or lastUsed = null). These represent wasted investment. Users should consider using or removing these tools.
- **Most Used Tools**: Ranks tools by usage count (timesUsed) in descending order. Shows the top 5 most engaged tools with usage counts. Helps identify the most valuable tools in the stack.
- **Refund Alerts**: Warns about tools with refund windows closing soon. Refund window is 60 days from purchase date. Alerts appear when ≤10 days remain. Sorted by urgency (soonest deadline first). If no alerts, shows "All clear!"

### 📈 Analytics Page
- **Spend Breakdown**: Shows total investment, active tools value, and unused tools value with progress bars.
- **Tools by Category**: Displays count and spend per category (Marketing, Design, Productivity, AI, Dev Tools, Analytics, Email, Video, Other).
- **Stack Score™**: A health percentage for the stack. 🏆 70%+ excellent, ✅ 50-69% good, ⚠️ 30-49% needs attention, 🚨 <30% critical. Based on tools used, never opened, and average price.
- **Platform Distribution**: Count of tools from each platform (AppSumo, DealMirror, DealFuel, StackSocial, LTD, Other).

### 🛠️ Common Tasks
- **How to add a tool**:
  1. Go to the [Tool Library](/library).
  2. Click **Add Tool** (or press **⌘A**).
  3. Enter name, category, and price, then click **Save**.
- **How to bulk import**:
  1. Go to the [Tool Library](/library).
  2. Click **Bulk Import**.
  3. Paste CSV data (Name, Category, Platform, Price) or upload a file.
- **How to invite teammates**:
  1. Go to [Settings](/settings).
  2. Click the **Team** tab.
  3. Enter an email address and click **Invite**.
- **How to export data**:
  1. Press **⌘E** anywhere in the app to download your vault as a CSV.

### ⌨️ Main Shortcuts
- **⌘K**: Search / Command Palette
- **⌘A**: Add Tool
- **⌘E**: Export CSV
- **⌘S**: Share Stack
- **⌘T**: Toggle Dark/Light Mode
- **⌘/**: View all shortcuts

### 📅 Weekly Usage Summary (Dashboard)
- Displayed on the Dashboard showing this week's engagement stats.
- **Total Sessions**: Number of tool usage sessions recorded this week.
- **Week-over-Week Comparison**: Shows if sessions increased or decreased compared to last week (e.g., "+3 vs last week").
- **Most Used Tool This Week**: The tool with the highest session count in the current week.
- **Active Days**: How many days this week the user logged at least one session.
- **Not Used This Week**: Lists tools that had zero sessions during the current week — a nudge to re-engage with neglected tools.

### ⏳ Time Machine (Insights Page)
- Located on the [Insights](/insights) page.
- **Interactive Timeline Slider**: Drag to travel back in time and see how the stack looked at any past date.
- **Stack Growth Visualization**: Shows how the number of tools and total spending evolved over time.
- **Spending Over Time**: Charts cumulative investment growth from the first tool purchase to today.
- **What-If Calculator**: Also on Insights — lets users simulate scenarios:
  - "What if I refund Tool X?" → shows updated spend and Stack Score.
  - "What if I buy a new tool at $Y?" → shows projected impact on budget.
  - "What if I consolidate 3 tools into 1?" → shows potential savings.
- Helps users make data-driven decisions about their stack.

### 🔥 Usage Streaks
- Each tool tracks **currentStreak** (consecutive days used) and **longestStreak** (all-time best).
- Streaks reset if a tool isn't used for a day.
- Streaks encourage consistent engagement and help identify which tools users truly rely on.
- A streak badge appears on tools with active streaks.

### 🏆 Stack Score™
- A health percentage for the user's entire tool collection.
- **Formula**: (Tools with at least one use / Total tools) × 100.
- Ratings: 🏆 70%+ excellent, ✅ 50-69% good, ⚠️ 30-49% needs attention, 🚨 <30% critical.
- Updates in real-time when a tool is marked as used.
- Displayed on the Dashboard and Analytics page.
- To improve Stack Score: use unused tools or remove tools you'll never use.

### 🎖️ Achievement Badges
- Gamification system that rewards good tool management habits.
- **Collection badges**: Getting Started (1 tool), Collector (10), Whale (25), Kraken (50).
- **Efficiency badges**: Optimizer (high Stack Score), Curator (organized tags), Active User (daily usage), Minimalist (lean stack).
- **Savings badges**: Deal Hunter (great deals), Refund Master (timely refunds), Steals (tools under $20).
- **Streak badges**: On Fire (7-day streak), Consistent (30-day), Marathon (90-day).
- Badges unlock with toast notifications and are viewable in the achievements panel.

### 💰 ROI Calculator
- **Cost-per-use**: Tool price ÷ times used. Lower is better.
- **ROI Status Badges**: 🏆 Excellent (<$1/use), ✅ Good ($1-5/use), ⚠️ Fair ($5-10/use), 🚨 Poor (>$10/use or never used).
- **Metrics shown**: Cost-per-use, days owned, average monthly uses, ROI status.
- **Visible in 3 places**: Tool Detail modal (detailed), Tool cards (small badge), ROI Leaderboard on Analytics (best & worst ROI tools).
- To improve ROI: use tools more frequently or refund tools with poor ROI.

### 🔄 Tool Comparison
- Select 2-3 tools from the [Library](/library) for side-by-side comparison.
- Opens a full-screen modal comparing: price, purchase date, times used, last used, cost-per-use, days owned, category, platform, and ROI status.
- Includes an AI recommendation (e.g., "Keep this tool, refund others" or "Compare features to decide").
- Quick action buttons allow direct consolidation decisions.

### 📦 Portfolio Appraisal
- Calculates estimated **Resale Value** and **Market Value** (annual subscription equivalent) of the entire tool collection.
- Helps users understand the total financial impact of their stack.
- Identifies potential recovered value from selling unused tools.

### ⚔️ Stack Battles (Agency Tier)
- Compare your stack efficiency against other users via challenge codes.
- Go to [Battles](/battles) to create or join a battle.
- Metrics compared: total tools, Stack Score, average ROI, total spend, and usage consistency.
- Great for teams or communities to benchmark their tool management.
- Agency-tier feature — available to Agency plan users.

### 🕸️ Tool Relationship Network
- Interactive visualization at [Network](/network) mapping connections between tools.
- Tools are grouped into workflow clusters (e.g., Marketing, Design, Productivity).
- Lines connect tools that belong to the same workflow or category.
- **Orphan tools** are highlighted — these are disconnected from any active workflow, suggesting they may be redundant.
- Helps users visualize their ecosystem and spot optimization opportunities.

### 🌐 Public Stack Profiles (Agency Tier)
- Share your tool collection publicly at a customizable URL.
- Includes a "Steal My Stack" button so others can copy your setup.
- Privacy settings allow toggling visibility of prices, usage data, and specific tools.
- Configurable in [Settings](/settings).
`;

    const systemPrompt = `You are the StackVault AI Assistant — a smart, concise advisor for SaaS tool portfolio management.

You have access to the user's live vault data and the application knowledge base below. 

${vaultContext}

${appKnowledge}

Rules for answering:
1. When asked about app features, provide the **step-by-step guide** and the **direct link** from the Knowledge Base.
2. For tool analysis, focus on:
   - Underused or unused tools (waste detection)
   - ROI analysis and cost-per-use insights
   - Tool consolidation recommendations
3. Be specific — reference actual tool names and prices from the user's data.
4. Keep answers concise and actionable (use bullet points).
5. If the user has no tools yet, encourage them to add tools to their vault first.
6. Format currency as USD.
7. Use the relative links provided (e.g., [Library](/library)) so they are clickable in the chat UI.`;

    // Convert messages for Groq/OpenAI format
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Call Groq API with streaming
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Groq API error: ${response.status}` }),
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