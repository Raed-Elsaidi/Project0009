import express from 'express';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '32kb' }));

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_JWT_SECRET,
  AUTH_API_PORT = '8787',
  ALLOWED_ORIGIN = 'http://localhost:5173',
  BOOTSTRAP_SECRET
} = process.env;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bootstrap-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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
    .select('id,username,role,is_active')
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
    throw new Error('تعذر التحقق من كلمة المرور. تأكد من أن دالة verify_employee_password في Supabase تُرجع نتيجة متوافقة مع الخادم.');
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
    const password = String(req.body?.password || '');
    if (password.length < 10) return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 10 أحرف على الأقل.' });
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

app.get('/health', (_req, res) => res.json({ ok: true, configured: configReady }));
app.listen(Number(AUTH_API_PORT), () => {
  console.log(`Custom auth API listening on ${AUTH_API_PORT}; configured=${configReady}`);
});
