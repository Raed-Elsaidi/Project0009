import React,{useEffect,useMemo,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Page,Card,Button,ErrorNotice,Input} from '../components/UI'
import {currentProfile,requireSemesterReportClient} from '../services/data'
import GroupCounselingEntry from './GroupCounselingEntry'
import {Plus,Users,UserPlus,Trash2,RefreshCw,Palette,Search,Eye} from 'lucide-react'
import '../styles/group-guidance-theme.css'

const studentFirstLast=name=>{const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return parts.length>1?`${parts[0]} ${parts[parts.length-1]}`:(parts[0]||'—')}

const COLORS=['#0f766e','#2563eb','#9333ea','#c2410c','#be123c','#4d7c0f','#a16207','#475569','#0e7490','#7c3aed']

function GroupMembersManager(){
 const navigate=useNavigate()
 const [profile,setProfile]=useState(null),[groups,setGroups]=useState([]),[members,setMembers]=useState([]),[students,setStudents]=useState([])
 const [selectedGroup,setSelectedGroup]=useState(''),[newName,setNewName]=useState(''),[search,setSearch]=useState(''),[selectedStudents,setSelectedStudents]=useState([])
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const db=requireSemesterReportClient
 const load=async()=>{
  setError('');const p=profile||await currentProfile();if(!p?.school_id)throw new Error('حساب المرشد غير مرتبط بمدرسة.')
  setProfile(p);const client=db()
  const [g,m,s]=await Promise.all([
   client.from('group_counseling_groups').select('id,name,color,school_id,counselor_id,created_at').eq('school_id',p.school_id).eq('counselor_id',p.id).order('created_at',{ascending:true}),
   client.from('group_counseling_members').select('group_id,student_id'),
   client.from('students').select('id,full_name,grade_id,section_id,grades(name),sections(name)').eq('school_id',p.school_id).eq('is_active',true).order('full_name')
  ])
  if(g.error)throw g.error;if(m.error)throw m.error;if(s.error)throw s.error
  const nextGroups=g.data||[];setGroups(nextGroups);setMembers(m.data||[]);setStudents(s.data||[])
  if(!nextGroups.some(x=>x.id===selectedGroup))setSelectedGroup(nextGroups[0]?.id||'')
 }
 useEffect(()=>{let alive=true;(async()=>{try{await load()}catch(e){if(alive)setError(e.message||'تعذر تحميل المجموعات الإرشادية.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[])
 const activeGroup=groups.find(g=>g.id===selectedGroup)
 const groupMembers=useMemo(()=>{const ids=new Set(members.filter(m=>m.group_id===selectedGroup).map(m=>m.student_id));return students.filter(s=>ids.has(s.id))},[members,students,selectedGroup])
 const memberIds=new Set(groupMembers.map(s=>s.id))
 const filteredStudents=students.filter(s=>!memberIds.has(s.id)&&`${s.full_name||''} ${s.grades?.name||''} ${s.sections?.name||''}`.toLowerCase().includes(search.toLowerCase()))
 const createGroup=async()=>{
  if(!newName.trim())return setError('اكتب اسم المجموعة أولًا.')
  setSaving(true);setError('');setNotice('')
  try{
   const client=db();const color=COLORS[groups.length%COLORS.length]
   const {data,error:e}=await client.from('group_counseling_groups').insert({
    counselor_id:profile.id,school_id:profile.school_id,name:newName.trim(),color,
    problem:'',member_count:0,target_group:'',grade_id:null,section_id:null,objectives:'',recommendations:''
   }).select('id,name,color,school_id,counselor_id,created_at').single()
   if(e)throw e;setGroups(prev=>[...prev,data]);setSelectedGroup(data.id);setNewName('');setNotice('تم إنشاء المجموعة بنجاح.')
  }catch(e){setError(e.message||'تعذر إنشاء المجموعة.')}finally{setSaving(false)}
 }
 const addMembers=async()=>{
  if(!selectedGroup)return setError('اختر مجموعة أولًا.')
  if(!selectedStudents.length)return setError('حدد طالبًا واحدًا على الأقل.')
  setSaving(true);setError('');setNotice('')
  try{
   const rows=selectedStudents.map(student_id=>({group_id:selectedGroup,student_id}))
   const {error:e}=await db().from('group_counseling_members').upsert(rows,{onConflict:'group_id,student_id',ignoreDuplicates:true})
   if(e)throw e;setSelectedStudents([]);await load();setNotice('تمت إضافة الطلاب إلى المجموعة.')
  }catch(e){setError(e.message||'تعذرت إضافة الطلاب.')}finally{setSaving(false)}
 }
 const removeMember=async(studentId)=>{
  if(!window.confirm('هل تريد إزالة هذا الطالب من المجموعة؟'))return
  setSaving(true);setError('');setNotice('')
  try{const {error:e}=await db().from('group_counseling_members').delete().eq('group_id',selectedGroup).eq('student_id',studentId);if(e)throw e;await load();setNotice('تمت إزالة الطالب من المجموعة.')}catch(e){setError(e.message||'تعذرت إزالة الطالب.')}finally{setSaving(false)}
 }
 const renameGroup=async()=>{
  const value=window.prompt('اكتب اسم المجموعة الجديد:',activeGroup?.name||'')
  if(value===null||!value.trim())return
  setSaving(true);setError('')
  try{const {error:e}=await db().from('group_counseling_groups').update({name:value.trim()}).eq('id',selectedGroup);if(e)throw e;await load();setNotice('تم تعديل اسم المجموعة.')}catch(e){setError(e.message||'تعذر تعديل اسم المجموعة.')}finally{setSaving(false)}
 }
 const deleteGroup=async()=>{
  if(!activeGroup||!window.confirm(`حذف المجموعة «${activeGroup.name}» وجميع عضويتها؟`))return
  setSaving(true);setError('')
  try{const {error:e}=await db().from('group_counseling_groups').delete().eq('id',selectedGroup);if(e)throw e;setSelectedGroup('');await load();setNotice('تم حذف المجموعة.')}catch(e){setError(e.message||'تعذر حذف المجموعة.')}finally{setSaving(false)}
 }
 return <div className="group-guidance-theme"><Page title="أسماء طلاب المجموعة الإرشادية" sub="إنشاء المجموعات الإرشادية وإضافة طلاب المدرسة إليها وإدارة عضويتها.">
  <div className="group-guidance-top-actions"><Button variant="secondary" onClick={()=>navigate('/official-forms/group-counseling-plan')}><Eye size={16}/> عرض النموذج الرسمي</Button></div>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div style={{background:'#e8f5ef',color:'#17634f',padding:12,borderRadius:10,marginBottom:12}}>{notice}</div>}
  {loading?<Card><div className="loading">جارٍ تحميل المجموعات والطلاب...</div></Card>:<>
   <Card>
    <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}>
     <div style={{flex:'1 1 220px'}}><Input label="اسم المجموعة الجديدة" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="مثال: مجموعة تعزيز الثقة بالنفس"/></div>
     <Button onClick={createGroup} loading={saving}><Plus size={17}/> إنشاء مجموعة</Button>
     <Button variant="secondary" onClick={()=>load()}><RefreshCw size={16}/> تحديث</Button>
    </div>
   </Card>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginBottom:16}}>
    {groups.map(g=>{const count=members.filter(m=>m.group_id===g.id).length;return <button key={g.id} type="button" onClick={()=>{setSelectedGroup(g.id);setSelectedStudents([])}} style={{textAlign:'right',border:selectedGroup===g.id?`2px solid ${g.color||'#0f766e'}`:'1px solid #e5e0d7',borderRadius:14,padding:15,background:'#fff',cursor:'pointer',boxShadow:selectedGroup===g.id?'0 5px 18px #0000000d':'none'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><strong style={{color:g.color||'#0f766e',fontSize:17}}>{g.name}</strong><span style={{width:14,height:14,borderRadius:99,background:g.color||'#0f766e'}}/></div><div style={{display:'flex',gap:7,alignItems:'center',marginTop:12,color:'#6b7280',fontSize:13}}><Users size={16}/>{count} طالبًا</div></button>})}
    {!groups.length&&<Card><div style={{textAlign:'center',padding:20,color:'#777'}}>لم تُنشأ مجموعات بعد. اكتب اسم المجموعة واضغط «إنشاء مجموعة».</div></Card>}
   </div>
   {activeGroup&&<>
    <Card>
     <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
      <div><h2 style={{margin:'0 0 5px',color:activeGroup.color||'#0f766e'}}>{activeGroup.name}</h2><span style={{color:'#777',fontSize:13}}>عدد أعضاء المجموعة: {groupMembers.length}</span></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button variant="secondary" onClick={renameGroup}>تعديل الاسم</Button><Button variant="secondary" onClick={deleteGroup}><Trash2 size={15}/> حذف المجموعة</Button></div>
     </div>
     <h3 style={{margin:'12px 0'}}>أعضاء المجموعة</h3>
     {groupMembers.length?<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{background:'#f7f5f0'}}>{['اسم الطالب','الصف','الشعبة','إجراء'].map(x=><th key={x} style={{padding:10,textAlign:'right'}}>{x}</th>)}</tr></thead><tbody>{groupMembers.map(s=><tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:10}}>{studentFirstLast(s.full_name)}</td><td style={{padding:10}}>{s.grades?.name||'—'}</td><td style={{padding:10}}>{s.sections?.name||'—'}</td><td style={{padding:10}}><Button variant="secondary" onClick={()=>removeMember(s.id)} disabled={saving}><Trash2 size={15}/> إزالة</Button></td></tr>)}</tbody></table></div>:<div style={{padding:18,textAlign:'center',color:'#777'}}>لم تتم إضافة طلاب لهذه المجموعة بعد.</div>}
    </Card>
    <Card>
     <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}}><div><h3 style={{margin:'0 0 5px'}}>إضافة طلاب للمجموعة</h3><span style={{fontSize:13,color:'#777'}}>يمكن تحديد طالب واحد أو عدة طلاب دفعة واحدة.</span></div><strong>{selectedStudents.length} محدد</strong></div>
     <Input label="بحث باسم الطالب أو الصف أو الشعبة" value={search} onChange={e=>setSearch(e.target.value)} placeholder="اكتب اسم الطالب للبحث"/>
     <div style={{maxHeight:330,overflowY:'auto',margin:'12px 0',border:'1px solid #eee',borderRadius:10}}>
      {filteredStudents.map(s=><label key={s.id} style={{display:'flex',gap:10,alignItems:'center',padding:10,borderBottom:'1px solid #f0eee9',cursor:'pointer'}}><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={e=>setSelectedStudents(prev=>e.target.checked?[...prev,s.id]:prev.filter(id=>id!==s.id))}/><span style={{flex:1}}><strong>{studentFirstLast(s.full_name)}</strong><small style={{display:'block',color:'#777',marginTop:3}}>الصف: {s.grades?.name||'—'} · الشعبة: {s.sections?.name||'—'}</small></span></label>)}
      {!filteredStudents.length&&<div style={{padding:18,textAlign:'center',color:'#777'}}>لا يوجد طلاب متاحون للإضافة وفق البحث الحالي.</div>}
     </div>
     <Button onClick={addMembers} loading={saving} disabled={!selectedStudents.length}><UserPlus size={17}/> إضافة المحددين إلى المجموعة</Button>
    </Card>
   </>}
  </>}
 </Page></div>
}

export default function GroupCounseling(){
 const params=new URLSearchParams(window.location.search)
 const isLegacy=['record_id','weekly_item_id','weekly_program_id'].some(k=>params.has(k))
 if(isLegacy)return <GroupCounselingEntry/>
 return <GroupMembersManager/>
}
