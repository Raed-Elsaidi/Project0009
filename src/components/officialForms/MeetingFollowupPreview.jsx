import React from 'react'

export default function MeetingFollowupPreview({profile,form,academic}){
 const year=academic.years.find(y=>y.id===form.school_year_id)
 const semester=academic.semesters.find(s=>s.id===form.semester_id)
 const rows=form.rows.filter(r=>r.date||r.time||r.person||r.topic||r.actions)
 const count=person=>rows.filter(r=>r.person===person).length
 return <div className="official-document">
  <header className="official-document-header">
   <div className="official-doc-side right"><strong>دولة فلسطين</strong><span>وزارة التربية والتعليم</span><span>الإدارة العامة للصحة الشمولية</span></div>
   <img src="/assets/ministry-logo.png" alt="شعار وزارة التربية والتعليم" className="official-ministry-logo"/>
   <div className="official-doc-side left" dir="ltr"><strong>State of Palestine</strong><span>Ministry of Education</span><span>Directorate General of Comprehensive Health</span></div>
  </header>
  <div className="official-doc-rule"/>
  <section className="official-doc-heading"><h1>ملف المقابلات</h1><h2>نموذج متابعة المقابلات</h2><p>للعام الدراسي <b>{year?.name||'...............'}</b> &nbsp;&nbsp; الفصل الدراسي <b>{semester?.name||'...............'}</b></p><p>( مدير المدرسة، معلم، أولياء الأمور، مؤسسات أخرى حدد ... )</p></section>
  <table className="official-doc-table meeting-main-table"><thead><tr><th>الرقم</th><th>اليوم</th><th>التاريخ</th><th>ساعة اللقاء</th><th>الشخص الذي تمت مقابلته</th><th>موضوع المقابلة</th><th>الإجراءات</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{i+1}</td><td>{r.day}</td><td dir="ltr">{r.date}</td><td dir="ltr">{r.time}</td><td>{r.person}</td><td>{r.topic}</td><td className="actions-cell">{r.actions}</td></tr>)}{Array.from({length:Math.max(0,4-rows.length)}).map((_,i)=><tr key={`blank-${i}`}><td>{rows.length+i+1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>)}</tbody></table>
  <div className="official-signature-block"><div><strong>اسم وتوقيع المرشد التربوي</strong><span>{profile?.full_name||'................................'}</span><em>{profile?.full_name||'التوقيع'}</em></div></div>
  <section className="official-summary"><h2>نموذج رصد المقابلات</h2><p>للعام الدراسي <b>{year?.name||'...............'}</b> &nbsp;&nbsp; الفصل الدراسي <b>{semester?.name||'...............'}</b></p><table className="official-doc-table"><thead><tr><th>الشخص الذي تم مقابلته</th><th>المجموع العام</th><th>ملاحظات</th></tr></thead><tbody>{['مدير المدرسة','المعلم','ولي الأمر','مؤسسات أخرى'].map(p=><tr key={p}><td>{p}</td><td>{count(p)}</td><td></td></tr>)}</tbody></table></section>
 </div>
}
