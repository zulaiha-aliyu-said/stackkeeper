import { pool } from './server/db';
import { generateInsights } from './src/lib/ai-advisor';

function transformToolToFrontend(dbTool: any) {
  return {
    id: dbTool.id,
    name: dbTool.name,
    category: dbTool.category,
    platform: dbTool.platform,
    price: parseFloat(dbTool.price) || 0,
    purchaseDate: dbTool.purchase_date || new Date().toISOString(),
    login: dbTool.login,
    password: dbTool.password,
    redemptionCode: dbTool.redemption_code,
    notes: dbTool.notes,
    addedDate: dbTool.added_date || dbTool.created_at,
    lastUsed: dbTool.last_used,
    timesUsed: dbTool.times_used || 0,
    tags: dbTool.tags || [],
    toolUrl: dbTool.tool_url,
    usageHistory: [],
    currentStreak: 0,
    longestStreak: 0,
    usageGoal: dbTool.usage_goal,
    usageGoalPeriod: dbTool.usage_goal_period,
    annualValue: parseFloat(dbTool.annual_value) || 0
  };
}

async function run() {
  try {
    const emailToSearch = process.argv[2];
    let userQuery = 'SELECT id, email, full_name FROM users ORDER BY created_at ASC LIMIT 1';
    let userValues: any[] = [];
    if (emailToSearch) {
       userQuery = 'SELECT id, email, full_name FROM users WHERE email = $1';
       userValues = [emailToSearch];
    }
    const userRes = await pool.query(userQuery, userValues);
    if(userRes.rows.length === 0) {
      console.log('No users found in database.');
      process.exit(1);
    }
    const user = userRes.rows[0];
    console.log(`Running AI Advisor for user: ${user.full_name} (${user.email})\n`);
    
    // Fetch tools
    const toolRes = await pool.query('SELECT * FROM tools WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    const tools = toolRes.rows.map(transformToolToFrontend);
    
    console.log(`Found ${tools.length} tool(s).\n`);
    
    // Generate insights
    // Type casting to match the Tool interface from src/types/tool if needed
    const insights = generateInsights(tools as any);
    
    console.log('--- AI ADVISOR INSIGHTS ---');
    insights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });
    console.log('---------------------------');
  } catch (error) {
    console.error('Error running AI advisor:', error);
  } finally {
    pool.end();
  }
}

run();
