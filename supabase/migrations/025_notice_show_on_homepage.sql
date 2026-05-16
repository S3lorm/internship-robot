-- Admin opt-in: display notice on the public homepage announcements section

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notices_show_on_homepage
  ON public.notices (show_on_homepage, is_active)
  WHERE show_on_homepage = true;

COMMENT ON COLUMN public.notices.show_on_homepage IS 'When true and notice is active, shown on the public homepage.';
