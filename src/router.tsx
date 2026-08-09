import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { Shell } from './app/Shell'
import { AssignmentsPage } from './features/assignments/AssignmentsPage'
import { NewAssignmentPage } from './features/assignments/NewAssignmentPage'
import { AssignmentPage } from './features/research/AssignmentPage'
import { ReportPage } from './features/reports/ReportPage'
import { SimplePage, LoginPage } from './app/SimplePages'
const root = createRootRoute({
  component: () => (
    <>
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <Outlet />
    </>
  ),
})
const app = createRoute({ getParentRoute: () => root, id: 'app', component: Shell })
const login = createRoute({ getParentRoute: () => root, path: '/login', component: LoginPage })
const index = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/assignments', search: { q: '', status: 'ALL' } })
  },
})
const assignments = createRoute({
  getParentRoute: () => app,
  path: '/assignments',
  component: AssignmentsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === 'string' ? s.q : '',
    status: typeof s.status === 'string' ? s.status : 'ALL',
  }),
})
const add = createRoute({
  getParentRoute: () => app,
  path: '/assignments/new',
  component: NewAssignmentPage,
})
const detail = createRoute({
  getParentRoute: () => app,
  path: '/assignments/$assignmentId',
  component: AssignmentPage,
})
const report = createRoute({
  getParentRoute: () => app,
  path: '/assignments/$assignmentId/report',
  component: ReportPage,
})
const submitted = createRoute({
  getParentRoute: () => app,
  path: '/reports/submitted',
  component: () => (
    <SimplePage
      title="Submitted reports"
      text="Completed reports are retained here for reference."
    />
  ),
})
const profile = createRoute({
  getParentRoute: () => app,
  path: '/profile',
  component: () => <SimplePage title="Profile" text="Freelance researcher · Bangkok (UTC+7)" />,
})
const routeTree = root.addChildren([
  index,
  login,
  app.addChildren([assignments, add, detail, report, submitted, profile]),
])
export const router = createRouter({ routeTree })
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
