-- إضافة اسم المدير المباشر لبيانات الموظفين
-- شغّل هذا السكربت مرة واحدة في Supabase SQL Editor.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_name text;

COMMENT ON COLUMN public.profiles.manager_name IS 'اسم المدير المباشر للموظف، ويُستخدم تلقائيًا في النماذج الرسمية.';
