import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import client from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordDialog({ open, onOpenChange, employee }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
    }
  }, [open])

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await client.put(`/employees/${employee.id}/reset-password`, { new_password: password })
      toast.success(`Password reset for ${employee.employee_code}`)
      onOpenChange(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {employee?.name} ({employee?.employee_code}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Reset password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
