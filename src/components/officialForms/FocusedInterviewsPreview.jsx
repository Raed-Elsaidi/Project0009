import React from 'react'
import OfficialDocumentHeader from './OfficialDocumentHeader'
const dateLabel=value=>{if(!value)return '';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?value:d.toLocaleDateString('ar-PS')}
export default function FocusedInterviewsPreview({profile,file,academicYear=''}){
 const reviews=[...(file?.focused_interview_reviews||[])].sort((a,b)=>String(a.review_date).localeCompare(String(b.review_date)))
 return <div className="official-document focused-interviews-official">
  <OfficialDocumentHeader profile={profile}/>
  <div className="guidance-meetings-school-meta"><div className="guidance-meetings-academic-year">العام الدراسي: {academicYear||'—'}</div></div>
  <h1 className="guidance-meetings-title">نموذج رصد ومتابعة المقابلات الفردية المركزة</h1>
  <p className="guidance-meetings-counselor">اسم المرشد/ة التربوي/ة: <strong>{profile?.full_name||'................................'}</strong></p>
  <div style={{display:'flex',gap:18,flexWrap:'wrap',margin:'12px 0',fontSize:12}}><span>رقم المتابعة: <strong>{file?.serial_number||'—'}</strong></span><span>اسم الطالب: <strong>{file?.student_name||'—'}</strong></span><span>الصف: <strong>{file?.grade_name||'—'}</strong></span><span>الشعبة: <strong>{file?.section_name||'—'}</strong></span></div>
  <table className="official-doc-table" style={{width:'100%',tableLayout:'fixed'}}><thead><tr>{['تاريخ المقابلة','موضوع المقابلة','ملخص المقابلة والملاحظات','النتيجة','التوصيات والمتابعة'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{reviews.map(r=><tr key={r.id}><td>{dateLabel(r.review_date)}</td><td>{r.topic||''}</td><td>{r.notes||''}</td><td>{r.result||''}</td><td>{r.recommendations||''}</td></tr>)}{Array.from({length:Math.max(0,3-reviews.length)}).map((_,i)=><tr key={`empty-${i}`}>{Array.from({length:5}).map((__,j)=><td key={j}>&nbsp;</td>)}</tr>)}</tbody></table>
 </div>
}
