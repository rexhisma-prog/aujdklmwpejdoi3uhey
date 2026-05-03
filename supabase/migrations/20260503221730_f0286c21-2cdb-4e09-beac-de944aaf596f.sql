-- Services table managed by super admin
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  service_type TEXT NOT NULL,
  name TEXT NOT NULL,
  price_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone (even logged-out) can read active services
CREATE POLICY "Public can view active services"
ON public.services FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'super_admin'));

-- Only super_admin can insert/update/delete
CREATE POLICY "Super admins manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial services
INSERT INTO public.services (platform, service_type, name, price_eur, quantity, sort_order) VALUES
('instagram', 'followers', 'Instagram Followers', 1.50, 100, 1),
('instagram', 'likes', 'Instagram Likes', 0.80, 100, 2),
('tiktok', 'followers', 'TikTok Followers', 1.20, 100, 3),
('tiktok', 'views', 'TikTok Views', 0.50, 1000, 4),
('facebook', 'followers', 'Facebook Followers', 2.00, 100, 5),
('facebook', 'likes', 'Facebook Page Likes', 1.80, 100, 6);