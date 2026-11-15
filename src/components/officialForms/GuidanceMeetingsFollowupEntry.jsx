import React from 'react'
import {Button,Input,Textarea} from '../UI'
import {Plus,Trash2,Eye,Save,CalendarDays} from 'lucide-react'

const dayName=value=>{
 if(!value)return ''
 const d=new Date(`${value}T00:00:00`)
 return Number.isNaN(d.getTime())?'':['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]
}
const blankRow=()=>({date:'',period:'',grade_id:'',section_id:'',grade:'',section:'',topic:'',objectives:'',activities:'',notes:''})

export default function GuidanceMeetingsFollowupEntry({profile,grades=[],sections=[],form,onChange,onShowPreview,onSave,meetingLabel='لقاءات التوجيه الجمعي'}){
 const rows=form.rows?.length?form.rows:[blankRow()]
 const update=(index,key,value)=>onChange({...form,rows:rows.map((row,i)=>i===index?{...row,[key]:value}:row)})
 const add=()=>onChange({...form,rows:[...rows,blankRow()]})
 const remove=index=>onChange({...form,rows:rows.length>1?rows.filter((_,i)=>i!==index):[blankRow()]})
 return <div className="guidance-meetings-entry">
  <div className="official-workspace-head"><div><h2>نموذج إدخال البيانات</h2><p>أدخل بيانات {meetingLabel}، ثم اعرض النموذج الرسمي.</p></div></div>
  <div className="official-entry-card">
   <div className="official-auto-grid"><div className="official-auto-field wide"><span>اسم المرشد/ة التربوي/ة</span><strong>{profile?.full_name||'—'}</strong></div></div>
   <div className="official-rows-head"><strong>{meetingLabel}</strong><Button onClick={add}><Plus size={15}/> إضافة لقاء</Button></div>
   {rows.map((row,index)=><section key={index} className="guidance-meeting-row" style={{border:'1px solid #e4dfd5',borderRadius:12,padding:14,marginBottom:14,background:'#fff'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:12}}><strong>اللقاء {index+1}</strong><button type="button" className="official-delete-row" onClick={()=>remove(index)} title="حذف اللقاء"><Trash2 size={16}/></button></div>
    <div className="generic-fields-grid">
     <label className="field"><span><CalendarDays size={14} style={{verticalAlign:'middle'}}/> اليوم والتاريخ</span><input type="date" value={row.date||''} onChange={e=>update(index,'date',e.target.value)}/><small style={{color:'#647067'}}>اليوم: {dayName(row.date)||'يُحدد تلقائيًا بعد اختيار التاريخ'}</small></label>
     <div className="field"><span>الحصة</span><input value={row.period||''} onChange={e=>update(index,'period',e.target.value)} placeholder="رقم الحصة"/></div>
     <div className="field"><span>الصف</span><select value={row.grade_id||''} onChange={e=>onChange({...form,rows:rows.map((item,i)=>i===index?{...item,grade_id:e.target.value,section_id:'',grade:grades.find(g=>String(g.id)===String(e.target.value))?.name||'' ,section:''}:item)})}><option value="">اختر الصف</option>{grades.map((g,i)=><option key={g.id} value={g.id}>{g.name||`الصف ${i+1}`}</option>)}</select></div>
     <div className="field"><span>الشعبة</span><select value={row.section_id||''} disabled={!row.grade_id} onChange={e=>onChange({...form,rows:rows.map((item,i)=>i===index?{...item,section_id:e.target.value,section:sections.find(sec=>String(sec.id)===String(e.target.value))?.name||''}:item)})}><option value="">{row.grade_id?'اختر الشعبة':'اختر الصف أولًا'}</option>{sections.filter(sec=>String(sec.grade_id)===String(row.grade_id)).map(sec=><option key={sec.id} value={sec.id}>{sec.name}</option>)}</select></div>
     <div className="field"><span>الموضوع</span><textarea rows={2} value={row.topic||''} onChange={e=>update(index,'topic',e.target.value)}/></div>
     <div className="field"><span>الأهداف</span><textarea rows={2} value={row.objectives||''} onChange={e=>update(index,'objectives',e.target.value)}/></div>
     <div className="field"><span>الأنشطة</span><textarea rows={3} value={row.activities||''} onChange={e=>update(index,'activities',e.target.value)}/></div>
     <div className="field"><span>ملاحظات</span><textarea rows={2} value={row.notes||''} onChange={e=>update(index,'notes',e.target.value)}/></div>
    </div>
   </section>)}
   <div className="meeting-entry-actions"><Button onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button><Button variant="secondary" onClick={onSave}><Save size={16}/> حفظ البيانات</Button></div>
  </div>
 </div>
}
