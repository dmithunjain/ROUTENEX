import { useState } from 'react'
import {
  Bus,
  CheckCircle2,
  Pencil,
  Phone,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import { useAppData } from '@/context/AppDataContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'

const emptyProvider = {
  name: '',
  type: 'ev',
  contact: '',
  phone: '',
  verified: false,
  available: true,
  serviceAreas: [],
}

export default function AdminProvidersPage() {
  const { db, addProvider, updateProvider, verifyProvider, deleteProvider } = useAppData()
  useDocumentTitle('Admin · providers')

  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('all')

  const providers = db.providers.filter((provider) => {
    if (filter === 'ev') return provider.type === 'ev'
    if (filter === 'bus') return provider.type === 'bus'
    if (filter === 'unverified') return !provider.verified
    return true
  })

  const openProvider = (provider) => {
    setEditor(
      provider
        ? {
            id: provider.id,
            form: {
              name: provider.name,
              type: provider.type,
              contact: provider.contact ?? '',
              phone: provider.phone ?? '',
              verified: Boolean(provider.verified),
              available: provider.available !== false,
              serviceAreas: provider.serviceAreas ?? [],
            },
          }
        : {
            id: null,
            form: {
              ...emptyProvider,
              serviceAreas: db.villages[0] ? [db.villages[0].id] : [],
            },
          },
    )
  }

  const saveProvider = (event) => {
    event.preventDefault()
    const form = editor.form
    if (!form.name.trim()) {
      setNotice('Provider name is required.')
      return
    }
    if (!form.serviceAreas.length) {
      setNotice('Choose at least one service area so vehicles can be matched.')
      return
    }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      verified: Boolean(form.verified),
      available: Boolean(form.available),
      serviceAreas: form.serviceAreas,
    }
    if (editor.id) updateProvider(editor.id, payload)
    else addProvider(payload)
    setNotice(
      editor.id
        ? 'Provider updated. Student EV search reflects verification and availability immediately.'
        : 'Provider added. Verify it before its vehicles can appear in student search.',
    )
    setEditor(null)
  }

  const removeProvider = (provider) => {
    const vehicles = db.vehicles.filter((vehicle) => vehicle.providerId === provider.id)
    const routes = db.routes.filter((route) => route.providerId === provider.id)
    if (vehicles.length || routes.length) {
      setNotice(
        `Cannot delete ${provider.name}: ${vehicles.length} vehicle(s) and ${routes.length} route(s) still reference it. Reassign or delete those first.`,
      )
      return
    }
    if (!window.confirm(`Delete provider ${provider.name}?`)) return
    deleteProvider(provider.id)
    setNotice('Provider deleted from the shared transport data.')
  }

  const toggleServiceArea = (villageId) => {
    setEditor((previous) => ({
      ...previous,
      form: {
        ...previous.form,
        serviceAreas: previous.form.serviceAreas.includes(villageId)
          ? previous.form.serviceAreas.filter((id) => id !== villageId)
          : [...previous.form.serviceAreas, villageId],
      },
    }))
  }

  return (
    <PortalPage>
      <PageHeader
        title="Transport providers"
        description="Verify bus operators and community EV providers, control their availability and define service areas. Verification and availability directly control which vehicles students can find."
        tabs={adminTabs(ROUTES.adminProviders)}
        actions={
          <Button size="sm" onClick={() => openProvider(null)}>
            <Plus className="size-3.5" aria-hidden="true" /> Add provider
          </Button>
        }
      />

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Providers" value={db.providers.length} icon={Users} />
        <StatCard
          label="Verified"
          value={db.providers.filter((provider) => provider.verified).length}
          hint="Visible in student EV search"
          icon={ShieldCheck}
        />
        <StatCard
          label="EV providers"
          value={db.providers.filter((provider) => provider.type === 'ev').length}
          hint="Community network"
          icon={Power}
          tone="bg-amber-100 text-amber-800"
        />
        <StatCard
          label="Awaiting verification"
          value={db.providers.filter((provider) => !provider.verified).length}
          hint="Hidden from students"
          icon={XCircle}
          tone="bg-red-100 text-red-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All providers' },
          { id: 'ev', label: 'EV only' },
          { id: 'bus', label: 'Bus operators' },
          { id: 'unverified', label: 'Unverified' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item.id
                ? 'bg-pine-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sand-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {providers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No providers in this view"
          description="Change the filter or add a transport provider."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((provider) => {
            const vehicles = db.vehicles.filter((vehicle) => vehicle.providerId === provider.id)
            const routes = db.routes.filter((route) => route.providerId === provider.id)
            return (
              <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-sm font-semibold text-slate-900">
                        {provider.name}
                      </h2>
                      <Badge tone={provider.verified ? 'pine' : 'amber'}>
                        {provider.verified ? (
                          <>
                            <ShieldCheck className="size-3" aria-hidden="true" /> Verified
                          </>
                        ) : (
                          'Unverified'
                        )}
                      </Badge>
                      {!provider.available && <Badge tone="neutral">Unavailable</Badge>}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        {provider.type === 'ev' ? (
                          <Power className="size-3" aria-hidden="true" />
                        ) : (
                          <Bus className="size-3" aria-hidden="true" />
                        )}
                        {provider.type === 'ev' ? 'Community EV' : 'Bus operator'}
                      </span>
                      {provider.contact && <span>· {provider.contact}</span>}
                      {provider.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" aria-hidden="true" /> {provider.phone}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openProvider(provider)}
                      aria-label={`Edit ${provider.name}`}
                      className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProvider(provider)}
                      aria-label={`Delete ${provider.name}`}
                      className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(provider.serviceAreas ?? []).map((villageId) => (
                    <span
                      key={villageId}
                      className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {db.villages.find((village) => village.id === villageId)?.name ?? villageId}
                    </span>
                  ))}
                  {!provider.serviceAreas?.length && (
                    <span className="text-[11px] text-slate-400">No service areas</span>
                  )}
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  {vehicles.length} vehicle(s) · {routes.length} route(s) ·{' '}
                  {db.schedules.filter((schedule) => schedule.busId && vehicles.some((vehicle) => vehicle.id === schedule.busId)).length}{' '}
                  schedule(s)
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {provider.verified ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => verifyProvider(provider.id, false)}
                    >
                      <XCircle className="size-3.5" aria-hidden="true" /> Remove verification
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => verifyProvider(provider.id, true)}>
                      <CheckCircle2 className="size-3.5" aria-hidden="true" /> Verify provider
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateProvider(provider.id, { available: !provider.available })}
                  >
                    <Power className="size-3.5" aria-hidden="true" />
                    {provider.available ? 'Set unavailable' : 'Set available'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openProvider(provider)}>
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit
                  </Button>
                </div>

                <p className="mt-3 rounded-xl bg-sand-100/70 px-3 py-2 text-[10px] leading-relaxed text-slate-600">
                  Student EV search requires: provider verified, provider available, vehicle
                  available, pickup in a service area, within 3 km and inside the vehicle range.
                </p>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Edit provider' : 'Add transport provider'}
        description="Verification controls whether this provider's vehicles appear in student EV search."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="provider-admin-form">
              Save provider
            </Button>
          </>
        }
      >
        {editor && (
          <form id="provider-admin-form" onSubmit={saveProvider} className="grid gap-3 sm:grid-cols-2">
            <Field label="Provider name" className="sm:col-span-2">
              <Input
                value={editor.form.name}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, name: event.target.value } })
                }
                required
              />
            </Field>
            <Field label="Provider type">
              <Select
                value={editor.form.type}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, type: event.target.value } })
                }
              >
                <option value="ev">Community EV provider</option>
                <option value="bus">Bus operator</option>
              </Select>
            </Field>
            <Field label="Contact person">
              <Input
                value={editor.form.contact}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, contact: event.target.value } })
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={editor.form.phone}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, phone: event.target.value } })
                }
              />
            </Field>
            <div className="flex flex-col justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={editor.form.verified}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      form: { ...editor.form, verified: event.target.checked },
                    })
                  }
                  className="size-4 rounded border-slate-300 text-pine-600"
                />
                Verified
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={editor.form.available}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      form: { ...editor.form, available: event.target.checked },
                    })
                  }
                  className="size-4 rounded border-slate-300 text-pine-600"
                />
                Available for matching
              </label>
            </div>
            <Field label="Service areas" className="sm:col-span-2">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 p-3">
                {db.villages.map((village) => (
                  <label key={village.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={editor.form.serviceAreas.includes(village.id)}
                      onChange={() => toggleServiceArea(village.id)}
                      className="size-3.5 rounded border-slate-300 text-pine-600"
                    />
                    {village.name}
                  </label>
                ))}
              </div>
            </Field>
          </form>
        )}
      </Modal>
    </PortalPage>
  )
}
