-- Convert legacy LR-YYYYMMDD-XXXXX references to RMU/{dept}/1223/{seq}

CREATE OR REPLACE FUNCTION public.backfill_letter_reference_numbers()
RETURNS INTEGER
LANGUAGE plpgsql
AS $func$
DECLARE
  rec RECORD;
  dept_code TEXT;
  seq_num INTEGER;
  new_ref TEXT;
  updated_count INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT
      lr.id,
      lr.reference_number AS old_ref,
      up.department AS student_department,
      lr.created_at
    FROM public.letter_requests lr
    LEFT JOIN public.user_profiles up ON up.id = lr.student_id
    WHERE lr.reference_number IS NULL
       OR lr.reference_number NOT LIKE 'RMU/%'
    ORDER BY lr.created_at ASC
  LOOP
    dept_code := NULL;

    IF rec.student_department IS NOT NULL THEN
      SELECT d.letter_reference_dept_code
      INTO dept_code
      FROM public.departments d
      WHERE d.name = rec.student_department
         OR rec.student_department ILIKE '%' || regexp_replace(d.name, ' Department$', '', 'i') || '%'
         OR d.name ILIKE '%' || rec.student_department || '%'
      ORDER BY CASE WHEN d.name = rec.student_department THEN 0 ELSE 1 END
      LIMIT 1;
    END IF;

    dept_code := LPAD(
      COALESCE(NULLIF(regexp_replace(COALESCE(dept_code, ''), '[^0-9]', '', 'g'), ''), '0'),
      2,
      '0'
    );
    IF dept_code = '00' AND length(trim(COALESCE(rec.student_department, ''))) = 0 THEN
      dept_code := '00';
    END IF;

    SELECT COALESCE(MAX(CAST(NULLIF(split_part(reference_number, '/', 4), '') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.letter_requests
    WHERE reference_number LIKE 'RMU/' || dept_code || '/1223/%';

    IF seq_num > 99 THEN
      seq_num := 1;
    END IF;

    new_ref := 'RMU/' || dept_code || '/1223/' || lpad(seq_num::TEXT, 2, '0');

    -- Keep document verification in sync (unique on reference_number)
    IF rec.old_ref IS NOT NULL THEN
      UPDATE public.document_verification
      SET reference_number = new_ref
      WHERE document_type = 'letter'
        AND document_id = rec.id
        AND reference_number = rec.old_ref;
    END IF;

    UPDATE public.letter_requests
    SET reference_number = new_ref
    WHERE id = rec.id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$func$;

SELECT public.backfill_letter_reference_numbers() AS letter_requests_updated;
