import React from 'react'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import {openParliamentAchievementAttachment} from '../../services/data'

const dayName=value=>{
 if(!value)return ''
 const d=new Date(`${value}T00:00:00`)
 return Number.isNaN(d.getTime())?'':['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]
}
const dateLabel=value=>{
 if(!value)return ''
 const [y,m,d]=value.split('-')
 return `${d}/${m}/${y}`
}
export default function GuidanceMeetingsFollowupPreview({profile,grades=[],sections=[],form,academicYear='',title='نموذج متابعة لقاءات التوجيه الجمعي',showAttachments=false}){
 const rows=(form.rows||[]).filter(r=>r.date||r.period||r.grade||r.section||r.topic||r.objectives||r.activities||r.notes||(showAttachments&&r.attachments?.length))
 return <div className="official-document guidance-meetings-official">
  <OfficialDocumentHeader profile={profile}/>
  <div className="guidance-meetings-school-meta"><div className="guidance-meetings-academic-year">العام الدراسي: {academicYear||'—'}</div></div>
  <h1 className="guidance-meetings-title">{title}</h1>
  <p className="guidance-meetings-counselor">اسم المرشد/ة التربوي/ة : <strong>{profile?.full_name||'................................'}</strong></p>
  <table className="official-doc-table guidance-meetings-table" style={{width:'100%',tableLayout:'fixed'}}>
   <colgroup>
    <col style={{width:'12%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'9%'}}/>
    <col style={{width:'11%'}}/><col style={{width:'12%'}}/><col style={{width:'22%'}}/>
    {showAttachments&&<col style={{width:'11%'}}/>}
    <col style={{width:'9%'}}/>
   </colgroup>
   <thead><tr>{['اليوم/التاريخ','الصف','الشعبة','الحصة','الموضوع','الأهداف','الأنشطة',...(showAttachments?['المرفقات']:[]),'ملاحظات'].map(x=><th key={x}>{x}</th>)}</tr></thead>
   <tbody>{rows.map((r,i)=><tr key={i}>
    <td>{dayName(r.date)}{r.date?<><br/>{dateLabel(r.date)}</>:''}</td><td>{grades.find(g=>String(g.id)===String(r.grade_id))?.name||r.grade||''}</td><td>{sections.find(sec=>String(sec.id)===String(r.section_id))?.name||r.section||''}</td><td>{r.period||''}</td><td>{r.topic||''}</td><td>{r.objectives||''}</td><td>{r.activities||''}</td>
    {showAttachments&&<td>{(r.attachments||[]).map((attachment,j)=><div key={attachment.storage_path||j} style={{marginBottom:4}}><button type="button" onClick={()=>openParliamentAchievementAttachment(attachment.storage_path).catch(error=>window.alert(error.message||'تعذر فتح المرفق.'))} style={{border:0,background:'transparent',color:'#075b57',textDecoration:'underline',cursor:'pointer',fontSize:'inherit',fontFamily:'inherit'}}>فتح المرفق</button></div>)}</td>}
    <td>{r.notes||''}</td>
   </tr>)}{Array.from({length:Math.max(0,3-rows.length)}).map((_,i)=><tr key={`empty-${i}`}>{Array.from({length:showAttachments?9:8}).map((__,j)=><td key={j}>&nbsp;</td>)}</tr>)}</tbody>
  </table>
 </div>
}
