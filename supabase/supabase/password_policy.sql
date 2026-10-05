-- سياسة قاعدة البيانات للحسابات الجديدة/المحدثة.
-- كلمات المرور نفسها لا تُخزن في قاعدة التطبيق؛ Supabase Auth يديرها.
-- هذا الملف يضمن تفرد اسم المستخدم في طبقات التطبيق.
create unique index if not exists uq_profiles_username_ci on public.profiles(lower(trim(username))) where username is not null;
create unique index if not exists uq_counselor_registry_username_ci on public.counselor_registry(lower(trim(username))) where username is not null;
