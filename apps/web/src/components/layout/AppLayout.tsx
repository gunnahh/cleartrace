import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Menu,
  UserRound,
  X,
  Search,
} from 'lucide-react'
import { IconButton, Tooltip } from '@radix-ui/themes'

const CollapsedTooltip = ({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean
  label: string
  children: ReactNode
}) =>
  collapsed ? (
    <Tooltip content={label} side="right">
      {children}
    </Tooltip>
  ) : (
    children
  )

const Nav = ({ close, collapsed = false }: { close?: () => void; collapsed?: boolean }) => (
  <nav aria-label="Primary">
    <Link className="brand" to="/" onClick={close} aria-label="ClearTrace home">
      <span className="brandmark">
        <Search size={18} />
      </span>
      <span className="brand-label">
        ClearTrace<small>Research workspace</small>
      </span>
    </Link>
    <CollapsedTooltip collapsed={collapsed} label="Assignments">
      <Link
        aria-label="Assignments"
        onClick={close}
        to="/assignments"
        search={{ q: '', status: 'ALL' }}
        activeProps={{ className: 'active' }}
      >
        <ClipboardList />
        <span className="nav-label">Assignments</span>
      </Link>
    </CollapsedTooltip>
    <CollapsedTooltip collapsed={collapsed} label="Submitted reports">
      <Link
        aria-label="Submitted reports"
        onClick={close}
        to="/reports/submitted"
        activeProps={{ className: 'active' }}
      >
        <FileCheck2 />
        <span className="nav-label">Submitted reports</span>
      </Link>
    </CollapsedTooltip>
    <CollapsedTooltip collapsed={collapsed} label="Profile">
      <Link
        aria-label="Profile"
        onClick={close}
        to="/profile"
        activeProps={{ className: 'active' }}
      >
        <UserRound />
        <span className="nav-label">Profile</span>
      </Link>
    </CollapsedTooltip>
  </nav>
)

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem('cleartrace.sidebar-collapsed') === 'true',
  )

  useEffect(() => {
    window.localStorage.setItem('cleartrace.sidebar-collapsed', String(collapsed))
  }, [collapsed])

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside aria-label="Application sidebar">
        <Nav collapsed={collapsed} />
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <IconButton
            className="sidebar-toggle"
            variant="soft"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
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
