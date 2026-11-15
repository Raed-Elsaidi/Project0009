-- إعداد عضوية المجموعات الإرشادية وألوانها وجدول اللقاءات (الاستبيان القبلي/البعدي)
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.

ALTER TABLE public.group_counseling_groups
  ADD COLUMN IF NOT EXISTS color text;

UPDATE public.group_counseling_groups
SET color = COALESCE(color, '#0f766e')
WHERE color IS NULL;

CREATE TABLE IF NOT EXISTS public.group_counseling_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_counseling_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);

CREATE INDEX IF NOT EXISTS group_counseling_members_group_idx
  ON public.group_counseling_members(group_id);
CREATE INDEX IF NOT EXISTS group_counseling_members_student_idx
  ON public.group_counseling_members(student_id);

ALTER TABLE public.group_counseling_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_counseling_members_select_own ON public.group_counseling_members;
CREATE POLICY group_counseling_members_select_own
ON public.group_counseling_members FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.group_counseling_groups g
  WHERE g.id = group_id AND g.counselor_id = auth.uid()
));

DROP POLICY IF EXISTS group_counseling_members_insert_own ON public.group_counseling_members;
CREATE POLICY group_counseling_members_insert_own
ON public.group_counseling_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.group_counseling_groups g
  WHERE g.id = group_id AND g.counselor_id = auth.uid()
));

DROP POLICY IF EXISTS group_counseling_members_delete_own ON public.group_counseling_members;
CREATE POLICY group_counseling_members_delete_own
ON public.group_counseling_members FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.group_counseling_groups g
  WHERE g.id = group_id AND g.counselor_id = auth.uid()
));

NOTIFY pgrst, 'reload schema';
