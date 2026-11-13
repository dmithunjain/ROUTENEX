import { Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import PlannerPage from '@/pages/student/PlannerPage'
import PoolingPage from '@/pages/student/PoolingPage'
import EvPage from '@/pages/student/EvPage'
import SavedJourneysPage from '@/pages/student/SavedJourneysPage'
import AssistantPage from '@/pages/student/AssistantPage'
import ProviderPage from '@/pages/provider/ProviderPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminTransportPage from '@/pages/admin/AdminTransportPage'
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage'
import AdminProvidersPage from '@/pages/admin/AdminProvidersPage'
import AdminVehiclesPage from '@/pages/admin/AdminVehiclesPage'
import AdminRequestsPage from '@/pages/admin/AdminRequestsPage'
import RequireAuth from '@/routes/RequireAuth'
import { ROUTES } from '@/routes/paths'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<AuthPage />} />
        <Route path={ROUTES.register} element={<AuthPage />} />
        <Route path={ROUTES.privacy} element={<PrivacyPage />} />
        <Route path={ROUTES.terms} element={<TermsPage />} />

        <Route
          path={ROUTES.student}
          element={
            <RequireAuth role="student">
              <StudentDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.planner}
          element={
            <RequireAuth role="student">
              <PlannerPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.pooling}
          element={
            <RequireAuth role="student">
              <PoolingPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.ev}
          element={
            <RequireAuth role="student">
              <EvPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.saved}
          element={
            <RequireAuth role="student">
              <SavedJourneysPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.assistant}
          element={
            <RequireAuth role="student">
              <AssistantPage />
            </RequireAuth>
          }
        />

        <Route
          path={ROUTES.provider}
          element={
            <RequireAuth role="provider">
              <ProviderPage />
            </RequireAuth>
          }
        />

        <Route
          path={ROUTES.admin}
          element={
            <RequireAuth role="admin">
              <AdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.adminTransport}
          element={
            <RequireAuth role="admin">
              <AdminTransportPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.adminStudents}
          element={
            <RequireAuth role="admin">
              <AdminStudentsPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.adminProviders}
          element={
            <RequireAuth role="admin">
              <AdminProvidersPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.adminVehicles}
          element={
            <RequireAuth role="admin">
              <AdminVehiclesPage />
            </RequireAuth>
          }
        />
        <Route
          path={ROUTES.adminRequests}
          element={
            <RequireAuth role="admin">
              <AdminRequestsPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
