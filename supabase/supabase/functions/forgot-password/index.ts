import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
const alphabet={upper:'ABCDEFGHJKLMNPQRSTUVWXYZ',lower:'abcdefghijkmnopqrstuvwxyz',digits:'23456789',symbols:'!@#$%&*'}
function pick(s:string){return s[Math.floor(Math.random()*s.length)]}
function shuffle(a:string[]){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.join('')}
function generatePassword(){
 const chars=[pick(alphabet.upper),pick(alphabet.lower),pick(alphabet.digits),pick(alphabet.symbols)]
 const all=alphabet.upper+alphabet.lower+alphabet.digits+alphabet.symbols
 while(chars.length<10) chars.push(pick(all))
 return shuffle(chars)
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
 try{
  const b=await req.json()
  const username=String(b.username||'').trim().toLowerCase()
  const national_id=String(b.national_id||'').trim()
  const phone=String(b.phone||'').trim()
  if(!username||!national_id||!phone) throw new Error('يرجى إدخال اسم المستخدم ورقم الهوية ورقم الهاتف المسجل.')
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const {data:employee,error:pe}=await admin.from('profiles').select('id,username,national_id,phone,is_active').eq('username',username).eq('national_id',national_id).eq('phone',phone).eq('is_active',true).maybeSingle()
  if(pe) throw pe
  if(!employee) throw new Error('البيانات المدخلة لا تطابق البيانات المسجلة في النظام.')
  const password=generatePassword()
  const {error:ue}=await admin.auth.admin.updateUserById(employee.id,{password})
  if(ue) throw ue
  await admin.from('password_change_logs').insert({user_id:employee.id})
  return new Response(JSON.stringify({ok:true,password}),{status:200,headers:{...cors,'Content-Type':'application/json'}})
 }catch(e){return new Response(JSON.stringify({error:e?.message||'تعذر إنشاء كلمة المرور الجديدة.'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})
