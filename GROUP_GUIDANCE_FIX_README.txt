إصلاح الإرشاد الجماعي - تعليمات

1) استبدل ملفات المشروع من هذا الأرشيف داخل csite_work.
2) لا تستبدل .env.local أو server/.env.
3) نفّذ group_guidance_official_forms_fix.sql في Supabase SQL Editor مرة واحدة.
4) أوقف خوادم Node/Vite القديمة التي تشغل نسخًا أخرى من المشروع.
5) من مجلد المشروع:
   npm run dev -- --host 0.0.0.0 --port 5189 --strictPort
6) من جلسة Termux ثانية:
   cd server
   node --env-file=.env server.js

تم توحيد المنفذ الافتراضي لخادم API إلى 8901 في ملفات المشروع.
تأكد أن server/.env يحتوي:
AUTH_API_PORT=8901
ALLOWED_ORIGIN=http://localhost:5189

إذا كان VITE_AUTH_API_URL موجودًا في .env.local فيجب أن يكون:
VITE_AUTH_API_URL=http://localhost:8901
