import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
export const Page=({title,sub,actions,children,eyebrow})=>{
 const [params]=useSearchParams();
 const navigate=useNavigate();
 const fromWeekly=params.get('from')==='weekly';
 const weeklyDate=params.get('date')||'';
 const weeklyPeriod=params.get('period')||'';
 return <section className={'page '+(fromWeekly?'from-weekly':'')}>
  <div className="pagehead"><div><div className="eyebrow">{eyebrow || 'نظام المرشد التربوي'}</div><h1>{title}</h1><p>{sub}</p></div><div className="page-actions">{actions}</div></div>
  {fromWeekly&&<div className="weekly-context-bar"><div><CalendarDays size={16}/><span>اليوم</span><strong>{weeklyDate||'—'}</strong></div><div><Clock3 size={16}/><span>الحصة</span><strong>{weeklyPeriod||'—'}</strong></div><em>العمل مرتبط بالبرنامج اليومي / الأسبوعي</em></div>}
  {children}
  {fromWeekly&&<div className="weekly-back-wrap"><button type="button" className="weekly-back-button" onClick={()=>navigate('/weekly-program')}><ArrowRight size={18}/> رجوع إلى شاشة الجدول اليومي / الأسبوعي</button></div>}
 </section>
}
export const Card=({children,className=''})=><div className={'card '+className}>{children}</div>
export const Button=({children,loading=false,variant='',...p})=><button className={'btn '+variant} disabled={loading||p.disabled} {...p}>{loading&&<Loader2 className="spin" size={16}/>} {children}</button>
export const Input=({label,hint,type,...p})=>{const [show,setShow]=React.useState(false);const isPassword=type==='password';const numericType=['number','tel','date','datetime-local','month','week','time'].includes(type);return <label className={'field '+(isPassword?'password-field':'')}>{label}<div className="input-with-action"><input {...p} type={isPassword?(show?'text':'password'):type} lang={numericType?'en':p.lang} inputMode={p.inputMode||(numericType?'numeric':undefined)} dir={numericType?'ltr':p.dir}/>{isPassword&&<button type="button" className="password-eye" onClick={()=>setShow(v=>!v)} aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>}</div>{hint&&<small>{hint}</small>}</label>}
export const Textarea=({label,hint,...p})=><label className="field">{label}<textarea {...p}/>{hint&&<small>{hint}</small>}</label>
export const Select=({label,children,...p})=><label className="field">{label}<select {...p}>{children}</select></label>
export const Empty=({title='لا توجد بيانات بعد',text='ابدأ بإضافة أول سجل من النموذج أعلاه.'})=><div className="empty"><div className="empty-icon">✦</div><strong>{title}</strong><span>{text}</span></div>
export const ErrorNotice=({children})=><div className="notice error">{children}</div>

<style id="mobile-final-adjustments">
@media (max-width: 700px){
  footer, .footer, .site-footer, .app-footer { transform: translateY(-38px) !important; }
  /* Hide only the text label immediately associated with the guidance logo. */
  .guidance-logo + .guidance-label, .guidance-logo-text, .guidance-logo + span, .guidance-logo + p { display:none !important; }
}
</style>
