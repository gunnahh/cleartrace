import { Link, Outlet } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { ClipboardList, FileCheck2, Menu, UserRound, X, Search } from 'lucide-react'
import { IconButton } from '@radix-ui/themes'
const Nav = ({ close }: { close?: () => void }) => (
  <nav aria-label="Primary">
    <div className="brand">
      <span className="brandmark">
        <Search size={18} />
      </span>
      <span>
        ClearTrace<small>Research workspace</small>
      </span>
    </div>
    <Link
      onClick={close}
      to="/assignments"
      search={{ q: '', status: 'ALL' }}
      activeProps={{ className: 'active' }}
    >
      <ClipboardList />
      Assignments
    </Link>
    <Link onClick={close} to="/reports/submitted" activeProps={{ className: 'active' }}>
      <FileCheck2 />
      Submitted reports
    </Link>
    <Link onClick={close} to="/profile" activeProps={{ className: 'active' }}>
      <UserRound />
      Profile
    </Link>
  </nav>
)
export function Shell() {
  return (
    <div className="app">
      <aside>
        <Nav />
      </aside>
      <header className="mobilebar">
        <strong>ClearTrace</strong>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <IconButton variant="soft" aria-label="Open navigation">
              <Menu />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="overlay" />
            <Dialog.Content className="drawer">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Dialog.Close asChild>
                <IconButton className="close" aria-label="Close navigation">
                  <X />
                </IconButton>
              </Dialog.Close>
              <Nav />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </div>
  )
}
