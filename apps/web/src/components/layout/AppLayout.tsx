import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  LogOut,
  Menu,
  UserRound,
  X,
  Search,
} from 'lucide-react'
import { IconButton, Tooltip } from '@radix-ui/themes'
import { authApi } from '../../features/auth/api'

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

const Nav = ({
  close,
  collapsed = false,
  onLogout,
}: {
  close?: () => void
  collapsed?: boolean
  onLogout: () => void
}) => (
  <nav className="sidebar-nav" aria-label="Primary">
    <Link className="sidebar-brand" to="/" onClick={close} aria-label="ClearTrace home">
      <span className="sidebar-brand__mark" aria-hidden="true">
        <Search size={18} />
      </span>
      <span className="sidebar-brand__label">
        ClearTrace<small>Research workspace</small>
      </span>
    </Link>
    <span className="sidebar-nav__section-label">Workspace</span>
    <CollapsedTooltip collapsed={collapsed} label="Assignments">
      <Link
        aria-label="Assignments"
        onClick={close}
        to="/assignments"
        search={{ q: '', status: 'ALL' }}
        activeOptions={{ includeSearch: false }}
        activeProps={{ className: 'active', 'aria-current': 'page' }}
      >
        <span className="sidebar-nav__icon" aria-hidden="true">
          <ClipboardList />
        </span>
        <span className="nav-label">Assignments</span>
      </Link>
    </CollapsedTooltip>
    <CollapsedTooltip collapsed={collapsed} label="Submitted reports">
      <Link
        aria-label="Submitted reports"
        onClick={close}
        to="/reports/submitted"
        activeProps={{ className: 'active', 'aria-current': 'page' }}
      >
        <span className="sidebar-nav__icon" aria-hidden="true">
          <FileCheck2 />
        </span>
        <span className="nav-label">Submitted reports</span>
      </Link>
    </CollapsedTooltip>
    <CollapsedTooltip collapsed={collapsed} label="Profile">
      <Link
        aria-label="Profile"
        onClick={close}
        to="/profile"
        activeProps={{ className: 'active', 'aria-current': 'page' }}
      >
        <span className="sidebar-nav__icon" aria-hidden="true">
          <UserRound />
        </span>
        <span className="nav-label">Profile</span>
      </Link>
    </CollapsedTooltip>
    <div className="sidebar-nav__account">
      <span className="sidebar-nav__account-label">Account</span>
      <CollapsedTooltip collapsed={collapsed} label="Log out">
        <button
          type="button"
          aria-label="Log out"
          onClick={() => {
            close?.()
            onLogout()
          }}
        >
          <span className="sidebar-nav__icon" aria-hidden="true">
            <LogOut />
          </span>
          <span className="nav-label">Log out</span>
        </button>
      </CollapsedTooltip>
    </div>
  </nav>
)

export function AppLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem('cleartrace.sidebar-collapsed') === 'true',
  )
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem('cleartrace.sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      await navigate({ to: '/login' })
    }
  }

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar" id="application-sidebar" aria-label="Application sidebar">
        <Nav collapsed={collapsed} onLogout={logout} />
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <IconButton
            className="sidebar-toggle"
            variant="soft"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-controls="application-sidebar"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </aside>
      <header className="mobilebar">
        <div className="mobilebar__brand" aria-label="ClearTrace">
          <span className="mobilebar__brandmark" aria-hidden="true">
            <Search size={16} />
          </span>
          <span>
            ClearTrace<small>Research workspace</small>
          </span>
        </div>
        <Dialog.Root open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
          <Dialog.Trigger asChild>
            <IconButton className="mobilebar__trigger" variant="soft" aria-label="Open navigation">
              <Menu />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="overlay sidebar-drawer-overlay" />
            <Dialog.Content className="sidebar-drawer">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Dialog.Description className="sr-only">
                Navigate between ClearTrace workspaces and account settings.
              </Dialog.Description>
              <Dialog.Close asChild>
                <IconButton
                  className="sidebar-drawer__close"
                  variant="soft"
                  aria-label="Close navigation"
                >
                  <X />
                </IconButton>
              </Dialog.Close>
              <Nav close={() => setMobileNavigationOpen(false)} onLogout={logout} />
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
