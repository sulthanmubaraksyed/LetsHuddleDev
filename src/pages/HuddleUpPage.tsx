import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, MoveRight, ArrowRightLeft, MapPin, Calendar, CheckCircle2, Circle, AlertTriangle, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getHuddles, createHuddle } from '@/services/huddles'
import { getTasks } from '@/services/tasks'
import { getHuddleTasksForHuddle, assignTaskToHuddle, removeTaskFromHuddle, moveTaskToHuddle } from '@/services/huddleTasks'
import type { Huddle, Task, HuddleTask } from '@/types'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, HUDDLE_STATUS_COLORS, HUDDLE_STATUS_LABELS } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

interface HuddleWithTasks {
  huddle: Huddle
  tasks: { huddleTask: HuddleTask; task: Task }[]
}

export function HuddleUpPage() {
  const { currentUser, appUser } = useAuth()
  const toast = useToast()
  const isAdmin = appUser?.role !== 'user'

  const [huddles, setHuddles] = useState<Huddle[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [huddleData, setHuddleData] = useState<HuddleWithTasks[]>([])
  const [loading, setLoading] = useState(true)

  // Add task to huddle modal
  const [addTaskModal, setAddTaskModal] = useState<{ huddleId: string; huddleName: string } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState('')

  // Move task modal
  const [moveModal, setMoveModal] = useState<{ huddleTaskId: string; taskName: string } | null>(null)
  const [targetHuddleId, setTargetHuddleId] = useState('')

  // New huddle quick-create
  const [newHuddleModal, setNewHuddleModal] = useState(false)
  const [newHuddleName, setNewHuddleName] = useState('')
  const [newHuddleDate, setNewHuddleDate] = useState('')
  const [newHuddleLocation, setNewHuddleLocation] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!currentUser) return
    const [h, t] = await Promise.all([
      getHuddles(),
      getTasks(currentUser.uid, isAdmin),
    ])
    setHuddles(h)
    setAllTasks(t)

    const data: HuddleWithTasks[] = await Promise.all(
      h.map(async (huddle) => {
        const hts = await getHuddleTasksForHuddle(huddle.id)
        const tasks = hts.flatMap((ht) => {
          const task = t.find((t) => t.id === ht.taskId)
          return task ? [{ huddleTask: ht, task }] : []
        })
        return { huddle, tasks }
      })
    )
    setHuddleData(data)
  }, [currentUser, isAdmin])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const unassignedIncompleteTasks = allTasks.filter((t) => {
    const assigned = huddleData.some((hd) => hd.tasks.some((ht) => ht.task.id === t.id))
    return !assigned && t.status !== 'completed'
  })

  async function handleAddTask() {
    if (!addTaskModal || !selectedTaskId || !currentUser) return
    try {
      await assignTaskToHuddle(addTaskModal.huddleId, selectedTaskId, currentUser.uid)
      toast.success('Task added to huddle')
      await load()
    } catch {
      toast.error('Failed to add task')
    }
    setAddTaskModal(null)
    setSelectedTaskId('')
  }

  async function handleMoveTask() {
    if (!moveModal || !targetHuddleId) return
    try {
      await moveTaskToHuddle(moveModal.huddleTaskId, targetHuddleId)
      toast.success('Task moved')
      await load()
    } catch {
      toast.error('Failed to move task')
    }
    setMoveModal(null)
    setTargetHuddleId('')
  }

  async function handleRemoveFromHuddle(huddleTaskId: string) {
    try {
      await removeTaskFromHuddle(huddleTaskId)
      toast.success('Task removed from huddle')
      await load()
    } catch {
      toast.error('Failed to remove task')
    }
  }

  async function handleCreateHuddle() {
    if (!newHuddleName || !newHuddleDate || !currentUser) return
    setCreating(true)
    try {
      await createHuddle({
        name: newHuddleName,
        day: format(new Date(newHuddleDate), 'EEEE'),
        date: new Date(newHuddleDate),
        location: newHuddleLocation || 'TBD',
        status: 'planned',
        createdBy: currentUser.uid,
      })
      toast.success('Huddle created')
      setNewHuddleModal(false)
      setNewHuddleName('')
      setNewHuddleDate('')
      setNewHuddleLocation('')
      await load()
    } catch {
      toast.error('Failed to create huddle')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage label="Loading HuddleUp…" />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" /> HuddleUp
          </h1>
          <p className="text-slate-500 mt-0.5">Assign and track tasks across huddles</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setNewHuddleModal(true)}>
          New Huddle
        </Button>
      </div>

      {/* Unassigned tasks banner */}
      {unassignedIncompleteTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {unassignedIncompleteTasks.length} unscheduled task{unassignedIncompleteTasks.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              These tasks are not yet assigned to any huddle:{' '}
              {unassignedIncompleteTasks.slice(0, 3).map((t) => t.name).join(', ')}
              {unassignedIncompleteTasks.length > 3 && ` and ${unassignedIncompleteTasks.length - 3} more`}.
            </p>
          </div>
        </div>
      )}

      {huddles.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No huddles yet"
          description="Create a huddle to start organizing tasks."
          action={<Button size="sm" onClick={() => setNewHuddleModal(true)}><Plus className="w-4 h-4 mr-1" />New Huddle</Button>}
        />
      ) : (
        <div className="space-y-4">
          {huddleData.map(({ huddle, tasks }) => (
            <HuddleBlock
              key={huddle.id}
              huddle={huddle}
              tasks={tasks}
              onAddTask={() => setAddTaskModal({ huddleId: huddle.id, huddleName: huddle.name })}
              onMoveTask={(huddleTaskId, taskName) => setMoveModal({ huddleTaskId, taskName })}
              onRemoveTask={handleRemoveFromHuddle}
            />
          ))}
        </div>
      )}

      {/* Add task modal */}
      <Modal
        open={!!addTaskModal}
        onClose={() => setAddTaskModal(null)}
        title={`Add Task to "${addTaskModal?.huddleName}"`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddTaskModal(null)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={!selectedTaskId}>Add Task</Button>
          </>
        }
      >
        <Select
          label="Select Task"
          options={allTasks
            .filter((t) => t.status !== 'completed')
            .map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Choose a task…"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
        />
        {allTasks.filter((t) => t.status !== 'completed').length === 0 && (
          <p className="text-sm text-slate-500 mt-2">All incomplete tasks are already assigned.</p>
        )}
      </Modal>

      {/* Move task modal */}
      <Modal
        open={!!moveModal}
        onClose={() => setMoveModal(null)}
        title={`Move "${moveModal?.taskName}"`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setMoveModal(null)}>Cancel</Button>
            <Button onClick={handleMoveTask} disabled={!targetHuddleId}>Move Task</Button>
          </>
        }
      >
        <Select
          label="Move to Huddle"
          options={huddles.filter((h) => h.status !== 'completed' && h.status !== 'cancelled').map((h) => ({ value: h.id, label: h.name }))}
          placeholder="Choose a huddle…"
          value={targetHuddleId}
          onChange={(e) => setTargetHuddleId(e.target.value)}
        />
      </Modal>

      {/* New Huddle modal */}
      <Modal
        open={newHuddleModal}
        onClose={() => setNewHuddleModal(false)}
        title="Create New Huddle"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setNewHuddleModal(false)}>Cancel</Button>
            <Button loading={creating} onClick={handleCreateHuddle} disabled={!newHuddleName || !newHuddleDate}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Huddle Name" placeholder="e.g. Week 21 Review" value={newHuddleName} onChange={(e) => setNewHuddleName(e.target.value)} />
          <Input label="Date" type="date" value={newHuddleDate} onChange={(e) => setNewHuddleDate(e.target.value)} />
          <Input label="Location" placeholder="e.g. Zoom or Room B" value={newHuddleLocation} onChange={(e) => setNewHuddleLocation(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

function HuddleBlock({
  huddle, tasks, onAddTask, onMoveTask, onRemoveTask,
}: {
  huddle: Huddle
  tasks: { huddleTask: HuddleTask; task: Task }[]
  onAddTask: () => void
  onMoveTask: (huddleTaskId: string, taskName: string) => void
  onRemoveTask: (huddleTaskId: string) => void
}) {
  const completed = tasks.filter((t) => t.task.status === 'completed').length
  const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  const isLocked = huddle.status === 'completed' || huddle.status === 'cancelled'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Huddle header */}
      <div className="px-5 py-4 flex items-start justify-between border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-semibold text-slate-900">{huddle.name}</h3>
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', HUDDLE_STATUS_COLORS[huddle.status])}>
              {HUDDLE_STATUS_LABELS[huddle.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(huddle.date), 'MMM d, yyyy')} ({huddle.day})</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{huddle.location}</span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs text-slate-500">{completed}/{tasks.length} done</p>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="divide-y divide-slate-50">
        {tasks.length === 0 && (
          <p className="text-sm text-slate-400 px-5 py-4 text-center">No tasks assigned to this huddle.</p>
        )}
        {tasks.map(({ huddleTask, task }) => (
          <div key={huddleTask.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 group">
            {task.status === 'completed' ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
                {task.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {task.assignedUserName} · Due {format(new Date(task.dueDate), 'MMM d')}
              </p>
            </div>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0', TASK_STATUS_COLORS[task.status])}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            {!isLocked && task.status !== 'completed' && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onMoveTask(huddleTask.id, task.name)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600"
                  title="Move to another huddle"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemoveTask(huddleTask.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                  title="Remove from huddle"
                >
                  <MoveRight className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer action */}
      {!isLocked && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Pull task into huddle
          </button>
        </div>
      )}
    </div>
  )
}
