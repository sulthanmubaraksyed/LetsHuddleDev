import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { User, Shield, Palette, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const profileSchema = z.object({
  displayName: z.string().min(2, 'Minimum 2 characters'),
})
type ProfileForm = z.infer<typeof profileSchema>

export function SettingsPage() {
  const { currentUser, appUser } = useAuth()
  const toast = useToast()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: appUser?.displayName || '' },
  })

  async function onSaveProfile(data: ProfileForm) {
    if (!currentUser) return
    try {
      await updateProfile(currentUser, { displayName: data.displayName })
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: data.displayName,
        updatedAt: serverTimestamp(),
      })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Profile</h2>
        </div>
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <Input
            label="Display Name"
            {...register('displayName')}
            error={errors.displayName?.message}
          />
          <Input
            label="Email"
            value={currentUser?.email || ''}
            disabled
            helperText="Email cannot be changed here."
          />
          <div className="flex items-center gap-2 pt-1">
            <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
              {appUser?.role}
            </div>
            <span className="text-xs text-slate-500">Your current role</span>
          </div>
          <Button type="submit" loading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
            Save Profile
          </Button>
        </form>
      </Card>

      {/* Account info */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Account</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Account ID</span>
            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
              {currentUser?.uid.slice(0, 16)}…
            </code>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Sign-in provider</span>
            <span className="font-medium text-slate-800">
              {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Account created</span>
            <span className="font-medium text-slate-800">
              {currentUser?.metadata.creationTime
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* App info */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">About</h2>
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p><span className="font-medium">LetsHuddle</span> v1.0.0</p>
          <p>Built with React, Firebase, and Neon PostgreSQL.</p>
          <p>© {new Date().getFullYear()} LetsHuddle. All rights reserved.</p>
        </div>
      </Card>
    </div>
  )
}
