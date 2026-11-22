import React,{useEffect,useState}from'react'
import{Select}from'./UI'
import{currentProfile,listSchoolLessonSchedules}from'../services/data'

export default function LessonTimeSelect({value,onChange,disabled=false,label='الحصة / وقت اللقاء'}){
 const[schedules,setSchedules]=useState([])
 useEffect(()=>{let alive=true;(async()=>{try{const p=await currentProfile();const rows=await listSchoolLessonSchedules(p?.school_id);if(alive)setSchedules(rows||[])}catch{if(alive)setSchedules([])}})();return()=>{alive=false}},[])
 return <Select label={label} value={value||''} disabled={disabled} onChange={e=>onChange(e.target.value)}>
  <option value="">اختر الحصة لتعبئة الوقت</option>
  {schedules.map(item=><option key={item.id} value={String(item.start_time||'').slice(0,5)}>{item.period_name} — {String(item.start_time||'').slice(0,5)}</option>)}
 </Select>
}
