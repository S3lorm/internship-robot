-- Homepage-only notices: public landing page only (no student dashboard / email blast)

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS homepage_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.notices.homepage_only IS 'When true, notice appears on public homepage only (no student portal list, notifications, or emails).';
