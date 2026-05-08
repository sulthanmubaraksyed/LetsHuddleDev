import {
  collection, doc, getDocs, addDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { Document } from '@/types'
import { addDocumentToTask } from './tasks'

function fromFirestore(id: string, data: Record<string, unknown>): Document {
  return {
    id,
    taskId: data.taskId as string,
    name: data.name as string,
    url: data.url as string,
    size: data.size as number,
    type: data.type as string,
    uploadedAt: (data.uploadedAt as Timestamp)?.toDate() ?? new Date(),
    uploadedBy: data.uploadedBy as string,
  }
}

export async function getDocumentsForTask(taskId: string): Promise<Document[]> {
  const q = query(
    collection(db, 'documents'),
    where('taskId', '==', taskId),
    orderBy('uploadedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getAllDocuments(): Promise<Document[]> {
  const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function uploadDocument(
  taskId: string,
  file: File,
  uploadedBy: string,
  onProgress?: (pct: number) => void
): Promise<Document> {
  const path = `documents/${taskId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file)

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      resolve
    )
  })

  const url = await getDownloadURL(storageRef)
  const docRef = await addDoc(collection(db, 'documents'), {
    taskId,
    name: file.name,
    url,
    size: file.size,
    type: file.type,
    storagePath: path,
    uploadedAt: serverTimestamp(),
    uploadedBy,
  })

  await addDocumentToTask(taskId, docRef.id)

  return {
    id: docRef.id,
    taskId,
    name: file.name,
    url,
    size: file.size,
    type: file.type,
    uploadedAt: new Date(),
    uploadedBy,
  }
}

export async function deleteDocument(docId: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath))
    } catch (_) { /* file may not exist */ }
  }
  await deleteDoc(doc(db, 'documents', docId))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
