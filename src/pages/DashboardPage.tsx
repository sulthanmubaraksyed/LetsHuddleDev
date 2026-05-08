import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isAfter, startOfDay } from 'date-fns'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, Calendar,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getTasks } from '@/services/tasks'
import type { Task, TaskStatus } from '@/types'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'

export function DashboardPage() {
  const { currentUser, appUser } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [dueSoon, setDueSoon] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    getTasks(currentUser.uid, appUser?.role === 'admin')
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [currentUser, appUser?.role])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const blocked = tasks.filter((t) => t.status === 'blocked').length
    const overdue = tasks.filter(
      (t) => t.status !== 'completed' && isAfter(startOfDay(new Date()), startOfDay(new Date(t.dueDate)))
    ).length
    return { total, completed, inProgress, blocked, overdue }
  }, [tasks])

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (statusFilter) list = list.filter((t) => t.status === statusFilter)
    if (dueSoon) {
      const in3 = new Date()
      in3.setDate(in3.getDate() + 3)
      list = list.filter((t) => t.status !== 'completed' && new Date(t.dueDate) <= in3)
    }
    return list
  }, [tasks, statusFilter, dueSoon])

  if (loading) return <LoadingSpinner fullPage label="Loading dashboard…" />

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed', value: stats.completed, icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getGreeting()}, {appUser?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-0.5">Here's what's on your plate today.</p>
        </div>
        <Link to="/tasks">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New Task</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          options={[
            { value: 'not_started', label: 'Not Started' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'blocked', label: 'Blocked' },
          ]}
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="w-44"
        />
        <button
          onClick={() => setDueSoon((d) => !d)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            dueSoon
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Clock className="w-4 h-4" />
          Due in 3 days
        </button>
        {(statusFilter || dueSoon) && (
          <button
            onClick={() => { setStatusFilter(''); setDueSoon(false) }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Create a new task or adjust your filters."
          action={
            <Link to="/tasks">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Task
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }: { task: Task }) {
  const isOverdue =
    task.status !== 'completed' &&
    isAfter(startOfDay(new Date()), startOfDay(new Date(task.dueDate)))

  return (
    <Card padding="sm" hover>
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/tasks"
              className="font-medium text-slate-900 hover:text-blue-600 truncate"
            >
              {task.name}
            </Link>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TASK_STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-slate-500 truncate mt-0.5">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 text-sm">
          <div className={cn('flex items-center gap-1.5', isOverdue ? 'text-red-600' : 'text-slate-500')}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            {isOverdue && <span className="font-medium">(Overdue)</span>}
          </div>
          <span className="text-slate-400 hidden sm:block">{task.assignedUserName}</span>
        </div>
      </div>
    </Card>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
