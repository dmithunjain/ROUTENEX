import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

import Container from '@/components/common/Container'
import { APP } from '@/constants/app'
import { ROUTES } from '@/routes/paths'

/**
 * Shared shell for legal documents (Privacy Policy, Terms of Service).
 * `sections` is an array of { id, heading, paragraphs, list }.
 */
export default function LegalDoc({ title, updated, intro, sections }) {
  return (
    <Container className="py-10 sm:py-14">
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-pine-800"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to home
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.3fr_0.7fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <span className="grid size-11 place-items-center rounded-2xl bg-pine-100 text-pine-800">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-xs text-slate-500">Last updated {updated}</p>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Questions about this document can be sent to{' '}
            <a
              href={`mailto:${APP.supportEmail}`}
              className="font-semibold text-pine-800 hover:underline"
            >
              {APP.supportEmail}
            </a>
            .
          </p>

          <nav aria-label="On this page" className="mt-6 hidden lg:block">
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              On this page
            </p>
            <ul className="mt-2 space-y-1.5">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-[11px] text-slate-500 hover:text-pine-800"
                  >
                    {index + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-relaxed text-slate-600">{intro}</p>

          <div className="mt-8 space-y-8">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {index + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2.5 text-xs leading-relaxed text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs leading-relaxed text-slate-600"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pine-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-relaxed text-amber-900">
            <strong className="font-semibold">Demo notice:</strong> this deployment is a
            demonstration build. Transport records, fares, seat counts and provider availability are
            labelled sample data, and no live payments are processed.
          </div>
        </article>
      </div>
    </Container>
  )
}
