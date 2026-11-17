import { getCustomToken } from './customSession'

const apiBase = () => import.meta.env.PROD
  ? ''
  : String(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8787').replace(/\/$/, '')

async function request(path, options = {}) {
  const token = getCustomToken()
  if (!token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.')
  let response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error('تعذر الاتصال بخادم النظام. تأكد من تشغيل السيرفر.')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'تعذر تنفيذ العملية.')
  return result
}

export async function listOfficialFormRecords(formIds, schoolYearId = '', semesterId = '') {
  const params = new URLSearchParams({ form_ids: formIds.join(',') })
  if (schoolYearId) params.set('school_year_id', schoolYearId)
  if (semesterId) params.set('semester_id', semesterId)
  const result = await request(`/api/official-forms?${params.toString()}`)
  return result.records || []
}

export async function saveOfficialFormRecord({ formId, profile, form, recordId = null }) {
  const result = await request('/api/official-forms', {
    method: 'POST',
    body: JSON.stringify({
      form_id: formId,
      record_id: recordId,
      school_id: profile?.school_id || null,
      school_year_id: form?.school_year_id || null,
      semester_id: form?.semester_id || null,
      form_data: form
    })
  })
  return result.record
}

// إدارة معلمي المدرسة
export async function listSchoolTeachers(schoolId) {
  const params = new URLSearchParams({ school_id: schoolId });
  const result = await request(`/api/school-teachers?${params.toString()}`);
  return result.teachers || [];
}

export async function createSchoolTeacher({ schoolId, fullName, specialization }) {
  const result = await request('/api/school-teachers', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      school_id: schoolId,
      full_name: fullName,
      specialization
    })
  });
  return result.teacher;
}

export async function updateSchoolTeacher({ teacherId, fullName, specialization }) {
  const result = await request('/api/school-teachers', {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      teacher_id: teacherId,
      full_name: fullName,
      specialization
    })
  });
  return result.teacher;
}

export async function deleteSchoolTeacher(teacherId) {
  return request('/api/school-teachers', {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      teacher_id: teacherId
    })
  });
}
