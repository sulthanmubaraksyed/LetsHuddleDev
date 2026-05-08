export type UserRole = 'admin' | 'manager' | 'user'

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export type HuddleStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  name: string
  description: string
  assignedUserId: string
  assignedUserName: string
  dueDate: Date
  status: TaskStatus
  documentIds: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Huddle {
  id: string
  name: string
  day: string
  date: Date
  location: string
  status: HuddleStatus
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface HuddleTask {
  id: string
  huddleId: string
  taskId: string
  order: number
  addedAt: Date
  addedBy: string
}

export interface Document {
  id: string
  taskId: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: Date
  uploadedBy: string
}

export interface AuditLog {
  id: string
  entityType: 'task' | 'huddle' | 'document' | 'user'
  entityId: string
  action: 'created' | 'updated' | 'deleted' | 'status_changed'
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  performedBy: string
  performedAt: Date
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
}

export const HUDDLE_STATUS_LABELS: Record<HuddleStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
}

export const HUDDLE_STATUS_COLORS: Record<HuddleStatus, string> = {
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-600',
}
