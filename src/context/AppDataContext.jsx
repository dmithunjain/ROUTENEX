import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { createSeedData } from '@/data/seed'

const STORAGE_KEY = 'routenex.db.v3'
const AppDataContext = createContext(null)

function loadDb() {
  if (typeof window === 'undefined') return createSeedData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedData()
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 3) return createSeedData()
    const base = createSeedData()
    return { ...base, ...parsed }
  } catch {
    return createSeedData()
  }
}

export function makeId(prefix) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${random}${Date.now().toString(36).slice(-4)}`
}

export function AppDataProvider({ children }) {
  const [db, setDb] = useState(loadDb)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // Storage can be unavailable in private mode; the in-memory store still works.
    }
  }, [db])

  const setCollection = useCallback((key, updater) => {
    setDb((previous) => ({ ...previous, [key]: updater(previous[key] ?? []) }))
  }, [])

  const addItem = useCallback(
    (key, item) => {
      const record = { createdAt: new Date().toISOString(), ...item, id: item.id ?? makeId(key) }
      setCollection(key, (list) => [record, ...list])
      return record
    },
    [setCollection],
  )

  const updateItem = useCallback(
    (key, id, patch) => {
      setCollection(key, (list) =>
        list.map((item) =>
          item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
        ),
      )
    },
    [setCollection],
  )

  const removeItem = useCallback(
    (key, id) => setCollection(key, (list) => list.filter((item) => item.id !== id)),
    [setCollection],
  )

  const switchRole = useCallback((role) => {
    setDb((previous) => ({
      ...previous,
      session: {
        role,
        studentId: previous.session?.studentId ?? previous.students[0]?.id ?? null,
        providerId:
          previous.providers.find((provider) => provider.type === 'ev')?.id ??
          previous.providers[0]?.id ??
          null,
      },
    }))
  }, [])

  const setStudentProfile = useCallback(
    (studentId, patch) => {
      updateItem('students', studentId, patch)
      setDb((previous) => ({ ...previous, session: { ...previous.session, studentId } }))
    },
    [updateItem],
  )

  const actions = useMemo(
    () => ({
      addStudent: (student) => addItem('students', student),
      updateStudent: (id, patch) => updateItem('students', id, patch),
      deleteStudent: (id) =>
        setDb((previous) => ({
          ...previous,
          students: previous.students.filter((student) => student.id !== id),
          travelRequests: previous.travelRequests.filter((request) => request.studentId !== id),
          rideRequests: previous.rideRequests.filter((request) => request.studentId !== id),
          savedJourneys: previous.savedJourneys.filter((journey) => journey.studentId !== id),
        })),

      addProvider: (provider) => addItem('providers', provider),
      updateProvider: (id, patch) => updateItem('providers', id, patch),
      deleteProvider: (id) => removeItem('providers', id),
      verifyProvider: (id, verified) => updateItem('providers', id, { verified }),

      addVehicle: (vehicle) => addItem('vehicles', vehicle),
      updateVehicle: (id, patch) => updateItem('vehicles', id, patch),
      deleteVehicle: (id) => removeItem('vehicles', id),

      addStop: (stop) => addItem('stops', stop),
      updateStop: (id, patch) => updateItem('stops', id, patch),
      deleteStop: (id) => removeItem('stops', id),

      addRoute: (route) => addItem('routes', route),
      updateRoute: (id, patch) => updateItem('routes', id, patch),
      deleteRoute: (id) => removeItem('routes', id),

      addSchedule: (schedule) => addItem('schedules', schedule),
      updateSchedule: (id, patch) => updateItem('schedules', id, patch),
      deleteSchedule: (id) => removeItem('schedules', id),

      addTravelRequest: (request) => addItem('travelRequests', request),
      updateTravelRequest: (id, patch) => updateItem('travelRequests', id, patch),

      addPoolingGroup: (group) => addItem('poolingGroups', group),
      updatePoolingGroup: (id, patch) => updateItem('poolingGroups', id, patch),

      addRideRequest: (request) => addItem('rideRequests', request),
      updateRideRequest: (id, patch) => updateItem('rideRequests', id, patch),

      addSavedJourney: (journey) => addItem('savedJourneys', journey),
      deleteSavedJourney: (id) => removeItem('savedJourneys', id),

      setStudentProfile,
      switchRole,
      selectStudent: (studentId) =>
        setDb((previous) => ({ ...previous, session: { ...previous.session, studentId } })),
      selectProvider: (providerId) =>
        setDb((previous) => ({ ...previous, session: { ...previous.session, providerId } })),
      resetDemoData: () => {
        const fresh = createSeedData()
        setDb(fresh)
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
        } catch {
          // Ignore storage failures.
        }
      },
    }),
    [addItem, removeItem, setStudentProfile, switchRole, updateItem],
  )

  const value = useMemo(() => ({ db, ...actions }), [db, actions])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppDataProvider')
  return context
}
