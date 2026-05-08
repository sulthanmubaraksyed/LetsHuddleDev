import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Sidebar, MobileHeader } from './Sidebar'
import { cn } from '@/utils/cn'
import {
  X, Zap, LayoutDashboard, CheckSquare, CalendarDays, FolderOpen,
  Settings, ShieldCheck, LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const mobileNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/huddles', label: 'Huddles', icon: CalendarDays },
  { to: '/huddleup', label: 'HuddleUp', icon: Zap },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/users', label: 'Users & Admin', icon: ShieldCheck, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { appUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
    setMobileOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col">
            <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">LetsHuddle</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {mobileNav.map(({ to, label, icon: Icon, adminOnly }) => {
                if (adminOnly && appUser?.role === 'user') return null
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </NavLink>
                )
              })}
            </nav>
            <div className="px-3 pb-4 border-t border-slate-700/50 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
