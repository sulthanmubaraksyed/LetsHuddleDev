import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'
import { Pool } from 'pg'

admin.initializeApp()
const db = admin.firestore()

const corsHandler = cors({ origin: true })

// Neon PostgreSQL connection (set via Firebase environment config)
function getPool(): Pool {
  const connStr = process.env.NEON_DATABASE_URL || functions.config().neon?.database_url
  return new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
}

// ─── Helper: verify auth ───────────────────────────────────────────────────
async function verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
  return admin.auth().verifyIdToken(token)
}

function extractToken(req: functions.https.Request): string | null {
  const h = req.headers.authorization
  if (h?.startsWith('Bearer ')) return h.slice(7)
  return null
}

// ─── ANALYTICS: sync task to Neon PostgreSQL ──────────────────────────────
export const onTaskWritten = functions.firestore
  .document('tasks/{taskId}')
  .onWrite(async (change, context) => {
    const pool = getPool()
    const taskId = context.params.taskId

    try {
      if (!change.after.exists) {
        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId])
        return
      }
      const data = change.after.data()!
      await pool.query(`
        INSERT INTO tasks (id, name, description, assigned_user_id, assigned_user_name, due_date, status, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          assigned_user_id = EXCLUDED.assigned_user_id,
          assigned_user_name = EXCLUDED.assigned_user_name,
          due_date = EXCLUDED.due_date,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `, [
        taskId,
        data.name,
        data.description,
        data.assignedUserId,
        data.assignedUserName,
        data.dueDate?.toDate() ?? null,
        data.status,
        data.createdAt?.toDate() ?? new Date(),
        data.updatedAt?.toDate() ?? new Date(),
      ])
    } finally {
      await pool.end()
    }
  })

// ─── ANALYTICS: sync huddle to Neon PostgreSQL ────────────────────────────
export const onHuddleWritten = functions.firestore
  .document('huddles/{huddleId}')
  .onWrite(async (change, context) => {
    const pool = getPool()
    const huddleId = context.params.huddleId

    try {
      if (!change.after.exists) {
        await pool.query('DELETE FROM huddles WHERE id = $1', [huddleId])
        return
      }
      const data = change.after.data()!
      await pool.query(`
        INSERT INTO huddles (id, name, day, date, location, status, created_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          day = EXCLUDED.day,
          date = EXCLUDED.date,
          location = EXCLUDED.location,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `, [
        huddleId,
        data.name,
        data.day,
        data.date?.toDate() ?? null,
        data.location,
        data.status,
        data.createdBy,
        data.createdAt?.toDate() ?? new Date(),
        data.updatedAt?.toDate() ?? new Date(),
      ])
    } finally {
      await pool.end()
    }
  })

// ─── API: Task analytics report ───────────────────────────────────────────
export const getTaskAnalytics = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      const token = extractToken(req)
      if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }
      const decoded = await verifyToken(token)
      const userSnap = await db.doc(`users/${decoded.uid}`).get()
      const role = userSnap.data()?.role
      if (role !== 'admin' && role !== 'manager') {
        res.status(403).json({ error: 'Forbidden' }); return
      }

      const pool = getPool()
      try {
        const result = await pool.query(`
          SELECT
            status,
            COUNT(*) AS count,
            MIN(due_date) AS earliest_due,
            MAX(due_date) AS latest_due
          FROM tasks
          GROUP BY status
          ORDER BY status
        `)
        res.json({ analytics: result.rows })
      } finally {
        await pool.end()
      }
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })
})

// ─── API: Huddle completion check ─────────────────────────────────────────
export const checkHuddleCompletable = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Not authenticated')

  const { huddleId } = data as { huddleId: string }
  const snap = await db.collection('huddleTasks').where('huddleId', '==', huddleId).get()
  const taskIds = snap.docs.map((d) => d.data().taskId as string)

  if (taskIds.length === 0) return { completable: true, incompleteTasks: [] }

  const incompleteTasks: string[] = []
  for (const taskId of taskIds) {
    const taskSnap = await db.doc(`tasks/${taskId}`).get()
    const task = taskSnap.data()
    if (task && task.status !== 'completed') {
      incompleteTasks.push(task.name as string)
    }
  }

  return {
    completable: incompleteTasks.length === 0,
    incompleteTasks,
  }
})

// ─── Cleanup: when task deleted, remove from all huddles ──────────────────
export const onTaskDeleted = functions.firestore
  .document('tasks/{taskId}')
  .onDelete(async (snap, context) => {
    const taskId = context.params.taskId
    const refs = await db.collection('huddleTasks').where('taskId', '==', taskId).get()
    const batch = db.batch()
    refs.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  })
