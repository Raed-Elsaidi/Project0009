import { getCustomToken } from './customSession'

const apiBase = () => import.meta.env.PROD
  ? ''
  : String(import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8901').replace(/\/$/, '')

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

export async function saveOfficialFormRecord({ formId, profile, form }) {
  const result = await request('/api/official-forms', {
    method: 'POST',
    body: JSON.stringify({
      form_id: formId,
      school_id: profile?.school_id || null,
      school_year_id: form?.school_year_id || null,
      semester_id: form?.semester_id || null,
      form_data: form
    })
  })
  return result.record
}
