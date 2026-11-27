import React,{useEffect,useRef,useState}from'react'
import{Button}from'../UI'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import{Eye,Save,Paperclip,FileText,ExternalLink,Trash2}from'lucide-react'
import{uploadParliamentAchievementAttachment,openParliamentAchievementAttachment,deleteParliamentAchievementAttachment}from'../../services/data'

const ordinal=['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر','الثالث عشر','الرابع عشر','الخامس عشر','السادس عشر','السابع عشر','الثامن عشر','التاسع عشر','العشرون']

const fields=[
'الهدف العام',
'الأهداف الإجرائية',
'الفعاليات والأنشطة التدريبية',
'سير التدريب',
'الخاتمة والتدريب',
'الخاتمة والتقييم',
'الخلاصة والمخرجات'
]

const inputStyle={width:'100%',padding:'11px 12px',border:'1px solid #e5d8c5',borderRadius:10,fontFamily:'inherit',fontSize:14,background:'#fff',color:'#263b38',boxSizing:'border-box'}
const labelStyle={display:'block',fontWeight:700,color:'#075b57',marginBottom:8}

export default function ParliamentTeamTraining({profile,academic,form,onChange,onShowPreview,onSave,meetingNumber=1}){
 const fileRef=useRef(null)
 const[uploading,setUploading]=useState(false)
 const[notice,setNotice]=useState('')
 const values=form?.values||{}
 const counselorName=String(profile?.full_name||'').trim()
 const managerName=String(profile?.manager_name||'').trim()
 useEffect(()=>{
  const next={...values}
  let changed=false
  if(!next.counselor_name&&counselorName){next.counselor_name=counselorName;changed=true}
  if(!next.manager_name&&managerName){next.manager_name=managerName;changed=true}
  if(changed)onChange({...form,values:next})
 },[form,profile?.full_name,profile?.manager_name,onChange])
 const number=Number(values.meeting_number)||meetingNumber
 const meetingLabel=values['اللقاء']||`اللقاء ${ordinal[number-1]||number}`
 const update=(key,value)=>onChange({...form,values:{...values,[key]:value}})
 const attachments=form?.attachments||[]

 const uploadFiles=async e=>{
  const files=Array.from(e.target.files||[])
  if(!files.length)return
  setUploading(true)
  try{
   const uploaded=[]
   for(const file of files)uploaded.push(await uploadParliamentAchievementAttachment(file))
   onChange({...form,attachments:[...attachments,...uploaded]})
   setNotice(`تم رفع ${uploaded.length} مرفق بنجاح`)
  }catch(error){setNotice(error?.message||'تعذر رفع المرفقات')}
  finally{setUploading(false);e.target.value=''}
 }

 const removeFile=async file=>{
  try{
   await deleteParliamentAchievementAttachment(file.storage_path)
   onChange({...form,attachments:attachments.filter(x=>x.storage_path!==file.storage_path)})
   setNotice('تم حذف المرفق')
  }catch(error){setNotice(error?.message||'تعذر حذف المرفق')}
 }

 const openFile=async file=>{
  try{await openParliamentAchievementAttachment(file.storage_path)}
  catch(error){setNotice(error?.message||'تعذر فتح المرفق')}
 }

 return <div className="generic-form-entry" dir="rtl">
  <div className="official-workspace-head">
   <div><h2>سجل تدريب الفريق البرلماني</h2><p>أدخل تفاصيل اللقاء التدريبي، ثم احفظه أو اعرض النموذج الرسمي.</p></div>
   <div className="official-workspace-actions">
    <Button variant="secondary" onClick={onShowPreview}><Eye size={16}/> عرض النموذج الرسمي</Button>
    <Button onClick={onSave}><Save size={16}/> حفظ اللقاء</Button>
   </div>
  </div>

  <div className="official-entry-card">
   <div className="official-entry-section-title"><div><strong>البيانات الإدارية</strong><span>تُعرض تلقائيًا من بيانات المدرسة والإعدادات الدراسية</span></div></div>
   <div className="official-auto-grid">
    <div className="official-auto-field"><span>السنة الدراسية</span><strong>{academic?.yearName||'—'}</strong></div>
    <div className="official-auto-field"><span>الفصل الدراسي</span><strong>{academic?.semesterName||'—'}</strong></div>
    <div className="official-auto-field"><span>اسم المرشد التربوي</span><strong>{profile?.full_name||'—'}</strong></div>
    <div className="official-auto-field"><span>اسم المدير</span><strong>{profile?.manager_name||'—'}</strong></div>
    <div className="official-auto-field wide"><span>المدرسة</span><strong>{profile?.schools?.name||'—'}</strong></div>
    <div className="official-auto-field"><span>المديرية</span><strong>{profile?.directorates?.name||'—'}</strong></div>
   </div>
  </div>

  <div className="official-entry-card" style={{padding:20}}>
   <div style={{marginBottom:20}}>
    <label style={labelStyle}>اللقاء</label>
    <input style={{...inputStyle,fontWeight:700,color:'#075b57'}} value={meetingLabel} readOnly/>
    <input type="hidden" value={number}/>
   </div>

   {fields.map((field,index)=><div key={field} style={{marginBottom:20}}>
    <label style={labelStyle}>{index+1}. {field}</label>
    <textarea rows={field==='سير التدريب'||field==='الفعاليات والأنشطة التدريبية'?5:3}
     style={{...inputStyle,resize:'vertical',lineHeight:1.8}}
     value={values[field]||''}
     onChange={e=>update(field,e.target.value)}
     placeholder={`اكتب ${field} هنا...`}/>
   </div>)}

   <div style={{borderTop:'1px solid #e8ddcd',paddingTop:18}}>
    <label style={labelStyle}><Paperclip size={16} style={{verticalAlign:'middle',marginLeft:5}}/> المرفقات</label>
    <input ref={fileRef} type="file" multiple onChange={uploadFiles} accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp" style={{display:'none'}}/>
    <Button variant="secondary" onClick={()=>fileRef.current?.click()} disabled={uploading}><Paperclip size={15}/>{uploading?'جارٍ رفع الملفات...':'إضافة مرفقات'}</Button>
    <div style={{display:'grid',gap:8,marginTop:12}}>
     {attachments.map((file,index)=><div key={file.storage_path||index} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:10,border:'1px solid #e5d8c5',borderRadius:10,background:'#fff'}}>
      <span style={{display:'flex',alignItems:'center',gap:7,minWidth:0,overflowWrap:'anywhere'}}><FileText size={17}/>{file.file_name||'ملف مرفق'}</span>
      <span style={{display:'flex',gap:5,flexShrink:0}}>
       <Button size="sm" variant="secondary" onClick={()=>openFile(file)}><ExternalLink size={14}/> فتح</Button>
       <Button size="sm" variant="secondary" onClick={()=>removeFile(file)}><Trash2 size={14}/> حذف</Button>
      </span>
     </div>)}
     {!attachments.length&&<span style={{fontSize:13,color:'#81766a'}}>لا توجد مرفقات مضافة.</span>}
    </div>
   </div>
   {notice&&<p role="status" style={{color:'#075b57',marginTop:14}}>{notice}</p>}
  </div>
 </div>
}

