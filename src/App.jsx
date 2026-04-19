import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClientInstance } from '@/lib/queryClient'
import { FamilyProvider, useFamilyContext } from '@/context/FamilyContext'
import BottomNav from '@/components/BottomNav'

import Tasks        from '@/pages/Tasks'
import AddTask      from '@/pages/AddTask'
import TaskDetail   from '@/pages/TaskDetail'
import CalendarView from '@/pages/CalendarView'
import Notifications from '@/pages/Notifications'
import Profile      from '@/pages/Profile'
import Onboarding   from '@/pages/Onboarding'
import Welcome      from '@/pages/Welcome'

function AppLayout() {
  return (
    <div
      className="min-h-screen max-w-lg mx-auto relative"
      style={{ background: 'hsl(136 42% 4%)' }}
    >
      <main className="pb-28"><Outlet /></main>
      <BottomNav />
    </div>
  )
}

function FamilyGate() {
  const { hasFamily, isLoading } = useFamilyContext()

  if (isLoading)
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-5"
        style={{ background: 'hsl(136 42% 4%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'hsl(136 62% 52% / 0.1)',
            border: '1px solid hsl(136 62% 52% / 0.2)',
            boxShadow: '0 0 28px hsl(136 62% 52% / 0.15)',
          }}
        >
          <svg className="w-7 h-7 animate-spin-slow" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="hsl(136 62% 52% / 0.2)" strokeWidth="2" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="hsl(136 62% 52%)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-xs font-medium" style={{ color: 'hsl(136 12% 45%)' }}>Загрузка…</p>
      </div>
    )

  if (!hasFamily) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"               element={<Tasks />} />
        <Route path="/add-task"       element={<AddTask />} />
        <Route path="/task/:id"       element={<TaskDetail />} />
        <Route path="/calendar"       element={<CalendarView />} />
        <Route path="/notifications"  element={<Notifications />} />
        <Route path="/profile"        element={<Profile />} />
      </Route>
      <Route path="*" element={<div className="flex items-center justify-center h-screen text-muted-foreground">404 — Страница не найдена</div>} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <FamilyProvider>
          <FamilyGate />
        </FamilyProvider>
      </Router>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}
