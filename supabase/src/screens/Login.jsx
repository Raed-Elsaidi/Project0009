import React,{useState}from'react'
import{useNavigate,Link}from'react-router-dom'
import{supabase}from'../services/supabase'
import{Card,Input,Button}from'../components/UI'
import{requestPasswordResetPublic}from'../services/data'
import{GraduationCap,ShieldCheck,LogIn,KeyRound,ArrowRight,Eye,EyeOff,Flag}from'lucide-react'
import SiteFooter from'../components/SiteFooter'

const usernameEmail=(u)=>`${u.trim().toLowerCase()}@counselor.local`

export default function Login(){
 const n=useNavigate()
 const[username,setUsername]=useState(''),[password,setPassword]=useState(''),[showPassword,setShowPassword]=useState(false),[err,setErr]=useState(''),[loading,setLoading]=useState(false)
 const[showForgot,setShowForgot]=useState(false),[forgotStep,setForgotStep]=useState('verify'),[forgotUser,setForgotUser]=useState(''),[forgotNationalId,setForgotNationalId]=useState(''),[forgotPhone,setForgotPhone]=useState(''),[forgotPassword,setForgotPassword]=useState(''),[forgotBusy,setForgotBusy]=useState(false),[forgotMsg,setForgotMsg]=useState(''),[forgotErr,setForgotErr]=useState('')
 const login=async e=>{
  e.preventDefault()
  setErr('')
  if(!supabase){
    setErr('تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.')
    return
  }

  const enteredUsername=username.trim().toLowerCase()
  const enteredPassword=password

  if(!enteredUsername||!enteredPassword){
    setErr('أدخل اسم المستخدم وكلمة المرور.')
    return
  }

  setLoading(true)

  try{
    // Login uses the system username convention directly.
    // Do not query public.profiles before Auth: that query can fail under RLS/schema issues
    // and must never prevent a valid Auth login.
    const loginEmail=enteredUsername.includes('@')
      ? enteredUsername
      : `${enteredUsername}@counselor.local`

    const authResult=await supabase.auth.signInWithPassword({
      email:loginEmail.trim().toLowerCase(),
      password:enteredPassword
    })

    if(authResult.error){
      const ae=authResult.error
      const code=ae.code||''
      const status=ae.status||''
      const raw=ae.message||''

      if(raw.toLowerCase().includes('invalid login credentials')){
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة. (Auth رفض بيانات الدخول)')
      }
      if(raw.toLowerCase().includes('email logins are disabled')){
        throw new Error('تسجيل الدخول بالبريد الإلكتروني معطّل في إعدادات Supabase Auth.')
      }
      if(raw.toLowerCase().includes('failed to fetch')||raw.toLowerCase().includes('network')){
        throw new Error('تعذر الاتصال بخدمة Supabase Auth. تحقق من رابط Supabase ومفتاح ANON في ملف .env.local.')
      }
      throw new Error(`فشل تسجيل الدخول: ${raw}${code?` [${code}]`:''}${status?` [HTTP ${status}]`:''}`)
    }

    const authUser=authResult.data?.user
    if(!authUser?.id){
      throw new Error('تمت المصادقة لكن لم يُرجع Supabase رقم مستخدم صالح.')
    }

    const {data:profile,error:profileError}=await supabase.rpc('get_my_profile')

    if(profileError){
      await supabase.auth.signOut()
      throw new Error(`تمت المصادقة بنجاح، لكن تعذر تحميل ملف الموظف: ${profileError.message}`)
    }

    if(!profile){
      await supabase.auth.signOut()
      throw new Error('تمت المصادقة بنجاح، لكن لا يوجد ملف موظف مرتبط بهذا الحساب.')
    }

    if(profile.is_active===false){
      await supabase.auth.signOut()
      throw new Error('هذا الحساب غير فعال. يرجى مراجعة المسؤول.')
    }

    const allowed=['PROGRAMMER','MINISTRY','DIRECTORATE','PRINCIPAL','COUNSELOR']
    if(!allowed.includes(profile.role)){
      await supabase.auth.signOut()
      throw new Error('صلاحية الحساب غير معتمدة في النظام.')
    }

    setLoading(false)
    n('/welcome',{replace:true})
  }catch(e){
    setErr(e?.message||'تعذر تسجيل الدخول.')
    setLoading(false)
  }
 }
 const submitForgot=async e=>{
  e.preventDefault();setForgotErr('');setForgotMsg('')
  if(!forgotUser.trim()||!forgotNationalId.trim()||!forgotPhone.trim()){setForgotErr('أدخل اسم المستخدم ورقم الهوية ورقم الهاتف المسجل في النظام.');return}
  if(!/^\d{9}$/.test(forgotNationalId.trim())){setForgotErr('رقم الهوية يجب أن يتكون من 9 أرقام فقط.');return}
  if(!/^\d{10}$/.test(forgotPhone.trim())){setForgotErr('رقم الهاتف يجب أن يتكون من 10 أرقام فقط.');return}
  setForgotBusy(true)
  try{
   const result=await requestPasswordResetPublic({username:forgotUser,national_id:forgotNationalId,phone:forgotPhone})
   setForgotPassword(result.password);setForgotStep('new');setForgotMsg('تم التحقق من البيانات وإنشاء كلمة مرور جديدة بنجاح.')
  }catch(e){setForgotErr(e.message||'تعذر التحقق من البيانات.')}
  finally{setForgotBusy(false)}
 }
 const closeForgot=()=>{setShowForgot(false);setForgotStep('verify');setForgotUser('');setForgotNationalId('');setForgotPhone('');setForgotPassword('');setForgotMsg('');setForgotErr('')}
 const copyNewPassword=async()=>{try{await navigator.clipboard.writeText(forgotPassword);setForgotMsg('تم نسخ كلمة المرور الجديدة.')}catch{setForgotMsg('تعذر النسخ تلقائيًا؛ حدّد كلمة المرور وانسخها يدويًا.')}}

 return <div className="login-page login-page-bg">
   <div className="login-overlay" aria-hidden="true"/>
   <header className="login-ministry-header">
     <div className="login-ministry-brand">
       <img src="/assets/ministry-logo.png" className="login-ministry-seal" alt="شعار وزارة التربية والتعليم"/>
       <div>
         <div className="login-state">دولة فلسطين</div>
         <div className="login-ministry-title">وزارة التربية والتعليم</div>
         <div className="login-ministry-sub">نظام إدارة ملفات الإرشاد التربوي</div>
       </div>
     </div>
   </header>
   <main className="login-main">
     <section className="login-intro">
       <h2>أهلاً بك في نظام الإرشاد التربوي</h2>
       <p>نظام آمن لإدارة ملفات الإرشاد التربوي وخدمات الموظفين.</p>
     </section>
     <section className="login-form-wrap">
       <Card className="login-card login-card-wide">
         <div className="login-top">
           <div className="role-icon"><LogIn size={24}/></div>
           <div><span>تسجيل الدخول</span><h1>بوابة الموظفين</h1></div>
         </div>
         {err&&<div className="notice error login-error">{err}</div>}
         <form onSubmit={login}>
           <Input label="اسم المستخدم" value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,''))} placeholder="اسم المستخدم" autoComplete="username"/>
           <label className="field password-field login-password-field">
             <span>كلمة المرور</span>
             <div className="input-with-action">
               <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 إلى 10 أحرف" autoComplete="current-password"/>
               <button type="button" className="password-eye" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button>
             </div>
           </label>
           <div className="password-hint">8 إلى 10 أحرف، مع حرف كبير وحرف صغير ورقم ورمز.</div>
           <Button loading={loading} style={{width:'100%',marginTop:8}}>دخول إلى النظام</Button>
           <button type="button" className="forgot-link login-forgot login-forgot-button" onClick={()=>{setShowForgot(true);setForgotStep('verify');setForgotErr('');setForgotMsg('')}}><KeyRound size={16}/> نسيت كلمة المرور؟</button>
         </form>
         {showForgot&&<div className="forgot-panel"><div className="forgot-panel-head"><div><strong>{forgotStep==='verify'?'فقدان كلمة المرور':'إنشاء كلمة مرور جديدة'}</strong><span>{forgotStep==='verify'?'أدخل البيانات الثلاثة المسجلة في النظام للتحقق من هويتك.':'تم استبدال كلمة المرور القديمة بكلمة المرور الجديدة.'}</span></div><button type="button" className="icon-btn" onClick={closeForgot} aria-label="إغلاق">×</button></div>{forgotErr&&<div className="notice error">{forgotErr}</div>}{forgotStep==='verify'?<form onSubmit={submitForgot}><Input label="اسم المستخدم" value={forgotUser} onChange={e=>setForgotUser(e.target.value.toLowerCase().replace(/\s/g,''))} autoComplete="username"/><Input label="رقم الهوية" value={forgotNationalId} onChange={e=>setForgotNationalId(e.target.value.replace(/\D/g,"").slice(0,9))} inputMode="numeric"/><Input label="رقم الهاتف المسجل" value={forgotPhone} onChange={e=>setForgotPhone(e.target.value.replace(/\D/g,"").slice(0,10))} inputMode="tel" autoComplete="tel"/><Button loading={forgotBusy} style={{width:'100%'}}><ShieldCheck size={16}/> تحقق وإنشاء كلمة مرور</Button></form>:<div className="new-password-panel">{forgotMsg&&<div className="notice"><ShieldCheck size={16}/> {forgotMsg}</div>}<div className="generated-password-row"><div className="generated-password">{forgotPassword}</div><Button variant="secondary" type="button" onClick={copyNewPassword}>📋 نسخ</Button></div><div className="notice password-warning">الرجاء الاحتفاظ بكلمة المرور الجديدة حتى تتمكن من الدخول بها لاحقًا.</div><Button type="button" style={{width:'100%'}} onClick={closeForgot}>إغلاق</Button></div>}</div>}
    <div className="login-help">إذا لم يكن لديك حساب، تواصل مع الإدارة لإنشاء حسابك وربطه بالمديرية والمدرسة.</div>{import.meta.env.DEV&&<div className="login-dev-status">وضع الاختبار: اتصال Supabase مفعّل</div>}
   
       </Card>
     </section>
   </main>
   <SiteFooter publicPage />
 </div>
}
