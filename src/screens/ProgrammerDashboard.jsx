import React,{useEffect,useState}from'react'
import{ShieldCheck,Users,UserPlus,LockKeyhole}from'lucide-react'
import{currentProfile}from'../services/data'
import{Card}from'../components/UI'

export default function ProgrammerDashboard(){
 const[profile,setProfile]=useState(null)
 useEffect(()=>{currentProfile().then(setProfile).catch(()=>{})},[])
 return <div className="page">
   <div className="page-head"><div><span className="eyebrow">الإدارة العليا للنظام</span><h1>لوحة المبرمج</h1><p>هذه الواجهة مخصصة لمبرمج النظام فقط.</p></div><div className="stat-icon"><ShieldCheck size={28}/></div></div>
   <div className="grid-3">
    <Card><div className="stat-card"><div className="stat-icon"><Users size={24}/></div><div><strong>إدارة الحسابات</strong><span>إنشاء ومتابعة حسابات الموظفين</span></div></div></Card>
    <Card><div className="stat-card"><div className="stat-icon"><UserPlus size={24}/></div><div><strong>الوظائف والصلاحيات</strong><span>تحديد وظيفة الحساب عند إنشائه</span></div></div></Card>
    <Card><div className="stat-card"><div className="stat-icon"><LockKeyhole size={24}/></div><div><strong>حالة الحسابات</strong><span>تجميد وإعادة تفعيل الحسابات</span></div></div></Card>
   </div>
   <Card className="section-card"><h3>الحساب الحالي</h3><p><strong>{profile?.full_name||'مبرمج النظام'}</strong> — {profile?.username||'programmer'}</p><div className="notice">حساب المبرمج لا يظهر ضمن قوائم الموظفين العادية.</div></Card>
 </div>
}
