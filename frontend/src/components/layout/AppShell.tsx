import type { ReactNode } from 'react'

import { Header } from './Header'

export interface AppShellProps {
  /** Page content rendered below the header. */
  children: ReactNode
}

/** Application frame: sticky header plus a centered main content area. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-3 sm:px-6">
        {children}
      </main>
    </div>
  )
}
