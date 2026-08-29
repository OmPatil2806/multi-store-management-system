import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Logo from '@/components/Logo'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(identifier, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-4">
            <img
              src="/images/owner-avatar.jpg"
              alt=""
              className="size-24 rounded-full border-2 border-border object-cover shadow-md"
            />
            <Logo />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Manage your stores from one dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier">Email or Employee Code</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="owner@example.com or GRO-0001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right: rotating hero, hidden below lg since there's no room to show it well */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <img src="/images/grocery-hero-1.webp" alt="" className="absolute inset-0 size-full object-cover" />
        <img
          src="/images/electronics-hero-2.jpg"
          alt=""
          className="absolute inset-0 size-full animate-hero-fade object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/20" />

        <div className="relative z-10 flex h-full flex-col justify-end p-12">
          <Logo size="lg" light />
          <p className="mt-4 max-w-sm text-sm text-white/80">
            One platform for every store — products, staff, and sales, all in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
