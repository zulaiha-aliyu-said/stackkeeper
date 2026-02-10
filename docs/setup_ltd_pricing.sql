-- Run this SQL in your Supabase SQL Editor
-- LTD Pricing System: roles, redemption codes, tier on profiles

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Users can read own role" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add tier column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT NULL;

-- 6. Create redemption_codes table
CREATE TABLE public.redemption_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'agency')),
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES public.profiles(id) DEFAULT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT DEFAULT NULL
);
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- 7. RLS for redemption_codes (admin only)
CREATE POLICY "Admins can do everything with codes" ON public.redemption_codes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Atomic redeem_code function
CREATE OR REPLACE FUNCTION public.redeem_code(_code TEXT, _user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier TEXT;
BEGIN
  SELECT tier INTO _tier FROM public.redemption_codes
  WHERE code = _code AND is_redeemed = FALSE FOR UPDATE;

  IF _tier IS NULL THEN
    RAISE EXCEPTION 'Invalid or already redeemed code';
  END IF;

  UPDATE public.redemption_codes
  SET is_redeemed = TRUE, redeemed_by = _user_id, redeemed_at = now()
  WHERE code = _code;

  UPDATE public.profiles SET tier = _tier, updated_at = now()
  WHERE id = _user_id;

  RETURN _tier;
END;
$$;

-- 9. IMPORTANT: Make yourself an admin (replace YOUR_USER_ID with your actual auth.users id)
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
