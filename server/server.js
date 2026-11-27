import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url).pathname });
import express from 'express';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '2mb' }));

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_JWT_SECRET,
  AUTH_API_PORT = '8901',
  ALLOWED_ORIGIN = 'http://localhost:5173',
  BOOTSTRAP_SECRET
} = process.env;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bootstrap-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const SUPABASE_ADMIN_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SECRET_KEY;
const configReady = Boolean(SUPABASE_URL && SUPABASE_ADMIN_KEY && SUPABASE_JWT_SECRET);
const db = configReady
  ? createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function signToken(profile) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({
    iss: 'supabase',
    aud: 'authenticated',
    role: 'authenticated',
    sub: profile.id,
    app_role: profile.role,
    iat: now,
    exp: now + 8 * 60 * 60
  });
  const input = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', SUPABASE_JWT_SECRET).update(input).digest('base64url');
  return `${input}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;

    const header = JSON.parse(
      Buffer.from(headerPart, 'base64url').toString()
    );

    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const input = `${headerPart}.${payloadPart}`;

    const expected = crypto
      .createHmac('sha256', SUPABASE_JWT_SECRET)
      .update(input)
      .digest();

    const actual = Buffer.from(signaturePart, 'base64url');

    if (
      actual.length !== expected.length ||
      !crypto.timingSafeEqual(actual, expected)
    ) {
      return null;
    }

    const claims = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString()
    );

    const now = Math.floor(Date.now() / 1000);

    if (
      claims.iss !== 'supabase' ||
      claims.aud !== 'authenticated' ||
      !claims.sub ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= now ||
      !Number.isFinite(claims.iat) ||
      claims.iat > now + 60
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

function requireReady(res) {
  if (configReady) return true;
  res.status(503).json({
    error: 'خادم تسجيل الدخول غير مكتمل الإعداد. راجع server/.env ثم أعد تشغيل الخادم.'
  });
  return false;
}
async function profileForToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const claims = verifyToken(header.slice(7));
  if (!claims?.sub || !claims.exp || claims.exp < Date.now() / 1000) return null;
  const { data, error } = await db.from('profiles')
    .select('id,username,role,is_active,school_id,directorate_id')
    .eq('id', claims.sub)
    .maybeSingle();
  if (error || !data || data.is_active === false) return null;
  return data;
}
function profileFromRpcResult(result) {
  if (Array.isArray(result)) {
    return result.find(row => row && typeof row === 'object' && row.id && row.username) || null;
  }
  if (result && typeof result === 'object' && result.id && result.username) return result;
  return null;
}

function rpcPasswordMatches(result, rpcName) {
  if (result === true) return true;
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0];
    if (first === true) return true;
    if (first && typeof first === 'object') {
      return first[rpcName] === true || first.is_valid === true || first.valid === true;
    }
  }
  if (result && typeof result === 'object') {
    return result[rpcName] === true || result.is_valid === true || result.valid === true;
  }
  return false;
}

async function loadActiveProfile(username, rpcProfile = null, allowedRole = null) {
  let query = db.from('profiles').select('id,username,full_name,role,is_active');
  if (rpcProfile?.id) query = query.eq('id', rpcProfile.id);
  else query = query.ilike('username', username);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data || data.is_active === false) {
    if (data?.is_active === false) throw new Error('هذا الحساب غير نشط. يرجى مراجعة الإدارة.');
    return null;
  }
  if (allowedRole && data.role !== allowedRole) return null;
  return data;
}

async function verifyExamStylePassword(username, password) {
  // The SQL RPCs may return a boolean OR the matching profile row.
  // Accept both documented return shapes without changing any stored account data.
  const { data: supervisorValid, error: supervisorError } = await db.rpc('verify_supervisor_password', {
    p_username: username,
    p_password: password
  });

  if (supervisorError) {
    // A missing/non-applicable supervisor function should not hide a valid employee login.
    console.error('verify_supervisor_password RPC:', supervisorError.message);
  } else {
    const supervisorRow = profileFromRpcResult(supervisorValid);
    if (supervisorRow || rpcPasswordMatches(supervisorValid, 'verify_supervisor_password')) {
      const supervisor = await loadActiveProfile(username, supervisorRow, 'SUPER_ADMIN');
      if (supervisor) return supervisor;
    }
  }

  const { data: employeeValid, error: employeeError } = await db.rpc('verify_employee_password', {
    p_username: username,
    p_password: password
  });
  if (employeeError) {
    console.error('verify_employee_password RPC:', employeeError.message);
    throw new Error('تعذّر تسجيل الدخول حاليًا. يرجى المحاولة مرة أخرى، وإذا استمرت المشكلة تواصل مع الإدارة.');
  }

  const employeeRow = profileFromRpcResult(employeeValid);
  const employeePasswordMatches = Boolean(employeeRow) || rpcPasswordMatches(employeeValid, 'verify_employee_password');
  if (!employeePasswordMatches) return null;

  return await loadActiveProfile(username, employeeRow);
}

app.post('/api/login', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!username || !password) return res.status(400).json({ error: 'أدخل اسم المستخدم وكلمة المرور.' });

    const profile = await verifyExamStylePassword(username, password);
    if (!profile) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });

    return res.json({
      token: signToken(profile),
      expires_in: 28800,
      profile: { id: profile.id, username: profile.username, full_name: profile.full_name, role: profile.role }
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: error.message || 'تعذر إتمام تسجيل الدخول.' });
  }
});

app.post('/api/change-password', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });
    const currentPassword = String(req.body?.currentPassword || '');
    const password = String(req.body?.password || '');
    if (!currentPassword) return res.status(400).json({ error: 'أدخل كلمة المرور الحالية.' });
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{8,10}$/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون من 8 إلى 10 أحرف وتحتوي على حرف صغير وحرف كبير ورقم ورمز.' });
    }
    const verified = await verifyExamStylePassword(profile.username, currentPassword);
    if (!verified || verified.id !== profile.id) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
    const { error } = await db.rpc('set_profile_password', { p_profile_id: profile.id, p_password: password });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    console.error('Change password failed:', error);
    return res.status(500).json({ error: 'تعذر تغيير كلمة المرور.' });
  }
});

app.post('/api/admin/initialize-password', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    if (!BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] !== BOOTSTRAP_SECRET) {
      return res.status(403).json({ error: 'غير مصرح.' });
    }
    const id = String(req.body?.profile_id || '');
    const password = String(req.body?.password || '');
    if (!id || password.length < 10) return res.status(400).json({ error: 'حدد معرّف الحساب وكلمة مرور لا تقل عن 10 أحرف.' });
    const { error } = await db.rpc('set_profile_password', { p_profile_id: id, p_password: password });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    console.error('Initialize password failed:', error);
    return res.status(500).json({ error: 'تعذر تهيئة كلمة المرور.' });
  }
});

app.post('/api/admin/set-password', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const actor = await profileForToken(req);
    if (!actor || !['SUPER_ADMIN', 'MINISTRY'].includes(actor.role)) return res.status(403).json({ error: 'غير مصرح.' });
    const id = String(req.body?.profile_id || '');
    const password = String(req.body?.password || '');
    if (!id || password.length < 10) return res.status(400).json({ error: 'حدد الحساب وكلمة مرور لا تقل عن 10 أحرف.' });
    const { error } = await db.rpc('set_profile_password', { p_profile_id: id, p_password: password });
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) {
    console.error('Set password failed:', error);
    return res.status(500).json({ error: 'تعذر حفظ كلمة المرور.' });
  }
});


const OFFICIAL_FORM_IDS = new Set([
  'meeting-principal',
  'meeting-teacher',
  'meeting-parents',
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
]);


async function canManageSchoolTeachers(profile, schoolId) {
  if (!profile || !schoolId) return false;

  const allowedRoles = ['PROGRAMMER', 'MINISTRY', 'DIRECTORATE', 'COUNSELOR'];
  if (!allowedRoles.includes(profile.role)) return false;

  const { data: school, error } = await db
    .from('schools')
    .select('id,directorate_id')
    .eq('id', schoolId)
    .maybeSingle();

  if (error || !school) return false;

  if (profile.role === 'PROGRAMMER' || profile.role === 'MINISTRY') {
    return true;
  }

  if (profile.role === 'DIRECTORATE') {
    return Boolean(
      profile.directorate_id &&
      school.directorate_id === profile.directorate_id
    );
  }

  return profile.role === 'COUNSELOR' &&
    profile.school_id === schoolId;
}

app.get('/api/school-teachers', async (req, res) => {
  if (!requireReady(res)) return;

  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });

    const schoolId = String(req.query.school_id || '').trim();
    if (!schoolId) {
      return res.status(400).json({ error: 'معرّف المدرسة مطلوب.' });
    }

    if (!await canManageSchoolTeachers(profile, schoolId)) {
      return res.status(403).json({ error: 'غير مصرح بإدارة معلمي هذه المدرسة.' });
    }

    const { data, error } = await db
      .from('school_teachers')
      .select('id,school_id,full_name,specialization,created_at,updated_at')
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return res.json({ teachers: data || [] });
  } catch (error) {
    console.error('School teachers read failed:', error);
    return res.status(500).json({ error: 'تعذر تحميل قائمة المعلمين.' });
  }
});

app.post('/api/school-teachers', async (req, res) => {
  if (!requireReady(res)) return;

  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });

    const action = String(req.body?.action || '');
    const fullName = String(req.body?.full_name || '').trim();
    const specialization = String(req.body?.specialization || '').trim();

    if (!['create', 'update', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'نوع العملية غير صالح.' });
    }

    if (action === 'create') {
      const schoolId = String(req.body?.school_id || '').trim();

      if (!schoolId) {
        return res.status(400).json({ error: 'معرّف المدرسة مطلوب.' });
      }

      if (!await canManageSchoolTeachers(profile, schoolId)) {
        return res.status(403).json({ error: 'غير مصرح بإدارة معلمي هذه المدرسة.' });
      }

      if (!fullName || !specialization || fullName.length > 150 || specialization.length > 150) {
        return res.status(400).json({ error: 'أدخل اسم المعلم والتخصص بشكل صحيح (150 حرفًا كحد أقصى).' });
      }

      const { data, error } = await db
        .from('school_teachers')
        .insert({ school_id: schoolId, full_name: fullName, specialization })
        .select('id,school_id,full_name,specialization,created_at,updated_at')
        .single();

      if (error?.code === '23505') {
        return res.status(409).json({ error: 'يوجد معلم بهذا الاسم في المدرسة.' });
      }
      if (error) throw error;

      return res.status(201).json({ teacher: data });
    }

    const teacherId = String(req.body?.teacher_id || '').trim();
    if (!teacherId) {
      return res.status(400).json({ error: 'معرّف المعلم مطلوب.' });
    }

    const { data: existing, error: lookupError } = await db
      .from('school_teachers')
      .select('id,school_id')
      .eq('id', teacherId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) return res.status(404).json({ error: 'المعلم غير موجود.' });

    if (!await canManageSchoolTeachers(profile, existing.school_id)) {
      return res.status(403).json({ error: 'غير مصرح بإدارة هذا المعلم.' });
    }

    if (action === 'update') {
      if (!fullName || !specialization || fullName.length > 150 || specialization.length > 150) {
        return res.status(400).json({ error: 'أدخل اسم المعلم والتخصص بشكل صحيح (150 حرفًا كحد أقصى).' });
      }

      const { data, error } = await db
        .from('school_teachers')
        .update({
          full_name: fullName,
          specialization,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId)
        .eq('school_id', existing.school_id)
        .select('id,school_id,full_name,specialization,created_at,updated_at')
        .maybeSingle();

      if (error?.code === '23505') {
        return res.status(409).json({ error: 'يوجد معلم آخر بهذا الاسم في المدرسة.' });
      }
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'لم يتم العثور على المعلم.' });

      return res.json({ teacher: data });
    }

    const { error } = await db
      .from('school_teachers')
      .delete()
      .eq('id', teacherId)
      .eq('school_id', existing.school_id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error('School teachers write failed:', error);
    return res.status(500).json({ error: 'تعذر تنفيذ العملية على بيانات المعلم.' });
  }
});

app.get('/api/official-forms', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });

    const requested = String(req.query.form_ids || req.query.form_id || '')
      .split(',').map(value => value.trim()).filter(Boolean);
    if (!requested.length || requested.some(id => !OFFICIAL_FORM_IDS.has(id))) {
      return res.status(400).json({ error: 'معرّف النموذج غير صالح.' });
    }

    let query = db.from('official_form_records')
      .select('id,form_id,counselor_id,school_id,school_year_id,semester_id,form_data,created_at,updated_at')
      .in('form_id', requested);

    const requestedSchoolId = String(req.query.school_id || '').trim();
    if (requestedSchoolId) {
      const { data: school, error: schoolError } = await db.from('schools')
        .select('id,directorate_id').eq('id', requestedSchoolId).maybeSingle();
      if (schoolError) throw schoolError;
      if (!school || (profile.directorate_id && String(school.directorate_id) !== String(profile.directorate_id)) || (!profile.directorate_id && String(profile.school_id) !== requestedSchoolId)) {
        return res.status(403).json({ error: 'لا تملك صلاحية عرض سجلات هذه المدرسة.' });
      }
      query = query.eq('school_id', requestedSchoolId);
    } else {
      query = query.eq('counselor_id', profile.id);
    }

    if (req.query.school_year_id) query = query.eq('school_year_id', String(req.query.school_year_id));
    if (req.query.semester_id) query = query.eq('semester_id', String(req.query.semester_id));

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw error;
    return res.json({ records: data || [] });
  } catch (error) {
    console.error('Official forms read failed:', error);
    return res.status(500).json({ error: 'تعذر تحميل بيانات النماذج من قاعدة البيانات.' });
  }
});

app.post('/api/official-forms', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });

    const formId = String(req.body?.form_id || '');
    if (!OFFICIAL_FORM_IDS.has(formId)) {
      return res.status(400).json({ error: 'معرّف النموذج غير صالح.' });
    }

    const formData = req.body?.form_data;
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      return res.status(400).json({ error: 'بيانات النموذج غير صالحة.' });
    }

    const schoolYearId = req.body?.school_year_id || null;
    const semesterId = req.body?.semester_id || null;
    const recordId = String(req.body?.record_id || '').trim();
    const payload = {
      form_id: formId,
      counselor_id: profile.id,
      school_id: req.body?.school_id || null,
      school_year_id: schoolYearId,
      semester_id: semesterId,
      form_data: formData,
      updated_at: new Date().toISOString()
    };

    let result;
    if (recordId) {
        // Preserve the original signer names when an existing document is edited.
        const { data: existingRecord, error: existingError } = await db.from('official_form_records')
          .select('form_data')
          .eq('id', recordId).eq('form_id', formId).eq('counselor_id', profile.id)
          .maybeSingle();

        if (existingError) throw existingError;
        if (!existingRecord) {
          return res.status(404).json({ error: 'لم يتم العثور على سجل الاجتماع المطلوب.' });
        }

        const originalSnapshot = existingRecord.form_data?._document_snapshot;
        payload.form_data = originalSnapshot
          ? { ...formData, _document_snapshot: originalSnapshot }
          : formData;

        result = await db.from('official_form_records').update(payload)
          .eq('id', recordId).eq('form_id', formId).eq('counselor_id', profile.id)
          .select('id,form_id,school_year_id,semester_id,form_data,created_at,updated_at').maybeSingle();
      } else {
      // A new meeting always creates a separate row; it never overwrites an earlier meeting.
      result = await db.from('official_form_records').insert(payload)
        .select('id,form_id,school_year_id,semester_id,form_data,created_at,updated_at').single();
    }
    if (result.error) throw result.error;
    return res.json({ record: result.data });
  } catch (error) {
    console.error('Official forms save failed:', error);
    return res.status(500).json({ error: 'تعذر حفظ بيانات النموذج في قاعدة البيانات.' });
  }
});

app.delete('/api/official-forms', async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const profile = await profileForToken(req);
    if (!profile) return res.status(401).json({ error: 'انتهت الجلسة.' });
    const recordId = String(req.body?.record_id || '').trim();
    if (!recordId) return res.status(400).json({ error: 'معرّف السجل مطلوب.' });
    const { data, error } = await db.from('official_form_records')
      .delete()
      .eq('id', recordId)
      .eq('form_id', 'health-cases')
      .eq('counselor_id', profile.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'السجل غير موجود أو لا تملك صلاحية حذفه.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Official health record delete failed:', error);
    return res.status(500).json({ error: 'تعذر حذف سجل الحالة الصحية.' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, configured: configReady }));
export default app;

const port = Number(process.env.AUTH_API_PORT) || 8787;
app.listen(port, '0.0.0.0', () => {
  console.log(`Auth API listening on port ${port}`);
});
