-- حقلا الصف والشعبة للطلاب (موجودان في النسخة الحالية، ويضمن هذا الجزء وجودهما في قاعدة البيانات)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS grade_id uuid,
  ADD COLUMN IF NOT EXISTS section_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_grade_id_fkey') THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_grade_id_fkey
      FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_section_id_fkey') THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_section_id_fkey
      FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- إضافة ربط الصف والشعبة لبنود البرنامج اليومي/الأسبوعي ولجلسات الإرشاد الجمعي
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.

ALTER TABLE public.weekly_program_items
  ADD COLUMN IF NOT EXISTS grade_id uuid,
  ADD COLUMN IF NOT EXISTS section_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_program_items_grade_id_fkey'
  ) THEN
    ALTER TABLE public.weekly_program_items
      ADD CONSTRAINT weekly_program_items_grade_id_fkey
      FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_program_items_section_id_fkey'
  ) THEN
    ALTER TABLE public.weekly_program_items
      ADD CONSTRAINT weekly_program_items_section_id_fkey
      FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_program_items_grade_id
  ON public.weekly_program_items(grade_id);
CREATE INDEX IF NOT EXISTS idx_weekly_program_items_section_id
  ON public.weekly_program_items(section_id);

ALTER TABLE public.group_counseling_groups
  ADD COLUMN IF NOT EXISTS grade_id uuid,
  ADD COLUMN IF NOT EXISTS section_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_counseling_groups_grade_id_fkey'
  ) THEN
    ALTER TABLE public.group_counseling_groups
      ADD CONSTRAINT group_counseling_groups_grade_id_fkey
      FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_counseling_groups_section_id_fkey'
  ) THEN
    ALTER TABLE public.group_counseling_groups
      ADD CONSTRAINT group_counseling_groups_section_id_fkey
      FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_group_counseling_groups_grade_id
  ON public.group_counseling_groups(grade_id);
CREATE INDEX IF NOT EXISTS idx_group_counseling_groups_section_id
  ON public.group_counseling_groups(section_id);
