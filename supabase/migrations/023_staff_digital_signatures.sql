-- Staff digital signatures for general letters and official placement letters.
-- Signatures are staff profile assets, not hardcoded document assets.

CREATE TABLE IF NOT EXISTS public.staff_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hod', 'secutuary')),
  signer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  signature_data_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_signatures_user ON public.staff_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_signatures_department_active
  ON public.staff_signatures(department, role, is_active);

ALTER TABLE public.letter_requests
  ADD COLUMN IF NOT EXISTS signature_snapshot JSONB;

ALTER TABLE public.internship_placements
  ADD COLUMN IF NOT EXISTS signature_snapshot JSONB;

ALTER TABLE public.staff_signatures ENABLE ROW LEVEL SECURITY;

-- Express uses the Supabase service role and enforces staff ownership/role checks.
