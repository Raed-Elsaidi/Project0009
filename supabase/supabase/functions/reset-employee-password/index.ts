import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
const passwordOk=(p:string)=>p.length>=8&&p.length<=10&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/[0-9]/.test(p)&&/[^A-Za-z0-9]/.test(p)
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const authHeader=req.headers.get('Authorization')||''
  const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authHeader}}})
  const {data:{user}}=await sb.auth.getUser();if(!user)throw new Error('غير مصرح.')
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const {data:manager}=await admin.from('profiles').select('role').eq('id',user.id).single();if(manager?.role!=='MINISTRY')throw new Error('إعادة ضبط كلمة المرور المركزية متاحة لمسؤول الإرشاد فقط.')
  const b=await req.json();if(!b.request_id||!passwordOk(String(b.password||'')))throw new Error('الطلب أو كلمة المرور غير صالح.')
  const {data:r}=await admin.from('password_reset_requests').select('id,employee_id,status').eq('id',b.request_id).single();if(!r||r.status!=='PENDING')throw new Error('الطلب غير متاح أو تمت معالجته مسبقًا.')
  const {data:employee}=await admin.from('profiles').select('id').eq('id',r.employee_id).single();if(!employee)throw new Error('الموظف غير موجود.')
  const {error:ue}=await admin.auth.admin.updateUserById(employee.id,{password:b.password});if(ue)throw ue
  await admin.from('password_change_logs').insert({user_id:employee.id})
  const {error:re}=await admin.from('password_reset_requests').update({status:'RESET',verified_by:user.id,verified_at:new Date().toISOString(),reset_at:new Date().toISOString()}).eq('id',r.id);if(re)throw re
  return new Response(JSON.stringify({ok:true,employee_id:employee.id}),{status:200,headers:{...cors,'Content-Type':'application/json'}})
 }catch(e){return new Response(JSON.stringify({error:e?.message||'تعذر إعادة ضبط كلمة المرور.'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})
