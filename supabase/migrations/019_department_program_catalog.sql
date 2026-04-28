-- Department + program catalog used by RBAC terminal user management
-- and student registration validation.

CREATE TABLE IF NOT EXISTS public.departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.department_programs (
  id BIGSERIAL PRIMARY KEY,
  department_id BIGINT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  index_prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, program_name, index_prefix)
);

INSERT INTO public.departments (name)
VALUES
  ('Marine Engineering Department'),
  ('Computer Engineering Department'),
  ('Information and Communications Technology Department'),
  ('Nautical Science Department'),
  ('Department of Transport, Port & Shipping Administration')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.department_programs (department_id, program_name, index_prefix)
SELECT d.id, p.program_name, p.index_prefix
FROM (
  VALUES
    ('Marine Engineering Department', 'B.Sc. Marine Engineering', 'BME'),
    ('Marine Engineering Department', 'Diploma in Marine Engineering', 'DME'),
    ('Marine Engineering Department', 'B.Sc. Naval Architecture', 'BNA'),
    ('Marine Engineering Department', 'B.Sc. Mechanical Engineering', 'BME'),
    ('Marine Engineering Department', 'B.Sc. Mechanical Engineering', 'BMA'),

    ('Computer Engineering Department', 'B.Sc. Marine Electrical & Electronics', 'BEE'),
    ('Computer Engineering Department', 'Diploma in Marine Electrical & Electronics', 'DEE'),
    ('Computer Engineering Department', 'B.Sc. Computer Engineering', 'BCE'),

    ('Information and Communications Technology Department', 'B.Sc. Information Technology', 'BIT'),
    ('Information and Communications Technology Department', 'Diploma in Information Technology', 'DIT'),
    ('Information and Communications Technology Department', 'B.Sc. Computer Science', 'BCS'),

    ('Nautical Science Department', 'B.Sc. Nautical Science', 'BNS'),
    ('Nautical Science Department', 'Diploma in Nautical Science', 'DNS'),

    ('Department of Transport, Port & Shipping Administration', 'B.Sc. Logistics Management', 'BLM'),
    ('Department of Transport, Port & Shipping Administration', 'B.Sc. Port & Shipping Administration', 'BPS'),
    ('Department of Transport, Port & Shipping Administration', 'Diploma in Port & Shipping Administration', 'DPS')
) AS p(department_name, program_name, index_prefix)
JOIN public.departments d ON d.name = p.department_name
ON CONFLICT (department_id, program_name, index_prefix) DO NOTHING;
