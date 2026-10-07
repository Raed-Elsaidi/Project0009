import React,{useEffect,useState}from'react'
import{Page,Card,Button,ErrorNotice,Input}from'../components/UI'
import{currentProfile,directorateStats}from'../services/data'
import{Building2,UsersRound,School,FileText,AlertTriangle,Activity,RefreshCw,Search}from'lucide-react'

export default function DirectorateDashboard(){
 const[profile,setProfile]=useState(null),[data,setData]=useState({summary:{schools:0,counselors:0,students:0,cases:0,hotCases:0,activities:0},counselors:[]}),[error,setError]=useState(''),[loading,setLoading]=useState(true),[search,setSearch]=useState('')
 const load=async()=>{setLoading(true);setError('');try{const[p,d]=await Promise.all([currentProfile(),directorateStats()]);setProfile(p);setData(d)}catch(e){setError(e.message||'تعذر تحميل إحصائيات الدائرة.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const roleLabel=profile?.role==='MINISTRY'?'مسؤول الإرشاد':profile?.role==='DIRECTORATE'?'رئيس القسم':'المشرف التربوي';
 const scopeLabel=profile?.role==='MINISTRY'?'جميع المرشدين التربويين ضمن نطاق الوزارة':profile?.role==='DIRECTORATE'?'جميع المرشدين التربويين ضمن المديرية':'المرشدون التربويون المسؤول عن متابعتهم';
 const rows=data.counselors.filter(x=>`${x.full_name} ${x.school_name||''}`.toLowerCase().includes(search.toLowerCase()))
 return <Page title={`لوحة ${roleLabel}${profile?.directorates?.name?` • ${profile.directorates.name}`:''}`} sub={scopeLabel} actions={<Button variant="secondary" onClick={load}><RefreshCw size={16}/> تحديث</Button>}>
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  <div className="directorate-welcome"><div><span>مرحبًا بك</span><h2>لوحة الإحصائيات الإدارية</h2><p>يمكنك متابعة المؤشرات حسب اسم كل مرشد ومدرسته.</p></div><div className="directorate-seal"><Building2 size={30}/></div></div>
  <div className="grid stats-grid directorate-stats">
   {[[School,'المدارس',data.summary.schools],[UsersRound,'المرشدون',data.summary.counselors],[UsersRound,'الطلاب',data.summary.students],[FileText,'دراسات الحالات',data.summary.cases],[AlertTriangle,'الحالات الساخنة',data.summary.hotCases],[Activity,'الأنشطة',data.summary.activities]].map(([I,label,value])=><Card className="stat-card" key={label}><div className="stat-icon"><I size={19}/></div><span className="stat-label">{label}</span><div className="stat">{value}</div></Card>)}
  </div>
  <Card style={{marginTop:16}}><div className="section-title"><div><h2>إحصائيات حسب اسم المرشد</h2><span>البيانات الخاصة بالمرشدين ضمن نطاق مسؤوليتك</span></div></div>
   <div className="searchbar"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم المرشد أو المدرسة..."/></div>
   {loading?<div className="loading">جارٍ تحميل الإحصائيات…</div>:rows.length===0?<div className="empty"><strong>لا توجد بيانات مطابقة</strong><span>تأكد من إضافة المرشدين وربطهم بالمدارس التابعة للدائرة.</span></div>:<div className="table-wrap"><table className="table counselor-stats-table"><thead><tr><th>المرشد التربوي</th><th>المدرسة</th><th>الطلاب</th><th>دراسات الحالات</th><th>الحالات الساخنة</th><th>الأنشطة</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>{r.full_name}</strong><div className="table-sub">{r.job_title||'مرشد تربوي'}</div></td><td>{r.school_name||'—'}</td><td><span className="number-pill">{r.students}</span></td><td><span className="number-pill">{r.cases}</span></td><td><span className="number-pill warning-pill">{r.hot_cases}</span></td><td><span className="number-pill">{r.activities}</span></td></tr>)}</tbody></table></div>}
  </Card>
 </Page>
}

