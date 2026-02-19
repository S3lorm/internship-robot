-- Add PDF delivery fields to letter_requests table
ALTER TABLE public.letter_requests
  ADD COLUMN IF NOT EXISTS reference_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ;

-- Create index for reference number lookups
CREATE INDEX IF NOT EXISTS idx_letter_requests_reference_number 
  ON public.letter_requests(reference_number)
  WHERE reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_letter_requests_verification_code 
  ON public.letter_requests(verification_code)
  WHERE verification_code IS NOT NULL;

-- Function to generate reference number (format: LR-YYYYMMDD-XXXXX)
CREATE OR REPLACE FUNCTION generate_letter_reference_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $func$
DECLARE
  ref_num TEXT;
  date_part TEXT;
  seq_part TEXT;
  seq_num INTEGER;
  pattern TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  pattern := 'LR-' || date_part || '-%';
  
  -- Get the count of requests created today and add 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.letter_requests
  WHERE reference_number LIKE pattern;
  
  seq_part := LPAD(seq_num::TEXT, 5, '0');
  ref_num := 'LR-' || date_part || '-' || seq_part;
  
  RETURN ref_num;
END;
$func$;

-- Function to generate verification code (6-digit random code)
-- Ensures uniqueness by checking existing codes
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $func$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  -- Generate unique code (retry if collision occurs)
  LOOP
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check
    FROM public.letter_requests
    WHERE verification_code = code;
    
    -- Exit loop if code is unique
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$func$;

-- Trigger to auto-generate reference number and verification code on insert
CREATE OR REPLACE FUNCTION set_letter_request_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_letter_reference_number();
  END IF;
  
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  
  RETURN NEW;
END;
$func$;

CREATE TRIGGER set_letter_request_codes_trigger
  BEFORE INSERT ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_letter_request_codes();

