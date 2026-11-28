-- Update allowed official form IDs without losing existing supported forms.

DO $$
BEGIN
  IF to_regclass('public.official_form_records') IS NULL THEN
    RAISE EXCEPTION 'Table public.official_form_records does not exist.';
  END IF;

  ALTER TABLE public.official_form_records
    DROP CONSTRAINT IF EXISTS official_form_records_form_id_check;

  ALTER TABLE public.official_form_records
    ADD CONSTRAINT official_form_records_form_id_check
    CHECK (form_id IN (
      'meeting-principal',
      'meeting-teacher',
      'meeting-parents',
      'guidance-meetings-followup',
      'career-guidance-followup',
      'group-session-details',
      'group-session-summary',
      'group-counseling-plan',
      'hot-case-record',
      'case-study',
      'consultations-monitor',
      'health-cases',
      'dropout-followup',
      'parliament-members',
      'parliament-team-training'
    ));
END $$;

NOTIFY pgrst, 'reload schema';
