import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Min 2 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  async function onLogin(data: LoginForm) {
    try {
      await signIn(data.email, data.password)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    }
  }

  async function onSignup(data: SignupForm) {
    try {
      await signUp(data.email, data.password, data.displayName)
      navigate('/dashboard')
    } catch {
      toast.error('Failed to create account')
    }
  }

  async function onGoogle() {
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      toast.error('Google sign-in failed')
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-6">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">LetsHuddle</h1>
          <p className="text-slate-400 text-lg">
            Organize tasks, schedule huddles, track progress — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            {[
              ['Task Tracking', 'Manage your team\'s tasks with status and due dates'],
              ['Huddle Scheduling', 'Group tasks into focused work sessions'],
              ['Document Uploads', 'Attach files directly to tasks'],
              ['Team Management', 'Role-based access for your whole team'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-slate-800 rounded-xl p-4 text-left">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-900">LetsHuddle</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === 'login' ? 'Sign in to your account' : 'Get started with LetsHuddle'}
            </p>

            {mode === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  {...loginForm.register('email')}
                  error={loginForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password')}
                  error={loginForm.formState.errors.password?.message}
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={loginForm.formState.isSubmitting}
                >
                  Sign in
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Jane Smith"
                  {...signupForm.register('displayName')}
                  error={signupForm.formState.errors.displayName?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  {...signupForm.register('email')}
                  error={signupForm.formState.errors.email?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register('password')}
                  error={signupForm.formState.errors.password?.message}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register('confirmPassword')}
                  error={signupForm.formState.errors.confirmPassword?.message}
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={signupForm.formState.isSubmitting}
                >
                  Create account
                </Button>
              </form>
            )}

            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <Button variant="outline" className="w-full" onClick={onGoogle}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-blue-600 font-medium hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-blue-600 font-medium hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
