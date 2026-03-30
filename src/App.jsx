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
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-24"><Outlet /></main>
      <BottomNav />
    </div>
  )
}

function FamilyGate() {
  const { hasFamily, isLoading } = useFamilyContext()

  if (isLoading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
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
