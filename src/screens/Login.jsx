import React,{useState}from'react'
import{Eye,EyeOff,LogIn}from'lucide-react'
import{Card,Button}from'../components/UI'
import SiteFooter from'../components/SiteFooter'
import{loginEmployee}from'../services/data'

export default function Login(){
 const [username,setUsername]=useState('')
 const [password,setPassword]=useState('')
 const [show,setShow]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const submit=async e=>{
  e.preventDefault();setError('')
  if(!username.trim()||!password){setError('أدخل اسم المستخدم وكلمة المرور.');return}
  setBusy(true)
  try{await loginEmployee(username,password);window.location.replace('/login-welcome')}
  catch(err){setError(err.message||'اسم المستخدم أو كلمة المرور غير صحيحة.')}
  finally{setBusy(false)}
 }
 return <div className="portal-home login-page reference-login">
   <div className="portal-home-overlay" aria-hidden="true"/>
   <div className="reference-login-top">
     <div className="reference-bismillah">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>
     <div className="reference-identities">
       <div className="reference-guidance-brand">
         <img src="/assets/guidance-logo.png" alt="شعار الإرشاد التربوي"/>
         <strong>الإرشاد التربوي</strong>
       </div>
       <div className="reference-ministry-brand">
         <img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/>
         <div><strong>دولة فلسطين</strong><span>وزارة التربية والتعليم العالي</span></div>
       </div>
     </div>
     <h1 className="reference-program-title">برنامج الإرشاد التربوي</h1>
   </div>

   <main className="reference-login-main">
     <Card className="portal-login-card reference-login-card">
       <div className="reference-login-heading">تسجيل الدخول</div>
       <div className="reference-login-subtitle">مرحبًا بك، يرجى تسجيل الدخول للمتابعة</div>
       {error&&<div className="notice error portal-login-error">{error}</div>}
       <form onSubmit={submit} className="portal-login-form">
         <label className="field"><span>اسم المستخدم</span><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="اسم المستخدم"/></label>
         <label className="field portal-password-field"><span>كلمة المرور</span><div className="portal-password-wrap"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="كلمة المرور"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
         <div className="reference-login-options"><label><input type="checkbox"/> <span>تذكرني</span></label><button type="button" onClick={()=>setError('يرجى التواصل مع مسؤول النظام لإعادة تعيين كلمة المرور.')} className="reference-forgot">نسيت كلمة المرور؟</button></div>
         <Button loading={busy} type="submit" className="reference-login-button"><LogIn size={17}/> تسجيل الدخول</Button>
       </form>
     </Card>
   </main>

   <SiteFooter publicPage/>
 </div>
}