export function ParliamentTeamTrainingPreview({profile,academic,form}){
 const values=form?.values||{}
 const attachments=form?.attachments||[]
 const number=Number(values.meeting_number)||1
 const meetingLabel=values['اللقاء']||`اللقاء ${ordinal[number-1]||number}`

 return <div className="official-document" dir="rtl" style={{background:'#fff',color:'#222',padding:28,minHeight:700}}>
  <OfficialDocumentHeader profile={profile}/>
  <div className="official-doc-heading" style={{textAlign:'center',margin:'24px 0'}}>
   <h1>سجل تدريب الفريق البرلماني</h1>
   <h2 style={{fontSize:20,margin:'12px 0'}}>نموذج {meetingLabel}</h2>
   <p>للعام الدراسي {academic?.yearName||'................'} — الفصل الدراسي {academic?.semesterName||'................'}</p>
  </div>
  <table className="official-doc-table" style={{width:'100%',borderCollapse:'collapse',marginTop:20}}>
   <tbody>
    <tr><th style={cellStyle}>اللقاء</th><td style={cellStyle}>{meetingLabel}</td></tr>
    {fields.map(field=><tr key={field}>
     <th style={{...cellStyle,width:'27%',background:'#f5f1e9'}}>{field}</th>
     <td style={{...cellStyle,whiteSpace:'pre-wrap',lineHeight:1.9,minHeight:65}}>{values[field]||'—'}</td>
    </tr>)}
    <tr><th style={cellStyle}>المرفقات</th><td style={cellStyle}>{attachments.length?attachments.map((file,i)=><div key={i}>{i+1}. {file.file_name||'ملف مرفق'}</div>):'لا توجد مرفقات'}</td></tr>
   </tbody>
  </table>
  <div style={{display:'flex',justifyContent:'space-between',gap:30,marginTop:65,textAlign:'center',breakInside:'avoid'}}>
 <div style={{flex:1}}>
  <strong>اسم وتوقيع المرشد/ة التربوي/ة</strong>
  <div style={{marginTop:14}}>{values.counselor_name||profile?.full_name||'........................'}</div>

 </div>
 <div style={{flex:1}}>
  <strong>اسم وتوقيع مدير المدرسة</strong>
  <div style={{marginTop:14}}>{values.manager_name||profile?.manager_name||'........................'}</div>

 </div>
</div>
 </div>
}

const cellStyle={border:'1px solid #555',padding:'12px 10px',textAlign:'right',verticalAlign:'top'}
