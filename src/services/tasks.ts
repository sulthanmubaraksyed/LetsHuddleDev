import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Task, TaskStatus } from '@/types'

function fromFirestore(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    name: data.name as string,
    description: data.description as string,
    assignedUserId: data.assignedUserId as string,
    assignedUserName: data.assignedUserName as string,
    dueDate: (data.dueDate as Timestamp)?.toDate() ?? new Date(),
    status: data.status as TaskStatus,
    documentIds: (data.documentIds as string[]) ?? [],
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    createdBy: data.createdBy as string,
  }
}

export async function getTasks(userId?: string, isAdmin = false): Promise<Task[]> {
  const col = collection(db, 'tasks')
  const q = isAdmin ? query(col, orderBy('createdAt', 'desc')) : query(col, where('assignedUserId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getTask(id: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, 'tasks', id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data() as Record<string, unknown>)
}

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'documentIds'> & { createdBy: string }
): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...data,
    dueDate: Timestamp.fromDate(data.dueDate),
    documentIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() }
  if (data.dueDate) payload.dueDate = Timestamp.fromDate(data.dueDate)
  await updateDoc(doc(db, 'tasks', id), payload)
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', id))
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await updateDoc(doc(db, 'tasks', id), { status, updatedAt: serverTimestamp() })
}

export async function addDocumentToTask(taskId: string, documentId: string): Promise<void> {
  const task = await getTask(taskId)
  if (!task) return
  const ids = [...new Set([...task.documentIds, documentId])]
  await updateDoc(doc(db, 'tasks', taskId), { documentIds: ids, updatedAt: serverTimestamp() })
}
