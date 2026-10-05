import React,{useEffect,useMemo,useState}from'react'
import{ShieldCheck,Save,RefreshCw,CheckSquare}from'lucide-react'
import{Page,Card,Button,Select,ErrorNotice}from'../components/UI'
import{currentProfile,listPermissionEmployees,getPermissionCatalog,getEmployeePermissions,saveEmployeePermissions}from'../services/data'

const roleLabels={PROGRAMMER:'مبرمج النظام',MINISTRY:'مسؤول الإرشاد',DIRECTORATE:'رئيس القسم',PRINCIPAL:'المشرف التربوي',COUNSELOR:'المرشد التربوي'}
export default function Permissions(){
 const[profile,setProfile]=useState(null),[employees,setEmployees]=useState([]),[catalog,setCatalog]=useState([]),[role,setRole]=useState(''),[employeeId,setEmployeeId]=useState(''),[selected,setSelected]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=async()=>{setLoading(true);setError('');try{const p=await currentProfile();setProfile(p);if(!['PROGRAMMER','MINISTRY','DIRECTORATE'].includes(p?.role))throw new Error('هذه الشاشة مخصصة لإدارة الصلاحيات لمسؤول الإرشاد ورئيس القسم.');const[c,e]=await Promise.all([getPermissionCatalog(),listPermissionEmployees(p)]);setCatalog(c);setEmployees(e);const first=e[0];if(first){setEmployeeId(first.id);setRole(first.role);setSelected(await getEmployeePermissions(first.id))}else{setEmployeeId('');setRole('');setSelected([])}}catch(e){setError(e.message||'تعذر تحميل الصلاحيات.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const roles=useMemo(()=>[...new Map(employees.map(e=>[e.role,e])).keys()], [employees])
 const filtered=useMemo(()=>role?employees.filter(e=>e.role===role):employees,[employees,role])
 const changeRole=async v=>{setRole(v);const e=employees.find(x=>x.role===v);if(e){setEmployeeId(e.id);setSelected(await getEmployeePermissions(e.id))}else{setEmployeeId('');setSelected([])}}
 const changeEmployee=async v=>{setEmployeeId(v);const e=employees.find(x=>x.id===v);setRole(e?.role||'');setSelected(v?await getEmployeePermissions(v):[])}
 const toggle=k=>setSelected(s=>s.includes(k)?s.filter(x=>x!==k):[...s,k])
 const save=async()=>{if(!employeeId){setError('اختر الموظف أولاً.');return}setSaving(true);setError('');setNotice('');try{await saveEmployeePermissions(employeeId,selected);setNotice('تم حفظ صلاحيات الموظف بنجاح. ستظهر له الشاشات المحددة فقط.')}catch(e){setError(e.message||'تعذر حفظ الصلاحيات.')}finally{setSaving(false)}}
 if(loading)return <Page title="الصلاحيات"><Card><div className="loading">جارٍ تحميل الصلاحيات...</div></Card></Page>
 return <Page title="صلاحيات الموظفين" sub="تحديد الشاشات والوظائف التي تظهر لكل موظف" actions={<div className="permission-actions"><Button variant="secondary" onClick={load}><RefreshCw size={16}/> تحديث</Button><Button loading={saving} onClick={save}><Save size={16}/> حفظ</Button></div>}>
  {error&&<ErrorNotice>{error}</ErrorNotice>}{notice&&<div className="notice">{notice}</div>}
  <Card className="permissions-toolbar"><div className="form-grid two"><Select label="اسم الوظيفة" value={role} onChange={e=>changeRole(e.target.value)}><option value="">اختر الوظيفة</option>{roles.map(r=><option key={r} value={r}>{roleLabels[r]||r}</option>)}</Select><Select label="الموظف" value={employeeId} onChange={e=>changeEmployee(e.target.value)}><option value="">اختر الموظف</option>{filtered.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.username||'بدون اسم مستخدم'}</option>)}</Select></div></Card>
  <Card><div className="section-title"><div><h2><CheckSquare size={18}/> شاشات النظام</h2><span>حدد الشاشات التي تريد إظهارها للموظف المحدد.</span></div><span className="badge"><ShieldCheck size={13}/> {selected.length} محددة</span></div><div className="permission-grid">{catalog.map(item=><label className={'permission-card '+(selected.includes(item.key)?'checked':'')} key={item.key}><input type="checkbox" checked={selected.includes(item.key)} onChange={()=>toggle(item.key)}/><span><strong>{item.label}</strong><small>{item.section}</small></span></label>)}</div></Card>
 </Page>
}
