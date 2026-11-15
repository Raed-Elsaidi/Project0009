-- Group Guidance official form IDs: run once in Supabase SQL Editor.
-- This updates the CHECK constraint on official_form_records to include
-- the three Group Guidance forms while retaining the three meeting forms.

DO $$
DECLARE c RECORD;
BEGIN
  IF to_regclass('public.official_form_records') IS NULL THEN
    RAISE EXCEPTION 'Table public.official_form_records does not exist. Run official_form_records.sql first.';
  END IF;

  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.official_form_records'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%form_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.official_form_records DROP CONSTRAINT %I', c.conname);
  END LOOP;

  ALTER TABLE public.official_form_records
    ADD CONSTRAINT official_form_records_form_id_check
    CHECK (form_id IN (
      'meeting-principal',
      'meeting-teacher',
      'meeting-parents',
      'group-session-details',
      'group-session-summary',
      'group-counseling-plan'
    ));
END $$;

NOTIFY pgrst, 'reload schema';
