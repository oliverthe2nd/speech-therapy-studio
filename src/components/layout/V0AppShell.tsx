import type { ReactNode } from 'react'

type V0AppShellProps = {
  children: ReactNode
}

/**
 * Root shell from _v0-import/app/layout.tsx — dark studio canvas + side rails.
 */
export function V0AppShell({ children }: V0AppShellProps) {
  return (
    <div className="studio-shell font-sans antialiased">
      {children}
    </div>
  )
}
