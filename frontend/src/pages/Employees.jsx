import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KeyRound, Plus, UserX } from 'lucide-react'

import { useAuth } from '@/auth/AuthContext'
import client from '@/api/client'
import { Button } from '@/components/ui/button'
import DataTable from '@/components/DataTable'
import EmployeeFormDialog from '@/components/EmployeeFormDialog'
import NewEmployeeCredentialsDialog from '@/components/NewEmployeeCredentialsDialog'
import ResetPasswordDialog from '@/components/ResetPasswordDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getStoreName } from '@/lib/stores'

export default function Employees() {
  const { role } = useAuth()

  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [newEmployee, setNewEmployee] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await client.get('/employees')
      setEmployees(response.data)
    } catch {
      setError('Failed to load employees.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'owner') fetchEmployees()
  }, [role, fetchEmployees])

  // Belt-and-suspenders: the backend already 403s a non-owner on every
  // /employees endpoint, but an employee shouldn't even see this page shell.
  if (role !== 'owner') {
    return <Navigate to="/my-profile" replace />
  }

  function openAddDialog() {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  function openEditDialog(employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  function handleSaved(createdEmployee) {
    fetchEmployees()
    if (createdEmployee) {
      setNewEmployee(createdEmployee)
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    try {
      await client.delete(`/employees/${deactivateTarget.id}`)
      toast.success(`${deactivateTarget.name} deactivated`)
      setDeactivateTarget(null)
      fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate employee.')
    } finally {
      setIsDeactivating(false)
    }
  }

  const columns = [
    { key: 'employee_code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'role_title', header: 'Role', render: (row) => row.role_title || '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'email', header: 'Email' },
    {
      key: 'store_id',
      header: 'Store',
      accessor: (row) => getStoreName(row.store_id),
      render: (row) => getStoreName(row.store_id),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (row) => (row.salary != null ? `$${Number(row.salary).toFixed(2)}` : '—'),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      searchable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Reset password"
            onClick={(e) => {
              e.stopPropagation()
              setResetTarget(row)
            }}
          >
            <KeyRound className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Deactivate"
            onClick={(e) => {
              e.stopPropagation()
              setDeactivateTarget(row)
            }}
          >
            <UserX className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <Button onClick={openAddDialog}>
          <Plus className="size-4" />
          Add Employee
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          onRowClick={openEditDialog}
          searchPlaceholder="Search employees…"
        />
      )}

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editingEmployee}
        onSaved={handleSaved}
      />

      <NewEmployeeCredentialsDialog employee={newEmployee} onClose={() => setNewEmployee(null)} />

      {resetTarget && (
        <ResetPasswordDialog
          open={Boolean(resetTarget)}
          onOpenChange={(open) => !open && setResetTarget(null)}
          employee={resetTarget}
        />
      )}

      <AlertDialog open={Boolean(deactivateTarget)} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This employee will no longer be able to log in. Their record and history are kept, and you
              can view them later, but they lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} disabled={isDeactivating}>
              {isDeactivating ? 'Deactivating…' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
