import { useState } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import JourneyOptionCard from '@/components/journey/JourneyOptionCard'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import { answerTravelQuery } from '@/services/assistantService'
import { todayISO } from '@/services/transportService'

const SUGGESTIONS = [
  'How do I get from Thandalam to College at 8 am?',
  'Which buses are cancelled today?',
  'Is an EV available near Kattupakkam?',
  'Who can I pool with?',
  'What is the cheapest way to college from Salavakkam?',
]

function AssistantMessage({ message }) {
  const payload = message.payload
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-pine-900 text-pine-100">
        <Bot className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{payload.text}</p>

        {payload.kind === 'plan' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Grounded in shared schedule data</Badge>
            <Link
              to={`${ROUTES.planner}?originStopId=${payload.origin.id}&destinationStopId=${payload.destination.id}&date=${todayISO()}&seats=1`}
              className="text-xs font-semibold text-pine-700 hover:underline"
            >
              Open full planner
            </Link>
          </div>
        )}

        {payload.kind === 'cancellations' && payload.cancellations?.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {payload.cancellations.map((item) => (
              <li key={item.id} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {item.route?.code} · {item.route?.name} · scheduled {item.departureTime} ·{' '}
                {item.note || 'no reason recorded'}
              </li>
            ))}
          </ul>
        )}

        {payload.kind === 'ev' && payload.nearby?.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {payload.nearby.map((item) => (
              <li key={item.vehicle.id} className="rounded-lg bg-sand-100 px-3 py-2 text-xs text-slate-700">
                {item.provider.name} · {item.vehicle.kind === 'ev-auto' ? 'EV auto' : 'EV two-wheeler'} at{' '}
                {item.pickup.name} · {item.distanceKm.toFixed(1)} km · {item.vehicle.capacity} legal seat
                {item.vehicle.capacity > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        )}

        {payload.kind === 'pooling' && payload.results?.length > 0 && (
          <div className="mt-2 space-y-2">
            {payload.results.map((result) => (
              <div key={result.request.id} className="rounded-lg bg-sand-100 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-800">
                  {result.matches.length} match{result.matches.length === 1 ? '' : 'es'} for{' '}
                  {result.request.departAfter} · seats {result.request.seats}
                </p>
                <p className="mt-0.5">
                  {result.matches.map((match) => match.student?.name).filter(Boolean).join(', ') || 'No named matches'}
                </p>
              </div>
            ))}
          </div>
        )}

        {payload.kind === 'plan' && payload.options?.length > 0 && (
          <div className="mt-3 space-y-3">
            {payload.options.slice(0, 3).map((option) => (
              <JourneyOptionCard key={option.id} option={option} />
            ))}
            {payload.options.length > 3 && (
              <p className="text-xs text-slate-500">Plus {payload.options.length - 3} more options in the full planner.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const { db } = useAppData()
  const student = useCurrentStudent()
  useDocumentTitle('AI travel assistant')

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      payload: {
        kind: 'help',
        text:
          'Hello! I am the ROUTENEX travel assistant. I only use the current application data — schedules, verified EV providers, cancellations and your pooling requests. Ask me about a journey, an EV, a cancellation or travel partners.',
      },
    },
  ])
  const [input, setInput] = useState('')

  const send = (text) => {
    const query = (text ?? input).trim()
    if (!query) return
    const payload = answerTravelQuery(db, query, {
      studentId: student?.id,
      date: todayISO(),
    })
    setMessages((previous) => [
      ...previous,
      { id: `user-${previous.length}`, role: 'user', text: query },
      { id: `assistant-${previous.length}`, role: 'assistant', payload },
    ])
    setInput('')
  }

  return (
    <PortalPage>
      <PageHeader
        title="AI travel assistant"
        description="Ask natural-language questions. Every answer is computed from the shared ROUTENEX data using a deterministic, grounded assistant — it cannot invent routes, providers, prices or availability."
        tabs={studentTabs(ROUTES.assistant)}
        actions={<Badge tone="amber">Grounded · no external LLM key</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-pine-700" aria-hidden="true" />
              <h2 className="font-display text-sm font-semibold text-slate-900">Try asking</h2>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-xl border border-slate-200 bg-sand-50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-pine-300 hover:bg-pine-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-sm font-semibold text-slate-900">How it is grounded</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              <li>Journeys call the same planner service as the UI.</li>
              <li>EV answers require a verified provider marked available.</li>
              <li>Cancellations come from the admin-managed schedule records.</li>
              <li>Pooling answers use the shared 45-minute / 2.5 km match rules.</li>
              <li>No live availability or fare is invented. All data is labelled sample.</li>
            </ul>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
              An external LLM can be connected later through a server-side proxy. This demo intentionally uses a deterministic
              assistant so it never claims unsupported availability.
            </p>
          </section>
        </aside>

        <section className="flex min-h-[560px] flex-col rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine-400 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-pine-500" />
              </span>
              <p className="text-xs font-semibold text-slate-700">ROUTENEX assistant</p>
            </div>
            <span className="text-[10px] text-slate-400">Sample data · {student?.name}</span>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end gap-3">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-pine-900 px-4 py-2.5 text-sm text-white">
                    {message.text}
                  </div>
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-sand-200 text-slate-600">
                    <User className="size-4" aria-hidden="true" />
                  </span>
                </div>
              ) : (
                <AssistantMessage key={message.id} message={message} />
              ),
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
            className="flex items-end gap-2 border-t border-slate-100 p-4"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Ask the travel assistant
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a journey, EV, cancellation or travel partner…"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
            />
            <Button type="submit" size="sm" disabled={!input.trim()}>
              <Send className="size-3.5" aria-hidden="true" />
              Send
            </Button>
          </form>
        </section>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Assistant output is informational. Verify schedules and fares with the transport provider. Estimated values are
        derived from sample data, not live feeds.
      </p>
    </PortalPage>
  )
}
