import React,{useEffect,useState} from 'react'
import {Button,ErrorNotice} from '../UI'
import {currentProfile,requireSemesterReportClient} from '../../services/data'
import {listOfficialFormRecords,saveOfficialFormRecord} from '../../services/officialFormsApi'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import {Plus,Trash2,Save,Eye,Printer,X} from 'lucide-react'
import '../../styles/group-guidance-theme.css'

const blankRow=()=>({topic:'',objectives:'',activities:'',notes:''})
export default function GroupCounselingPlan({formId='group-session-summary'}){
 const [profile,setProfile]=useState(null),[groupCount,setGroupCount]=useState(0),[studentCount,setStudentCount]=useState(0)
 const [sessionCount,setSessionCount]=useState(''),[startDate,setStartDate]=useState(''),[endDate,setEndDate]=useState(''),[rows,setRows]=useState([blankRow()])
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[showPreview,setShowPreview]=useState(false)
 useEffect(()=>{let alive=true;(async()=>{try{
  const p=await currentProfile();if(!alive)return;setProfile(p);if(!p?.school_id)throw new Error('حساب المرشد غير مرتبط بمدرسة.')
  const client=requireSemesterReportClient()
  const [g,m]=await Promise.all([
   client.from('group_counseling_groups').select('id').eq('school_id',p.school_id),
   client.from('group_counseling_members').select('student_id,group_id')
  ])
  if(g.error)throw g.error;if(m.error)throw m.error
  const groupIds=new Set((g.data||[]).map(x=>x.id));const memberIds=new Set((m.data||[]).filter(x=>groupIds.has(x.group_id)).map(x=>x.student_id))
  setGroupCount(groupIds.size);setStudentCount(memberIds.size)
  const saved=await listOfficialFormRecords([formId])
  const data=saved.find(x=>x.form_id===formId)?.form_data
  if(data){setSessionCount(data.sessionCount??'');setStartDate(data.startDate||'');setEndDate(data.endDate||'');setRows(data.rows?.length?data.rows:[blankRow()])}
 }catch(e){if(alive)setError(e.message||'تعذر تحميل نموذج الإرشاد الجماعي.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[])
 const change=(i,key,value)=>setRows(prev=>prev.map((r,n)=>n===i?{...r,[key]:value}:r))
 const save=async()=>{if(!profile)return;setSaving(true);setError('');setNotice('');try{await saveOfficialFormRecord({formId,profile,form:{sessionCount,startDate,endDate,rows}});setNotice('تم حفظ نموذج الإرشاد الجماعي بنجاح.')}catch(e){setError(e.message||'تعذر حفظ النموذج.')}finally{setSaving(false)}}
 return <div dir="rtl" className="group-counseling-plan group-guidance-theme">
  <div className="group-guidance-top-actions"><Button variant="secondary" onClick={()=>setShowPreview(v=>!v)}><Eye size={16}/> {showPreview?'إخفاء النموذج الرسمي':'عرض النموذج الرسمي'}</Button></div>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div style={{padding:12,marginBottom:12,borderRadius:10,background:'#e8f5ef',color:'#17634f'}}>{notice}</div>}
  {loading?<div className="loading">جارٍ تحميل بيانات المجموعات...</div>:<>
   <div className="official-entry-card" style={{background:'#fff',padding:18,border:'1px solid #ddd',borderRadius:12}}>
    <OfficialDocumentHeader/>
    <h2 style={{textAlign:'center',margin:'22px 0 18px',fontSize:21}}>نموذج الإرشاد الجماعي</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12,marginBottom:20}}>
     <label className="field"><span>عدد المجموعات</span><input readOnly value={groupCount} /></label>
     <label className="field"><span>عدد الطلاب</span><input readOnly value={studentCount} /></label>
     <label className="field"><span>عدد الجلسات</span><input type="number" min="0" value={sessionCount} onChange={e=>setSessionCount(e.target.value)} placeholder="أدخل العدد" /></label>
     <label className="field"><span>تاريخ البدء</span><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></label>
     <label className="field"><span>تاريخ الانتهاء</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></label>
    </div>
    <div style={{overflowX:'auto'}}><table className="official-entry-table" style={{width:'100%',minWidth:760,borderCollapse:'collapse',border:'1px solid #222',background:'#fff'}}><thead><tr>{['اللقاء أو الموضوع','الأهداف','الإجراءات / الأنشطة','الملاحظات'].map(x=><th key={x} style={{padding:12,textAlign:'center',border:'1px solid #222',background:'#f4e6bf',fontWeight:700}}>{x}</th>)}<th style={{width:54}}> </th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{['topic','objectives','activities','notes'].map((k,j)=><td key={k} style={{padding:6,verticalAlign:'top',border:'1px solid #222'}}><textarea aria-label={['اللقاء أو الموضوع','الأهداف','الإجراءات والأنشطة','الملاحظات'][j]} value={r[k]} onChange={e=>change(i,k,e.target.value)} rows={4} style={{width:'100%',minWidth:150,minHeight:86,resize:'vertical',border:'0',borderRadius:0,padding:8,fontFamily:'inherit',fontSize:14,lineHeight:1.7,background:'transparent',color:'#202020',outlineColor:'#b28b36'}} /></td>)}<td style={{textAlign:'center',border:'1px solid #222'}}><button type="button" title="حذف الصف" onClick={()=>setRows(prev=>prev.length>1?prev.filter((_,n)=>n!==i):[blankRow()])} style={{border:0,background:'transparent',color:'#b42318',cursor:'pointer'}}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}><Button variant="secondary" onClick={()=>setRows(prev=>[...prev,blankRow()])}><Plus size={16}/> إضافة لقاء</Button><Button onClick={save} loading={saving}><Save size={16}/> حفظ النموذج</Button></div>
   </div>
   {showPreview&&<div className="group-guidance-official-preview"><div className="group-guidance-preview-actions"><Button variant="secondary" onClick={()=>window.print()}><Printer size={16}/> طباعة / PDF</Button><Button variant="secondary" onClick={()=>setShowPreview(false)}><X size={16}/> إغلاق</Button></div><div className="group-guidance-paper"><OfficialDocumentHeader/><h2>نموذج الإرشاد الجماعي</h2><div className="group-guidance-paper-meta"><span>عدد المجموعات: {groupCount}</span><span>عدد الطلاب: {studentCount}</span><span>عدد الجلسات: {sessionCount||'—'}</span><span>تاريخ البدء: {startDate||'—'}</span><span>تاريخ الانتهاء: {endDate||'—'}</span></div><table><thead><tr>{['اللقاء أو الموضوع','الأهداف','الإجراءات / الأنشطة','الملاحظات'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{r.topic||' '}</td><td>{r.objectives||' '}</td><td>{r.activities||' '}</td><td>{r.notes||' '}</td></tr>)}</tbody></table></div></div>}
  </>}
 </div>
}
