import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Login from './screens/Login'
import LoginWelcome from './screens/LoginWelcome'
import ProgrammerDashboard from './screens/ProgrammerDashboard'
import Dashboard from './screens/Dashboard'
import WeeklyProgram from './screens/WeeklyProgram'
import Students from './screens/Students'
import Cases from './screens/Cases'
import HotCases from './screens/HotCases'
import Interviews from './screens/Interviews'
import Absence from './screens/Absence'
import Lateness from './screens/Lateness'
import Dropout from './screens/Dropout'
import Activities from './screens/Activities'
import GroupCounseling from './screens/GroupCounseling'
import Guidance from './screens/Guidance'
import AnnualPlan from './screens/AnnualPlan'
import Reports from './screens/Reports'
import Notes from './screens/Notes'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import AcademicYears from './screens/AcademicYears'
import Permissions from './screens/Permissions'
import Administration from './screens/Administration'
import DirectorateDashboard from './screens/DirectorateDashboard'
import Messages from './screens/Messages'
import Directorates from './screens/Directorates'
import Schools from './screens/Schools'

const page = (Component) => <AppLayout><Component /></AppLayout>

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login-welcome" element={<LoginWelcome />} />
      <Route path="/programmer-dashboard" element={page(ProgrammerDashboard)} />
      <Route path="/welcome" element={page(DirectorateDashboard)} />
      <Route path="/setup" element={page(Profile)} />
      <Route path="/directorate-dashboard" element={page(DirectorateDashboard)} />
      <Route path="/administration" element={page(Administration)} />
      <Route path="/directorates" element={page(Directorates)} />
      <Route path="/schools" element={page(Schools)} />
      <Route path="/dashboard" element={page(Dashboard)} />
      <Route path="/weekly-program" element={page(WeeklyProgram)} />
      <Route path="/students" element={page(Students)} />
      <Route path="/cases" element={page(Cases)} />
      <Route path="/hot-cases" element={page(HotCases)} />
      <Route path="/interviews" element={page(Interviews)} />
      <Route path="/absence" element={page(Absence)} />
      <Route path="/lateness" element={page(Lateness)} />
      <Route path="/dropout" element={page(Dropout)} />
      <Route path="/activities" element={page(Activities)} />
      <Route path="/group-counseling" element={page(GroupCounseling)} />
      <Route path="/guidance" element={page(Guidance)} />
      <Route path="/annual-plan" element={page(AnnualPlan)} />
      <Route path="/reports" element={page(Reports)} />
      <Route path="/notes" element={page(Notes)} />
      <Route path="/messages" element={page(Messages)} />
      <Route path="/profile" element={page(Profile)} />
      <Route path="/permissions" element={page(Permissions)} />
      <Route path="/settings" element={page(Settings)} />
      <Route path="/academic-years" element={page(AcademicYears)} />
      <Route path="*" element={<Navigate to="/administration" replace />} />
    </Routes>
  </BrowserRouter>
}
