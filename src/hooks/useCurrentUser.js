import { useAppData } from '@/context/AppDataContext'

export function useCurrentStudent() {
  const { db } = useAppData()
  return (
    db.students.find((student) => student.id === db.session?.studentId) ?? db.students[0] ?? null
  )
}

export function useCurrentProvider() {
  const { db } = useAppData()
  const evProviders = db.providers.filter((provider) => provider.type === 'ev')
  return (
    db.providers.find((provider) => provider.id === db.session?.providerId) ??
    evProviders[0] ??
    db.providers[0] ??
    null
  )
}
