import React,{useEffect,useMemo,useState} from 'react'
import {Page,Card,Button,ErrorNotice,Input,Select} from '../UI'
import {currentProfile,listActiveAcademicData,requireSemesterReportClient} from '../../services/data'
import {listOfficialFormRecords,saveOfficialFormRecord} from '../../services/officialFormsApi'
import {Save,RefreshCw,Eye,Printer,X} from 'lucide-react'
import OfficialDocumentHeader from './OfficialDocumentHeader'
import '../../styles/group-guidance-theme.css'

const studentFirstLast=name=>{const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return parts.length>1?`${parts[0]} ${parts[parts.length-1]}`:(parts[0]||'—')}

const palette=['#0f766e','#2563eb','#9333ea','#c2410c','#be123c','#4d7c0f','#a16207','#475569']
const yearLabel=y=>y?.name||'السنة الدراسية'
const semLabel=s=>s?.name||s?.type||'الفصل'

export default function GroupAssessment(){
 const [profile,setProfile]=useState(null),[academic,setAcademic]=useState({years:[],semesters:[]})
 const [groups,setGroups]=useState([]),[members,setMembers]=useState([]),[students,setStudents]=useState([])
 const [yearId,setYearId]=useState(''),[semesterId,setSemesterId]=useState(''),[groupId,setGroupId]=useState('')
 const [tab,setTab]=useState('pre'),[questionCount,setQuestionCount]=useState(10),[answers,setAnswers]=useState({pre:{},post:{}})
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[showPreview,setShowPreview]=useState(false)
 const db=requireSemesterReportClient
 useEffect(()=>{(async()=>{try{
  const [p,a]=await Promise.all([currentProfile(),listActiveAcademicData()]);setProfile(p);setAcademic(a||{years:[],semesters:[]})
  const y=(a?.years||[]).find(x=>x.is_active)||(a?.years||[])[0];const sem=(a?.semesters||[]).find(x=>x.school_year_id===y?.id)
  setYearId(y?.id||'');setSemesterId(sem?.id||'')
  if(!p?.school_id)throw new Error('حساب المرشد غير مرتبط بمدرسة.')
  const client=db()
  const [g,m,s]=await Promise.all([
   client.from('group_counseling_groups').select('id,name,color').eq('school_id',p.school_id).order('name'),
   client.from('group_counseling_members').select('group_id,student_id'),
   client.from('students').select('id,full_name,grade_id,section_id,grades(name),sections(name)').eq('school_id',p.school_id).eq('is_active',true).order('full_name')
  ])
  if(g.error)throw g.error;if(m.error)throw m.error;if(s.error)throw s.error
  setGroups(g.data||[]);setMembers(m.data||[]);setStudents(s.data||[]);if(g.data?.[0])setGroupId(g.data[0].id)
 }catch(e){setError(e.message||'تعذر تحميل بيانات الاستبيان.')}finally{setLoading(false)}})()},[])
 useEffect(()=>{if(!profile?.id||!yearId)return;let alive=true;(async()=>{try{const rows=await listOfficialFormRecords(['group-session-details'],yearId,semesterId);const saved=rows.find(x=>x.form_id==='group-session-details')?.form_data;if(alive&&saved){setAnswers(saved.answers||{pre:{},post:{}});setQuestionCount(saved.questionCount||10)}}catch(e){if(alive)setError(e.message||'تعذر تحميل الاستبيانات المحفوظة.')}})();return()=>{alive=false}},[profile?.id,yearId,semesterId])
 const group=groups.find(g=>g.id===groupId)
 const groupStudents=useMemo(()=>{const ids=new Set(members.filter(m=>m.group_id===groupId).map(m=>m.student_id));return students.filter(s=>ids.has(s.id))},[members,students,groupId])
 const qCount=Math.max(1,Math.min(100,Number(questionCount)||1))
 const updateCell=(studentId,q,value)=>setAnswers(prev=>({...prev,[tab]:{...(prev[tab]||{}),[groupId]:{...(prev[tab]?.[groupId]||{}),[studentId]:{...(prev[tab]?.[groupId]?.[studentId]||{}),[q]:value}}}}))
 const save=async()=>{if(!profile)return;setSaving(true);setError('');setNotice('');try{await saveOfficialFormRecord({formId:'group-session-details',profile,form:{school_year_id:yearId,semester_id:semesterId,questionCount:qCount,answers}});setNotice('تم حفظ بيانات الاستبيان بنجاح.')}catch(e){setError(e.message||'تعذر حفظ الاستبيان.')}finally{setSaving(false)}}
 return <div className="group-guidance-theme group-assessment-theme">
  <div className="group-guidance-top-actions"><Button variant="secondary" onClick={()=>setShowPreview(v=>!v)}><Eye size={16}/> {showPreview?'إخفاء النموذج الرسمي':'عرض النموذج الرسمي'}</Button></div>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div style={{background:'#e7f4ef',color:'#075b57',padding:12,borderRadius:12,marginBottom:12}}>{notice}</div>}
  {loading?<Card><div className="loading">جارٍ تحميل المجموعات والطلاب...</div></Card>:<>
   <Card>
    <div className="form-grid two">
     <Select label="السنة الدراسية" value={yearId} onChange={e=>setYearId(e.target.value)}><option value="">اختر السنة</option>{academic.years.map(y=><option key={y.id} value={y.id}>{yearLabel(y)}</option>)}</Select>
     <Select label="الفصل الدراسي" value={semesterId} onChange={e=>setSemesterId(e.target.value)}><option value="">اختر الفصل</option>{academic.semesters.filter(s=>!yearId||s.school_year_id===yearId).map(s=><option key={s.id} value={s.id}>{semLabel(s)}</option>)}</Select>
     <Select label="المجموعة الإرشادية" value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">اختر المجموعة</option>{groups.map((g,i)=><option key={g.id} value={g.id}>{g.name}</option>)}</Select>
     <Input label="عدد الأسئلة" type="number" min="1" max="100" value={questionCount} onChange={e=>setQuestionCount(e.target.value)}/>
    </div>
    {!groups.length&&<p style={{color:'#9a5b25',marginTop:12}}>لا توجد مجموعات إرشادية مسجلة لهذه المدرسة. أنشئ مجموعة وأضف أعضاءها أولًا.</p>}
   </Card>
   <Card>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
     <Button variant={tab==='pre'?'primary':'secondary'} onClick={()=>setTab('pre')}>الاستبيان القبلي</Button>
     <Button variant={tab==='post'?'primary':'secondary'} onClick={()=>setTab('post')}>الاستبيان البعدي</Button>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}}>
     <div><strong>{tab==='pre'?'الاستبيان القبلي':'الاستبيان البعدي'}</strong><div style={{color:'#777',fontSize:13}}>المجموعة: {group?.name||'—'} · عدد الطلاب: {groupStudents.length}</div></div>
     <Button onClick={save} loading={saving}><Save size={16}/> حفظ الاستبيان</Button>
    </div>
    {groupId&&groupStudents.length>0?<div style={{overflowX:'auto',border:'1px solid #ded6c8',borderRadius:12}}><table style={{borderCollapse:'separate',borderSpacing:0,width:'100%',minWidth:Math.max(660,190+qCount*42)}}><colgroup><col style={{width:190}}/>{Array.from({length:qCount},(_,i)=><col key={i} style={{width:42}}/>)}</colgroup><thead><tr><th style={{position:'sticky',right:0,zIndex:2,background:group?.color||'#0f766e',color:'#fff',padding:10,minWidth:190,width:190}}>اسم الطالب</th>{Array.from({length:qCount},(_,i)=><th key={i} style={{background:group?.color||'#0f766e',color:'#fff',padding:6,minWidth:38,width:42}}>{i+1}</th>)}</tr></thead><tbody>{groupStudents.map((s,i)=><tr key={s.id}><td style={{position:'sticky',right:0,background:'#fffdf8',borderBottom:'1px solid #eee',padding:9,fontWeight:600,minWidth:190,width:190}}>{studentFirstLast(s.full_name)}</td>{Array.from({length:qCount},(_,q)=><td key={q} style={{borderBottom:'1px solid #eee',padding:3}}><input aria-label={`${studentFirstLast(s.full_name)} السؤال ${q+1}`} value={answers[tab]?.[groupId]?.[s.id]?.[q+1]??''} onChange={e=>updateCell(s.id,q+1,e.target.value)} style={{width:'100%',minWidth:34,border:'1px solid #d8d0c2',borderRadius:8,padding:'9px 6px',textAlign:'center',background:'#fff'}}/></td>)}</tr>)}</tbody></table></div>:<div style={{textAlign:'center',padding:28,color:'#777'}}>{groupId?'لا يوجد طلاب مضافون لهذه المجموعة بعد.':'اختر مجموعة لعرض أسمائها.'}</div>}
   </Card>
   {showPreview&&<div className="group-guidance-official-preview"><div className="group-guidance-preview-actions"><Button variant="secondary" onClick={()=>window.print()}><Printer size={16}/> طباعة / PDF</Button><Button variant="secondary" onClick={()=>setShowPreview(false)}><X size={16}/> إغلاق</Button></div><div className="group-guidance-paper"><OfficialDocumentHeader profile={profile}/><h2>{tab==='pre'?'الاستبيان القبلي':'الاستبيان البعدي'}</h2><p>السنة الدراسية: {academic.years.find(y=>y.id===yearId)?.name||'—'} · المجموعة: {group?.name||'—'}</p><table className="group-assessment-preview-table"><colgroup><col style={{width:'28%'}}/>{Array.from({length:qCount},(_,i)=><col key={i} style={{width:`${72/qCount}%`}}/>)}</colgroup><thead><tr><th>اسم الطالب</th>{Array.from({length:qCount},(_,i)=><th key={i}>{i+1}</th>)}</tr></thead><tbody>{groupStudents.map(st=><tr key={st.id}><td>{studentFirstLast(st.full_name)}</td>{Array.from({length:qCount},(_,i)=><td key={i}>{answers[tab]?.[groupId]?.[st.id]?.[i+1]||' '}</td>)}</tr>)}</tbody></table></div></div>}
  </>}
 </div>
}
