import {
  collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AppUser, UserRole } from '@/types'
import { Timestamp } from 'firebase/firestore'

function fromFirestore(id: string, data: Record<string, unknown>): AppUser {
  return {
    uid: id,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: data.photoURL as string | undefined,
    role: data.role as UserRole,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

export async function getUsers(): Promise<AppUser[]> {
  const q = query(collection(db, 'users'), orderBy('displayName', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() })
}
