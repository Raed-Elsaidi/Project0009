import { requireSupabase } from './supabase'

const SESSION_KEY='employee_custom_session'

export function getCustomSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}
}

export function clearCustomSession(){localStorage.removeItem(SESSION_KEY); localStorage.removeItem('system_profile_id')}

export async function loginWithEmployeeCredentials(username,password){
  const sb=requireSupabase()
  const {data,error}=await sb.rpc('custom_employee_login',{p_username:username.trim().toLowerCase(),p_password:password})
  if(error) throw error
  if(!data?.success) throw new Error(data?.message||'اسم المستخدم أو كلمة المرور غير صحيحة.')
  const session={token:data.session_token,profile_id:data.profile_id,expires_at:data.expires_at}
  localStorage.setItem(SESSION_KEY,JSON.stringify(session))
  localStorage.setItem('system_profile_id',data.profile_id)
  return data
}

export async function logoutEmployee(){
  const session=getCustomSession()
  try{if(session?.token) await requireSupabase().rpc('custom_employee_logout',{p_session_token:session.token})}catch{}
  clearCustomSession()
}

export async function validateCustomSession(){
  const s=getCustomSession()
  if(!s?.token||!s?.profile_id) return false
  if(s.expires_at && new Date(s.expires_at).getTime()<=Date.now()){clearCustomSession();return false}
  try{
    const {data,error}=await requireSupabase().rpc('custom_validate_employee_session',{p_session_token:s.token})
    if(error||!data?.valid){clearCustomSession();return false}
    localStorage.setItem('system_profile_id',data.profile_id)
    return true
  }catch{return false}
}
