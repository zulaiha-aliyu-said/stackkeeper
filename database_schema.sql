-- Enable UUID extension (if needed for older pg versions, but gen_random_uuid() is preferred in v13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    interface_mode TEXT DEFAULT 'simple',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Stacks Table
CREATE TABLE IF NOT EXISTS stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stacks_user_id ON stacks(user_id);

-- Tools Table
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stack_id UUID REFERENCES stacks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0,
  billing_cycle TEXT, -- 'monthly', 'yearly', 'lifetime', 'free'
  purchase_date TIMESTAMP WITH TIME ZONE,
  login TEXT,
  password TEXT, -- encrypted or just stored if user wants simple storage
  redemption_code TEXT,
  notes TEXT,
  tool_url TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP WITH TIME ZONE,
  times_used INTEGER DEFAULT 0,
  tags TEXT[], -- array of strings
  usage_goal INTEGER,
  usage_goal_period TEXT,
  annual_value NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tools_user_id ON tools(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_stack_id ON tools(stack_id);

-- Usage Logs Table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source TEXT, -- 'manual', 'timer', 'extension', 'daily-prompt'
  duration INTEGER -- seconds
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_id ON usage_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- The owner
  email TEXT NOT NULL,
  name TEXT,
  role TEXT, -- 'admin', 'editor', 'viewer'
  status TEXT, -- 'pending', 'active'
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Branding Settings Table
CREATE TABLE IF NOT EXISTS branding_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    app_name TEXT DEFAULT 'StackVault',
    primary_color TEXT DEFAULT '160 84% 39%',
    accent_color TEXT DEFAULT '217 91% 60%',
    logo TEXT,
    show_powered_by BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Social Settings Table
CREATE TABLE IF NOT EXISTS social_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enable_battles BOOLEAN DEFAULT false,
    enable_public_profile BOOLEAN DEFAULT false,
    enable_steal_my_stack BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
