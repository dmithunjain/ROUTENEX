import { ROUTES } from '@/routes/paths'

export function studentTabs(pathname) {
  return [
    { label: 'Dashboard', to: ROUTES.student, active: pathname === ROUTES.student },
    { label: 'Journey planner', to: ROUTES.planner, active: pathname === ROUTES.planner },
    { label: 'Smart pooling', to: ROUTES.pooling, active: pathname === ROUTES.pooling },
    { label: 'EV rides', to: ROUTES.ev, active: pathname === ROUTES.ev },
    { label: 'Saved journeys', to: ROUTES.saved, active: pathname === ROUTES.saved },
    { label: 'AI assistant', to: ROUTES.assistant, active: pathname === ROUTES.assistant },
  ]
}

export function adminTabs(pathname) {
  return [
    { label: 'Overview', to: ROUTES.admin, active: pathname === ROUTES.admin },
    { label: 'Transport & routes', to: ROUTES.adminTransport, active: pathname === ROUTES.adminTransport },
    { label: 'Students', to: ROUTES.adminStudents, active: pathname === ROUTES.adminStudents },
    { label: 'Providers', to: ROUTES.adminProviders, active: pathname === ROUTES.adminProviders },
    { label: 'Vehicles', to: ROUTES.adminVehicles, active: pathname === ROUTES.adminVehicles },
    { label: 'Ride requests', to: ROUTES.adminRequests, active: pathname === ROUTES.adminRequests },
  ]
}
