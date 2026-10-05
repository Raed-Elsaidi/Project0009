import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowLeft, Building2, UsersRound } from 'lucide-react'
import SiteFooter from '../components/SiteFooter'

export default function Home(){
  return <div className="public-home">
    <div className="public-glow one"/><div className="public-glow two"/>
    <header className="public-header">
      <div className="ministry-brand">
        <div className="ministry-seal"><GraduationCap size={28}/></div>
        <div><strong>وزارة التربية والتعليم</strong><span>نظام إدارة ملفات الإرشاد التربوي</span></div>
      </div>
      <div className="public-badge"><ShieldCheck size={15}/> منصة إرشادية مدرسية</div>
    </header>
    <main className="public-main">
      <section className="public-hero">
        <div className="public-copy">
          <span className="public-kicker">منصة رقمية موحدة</span>
          <h1>الإرشاد التربوي<br/><em>بشكل أبسط وأكثر تنظيمًا</em></h1>
          <p>منصة تساعد المرشدين ومديري الدوائر على إدارة ملفات الإرشاد، متابعة الأعمال، وقراءة الإحصائيات من مكان واحد.</p>
        </div>
        <div className="public-cards">
          <Link className="access-card counselor" to="/login/counselor">
            <div className="access-icon"><UsersRound size={28}/></div>
            <div><span>الدخول الأول</span><h2>المرشد التربوي</h2><p>إدارة الطلاب والملفات والبرامج والتقارير.</p></div>
            <ArrowLeft className="access-arrow" size={20}/>
          </Link>
          <Link className="access-card director" to="/login/directorate">
            <div className="access-icon"><Building2 size={28}/></div>
            <div><span>الدخول الإداري</span><h2>مدير الدائرة</h2><p>متابعة المرشدين والإحصائيات حسب كل مرشد ومدرسة.</p></div>
            <ArrowLeft className="access-arrow" size={20}/>
          </Link>
        </div>
      </section>
      <SiteFooter publicPage />
    </main>
  </div>
}
