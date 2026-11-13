import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'

import Logo from '@/components/common/Logo'
import Container from '@/components/common/Container'
import { APP } from '@/constants/app'
import { ROUTES } from '@/routes/paths'

const COPYRIGHT_YEAR = new Date().getFullYear()

const PLATFORM_LINKS = [
  { label: 'Student portal', to: ROUTES.student },
  { label: 'Journey planner', to: ROUTES.planner },
  { label: 'Smart pooling', to: ROUTES.pooling },
  { label: 'Provider portal', to: ROUTES.provider },
  { label: 'Admin portal', to: ROUTES.admin },
]

const COMPANY_LINKS = [
  { label: 'About ROUTENEX', to: `${ROUTES.home}#about` },
  { label: 'Platform features', to: `${ROUTES.home}#features` },
  { label: 'How it works', to: `${ROUTES.home}#how-it-works` },
  { label: 'Contact', to: `${ROUTES.home}#contact` },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: ROUTES.privacy },
  { label: 'Terms of Service', to: ROUTES.terms },
]

export default function Footer() {
  return (
    <footer className="bg-pine-950 text-pine-100">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-pine-200/80">
              {APP.description}
            </p>
            <ul className="mt-5 space-y-2 text-xs text-pine-200/75">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {APP.address}
              </li>
              <li>
                <a
                  href={`mailto:${APP.supportEmail}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Mail className="size-3.5" aria-hidden="true" />
                  {APP.supportEmail}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${APP.supportPhone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {APP.supportPhone}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Platform">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-pine-300 uppercase">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-pine-100/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-pine-300 uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-pine-100/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-xs font-semibold tracking-[0.16em] text-pine-300 uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-pine-100/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={ROUTES.login}
                  className="text-sm text-pine-100/75 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-pine-200/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {APP.name}. All rights reserved.
          </p>
          <p className="max-w-xl md:text-right">
            Fares, seats, provider availability and schedules shown in the demo are clearly
            labelled sample data. Live weather is provided by Open-Meteo.
          </p>
        </div>
      </Container>
    </footer>
  )
}
