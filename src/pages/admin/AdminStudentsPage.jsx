import { useState } from 'react'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import { getStop, getVillage } from '@/services/transportService'

const emptyStudent = {
  name: '',
  email: '',
  phone: '',
  college: 'Govt. Arts & Science College, Uthiramerur',
  villageId: 'v1',
  departurePreference: '08:00',
  budget: 50,
  emergencyContact: '',
}

export default function AdminStudentsPage() {
  const { db, addStudent, updateStudent, deleteStudent } = useAppData()
  useDocumentTitle('Admin · students')

  const [editor, setEditor] = useState(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const filtered = db.students.filter((student) => {
    const text = `${student.name} ${student.email} ${student.phone}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  const openStudent = (student) => {
    setEditor(
      student
        ? {
            id: student.id,
            form: {
              name: student.name,
              email: student.email,
              phone: student.phone ?? '',
              college: student.college,
              villageId: student.villageId,
              departurePreference: student.departurePreference ?? '08:00',
              budget: student.budget ?? 0,
              emergencyContact: student.emergencyContact ?? '',
            },
          }
        : { id: null, form: { ...emptyStudent, villageId: db.villages[0]?.id ?? 'v1' } },
    )
  }

  const saveStudent = (event) => {
    event.preventDefault()
    const form = editor.form
    if (!form.name.trim() || !form.email.trim()) {
      setNotice('Name and email are required.')
      return
    }
    const duplicate = db.students.some(
      (student) =>
        student.id !== editor.id &&
        student.email.trim().toLowerCase() === form.email.trim().toLowerCase(),
    )
    if (duplicate) {
      setNotice('A student with that email already exists.')
      return
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone,
      college: form.college.trim(),
      villageId: form.villageId,
      departurePreference: form.departurePreference,
      budget: Math.max(0, Number(form.budget) || 0),
      emergencyContact: form.emergencyContact,
    }
    if (editor.id) updateStudent(editor.id, payload)
    else addStudent(payload)
    setEditor(null)
    setNotice(editor.id ? 'Student updated.' : 'Student added to the shared data store.')
  }

  const removeStudent = (student) => {
    if (
      !window.confirm(
        `Delete ${student.name}? Their travel requests, ride requests and saved journeys will also be removed.`,
      )
    ) {
      return
    }
    deleteStudent(student.id)
    setNotice('Student and their linked requests were deleted.')
  }

  return (
    <PortalPage>
      <PageHeader
        title="Students"
        description="Manage student profiles, home villages and travel preferences. Deleting a student removes their linked travel requests, ride requests and saved journeys."
        tabs={adminTabs(ROUTES.adminStudents)}
        actions={
          <Button size="sm" onClick={() => openStudent(null)}>
            <Plus className="size-3.5" aria-hidden="true" /> Add student
          </Button>
        }
      />

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={db.students.length} icon={Users} />
        <StatCard
          label="Open travel requests"
          value={db.travelRequests.filter((request) => request.status === 'open').length}
          hint="Used by pooling matching"
          icon={Users}
          tone="bg-amber-100 text-amber-800"
        />
        <StatCard
          label="Saved journeys"
          value={db.savedJourneys.length}
          hint="Across all student profiles"
          icon={Users}
          tone="bg-blue-100 text-blue-700"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">Student records</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filtered.length} of {db.students.length} profiles
            </p>
          </div>
          <label className="relative">
            <span className="sr-only">Search students</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email or phone"
              className="w-64 pl-8"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Users}
            title="No matching students"
            description="Adjust the search or add a new student profile."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Contact</th>
                  <th className="py-2">Home village</th>
                  <th className="py-2">Departure</th>
                  <th className="py-2">Activity</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => {
                  const requests = db.travelRequests.filter(
                    (request) => request.studentId === student.id,
                  )
                  const rides = db.rideRequests.filter(
                    (request) => request.studentId === student.id,
                  )
                  const saved = db.savedJourneys.filter(
                    (journey) => journey.studentId === student.id,
                  )
                  return (
                    <tr key={student.id} className="align-top">
                      <td className="py-2.5">
                        <p className="text-xs font-semibold text-slate-800">{student.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{student.college}</p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {student.email}
                        <p className="text-[11px] text-slate-500">{student.phone || 'No phone'}</p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {getVillage(db, student.villageId)?.name ?? 'Unknown'}
                        <p className="text-[11px] text-slate-500">
                          {getStop(
                            db,
                            db.stops.find((stop) => stop.villageId === student.villageId)?.id,
                          )?.name ?? 'No stop'}
                        </p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {student.departurePreference}
                        <p className="text-[11px] text-slate-500">₹{student.budget} budget</p>
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600">
                        {requests.length} travel · {rides.length} EV
                        <p className="text-slate-500">{saved.length} saved</p>
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openStudent(student)}
                            aria-label={`Edit ${student.name}`}
                            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStudent(student)}
                            aria-label={`Delete ${student.name}`}
                            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent travel requests
          </h2>
          <Badge tone="neutral">Shared with pooling</Badge>
        </div>
        {db.travelRequests.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
            No travel requests recorded.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {db.travelRequests.slice(0, 8).map((request) => (
              <li
                key={request.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {db.students.find((student) => student.id === request.studentId)?.name ??
                      'Student'}{' '}
                    · {request.seats} seat{request.seats > 1 ? 's' : ''}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {getStop(db, request.originStopId)?.name} →{' '}
                    {getStop(db, request.destinationStopId)?.name} · {request.departAfter}
                  </p>
                </div>
                <StatusPill status={request.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Edit student' : 'Add student'}
        description="Profiles are stored in the shared ROUTENEX data store and appear in the student workspace immediately."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="student-form">
              Save student
            </Button>
          </>
        }
      >
        {editor && (
          <form id="student-form" onSubmit={saveStudent} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                value={editor.form.name}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, name: event.target.value } })
                }
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={editor.form.email}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, email: event.target.value } })
                }
                required
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
            <Field label="Home village">
              <Select
                value={editor.form.villageId}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, villageId: event.target.value } })
                }
              >
                {db.villages.map((village) => (
                  <option key={village.id} value={village.id}>
                    {village.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="College" className="sm:col-span-2">
              <Input
                value={editor.form.college}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, college: event.target.value } })
                }
                required
              />
            </Field>
            <Field label="Usual departure time">
              <Input
                type="time"
                value={editor.form.departurePreference}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    form: { ...editor.form, departurePreference: event.target.value },
                  })
                }
              />
            </Field>
            <Field label="Daily budget (₹)">
              <Input
                type="number"
                min="0"
                value={editor.form.budget}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, budget: event.target.value } })
                }
              />
            </Field>
            <Field label="Emergency contact" className="sm:col-span-2">
              <Input
                value={editor.form.emergencyContact}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    form: { ...editor.form, emergencyContact: event.target.value },
                  })
                }
              />
            </Field>
          </form>
        )}
      </Modal>
    </PortalPage>
  )
}
