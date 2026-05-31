import type { ReactNode } from 'react'

type V0StudioLayoutProps = {
  children: ReactNode
  /** Narrow dashboard (feedback) vs wider practice stack */
  width?: 'dashboard' | 'studio'
}

/**
 * v0 page column — matches exported dashboard min-h-screen + max-w stack.
 */
export function V0StudioLayout({
  children,
  width = 'studio',
}: V0StudioLayoutProps) {
  const maxWidth = width === 'dashboard' ? 'max-w-2xl' : 'max-w-3xl'

  return (
    <div className={`mx-auto w-full ${maxWidth} space-y-6 px-4 py-8 sm:px-6`}>
      {children}
    </div>
  )
}
