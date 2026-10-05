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
  const {data:manager}=await admin.from('profiles').select('id,role,directorate_id').eq('id',user.id).single()
  if(!manager||!['MINISTRY','DIRECTORATE'].includes(manager.role))throw new Error('لا تملك صلاحية إنشاء الحسابات.')
  const b=await req.json();const role=b.role
  if(!['DIRECTORATE','PRINCIPAL','COUNSELOR'].includes(role))throw new Error('نوع الوظيفة غير صحيح.')
  if(manager.role==='DIRECTORATE'&&role==='DIRECTORATE')throw new Error('رئيس القسم لا ينشئ رئيس قسم آخر.')
  const full_name=String(b.full_name||'').trim(), national_id=String(b.national_id||'').trim(), employee_number=String(b.employee_number||'').trim(), phone=String(b.phone||'').trim(), gender=String(b.gender||'').trim(), username=String(b.username||'').trim().toLowerCase(), password=String(b.password||'')
  if(!full_name||!national_id||!employee_number||!phone||!gender||!username||!password)throw new Error('بيانات الموظف غير مكتملة.')
  if(!/^\d{9}$/.test(national_id))throw new Error('رقم الهوية يجب أن يتكون من 9 أرقام فقط.')
  if(employee_number.length>50)throw new Error('الرقم الوظيفي طويل جدًا.')
  if(!/^\d{10}$/.test(phone))throw new Error('رقم الهاتف يجب أن يتكون من 10 أرقام فقط.')
  if(!['MALE','FEMALE'].includes(gender))throw new Error('الجنس غير صحيح.')
  if(!/^[A-Za-z0-9._-]{3,40}$/.test(username))throw new Error('اسم المستخدم غير صالح.')
  const {data:existingEmployeeNo}=await admin.from('profiles').select('id').eq('employee_number',employee_number).maybeSingle();if(existingEmployeeNo)throw new Error('الرقم الوظيفي مستخدم مسبقًا في النظام.')
  if(!passwordOk(password))throw new Error('كلمة المرور لا تطابق الشروط المطلوبة.')
  const directorate_id=manager.role==='DIRECTORATE'?manager.directorate_id:b.directorate_id
  if(!directorate_id)throw new Error('يجب تحديد المديرية.')
  if(manager.role==='DIRECTORATE'&&directorate_id!==manager.directorate_id)throw new Error('لا يمكنك إنشاء حساب خارج مديريتك.')
  const {data:existing}=await admin.from('profiles').select('id').ilike('username',username).maybeSingle();if(existing)throw new Error('اسم المستخدم مستخدم مسبقًا في النظام.')
  if(role==='COUNSELOR'){
   if(!b.school_id)throw new Error('اختر المدرسة.')
   const {data:s}=await admin.from('schools').select('id,directorate_id').eq('id',b.school_id).single();if(!s||s.directorate_id!==directorate_id)throw new Error('المدرسة لا تتبع المديرية المحددة.')
  }
  const email=`${username}@counselor.local`
  const {data:created,error:ce}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username,full_name}});if(ce)throw ce
  const {error:pe}=await admin.from('profiles').insert({id:created.user.id,full_name,username,national_id,employee_number,phone,gender,role,directorate_id,school_id:role==='COUNSELOR'?b.school_id:null,job_title:b.job_title||({DIRECTORATE:'رئيس القسم',PRINCIPAL:'مشرف تربوي',COUNSELOR:'مرشد تربوي'} as any)[role],is_active:true,profile_edit_count:0})
  if(pe){await admin.auth.admin.deleteUser(created.user.id);throw pe}
  if(role==='COUNSELOR')await admin.from('counselor_registry').insert({full_name,username,national_id,employee_number,email,phone,gender,directorate_id,school_id:b.school_id,job_title:b.job_title||'مرشد تربوي',auth_user_id:created.user.id,is_active:true})
  return new Response(JSON.stringify({ok:true,user_id:created.user.id,username}),{status:200,headers:{...cors,'Content-Type':'application/json'}})
 }catch(e){return new Response(JSON.stringify({error:e?.message||'تعذر إنشاء الحساب.'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})
