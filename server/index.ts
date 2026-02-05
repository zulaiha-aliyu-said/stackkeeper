import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// Helper function to transform database row to frontend Tool format
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
        usageHistory: [], // TODO: fetch from usage_logs table
        currentStreak: 0,
        longestStreak: 0,
        usageGoal: dbTool.usage_goal,
        usageGoalPeriod: dbTool.usage_goal_period,
        annualValue: parseFloat(dbTool.annual_value) || 0
    };
}

// Helper function to transform frontend Tool to database format
function transformToolToDatabase(frontendTool: any) {
    return {
        name: frontendTool.name,
        category: frontendTool.category,
        platform: frontendTool.platform,
        price: frontendTool.price,
        billing_cycle: frontendTool.billingCycle,
        purchase_date: frontendTool.purchaseDate,
        login: frontendTool.login,
        password: frontendTool.password,
        redemption_code: frontendTool.redemptionCode,
        notes: frontendTool.notes,
        added_date: frontendTool.addedDate || new Date().toISOString(),
        last_used: frontendTool.lastUsed,
        times_used: frontendTool.timesUsed || 0,
        tags: frontendTool.tags,
        tool_url: frontendTool.toolUrl,
        usage_goal: frontendTool.usageGoal,
        usage_goal_period: frontendTool.usageGoalPeriod,
        annual_value: frontendTool.annualValue
    };
}

// Routes

// Get Current User
app.get('/api/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const result = await pool.query('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [decoded.userId]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(result.rows[0]);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/signup', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
            [email, hashedPassword, full_name]
        );

        // Create token
        const token = jwt.sign({ userId: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: newUser.rows[0] });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- TOOLS ENDPOINTS ---

app.get('/api/tools', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tools WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        const transformedTools = result.rows.map(transformToolToFrontend);
        res.json(transformedTools);
    } catch (error) {
        console.error('Error fetching tools:', error);
        res.status(500).json({ error: 'Failed to fetch tools' });
    }
});

app.post('/api/tools', authenticateToken, async (req: any, res) => {
    try {
        const dbTool = transformToolToDatabase(req.body);
        const result = await pool.query(
            `INSERT INTO tools (user_id, name, category, platform, price, billing_cycle, purchase_date, added_date, last_used, times_used) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                req.user.userId,
                dbTool.name,
                dbTool.category,
                dbTool.platform,
                dbTool.price,
                dbTool.billing_cycle,
                dbTool.purchase_date,
                dbTool.added_date,
                null, // last_used
                0 // times_used
            ]
        );
        const transformedTool = transformToolToFrontend(result.rows[0]);
        res.status(201).json(transformedTool);
    } catch (error) {
        console.error('Error creating tool:', error);
        res.status(500).json({ error: 'Failed to create tool' });
    }
});

app.put('/api/tools/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const updates = transformToolToDatabase(req.body);

    // Construct dynamic update query
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (fields.length === 0) return res.json({ message: 'No updates provided' });

    const setClause = fields.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
    const values = [req.user.userId, ...fields.map(key => updates[key]), id];

    try {
        const result = await pool.query(
            `UPDATE tools SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND id = $${fields.length + 2} RETURNING *`,
            values
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Tool not found' });
        const transformedTool = transformToolToFrontend(result.rows[0]);
        res.json(transformedTool);
    } catch (error) {
        console.error('Error updating tool:', error);
        res.status(500).json({ error: 'Failed to update tool' });
    }
});

app.delete('/api/tools/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM tools WHERE user_id = $1 AND id = $2 RETURNING id',
            [req.user.userId, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Tool not found' });
        res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
        console.error('Error deleting tool:', error);
        res.status(500).json({ error: 'Failed to delete tool' });
    }
});

// Log tool usage
app.post('/api/tools/:id/usage', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { source, duration } = req.body;

    try {
        // Update tool's last_used and times_used
        const toolResult = await pool.query(
            `UPDATE tools 
             SET last_used = NOW(), times_used = times_used + 1, updated_at = NOW() 
             WHERE user_id = $1 AND id = $2 
             RETURNING *`,
            [req.user.userId, id]
        );

        if (toolResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tool not found' });
        }

        // Insert usage log entry
        await pool.query(
            `INSERT INTO usage_logs (tool_id, user_id, source, duration, timestamp) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [id, req.user.userId, source || 'manual', duration || null]
        );

        const transformedTool = transformToolToFrontend(toolResult.rows[0]);
        res.json(transformedTool);
    } catch (error) {
        console.error('Error logging usage:', error);
        res.status(500).json({ error: 'Failed to log usage' });
    }
});

// --- STACKS ENDPOINTS ---

app.get('/api/stacks', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM stacks WHERE user_id = $1 ORDER BY created_at ASC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stacks' });
    }
});

app.post('/api/stacks', authenticateToken, async (req: any, res) => {
    const { name, description, is_default } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO stacks (user_id, name, description, is_default) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.userId, name, description, is_default || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create stack' });
    }
});

// --- BRANDING ENDPOINTS ---

app.get('/api/settings/branding', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query('SELECT * FROM branding_settings WHERE user_id = $1', [req.user.userId]);
        if (result.rows.length === 0) return res.json({}); // Return empty if not set
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch branding' });
    }
});

app.post('/api/settings/branding', authenticateToken, async (req: any, res) => {
    const { app_name, primary_color, accent_color, logo, show_powered_by } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO branding_settings (user_id, app_name, primary_color, accent_color, logo, show_powered_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id) DO UPDATE SET
             app_name = EXCLUDED.app_name,
             primary_color = EXCLUDED.primary_color,
             accent_color = EXCLUDED.accent_color,
             logo = EXCLUDED.logo,
             show_powered_by = EXCLUDED.show_powered_by,
             updated_at = NOW()
             RETURNING *`,
            [req.user.userId, app_name, primary_color, accent_color, logo, show_powered_by]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save branding' });
    }
});

// --- SOCIAL SETTINGS ENDPOINTS ---

app.get('/api/settings/social', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query('SELECT * FROM social_settings WHERE user_id = $1', [req.user.userId]);
        if (result.rows.length === 0) return res.json({});
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch social settings' });
    }
});

app.post('/api/settings/social', authenticateToken, async (req: any, res) => {
    const { enable_battles, enable_public_profile, enable_steal_my_stack } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO social_settings (user_id, enable_battles, enable_public_profile, enable_steal_my_stack)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET
             enable_battles = EXCLUDED.enable_battles,
             enable_public_profile = EXCLUDED.enable_public_profile,
             enable_steal_my_stack = EXCLUDED.enable_steal_my_stack,
             updated_at = NOW()
             RETURNING *`,
            [req.user.userId, enable_battles, enable_public_profile, enable_steal_my_stack]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save social settings' });
    }
});

// --- TEAM ENDPOINTS ---

app.get('/api/team', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM team_members WHERE user_id = $1 ORDER BY invited_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

app.post('/api/team/invite', authenticateToken, async (req: any, res) => {
    const { email, role, name } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO team_members (user_id, email, name, role, status)
             VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
            [req.user.userId, email.toLowerCase(), name || email.split('@')[0], role]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({ error: 'Failed to invite member' });
    }
});

// --- USER SETTINGS ENDPOINTS ---

app.put('/api/me/settings', authenticateToken, async (req: any, res) => {
    const { interface_mode } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET interface_mode = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [interface_mode, req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating interface mode:', error);
        res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
