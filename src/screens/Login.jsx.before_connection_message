import React,{useState}from'react'
import{Eye,EyeOff,LogIn,User,X,ShieldCheck,KeyRound}from'lucide-react'
import{Card,Button}from'../components/UI'
import SiteFooter from'../components/SiteFooter'
import{loginEmployee,verifyEmployeeIdentity,resetEmployeePassword}from'../services/data'

const passwordPattern=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,10}$/

export default function Login(){
 const [username,setUsername]=useState('')
 const [password,setPassword]=useState('')
 const [show,setShow]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [forgotOpen,setForgotOpen]=useState(false)
 const [forgotStep,setForgotStep]=useState('verify')
 const [forgotBusy,setForgotBusy]=useState(false)
 const [forgotError,setForgotError]=useState('')
 const [forgotNotice,setForgotNotice]=useState('')
 const [forgot,setForgot]=useState({username:'',nationalId:'',phone:'',newPassword:'',confirmPassword:''})
 const [showNew,setShowNew]=useState(false)
 const [showConfirm,setShowConfirm]=useState(false)

 const submit=async e=>{
  e.preventDefault();setError('');setNotice('')
  if(!username.trim()||!password){setError('أدخل اسم المستخدم وكلمة المرور.');return}
  setBusy(true)
  try{await loginEmployee(username,password);window.location.replace('/login-welcome')}
  catch(err){setError(err.message||'اسم المستخدم أو كلمة المرور غير صحيحة.')}
  finally{setBusy(false)}
 }

 const openForgot=()=>{
  setForgotOpen(true);setForgotStep('verify');setForgotError('');setForgotNotice('');setForgot({...forgot,newPassword:'',confirmPassword:''})
 }
 const closeForgot=()=>{if(forgotBusy)return;setForgotOpen(false);setForgotError('');setForgotNotice('')}
 const verifyIdentity=async e=>{
  e.preventDefault();setForgotError('');setForgotNotice('')
  if(!forgot.username.trim()||!/^\d{9}$/.test(forgot.nationalId)||!/^\d{10}$/.test(forgot.phone)){
   setForgotError('أدخل اسم المستخدم ورقم الهوية (9 أرقام) ورقم الجوال (10 أرقام) بشكل صحيح.');return
  }
  setForgotBusy(true)
  try{
   await verifyEmployeeIdentity({username:forgot.username,nationalId:forgot.nationalId,phone:forgot.phone})
   setForgotStep('new')
  }catch(err){setForgotError(err.message||'البيانات المدخلة غير صحيحة.')}
  finally{setForgotBusy(false)}
 }

 const saveNewPassword=async e=>{
  e.preventDefault();setForgotError('');setForgotNotice('')
  if(!passwordPattern.test(forgot.newPassword)){
   setForgotError('كلمة المرور يجب أن تكون من 8–10 أحرف وتحتوي على حرف كبير وحرف صغير ورقم ورمز.');return
  }
  if(forgot.newPassword!==forgot.confirmPassword){setForgotError('كلمتا المرور غير متطابقتين.');return}
  setForgotBusy(true)
  try{
   await resetEmployeePassword({username:forgot.username,nationalId:forgot.nationalId,phone:forgot.phone,password:forgot.newPassword})
   setForgotNotice('تم تغيير كلمة المرور بنجاح واستبدال كلمة المرور السابقة. يمكنك الآن تسجيل الدخول بالكلمة الجديدة.')
   setUsername(forgot.username.trim().toLowerCase());setPassword('')
   setForgotStep('done')
  }catch(err){setForgotError(err.message||'تعذر تغيير كلمة المرور.')}
  finally{setForgotBusy(false)}
 }

 return <div className="portal-home login-page reference-login">
   <div className="portal-home-overlay" aria-hidden="true"/>
   <div className="reference-login-top">
     <div className="reference-bismillah">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>
     <div className="reference-identities">
       <div className="reference-guidance-brand"><img src="/assets/guidance-logo.png" alt="شعار الإرشاد التربوي"/></div>
       <div className="reference-ministry-brand"><img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/><div><strong>دولة فلسطين</strong><span>وزارة التربية والتعليم العالي</span></div></div>
     </div>
     <h1 className="reference-program-title">برنامج الإرشاد التربوي</h1>
   </div>

   <main className="reference-login-main">
     <Card className="portal-login-card reference-login-card">
       <div className="reference-login-heading">تسجيل الدخول</div>
       <div className="reference-login-subtitle">مرحبًا بك، يرجى تسجيل الدخول للمتابعة</div>
       {error&&<div className="notice error portal-login-error">{error}</div>}
       {notice&&<div className="notice success portal-login-error">{notice}</div>}
       <form onSubmit={submit} className="portal-login-form">
         <label className="field reference-input-field"><span>اسم المستخدم</span><div className="reference-input-wrap"><User size={19} aria-hidden="true"/><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="اسم المستخدم"/></div></label>
         <label className="field portal-password-field reference-input-field"><span>كلمة المرور</span><div className="portal-password-wrap reference-input-wrap"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="كلمة المرور"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
         <div className="reference-login-options"><label><input type="checkbox"/> <span>تذكرني</span></label><button type="button" onClick={openForgot} className="reference-forgot">نسيت كلمة المرور؟</button></div>
         <Button loading={busy} type="submit" className="reference-login-button"><LogIn size={17}/> تسجيل الدخول</Button>
       </form>
     </Card>
   </main>

   <SiteFooter publicPage/>

   {forgotOpen&&<div className="forgot-password-backdrop" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title" onMouseDown={closeForgot}>
     <div className="forgot-password-modal" onMouseDown={e=>e.stopPropagation()}>
       <div className="forgot-password-head"><div><div className="forgot-password-icon"><KeyRound size={20}/></div><div><h2 id="forgot-password-title">استعادة كلمة المرور</h2><p>{forgotStep==='verify'?'تحقق من بيانات الموظف للمتابعة.':forgotStep==='new'?'تم التحقق من البيانات، أدخل كلمة المرور الجديدة.':'تم تحديث كلمة المرور.'}</p></div></div><button type="button" className="forgot-password-close" onClick={closeForgot} disabled={forgotBusy} aria-label="إغلاق"><X size={20}/></button></div>
       {forgotStep==='verify'&&<form onSubmit={verifyIdentity} className="forgot-password-form">
         <div className="forgot-security-note"><ShieldCheck size={18}/><span>يجب أن تتطابق البيانات الثلاثة مع بيانات الموظف المسجلة في النظام.</span></div>
         <label className="field"><span>اسم المستخدم *</span><input value={forgot.username} onChange={e=>setForgot({...forgot,username:e.target.value})} autoComplete="username" placeholder="اسم المستخدم"/></label>
         <label className="field"><span>رقم الهوية *</span><input value={forgot.nationalId} onChange={e=>setForgot({...forgot,nationalId:e.target.value.replace(/\D/g,'').slice(0,9)})} inputMode="numeric" maxLength={9} placeholder="9 أرقام"/></label>
         <label className="field"><span>رقم الجوال المسجل *</span><input value={forgot.phone} onChange={e=>setForgot({...forgot,phone:e.target.value.replace(/\D/g,'').slice(0,10)})} inputMode="numeric" maxLength={10} placeholder="10 أرقام"/></label>
         {forgotError&&<div className="notice error">{forgotError}</div>}
         <Button loading={forgotBusy} type="submit"><ShieldCheck size={16}/> التحقق من البيانات</Button>
       </form>}

       {forgotStep==='new'&&<form onSubmit={saveNewPassword} className="forgot-password-form">
         <div className="forgot-verified"><ShieldCheck size={18}/><span>تم التحقق من هوية الموظف بنجاح.</span></div>
         <label className="field"><span>كلمة المرور الجديدة *</span><div className="forgot-password-input"><input type={showNew?'text':'password'} value={forgot.newPassword} onChange={e=>setForgot({...forgot,newPassword:e.target.value})} autoComplete="new-password" placeholder="8–10 أحرف"/><button type="button" onClick={()=>setShowNew(v=>!v)} aria-label={showNew?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showNew?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
         <label className="field"><span>إعادة كتابة كلمة المرور *</span><div className="forgot-password-input"><input type={showConfirm?'text':'password'} value={forgot.confirmPassword} onChange={e=>setForgot({...forgot,confirmPassword:e.target.value})} autoComplete="new-password" placeholder="أعد كتابة كلمة المرور"/><button type="button" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{showConfirm?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
         <div className="password-policy-inline forgot-policy"><strong>قواعد كلمة المرور</strong><span>8–10 أحرف، حرف كبير، حرف صغير، رقم ورمز.</span></div>
         {forgotError&&<div className="notice error">{forgotError}</div>}
         <Button loading={forgotBusy} type="submit"><KeyRound size={16}/> حفظ كلمة المرور الجديدة</Button>
       </form>}

       {forgotStep==='done'&&<div className="forgot-password-done"><div className="forgot-done-icon"><ShieldCheck size={30}/></div><h3>تم تغيير كلمة المرور بنجاح</h3><p>{forgotNotice}</p><Button type="button" onClick={closeForgot}>العودة إلى تسجيل الدخول</Button></div>}
     </div>
   </div>}
 </div>
}
