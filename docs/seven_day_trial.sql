-- 7-day free trial via redemption codes
-- Applied as migration: seven_day_trial_codes

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false;

ALTER TABLE public.redemption_codes DROP CONSTRAINT IF EXISTS redemption_codes_tier_check;
ALTER TABLE public.redemption_codes
  ADD CONSTRAINT redemption_codes_tier_check
  CHECK (tier IN ('starter', 'pro', 'agency', 'trial'));

CREATE OR REPLACE FUNCTION public.redeem_code(_code TEXT, _user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier TEXT;
  _has_plan BOOLEAN;
  _trial_used BOOLEAN;
BEGIN
  SELECT tier INTO _tier
  FROM public.redemption_codes
  WHERE code = _code AND is_redeemed = FALSE
  FOR UPDATE;

  IF _tier IS NULL THEN
    RAISE EXCEPTION 'Invalid or already redeemed code';
  END IF;

  SELECT
    (tier IS NOT NULL AND tier IN ('starter', 'pro', 'agency')),
    COALESCE(trial_used, false)
  INTO _has_plan, _trial_used
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF _tier = 'trial' THEN
    IF _has_plan THEN
      RAISE EXCEPTION 'You already have an active lifetime plan';
    END IF;
    IF _trial_used THEN
      RAISE EXCEPTION 'You have already used your free trial';
    END IF;

    UPDATE public.redemption_codes
    SET is_redeemed = TRUE, redeemed_by = _user_id, redeemed_at = now()
    WHERE code = _code;

    UPDATE public.profiles
    SET
      trial_started_at = now(),
      trial_ends_at = now() + interval '7 days',
      trial_used = TRUE,
      updated_at = now()
    WHERE id = _user_id;

    RETURN 'trial';
  END IF;

  UPDATE public.redemption_codes
  SET is_redeemed = TRUE, redeemed_by = _user_id, redeemed_at = now()
  WHERE code = _code;

  UPDATE public.profiles
  SET
    tier = _tier,
    updated_at = now()
  WHERE id = _user_id;

  RETURN _tier;
END;
$$;
