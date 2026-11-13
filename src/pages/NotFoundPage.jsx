import { Compass, Home } from 'lucide-react'

import Button from '@/components/common/Button'
import Container from '@/components/common/Container'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-pine-100 text-pine-800">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-xs font-semibold tracking-[0.18em] text-pine-600 uppercase">
        404 · Off route
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-slate-900">
        This destination is not on the map yet.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The address you followed does not match a ROUTENEX screen. Head back to the homepage to
        continue planning your journey.
      </p>
      <Button to="/" className="mt-8">
        <Home className="size-4" aria-hidden="true" />
        Back to home
      </Button>
    </Container>
  )
}
