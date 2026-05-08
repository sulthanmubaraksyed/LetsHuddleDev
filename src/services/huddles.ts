import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Huddle, HuddleStatus } from '@/types'

function fromFirestore(id: string, data: Record<string, unknown>): Huddle {
  return {
    id,
    name: data.name as string,
    day: data.day as string,
    date: (data.date as Timestamp)?.toDate() ?? new Date(),
    location: data.location as string,
    status: data.status as HuddleStatus,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    createdBy: data.createdBy as string,
  }
}

export async function getHuddles(): Promise<Huddle[]> {
  const snap = await getDocs(query(collection(db, 'huddles'), orderBy('date', 'desc')))
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getHuddle(id: string): Promise<Huddle | null> {
  const snap = await getDoc(doc(db, 'huddles', id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data() as Record<string, unknown>)
}

export async function createHuddle(
  data: Omit<Huddle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'huddles'), {
    ...data,
    date: Timestamp.fromDate(data.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateHuddle(id: string, data: Partial<Huddle>): Promise<void> {
  const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() }
  if (data.date) payload.date = Timestamp.fromDate(data.date)
  await updateDoc(doc(db, 'huddles', id), payload)
}

export async function deleteHuddle(id: string): Promise<void> {
  await deleteDoc(doc(db, 'huddles', id))
}

export async function updateHuddleStatus(id: string, status: HuddleStatus): Promise<void> {
  await updateDoc(doc(db, 'huddles', id), { status, updatedAt: serverTimestamp() })
}
