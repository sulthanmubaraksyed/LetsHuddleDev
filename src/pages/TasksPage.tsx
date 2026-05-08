import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Plus, Search, Pencil, Trash2, FileUp, Eye, Filter,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getTasks, createTask, updateTask, deleteTask } from '@/services/tasks'
import { getDocumentsForTask, uploadDocument } from '@/services/documents'
import { getUsers } from '@/services/users'
import type { Task, TaskStatus, AppUser } from '@/types'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'
import type { Document } from '@/types'

const taskSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  assignedUserId: z.string().min(1, 'Required'),
  dueDate: z.string().min(1, 'Required'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
})
type TaskForm = z.infer<typeof taskSchema>

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))

export function TasksPage() {
  const { currentUser, appUser } = useAuth()
  const toast = useToast()
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'manager'

  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [taskDocs, setTaskDocs] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: 'not_started' },
  })

  async function load() {
    if (!currentUser) return
    const [t, u] = await Promise.all([
      getTasks(currentUser.uid, isAdmin),
      getUsers(),
    ])
    setTasks(t)
    setUsers(u)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [currentUser, isAdmin])

  function openCreate() {
    setEditTask(null)
    reset({ status: 'not_started', assignedUserId: currentUser?.uid, dueDate: '' })
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditTask(task)
    setValue('name', task.name)
    setValue('description', task.description)
    setValue('assignedUserId', task.assignedUserId)
    setValue('dueDate', format(new Date(task.dueDate), 'yyyy-MM-dd'))
    setValue('status', task.status)
    setModalOpen(true)
  }

  async function onSubmit(data: TaskForm) {
    try {
      const assignedUser = users.find((u) => u.uid === data.assignedUserId)
      if (editTask) {
        await updateTask(editTask.id, {
          ...data,
          dueDate: new Date(data.dueDate),
          assignedUserName: assignedUser?.displayName || '',
        })
        toast.success('Task updated')
      } else {
        await createTask({
          name: data.name,
          description: data.description || '',
          assignedUserId: data.assignedUserId,
          assignedUserName: assignedUser?.displayName || '',
          dueDate: new Date(data.dueDate),
          status: data.status,
          createdBy: currentUser!.uid,
        })
        toast.success('Task created')
      }
      setModalOpen(false)
      await load()
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteTask(deleteId)
      toast.success('Task deleted')
      await load()
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  async function openView(task: Task) {
    setViewTask(task)
    const docs = await getDocumentsForTask(task.id)
    setTaskDocs(docs)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!viewTask || !currentUser) return
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadDocument(viewTask.id, file, currentUser.uid, setUploadPct)
      }
      const docs = await getDocumentsForTask(viewTask.id)
      setTaskDocs(docs)
      toast.success('Document(s) uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      setUploadPct(0)
    }
  }

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <LoadingSpinner fullPage label="Loading tasks…" />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-0.5">{tasks.length} tasks total</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>New Task</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="w-44"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No tasks found"
          description="Try a different search or create a new task."
          action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Task</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Task</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{task.assignedUserName}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TASK_STATUS_COLORS[task.status])}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openView(task)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(task)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(task.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTask ? 'Edit Task' : 'New Task'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Task Name" placeholder="Enter task name" {...register('name')} error={errors.name?.message} />
          <Textarea label="Description" placeholder="Describe the task…" {...register('description')} />
          <Select
            label="Assigned To"
            options={users.map((u) => ({ value: u.uid, label: u.displayName }))}
            placeholder="Select user"
            {...register('assignedUserId')}
            error={errors.assignedUserId?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
            <Select label="Status" options={STATUS_OPTIONS} {...register('status')} error={errors.status?.message} />
          </div>
        </div>
      </Modal>

      {/* View/Documents Modal */}
      <Modal
        open={!!viewTask}
        onClose={() => setViewTask(null)}
        title="Task Details"
        size="lg"
        footer={<Button variant="outline" onClick={() => setViewTask(null)}>Close</Button>}
      >
        {viewTask && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Name</span><p className="font-medium mt-0.5">{viewTask.name}</p></div>
              <div><span className="text-slate-500">Status</span>
                <div className="mt-0.5">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', TASK_STATUS_COLORS[viewTask.status])}>
                    {TASK_STATUS_LABELS[viewTask.status]}
                  </span>
                </div>
              </div>
              <div><span className="text-slate-500">Assigned To</span><p className="font-medium mt-0.5">{viewTask.assignedUserName}</p></div>
              <div><span className="text-slate-500">Due Date</span><p className="font-medium mt-0.5">{format(new Date(viewTask.dueDate), 'MMMM d, yyyy')}</p></div>
              {viewTask.description && (
                <div className="col-span-2"><span className="text-slate-500">Description</span><p className="mt-0.5 text-slate-800">{viewTask.description}</p></div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Documents ({taskDocs.length})</h4>
                <label className="cursor-pointer">
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  <Button size="sm" variant="outline" leftIcon={<FileUp className="w-3.5 h-3.5" />} loading={uploading}>
                    {uploading ? `${uploadPct}%` : 'Upload'}
                  </Button>
                </label>
              </div>
              {taskDocs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No documents attached</p>
              ) : (
                <div className="space-y-2">
                  {taskDocs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileUp className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{d.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{(d.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline shrink-0 ml-2">
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="This will permanently delete the task. This action cannot be undone."
        loading={deleting}
      />
    </div>
  )
}
