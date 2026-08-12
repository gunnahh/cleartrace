import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button, Flex, Theme } from '@radix-ui/themes'

type DeleteConfirmationDialogProps = {
  open: boolean
  title: string
  description: string
  pending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConfirmationDialog({
  open,
  title,
  description,
  pending = false,
  onOpenChange,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <Theme>
          <AlertDialog.Overlay className="overlay" />
          <AlertDialog.Content className="dialog delete-confirmation-dialog">
            <AlertDialog.Title>{title}</AlertDialog.Title>
            <AlertDialog.Description>{description}</AlertDialog.Description>
            <Flex className="delete-confirmation-actions" gap="3" justify="end">
              <AlertDialog.Cancel asChild>
                <Button variant="soft" color="gray" disabled={pending}>
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button color="red" disabled={pending} onClick={onConfirm}>
                  {pending ? 'Deleting…' : 'Delete'}
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </Theme>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
