import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function NewEmployeeCredentialsDialog({ employee, onClose }) {
  return (
    <Dialog open={Boolean(employee)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Employee created</DialogTitle>
          <DialogDescription>
            {employee?.name} logs in with the employee code below and the password you just set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 rounded-md bg-muted px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Employee code</span>
            <span className="font-mono font-medium">{employee?.employee_code}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Share both the code and the password with them — this is the only time the code is shown here.
        </p>

        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
