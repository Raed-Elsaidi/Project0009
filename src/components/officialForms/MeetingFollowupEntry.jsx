import React from 'react'
import { FileText, Plus, Trash2, Eye, Save } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../UI'

const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس']
const topics=['نفسية','سلوكية','تربوية']
const people=['مدير المدرسة','معلم','ولي الأمر','مؤسسات أخرى']
const emptyRow=(date='',day='')=>({day,date,time:'',person:'',topic:'',actions:''})

export function createMeetingRow(date,day){ return emptyRow(date,day) }

export default function MeetingFollowupEntry({profile,academic,form,onChange,today,onShowPreview,onSave}){
 const year=academic.years.find(y=>y.id===form.school_year_id)
 const semester=academic.semesters.find(s=>s.id===form.semester_id)
 const updateRow=(index,key,value)=>onChange({...form,rows:form.rows.map((row,i)=>i===index?{...row,[key]:value}:row)})
 const updateDate=(index,value)=>{
  const d=value?new Date(`${value}T00:00:00`):null
  const day=d&&!Number.isNaN(d.getTime())?['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]:''
  onChange({...form,rows:form.rows.map((row,i)=>i===index?{...row,date:value,day}:row)})
 }
 const add=()=>onChange({...form,rows:[...form.rows,emptyRow(today,today?['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(`${today}T00:00:00`).getDay()]:'')]})
 const remove=(index)=>onChange({...form,rows:form.rows.length>1?form.rows.filter((_,i)=>i!==index):[emptyRow(today,'')]})
 return <div className="meeting-entry">
  <div className="meeting-entry-title"><span className="meeting-entry-icon"><FileText size={19}/></span><div><h2>نموذج إدخال البيانات</h2><p>أدخل بيانات المقابلات مرة واحدة، وسيتم تحديث النموذج الرسمي تلقائيًا.</p></div></div>
  <div className="meeting-auto-grid">
   <div><span>العام الدراسي</span><strong>{year?.name||'—'}</strong></div>
   <div><span>الفصل الدراسي</span><strong>{semester?.name||'—'}</strong></div>
   <div><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong></div>
   <div><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div>
   <div className="wide"><span>المدرسة</span><strong>{profile?.schools?.name||'—'}</strong></div>
  </div>
  <div className="meeting-auto-note">البيانات العامة مثل السنة والفصل واسم المرشد والمدير والمدرسة لا تحتاج لإعادة إدخالها.</div>
  <div className="meeting-list-head"><div><h3>سجل المقابلات</h3><span>كل صف يمثل مقابلة واحدة في النموذج الرسمي.</span></div><Button onClick={add}><Plus size={16}/> إضافة مقابلة</Button></div>
  <div className="meeting-entry-table-wrap">
   <table className="meeting-entry-table"><thead><tr><th>الرقم</th><th>اليوم</th><th>التاريخ</th><th>ساعة اللقاء</th><th>الشخص الذي تمت مقابلته</th><th>موضوع المقابلة</th><th>الإجراءات</th><th></th></tr></thead>
   <tbody>{form.rows.map((row,index)=><tr key={index}><td className="index-cell">{index+1}</td><td><Select label="" value={row.day} onChange={e=>updateRow(index,'day',e.target.value)}><option value="">اختر</option>{days.map(day=><option key={day} value={day}>{day}</option>)}</Select></td><td><Input label="" type="date" value={row.date} onChange={e=>updateDate(index,e.target.value)}/></td><td><Input label="" type="time" value={row.time} onChange={e=>updateRow(index,'time',e.target.value)}/></td><td><Select label="" value={row.person} onChange={e=>updateRow(index,'person',e.target.value)}><option value="">اختر</option>{people.map(p=><option key={p}>{p}</option>)}</Select></td><td><Select label="" value={row.topic} onChange={e=>updateRow(index,'topic',e.target.value)}><option value="">اختر</option>{topics.map(t=><option key={t}>{t}</option>)}</Select></td><td><Textarea label="" value={row.actions} onChange={e=>updateRow(index,'actions',e.target.value)} placeholder="اكتب الإجراءات..."/></td><td><button type="button" className="meeting-delete" onClick={()=>remove(index)} title="حذف السجل"><Trash2 size={15}/></button></td></tr>)}</tbody></table>
  </div>
  <div className="meeting-entry-footer"><div><span>اسم وتوقيع المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong></div><div className="signature-placeholder">التوقيع</div></div>
  <div className="meeting-entry-actions">
   <Button onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button>
   <Button variant="secondary" onClick={onSave}><Save size={16}/> حفظ البيانات</Button>
  </div>
 </div>
}
