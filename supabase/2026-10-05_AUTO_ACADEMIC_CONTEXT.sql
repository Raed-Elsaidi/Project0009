-- تهيئة التواريخ الافتراضية للسنة الدراسية والفصلين.
-- يمكن تعديل التواريخ لاحقًا حسب التقويم الرسمي للوزارة.
update public.school_years y
set start_date = coalesce(y.start_date, make_date(split_part(y.name,'/',1)::int, 8, 15)),
    end_date   = coalesce(y.end_date, make_date(split_part(y.name,'/',2)::int, 6, 30));
update public.semesters s
set start_date = case when upper(s.type::text) like '%FIRST%' then y.start_date when upper(s.type::text) like '%SECOND%' then make_date(extract(year from y.start_date)::int + 1, 1, 1) else s.start_date end,
    end_date = case when upper(s.type::text) like '%FIRST%' then make_date(extract(year from y.start_date)::int + 1, 1, 1) - 1 when upper(s.type::text) like '%SECOND%' then y.end_date else s.end_date end
from public.school_years y where s.school_year_id=y.id;
