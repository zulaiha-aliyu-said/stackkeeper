

# LTD Pricing Plans with Redemption Codes and Admin Panel

## Overview

Update the 3 pricing tiers to $49 / $99 / $149 LTD plans, build a redemption code system backed by Supabase, and create a secure admin panel for generating codes.

this is edit for teting deployment

---

## Pricing Tiers (Updated)

| Plan | Price | Key Features |
|------|-------|-------------|
| **Starter** | $49 LTD | Up to 25 tools, 1 stack, basic dashboard, spending charts, duplicate detection |
| **Pro** | $99 LTD | Unlimited tools, 1 stack, ROI Calculator, Stack Health Doctor, Time Machine, Streaks, Network View, Usage Timer |
| **Agency** | $149 LTD | Everything in Pro + 5 stacks, 3 team seats, custom branding, Stack Battles, Public Profiles, Email Import, Chrome Extension, Portfolio Appraisal |

---

## Database Schema (New Tables)

### 1. `redemption_codes` table
Stores all generated codes with their associated plan and usage status.

```text
+-------------------+-------------------------------+
| Column            | Type                          |
+-------------------+-------------------------------+
| id                | UUID (PK)                     |
| code              | TEXT (unique, not null)        |
| tier              | TEXT (starter/pro/agency)      |
| is_redeemed       | BOOLEAN (default false)        |
| redeemed_by       | UUID (FK -> profiles.id, null) |
| redeemed_at       | TIMESTAMPTZ (null)             |
| created_by        | UUID (FK -> auth.users, not null) |
| created_at        | TIMESTAMPTZ (default now())    |
| notes             | TEXT (optional)                |
+-------------------+-------------------------------+
```

### 2. `user_roles` table (for admin access)
Following the security guidelines -- roles stored in a separate table, not on profiles.

```text
+----------+-------------------------------+
| Column   | Type                          |
+----------+-------------------------------+
| id       | UUID (PK)                     |
| user_id  | UUID (FK -> auth.users, unique)|
| role     | app_role enum (admin, user)   |
+----------+-------------------------------+
```

### 3. Security definer function
`has_role(user_id, role)` function to safely check admin status without RLS recursion.

### 4. RLS Policies
- `redemption_codes`: Admins can SELECT/INSERT/UPDATE all rows. Regular users cannot access this table directly.
- `user_roles`: Admins can SELECT all. Users can SELECT their own role.

---

## Feature Implementation

### 1. Code Redemption Flow (User-Facing)

- Add a "Redeem Code" input field in the **Billing tab** of Settings
- User enters a code, clicks "Redeem"
- Frontend calls a Supabase Edge Function `redeem-code` that:
  - Validates the code exists and is not redeemed
  - Marks the code as redeemed (sets `redeemed_by`, `redeemed_at`, `is_redeemed`)
  - Updates the user's tier in `profiles` table (add a `tier` column to profiles)
  - Returns the unlocked tier
- On success, the local `useTier` hook updates to reflect the new tier

### 2. Admin Panel (`/admin` route)

A new protected page accessible only to users with `admin` role.

**Features:**
- **Generate Codes**: Select a tier (Starter/Pro/Agency), quantity (1-50), optional notes, and generate unique codes
- **View All Codes**: Table showing all generated codes with columns: Code, Tier, Status (Available/Redeemed), Redeemed By (email), Created At
- **Copy Codes**: One-click copy individual codes or bulk copy
- **Filter/Search**: Filter by tier, status

**Access Control:**
- Route protected by checking `user_roles` table for admin role
- Non-admins see "Access Denied" or get redirected

### 3. Supabase Edge Function: `redeem-code`

Handles redemption server-side to prevent client-side manipulation:
- Validates the code
- Checks it has not been redeemed
- Atomically marks as redeemed and updates the user's profile tier
- Returns success/failure

### 4. Profile Tier Persistence

- Add `tier` column to `profiles` table (default: null, meaning no plan purchased yet -- falls back to 'starter')
- Update `useTier` hook to read from the profile instead of localStorage when user is authenticated
- Keep localStorage as fallback for demo/unauthenticated mode

---

## Files to Create/Modify

### New Files
- `src/pages/Admin.tsx` -- Admin panel page with code generation and management UI
- `supabase/functions/redeem-code/index.ts` -- Edge function for secure code redemption

### Modified Files
- `src/types/team.ts` -- Update tier prices and add redemption-related types
- `src/hooks/useTier.ts` -- Read tier from Supabase profile, add `redeemCode()` method
- `src/pages/Settings.tsx` -- Update prices to $49/$99/$149, add "Redeem Code" input in Billing tab
- `src/App.tsx` -- Add `/admin` route
- `src/contexts/AuthContext.tsx` -- Expose admin role check

### SQL Migration
- Create `app_role` enum, `user_roles` table, `has_role()` function
- Create `redemption_codes` table with RLS
- Add `tier` column to `profiles`
- Set up the first admin user (you'll provide your user ID)

---

## Technical Details

### Code Generation Format
Codes will follow a readable format: `SV-{TIER_PREFIX}-{RANDOM}` (e.g., `SV-PRO-A7X9K2M4`, `SV-AGY-B3R8N5P1`)

### Admin Detection
- Server-side: `has_role(auth.uid(), 'admin')` security definer function
- Client-side: Query `user_roles` table on login to determine if admin UI should render
- Never use localStorage for admin checks

### Edge Function Flow
```text
User enters code --> POST /redeem-code
  --> Validate code exists & not redeemed
  --> Update redemption_codes (mark redeemed)
  --> Update profiles.tier
  --> Return { success: true, tier: 'pro' }
```

