import React,{useEffect,useMemo,useState}from'react'
import{ShieldCheck,Save,RefreshCw,CheckSquare}from'lucide-react'
import{Page,Card,Button,Select,ErrorNotice}from'../components/UI'
import{currentProfile,getPermissionCatalog,getRolePermissions,saveRolePermissions}from'../services/data'

const roleLabels={
  PROGRAMMER:'مبرمج النظام',
  MINISTRY:'مسؤول الإرشاد',
  DIRECTORATE:'رئيس القسم',
  PRINCIPAL:'المشرف/ة التربوي/ة',
  SCHOOL_PRINCIPAL:'مدير المدرسة',
  COUNSELOR:'المرشد التربوي'
}

const availableRoles=[
  'MINISTRY',
  'DIRECTORATE',
  'PRINCIPAL',
  'SCHOOL_PRINCIPAL',
  'COUNSELOR',
  'PROGRAMMER'
]

export default function Permissions(){
  const[profile,setProfile]=useState(null)
  const[catalog,setCatalog]=useState([])
  const[role,setRole]=useState('')
  const[selected,setSelected]=useState([])
  const[configured,setConfigured]=useState(false)
  const[loading,setLoading]=useState(true)
  const[roleLoading,setRoleLoading]=useState(false)
  const[saving,setSaving]=useState(false)
  const[error,setError]=useState('')
  const[notice,setNotice]=useState('')

  const load=async()=>{
    setLoading(true)
    setError('')
    try{
      const p=await currentProfile()
      setProfile(p)
      if(!['PROGRAMMER','MINISTRY'].includes(p?.role)){
        throw new Error('هذه الشاشة مخصصة لإدارة الصلاحيات لمسؤول الإرشاد ومبرمج النظام.')
      }
      const c=await getPermissionCatalog()
      setCatalog(c)
    }catch(e){
      setError(e.message||'تعذر تحميل الصلاحيات.')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{load()},[])

  const changeRole=async value=>{
    setRole(value)
    setSelected([])
    setConfigured(false)
    setError('')
    setNotice('')
    if(!value)return

    setRoleLoading(true)
    try{
      const result=await getRolePermissions(value)
      setSelected(result.keys||[])
      setConfigured(result.isConfigured===true)
    }catch(e){
      setError(e.message||'تعذر تحميل صلاحيات الوظيفة.')
    }finally{
      setRoleLoading(false)
    }
  }

  const toggle=key=>{
    setSelected(old=>old.includes(key)
      ?old.filter(x=>x!==key)
      :[...old,key])
  }

  const save=async()=>{
    if(!role){
      setError('اختر الوظيفة أولاً.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try{
      await saveRolePermissions(role,selected)
      setConfigured(true)
      setNotice('تم حفظ صلاحيات الوظيفة بنجاح. ستُطبق هذه الصلاحيات على جميع الموظفين الذين يحملون هذه الوظيفة.')
    }catch(e){
      setError(e.message||'تعذر حفظ صلاحيات الوظيفة.')
    }finally{
      setSaving(false)
    }
  }

  const groups=useMemo(()=>{
    const result={}
    catalog.forEach(item=>{
      const section=item.section||'بنود أخرى'
      if(!result[section])result[section]=[]
      result[section].push(item)
    })
    return Object.entries(result)
  },[catalog])

  if(loading){
    return <Page title="الصلاحيات"><Card><div className="loading">جارٍ تحميل الصلاحيات...</div></Card></Page>
  }

  return <Page
    title="صلاحيات الوظائف"
    sub="حدد الشاشات والبنود التي تظهر لجميع الموظفين حسب المسمى الوظيفي"
    actions={
      <div className="permission-actions">
        <Button variant="secondary" onClick={load}>
          <RefreshCw size={16}/> تحديث
        </Button>
        <Button loading={saving} onClick={save} disabled={!role||roleLoading}>
          <Save size={16}/> حفظ الصلاحيات
        </Button>
      </div>
    }
  >
    {error&&<ErrorNotice>{error}</ErrorNotice>}
    {notice&&<div className="notice">{notice}</div>}

    <Card className="permissions-toolbar">
      <div className="form-grid">
        <Select
          label="اسم الوظيفة"
          value={role}
          onChange={e=>changeRole(e.target.value)}
        >
          <option value="">اختر الوظيفة</option>
          {availableRoles.map(r=>
            <option key={r} value={r}>{roleLabels[r]}</option>
          )}
        </Select>
      </div>
      {role&&(
        <div className="permission-role-status">
          {roleLoading
            ?'جارٍ تحميل صلاحيات الوظيفة...'
            :configured
              ?'هذه الوظيفة لديها صلاحيات محفوظة.'
              :'لم يتم ضبط صلاحيات هذه الوظيفة بعد. حدد البنود ثم احفظ.'}
        </div>
      )}
    </Card>

    {role&&!roleLoading&&(
      <Card>
        <div className="section-title">
          <div>
            <h2><CheckSquare size={18}/> بنود الصلاحيات</h2>
            <span>التحديد ينطبق على جميع الموظفين الذين يحملون وظيفة {roleLabels[role]}.</span>
          </div>
          <span className="badge">
            <ShieldCheck size={13}/> {selected.length} محددة
          </span>
        </div>

        {groups.map(([section,items])=>(
          <div className="permission-section" key={section}>
            <h3 className="permission-section-title">{section}</h3>
            <div className="permission-grid">
              {items.map(item=>(
                <label
                  className={'permission-card '+(selected.includes(item.key)?'checked':'')}
                  key={item.key}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.key)}
                    onChange={()=>toggle(item.key)}
                  />
                  <span><strong>{item.label}</strong></span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Card>
    )}

    {!role&&(
      <Card>
        <div className="loading">اختر الوظيفة لعرض بنود الصلاحيات الخاصة بها.</div>
      </Card>
    )}
  </Page>
}
