-- Letter reference: RMU/{dept_code}/1223/{seq}
-- dept_code: 2-digit code per department (HOD), seq: 2-digit auto-increment per department

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS letter_reference_dept_code CHAR(2);

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_letter_ref_code
  ON public.departments (letter_reference_dept_code)
  WHERE letter_reference_dept_code IS NOT NULL;

UPDATE public.departments SET letter_reference_dept_code = '01'
  WHERE name = 'Marine Engineering Department' AND letter_reference_dept_code IS NULL;

UPDATE public.departments SET letter_reference_dept_code = '02'
  WHERE name = 'Computer Engineering Department' AND letter_reference_dept_code IS NULL;

UPDATE public.departments SET letter_reference_dept_code = '03'
  WHERE name = 'Information and Communications Technology Department' AND letter_reference_dept_code IS NULL;

UPDATE public.departments SET letter_reference_dept_code = '04'
  WHERE name = 'Nautical Science Department' AND letter_reference_dept_code IS NULL;

UPDATE public.departments SET letter_reference_dept_code = '05'
  WHERE name = 'Department of Transport, Port & Shipping Administration' AND letter_reference_dept_code IS NULL;

-- Replace legacy LR-YYYYMMDD generator with RMU format (uses student department via trigger when possible)
CREATE OR REPLACE FUNCTION generate_letter_reference_number(p_dept_code TEXT DEFAULT '00')
RETURNS TEXT
LANGUAGE plpgsql
AS $func$
DECLARE
  dept_code TEXT;
  seq_num INTEGER;
  seq_part TEXT;
  pattern TEXT;
BEGIN
  dept_code := LPAD(REGEXP_REPLACE(COALESCE(p_dept_code, '00'), '[^0-9]', '', 'g'), 2, '0');
  IF dept_code = '00' AND LENGTH(TRIM(COALESCE(p_dept_code, ''))) >= 2 THEN
    dept_code := UPPER(SUBSTRING(TRIM(p_dept_code) FROM 1 FOR 2));
  END IF;

  pattern := 'RMU/' || dept_code || '/1223/%';

  SELECT COALESCE(MAX(CAST(NULLIF(split_part(reference_number, '/', 4), '') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.letter_requests
  WHERE reference_number LIKE pattern;

  IF seq_num > 99 THEN
    seq_num := 1;
  END IF;

  seq_part := LPAD(seq_num::TEXT, 2, '0');
  RETURN 'RMU/' || dept_code || '/1223/' || seq_part;
END;
$func$;

CREATE OR REPLACE FUNCTION set_letter_request_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
DECLARE
  student_dept TEXT;
  dept_code TEXT;
BEGIN
  IF NEW.reference_number IS NULL THEN
    IF NEW.student_id IS NOT NULL THEN
      SELECT department INTO student_dept
      FROM public.user_profiles
      WHERE id = NEW.student_id;
    END IF;

    SELECT d.letter_reference_dept_code INTO dept_code
    FROM public.departments d
    WHERE d.name = student_dept
       OR student_dept ILIKE '%' || REPLACE(d.name, ' Department', '') || '%'
    LIMIT 1;

    NEW.reference_number := generate_letter_reference_number(COALESCE(dept_code, '00'));
  END IF;

  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;

  RETURN NEW;
END;
$func$;
