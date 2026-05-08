import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, MapPin, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getHuddles, createHuddle, updateHuddle, deleteHuddle } from '@/services/huddles'
import { getHuddleTasksForHuddle } from '@/services/huddleTasks'
import { getTasks } from '@/services/tasks'
import type { Huddle } from '@/types'
import { HUDDLE_STATUS_LABELS, HUDDLE_STATUS_COLORS } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STATUS_OPTIONS = Object.entries(HUDDLE_STATUS_LABELS).map(([value, label]) => ({ value, label }))
const DAY_OPTIONS = DAYS.map((d) => ({ value: d, label: d }))

const huddleSchema = z.object({
  name: z.string().min(1, 'Required'),
  day: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
})
type HuddleForm = z.infer<typeof huddleSchema>

export function HuddlesPage() {
  const { currentUser } = useAuth()
  const toast = useToast()

  const [huddles, setHuddles] = useState<Huddle[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editHuddle, setEditHuddle] = useState<Huddle | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [blockMsg, setBlockMsg] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<HuddleForm>({
    resolver: zodResolver(huddleSchema),
    defaultValues: { status: 'planned' },
  })

  async function load() {
    const h = await getHuddles()
    setHuddles(h)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function openCreate() {
    setEditHuddle(null)
    reset({ status: 'planned', day: 'Monday' })
    setModalOpen(true)
  }

  function openEdit(h: Huddle) {
    setEditHuddle(h)
    setValue('name', h.name)
    setValue('day', h.day)
    setValue('date', format(new Date(h.date), 'yyyy-MM-dd'))
    setValue('location', h.location)
    setValue('status', h.status)
    setModalOpen(true)
  }

  async function onSubmit(data: HuddleForm) {
    if (data.status === 'completed' && editHuddle) {
      const allDone = await checkAllTasksDone(editHuddle.id)
      if (!allDone) {
        setBlockMsg('Cannot mark Huddle as Completed — some tasks are still incomplete.')
        return
      }
    }
    try {
      if (editHuddle) {
        await updateHuddle(editHuddle.id, { ...data, date: new Date(data.date) })
        toast.success('Huddle updated')
      } else {
        await createHuddle({ ...data, date: new Date(data.date), createdBy: currentUser!.uid })
        toast.success('Huddle created')
      }
      setModalOpen(false)
      await load()
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function checkAllTasksDone(huddleId: string): Promise<boolean> {
    const hts = await getHuddleTasksForHuddle(huddleId)
    if (hts.length === 0) return true
    const tasks = await getTasks()
    return hts.every((ht) => {
      const t = tasks.find((t) => t.id === ht.taskId)
      return !t || t.status === 'completed'
    })
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteHuddle(deleteId)
      toast.success('Huddle deleted')
      await load()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) return <LoadingSpinner fullPage label="Loading huddles…" />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Huddles</h1>
          <p className="text-slate-500 mt-0.5">{huddles.length} huddles total</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>New Huddle</Button>
      </div>

      {huddles.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No huddles yet"
          description="Create a huddle to group your tasks into focused work sessions."
          action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />New Huddle</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {huddles.map((huddle) => (
            <HuddleCard
              key={huddle.id}
              huddle={huddle}
              onEdit={() => openEdit(huddle)}
              onDelete={() => setDeleteId(huddle.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editHuddle ? 'Edit Huddle' : 'New Huddle'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {editHuddle ? 'Save Changes' : 'Create Huddle'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Huddle Name" placeholder="e.g. Sprint Planning" {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Day" options={DAY_OPTIONS} {...register('day')} error={errors.day?.message} />
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <Input label="Location" placeholder="e.g. Conference Room A or Zoom" {...register('location')} error={errors.location?.message} />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} error={errors.status?.message} />
        </div>
      </Modal>

      <Modal
        open={!!blockMsg}
        onClose={() => setBlockMsg(null)}
        title="Cannot Complete Huddle"
        size="sm"
        footer={<Button onClick={() => setBlockMsg(null)}>Understood</Button>}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{blockMsg}</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Huddle"
        message="This will delete the huddle and remove all task assignments. This cannot be undone."
        loading={deleting}
      />
    </div>
  )
}

function HuddleCard({ huddle, onEdit, onDelete }: { huddle: Huddle; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">{huddle.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{huddle.day}</p>
        </div>
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', HUDDLE_STATUS_COLORS[huddle.status])}>
          {HUDDLE_STATUS_LABELS[huddle.status]}
        </span>
      </div>
      <div className="space-y-1.5 text-sm text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {format(new Date(huddle.date), 'MMMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          {huddle.location}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}
