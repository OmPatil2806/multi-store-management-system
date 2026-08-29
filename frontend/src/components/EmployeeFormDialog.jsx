import { useEffect, useState } from 'react'

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STORES } from '@/lib/stores'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  role_title: '',
  salary: '',
  store_id: String(STORES[0].id),
  initial_password: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form, isEditing) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!form.date_of_birth) errors.date_of_birth = 'Date of birth is required'
  if (!form.store_id) errors.store_id = 'Store is required'
  if (form.salary !== '' && (Number.isNaN(Number(form.salary)) || Number(form.salary) < 0)) {
    errors.salary = 'Salary must be a non-negative number'
  }
  if (!isEditing && form.initial_password.trim().length < 6) {
    errors.initial_password = 'Password must be at least 6 characters'
  }

  return errors
}

export default function EmployeeFormDialog({ open, onOpenChange, employee, onSaved }) {
  const isEditing = Boolean(employee)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setApiError(null)
    if (employee) {
      setForm({
        name: employee.name ?? '',
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        date_of_birth: employee.date_of_birth ?? '',
        role_title: employee.role_title ?? '',
        salary: employee.salary != null ? String(employee.salary) : '',
        store_id: String(employee.store_id),
        initial_password: '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, employee])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validate(form, isEditing)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setApiError(null)
    setIsSubmitting(true)

    const basePayload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim(),
      date_of_birth: form.date_of_birth,
      role_title: form.role_title.trim() || null,
      salary: form.salary === '' ? null : Number(form.salary),
      store_id: Number(form.store_id),
    }

    try {
      if (isEditing) {
        await client.put(`/employees/${employee.id}`, basePayload)
        onSaved()
      } else {
        const response = await client.post('/employees', {
          ...basePayload,
          initial_password: form.initial_password,
        })
        onSaved(response.data)
      }
      onOpenChange(false)
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this employee’s details.'
              : 'A unique employee code will be generated automatically.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setField('date_of_birth', e.target.value)}
              />
              {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="role_title">Role / Title</Label>
              <Input id="role_title" value={form.role_title} onChange={(e) => setField('role_title', e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={form.salary}
                onChange={(e) => setField('salary', e.target.value)}
              />
              {errors.salary && <p className="text-xs text-destructive">{errors.salary}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store_id">Store</Label>
              <Select value={form.store_id} onValueChange={(value) => setField('store_id', value)}>
                <SelectTrigger id="store_id" className="w-full">
                  <SelectValue>
                    {STORES.find((s) => String(s.id) === form.store_id)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.store_id && <p className="text-xs text-destructive">{errors.store_id}</p>}
            </div>

            {!isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="initial_password">Initial Password</Label>
                <Input
                  id="initial_password"
                  type="text"
                  value={form.initial_password}
                  onChange={(e) => setField('initial_password', e.target.value)}
                />
                {errors.initial_password && (
                  <p className="text-xs text-destructive">{errors.initial_password}</p>
                )}
              </div>
            )}
          </div>

          {apiError && <p className="text-sm text-destructive">{apiError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
