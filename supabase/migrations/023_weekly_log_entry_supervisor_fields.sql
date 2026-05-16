-- Per-week supervisor fields on the physical Weekly Log Sheet form

ALTER TABLE public.weekly_log_entries
  ADD COLUMN IF NOT EXISTS supervisor_remark TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_status TEXT;
