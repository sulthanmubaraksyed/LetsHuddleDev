import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Users2,
  FolderOpen,
  Settings,
  LogOut,
  Zap,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/huddles', label: 'Huddles', icon: CalendarDays },
  { to: '/huddleup', label: 'HuddleUp', icon: Zap },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/users', label: 'Users & Admin', icon: ShieldCheck, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { appUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">LetsHuddle</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-10">Task & Huddle Manager</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && appUser?.role === 'user') return null
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-700/50 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold shrink-0">
            {appUser?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{appUser?.displayName}</p>
            <p className="text-xs text-slate-400 capitalize">{appUser?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { appUser } = useAuth()
  return (
    <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg hover:bg-slate-100"
        aria-label="Open menu"
      >
        <Users2 className="w-5 h-5 text-slate-600" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-900">LetsHuddle</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
        {appUser?.displayName?.[0]?.toUpperCase() || 'U'}
      </div>
    </header>
  )
}
