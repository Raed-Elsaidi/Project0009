import React from 'react'
import{useNavigate}from'react-router-dom'
import{LogIn,ShieldCheck}from'lucide-react'
import{Button,Card}from'../components/UI'
import SiteFooter from'../components/SiteFooter'

export default function WelcomeLanding(){
 const navigate=useNavigate()
 return <div className="portal-home">
   <div className="portal-home-overlay" aria-hidden="true"/>
   <header className="portal-header">
     <div className="portal-brand">
       <img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم"/>
       <div><strong>دولة فلسطين</strong><span>وزارة التربية والتعليم</span></div>
     </div>
   </header>
   <main className="portal-content">
     <div className="bismillah">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>
     <section className="portal-welcome">
       <h1>مرحبًا بك في نظام الإرشاد التربوي</h1>
       <p>منصة متكاملة لإدارة أعمال الإرشاد التربوي ومتابعة الحالات والطلاب والبرامج والخطط والتقارير بكل سهولة وتنظيم.</p>
     </section>
     <Card className="portal-login-card">
       <div className="portal-login-title">
         <div className="portal-login-icon"><ShieldCheck size={22}/></div>
         <div><span>الوصول إلى النظام</span><h2>دخول إلى النظام</h2></div>
       </div>
       <p style={{margin:'0 0 18px',color:'#75685c',lineHeight:1.9}}>استخدم اسم المستخدم وكلمة المرور الخاصة بك للدخول إلى النظام، ثم سيتم توجيهك تلقائيًا إلى الشاشة المناسبة لوظيفتك.</p>
       <Button style={{width:'100%'}} onClick={()=>navigate('/login')}><LogIn size={17}/> تسجيل الدخول</Button>
     </Card>
   </main>
   <SiteFooter publicPage/>
 </div>
}

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
