import React,{useState}from'react'
import{useNavigate}from'react-router-dom'
import{LogIn,ShieldCheck,Eye,EyeOff}from'lucide-react'
import{Card,Button}from'../components/UI'
import SiteFooter from'../components/SiteFooter'
import{loginEmployee}from'../services/data'

export default function Login(){
 const navigate=useNavigate()
 const [username,setUsername]=useState('')
 const [password,setPassword]=useState('')
 const [show,setShow]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const submit=async e=>{
  e.preventDefault();setError('')
  if(!username.trim()||!password){setError('أدخل اسم المستخدم وكلمة المرور.');return}
  setBusy(true)
  try{await loginEmployee(username,password);navigate('/login-welcome',{replace:true})}
  catch(err){setError(err.message||'اسم المستخدم أو كلمة المرور غير صحيحة.')}
  finally{setBusy(false)}
 }
 return <div className="portal-home login-page">
   <div className="portal-home-overlay" aria-hidden="true"/>
   <div className="portal-bg-logo-mask" aria-hidden="true"/>

   <div className="portal-bismillah-top">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>

   <header className="portal-header">
     <div className="portal-brand">
       <img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/>
       <div>
         <strong>دولة فلسطين</strong>
         <span>وزارة التربية والتعليم</span>
       </div>
     </div>
   </header>

   <main className="portal-content">
     <section className="portal-welcome">
       <h1>مرحبًا بك في نظام الإرشاد التربوي</h1>
       <p>منصة متكاملة لإدارة أعمال الإرشاد التربوي ومتابعة الحالات والطلاب والبرامج والخطط والتقارير بكل سهولة وتنظيم.</p>
     </section>

     <Card className="portal-login-card">
       <div className="portal-login-title">
         <div className="portal-login-icon"><ShieldCheck size={22}/></div>
         <div><span>دخول آمن للموظفين</span><h2>تسجيل الدخول</h2></div>
       </div>
       {error&&<div className="notice error portal-login-error">{error}</div>}
       <form onSubmit={submit} className="portal-login-form">
         <label className="field">
           <span>اسم المستخدم</span>
           <input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" placeholder="أدخل اسم المستخدم"/>
         </label>
         <label className="field portal-password-field">
           <span>كلمة المرور</span>
           <div className="portal-password-wrap">
             <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="أدخل كلمة المرور"/>
             <button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'} title={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button>
           </div>
         </label>
         <Button loading={busy} type="submit" style={{width:'100%'}}><LogIn size={17}/> دخول</Button>
       </form>
     </Card>

     <div className="portal-guidance-logo">
       <img src="/assets/guidance-logo.png" alt="شعار الإرشاد التربوي"/>
       <strong>الإرشاد التربوي</strong>
     </div>
   </main>

   <SiteFooter publicPage/>
 </div>
}
