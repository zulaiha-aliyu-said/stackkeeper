import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from '../server/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env explicitly for Vercel if needed, though they usually inject env vars automatically
// We point to the root .env for consistency in local dev if running from 'api/' folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// CORS configuration - Allow requests from your frontend
app.use(cors({
    origin: process.env.VITE_APP_URL || '*', // Set VITE_APP_URL in Vercel to your frontend domain
    credentials: true
}));

app.use(express.json());

// Routes
// Note: In Vercel serverless, the path might be stripped or handled differently.
// With rewrites "/api/(.*)" -> "/api/index.js", the req.url inside here might start with /api or not depending on config.
// We'll use a router to be safe.

const router = express.Router();

// Get Current User
router.get('/me', async (req, res) => {
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

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

// Mount the router at /api so it matches:
// Local: localhost:3000/api/login
// Vercel: /api/login (mapped implicitly or explicitly)
app.use('/api', router);

// Also mount at root for Vercel handling if rewrite strips /api
app.use('/', router);

// Start server if main module (Local dev)
// In Vercel, this file is imported, not run directly, so this block is skipped.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
