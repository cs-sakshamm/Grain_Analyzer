import type { ReactNode } from 'react'

import { Header } from './Header'

export interface AppShellProps {
  /** Page content rendered below the header. */
  children: ReactNode
  /** Global actions shown on the right side of the header. */
  headerActions?: ReactNode
}

/** Application frame: sticky header plus a centered main content area. */
export function AppShell({ children, headerActions }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <Header actions={headerActions} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
