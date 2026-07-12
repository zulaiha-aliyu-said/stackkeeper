-- Admin user management: policies + RPCs
-- Applied via Supabase migration: admin_user_management

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  tier text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.email, u.email::text) AS email,
    p.full_name,
    p.avatar_url,
    p.tier,
    p.created_at,
    p.updated_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id AND ur.role = 'admin'
    ) AS is_admin
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_activity_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'registrations', json_build_object(
      'd1', (SELECT COUNT(*)::int FROM auth.users WHERE created_at >= now() - interval '1 day'),
      'd7', (SELECT COUNT(*)::int FROM auth.users WHERE created_at >= now() - interval '7 days'),
      'd30', (SELECT COUNT(*)::int FROM auth.users WHERE created_at >= now() - interval '30 days'),
      'total', (SELECT COUNT(*)::int FROM auth.users)
    ),
    'logins', json_build_object(
      'd1', (SELECT COUNT(*)::int FROM auth.users WHERE last_sign_in_at >= now() - interval '1 day'),
      'd7', (SELECT COUNT(*)::int FROM auth.users WHERE last_sign_in_at >= now() - interval '7 days'),
      'd30', (SELECT COUNT(*)::int FROM auth.users WHERE last_sign_in_at >= now() - interval '30 days')
    ),
    'users', json_build_object(
      'total', (SELECT COUNT(*)::int FROM public.profiles),
      'ltd', (SELECT COUNT(*)::int FROM public.profiles WHERE tier IS NOT NULL),
      'starter', (SELECT COUNT(*)::int FROM public.profiles WHERE tier = 'starter'),
      'pro', (SELECT COUNT(*)::int FROM public.profiles WHERE tier = 'pro'),
      'agency', (SELECT COUNT(*)::int FROM public.profiles WHERE tier = 'agency')
    ),
    'daily', (
      SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.day), '[]'::json)
      FROM (
        SELECT
          gs::date AS day,
          (SELECT COUNT(*)::int FROM auth.users u WHERE (u.created_at AT TIME ZONE 'UTC')::date = gs::date) AS registrations,
          (SELECT COUNT(*)::int FROM auth.users u WHERE u.last_sign_in_at IS NOT NULL AND (u.last_sign_in_at AT TIME ZONE 'UTC')::date = gs::date) AS logins
        FROM generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') AS gs
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_activity_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_activity_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid,
  _full_name text DEFAULT NULL,
  _tier text DEFAULT NULL,
  _clear_tier boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _tier IS NOT NULL AND _tier NOT IN ('starter', 'pro', 'agency') THEN
    RAISE EXCEPTION 'Invalid tier';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(_full_name, full_name),
    tier = CASE
      WHEN _clear_tier THEN NULL
      WHEN _tier IS NOT NULL THEN _tier
      ELSE tier
    END,
    updated_at = now()
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user(uuid, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, boolean) TO authenticated;
