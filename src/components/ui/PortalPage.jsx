import Container from '@/components/common/Container'

/** Shared frame for every authenticated demo workspace screen. */
export default function PortalPage({ children }) {
  return (
    <Container className="py-8 sm:py-10">
      <div className="space-y-6">{children}</div>
    </Container>
  )
}
