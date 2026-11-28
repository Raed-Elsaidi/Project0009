import React, {useState} from 'react'
import {Button,Input,Textarea} from '../UI'
import {Plus,Trash2,Eye,Save,CalendarDays,Paperclip,ExternalLink,Upload} from 'lucide-react'
import {uploadParliamentAchievementAttachment,openParliamentAchievementAttachment,deleteParliamentAchievementAttachment} from '../../services/data'

const dayName=value=>{
 if(!value)return ''
 const d=new Date(`${value}T00:00:00`)
 return Number.isNaN(d.getTime())?'':['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]
}
const blankRow=()=>({date:'',period:'',grade_id:'',section_id:'',grade:'',section:'',topic:'',objectives:'',activities:'',notes:'',attachments:[]})

export default function GuidanceMeetingsFollowupEntry({profile,grades=[],sections=[],form,onChange,onShowPreview,onSave,meetingLabel='لقاءات التوجيه الجمعي',allowAttachments=false}){
 const [uploading,setUploading]=useState({})
 const rows=form.rows?.length?form.rows:[blankRow()]
 const uploadFiles=async(index,event)=>{
  const files=Array.from(event.target.files||[])
  event.target.value=''
  if(!files.length)return
  setUploading(prev=>({...prev,[index]:true}))
  try{
   const uploaded=[]
   for(const file of files){
    uploaded.push(await uploadParliamentAchievementAttachment(file))
   }
   const current=form.rows?.length?form.rows:[blankRow()]
   onChange({...form,rows:current.map((row,i)=>i===index?{...row,attachments:[...(row.attachments||[]),...uploaded]}:row)})
  }catch(error){
   window.alert(error.message||'تعذر رفع المرفق.')
  }finally{
   setUploading(prev=>({...prev,[index]:false}))
  }
 }
 const removeAttachment=async(index,attachmentIndex)=>{
  const row=rows[index]
  const attachment=(row.attachments||[])[attachmentIndex]
  if(!attachment)return
  if(!window.confirm('هل تريد حذف هذا المرفق نهائيًا؟'))return
  try{
   await deleteParliamentAchievementAttachment(attachment.storage_path)
   update(index,'attachments',(row.attachments||[]).filter((_,i)=>i!==attachmentIndex))
  }catch(error){
   window.alert(error.message||'تعذر حذف المرفق.')
  }
 }
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
     {allowAttachments&&<div className="field" style={{gridColumn:'1 / -1'}}>
      <span><Paperclip size={14} style={{verticalAlign:'middle'}}/> المرفقات</span>
      <label style={{display:'flex',alignItems:'center',gap:8,padding:12,border:'1px dashed #b8c8c2',borderRadius:10,cursor:uploading[index]?'wait':'pointer',background:'#f8fbf9'}}>
       <Upload size={17}/>
       <span>{uploading[index]?'جارٍ رفع الملفات...':'اختر ملفات لإرفاقها بهذا اللقاء'}</span>
       <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods" disabled={!!uploading[index]} onChange={e=>uploadFiles(index,e)} style={{display:'none'}}/>
      </label>
      {(row.attachments||[]).map((attachment,attachmentIndex)=><div key={attachment.storage_path||attachmentIndex} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'8px 10px',marginTop:7,border:'1px solid #e5e7eb',borderRadius:8}}>
       <span style={{display:'flex',alignItems:'center',gap:7,minWidth:0,overflowWrap:'anywhere'}}><Paperclip size={14}/>{attachment.file_name} <small style={{color:'#647067'}}>({Math.ceil((attachment.size_bytes||0)/1024)} KB)</small></span>
       <span style={{display:'flex',gap:6,flexShrink:0}}>
        <button type="button" title="فتح المرفق" onClick={()=>openParliamentAchievementAttachment(attachment.storage_path).catch(error=>window.alert(error.message||'تعذر فتح المرفق.'))}><ExternalLink size={15}/></button>
        <button type="button" title="حذف المرفق" onClick={()=>removeAttachment(index,attachmentIndex)}><Trash2 size={15}/></button>
       </span>
      </div>)}
     </div>}
     <div className="field"><span>ملاحظات</span><textarea rows={2} value={row.notes||''} onChange={e=>update(index,'notes',e.target.value)}/></div>
    </div>
   </section>)}
   <div className="meeting-entry-actions"><Button onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button><Button variant="secondary" onClick={onSave}><Save size={16}/> حفظ البيانات</Button></div>
  </div>
 </div>
}
