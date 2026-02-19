-- Create activity_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login',
    'logout',
    'document_view',
    'document_download',
    'document_generate',
    'document_transmit',
    'request_create',
    'request_update',
    'request_approve',
    'request_reject',
    'evaluation_view',
    'evaluation_acknowledge',
    'logbook_submit',
    'logbook_view',
    'report_submit',
    'report_view',
    'feedback_acknowledge',
    'profile_update',
    'password_change',
    'admin_action',
    'system_event'
  )),
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'letter_request',
    'evaluation',
    'logbook',
    'report',
    'application',
    'internship',
    'user',
    'system'
  )),
  resource_id UUID,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_verification table for document authenticity tracking
CREATE TABLE IF NOT EXISTS public.document_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'letter',
    'evaluation',
    'certificate',
    'transcript',
    'report'
  )),
  document_id UUID NOT NULL,
  reference_number TEXT UNIQUE NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
  hash_value TEXT NOT NULL, -- SHA-256 hash of document content
  generated_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verification_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true,
  metadata JSONB
);

-- Create document_transmissions table for tracking document sharing
CREATE TABLE IF NOT EXISTS public.document_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'letter',
    'evaluation',
    'certificate',
    'transcript',
    'report'
  )),
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN (
    'student',
    'company',
    'admin',
    'external'
  )),
  recipient_email TEXT,
  recipient_name TEXT,
  transmission_method TEXT NOT NULL CHECK (transmission_method IN (
    'email',
    'download',
    'api',
    'manual'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'sent',
    'delivered',
    'failed',
    'opened'
  )),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create security_events table for security-related events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'unauthorized_access',
    'failed_login',
    'suspicious_activity',
    'permission_denied',
    'data_breach_attempt',
    'document_tampering',
    'verification_failure',
    'rate_limit_exceeded'
  )),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_verification_reference ON public.document_verification(reference_number);
CREATE INDEX IF NOT EXISTS idx_document_verification_code ON public.document_verification(verification_code);
CREATE INDEX IF NOT EXISTS idx_document_verification_document ON public.document_verification(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_document_verification_hash ON public.document_verification(hash_value);

CREATE INDEX IF NOT EXISTS idx_document_transmissions_document ON public.document_transmissions(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_document_transmissions_sender ON public.document_transmissions(sender_id);
CREATE INDEX IF NOT EXISTS idx_document_transmissions_status ON public.document_transmissions(status);
CREATE INDEX IF NOT EXISTS idx_document_transmissions_created_at ON public.document_transmissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert activity logs (handled via service role)
-- No INSERT policy for regular users - only backend can create logs

-- RLS Policies for document_verification
-- Users can view verifications for their own documents
CREATE POLICY "Users can view their document verifications"
  ON public.document_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests
      WHERE id = document_verification.document_id 
        AND student_id = auth.uid()
    )
    OR generated_by = auth.uid()
  );

-- Admins can view all verifications
CREATE POLICY "Admins can view all document verifications"
  ON public.document_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public can verify documents using reference number and code
CREATE POLICY "Public can verify documents"
  ON public.document_verification FOR SELECT
  USING (true); -- Allow public verification lookups

-- RLS Policies for document_transmissions
-- Users can view their own transmissions
CREATE POLICY "Users can view their own transmissions"
  ON public.document_transmissions FOR SELECT
  USING (sender_id = auth.uid());

-- Admins can view all transmissions
CREATE POLICY "Admins can view all transmissions"
  ON public.document_transmissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for security_events
-- Only admins can view security events
CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to generate document hash
CREATE OR REPLACE FUNCTION generate_document_hash(content TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS '
BEGIN
  -- This will be handled in the application layer using crypto
  -- PostgreSQL doesn''t have built-in SHA-256, so we''ll use application code
  RETURN NULL;
END;
';

-- Function to log activity (called from application)
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_description TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_metadata JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_description,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
';

-- Function to create document verification record
CREATE OR REPLACE FUNCTION create_document_verification(
  p_document_type TEXT,
  p_document_id UUID,
  p_reference_number TEXT,
  p_verification_code TEXT,
  p_hash_value TEXT,
  p_generated_by UUID,
  p_metadata JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  verification_id UUID;
BEGIN
  INSERT INTO public.document_verification (
    document_type,
    document_id,
    reference_number,
    verification_code,
    hash_value,
    generated_by,
    metadata
  ) VALUES (
    p_document_type,
    p_document_id,
    p_reference_number,
    p_verification_code,
    p_hash_value,
    p_generated_by,
    p_metadata
  ) RETURNING id INTO verification_id;
  
  RETURN verification_id;
END;
';

-- Function to verify document
CREATE OR REPLACE FUNCTION verify_document(
  p_reference_number TEXT,
  p_verification_code TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  document_type TEXT,
  document_id UUID,
  generated_at TIMESTAMPTZ,
  verification_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  v_verification RECORD;
BEGIN
  SELECT * INTO v_verification
  FROM public.document_verification
  WHERE reference_number = p_reference_number
    AND verification_code = p_verification_code
    AND is_valid = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, NULL::TIMESTAMPTZ, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Update verification count and timestamp
  UPDATE public.document_verification
  SET verification_count = verification_count + 1,
      last_verified_at = NOW()
  WHERE id = v_verification.id;
  
  RETURN QUERY SELECT
    true,
    v_verification.document_type,
    v_verification.document_id,
    v_verification.generated_at,
    v_verification.verification_count + 1;
END;
';

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_severity TEXT,
  p_description TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_metadata JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    severity,
    description,
    ip_address,
    user_agent,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_severity,
    p_description,
    p_ip_address,
    p_user_agent,
    p_resource_type,
    p_resource_id,
    p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
';

