import React,{useEffect,useState} from 'react'
import {Building2,Plus,RefreshCw,Edit3,Save,Trash2} from 'lucide-react'
import {Page,Card,Button,Input,Empty,ErrorNotice} from '../components/UI'
import {currentProfile,listOrganization,createDirectorate,updateDirectorate,deleteDirectorate} from '../services/data'

export default function Directorates(){
 const [profile,setProfile]=useState(null),[rows,setRows]=useState([]),[form,setForm]=useState({name:'',code:''}),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=async()=>{try{setError('');const [p,o]=await Promise.all([currentProfile(),listOrganization()]);setProfile(p);setRows(o.directorates||[])}catch(e){setError(e.message||'تعذر تحميل المديريات.')}}
 useEffect(()=>{load()},[])
 const save=async e=>{e.preventDefault();setError('');setNotice('');if(profile?.role!=='MINISTRY'){setError('هذه الشاشة مخصصة لمسؤول الإرشاد.');return}if(!form.name.trim()||!/^[0-9]{2}$/.test(form.code)){setError('اكتب اسم المديرية وكودًا مكونًا من رقمين بالضبط.');return}setBusy(true);try{if(editing)await updateDirectorate(editing,{name:form.name.trim(),code:form.code});else await createDirectorate({name:form.name.trim(),code:form.code});setForm({name:'',code:''});setEditing(null);setNotice(editing?'تم تعديل بيانات المديرية.':'تمت إضافة المديرية.');await load()}catch(e){setError(e.message||'تعذر حفظ المديرية.')}finally{setBusy(false)}}
 const edit=r=>{setEditing(r.id);setForm({name:r.name||'',code:r.code||''})}
 const remove=async r=>{if(!confirm(`حذف المديرية «${r.name}»؟`))return;setBusy(true);try{await deleteDirectorate(r.id);await load();setNotice('تم حذف المديرية.')}catch(e){setError(e.message||'لا يمكن حذف المديرية المرتبطة ببيانات.')}finally{setBusy(false)}}
 if(profile&&!['MINISTRY'].includes(profile.role))return <Page title="المديريات"><Card><Empty title="صلاحية غير متاحة" text="إدارة المديريات متاحة لمسؤول الإرشاد فقط."/></Card></Page>
 return <Page title="المديريات" sub="إضافة وإدارة مديريات الإرشاد التربوي وكود المديرية المكون من رقمين" actions={<Button variant="secondary" onClick={load}><RefreshCw size={16}/> تحديث</Button>}>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice">{notice}</div>}
  <div className="org-layout">
   <Card><div className="section-title"><div><h2><Plus size={18}/> {editing?'تعديل مديرية':'إضافة مديرية'}</h2><span>كود المديرية رقمين فقط.</span></div></div><form onSubmit={save}><Input label="اسم المديرية *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: مديرية التربية والتعليم..."/><Input label="كود المديرية *" value={form.code} maxLength={2} inputMode="numeric" onChange={e=>setForm({...form,code:e.target.value.replace(/\D/g,'').slice(0,2)})} placeholder="01"/><div className="row-actions"><Button loading={busy}><Save size={16}/> {editing?'حفظ التعديل':'إضافة المديرية'}</Button>{editing&&<Button variant="secondary" type="button" onClick={()=>{setEditing(null);setForm({name:'',code:''})}}>إلغاء</Button>}</div></form></Card>
   <Card><div className="section-title"><div><h2><Building2 size={18}/> قائمة المديريات</h2><span>{rows.length} مديرية</span></div></div>{rows.length===0?<Empty title="لا توجد مديريات" text="أضف أول مديرية من النموذج."/>:<div className="table-wrap"><table className="table"><thead><tr><th>المديرية</th><th>الكود</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td><span className="code-pill">{r.code||'—'}</span></td><td className="row-actions"><button className="icon-btn" onClick={()=>edit(r)} title="تعديل"><Edit3 size={16}/></button><button className="icon-btn danger" onClick={()=>remove(r)} title="حذف"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}</Card>
  </div>
 </Page>
}
