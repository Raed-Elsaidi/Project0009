import React from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
export const Page=({title,sub,actions,children,eyebrow})=><section className="page"><div className="pagehead"><div><div className="eyebrow">{eyebrow || 'نظام المرشد التربوي'}</div><h1>{title}</h1><p>{sub}</p></div><div className="page-actions">{actions}</div></div>{children}</section>
export const Card=({children,className=''})=><div className={'card '+className}>{children}</div>
export const Button=({children,loading=false,variant='',...p})=><button className={'btn '+variant} disabled={loading||p.disabled} {...p}>{loading&&<Loader2 className="spin" size={16}/>} {children}</button>
export const Input=({label,hint,type,...p})=>{const [show,setShow]=React.useState(false);const isPassword=type==='password';return <label className={'field '+(isPassword?'password-field':'')}>{label}<div className="input-with-action"><input {...p} type={isPassword?(show?'text':'password'):type}/>{isPassword&&<button type="button" className="password-eye" onClick={()=>setShow(v=>!v)} aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button>}</div>{hint&&<small>{hint}</small>}</label>}
export const Textarea=({label,hint,...p})=><label className="field">{label}<textarea {...p}/>{hint&&<small>{hint}</small>}</label>
export const Select=({label,children,...p})=><label className="field">{label}<select {...p}>{children}</select></label>
export const Empty=({title='لا توجد بيانات بعد',text='ابدأ بإضافة أول سجل من النموذج أعلاه.'})=><div className="empty"><div className="empty-icon">✦</div><strong>{title}</strong><span>{text}</span></div>
export const ErrorNotice=({children})=><div className="notice error">{children}</div>
