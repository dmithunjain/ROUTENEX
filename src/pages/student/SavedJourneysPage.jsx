import { Bookmark, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'

const MODE_LABEL = {
  walk: 'Walk',
  bus: 'Bus',
  'ev-auto': 'EV auto',
  'ev-two-wheeler': 'EV two-wheeler',
}

export default function SavedJourneysPage() {
  const { db, deleteSavedJourney } = useAppData()
  const student = useCurrentStudent()
  useDocumentTitle('Saved journeys')

  const journeys = db.savedJourneys
    .filter((journey) => journey.studentId === student?.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  return (
    <PortalPage>
      <PageHeader
        title="Saved journeys"
        description="Journeys saved from the planner with their estimated fare, duration and segments. Availability can change — re-plan before travelling."
        tabs={studentTabs(ROUTES.saved)}
        actions={
          <Button to={ROUTES.planner} size="sm" variant="secondary">
            Plan a new journey
          </Button>
        }
      />

      {journeys.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved journeys"
          description="Save a bus, EV or multi-modal option from the journey planner and it will appear here for quick access."
          action={
            <Button to={ROUTES.planner} size="sm" className="mt-4">
              Open journey planner
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {journeys.map((journey) => (
            <article key={journey.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-slate-900">{journey.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {journey.date} · {journey.durationMin} min · ₹{journey.totalFare} estimated ·{' '}
                    {journey.transfers} transfer{journey.transfers === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSavedJourney(journey.id)}
                  aria-label={`Delete ${journey.label}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(journey.modes ?? []).map((mode) => (
                  <span key={mode} className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {MODE_LABEL[mode] ?? mode}
                  </span>
                ))}
              </div>

              <ol className="mt-4 space-y-2">
                {(journey.segments ?? []).map((segment, index) => (
                  <li key={`${segment.fromName}-${index}`} className="rounded-xl border border-slate-100 bg-sand-50/60 px-3 py-2">
                    <p className="text-xs font-medium text-slate-800">
                      {segment.fromName} → {segment.toName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {segment.depart}–{segment.arrive} · {segment.detail}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Sample estimate · re-check before travel</span>
                <Link to={ROUTES.planner} className="text-xs font-semibold text-pine-700 hover:underline">
                  Re-plan
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
