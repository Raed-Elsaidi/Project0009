import React,{useEffect,useMemo,useState} from 'react'
import { Button } from '../UI'
import { currentUser,currentProfile,requireSemesterReportClient } from '../../services/data'

const ITEMS=[
  ['collective','التوجيه الجمعي'],
  ['career','التوجيه المهني'],
  ['parliament','اجتماعات البرلمان'],
  ['focused_interviews','رصد ومتابعة المقابلات الفردية المركزة'],
  ['meetings_interviews','المقابلات والاجتماعات']
]
const MONTHS=[{id:9,label:'أيلول (9)'},{id:10,label:'تشرين الأول (10)'},{id:11,label:'تشرين الثاني (11)'},{id:12,label:'كانون الأول (12)'},{id:1,label:'كانون الثاني (1)'},{id:2,label:'شباط (2)'},{id:3,label:'آذار (3)'},{id:4,label:'نيسان (4)'},{id:5,label:'أيار (5)'}]
const EMPTY=()=>Object.fromEntries(MONTHS.map(m=>[m.id,Object.fromEntries(ITEMS.map(([key])=>[key,0]))]))

export default function SemesterReportCounts({academic,profile}){
 const years=academic.years||[], semesters=academic.semesters||[]
 const year=years.find(x=>x.is_active)||years[0]
 const semesterList=useMemo(()=>semesters.filter(s=>s.school_year_id===year?.id).sort((a,b)=>new Date(a.start_date||0)-new Date(b.start_date||0)),[semesters,year?.id])
 const [active,setActive]=useState(0),[counts,setCounts]=useState(EMPTY),[recordId,setRecordId]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const selected=semesterList[active]
 const months=active===0?MONTHS.slice(0,4):MONTHS.slice(4)
 useEffect(()=>{let alive=true;setCounts(EMPTY());setRecordId(null);setMessage('');(async()=>{
  if(!selected||!year?.id)return
  try{
   const client=requireSemesterReportClient()
   const user=await currentUser()
   if(!user?.id)throw new Error('انتهت جلسة الدخول.')
   const {data,error}=await client.from('semester_reports').select('id,monthly_counts').eq('counselor_id',user.id).eq('school_year_id',year.id).eq('semester_id',selected.id).maybeSingle()
   if(error)throw error
   if(alive&&data){setRecordId(data.id);setCounts({...EMPTY(),...(data.monthly_counts||{})})}
  }catch(e){if(alive)setMessage(e.message||'تعذر تحميل التقرير.')}
 })();return()=>{alive=false}},[selected?.id,year?.id])
 const update=(month,key,value)=>setCounts(prev=>({...prev,[month]:{...(prev[month]||{}),[key]:Math.max(0,Number(value)||0)}}))
 const save=async()=>{
  if(!selected||!year?.id){setMessage('يرجى التأكد من إعداد السنة والفصل الدراسي.');return}
  setBusy(true);setMessage('')
  try{
   const client=requireSemesterReportClient(),user=await currentUser(),p=profile||await currentProfile()
   if(!user?.id||!p?.school_id)throw new Error('تعذر تحديد حساب المرشد أو المدرسة.')
   const payload={counselor_id:user.id,school_id:p.school_id,school_year_id:year.id,semester_id:selected.id,monthly_counts:counts}
   let result
   if(recordId){const r=await client.from('semester_reports').update(payload).eq('id',recordId).select('id').single();if(r.error)throw r.error;result=r.data}
   else{const r=await client.from('semester_reports').insert(payload).select('id').single();if(r.error)throw r.error;result=r.data;setRecordId(result.id)}
   setMessage('تم حفظ الأعداد الشهرية في قاعدة البيانات بنجاح.')
  }catch(e){setMessage(e.message||'تعذر حفظ التقرير.')}
  finally{setBusy(false)}
 }
 const total=key=>months.reduce((sum,m)=>sum+Number(counts[m.id]?.[key]||0),0)
 if(!semesterList.length)return <div className="official-entry-card"><p>لا توجد فصول دراسية مرتبطة بالسنة النشطة. يرجى مراجعة إعدادات السنة والفصول.</p></div>
 return <div className="official-entry-card" dir="rtl">
  <div className="official-entry-section-title"><div><strong>إحصائيات الإنجاز الشهري</strong><span>أدخلي أعداد التنفيذ الفعلي لكل بند، وسيُحسب مجموع الفصل تلقائيًا.</span></div></div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'12px 0'}}>{semesterList.slice(0,2).map((s,i)=><button key={s.id} type="button" onClick={()=>setActive(i)} style={{padding:'9px 16px',borderRadius:8,border:'1px solid #cbd5e1',background:active===i?'#dbeafe':'white',fontWeight:700,cursor:'pointer'}}>{i===0?'الفصل الأول':'الفصل الثاني'}</button>)}</div>
  <div style={{overflowX:'auto'}}><table className="official-entry-table" style={{minWidth:650,width:'100%'}}><thead><tr><th style={{minWidth:220}}>نوع النشاط</th>{months.map(m=><th key={m.id}>{m.label}</th>)}<th>المجموع</th></tr></thead><tbody>{ITEMS.map(([key,label])=><tr key={key}><th style={{textAlign:'right'}}>{label}</th>{months.map(m=><td key={m.id}><input aria-label={`${label} ${m.label}`} type="number" min="0" step="1" value={counts[m.id]?.[key]??0} onChange={e=>update(m.id,key,e.target.value)} style={{width:75,minWidth:60}} /></td>)}<td style={{fontWeight:700}}>{total(key)}</td></tr>)}</tbody><tfoot><tr><th>مجموع جميع البنود</th><td colSpan={months.length+1} style={{fontWeight:700}}>{ITEMS.reduce((s,[key])=>s+total(key),0)}</td></tr></tfoot></table></div>
  <div style={{display:'flex',alignItems:'center',gap:12,marginTop:14,flexWrap:'wrap'}}><Button onClick={save} disabled={busy}>{busy?'جارٍ الحفظ...':'حفظ أعداد التقرير'}</Button>{message&&<span role="status" style={{color:message.startsWith('تم')?'#15803d':'#b45309'}}>{message}</span>}</div>
 </div>
}
