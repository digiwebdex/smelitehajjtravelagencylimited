
CREATE TABLE IF NOT EXISTS public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT,
  session_id TEXT,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  referrer_source TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  language TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_visitor_id ON public.page_visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_country ON public.page_visits (country);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON public.page_visits (page_path);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page visits"
  ON public.page_visits
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view page visits"
  ON public.page_visits
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can delete page visits"
  ON public.page_visits
  FOR DELETE
  USING (is_admin());
