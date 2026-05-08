import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ShieldCheck, User, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUsers, updateUserRole } from '@/services/users'
import type { AppUser, UserRole } from '@/types'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' },
]

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  user: 'bg-slate-100 text-slate-700',
}

export function UsersPage() {
  const { appUser: currentAppUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const isAdmin = currentAppUser?.role === 'admin'

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(uid: string, role: UserRole) {
    try {
      await updateUserRole(uid, role)
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role } : u))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  const filtered = users.filter(
    (u) => !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner fullPage label="Loading users…" />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users & Admin</h1>
        <p className="text-slate-500 mt-0.5">{users.length} users registered</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-800">Role-based Access Control</p>
          <p className="text-blue-700 mt-0.5">
            <strong>Admin</strong>: full access · <strong>Manager</strong>: manage all tasks/huddles · <strong>User</strong>: own tasks only
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={User} title="No users found" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                        {user.displayName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.displayName}</p>
                        {user.uid === currentAppUser?.uid && (
                          <p className="text-xs text-slate-400">(you)</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && user.uid !== currentAppUser?.uid ? (
                      <Select
                        options={ROLE_OPTIONS}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                        className="w-32"
                      />
                    ) : (
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', roleBadge[user.role])}>
                        {user.role}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
