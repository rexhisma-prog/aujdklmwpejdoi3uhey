ALTER TABLE public.topup_requests ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing rows from profiles
UPDATE public.topup_requests t
SET email = p.email
FROM public.profiles p
WHERE t.user_id = p.user_id AND t.email IS NULL;