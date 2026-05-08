import {
  collection, doc, getDocs, addDoc, deleteDoc, updateDoc,
  query, where, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { HuddleTask } from '@/types'
import { Timestamp } from 'firebase/firestore'

function fromFirestore(id: string, data: Record<string, unknown>): HuddleTask {
  return {
    id,
    huddleId: data.huddleId as string,
    taskId: data.taskId as string,
    order: data.order as number,
    addedAt: (data.addedAt as Timestamp)?.toDate() ?? new Date(),
    addedBy: data.addedBy as string,
  }
}

export async function getHuddleTasksForHuddle(huddleId: string): Promise<HuddleTask[]> {
  const q = query(
    collection(db, 'huddleTasks'),
    where('huddleId', '==', huddleId),
    orderBy('order', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getHuddleTasksForTask(taskId: string): Promise<HuddleTask[]> {
  const q = query(collection(db, 'huddleTasks'), where('taskId', '==', taskId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function assignTaskToHuddle(
  huddleId: string,
  taskId: string,
  addedBy: string,
  order = 0
): Promise<string> {
  const ref = await addDoc(collection(db, 'huddleTasks'), {
    huddleId,
    taskId,
    order,
    addedAt: serverTimestamp(),
    addedBy,
  })
  return ref.id
}

export async function removeTaskFromHuddle(huddleTaskId: string): Promise<void> {
  await deleteDoc(doc(db, 'huddleTasks', huddleTaskId))
}

export async function moveTaskToHuddle(
  huddleTaskId: string,
  newHuddleId: string
): Promise<void> {
  await updateDoc(doc(db, 'huddleTasks', huddleTaskId), {
    huddleId: newHuddleId,
    addedAt: serverTimestamp(),
  })
}

export async function removeAllTasksFromHuddle(huddleId: string): Promise<void> {
  const tasks = await getHuddleTasksForHuddle(huddleId)
  const batch = writeBatch(db)
  tasks.forEach((ht) => batch.delete(doc(db, 'huddleTasks', ht.id)))
  await batch.commit()
}
