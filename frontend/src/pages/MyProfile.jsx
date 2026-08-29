import { useEffect, useState } from 'react'

import client from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStoreName } from '@/lib/stores'

const FIELDS = [
  { key: 'employee_code', label: 'Employee Code' },
  { key: 'name', label: 'Name' },
  { key: 'role_title', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'store', label: 'Store' },
]

export default function MyProfile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    client
      .get('/employees/me')
      .then((response) => setProfile(response.data))
      .catch(() => setError('Failed to load your profile.'))
  }, [])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const values = { ...profile, store: getStoreName(profile.store_id) || '—' }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{profile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3 text-sm">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex justify-between border-b border-border pb-2 last:border-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{values[key] || '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
