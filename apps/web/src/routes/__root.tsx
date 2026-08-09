import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <Outlet />
    </>
  )
}
