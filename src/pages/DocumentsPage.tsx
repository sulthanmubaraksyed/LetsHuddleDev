import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FolderOpen, Search, ExternalLink, FileText, FileImage, File } from 'lucide-react'
import { getAllDocuments } from '@/services/documents'
import type { Document } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />
  if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
  return <File className="w-5 h-5 text-slate-400" />
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllDocuments()
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [])

  const filtered = docs.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner fullPage label="Loading documents…" />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''} attached to tasks</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents found"
          description="Upload documents to tasks to see them here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">File</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Uploaded</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">{fileIcon(doc.type)}</div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Task: {doc.taskId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{formatSize(doc.size)}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
